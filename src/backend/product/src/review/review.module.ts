import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemReview } from 'src/common/entities';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
	imports: [TypeOrmModule.forFeature([MenuItemReview])],
	controllers: [ReviewController],
	providers: [ReviewService],
	exports: [ReviewService],
})
export class ReviewModule {}
