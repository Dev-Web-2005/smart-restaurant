import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CategoryStatus } from 'src/common/enums';

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
	status: CategoryStatus | string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
