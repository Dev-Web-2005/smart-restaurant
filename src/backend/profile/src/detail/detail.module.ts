import { Module } from '@nestjs/common';
import { DetailController } from './detail.controller';
import { DetailService } from './detail.service';
import Profile from 'src/common/entities/profile';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [TypeOrmModule.forFeature([Profile])],
	controllers: [DetailController],
	providers: [DetailService],
})
export class DetailModule {}
