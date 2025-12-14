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
	@UseGuards(AuthGuard, Role('ADMIN'))
	createCategory(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('categories:create', {
			...data,
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/categories')
	@UseGuards(AuthGuard, Role('ADMIN'))
	getCategories(@Param('tenantId') tenantId: string) {
		return this.productClient.send('categories:get-all', {
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('categories/:categoryId')
	@UseGuards(AuthGuard, Role('ADMIN'))
	updateCategory(@Param('categoryId') categoryId: string, @Body() data: any) {
		return this.productClient.send('categories:update', {
			...data,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Post('categories/:categoryId/publish')
	@UseGuards(AuthGuard, Role('ADMIN'))
	publishCategory(@Param('categoryId') categoryId: string, @Body() data: any) {
		return this.productClient.send('categories:publish', {
			...data,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('categories/:categoryId')
	@UseGuards(AuthGuard, Role('ADMIN'))
	deleteCategory(@Param('categoryId') categoryId: string, @Body() data: any) {
		return this.productClient.send('categories:delete', {
			...data,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ MENU ITEMS ============

	@Post('tenants/:tenantId/items')
	@UseGuards(AuthGuard, Role('ADMIN'))
	createItem(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.productClient.send('items:create', {
			...data,
			tenantId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Get('tenants/:tenantId/items')
	@UseGuards(AuthGuard, Role('ADMIN'))
	getItems(
		@Param('tenantId') tenantId: string,
		@Query('categoryId') categoryId?: string,
	) {
		return this.productClient.send('items:get-all', {
			tenantId,
			categoryId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Patch('items/:itemId')
	@UseGuards(AuthGuard, Role('ADMIN'))
	updateItem(@Param('itemId') itemId: string, @Body() data: any) {
		return this.productClient.send('items:update', {
			...data,
			itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Post('items/:itemId/publish')
	@UseGuards(AuthGuard, Role('ADMIN'))
	publishItem(@Param('itemId') itemId: string, @Body() data: any) {
		return this.productClient.send('items:publish', {
			...data,
			itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Delete('items/:itemId')
	@UseGuards(AuthGuard, Role('ADMIN'))
	deleteItem(@Param('itemId') itemId: string, @Body() data: any) {
		return this.productClient.send('items:delete', {
			...data,
			itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	@Post('items/:itemId/modifiers')
	@UseGuards(AuthGuard, Role('ADMIN'))
	addModifiers(@Param('itemId') itemId: string, @Body() data: any) {
		return this.productClient.send('items:add-modifiers', {
			...data,
			itemId,
			productApiKey: this.configService.get('PRODUCT_API_KEY'),
		});
	}

	// ============ PUBLIC MENU ============

	@Get('public/menu/:tenantId')
	getPublicMenu(@Param('tenantId') tenantId: string) {
		return this.productClient.send('public:get-menu', {
			tenantId,
		});
	}
}
