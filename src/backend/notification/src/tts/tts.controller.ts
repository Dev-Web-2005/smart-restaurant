import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TtsService } from './tts.service';
import { TextToSpeechRequestDto } from './dtos/text-to-speech-request.dto';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import { HttpResponse } from '@shared/utils';
import { AppException, ErrorCode } from '@shared/exceptions';

@Controller()
export class TtsController {
	constructor(
		private readonly ttsService: TtsService,
		private readonly configService: ConfigService,
	) {}
	@MessagePattern('tts:synthesize')
	async synthesize(@Payload() data: TextToSpeechRequestDto) {
		return handleRpcCall(async () => {
			// Validate API key
			const expectedKey = this.configService.get<string>('NOTIFICATION_API_KEY');
			const receivedKey = data.notificationApiKey;

			if (expectedKey && receivedKey !== expectedKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}

			const base64Audio = await this.ttsService.synthesizeToBase64(data.text);

			return new HttpResponse(200, 'Text converted to speech successfully', {
				audio: base64Audio,
				mimeType: 'audio/mpeg',
			});
		});
	}
}
