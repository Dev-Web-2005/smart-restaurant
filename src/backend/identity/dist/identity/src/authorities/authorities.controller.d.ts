import { AuthoritiesService } from 'src/authorities/authorities.service';
import CreateAuthorityRequestDto from 'src/authorities/dtos/request/create-authority-request.dto';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import { GetAllAuthoritiesRequestDto } from 'src/authorities/dtos/request/get-all-authorities-request.dto';
export declare class AuthoritiesController {
    private readonly authoritiesService;
    private readonly config;
    constructor(authoritiesService: AuthoritiesService, config: ConfigService);
    getAllAuthorities(data: GetAllAuthoritiesRequestDto): Promise<HttpResponse>;
    createAuthority(data: CreateAuthorityRequestDto): Promise<HttpResponse>;
}
