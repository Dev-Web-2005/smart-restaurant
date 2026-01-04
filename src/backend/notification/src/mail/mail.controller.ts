import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MailService } from 'src/mail/mail.service';
import SendMailRequestDto from 'src/mail/dtos/request/send-mail-request.dto';
import { ConfigService } from '@nestjs/config';

@Controller()
export class MailController {
	constructor(
		private readonly mailService: MailService,
		private readonly configService: ConfigService,
	) {}

	@EventPattern('mail.send')
	async handleSendMail(@Payload() data: SendMailRequestDto, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			const expectedKey = this.configService.get<string>('NOTIFICATION_API_KEY');
			const receivedKey = data.notificationApiKey;

			if (expectedKey && receivedKey !== expectedKey) {
				console.log('Invalid API key provided');
				channel.nack(message, false, false);
				return;
			}

			await this.mailService.sendMail(data);
			channel.ack(message);
			console.log('Mail sent successfully');
		} catch (error) {
			console.log('Error in handleSendMail:', error);
			const limit = parseInt(process.env.LIMIT_REQUEUE ?? '5', 10);
			const xDeath = message.properties.headers['x-death'];
			const death = xDeath ? xDeath[0]?.count : 0;

			if (death >= limit) {
				console.log(`Message exceeded retry limit (${death}/${limit}), sending to DLQ`);
				channel.nack(message, false, false);
			} else {
				console.log(`Requeuing message (${death}/${limit})`);
				channel.nack(message, false, true);
			}
		}
	}
}
