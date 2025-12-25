/**
 * Response DTO for a single menu item photo
 */
export class MenuItemPhotoResponseDto {
	id: string;
	menuItemId: string;
	url: string;
	filename?: string;
	isPrimary: boolean;
	displayOrder: number;
	mimeType?: string;
	fileSize?: number;
	createdAt: Date;
}

/**
 * Response DTO for listing all photos of a menu item
 */
export class MenuItemPhotosListResponseDto {
	menuItemId: string;
	photos: MenuItemPhotoResponseDto[];
	primaryPhoto?: MenuItemPhotoResponseDto;
	totalPhotos: number;
}
