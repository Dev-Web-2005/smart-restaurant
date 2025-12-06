import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthoritiesService } from 'src/authorities/authorities.service';
import CreateAuthorityRequestDto from 'src/authorities/dtos/request/create-authority-request.dto';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { GetAllAuthoritiesRequestDto } from 'src/authorities/dtos/request/get-all-authorities-request.dto';

@Controller('authorities')
export class AuthoritiesController {
	constructor(
		private readonly authoritiesService: AuthoritiesService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('authorities:get-all-authorities')
	async getAllAuthorities(data: GetAllAuthoritiesRequestDto): Promise<HttpResponse> {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return new HttpResponse(
			200,
			'Get all authorities successful',
			await this.authoritiesService.getAllAuthorities(),
		);
	}

	@MessagePattern('authorities:create-authority')
	async createAuthority(data: CreateAuthorityRequestDto): Promise<HttpResponse> {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return new HttpResponse(
			200,
			'Create authority successful',
			await this.authoritiesService.createAuthority(data),
		);
	}
}
