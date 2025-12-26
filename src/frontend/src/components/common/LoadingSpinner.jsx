import React from 'react'

/**
 * Loading Spinner Component - Reusable loading indicator
 * @param {Object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} props.color - Color class (default: 'text-blue-500')
 * @param {string} props.message - Optional loading message
 */
const LoadingSpinner = ({ size = 'md', color = 'text-blue-500', message = '' }) => {
	const sizeClasses = {
		sm: 'w-6 h-6',
		md: 'w-12 h-12',
		lg: 'w-16 h-16',
		xl: 'w-24 h-24',
	}

	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<div
				className={`${sizeClasses[size]} ${color} animate-spin rounded-full border-4 border-solid border-current border-r-transparent`}
				role="status"
			>
				<span className="sr-only">Loading...</span>
			</div>
			{message && <p className="text-gray-300 text-sm font-medium">{message}</p>}
		</div>
	)
}

/**
 * Full Page Loading Overlay - Covers entire page
 * @param {Object} props
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.message - Optional loading message
 * @param {string} props.backdrop - Backdrop style: 'dark', 'light', 'blur' (default: 'blur')
 */
export const FullPageLoader = ({
	isLoading,
	message = 'Đang tải...',
	backdrop = 'blur',
}) => {
	if (!isLoading) return null

	const backdropClasses = {
		dark: 'bg-black/80',
		light: 'bg-white/80',
		blur: 'bg-black/70 backdrop-blur-lg',
	}

	return (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center ${backdropClasses[backdrop]} transition-all duration-300`}
		>
			<div className="bg-[#1A202C] backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-white/20 transform scale-100 animate-fade-in">
				<LoadingSpinner size="lg" color="text-blue-500" message={message} />
			</div>
		</div>
	)
}

/**
 * Inline Loading - For loading within a component/section
 * @param {Object} props
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.message - Optional loading message
 * @param {number} props.minHeight - Minimum height in pixels (default: 200)
 */
export const InlineLoader = ({ isLoading, message = 'Đang tải...', minHeight = 200 }) => {
	if (!isLoading) return null

	return (
		<div
			className="flex items-center justify-center w-full"
			style={{ minHeight: `${minHeight}px` }}
		>
			<LoadingSpinner size="md" color="text-blue-500" message={message} />
		</div>
	)
}

/**
 * Button Loading - For loading state in buttons
 * @param {Object} props
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.children - Button content when not loading
 * @param {string} props.loadingText - Text to show when loading
 * @param {string} props.className - Additional CSS classes
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 */
export const ButtonLoader = ({
	isLoading,
	children,
	loadingText = 'Đang xử lý...',
	className = '',
	onClick,
	disabled = false,
	...props
}) => {
	return (
		<button
			onClick={onClick}
			disabled={isLoading || disabled}
			className={`flex items-center justify-center gap-2 ${className} ${
				isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''
			}`}
			{...props}
		>
			{isLoading && (
				<div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
			)}
			<span>{isLoading ? loadingText : children}</span>
		</button>
	)
}

/**
 * Skeleton Loader - For content placeholder while loading
 * @param {Object} props
 * @param {number} props.count - Number of skeleton rows (default: 3)
 * @param {string} props.height - Height of each skeleton (default: 'h-4')
 * @param {boolean} props.circular - Circular skeleton (for avatars)
 */
export const SkeletonLoader = ({ count = 3, height = 'h-4', circular = false }) => {
	return (
		<div className="space-y-3 animate-pulse">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className={`bg-gray-700/50 ${
						circular ? 'rounded-full w-12 h-12' : `rounded ${height}`
					}`}
				/>
			))}
		</div>
	)
}

/**
 * Card Loading Skeleton - For card components
 */
export const CardSkeleton = () => {
	return (
		<div className="bg-gray-800/50 rounded-xl p-6 border border-white/10 animate-pulse">
			<div className="flex items-center gap-4 mb-4">
				<div className="w-12 h-12 bg-gray-700/50 rounded-full" />
				<div className="flex-1 space-y-2">
					<div className="h-4 bg-gray-700/50 rounded w-3/4" />
					<div className="h-3 bg-gray-700/50 rounded w-1/2" />
				</div>
			</div>
			<div className="space-y-2">
				<div className="h-3 bg-gray-700/50 rounded w-full" />
				<div className="h-3 bg-gray-700/50 rounded w-5/6" />
				<div className="h-3 bg-gray-700/50 rounded w-4/6" />
			</div>
		</div>
	)
}

/**
 * Table Loading Skeleton - For table components
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
	return (
		<div className="space-y-3 animate-pulse">
			{/* Table Header */}
			<div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
				{Array.from({ length: cols }).map((_, index) => (
					<div key={index} className="h-10 bg-gray-700/50 rounded" />
				))}
			</div>
			{/* Table Rows */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div
					key={rowIndex}
					className="grid gap-4"
					style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
				>
					{Array.from({ length: cols }).map((_, colIndex) => (
						<div key={colIndex} className="h-8 bg-gray-700/30 rounded" />
					))}
				</div>
			))}
		</div>
	)
}

export default LoadingSpinner
