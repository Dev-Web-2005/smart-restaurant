import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import CreateAuthorityRequestDto from 'src/authorities/dtos/request/create-authority-request.dto';
import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
import { Authority } from 'src/common/entities/authority';

import { Repository } from 'typeorm';
import ErrorCode from '@shared/exceptions/error-code';
import AppException from '@shared/exceptions/app-exception';
import { AuthorityEnum } from '@shared/utils/enum';

@Injectable()
export class AuthoritiesService {
	constructor(
		@InjectRepository(Authority)
		private readonly authorityRepository: Repository<Authority>,
	) {}
	//add necessary methods for authority service
	async getAllAuthorities(): Promise<GetAuthorityResponseDto[]> {
		const authorities = await this.authorityRepository.find();
		return authorities.map(
			(authority) =>
				new GetAuthorityResponseDto({
					name: AuthorityEnum[authority.name],
					description: authority.description,
				}),
		);
	}

	async getAuthorityById(name: number): Promise<Authority | null> {
		const authority = await this.authorityRepository.findOneBy({ name });
		if (!authority) {
			return null;
		}
		return authority;
	}

	async createAuthority(
		createAuthorityRequestDto: CreateAuthorityRequestDto,
	): Promise<GetAuthorityResponseDto> {
		const authorityName = createAuthorityRequestDto.name;
		const authorityEnumValue = AuthorityEnum[authorityName as keyof typeof AuthorityEnum];

		if (authorityEnumValue === undefined) {
			throw new AppException(ErrorCode.AUTHORITY_NOT_FOUND);
		}

		try {
			const savedAuthority = await this.authorityRepository.save({
				name: authorityEnumValue,
				description: createAuthorityRequestDto?.description,
			});
			return new GetAuthorityResponseDto({
				name: AuthorityEnum[savedAuthority.name],
				description: savedAuthority.description,
			});
		} catch (err) {
			console.error('Error creating authority:', err);
			throw new AppException(ErrorCode.AUTHORITY_CREATION_FAILED);
		}
	}

	async deleteAuthority(name: string): Promise<void> {
		const nameInt: number = AuthorityEnum[name as keyof typeof AuthorityEnum];
		await this.authorityRepository.delete({ name: nameInt });
	}
}
