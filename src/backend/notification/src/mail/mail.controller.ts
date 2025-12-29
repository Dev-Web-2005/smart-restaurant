import { HttpResponse } from '@shared/utils';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MailService } from 'src/mail/mail.service';
import SendMailRequestDto from 'src/mail/dtos/request/send-mail-request.dto';
import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '@shared/exceptions';
import { wrapHandleMessage } from 'src/utils';

@Controller()
export class MailController {
	constructor(
		private readonly mailService: MailService,
		private readonly configService: ConfigService,
	) {}

	@EventPattern('mail.send')
	async handleSendMail(@Payload() data: SendMailRequestDto, @Ctx() context: RmqContext) {
		return handleRpcCall(async () => {
			const expectedKey = this.configService.get<string>('NOTIFICATION_API_KEY');
			const receivedKey = data.notificationApiKey;
			if (expectedKey && receivedKey !== expectedKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			const channel = context.getChannelRef();
			const message = context.getMessage();

			await wrapHandleMessage<void>(channel, message, async () => {
				return await this.mailService.sendMail(data);
			});

			return new HttpResponse(200, 'Mail sent successfully', null);
		});
	}
}
