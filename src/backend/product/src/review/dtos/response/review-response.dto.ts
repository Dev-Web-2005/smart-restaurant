export class ReviewResponseDto {
	id: string;
	tenantId: string;
	menuItemId: string;
	userId: string;
	userName: string;
	rating: number;
	comment: string;
	createdAt: Date;
	updatedAt: Date;

	static fromEntity(review: any): ReviewResponseDto {
		return {
			id: review.id,
			tenantId: review.tenantId,
			menuItemId: review.menuItemId,
			userId: review.userId,
			userName: review.userName,
			rating: review.rating,
			comment: review.comment,
			createdAt: review.createdAt,
			updatedAt: review.updatedAt,
		};
	}
}

export class ReviewsListResponseDto {
	reviews: ReviewResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	averageRating: number;

	static create(
		reviews: any[],
		total: number,
		page: number,
		limit: number,
		averageRating: number,
	): ReviewsListResponseDto {
		return {
			reviews: reviews.map((review) => ReviewResponseDto.fromEntity(review)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
			averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
		};
	}
}
