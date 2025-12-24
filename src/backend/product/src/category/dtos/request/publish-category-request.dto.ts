import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoryStatus, categoryStatusFromString } from 'src/common/enums';

export class UpdateCategoryStatusRequestDto {
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsString({ message: 'Status must be a string' })
	@IsIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
		message: 'Status must be either ACTIVE or INACTIVE',
	})
	@Transform(({ value }) => categoryStatusFromString(value))
	status: CategoryStatus;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
