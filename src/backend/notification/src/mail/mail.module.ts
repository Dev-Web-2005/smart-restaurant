import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailClient } from 'src/common/httpClient/mail-client';

@Module({
	providers: [MailService, MailClient],
	controllers: [MailController],
})
export class MailModule {}
