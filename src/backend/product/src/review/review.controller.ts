import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import { CreateReviewRequestDto, GetReviewsRequestDto } from './dtos/request';

@Controller()
export class ReviewController {
	private readonly logger = new Logger(ReviewController.name);

	constructor(private readonly reviewService: ReviewService) {}

	@MessagePattern('reviews:create')
	async createReview(@Payload() data: CreateReviewRequestDto) {
		this.logger.log('Received reviews:create message');
		return this.reviewService.createReview(data);
	}

	@MessagePattern('reviews:get-all')
	async getReviews(@Payload() data: GetReviewsRequestDto) {
		this.logger.log('Received reviews:get-all message');
		return this.reviewService.getReviews(data);
	}
}
