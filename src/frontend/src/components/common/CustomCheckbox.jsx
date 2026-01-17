import React from 'react'
import PropTypes from 'prop-types'

/**
 * CustomCheckbox - Styled checkbox for selecting items
 *
 * Features:
 * - Animated check icon
 * - Custom color variants
 * - Size options
 * - Disabled state support
 */
const CustomCheckbox = ({
	checked = false,
	onChange,
	disabled = false,
	size = 'md',
	variant = 'primary',
	className = '',
	title = '',
}) => {
	// Size configurations
	const sizeClasses = {
		sm: 'w-5 h-5',
		md: 'w-7 h-7',
		lg: 'w-9 h-9',
	}

	const iconSizes = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
	}

	// Variant configurations (when checked)
	const variantClasses = {
		primary: 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50',
		orange: 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/50',
		green: 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50',
		red: 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50',
	}

	const handleClick = (e) => {
		e.stopPropagation()
		if (!disabled && onChange) {
			onChange(!checked)
		}
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			title={title}
			className={`
				${sizeClasses[size]}
				rounded-lg border-2 flex items-center justify-center
				transition-all duration-200
				${
					disabled
						? 'opacity-50 cursor-not-allowed bg-gray-600/50 border-gray-500'
						: 'hover:scale-110 active:scale-95 cursor-pointer'
				}
				${
					checked
						? variantClasses[variant]
						: 'bg-white/10 border-white/30 hover:border-blue-400/50'
				}
				${className}
			`}
		>
			{checked && (
				<span
					className={`material-symbols-outlined text-white ${iconSizes[size]} animate-in fade-in zoom-in duration-150`}
				>
					check
				</span>
			)}
		</button>
	)
}

CustomCheckbox.propTypes = {
	checked: PropTypes.bool,
	onChange: PropTypes.func,
	disabled: PropTypes.bool,
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	variant: PropTypes.oneOf(['primary', 'orange', 'green', 'red']),
	className: PropTypes.string,
	title: PropTypes.string,
}

export default CustomCheckbox
