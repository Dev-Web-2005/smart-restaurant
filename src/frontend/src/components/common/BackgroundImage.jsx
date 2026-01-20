// components/common/BackgroundImage.jsx
// ============================================================================
// BACKGROUND IMAGE COMPONENT - Component tái sử dụng cho ảnh nền
// ============================================================================

import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * Component hiển thị ảnh nền với overlay tối
 * Sử dụng global background image từ ThemeContext
 *
 * @param {object} props
 * @param {number} props.overlayOpacity - Độ mờ của overlay (0-100), default: 75
 * @param {boolean} props.fixed - Background attachment fixed hay không, default: true
 * @param {boolean} props.useDefault - Luôn dùng ảnh mặc định (cho login page), default: false
 */
const BackgroundImage = ({ overlayOpacity = 75, fixed = true, useDefault = false }) => {
	const { backgroundImage, DEFAULT_BACKGROUND } = useTheme()

	// Use default background for public pages (login, signup, etc.)
	const displayBackground = useDefault ? DEFAULT_BACKGROUND : backgroundImage

	return (
		<div
			className="fixed inset-0 -z-10"
			style={{
				backgroundImage: `url("${displayBackground}")`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundAttachment: fixed ? 'fixed' : 'scroll',
			}}
		>
			{/* Dark overlay to reduce contrast */}
			<div
				className="absolute inset-0 bg-black"
				style={{ opacity: overlayOpacity / 100 }}
			/>
		</div>
	)
}

export default BackgroundImage
