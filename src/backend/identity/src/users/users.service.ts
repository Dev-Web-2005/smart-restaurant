import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entity/user';
import RegisterRequest from 'src/users/dtos/request/register-request';
import RegisterResponse from 'src/users/dtos/response/register-response';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {}

	async Register(data: RegisterRequest): Promise<RegisterResponse> {
		// Mock created user response
		const object = {
			userId: '123e4567-e89b-12d3-a456-426614174000',
			username: data.username,
			email: data.email,
		};
		await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
		return new RegisterResponse(object);
	}
}
