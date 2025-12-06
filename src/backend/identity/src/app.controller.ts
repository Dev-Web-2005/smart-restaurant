import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@MessagePattern('health-check')
	healthCheck(): string {
		return this.appService.healthCheck();
	}

	//TODO: Add more message patterns as needed for the identity service
}
