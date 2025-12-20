import CreateRoleRequestDto from 'src/roles/dtos/request/create-role-request.dto';
import { RolesService } from 'src/roles/roles.service';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import { GetAllRolesRequestDto } from 'src/roles/dtos/request/get-all-roles-request.dto';
export declare class RolesController {
    private readonly rolesService;
    private readonly config;
    constructor(rolesService: RolesService, config: ConfigService);
    getAllRoles(data: GetAllRolesRequestDto): Promise<HttpResponse>;
    createRole(data: CreateRoleRequestDto): Promise<HttpResponse>;
}
