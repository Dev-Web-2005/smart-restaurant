import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { logger } from 'src/common/logger';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@EventPattern('waiter_dlq')
	handleDLQ(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		const xDeath = message.properties.headers['x-death'];
		const failureInfo = xDeath ? xDeath[0] : {};
		logger.error('Message dropped to DLQ - Failed permanently', {
			payload: data,
			failureDetails: {
				attempts: failureInfo.count || 0,
				originalQueue: failureInfo.queue || 'unknown',
				originalExchange: failureInfo.exchange || 'unknown',
				reason: failureInfo.reason || 'unknown',
				routingKeys: failureInfo['routing-keys'] || [],
				time: failureInfo.time ? new Date(failureInfo.time.value * 1000) : null,
			},
			messageProperties: {
				messageId: message.properties.messageId,
				timestamp: message.properties.timestamp,
				correlationId: message.properties.correlationId,
			},
			droppedAt: new Date().toISOString(),
		});
		channel.ack(message);
	}
}
