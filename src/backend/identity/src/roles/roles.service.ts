import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthoritiesService } from 'src/authorities/authorities.service';
import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
import { Authority } from 'src/common/entities/authority';
import { Role } from 'src/common/entities/role';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import CreateRoleRequestDto from 'src/roles/dtos/request/create-role-request.dto';
import CreateRoleResponseDto from 'src/roles/dtos/response/create-role-response.dto';
import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
import { AuthorityEnum, RoleEnum } from '@shared/utils/enum';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
	constructor(
		@InjectRepository(Role)
		private readonly roleRepository: Repository<Role>,
		private readonly authorityService: AuthoritiesService,
	) {}

	//add necessary methods for role service
	async getAllRoles(): Promise<GetRoleResponseDto[]> {
		const roles = await this.roleRepository.find({
			relations: ['authorities'],
		});
		return roles.map((role) => {
			console.log(role);
			const dto = new GetRoleResponseDto();
			dto.name = RoleEnum[role.name];
			dto.description = role.description;
			dto.authorities = role.authorities.map(
				(authority) =>
					new GetAuthorityResponseDto({
						name: AuthorityEnum[authority.name],
						description: authority.description,
					}),
			);
			return dto;
		});
	}

	async getRoleById(name: number): Promise<Role | null> {
		const roles = await this.roleRepository.findOne({
			where: { name },
			relations: ['authorities'],
		});
		if (!roles) {
			return null;
		}
		return roles;
	}

	async createRole(createDto: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
		try {
			const authorities = createDto.authorities || [];
			const authoritiesEntities: Authority[] = [];
			for (const authority of authorities) {
				const authorityInt: number =
					AuthorityEnum[authority as keyof typeof AuthorityEnum];
				const authorityInRepo =
					await this.authorityService.getAuthorityById(authorityInt);
				if (!authorityInRepo) {
					throw new AppException(ErrorCode.AUTHORITY_NOT_FOUND);
				}
				authoritiesEntities.push(authorityInRepo);
			}

			const savedRole = await this.roleRepository.save({
				name: RoleEnum[createDto.name as keyof typeof RoleEnum],
				description: createDto?.description,
				authorities: authoritiesEntities,
			});
			const response = new CreateRoleResponseDto();
			response.name = RoleEnum[savedRole.name];
			response.description = savedRole.description;
			response.authorities = savedRole.authorities.map(
				(authority) =>
					new GetAuthorityResponseDto({
						name: AuthorityEnum[authority.name],
						description: authority.description,
					}),
			);
			return response;
		} catch (err) {
			console.error('Error creating role:', err);
			throw new AppException(ErrorCode.ROLE_CREATION_FAILED);
		}
	}
	async deleteRole(name: string): Promise<void> {
		const nameInt: number = RoleEnum[name as keyof typeof RoleEnum];
		await this.roleRepository.delete({ name: nameInt });
	}
}
