import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { TtsModule } from './tts/tts.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MailModule,
		TtsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
