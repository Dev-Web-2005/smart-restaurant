import { Injectable } from '@nestjs/common';
import { TTSClient } from 'src/common/httpClient/text-to-speech';

@Injectable()
export class TtsService {
	constructor(private readonly ttsClient: TTSClient) {}

	async synthesize(text: string): Promise<Buffer> {
		return this.ttsClient.synthesizeSpeech(text);
	}
	async synthesizeToBase64(text: string): Promise<string> {
		return this.ttsClient.synthesizeSpeechToBase64(text);
	}
}
