import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user';
import RegisterResponse from 'src/users/dtos/response/register-user-response.dto';
import { Repository, In } from 'typeorm';
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
import { firstValueFrom } from 'rxjs';
import RegisterUserWithProfileRequestDto from 'src/users/dtos/request/register-user-with-profile-request.dto';
import { extractFields } from '@shared/utils/utils';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RestaurantQrResponseDto } from './dtos/response/restaurant-qr-response.dto';
import { ValidateRestaurantQrResponseDto } from './dtos/response/validate-restaurant-qr-response.dto';
import { PaginatedUsersResponseDto } from './dtos/response/paginated-users-response.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

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
		@Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly configService: ConfigService,
	) {}

	async Register(
		data: RegisterUserWithProfileRequestDto,
	): Promise<RegisterUserResponseDto> {
		const rolesString = data.roles || ['USER'];
		if (!rolesString.includes('USER')) {
			rolesString.push('USER');
		}
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
			ownerId: null,
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

			const subject = rolesString.includes('CUSTOMER')
				? 'Welcome to Smart Restaurant - Customer'
				: 'Welcome to Smart Restaurant';
			const variables = new Map<string, string>();
			variables.set('NAME', savedUser.username);

			const variablesObject: Record<string, string> = {};
			variables.forEach((value, key) => {
				variablesObject[key] = value;
			});

			const notificationApiKey = this.configService.get<string>('NOTIFICATION_API_KEY');
			const notificationRequest = {
				to: {
					email: savedUser.email,
					name: savedUser.username,
				},
				subject,
				variables: variablesObject,
				notificationApiKey: notificationApiKey,
			};
			try {
				this.notificationClient.emit('mail.send', notificationRequest);
			} catch (emitError) {
				console.error('Error emitting notification event:', emitError);
				throw new AppException(ErrorCode.NOTIFICATION_SERVICE_ERROR);
			}

			return response;
		} catch (err) {
			console.error('Error saving user:', err);
			throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
		}
	}

	async RegisterCustomer(
		data: RegisterUserWithProfileRequestDto,
		ownerId: string,
	): Promise<RegisterUserResponseDto> {
		const owner = await this.userRepository.findOne({
			where: { userId: ownerId },
			relations: ['roles'],
		});

		if (!owner) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		const hasUserRole = owner.roles.some(
			(role) => role.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}
		const uniqueUsername = `${data.username}_${ownerId}`;

		const roles: Role[] = [];
		const roleInt = RoleEnum.CUSTOMER;
		const roleInRepo = await this.rolesService.getRoleById(roleInt);
		if (!roleInRepo) {
			throw new AppException(ErrorCode.ROLE_NOT_FOUND);
		}
		roles.push(roleInRepo);

		const user = this.userRepository.create({
			username: uniqueUsername,
			email: data.email,
			password: await bcrypt.hash(data.password, 10),
			roles: roles,
			ownerId: ownerId,
		});

		try {
			const savedUser = await this.userRepository.save(user);
			const response = new RegisterResponse();
			response.userId = savedUser.userId;
			response.username = data.username;
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

			if (savedUser.email) {
				const variables = new Map<string, string>();
				variables.set('NAME', data.username);

				const variablesObject: Record<string, string> = {};
				variables.forEach((value, key) => {
					variablesObject[key] = value;
				});

				const notificationApiKey = this.configService.get<string>('NOTIFICATION_API_KEY');
				const notificationRequest = {
					to: {
						email: savedUser.email,
						name: data.username,
					},
					subject: 'Welcome to Smart Restaurant - Customer',
					variables: variablesObject,
					notificationApiKey: notificationApiKey,
				};
				try {
					this.notificationClient.emit('mail.send', notificationRequest);
				} catch (emitError) {
					console.error('Error emitting notification event:', emitError);
				}
			}

			return response;
		} catch (err) {
			console.error('Error saving customer:', err);
			throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
		}
	}

	async generateStaffOrChef(
		ownerId: string,
		role: 'STAFF' | 'CHEF',
	): Promise<{ username: string; password: string; userId: string; role: string }> {
		const owner = await this.userRepository.findOne({
			where: { userId: ownerId },
			relations: ['roles'],
		});

		if (!owner) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		const hasUserRole = owner.roles.some(
			(r) => r.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		const randomSuffix = crypto.randomBytes(4).toString('hex');
		const baseUsername = role.toLowerCase();
		const generatedUsername = `${baseUsername}_${randomSuffix}_${ownerId}`;
		const generatedPassword = crypto.randomBytes(8).toString('hex');

		const roles: Role[] = [];
		const roleInt = role === 'STAFF' ? RoleEnum.STAFF : RoleEnum.CHEF;
		const roleInRepo = await this.rolesService.getRoleById(roleInt);
		if (!roleInRepo) {
			throw new AppException(ErrorCode.ROLE_NOT_FOUND);
		}
		roles.push(roleInRepo);

		const user = this.userRepository.create({
			username: generatedUsername,
			email: null,
			password: await bcrypt.hash(generatedPassword, 10),
			roles: roles,
			ownerId: ownerId,
		});

		try {
			const savedUser = await this.userRepository.save(user);

			try {
				const profileData = {
					userId: savedUser.userId,
					profileApiKey: process.env.PROFILE_API_KEY,
				};

				await firstValueFrom(
					this.profileClient.send('profiles:modify-profile', profileData),
				);
			} catch (err) {
				console.error('Error creating profile for staff/chef:', err);
			}

			return {
				userId: savedUser.userId,
				username: `${baseUsername}_${randomSuffix}`,
				password: generatedPassword,
				role: role,
			};
		} catch (err) {
			console.error('Error generating staff/chef account:', err);
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

	/**
	 * Generate or regenerate restaurant QR code with token
	 * Invalidates old token by incrementing version
	 */
	async generateRestaurantQr(userId: string): Promise<RestaurantQrResponseDto> {
		const user = await this.userRepository.findOne({
			where: { userId },
			relations: ['roles'],
		});

		if (!user) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		// Check if user has USER role (restaurant owner)
		const hasUserRole = user.roles.some(
			(role) => role.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Generate new token
		const token = crypto.randomBytes(32).toString('hex');

		// Increment version to invalidate old QR codes
		user.restaurantQrToken = token;
		user.restaurantQrVersion = (user.restaurantQrVersion || 0) + 1;
		user.restaurantQrGeneratedAt = new Date();

		try {
			await this.userRepository.save(user);
		} catch (error) {
			console.error('Error saving restaurant QR to database:', error);
			throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
		}

		// Construct URL
		const baseUrl =
			this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
		const url = `${baseUrl}/restaurant/${userId}/${token}`;

		const response = new RestaurantQrResponseDto();
		response.qrUrl = url;
		response.token = token;
		response.version = user.restaurantQrVersion;
		response.generatedAt = user.restaurantQrGeneratedAt;
		response.ownerId = user.userId;
		response.ownerUsername = user.username;

		return response;
	}

	/**
	 * Validate restaurant QR token
	 * Checks if token matches and is not invalidated
	 */
	async validateRestaurantQr(
		ownerId: string,
		token: string,
	): Promise<ValidateRestaurantQrResponseDto> {
		const user = await this.userRepository.findOne({
			where: { userId: ownerId },
		});

		const response = new ValidateRestaurantQrResponseDto();

		if (!user) {
			response.valid = false;
			response.message = 'Restaurant not found';
			return response;
		}

		if (!user.restaurantQrToken) {
			response.valid = false;
			response.message = 'No QR code generated for this restaurant';
			return response;
		}

		if (user.restaurantQrToken !== token) {
			response.valid = false;
			response.message = 'Invalid or expired QR code';
			return response;
		}

		response.valid = true;
		response.ownerId = user.userId;
		response.ownerUsername = user.username;
		response.qrVersion = user.restaurantQrVersion;
		response.message = 'Valid QR code';

		return response;
	}

	/**
	 * Get current restaurant QR info without regenerating
	 */
	async getRestaurantQr(userId: string): Promise<RestaurantQrResponseDto | null> {
		const user = await this.userRepository.findOne({
			where: { userId },
			relations: ['roles'],
		});

		if (!user) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		// Check if user has USER role
		const hasUserRole = user.roles.some(
			(role) => role.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// If no QR exists, generate one automatically
		if (!user.restaurantQrToken) {
			console.log(`No QR found for user ${userId}, auto-generating...`);
			return await this.generateRestaurantQr(userId);
		}

		const baseUrl =
			this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
		const url = `${baseUrl}/restaurant/${userId}/${user.restaurantQrToken}`;

		const response = new RestaurantQrResponseDto();
		response.qrUrl = url;
		response.token = user.restaurantQrToken;
		response.version = user.restaurantQrVersion || 0;
		response.generatedAt = user.restaurantQrGeneratedAt;
		response.ownerId = user.userId;
		response.ownerUsername = user.username;

		return response;
	}

	async toggleUserStatus(
		ownerId: string,
		targetUserId: string,
		isActive: boolean,
	): Promise<{ userId: string; isActive: boolean }> {
		// Verify owner exists and has USER role
		const owner = await this.userRepository.findOne({
			where: { userId: ownerId },
			relations: ['roles'],
		});

		if (!owner) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		const hasUserRole = owner.roles.some(
			(role) => role.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Find target user
		const targetUser = await this.userRepository.findOne({
			where: { userId: targetUserId },
			relations: ['roles'],
		});

		if (!targetUser) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		// Verify target user belongs to owner
		if (targetUser.ownerId !== ownerId) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Verify target is STAFF or CHEF
		const isStaffOrChef = targetUser.roles.some(
			(role) =>
				role.name.toString() === RoleEnum.STAFF.toString() ||
				role.name.toString() === RoleEnum.CHEF.toString(),
		);

		if (!isStaffOrChef) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		targetUser.isActive = isActive;
		await this.userRepository.save(targetUser);

		return {
			userId: targetUser.userId,
			isActive: targetUser.isActive,
		};
	}

	async hardDeleteUser(
		ownerId: string,
		targetUserId: string,
	): Promise<{ deleted: boolean }> {
		// Verify owner exists and has USER role
		const owner = await this.userRepository.findOne({
			where: { userId: ownerId },
			relations: ['roles'],
		});

		if (!owner) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		const hasUserRole = owner.roles.some(
			(role) => role.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Find target user
		const targetUser = await this.userRepository.findOne({
			where: { userId: targetUserId },
			relations: ['roles'],
		});

		if (!targetUser) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		// Verify target user belongs to owner
		if (targetUser.ownerId !== ownerId) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Verify target is STAFF or CHEF (cannot delete USER/owner accounts)
		const isStaffOrChef = targetUser.roles.some(
			(role) =>
				role.name.toString() === RoleEnum.STAFF.toString() ||
				role.name.toString() === RoleEnum.CHEF.toString(),
		);

		if (!isStaffOrChef) {
			throw new AppException(ErrorCode.CANNOT_DELETE_OWNER);
		}

		// Delete profile first
		try {
			await firstValueFrom(
				this.profileClient.send('profiles:delete-profile', {
					userId: targetUserId,
					profileApiKey: process.env.PROFILE_API_KEY,
				}),
			);
		} catch (err) {
			console.error('Error deleting profile:', err);
			// Continue with user deletion even if profile deletion fails
		}

		await this.userRepository.delete({ userId: targetUserId });

		return { deleted: true };
	}

	async getStaffChefByOwner(
		ownerId: string,
		role?: 'STAFF' | 'CHEF',
		page: number = 1,
		limit: number = 10,
		isActive?: boolean,
	): Promise<PaginatedUsersResponseDto> {
		// Verify owner exists
		const owner = await this.userRepository.findOne({
			where: { userId: ownerId },
			relations: ['roles'],
		});

		if (!owner) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		const hasUserRole = owner.roles.some(
			(r) => r.name.toString() === RoleEnum.USER.toString(),
		);
		if (!hasUserRole) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Build query
		const queryBuilder = this.userRepository
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.roles', 'role')
			.leftJoinAndSelect('role.authorities', 'authority')
			.where('user.ownerId = :ownerId', { ownerId });

		// Filter by role if specified
		if (role) {
			const roleInt = role === 'STAFF' ? RoleEnum.STAFF : RoleEnum.CHEF;
			queryBuilder.andWhere('role.name = :roleName', { roleName: roleInt });
		} else {
			// Get both STAFF and CHEF
			queryBuilder.andWhere('role.name IN (:...roleNames)', {
				roleNames: [RoleEnum.STAFF, RoleEnum.CHEF],
			});
		}

		// Filter by isActive if specified
		if (isActive !== undefined) {
			queryBuilder.andWhere('user.isActive = :isActive', { isActive });
		}

		// Get total count
		const total = await queryBuilder.getCount();

		// Apply pagination
		const skip = (page - 1) * limit;
		queryBuilder.skip(skip).take(limit);

		// Order by creation (latest first)
		queryBuilder.orderBy('user.userId', 'DESC');

		const users = await queryBuilder.getMany();

		// Map to response DTOs
		const data = users.map((user) => {
			const dto = new GetUserResponseDto();
			dto.userId = user.userId;
			// Extract display username (remove ownerId suffix)
			const usernameParts = user.username.split('_');
			if (usernameParts.length >= 2) {
				dto.username = usernameParts.slice(0, -1).join('_');
			} else {
				dto.username = user.username;
			}
			dto.email = user.email;
			dto.isActive = user.isActive;
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

		const response = new PaginatedUsersResponseDto();
		response.data = data;
		response.total = total;
		response.page = page;
		response.limit = limit;
		response.totalPages = Math.ceil(total / limit);

		return response;
	}

	async sendVerificationEmail(userId: string): Promise<{ sent: boolean }> {
		const user = await this.userRepository.findOne({
			where: { userId },
		});

		if (!user) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		if (!user.email) {
			throw new AppException(ErrorCode.USER_NO_EMAIL);
		}

		if (user.isEmailVerified) {
			throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
		}

		// Generate 6-digit code
		const code = Math.floor(100000 + Math.random() * 900000).toString();

		// Store in Redis with 5 minute TTL (300 seconds)
		const cacheKey = `email_verification:${userId}`;
		await this.cacheManager.set(cacheKey, code, 300000); // 300000ms = 5 minutes

		// Send email
		const variables = new Map<string, string>();
		variables.set('NAME', user.username);
		variables.set('CODE', code);

		const variablesObject: Record<string, string> = {};
		variables.forEach((value, key) => {
			variablesObject[key] = value;
		});

		const notificationApiKey = this.configService.get<string>('NOTIFICATION_API_KEY');
		const notificationRequest = {
			to: {
				email: user.email,
				name: user.username,
			},
			subject: 'Verify Your Email',
			variables: variablesObject,
			notificationApiKey: notificationApiKey,
		};

		try {
			this.notificationClient.emit('mail.send', notificationRequest);
		} catch (emitError) {
			console.error('Error emitting verification email:', emitError);
			throw new AppException(ErrorCode.NOTIFICATION_SERVICE_ERROR);
		}

		return { sent: true };
	}

	async verifyEmailCode(userId: string, code: string): Promise<{ verified: boolean }> {
		const user = await this.userRepository.findOne({
			where: { userId },
		});

		if (!user) {
			throw new AppException(ErrorCode.USER_NOT_FOUND);
		}

		if (user.isEmailVerified) {
			throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
		}

		// Get code from Redis
		const cacheKey = `email_verification:${userId}`;
		const storedCode = await this.cacheManager.get<string>(cacheKey);

		if (!storedCode) {
			throw new AppException(ErrorCode.VERIFICATION_CODE_EXPIRED);
		}

		if (storedCode !== code) {
			throw new AppException(ErrorCode.VERIFICATION_CODE_INVALID);
		}

		// Mark email as verified
		user.isEmailVerified = true;
		await this.userRepository.save(user);

		// Delete the code from Redis
		await this.cacheManager.del(cacheKey);

		return { verified: true };
	}
}
