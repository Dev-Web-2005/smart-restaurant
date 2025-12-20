import { ConfigService } from '@nestjs/config';
import { ModifyProfileRequestDto } from 'src/detail/dtos/request/modify-profile-request.dto';
import { GetProfileRequestDto } from 'src/detail/dtos/request/get-profile-request.dto';
import GetProfileResponseDto from 'src/detail/dtos/response/get-profile-response.dto';
import { DetailService } from 'src/detail/detail.service';
import { GetVerifiedStateRequestDto } from 'src/detail/dtos/request/get-verified-state-request.dto';
export declare class DetailController {
    private readonly detailService;
    private readonly config;
    constructor(detailService: DetailService, config: ConfigService);
    modifyProfile(data: ModifyProfileRequestDto): Promise<GetProfileResponseDto>;
    getProfile(data: GetProfileRequestDto): Promise<GetProfileResponseDto>;
    getVerifiedState(data: GetVerifiedStateRequestDto): Promise<boolean>;
}
