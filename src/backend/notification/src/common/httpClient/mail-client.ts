import { AppException } from '@shared/exceptions';
import axios from 'axios';
import { decodeBase64 } from 'src/utils';
import { SendMail } from 'src/common/httpClient/types';
import ErrorCode from '@shared/exceptions/error-code';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailClient {
	private readonly mailClient;
	private readonly mailSender: string;
	private readonly mailSenderName: string;

	constructor(private readonly configService: ConfigService) {
		const decode = decodeBase64;
		const MAIL_URL = decode(this.configService.get<string>('MAIL_URL'));
		const MAIL_API_KEY = decode(this.configService.get<string>('MAIL_API_KEY'));
		this.mailSender = decode(this.configService.get<string>('MAIL_SENDER'));
		this.mailSenderName = decode(this.configService.get<string>('MAIL_SENDER_NAME'));

		this.mailClient = axios.create({
			baseURL: MAIL_URL,
			headers: {
				'Content-Type': 'application/json',
				'api-key': MAIL_API_KEY,
			},
		});
	}

	async send(sendMail: SendMail) {
		const response = await this.mailClient.post('/email', {
			sender: {
				email: this.mailSender,
				name: this.mailSenderName,
			},
			to: [
				{
					email: sendMail.to.email,
					name: sendMail.to.name,
				},
			],
			subject: sendMail.subject,
			htmlContent: sendMail.content,
		});
		if (response.status !== 201) {
			throw new AppException(ErrorCode.SENDMAIL_FAILED);
		}
	}
}
