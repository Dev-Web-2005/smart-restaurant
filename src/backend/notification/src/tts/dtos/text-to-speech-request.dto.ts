import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TextToSpeechRequestDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	text: string;

	notificationApiKey?: string;
}
