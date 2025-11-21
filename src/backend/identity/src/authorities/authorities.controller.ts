import { Controller } from '@nestjs/common';
import { AuthoritiesService } from 'src/authorities/authorities.service';

@Controller('authorities')
export class AuthoritiesController {
	constructor(private readonly authoritiesService: AuthoritiesService) {}
	//add necessary endpoints for authority controller
	// For example, to create a new authority
	//@MessagePattern('authorities:create')
	//async createAuthority(data: any): Promise<any> {}
}
