import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import axios from 'axios';

@Injectable()
export class TTSClient {
	private readonly TEXT_TO_SPEECH_API_URL =
		'https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17';
	private ttsClient = null;
	constructor(private readonly configService: ConfigService) {
		this.ttsClient = axios.create({
			baseURL: this.TEXT_TO_SPEECH_API_URL,
			headers: {
				'xi-api-key': this.configService.get<string>('TTS_API_KEY') || '',
			},
			maxRedirects: 0,
			httpsAgent: new (require('https').Agent)({
				rejectUnauthorized: true,
			}),
		});
	}

	public synthesizeSpeech(text: string): Promise<Buffer> {
		return this.ttsClient
			.post('/', { text }, { responseType: 'arraybuffer' })
			.then((response) => Buffer.from(response.data));
	}
	public synthesizeSpeechToBase64(text: string): Promise<string> {
		return this.ttsClient
			.post('/', { text }, { responseType: 'arraybuffer' })
			.then((response) => {
				const buffer = Buffer.from(response.data);
				return buffer.toString('base64');
			});
	}
}
