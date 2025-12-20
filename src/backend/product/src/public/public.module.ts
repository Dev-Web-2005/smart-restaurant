import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory, MenuItem, ModifierOption } from 'src/common/entities';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
	imports: [TypeOrmModule.forFeature([MenuCategory, MenuItem, ModifierOption])],
	controllers: [PublicController],
	providers: [PublicService],
	exports: [PublicService],
})
export class PublicModule {}
