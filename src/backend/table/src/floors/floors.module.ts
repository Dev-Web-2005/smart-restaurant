import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloorsService } from 'src/floors/floors.service';
import { FloorsController } from 'src/floors/floors.controller';
import { FloorEntity } from 'src/common/entities/floor';

@Module({
	imports: [TypeOrmModule.forFeature([FloorEntity])],
	controllers: [FloorsController],
	providers: [FloorsService],
	exports: [FloorsService, TypeOrmModule],
})
export class FloorsModule {}
