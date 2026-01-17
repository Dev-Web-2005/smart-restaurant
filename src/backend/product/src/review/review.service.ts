import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemReview } from 'src/common/entities';
import { CreateReviewRequestDto, GetReviewsRequestDto } from './dtos/request';
import { ReviewResponseDto, ReviewsListResponseDto } from './dtos/response';

@Injectable()
export class ReviewService {
	private readonly logger = new Logger(ReviewService.name);

	constructor(
		@InjectRepository(MenuItemReview)
		private readonly reviewRepository: Repository<MenuItemReview>,
	) {}

	/**
	 * Create a new review for a menu item
	 */
	async createReview(dto: CreateReviewRequestDto): Promise<ReviewResponseDto> {
		this.logger.log(
			`Creating review for menu item ${dto.menuItemId} by user ${dto.userId}`,
		);

		// Check if user has already reviewed this item
		const existingReview = await this.reviewRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				menuItemId: dto.menuItemId,
				userId: dto.userId,
			},
		});

		if (existingReview) {
			// Update existing review instead of creating new one
			existingReview.rating = dto.rating;
			existingReview.comment = dto.comment;
			existingReview.userName = dto.userName;

			const updated = await this.reviewRepository.save(existingReview);
			this.logger.log(`Updated existing review ${updated.id}`);
			return ReviewResponseDto.fromEntity(updated);
		}

		// Create new review
		const review = this.reviewRepository.create({
			tenantId: dto.tenantId,
			menuItemId: dto.menuItemId,
			userId: dto.userId,
			userName: dto.userName,
			rating: dto.rating,
			comment: dto.comment,
		});

		const saved = await this.reviewRepository.save(review);
		this.logger.log(`Created new review ${saved.id}`);

		return ReviewResponseDto.fromEntity(saved);
	}

	/**
	 * Get reviews for a menu item with pagination
	 */
	async getReviews(dto: GetReviewsRequestDto): Promise<ReviewsListResponseDto> {
		this.logger.log(`Getting reviews for menu item ${dto.menuItemId}`);

		const page = dto.page || 1;
		const limit = dto.limit || 10;
		const skip = (page - 1) * limit;

		// Get reviews with pagination
		const [reviews, total] = await this.reviewRepository.findAndCount({
			where: {
				tenantId: dto.tenantId,
				menuItemId: dto.menuItemId,
			},
			order: {
				createdAt: 'DESC', // Most recent first
			},
			skip,
			take: limit,
		});

		// Calculate average rating
		let averageRating = 0;
		if (total > 0) {
			const ratingSum = await this.reviewRepository
				.createQueryBuilder('review')
				.select('AVG(review.rating)', 'avg')
				.where('review.tenantId = :tenantId', { tenantId: dto.tenantId })
				.andWhere('review.menuItemId = :menuItemId', {
					menuItemId: dto.menuItemId,
				})
				.getRawOne();

			averageRating = parseFloat(ratingSum.avg) || 0;
		}

		this.logger.log(
			`Found ${total} reviews for menu item ${dto.menuItemId}, average rating: ${averageRating}`,
		);

		return ReviewsListResponseDto.create(reviews, total, page, limit, averageRating);
	}
}
