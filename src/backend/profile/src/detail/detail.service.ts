import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifyProfileRequestDto } from 'src/detail/dtos/modify-profile-request.dto';
import GetProfileResponseDto from 'src/detail/dtos/response/get-profile-response.dto';
import Profile from 'src/common/entities/profile';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { filterNullValues } from '@shared/utils/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DetailService {
	constructor(
		@InjectRepository(Profile) private readonly profileRepository: Repository<Profile>,
		private readonly config: ConfigService,
	) {}

	async getProfileServiceStatus(userId: string): Promise<GetProfileResponseDto> {
		const profile = await this.profileRepository.findOneBy({ userId });
		if (!profile) {
			throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
		}
		return plainToInstance(GetProfileResponseDto, profile, {
			excludeExtraneousValues: false,
		});
	}

	async modifyProfileServiceStatus(
		modifyProfileRequestDto: ModifyProfileRequestDto,
	): Promise<GetProfileResponseDto> {
		let profile = await this.profileRepository.findOneBy({
			userId: modifyProfileRequestDto.userId,
		});

		if (!profile) {
			profile = this.profileRepository.create({ userId: modifyProfileRequestDto.userId });
		}
		const updateData = filterNullValues(modifyProfileRequestDto);
		Object.assign(profile, updateData);

		const savedProfile = await this.profileRepository.save(profile);

		return plainToInstance(GetProfileResponseDto, savedProfile, {
			excludeExtraneousValues: false,
		});
	}
}
