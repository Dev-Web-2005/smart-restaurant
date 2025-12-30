import { Injectable } from '@nestjs/common';
import { SendMail } from 'src/common/httpClient/types';
import SendMailRequestDto from 'src/mail/dtos/request/send-mail-request.dto';
import { getTemplateString } from '../utils';
import { MailClient } from 'src/common/httpClient/mail-client';
import { getNameFile } from '../utils';
@Injectable()
export class MailService {
	constructor(private readonly mailClient: MailClient) {}

	async sendMail(sendMailRequestDto: Omit<SendMailRequestDto, 'notificationApiKey'>) {
		let variablesMap: Map<string, string>;
		if (sendMailRequestDto.variables instanceof Map) {
			variablesMap = sendMailRequestDto.variables;
		} else {
			variablesMap = new Map<string, string>();
			const variablesObj = sendMailRequestDto.variables as any;
			if (variablesObj && typeof variablesObj === 'object') {
				Object.keys(variablesObj).forEach((key) => {
					variablesMap.set(key, variablesObj[key]);
				});
			}
		}

		try {
			const templateFileName = getNameFile(sendMailRequestDto.subject);

			const sendMail: SendMail = {
				to: {
					email: sendMailRequestDto.to.email,
					name: sendMailRequestDto.to.name,
				},
				subject: sendMailRequestDto.subject,
				content: getTemplateString(templateFileName, variablesMap),
			};

			await this.mailClient.send(sendMail);
		} catch (error) {
			console.log('Error sending mail:', error);
			throw error;
		}
	}
}
