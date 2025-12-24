import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsBoolean,
	IsNumber,
	Min,
	IsIn,
	Max,
} from 'class-validator';

/**
 * DTO for adding a new photo to a menu item
 *
 * Validation Rules:
 * - URL required (could be local path or cloud URL)
 * - File size validation (max 5MB = 5,242,880 bytes)
 * - MIME type validation (JPG, PNG, WebP only)
 */
export class AddMenuItemPhotoRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	url: string; // Full URL or path to uploaded file

	@IsOptional()
	@IsString()
	filename?: string; // Original filename for reference

	@IsOptional()
	@IsBoolean()
	isPrimary?: boolean; // Set as primary photo (will unset others)

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsIn(['image/jpeg', 'image/png', 'image/webp'])
	mimeType?: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(5242880, { message: 'File size cannot exceed 5MB (5,242,880 bytes)' })
	fileSize?: number;
}

/**
 * DTO for updating photo details (order, primary status)
 */
export class UpdateMenuItemPhotoRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	photoId: string;

	@IsOptional()
	@IsBoolean()
	isPrimary?: boolean;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;
}

/**
 * DTO for setting a photo as primary
 */
export class SetPrimaryPhotoRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	photoId: string;
}

/**
 * DTO for deleting a photo
 */
export class DeleteMenuItemPhotoRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	photoId: string;
}

/**
 * DTO for getting all photos of an item
 */
export class GetMenuItemPhotosRequestDto {
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
