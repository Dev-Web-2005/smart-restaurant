import { RateLimitMiddleware } from './rate-limit.middleware';

describe('RateLimitMiddleware', () => {
	it('should be defined', () => {
		expect(new RateLimitMiddleware()).toBeDefined();
	});
});
