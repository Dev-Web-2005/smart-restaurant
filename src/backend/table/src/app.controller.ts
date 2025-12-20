import { Controller, Get, Head } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@Head()
	healthCheck(): { status: string; service: string; timestamp: string } {
		return {
			status: 'ok',
			service: 'table-service',
			timestamp: new Date().toISOString(),
		};
	}
}
