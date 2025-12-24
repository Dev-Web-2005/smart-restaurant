import { Module } from '@nestjs/common';
import { AuthoritiesService } from './authorities.service';
import { AuthoritiesController } from './authorities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Authority } from 'src/common/entities/authority';

@Module({
	imports: [TypeOrmModule.forFeature([Authority])],
	providers: [AuthoritiesService],
	controllers: [AuthoritiesController],
	exports: [AuthoritiesService],
})
export class AuthoritiesModule {}
