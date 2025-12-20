import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/common/entities/role';
import { AuthoritiesModule } from 'src/authorities/authorities.module';

@Module({
	imports: [TypeOrmModule.forFeature([Role]), AuthoritiesModule],
	controllers: [RolesController],
	providers: [RolesService],
	exports: [RolesService],
})
export class RolesModule {}
