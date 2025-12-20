import { Controller, Get, Head } from '@nestjs/common';

/**
 * Health Check Controller
 * Route này không có prefix để Render có thể health check ở root /
 */
@Controller()
export class HealthController {
	@Get()
	@Head()
	healthCheck() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'smart-restaurant-api-gateway',
			uptime: process.uptime(),
		};
	}

	@Get('health')
	@Head('health')
	health() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'smart-restaurant-api-gateway',
			uptime: process.uptime(),
		};
	}
}
