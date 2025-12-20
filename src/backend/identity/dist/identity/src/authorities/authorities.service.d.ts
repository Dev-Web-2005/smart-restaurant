import CreateAuthorityRequestDto from 'src/authorities/dtos/request/create-authority-request.dto';
import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
import { Authority } from 'src/common/entities/authority';
import { Repository } from 'typeorm';
export declare class AuthoritiesService {
    private readonly authorityRepository;
    constructor(authorityRepository: Repository<Authority>);
    getAllAuthorities(): Promise<GetAuthorityResponseDto[]>;
    getAuthorityById(name: number): Promise<Authority | null>;
    createAuthority(createAuthorityRequestDto: CreateAuthorityRequestDto): Promise<GetAuthorityResponseDto>;
    deleteAuthority(name: string): Promise<void>;
}
