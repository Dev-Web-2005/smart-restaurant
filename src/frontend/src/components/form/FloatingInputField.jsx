import React, { useState } from 'react'

/**
 * FloatingInputField - Material Design Floating Label Input Component
 *
 * A reusable input field component with floating label animation.
 * Supports dark theme and follows Material Design principles.
 *
 * @param {string} label - The floating label text
 * @param {string} type - Input type (text, email, password, tel, etc.)
 * @param {string} value - Current input value
 * @param {function} onChange - Change handler function
 * @param {string} id - Input field ID
 * @param {string} name - Input field name
 * @param {string} placeholder - Optional placeholder (shown when focused)
 * @param {boolean} disabled - Disable input field
 * @param {boolean} required - Mark field as required
 * @param {string} className - Additional CSS classes
 * @param {string} error - Error message to display
 * @param {object} icon - Optional icon element to display
 * @param {string} iconPosition - Icon position: 'left' or 'right'
 */
const FloatingInputField = ({
	label,
	type = 'text',
	value = '',
	onChange,
	id,
	name,
	placeholder = '',
	disabled = false,
	required = false,
	className = '',
	error = '',
	icon = null,
	iconPosition = 'left',
	...rest
}) => {
	const [isFocused, setIsFocused] = useState(false)

	// Determine if label should float
	const shouldFloat = isFocused || value !== ''

	// Determine border color based on state
	const getBorderColor = () => {
		if (error) return 'border-red-500'
		if (isFocused) return 'border-[#137fec]'
		return 'border-white/20'
	}

	// Determine label color based on state
	const getLabelColor = () => {
		if (error) return 'text-red-400'
		if (isFocused) return 'text-[#137fec]'
		if (shouldFloat) return 'text-gray-300'
		return 'text-gray-400'
	}

	return (
		<div className={`relative w-full ${className}`}>
			{/* Input Container */}
			<div className="relative">
				{/* Left Icon */}
				{icon && iconPosition === 'left' && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
						{icon}
					</div>
				)}

				{/* Input Field */}
				<input
					type={type}
					id={id}
					name={name}
					value={value}
					onChange={onChange}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					disabled={disabled}
					required={required}
					placeholder={isFocused ? placeholder : ''}
					className={`
						peer
						w-full h-12
						rounded-lg
						bg-black/40 backdrop-blur-md
						border-2 ${getBorderColor()}
						px-4 ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${
						icon && iconPosition === 'right' ? 'pr-10' : ''
					}
						${shouldFloat ? 'pt-0' : 'pt-4'}
						text-base text-white
						placeholder:text-gray-500
						outline-none
						transition-all duration-200
						disabled:opacity-50 disabled:cursor-not-allowed
						focus:shadow-[0_0_0_3px_rgba(19,127,236,0.1)]
						autofill:bg-black/40 autofill:text-white
						autofill:shadow-[inset_0_0_0_1000px_rgba(0,0,0,0.4)]
						autofill:[-webkit-text-fill-color:white]
					`}
					style={{
						WebkitBoxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.4) inset',
						WebkitTextFillColor: 'white',
						transition: 'background-color 5000s ease-in-out 0s',
					}}
					{...rest}
				/>

				{/* Floating Label */}
				<label
					htmlFor={id}
					className={`
						absolute
						left-4 ${icon && iconPosition === 'left' ? 'left-10' : ''}
						pointer-events-none
						transition-all duration-200 ease-out
						${getLabelColor()}
						${
							shouldFloat
								? 'top-0 -translate-y-1/2 text-xs px-1 bg-black/80 backdrop-blur-md'
								: 'top-1/2 -translate-y-1/2 text-base'
						}
					`}
				>
					{label}
					{required && <span className="text-red-400 ml-1">*</span>}
				</label>

				{/* Right Icon */}
				{icon && iconPosition === 'right' && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
						{icon}
					</div>
				)}
			</div>

			{/* Error Message */}
			{error && (
				<p className="mt-1 text-xs text-red-400 flex items-center gap-1">
					<span className="material-symbols-outlined text-sm">error</span>
					{error}
				</p>
			)}
		</div>
	)
}

export default FloatingInputField
