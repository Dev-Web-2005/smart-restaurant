import { Controller, Logger } from '@nestjs/common';
import {
	MessagePattern,
	EventPattern,
	Payload,
	Ctx,
	RmqContext,
} from '@nestjs/microservices';
import { KitchenService } from './kitchen.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';

@Controller()
export class KitchenController {
	private readonly logger = new Logger(KitchenController.name);

	constructor(private readonly kitchenService: KitchenService) {}

	@EventPattern('kitchen.prepare_items')
	async handlePrepareItems(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`📥 Received kitchen.prepare_items for order ${data.orderId} with ${data.items?.length || 0} items`,
			);

			const result = await this.kitchenService.handlePrepareItems(data);

			this.logger.log(
				`✅ Created ${result.itemsCreated} kitchen items for order ${data.orderId}`,
			);

			// NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`❌ Failed to handle kitchen.prepare_items: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	@MessagePattern('kitchen:get-items')
	async getKitchenItems(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.getKitchenItems(data);
			return new HttpResponse(1000, 'Kitchen items retrieved successfully', result);
		});
	}

	@MessagePattern('kitchen:start-preparing')
	async startPreparing(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.startPreparing(data);
			return new HttpResponse(1000, 'Item started preparing', result);
		});
	}

	@MessagePattern('kitchen:mark-ready')
	async markReady(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.markReady(data);
			return new HttpResponse(1000, 'Item marked as ready', result);
		});
	}

	@MessagePattern('kitchen:batch-start-preparing')
	async batchStartPreparing(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.batchStartPreparing(data);
			return new HttpResponse(1000, `Started preparing ${result.updated} items`, result);
		});
	}

	@MessagePattern('kitchen:batch-mark-ready')
	async batchMarkReady(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.batchMarkReady(data);
			return new HttpResponse(1000, `Marked ${result.updated} items as ready`, result);
		});
	}

	@MessagePattern('kitchen:get-stats')
	async getKitchenStats(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.getKitchenStats(data);
			return new HttpResponse(1000, 'Kitchen stats retrieved successfully', result);
		});
	}

	@MessagePattern('kitchen:get-history')
	async getHistory(@Payload() data: any) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.getHistory(data);
			return new HttpResponse(1000, 'History retrieved successfully', result);
		});
	}
}
