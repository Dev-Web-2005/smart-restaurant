import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesService } from 'src/tables/tables.service';
import { TablesController } from 'src/tables/tables.controller';
import { TableEntity } from 'src/common/entities/table';
import { FloorEntity } from 'src/common/entities/floor';

@Module({
	imports: [TypeOrmModule.forFeature([TableEntity, FloorEntity])],
	controllers: [TablesController],
	providers: [TablesService],
	exports: [TablesService],
})
export class TablesModule {}
