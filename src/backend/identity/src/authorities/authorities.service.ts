import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Authority } from 'src/entity/authority';
import { Repository } from 'typeorm';

@Injectable()
export class AuthoritiesService {
	constructor(
		@InjectRepository(Authority)
		private readonly authorityRepository: Repository<Authority>,
	) {}
	//add necessary methods for authority service
}
