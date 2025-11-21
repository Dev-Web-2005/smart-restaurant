import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Authority } from 'src/entity/authority';

@Injectable()
export class AuthoritiesService {
	constructor(@InjectRepository(Authority) private readonly authorityRepository) {}
	//add necessary methods for authority service
}
