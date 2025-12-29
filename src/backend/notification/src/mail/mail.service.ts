import { Injectable } from '@nestjs/common';
import { SendMail } from 'src/common/httpClient/types';
import SendMailRequestDto from 'src/mail/dtos/request/send-mail-request.dto';
import { getTemplateString } from '../utils';
import { MailClient } from 'src/common/httpClient/mail-client';

@Injectable()
export class MailService {
	constructor(private readonly mailClient: MailClient) {}

	async sendMail(sendMailRequestDto: Omit<SendMailRequestDto, 'notificationApiKey'>) {
		const sendMail: SendMail = {
			to: {
				email: sendMailRequestDto.to.email,
				name: sendMailRequestDto.to.name,
			},
			subject: sendMailRequestDto.subject,
			content: getTemplateString(
				sendMailRequestDto.subject,
				sendMailRequestDto.variables,
			),
		};

		await this.mailClient.send(sendMail);
	}
}
