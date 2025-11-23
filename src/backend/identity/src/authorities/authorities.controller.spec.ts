import { Test, TestingModule } from '@nestjs/testing';
import { AuthoritiesController } from './authorities.controller';

describe('AuthoritiesController', () => {
	let controller: AuthoritiesController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthoritiesController],
		}).compile();

		controller = module.get<AuthoritiesController>(AuthoritiesController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
