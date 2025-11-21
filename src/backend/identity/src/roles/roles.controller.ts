import { Controller } from '@nestjs/common';
import { RolesService } from 'src/roles/roles.service';

@Controller()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}
	//add necessary endpoints for role controller
	// For example, to create a new role
	//@MessagePattern('roles:create')
	//async createRole(data: any): Promise<any> {}
}
