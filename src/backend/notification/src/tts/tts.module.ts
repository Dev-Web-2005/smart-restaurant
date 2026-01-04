import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { TTSClient } from 'src/common/httpClient/text-to-speech';

@Module({
	providers: [TtsService, TTSClient],
	controllers: [TtsController],
	exports: [TtsService],
})
export class TtsModule {}
