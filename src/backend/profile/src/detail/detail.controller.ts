import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { ModifyProfileRequestDto } from 'src/detail/dtos/request/modify-profile-request.dto';
import { GetProfileRequestDto } from 'src/detail/dtos/request/get-profile-request.dto';
import GetProfileResponseDto from 'src/detail/dtos/response/get-profile-response.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { DetailService } from 'src/detail/detail.service';
import { GetVerifiedStateRequestDto } from 'src/detail/dtos/request/get-verified-state-request.dto';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';

@Controller()
export class DetailController {
	constructor(
		private readonly detailService: DetailService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('profiles:modify-profile')
	async modifyProfile(data: ModifyProfileRequestDto): Promise<GetProfileResponseDto> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('PROFILE_API_KEY');
			if (data.profileApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return this.detailService.modifyProfileServiceStatus(
				plainToInstance(ModifyProfileRequestDto, data),
			);
		});
	}

	@MessagePattern('profiles:get-profile')
	async getProfile(data: GetProfileRequestDto): Promise<GetProfileResponseDto> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('PROFILE_API_KEY');
			if (data.profileApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return this.detailService.getProfileServiceStatus(data.userId);
		});
	}

	@MessagePattern('profiles:get-verified-state')
	async getVerifiedState(data: GetVerifiedStateRequestDto): Promise<boolean> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('PROFILE_API_KEY');
			if (data.profileApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return (await this.detailService.getProfileServiceStatus(data.userId)).verified;
		});
	}
}
