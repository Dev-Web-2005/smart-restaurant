import { AuthoritiesService } from 'src/authorities/authorities.service';
import { Role } from 'src/common/entities/role';
import CreateRoleRequestDto from 'src/roles/dtos/request/create-role-request.dto';
import CreateRoleResponseDto from 'src/roles/dtos/response/create-role-response.dto';
import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
import { Repository } from 'typeorm';
export declare class RolesService {
    private readonly roleRepository;
    private readonly authorityService;
    constructor(roleRepository: Repository<Role>, authorityService: AuthoritiesService);
    getAllRoles(): Promise<GetRoleResponseDto[]>;
    getRoleById(name: number): Promise<Role | null>;
    createRole(createDto: CreateRoleRequestDto): Promise<CreateRoleResponseDto>;
    deleteRole(name: string): Promise<void>;
    getRoleByName(name: string): Promise<Role | null>;
}
