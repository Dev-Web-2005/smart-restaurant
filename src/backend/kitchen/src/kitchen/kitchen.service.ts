import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as amqp from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';
import {
	KitchenItem,
	KitchenItemHistory,
	KitchenItemStatus,
	KitchenItemStatusLabels,
} from '../common/entities';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

@Injectable()
export class KitchenService implements OnModuleDestroy {
	private readonly logger = new Logger(KitchenService.name);
	private amqpConnection: ChannelModel;
	private amqpChannel: Channel;

	constructor(
		@InjectRepository(KitchenItem)
		private readonly kitchenItemRepository: Repository<KitchenItem>,
		@InjectRepository(KitchenItemHistory)
		private readonly historyRepository: Repository<KitchenItemHistory>,
		private readonly configService: ConfigService,
		@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
	) {
		this.initializeRabbitMQ();
	}

	private async initializeRabbitMQ() {
		try {
			const amqpUrl = this.configService.get<string>('CONNECTION_AMQP');
			this.amqpConnection = await amqp.connect(amqpUrl);
			this.amqpChannel = await this.amqpConnection.createChannel();
			this.logger.log('✅ RabbitMQ channel initialized for Kitchen Service');
		} catch (error) {
			this.logger.error(`❌ Failed to initialize RabbitMQ: ${error.message}`);
		}
	}

	async onModuleDestroy() {
		try {
			if (this.amqpChannel) await this.amqpChannel.close();
			if (this.amqpConnection) await this.amqpConnection.close();
			this.logger.log('✅ RabbitMQ connection closed');
		} catch (error) {
			this.logger.error(`❌ Error closing RabbitMQ: ${error.message}`);
		}
	}

	private async publishToExchange(
		exchangeName: string,
		eventPattern: string,
		payload: any,
	): Promise<void> {
		try {
			if (!this.amqpChannel) {
				await this.initializeRabbitMQ();
			}

			const nestJsMessage = {
				pattern: eventPattern,
				data: payload,
			};

			const message = Buffer.from(JSON.stringify(nestJsMessage));
			const published = this.amqpChannel.publish(exchangeName, '', message, {
				persistent: true,
				contentType: 'application/json',
				headers: { pattern: eventPattern },
			});

			if (published) {
				this.logger.log(`✅ Published '${eventPattern}' to exchange '${exchangeName}'`);
			}
		} catch (error) {
			this.logger.error(`❌ Error publishing to exchange: ${error.message}`);
		}
	}

	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('KITCHEN_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.INVALID_KITCHEN_API_KEY);
		}
	}

	async handlePrepareItems(data: {
		kitchenApiKey: string;
		orderId: string;
		tableId: string;
		tenantId: string;
		waiterId: string;
		items: Array<{
			id: string;
			menuItemId: string;
			name: string;
			quantity: number;
			modifiers: any[];
			notes: string;
		}>;
	}): Promise<{ success: boolean; itemsCreated: number }> {
		this.validateApiKey(data.kitchenApiKey);

		this.logger.log(
			`📥 Receiving ${data.items.length} items for order ${data.orderId}, table ${data.tableId}`,
		);

		const kitchenItems: KitchenItem[] = [];
		const now = new Date();

		for (const item of data.items) {
			// Check if item already exists (avoid duplicates)
			const existing = await this.kitchenItemRepository.findOne({
				where: {
					tenantId: data.tenantId,
					orderItemId: item.id,
				},
			});

			if (existing) {
				this.logger.warn(
					`⚠️ Kitchen item for order item ${item.id} already exists, skipping`,
				);
				continue;
			}

			const kitchenItem = this.kitchenItemRepository.create({
				tenantId: data.tenantId,
				orderId: data.orderId,
				orderItemId: item.id,
				tableId: data.tableId,
				menuItemId: item.menuItemId,
				name: item.name,
				quantity: item.quantity,
				modifiers: item.modifiers || [],
				notes: item.notes,
				status: KitchenItemStatus.PENDING,
				receivedAt: now,
				estimatedPrepTime: 15,
			});

			kitchenItems.push(kitchenItem);
		}

		if (kitchenItems.length > 0) {
			await this.kitchenItemRepository.save(kitchenItems);

			for (const item of kitchenItems) {
				await this.historyRepository.save({
					kitchenItemId: item.id,
					tenantId: data.tenantId,
					previousStatus: null,
					newStatus: KitchenItemStatus.PENDING,
					changedBy: null,
					notes: 'Item received from waiter',
				});
			}

			this.logger.log(
				`✅ Created ${kitchenItems.length} kitchen items for order ${data.orderId}`,
			);
		}

		return {
			success: true,
			itemsCreated: kitchenItems.length,
		};
	}

	async getKitchenItems(data: {
		kitchenApiKey: string;
		tenantId: string;
		status?: string;
		page?: number;
		limit?: number;
	}): Promise<{
		items: any[];
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	}> {
		this.validateApiKey(data.kitchenApiKey);

		const page = data.page || 1;
		const limit = data.limit || 50;
		const skip = (page - 1) * limit;

		const queryBuilder = this.kitchenItemRepository
			.createQueryBuilder('item')
			.where('item.tenantId = :tenantId', { tenantId: data.tenantId });

		if (data.status) {
			const statusEnum =
				data.status === 'PENDING'
					? KitchenItemStatus.PENDING
					: data.status === 'PREPARING'
						? KitchenItemStatus.PREPARING
						: data.status === 'READY'
							? KitchenItemStatus.READY
							: null;

			if (statusEnum !== null) {
				queryBuilder.andWhere('item.status = :status', { status: statusEnum });
			}
		} else {
			queryBuilder.andWhere('item.status IN (:...statuses)', {
				statuses: [KitchenItemStatus.PENDING, KitchenItemStatus.PREPARING],
			});
		}

		queryBuilder
			.orderBy('item.priority', 'DESC')
			.addOrderBy('item.receivedAt', 'ASC')
			.skip(skip)
			.take(limit);

		const [items, total] = await queryBuilder.getManyAndCount();

		return {
			items: items.map((item) => this.mapToResponse(item)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async startPreparing(data: {
		kitchenApiKey: string;
		tenantId: string;
		kitchenItemId: string;
		chefId: string;
	}): Promise<any> {
		this.validateApiKey(data.kitchenApiKey);

		const item = await this.kitchenItemRepository.findOne({
			where: {
				id: data.kitchenItemId,
				tenantId: data.tenantId,
			},
		});

		if (!item) {
			throw new AppException(ErrorCode.KITCHEN_ITEM_NOT_FOUND);
		}

		if (item.status !== KitchenItemStatus.PENDING) {
			throw new AppException(ErrorCode.INVALID_KITCHEN_STATUS_TRANSITION);
		}

		const now = new Date();
		const previousStatus = item.status;

		item.status = KitchenItemStatus.PREPARING;
		item.startedAt = now;
		item.chefId = data.chefId;

		await this.kitchenItemRepository.save(item);

		await this.historyRepository.save({
			kitchenItemId: item.id,
			tenantId: data.tenantId,
			previousStatus,
			newStatus: KitchenItemStatus.PREPARING,
			changedBy: data.chefId,
			notes: 'Started preparing',
		});

		await this.updateOrderItemStatus(
			data.tenantId,
			item.orderId,
			item.orderItemId,
			'PREPARING',
			data.chefId,
		);

		this.logger.log(
			`🍳 Started preparing item ${item.name} (${item.id}) by chef ${data.chefId}`,
		);

		return this.mapToResponse(item);
	}

	async markReady(data: {
		kitchenApiKey: string;
		tenantId: string;
		kitchenItemId: string;
		chefId: string;
	}): Promise<any> {
		this.validateApiKey(data.kitchenApiKey);

		const item = await this.kitchenItemRepository.findOne({
			where: {
				id: data.kitchenItemId,
				tenantId: data.tenantId,
			},
		});

		if (!item) {
			throw new AppException(ErrorCode.KITCHEN_ITEM_NOT_FOUND);
		}

		if (item.status !== KitchenItemStatus.PREPARING) {
			throw new AppException(ErrorCode.INVALID_KITCHEN_STATUS_TRANSITION);
		}

		const now = new Date();
		const previousStatus = item.status;

		item.status = KitchenItemStatus.READY;
		item.completedAt = now;

		await this.kitchenItemRepository.save(item);

		await this.historyRepository.save({
			kitchenItemId: item.id,
			tenantId: data.tenantId,
			previousStatus,
			newStatus: KitchenItemStatus.READY,
			changedBy: data.chefId,
			notes: 'Marked as ready',
		});

		await this.updateOrderItemStatus(
			data.tenantId,
			item.orderId,
			item.orderItemId,
			'READY',
			data.chefId,
		);

		const prepTimeMs = item.completedAt.getTime() - item.startedAt.getTime();
		const prepTimeMinutes = Math.round(prepTimeMs / 60000);

		this.logger.log(
			`✅ Item ${item.name} (${item.id}) is READY! Prep time: ${prepTimeMinutes} minutes`,
		);

		return this.mapToResponse(item);
	}

	async batchStartPreparing(data: {
		kitchenApiKey: string;
		tenantId: string;
		kitchenItemIds: string[];
		chefId: string;
	}): Promise<{ success: boolean; updated: number }> {
		this.validateApiKey(data.kitchenApiKey);

		let updated = 0;

		for (const itemId of data.kitchenItemIds) {
			try {
				await this.startPreparing({
					kitchenApiKey: data.kitchenApiKey,
					tenantId: data.tenantId,
					kitchenItemId: itemId,
					chefId: data.chefId,
				});
				updated++;
			} catch (error) {
				this.logger.warn(`Failed to start preparing item ${itemId}: ${error.message}`);
			}
		}

		return { success: true, updated };
	}

	async batchMarkReady(data: {
		kitchenApiKey: string;
		tenantId: string;
		kitchenItemIds: string[];
		chefId: string;
	}): Promise<{ success: boolean; updated: number }> {
		this.validateApiKey(data.kitchenApiKey);

		let updated = 0;

		for (const itemId of data.kitchenItemIds) {
			try {
				await this.markReady({
					kitchenApiKey: data.kitchenApiKey,
					tenantId: data.tenantId,
					kitchenItemId: itemId,
					chefId: data.chefId,
				});
				updated++;
			} catch (error) {
				this.logger.warn(`Failed to mark ready item ${itemId}: ${error.message}`);
			}
		}

		return { success: true, updated };
	}

	async getKitchenStats(data: { kitchenApiKey: string; tenantId: string }): Promise<{
		pendingCount: number;
		preparingCount: number;
		readyCount: number;
		averagePrepTime: number;
		delayedCount: number;
	}> {
		this.validateApiKey(data.kitchenApiKey);

		const now = new Date();
		const defaultSlaMinutes = 15;

		const pendingCount = await this.kitchenItemRepository.count({
			where: { tenantId: data.tenantId, status: KitchenItemStatus.PENDING },
		});

		const preparingCount = await this.kitchenItemRepository.count({
			where: { tenantId: data.tenantId, status: KitchenItemStatus.PREPARING },
		});

		const readyCount = await this.kitchenItemRepository.count({
			where: { tenantId: data.tenantId, status: KitchenItemStatus.READY },
		});

		// Calculate delayed items (exceeding SLA)
		const preparingItems = await this.kitchenItemRepository.find({
			where: { tenantId: data.tenantId, status: KitchenItemStatus.PREPARING },
		});

		let delayedCount = 0;
		for (const item of preparingItems) {
			const elapsedMs = now.getTime() - item.startedAt.getTime();
			const elapsedMinutes = elapsedMs / 60000;
			if (elapsedMinutes > (item.estimatedPrepTime || defaultSlaMinutes)) {
				delayedCount++;
			}
		}

		// Calculate average prep time from completed items today
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const completedToday = await this.kitchenItemRepository.find({
			where: {
				tenantId: data.tenantId,
				status: KitchenItemStatus.READY,
			},
		});

		let totalPrepTime = 0;
		let completedCount = 0;

		for (const item of completedToday) {
			if (item.startedAt && item.completedAt) {
				const prepTimeMs = item.completedAt.getTime() - item.startedAt.getTime();
				totalPrepTime += prepTimeMs / 60000;
				completedCount++;
			}
		}

		const averagePrepTime =
			completedCount > 0 ? Math.round(totalPrepTime / completedCount) : 0;

		return {
			pendingCount,
			preparingCount,
			readyCount,
			averagePrepTime,
			delayedCount,
		};
	}

	async getHistory(data: {
		kitchenApiKey: string;
		tenantId: string;
		startDate?: string;
		endDate?: string;
		page?: number;
		limit?: number;
	}): Promise<any> {
		this.validateApiKey(data.kitchenApiKey);

		const page = data.page || 1;
		const limit = data.limit || 50;
		const skip = (page - 1) * limit;

		const queryBuilder = this.historyRepository
			.createQueryBuilder('history')
			.where('history.tenantId = :tenantId', { tenantId: data.tenantId });

		if (data.startDate) {
			queryBuilder.andWhere('history.createdAt >= :startDate', {
				startDate: new Date(data.startDate),
			});
		}

		if (data.endDate) {
			queryBuilder.andWhere('history.createdAt <= :endDate', {
				endDate: new Date(data.endDate),
			});
		}

		queryBuilder.orderBy('history.createdAt', 'DESC').skip(skip).take(limit);

		const [records, total] = await queryBuilder.getManyAndCount();

		return {
			records,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	private async updateOrderItemStatus(
		tenantId: string,
		orderId: string,
		orderItemId: string,
		status: string,
		chefId: string,
	): Promise<void> {
		try {
			const orderApiKey =
				this.configService.get<string>('ORDER_API_KEY') || 'lethanhcong';

			await firstValueFrom(
				this.orderClient.send('orders:update-items-status', {
					orderApiKey,
					tenantId,
					orderId,
					itemIds: [orderItemId],
					status,
					waiterId: chefId,
				}),
			);

			this.logger.log(`📤 Updated Order Service: item ${orderItemId} → ${status}`);
		} catch (error) {
			this.logger.error(`❌ Failed to update Order Service: ${error.message}`);
		}
	}

	private mapToResponse(item: KitchenItem): any {
		const now = new Date();
		let elapsedMinutes = 0;
		let remainingMinutes = 0;
		let isDelayed = false;

		if (item.status === KitchenItemStatus.PREPARING && item.startedAt) {
			const elapsedMs = now.getTime() - item.startedAt.getTime();
			elapsedMinutes = Math.round(elapsedMs / 60000);
			remainingMinutes = Math.max(0, item.estimatedPrepTime - elapsedMinutes);
			isDelayed = elapsedMinutes > item.estimatedPrepTime;
		} else if (item.status === KitchenItemStatus.PENDING && item.receivedAt) {
			const waitingMs = now.getTime() - item.receivedAt.getTime();
			elapsedMinutes = Math.round(waitingMs / 60000);
		}

		return {
			id: item.id,
			orderId: item.orderId,
			orderItemId: item.orderItemId,
			tableId: item.tableId,
			menuItemId: item.menuItemId,
			name: item.name,
			quantity: item.quantity,
			modifiers: item.modifiers,
			notes: item.notes,
			status: KitchenItemStatusLabels[item.status],
			priority: item.priority,
			receivedAt: item.receivedAt,
			startedAt: item.startedAt,
			completedAt: item.completedAt,
			estimatedPrepTime: item.estimatedPrepTime,
			chefId: item.chefId,

			elapsedMinutes,
			remainingMinutes,
			isDelayed,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
