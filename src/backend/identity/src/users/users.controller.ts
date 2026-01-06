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
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import { ValidateRestaurantQrRequestDto } from './dtos/request/validate-restaurant-qr-request.dto';
import { GetStaffChefByOwnerRequestDto } from './dtos/request/get-staff-chef-by-owner-request.dto';
import { SendVerificationEmailRequestDto } from './dtos/request/send-verification-email-request.dto';
import { VerifyEmailCodeRequestDto } from './dtos/request/verify-email-code-request.dto';
import { CheckEmailRequestDto } from 'src/users/dtos/request/check-email-request.dto';
import { UpdateEmailRequestDto } from 'src/users/dtos/request/update-email-request.dto';

@Controller()
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('users:register')
	async registerUser(data: RegisterUserWithProfileRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Register successful',
				await this.usersService.Register(data),
			);
		});
	}

	@MessagePattern('users:register-customer')
	async registerCustomer(
		data: RegisterUserWithProfileRequestDto & { ownerId: string },
	): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Customer registered successfully',
				await this.usersService.RegisterCustomer(data, data.ownerId),
			);
		});
	}

	@MessagePattern('users:generate-staff-chef')
	async generateStaffChef(data: {
		ownerId: string;
		role: 'STAFF' | 'CHEF';
		identityApiKey?: string;
	}): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				`${data.role} account generated successfully`,
				await this.usersService.generateStaffOrChef(data.ownerId, data.role),
			);
		});
	}

	@MessagePattern('users:get-all-users')
	async getAllUsers(data: GetAllUsersRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Get all users successful',
				await this.usersService.getAllUsers(),
			);
		});
	}

	@MessagePattern('users:get-user-by-id')
	async getUserById(data: GetUserByIdRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Get user by id successful',
				await this.usersService.getUserById(data.userId),
			);
		});
	}

	/**
	 * Generate or regenerate restaurant QR code
	 * Pattern: users:generate-restaurant-qr
	 */
	@MessagePattern('users:generate-restaurant-qr')
	async generateRestaurantQr(data: {
		userId: string;
		identityApiKey?: string;
	}): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Restaurant QR code generated successfully',
				await this.usersService.generateRestaurantQr(data.userId),
			);
		});
	}

	/**
	 * Get existing restaurant QR without regenerating
	 * Pattern: users:get-restaurant-qr
	 */
	@MessagePattern('users:get-restaurant-qr')
	async getRestaurantQr(data: {
		userId: string;
		identityApiKey?: string;
	}): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			const qrData = await this.usersService.getRestaurantQr(data.userId);
			return new HttpResponse(200, 'Restaurant QR code retrieved successfully', qrData);
		});
	}

	/**
	 * Validate restaurant QR token
	 * Pattern: users:validate-restaurant-qr
	 */
	@MessagePattern('users:validate-restaurant-qr')
	async validateRestaurantQr(
		data: ValidateRestaurantQrRequestDto,
	): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Restaurant QR validation completed',
				await this.usersService.validateRestaurantQr(data.ownerId, data.token),
			);
		});
	}

	@MessagePattern('users:toggle-status')
	async toggleUserStatus(data: {
		ownerId: string;
		targetUserId: string;
		isActive: boolean;
		identityApiKey?: string;
	}): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				data.isActive ? 'User activated successfully' : 'User deactivated successfully',
				await this.usersService.toggleUserStatus(
					data.ownerId,
					data.targetUserId,
					data.isActive,
				),
			);
		});
	}

	@MessagePattern('users:hard-delete')
	async hardDeleteUser(data: {
		ownerId: string;
		targetUserId: string;
		identityApiKey?: string;
	}): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'User deleted permanently',
				await this.usersService.hardDeleteUser(data.ownerId, data.targetUserId),
			);
		});
	}

	@MessagePattern('users:get-staff-chef-by-owner')
	async getStaffChefByOwner(data: GetStaffChefByOwnerRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Staff/Chef list retrieved successfully',
				await this.usersService.getStaffChefByOwner(
					data.ownerId,
					data.role,
					data.page || 1,
					data.limit || 10,
					data.isActive,
				),
			);
		});
	}

	@MessagePattern('users:send-verification-email')
	async sendVerificationEmail(
		data: SendVerificationEmailRequestDto,
	): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Verification email sent successfully',
				await this.usersService.sendVerificationEmail(data.userId),
			);
		});
	}

	@MessagePattern('users:verify-email-code')
	async verifyEmailCode(data: VerifyEmailCodeRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Email verified successfully',
				await this.usersService.verifyEmailCode(data.userId, data.code),
			);
		});
	}

	@MessagePattern('users:check-verify-email-status')
	async checkVerifyEmailStatus(data: CheckEmailRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Email verification status retrieved successfully',
				await this.usersService.checkVerifyEmailStatus(data.email),
			);
		});
	}

	@MessagePattern('users:resend-verification-email')
	async resendVerificationEmail(
		data: SendVerificationEmailRequestDto,
	): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Verification email resent successfully',
				await this.usersService.sendVerificationEmail(data.userId),
			);
		});
	}

	@MessagePattern('users:update-email-when-register-failed')
	async updateEmailWhenRegisterFailed(data: UpdateEmailRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Email updated successfully',
				await this.usersService.updateEmailWhenRegisterFailed(data),
			);
		}
}
