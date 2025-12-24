import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for soft deleting a menu item
 *
 * Soft delete is recommended to preserve order history
 */
export class DeleteMenuItemRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;
}
