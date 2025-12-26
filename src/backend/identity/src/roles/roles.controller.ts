import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import CreateRoleRequestDto from 'src/roles/dtos/request/create-role-request.dto';
import { RolesService } from 'src/roles/roles.service';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { GetAllRolesRequestDto } from 'src/roles/dtos/request/get-all-roles-request.dto';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';

@Controller()
export class RolesController {
	constructor(
		private readonly rolesService: RolesService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('roles:get-all-roles')
	async getAllRoles(data: GetAllRolesRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Get all roles successful',
				await this.rolesService.getAllRoles(),
			);
		});
	}

	@MessagePattern('roles:create-role')
	async createRole(data: CreateRoleRequestDto): Promise<HttpResponse> {
		return handleRpcCall(async () => {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			return new HttpResponse(
				200,
				'Create role successful',
				await this.rolesService.createRole(data),
			);
		});
	}
}
