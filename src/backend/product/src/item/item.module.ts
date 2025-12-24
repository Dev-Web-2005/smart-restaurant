import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem, MenuCategory } from 'src/common/entities';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [TypeOrmModule.forFeature([MenuItem, MenuCategory]), ConfigModule],
	controllers: [ItemController],
	providers: [ItemService],
	exports: [ItemService],
})
export class ItemModule {}
