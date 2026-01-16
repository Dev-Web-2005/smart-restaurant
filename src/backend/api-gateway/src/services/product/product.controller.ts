import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import Role from 'src/common/guards/check-role/check-role.guard';

@Controller()
export class ProductController {
	constructor(
		@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	// ============ CATEGORIES ============

	@Post('tenants/:tenantId/categories')
	@UseGuards(AuthGuard, Role('USER'))
	createCategory(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('categories:create', {
			...data,
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/categories')
	// @UseGuards(AuthGuard, Role('USER'))
	getCategories(
		@Param('tenantId') tenantId: string,
		@Query('status') status?: string,
		@Query('search') search?: string,
		@Query('sortBy') sortBy?: string,
		@Query('sortOrder') sortOrder?: string,
	) {
		return this.productClient.send('categories:get-all', {
			tenantId,
			status, // Pass as string, will be transformed in DTO
			search,
			sortBy,
			sortOrder,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/categories/:categoryId')
	// @UseGuards(AuthGuard, Role('USER'))
	getCategory(
		@Param('tenantId') tenantId: string,
		@Param('categoryId') categoryId: string,
	) {
		return this.productClient.send('categories:get', {
			tenantId,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/categories/:categoryId')
	@UseGuards(AuthGuard, Role('USER'))
	updateCategory(
		@Param('tenantId') tenantId: string,
		@Param('categoryId') categoryId: string,
		@Body() data: any,
	) {
		return this.productClient.send('categories:update', {
			...data,
			tenantId,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/categories/:categoryId/status')
	@UseGuards(AuthGuard, Role('USER'))
	updateCategoryStatus(
		@Param('tenantId') tenantId: string,
		@Param('categoryId') categoryId: string,
		@Body() data: any,
	) {
		return this.productClient.send('categories:update-status', {
			...data,
			tenantId,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/categories/:categoryId')
	@UseGuards(AuthGuard, Role('USER'))
	deleteCategory(
		@Param('tenantId') tenantId: string,
		@Param('categoryId') categoryId: string,
		@Body() data: any,
	) {
		return this.productClient.send('categories:delete', {
			...data,
			tenantId,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MENU ITEMS ============

	@Post('tenants/:tenantId/items')
	@UseGuards(AuthGuard, Role('USER'))
	createItem(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('menu-items:create', {
			...data,
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/items')
	// @UseGuards(AuthGuard, Role('USER'))
	getItems(
		@Param('tenantId') tenantId: string,
		@Query('categoryId') categoryId?: string,
		@Query('status') status?: string,
		@Query('isChefRecommended') isChefRecommended?: boolean,
		@Query('search') search?: string,
		@Query('sortBy') sortBy?: string,
		@Query('sortOrder') sortOrder?: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.productClient.send('menu-items:get-all', {
			tenantId,
			categoryId,
			status,
			isChefRecommended,
			search,
			sortBy,
			sortOrder,
			page,
			limit,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/items/:itemId')
	// @UseGuards(AuthGuard, Role('USER'))
	getItem(@Param('tenantId') tenantId: string, @Param('itemId') itemId: string) {
		return this.productClient.send('menu-items:get', {
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/items/:itemId')
	@UseGuards(AuthGuard, Role('USER'))
	updateItem(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Body() data: any,
	) {
		return this.productClient.send('menu-items:update', {
			...data,
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/items/:itemId/status')
	@UseGuards(AuthGuard, Role('USER'))
	updateItemStatus(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Body() data: any,
	) {
		return this.productClient.send('menu-items:update-status', {
			...data,
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/items/:itemId')
	@UseGuards(AuthGuard, Role('USER'))
	deleteItem(@Param('tenantId') tenantId: string, @Param('itemId') itemId: string) {
		return this.productClient.send('menu-items:delete', {
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MENU ITEM PHOTOS ============

	@Post('tenants/:tenantId/items/:itemId/photos')
	@UseGuards(AuthGuard, Role('USER'))
	addMenuItemPhoto(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Body() data: any,
	) {
		return this.productClient.send('menu-item-photos:add', {
			...data,
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/items/:itemId/photos')
	// @UseGuards(AuthGuard, Role('USER'))
	getMenuItemPhotos(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
	) {
		return this.productClient.send('menu-item-photos:get-all', {
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/items/:itemId/photos/:photoId')
	@UseGuards(AuthGuard, Role('USER'))
	updateMenuItemPhoto(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Param('photoId') photoId: string,
		@Body() data: any,
	) {
		return this.productClient.send('menu-item-photos:update', {
			...data,
			tenantId,
			menuItemId: itemId,
			photoId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/items/:itemId/photos/:photoId/primary')
	@UseGuards(AuthGuard, Role('USER'))
	setPrimaryPhoto(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Param('photoId') photoId: string,
	) {
		return this.productClient.send('menu-item-photos:set-primary', {
			tenantId,
			menuItemId: itemId,
			photoId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/items/:itemId/photos/:photoId')
	@UseGuards(AuthGuard, Role('USER'))
	deleteMenuItemPhoto(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Param('photoId') photoId: string,
	) {
		return this.productClient.send('menu-item-photos:delete', {
			tenantId,
			menuItemId: itemId,
			photoId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MODIFIER GROUPS ============

	@Post('tenants/:tenantId/modifier-groups')
	@UseGuards(AuthGuard, Role('USER'))
	createModifierGroup(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('modifier-groups:create', {
			...data,
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/modifier-groups')
	@UseGuards(AuthGuard, Role('USER'))
	getModifierGroups(
		@Param('tenantId') tenantId: string,
		@Query('isActive') isActive?: boolean,
		@Query('search') search?: string,
	) {
		return this.productClient.send('modifier-groups:get-all', {
			tenantId,
			isActive,
			search,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/modifier-groups/:groupId')
	@UseGuards(AuthGuard, Role('USER'))
	getModifierGroup(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
	) {
		return this.productClient.send('modifier-groups:get', {
			tenantId,
			modifierGroupId: groupId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/modifier-groups/:groupId')
	@UseGuards(AuthGuard, Role('USER'))
	updateModifierGroup(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Body() data: any,
	) {
		return this.productClient.send('modifier-groups:update', {
			...data,
			tenantId,
			modifierGroupId: groupId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/modifier-groups/:groupId')
	@UseGuards(AuthGuard, Role('USER'))
	deleteModifierGroup(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
	) {
		return this.productClient.send('modifier-groups:delete', {
			tenantId,
			modifierGroupId: groupId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MODIFIER OPTIONS ============

	@Post('tenants/:tenantId/modifier-groups/:groupId/options')
	@UseGuards(AuthGuard, Role('USER'))
	createModifierOption(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Body() data: any,
	) {
		return this.productClient.send('modifier-options:create', {
			...data,
			tenantId,
			modifierGroupId: groupId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/modifier-groups/:groupId/options')
	@UseGuards(AuthGuard, Role('USER'))
	getModifierOptions(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Query('isActive') isActive?: boolean,
	) {
		return this.productClient.send('modifier-options:get-all', {
			tenantId,
			modifierGroupId: groupId,
			isActive,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/modifier-groups/:groupId/options/:optionId')
	@UseGuards(AuthGuard, Role('USER'))
	getModifierOption(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Param('optionId') optionId: string,
	) {
		return this.productClient.send('modifier-options:get', {
			tenantId,
			modifierGroupId: groupId,
			modifierOptionId: optionId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('tenants/:tenantId/modifier-groups/:groupId/options/:optionId')
	@UseGuards(AuthGuard, Role('USER'))
	updateModifierOption(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Param('optionId') optionId: string,
		@Body() data: any,
	) {
		return this.productClient.send('modifier-options:update', {
			...data,
			tenantId,
			modifierGroupId: groupId,
			optionId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/modifier-groups/:groupId/options/:optionId')
	@UseGuards(AuthGuard, Role('USER'))
	deleteModifierOption(
		@Param('tenantId') tenantId: string,
		@Param('groupId') groupId: string,
		@Param('optionId') optionId: string,
	) {
		return this.productClient.send('modifier-options:delete', {
			tenantId,
			modifierGroupId: groupId,
			optionId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MENU ITEM MODIFIERS ============

	@Post('tenants/:tenantId/items/:itemId/modifiers')
	@UseGuards(AuthGuard, Role('USER'))
	attachModifierGroups(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Body() data: any,
	) {
		return this.productClient.send('menu-item-modifiers:attach', {
			...data,
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/items/:itemId/modifiers')
	// @UseGuards(AuthGuard, Role('USER'))
	getMenuItemModifierGroups(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
	) {
		return this.productClient.send('menu-item-modifiers:get-all', {
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('tenants/:tenantId/items/:itemId/modifiers/:groupId')
	@UseGuards(AuthGuard, Role('USER'))
	detachModifierGroup(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Param('groupId') groupId: string,
	) {
		return this.productClient.send('menu-item-modifiers:detach', {
			tenantId,
			menuItemId: itemId,
			modifierGroupId: groupId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ PUBLIC MENU ============

	@Get('public/menu/:tenantId')
	getPublicMenu(
		@Param('tenantId') tenantId: string,
		@Query('categoryId') categoryId?: string,
		@Query('search') search?: string,
		@Query('isChefRecommended') isChefRecommended?: boolean,
		@Query('sortBy') sortBy?: string,
		@Query('sortOrder') sortOrder?: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.productClient.send('public:get-menu', {
			tenantId,
			categoryId,
			search,
			isChefRecommended,
			sortBy,
			sortOrder,
			page,
			limit,
		});
	}

	// ============ POPULARITY / ANALYTICS ============

	/**
	 * Get popular menu items (sorted by order count)
	 * GET /tenants/:tenantId/items/popular
	 *
	 * Query params:
	 * - limit: number (default: 10, max: 100)
	 * - categoryId: uuid (optional - filter by category)
	 *
	 * Returns items sorted by orderCount descending
	 * Use for: Homepage highlights, recommendations, trending items
	 */
	@Get('tenants/:tenantId/items/popular')
	getPopularItems(
		@Param('tenantId') tenantId: string,
		@Query('limit') limit?: number,
		@Query('categoryId') categoryId?: string,
	) {
		return this.productClient.send('menu-items:get-popular', {
			tenantId,
			limit,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	/**
	 * Increment order count for menu items
	 * POST /tenants/:tenantId/items/increment-order-count
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2", ...]
	 * }
	 *
	 * This is called by Order Service (internal use)
	 * Can also be triggered manually for testing/analytics
	 */
	@Post('tenants/:tenantId/items/increment-order-count')
	@UseGuards(AuthGuard, Role('USER', 'STAFF'))
	incrementOrderCount(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('menu-items:increment-order-count', {
			tenantId,
			itemIds: data.itemIds,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ REVIEWS ============

	/**
	 * Create a review for a menu item
	 * POST /tenants/:tenantId/items/:itemId/reviews
	 *
	 * Body:
	 * {
	 *   "rating": 5,
	 *   "comment": "Great dish!"
	 * }
	 *
	 * Requires authentication - userId and userName extracted from JWT
	 */
	@Post('tenants/:tenantId/items/:itemId/reviews')
	@UseGuards(AuthGuard, Role('USER'))
	createReview(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Body() data: any,
	) {
		return this.productClient.send('reviews:create', {
			...data,
			tenantId,
			menuItemId: itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	/**
	 * Get reviews for a menu item
	 * GET /tenants/:tenantId/items/:itemId/reviews
	 *
	 * Query params:
	 * - page: number (default: 1)
	 * - limit: number (default: 10)
	 *
	 * Returns paginated reviews with average rating
	 * Public endpoint - no authentication required
	 */
	@Get('tenants/:tenantId/items/:itemId/reviews')
	getReviews(
		@Param('tenantId') tenantId: string,
		@Param('itemId') itemId: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.productClient.send('reviews:get-all', {
			tenantId,
			menuItemId: itemId,
			page,
			limit,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}
}
