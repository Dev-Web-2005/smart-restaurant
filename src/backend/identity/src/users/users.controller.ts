import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from 'src/users/users.service';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import RegisterUserWithProfileRequestDto from 'src/users/dtos/request/register-user-with-profile-request.dto';
import { GetAllUsersRequestDto } from 'src/users/dtos/request/get-all-users-request.dto';
import { GetUserByIdRequestDto } from 'src/users/dtos/request/get-user-by-id-request.dto';

@Controller()
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('users:register')
	async registerUser(data: RegisterUserWithProfileRequestDto): Promise<HttpResponse> {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return new HttpResponse(
			200,
			'Register successful',
			await this.usersService.Register(data),
		);
	}

	@MessagePattern('users:get-all-users')
	async getAllUsers(data: GetAllUsersRequestDto): Promise<HttpResponse> {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return new HttpResponse(
			200,
			'Get all users successful',
			await this.usersService.getAllUsers(),
		);
	}

	@MessagePattern('users:get-user-by-id')
	async getUserById(data: GetUserByIdRequestDto): Promise<HttpResponse> {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return new HttpResponse(
			200,
			'Get user by id successful',
			await this.usersService.getUserById(data.userId),
		);
	}
}
