import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { menuItemStatusFromString, MenuItemStatus } from 'src/common/enums';

/**
 * DTO for updating menu item status
 *
 * Used to change item availability status:
 * - AVAILABLE: Item can be ordered
 * - UNAVAILABLE: Item cannot be ordered (temporarily or permanently)
 * - SOLD_OUT: Item is sold out for the day
 */
export class UpdateMenuItemStatusRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsNotEmpty()
	@IsIn(['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT', 'available', 'unavailable', 'sold_out'])
	@Transform(({ value }) => menuItemStatusFromString(value))
	status: MenuItemStatus;
}
