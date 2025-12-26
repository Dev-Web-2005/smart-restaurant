import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
	ModifierGroup,
	ModifierOption,
	MenuItem,
	MenuItemModifierGroup,
} from 'src/common/entities';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import {
	CreateModifierGroupRequestDto,
	GetModifierGroupsRequestDto,
	GetModifierGroupRequestDto,
	UpdateModifierGroupRequestDto,
	DeleteModifierGroupRequestDto,
	CreateModifierOptionRequestDto,
	GetModifierOptionsRequestDto,
	GetModifierOptionRequestDto,
	UpdateModifierOptionRequestDto,
	DeleteModifierOptionRequestDto,
	AttachModifierGroupsRequestDto,
	DetachModifierGroupRequestDto,
	GetMenuItemModifierGroupsRequestDto,
} from './dtos/request';
import {
	ModifierGroupResponseDto,
	ModifierOptionResponseDto,
	MenuItemModifierGroupResponseDto,
} from './dtos/response';

@Injectable()
export class ModifierService {
	constructor(
		@InjectRepository(ModifierGroup)
		private readonly modifierGroupRepository: Repository<ModifierGroup>,
		@InjectRepository(ModifierOption)
		private readonly modifierOptionRepository: Repository<ModifierOption>,
		@InjectRepository(MenuItem)
		private readonly menuItemRepository: Repository<MenuItem>,
		@InjectRepository(MenuItemModifierGroup)
		private readonly menuItemModifierGroupRepository: Repository<MenuItemModifierGroup>,
		private readonly configService: ConfigService,
	) {}

	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('PRODUCT_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	// ==================== MODIFIER GROUPS ====================

	async createModifierGroup(
		dto: CreateModifierGroupRequestDto,
	): Promise<ModifierGroupResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Check for duplicate name within tenant
		const existing = await this.modifierGroupRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				name: dto.name,
				deletedAt: IsNull(),
			},
		});

		if (existing) {
			throw new AppException(ErrorCode.DUPLICATE_MODIFIER_GROUP_NAME);
		}

		const group = this.modifierGroupRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			description: dto.description,
			displayOrder: dto.displayOrder ?? 0,
			isActive: dto.isActive ?? true,
		});

		const saved = await this.modifierGroupRepository.save(group);
		return this.toModifierGroupResponseDto(saved);
	}

	async getModifierGroups(
		dto: GetModifierGroupsRequestDto,
	): Promise<ModifierGroupResponseDto[]> {
		this.validateApiKey(dto.productApiKey);

		const queryBuilder = this.modifierGroupRepository
			.createQueryBuilder('group')
			.leftJoinAndSelect('group.options', 'options', 'options.deletedAt IS NULL')
			.where('group.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('group.deletedAt IS NULL');

		if (dto.isActive !== undefined) {
			queryBuilder.andWhere('group.isActive = :isActive', { isActive: dto.isActive });
		}

		if (dto.search) {
			queryBuilder.andWhere('group.name ILIKE :search', {
				search: `%${dto.search}%`,
			});
		}

		queryBuilder.orderBy('group.displayOrder', 'ASC');
		queryBuilder.addOrderBy('group.name', 'ASC');

		const groups = await queryBuilder.getMany();

		return groups.map((group) => this.toModifierGroupResponseDto(group, group.options));
	}

	async getModifierGroup(
		dto: GetModifierGroupRequestDto,
	): Promise<ModifierGroupResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
			relations: ['options'],
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		// Filter out soft-deleted options
		const activeOptions = group.options?.filter((opt) => !opt.deletedAt) || [];

		return this.toModifierGroupResponseDto(group, activeOptions);
	}

	async updateModifierGroup(
		dto: UpdateModifierGroupRequestDto,
	): Promise<ModifierGroupResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		// Check for duplicate name if updating name
		if (dto.name && dto.name !== group.name) {
			const duplicate = await this.modifierGroupRepository.findOne({
				where: {
					tenantId: dto.tenantId,
					name: dto.name,
					deletedAt: IsNull(),
				},
			});

			if (duplicate && duplicate.id !== group.id) {
				throw new AppException(ErrorCode.DUPLICATE_MODIFIER_GROUP_NAME);
			}
		}

		if (dto.name !== undefined) group.name = dto.name;
		if (dto.description !== undefined) group.description = dto.description;
		if (dto.displayOrder !== undefined) group.displayOrder = dto.displayOrder;
		if (dto.isActive !== undefined) group.isActive = dto.isActive;

		const updated = await this.modifierGroupRepository.save(group);
		return this.toModifierGroupResponseDto(updated);
	}

	async deleteModifierGroup(dto: DeleteModifierGroupRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		// Soft delete
		await this.modifierGroupRepository.softRemove(group);
	}

	// ==================== MODIFIER OPTIONS ====================

	async createModifierOption(
		dto: CreateModifierOptionRequestDto,
	): Promise<ModifierOptionResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate group exists and belongs to tenant
		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		const option = this.modifierOptionRepository.create({
			modifierGroupId: dto.modifierGroupId,
			label: dto.label,
			priceDelta: dto.priceDelta ?? 0,
			displayOrder: dto.displayOrder ?? 0,
			isActive: dto.isActive ?? true,
		});

		const saved = await this.modifierOptionRepository.save(option);
		return this.toModifierOptionResponseDto(saved);
	}

	async getModifierOptions(
		dto: GetModifierOptionsRequestDto,
	): Promise<ModifierOptionResponseDto[]> {
		this.validateApiKey(dto.productApiKey);

		// Validate group exists and belongs to tenant
		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		const queryBuilder = this.modifierOptionRepository
			.createQueryBuilder('option')
			.where('option.modifierGroupId = :modifierGroupId', {
				modifierGroupId: dto.modifierGroupId,
			})
			.andWhere('option.deletedAt IS NULL');

		if (dto.isActive !== undefined) {
			queryBuilder.andWhere('option.isActive = :isActive', { isActive: dto.isActive });
		}

		queryBuilder.orderBy('option.displayOrder', 'ASC');
		queryBuilder.addOrderBy('option.label', 'ASC');

		const options = await queryBuilder.getMany();

		return options.map((option) => this.toModifierOptionResponseDto(option));
	}

	async getModifierOption(
		dto: GetModifierOptionRequestDto,
	): Promise<ModifierOptionResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate group exists and belongs to tenant
		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		const option = await this.modifierOptionRepository.findOne({
			where: {
				id: dto.modifierOptionId,
				modifierGroupId: dto.modifierGroupId,
				deletedAt: IsNull(),
			},
		});

		if (!option) {
			throw new AppException(ErrorCode.MODIFIER_OPTION_NOT_FOUND);
		}

		return this.toModifierOptionResponseDto(option);
	}

	async updateModifierOption(
		dto: UpdateModifierOptionRequestDto,
	): Promise<ModifierOptionResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate group exists and belongs to tenant
		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		const option = await this.modifierOptionRepository.findOne({
			where: {
				id: dto.optionId,
				modifierGroupId: dto.modifierGroupId,
				deletedAt: IsNull(),
			},
		});

		if (!option) {
			throw new AppException(ErrorCode.MODIFIER_OPTION_NOT_FOUND);
		}

		if (dto.label !== undefined) option.label = dto.label;
		if (dto.priceDelta !== undefined) option.priceDelta = dto.priceDelta;
		if (dto.displayOrder !== undefined) option.displayOrder = dto.displayOrder;
		if (dto.isActive !== undefined) option.isActive = dto.isActive;

		const updated = await this.modifierOptionRepository.save(option);
		return this.toModifierOptionResponseDto(updated);
	}

	async deleteModifierOption(dto: DeleteModifierOptionRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		// Validate group exists and belongs to tenant
		const group = await this.modifierGroupRepository.findOne({
			where: {
				id: dto.modifierGroupId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!group) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
		}

		const option = await this.modifierOptionRepository.findOne({
			where: {
				id: dto.optionId,
				modifierGroupId: dto.modifierGroupId,
				deletedAt: IsNull(),
			},
		});

		if (!option) {
			throw new AppException(ErrorCode.MODIFIER_OPTION_NOT_FOUND);
		}

		// Soft delete
		await this.modifierOptionRepository.softRemove(option);
	}

	// ==================== MENU ITEM <-> MODIFIER GROUPS ====================

	async attachModifierGroups(
		dto: AttachModifierGroupsRequestDto,
	): Promise<MenuItemModifierGroupResponseDto[]> {
		this.validateApiKey(dto.productApiKey);

		// Validate menu item exists and belongs to tenant
		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.MENU_ITEM_NOT_FOUND);
		}

		const results: MenuItemModifierGroupResponseDto[] = [];

		for (const groupAttachment of dto.modifierGroups) {
			// Validate modifier group exists and belongs to tenant
			const modifierGroup = await this.modifierGroupRepository.findOne({
				where: {
					id: groupAttachment.modifierGroupId,
					tenantId: dto.tenantId,
					deletedAt: IsNull(),
				},
				relations: ['options'],
			});

			if (!modifierGroup) {
				throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_FOUND);
			}

			// Check if already attached
			const existing = await this.menuItemModifierGroupRepository.findOne({
				where: {
					menuItemId: dto.menuItemId,
					modifierGroupId: groupAttachment.modifierGroupId,
				},
			});

			if (existing) {
				// Update existing attachment
				existing.displayOrder = groupAttachment.displayOrder ?? existing.displayOrder;
				existing.isRequired = groupAttachment.isRequired ?? existing.isRequired;
				existing.minSelections = groupAttachment.minSelections ?? existing.minSelections;
				existing.maxSelections = groupAttachment.maxSelections ?? existing.maxSelections;

				const updated = await this.menuItemModifierGroupRepository.save(existing);
				results.push(this.toMenuItemModifierGroupResponseDto(updated, modifierGroup));
			} else {
				// Create new attachment
				const attachment = this.menuItemModifierGroupRepository.create({
					menuItemId: dto.menuItemId,
					modifierGroupId: groupAttachment.modifierGroupId,
					displayOrder: groupAttachment.displayOrder ?? 0,
					isRequired: groupAttachment.isRequired ?? false,
					minSelections: groupAttachment.minSelections ?? 0,
					maxSelections: groupAttachment.maxSelections ?? 1,
				});

				const saved = await this.menuItemModifierGroupRepository.save(attachment);
				results.push(this.toMenuItemModifierGroupResponseDto(saved, modifierGroup));
			}
		}

		return results;
	}

	async detachModifierGroup(dto: DetachModifierGroupRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		// Validate menu item exists and belongs to tenant
		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.MENU_ITEM_NOT_FOUND);
		}

		const attachment = await this.menuItemModifierGroupRepository.findOne({
			where: {
				menuItemId: dto.menuItemId,
				modifierGroupId: dto.modifierGroupId,
			},
		});

		if (!attachment) {
			throw new AppException(ErrorCode.MODIFIER_GROUP_NOT_ATTACHED);
		}

		await this.menuItemModifierGroupRepository.remove(attachment);
	}

	async getMenuItemModifierGroups(
		dto: GetMenuItemModifierGroupsRequestDto,
	): Promise<MenuItemModifierGroupResponseDto[]> {
		this.validateApiKey(dto.productApiKey);

		// Validate menu item exists and belongs to tenant
		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.MENU_ITEM_NOT_FOUND);
		}

		const attachments = await this.menuItemModifierGroupRepository.find({
			where: {
				menuItemId: dto.menuItemId,
			},
			relations: ['modifierGroup', 'modifierGroup.options'],
			order: {
				displayOrder: 'ASC',
			},
		});

		return attachments.map((attachment) =>
			this.toMenuItemModifierGroupResponseDto(attachment, attachment.modifierGroup),
		);
	}

	// ==================== HELPER METHODS ====================

	private toModifierGroupResponseDto(
		group: ModifierGroup,
		options?: ModifierOption[],
	): ModifierGroupResponseDto {
		return {
			id: group.id,
			tenantId: group.tenantId,
			name: group.name,
			description: group.description,
			displayOrder: group.displayOrder,
			isActive: group.isActive,
			options: options?.map((opt) => this.toModifierOptionResponseDto(opt)),
			createdAt: group.createdAt,
			updatedAt: group.updatedAt,
		};
	}

	private toModifierOptionResponseDto(option: ModifierOption): ModifierOptionResponseDto {
		return {
			id: option.id,
			modifierGroupId: option.modifierGroupId,
			label: option.label,
			priceDelta: Number(option.priceDelta),
			displayOrder: option.displayOrder,
			isActive: option.isActive,
			createdAt: option.createdAt,
			updatedAt: option.updatedAt,
		};
	}

	private toMenuItemModifierGroupResponseDto(
		attachment: MenuItemModifierGroup,
		group: ModifierGroup,
	): MenuItemModifierGroupResponseDto {
		return {
			id: attachment.id,
			menuItemId: attachment.menuItemId,
			modifierGroupId: attachment.modifierGroupId,
			modifierGroup: this.toModifierGroupResponseDto(group, group.options),
			displayOrder: attachment.displayOrder,
			isRequired: attachment.isRequired,
			minSelections: attachment.minSelections,
			maxSelections: attachment.maxSelections,
			createdAt: attachment.createdAt,
			updatedAt: attachment.updatedAt,
		};
	}
}
