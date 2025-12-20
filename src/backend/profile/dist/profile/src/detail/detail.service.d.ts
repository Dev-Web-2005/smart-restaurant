import { ModifyProfileRequestDto } from 'src/detail/dtos/request/modify-profile-request.dto';
import GetProfileResponseDto from 'src/detail/dtos/response/get-profile-response.dto';
import Profile from 'src/common/entities/profile';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
export declare class DetailService {
    private readonly profileRepository;
    private readonly config;
    constructor(profileRepository: Repository<Profile>, config: ConfigService);
    getProfileServiceStatus(userId: string): Promise<GetProfileResponseDto>;
    modifyProfileServiceStatus(modifyProfileRequestDto: ModifyProfileRequestDto): Promise<GetProfileResponseDto>;
}
