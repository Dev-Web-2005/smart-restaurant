import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getReviewsAPI, createReviewAPI } from '../../../../services/api/reviewAPI'

/**
 * Star Rating Component
 * Reusable component for displaying/selecting star ratings
 */
const StarRating = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
	const [hoverRating, setHoverRating] = useState(0)

	const sizeClasses = {
		sm: 'text-lg',
		md: 'text-2xl',
		lg: 'text-3xl',
	}

	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => {
				const isFilled = star <= (hoverRating || rating)
				return (
					<button
						key={star}
						type="button"
						disabled={readonly}
						onClick={() => !readonly && onRatingChange?.(star)}
						onMouseEnter={() => !readonly && setHoverRating(star)}
						onMouseLeave={() => !readonly && setHoverRating(0)}
						className={`${sizeClasses[size]} transition-all duration-150 ${
							readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
						} ${isFilled ? 'text-yellow-400' : 'text-gray-500'}`}
					>
						{isFilled ? '★' : '☆'}
					</button>
				)
			})}
		</div>
	)
}

/**
 * Single Review Card Component
 */
const ReviewCard = ({ review }) => {
	const formatDate = (dateString) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffTime = Math.abs(now - date)
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 0) return 'Today'
		if (diffDays === 1) return 'Yesterday'
		if (diffDays < 7) return `${diffDays} days ago`
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<div className="bg-[#2D3748] rounded-lg p-4 border border-white/5">
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-3">
					{/* Avatar */}
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
						{review.userName?.charAt(0)?.toUpperCase() || 'U'}
					</div>
					<div>
						<p className="text-white font-medium">{review.userName || 'Anonymous'}</p>
						<p className="text-[#9dabb9] text-xs">{formatDate(review.createdAt)}</p>
					</div>
				</div>
				<StarRating rating={review.rating} readonly size="sm" />
			</div>
			{review.comment && (
				<p className="text-[#c9d1d9] text-sm mt-2 leading-relaxed">{review.comment}</p>
			)}
		</div>
	)
}

/**
 * Review Summary Component
 * Shows average rating and rating breakdown
 */
const ReviewSummary = ({ averageRating, total, reviews }) => {
	// Calculate rating breakdown
	const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
		stars,
		count: reviews.filter((r) => r.rating === stars).length,
	}))

	return (
		<div className="bg-[#1A202C] rounded-lg p-4 border border-white/10">
			<div className="flex items-center gap-6">
				{/* Average Rating */}
				<div className="text-center">
					<p className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</p>
					<StarRating rating={Math.round(averageRating)} readonly size="sm" />
					<p className="text-[#9dabb9] text-xs mt-1">{total} reviews</p>
				</div>

				{/* Rating Breakdown */}
				<div className="flex-1 space-y-1">
					{ratingCounts.map(({ stars, count }) => {
						const percentage = total > 0 ? (count / total) * 100 : 0
						return (
							<div key={stars} className="flex items-center gap-2 text-xs">
								<span className="text-[#9dabb9] w-4">{stars}</span>
								<span className="text-yellow-400">★</span>
								<div className="flex-1 h-2 bg-[#2D3748] rounded-full overflow-hidden">
									<div
										className="h-full bg-yellow-400 rounded-full transition-all duration-300"
										style={{ width: `${percentage}%` }}
									/>
								</div>
								<span className="text-[#9dabb9] w-8 text-right">{count}</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

/**
 * Write Review Form Component
 */
const WriteReviewForm = ({ onSubmit, isSubmitting, existingReview }) => {
	const [rating, setRating] = useState(existingReview?.rating || 0)
	const [comment, setComment] = useState(existingReview?.comment || '')
	const [error, setError] = useState('')

	const handleSubmit = (e) => {
		e.preventDefault()
		setError('')

		if (rating === 0) {
			setError('Please select a rating')
			return
		}

		onSubmit({ rating, comment })
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-[#2D3748] rounded-lg p-4 border border-white/10"
		>
			<h4 className="text-white font-semibold mb-3">
				{existingReview ? 'Update Your Review' : 'Write a Review'}
			</h4>

			{/* Rating Selection */}
			<div className="mb-4">
				<label className="text-[#9dabb9] text-sm mb-2 block">Your Rating *</label>
				<StarRating rating={rating} onRatingChange={setRating} size="lg" />
			</div>

			{/* Comment */}
			<div className="mb-4">
				<label className="text-[#9dabb9] text-sm mb-2 block">
					Your Review (Optional)
				</label>
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Share your experience with this dish..."
					className="w-full px-3 py-2 bg-[#1A202C] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 resize-none"
					rows={3}
					maxLength={500}
				/>
				<p className="text-[#9dabb9] text-xs text-right mt-1">{comment.length}/500</p>
			</div>

			{error && <p className="text-red-400 text-sm mb-3">{error}</p>}

			<button
				type="submit"
				disabled={isSubmitting || rating === 0}
				className="w-full py-2.5 bg-[#137fec] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{isSubmitting ? (
					<>
						<span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
						Submitting...
					</>
				) : existingReview ? (
					'Update Review'
				) : (
					'Submit Review'
				)}
			</button>
		</form>
	)
}

/**
 * Reviews Section Component
 * Main component to display reviews for a menu item
 *
 * Props:
 * - tenantId: Restaurant tenant ID
 * - itemId: Menu item ID
 * - itemName: Name of the dish (for display)
 * - onClose: Close handler
 * - isOpen: Whether the modal is open
 */
const ReviewsSection = ({ tenantId, itemId, itemName, onClose, isOpen }) => {
	const [reviews, setReviews] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const [total, setTotal] = useState(0)
	const [averageRating, setAverageRating] = useState(0)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitSuccess, setSubmitSuccess] = useState(false)
	const [userReview, setUserReview] = useState(null)

	// Check if user is logged in
	const isLoggedIn = (() => {
		const isGuest = localStorage.getItem('isGuestMode') === 'true'
		const customerAuth = localStorage.getItem('customerAuth')
		return !isGuest && customerAuth
	})()

	// Get current user ID for finding existing review
	const getCurrentUserId = () => {
		try {
			const customerAuth = localStorage.getItem('customerAuth')
			if (customerAuth) {
				const authData = JSON.parse(customerAuth)
				return authData.userId
			}
		} catch (e) {
			console.error('Failed to get userId:', e)
		}
		return null
	}

	// Ref to prevent duplicate fetches
	const fetchingRef = useRef(false)
	const lastFetchTimeRef = useRef(0)
	const MIN_FETCH_INTERVAL = 1000 // 1 second minimum between fetches

	// Fetch reviews
	const fetchReviews = useCallback(
		async (pageNum = 1, skipCache = false) => {
			// Prevent duplicate fetches
			const now = Date.now()
			if (
				fetchingRef.current ||
				(now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL && !skipCache)
			) {
				console.log('⏳ Skipping duplicate review fetch')
				return
			}

			fetchingRef.current = true
			lastFetchTimeRef.current = now
			setLoading(true)
			setError(null)

			try {
				const result = await getReviewsAPI(tenantId, itemId, {
					page: pageNum,
					limit: 5,
					skipCache,
				})

				if (result.success) {
					setReviews(result.reviews)
					setTotal(result.total)
					setTotalPages(result.totalPages)
					setAverageRating(result.averageRating)
					setPage(pageNum)

					// Find user's existing review
					const userId = getCurrentUserId()
					if (userId) {
						const existingReview = result.reviews.find((r) => r.userId === userId)
						setUserReview(existingReview || null)
					}
				} else {
					setError(result.message)
				}
			} catch (err) {
				console.error('Error fetching reviews:', err)
				setError('Failed to load reviews')
			} finally {
				setLoading(false)
				fetchingRef.current = false
			}
		},
		[tenantId, itemId],
	)

	// Fetch reviews when modal opens
	useEffect(() => {
		if (isOpen && tenantId && itemId) {
			fetchReviews(1)
		}
	}, [isOpen, tenantId, itemId, fetchReviews])

	// Handle review submission
	const handleSubmitReview = async (reviewData) => {
		setIsSubmitting(true)
		setSubmitSuccess(false)

		try {
			const result = await createReviewAPI(tenantId, itemId, reviewData)

			if (result.success) {
				setSubmitSuccess(true)
				// Refresh reviews to show the new one
				fetchReviews(1, true)
				setTimeout(() => setSubmitSuccess(false), 3000)
			} else if (result.requiresLogin) {
				setError(result.message)
			} else {
				setError(result.message)
			}
		} catch (err) {
			console.error('Error submitting review:', err)
			setError('Failed to submit review')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Handle page change
	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
			fetchReviews(newPage)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="relative backdrop-blur-xl bg-[#1A202C]/95 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden border border-white/20">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<div>
						<h3 className="text-lg font-bold text-white">Reviews</h3>
						<p className="text-[#9dabb9] text-sm truncate max-w-[250px]">{itemName}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Content */}
				<div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
					{/* Loading State */}
					{loading && reviews.length === 0 && (
						<div className="text-center py-8">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#137fec]"></div>
							<p className="text-[#9dabb9] mt-2">Loading reviews...</p>
						</div>
					)}

					{/* Error State */}
					{error && (
						<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
							{error}
						</div>
					)}

					{/* Success Message */}
					{submitSuccess && (
						<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
							<span className="material-symbols-outlined text-lg">check_circle</span>
							Review submitted successfully!
						</div>
					)}

					{/* No Reviews State */}
					{!loading && !error && reviews.length === 0 && (
						<div className="text-center py-8">
							<span className="material-symbols-outlined text-5xl text-[#9dabb9] mb-3 block">
								rate_review
							</span>
							<p className="text-[#9dabb9]">No reviews yet</p>
							<p className="text-[#9dabb9] text-sm">Be the first to review this dish!</p>
						</div>
					)}

					{/* Review Summary */}
					{!loading && total > 0 && (
						<ReviewSummary
							averageRating={averageRating}
							total={total}
							reviews={reviews}
						/>
					)}

					{/* Write Review Section */}
					{isLoggedIn ? (
						<WriteReviewForm
							onSubmit={handleSubmitReview}
							isSubmitting={isSubmitting}
							existingReview={userReview}
						/>
					) : (
						<div className="bg-[#2D3748] rounded-lg p-4 border border-white/10 text-center">
							<span className="material-symbols-outlined text-3xl text-[#9dabb9] mb-2 block">
								login
							</span>
							<p className="text-white font-medium mb-1">Login to Write a Review</p>
							<p className="text-[#9dabb9] text-sm">
								Share your experience with other customers
							</p>
						</div>
					)}

					{/* Reviews List */}
					{!loading && reviews.length > 0 && (
						<div className="space-y-3">
							<h4 className="text-white font-semibold flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">reviews</span>
								Customer Reviews ({total})
							</h4>
							{reviews.map((review) => (
								<ReviewCard key={review.id} review={review} />
							))}
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-2">
							<button
								onClick={() => handlePageChange(page - 1)}
								disabled={page === 1 || loading}
								className="p-2 rounded-lg bg-[#2D3748] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568] transition-colors"
							>
								<span className="material-symbols-outlined text-sm">chevron_left</span>
							</button>
							<span className="text-[#9dabb9] text-sm px-3">
								Page {page} of {totalPages}
							</span>
							<button
								onClick={() => handlePageChange(page + 1)}
								disabled={page === totalPages || loading}
								className="p-2 rounded-lg bg-[#2D3748] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568] transition-colors"
							>
								<span className="material-symbols-outlined text-sm">chevron_right</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ReviewsSection
