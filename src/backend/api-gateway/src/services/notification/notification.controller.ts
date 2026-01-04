import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';

class TextToSpeechDto {
	text: string;
}

@Controller('notification')
export class NotificationController {
	constructor(
		@Inject('NOTIFICATION_SERVICE')
		private readonly notificationClient: ClientProxy,
	) {}

	@Post('tts')
	@UseGuards(AuthGuard)
	async textToSpeech(@Body() body: TextToSpeechDto) {
		return firstValueFrom(
			this.notificationClient.send('tts:synthesize', {
				text: body.text,
				notificationApiKey: process.env.NOTIFICATION_API_KEY,
			}),
		);
	}
}
