import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory } from 'src/common/entities';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [TypeOrmModule.forFeature([MenuCategory]), ConfigModule],
	controllers: [CategoryController],
	providers: [CategoryService],
	exports: [CategoryService],
})
export class CategoryModule {}
