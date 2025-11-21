import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import RegisterRequest from 'src/users/dtos/request/register-request';
import { UsersService } from 'src/users/users.service';
import HttpResponse from 'src/utils/http-response';

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@MessagePattern('users:register')
	async registerUser(data: RegisterRequest): Promise<HttpResponse> {
		return new HttpResponse(
			200,
			'Register successful',
			await this.usersService.Register(data),
		);
	}
}
