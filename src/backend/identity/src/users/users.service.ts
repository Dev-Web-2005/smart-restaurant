import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user';
import RegisterResponse from 'src/users/dtos/response/register-user-response.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RolesService } from 'src/roles/roles.service';
import { AuthorityEnum, RoleEnum } from '@shared/utils/enum';
import { Role } from 'src/common/entities/role';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
import { GetUserResponseDto } from 'src/users/dtos/response/get-user-response.dto';
import RegisterUserResponseDto from 'src/users/dtos/response/register-user-response.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import RegisterUserWithProfileRequestDto from 'src/users/dtos/request/register-user-with-profile-request.dto';
import { extractFields } from '@shared/utils/utils';
import ChefAccountResponseDto from 'src/users/dtos/response/chef-account-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
	private readonly PROFILE_FIELDS = [
		'birthDay',
		'phoneNumber',
		'address',
		'restaurantName',
		'businessAddress',
		'contractNumber',
		'contractEmail',
		'cardHolderName',
		'accountNumber',
		'expirationDate',
		'cvv',
		'frontImage',
		'backImage',
	];

	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		private readonly rolesService: RolesService,
		@Inject('PROFILE_SERVICE') private readonly profileClient: ClientProxy,
	) {}

	async Register(
		data: RegisterUserWithProfileRequestDto,
	): Promise<RegisterUserResponseDto> {
		const isCustomer = data.isCustomer || false;
		const rolesString =
			data.roles ||
			(isCustomer ? [RoleEnum[RoleEnum.CUSTOMER]] : [RoleEnum[RoleEnum.USER]]);
		/*
		if (!rolesString.includes('USER')) {
			rolesString.push('USER');
		}
		*/
		const roles: Role[] = [];
		for (const role of rolesString) {
			const roleInt: number = RoleEnum[role as keyof typeof RoleEnum];
			const roleInRepo = await this.rolesService.getRoleById(roleInt);
			if (!roleInRepo) {
				throw new AppException(ErrorCode.ROLE_NOT_FOUND);
			}
			roles.push(roleInRepo);
		}

		const user = this.userRepository.create({
			username: data.username,
			email: data.email,
			password: await bcrypt.hash(data.password, 10),
			roles: roles,
		});
		try {
			const savedUser = await this.userRepository.save(user);
			const response = new RegisterResponse();
			response.userId = savedUser.userId;
			response.username = savedUser.username;
			response.email = savedUser.email;
			response.roles = savedUser.roles.map((role) => {
				const dto = new GetRoleResponseDto();
				dto.name = RoleEnum[role.name];
				dto.description = role.description;
				dto.authorities = role.authorities.map((authority) => {
					return new GetAuthorityResponseDto({
						name: AuthorityEnum[authority.name],
						description: authority.description,
					});
				});
				return dto;
			});
			if (rolesString.includes(RoleEnum[RoleEnum.USER])) {
				try {
					const profileData = {
						userId: savedUser.userId,
						profileApiKey: process.env.PROFILE_API_KEY,
						...extractFields(data, this.PROFILE_FIELDS),
					};

					const profile: any = await firstValueFrom(
						this.profileClient.send('profiles:modify-profile', profileData),
					);

					if (!profile || !profile.userId) {
						await this.userRepository.delete({ userId: savedUser.userId });
						throw new AppException(ErrorCode.PROFILE_SERVICE_ERROR);
					}
				} catch (err) {
					await this.userRepository.delete({ userId: savedUser.userId });
					if (err instanceof AppException) {
						throw err;
					}
					console.error('Error calling profile service:', err);
					throw new AppException(ErrorCode.PROFILE_SERVICE_ERROR);
				}

				const chefAccount = await this.generateChefAccount(savedUser.userId);
				response.chefAccount = chefAccount;
			}
			return response;
		} catch (err) {
			console.error('Error saving user:', err);
			throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
		}
	}

	async getAllUsers(): Promise<GetUserResponseDto[]> {
		const users = await this.userRepository.find({
			relations: ['roles', 'roles.authorities'],
		});
		return users.map((user) => {
			const dto = new GetUserResponseDto();
			dto.userId = user.userId;
			dto.username = user.username;
			dto.email = user.email;
			dto.roles = user.roles.map((role) => {
				const roleDto = new GetRoleResponseDto();
				roleDto.name = RoleEnum[role.name];
				roleDto.description = role.description;
				roleDto.authorities = role.authorities.map((authority) => {
					return new GetAuthorityResponseDto({
						name: AuthorityEnum[authority.name],
						description: authority.description,
					});
				});
				return roleDto;
			});
			return dto;
		});
	}

	async getUserById(userId: string): Promise<GetUserResponseDto | null> {
		const user = await this.userRepository.findOne({
			where: { userId },
			relations: ['roles', 'roles.authorities'],
		});
		if (!user) {
			return null;
		}
		const dto = new GetUserResponseDto();
		dto.userId = user.userId;
		dto.username = user.username;
		dto.email = user.email;
		dto.roles = user.roles.map((role) => {
			const roleDto = new GetRoleResponseDto();
			roleDto.name = RoleEnum[role.name];
			roleDto.description = role.description;
			roleDto.authorities = role.authorities.map((authority) => {
				return new GetAuthorityResponseDto({
					name: AuthorityEnum[authority.name],
					description: authority.description,
				});
			});
			return roleDto;
		});
		return dto;
	}
	async generateChefAccount(userId: string): Promise<ChefAccountResponseDto> {
		const username = `chef_${Math.random().toString(36).substring(2, 10)}`;
		const password = `${Math.random().toString(36).substring(2, 10)}`;
		const email = `${username}@created-by-ltc.com`;
		try {
			const chefRole = await this.rolesService.getRoleByName(RoleEnum[RoleEnum.CHEF]);
			if (!chefRole) {
				throw new AppException(ErrorCode.ROLE_NOT_FOUND);
			}

			const user = this.userRepository.create({
				username: username,
				email: email,
				ownerId: userId,
				password: await bcrypt.hash(password, 10),
				roles: [chefRole],
			});
			try {
				const createdUser = await this.userRepository.save(user);
				return plainToInstance(ChefAccountResponseDto, {
					username: createdUser.username,
					email: createdUser.email,
					password: password,
					ownerId: createdUser.ownerId,
				});
			} catch (err) {
				console.error('Error saving chef user:', err);
				throw new AppException(ErrorCode.CHEF_ACCOUNT_CREATION_FAILED);
			}
		} catch (err) {
			if (err instanceof AppException) {
				throw err;
			}
			console.error('Error generating chef account:', err);
			throw new AppException(ErrorCode.CHEF_ACCOUNT_CREATION_FAILED);
		}
	}
}
