import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Request DTO for marking notification as viewed
 * Tracks when waiter first sees the notification
 */
export class MarkNotificationViewedRequestDto {
	@IsNotEmpty()
	@IsString()
	waiterApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	notificationId: string;

	@IsNotEmpty()
	@IsUUID()
	waiterId: string;
}
