import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PublicService } from './public.service';
import { GetPublicMenuRequestDto } from './dtos/request/get-public-menu-request.dto';
import HttpResponse from '@shared/utils/http-response';

@Controller()
export class PublicController {
	constructor(private readonly publicService: PublicService) {}

	@MessagePattern('public:get-menu')
	async getPublicMenu(dto: GetPublicMenuRequestDto) {
		const menu = await this.publicService.getPublicMenu(dto);
		return new HttpResponse(1000, 'Public menu retrieved successfully', menu);
	}
}
