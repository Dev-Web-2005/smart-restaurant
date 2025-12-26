// contexts/ThemeContext.jsx
// ============================================================================
// THEME CONTEXT - Quản lý ảnh nền và theme toàn cục
// ============================================================================

import React, { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

// Default background image
const DEFAULT_BACKGROUND =
	'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070'

export const ThemeProvider = ({ children }) => {
	// State cho background image
	const [backgroundImage, setBackgroundImage] = useState(() => {
		// Load từ localStorage nếu có
		const saved = localStorage.getItem('app_background_image')
		return saved || DEFAULT_BACKGROUND
	})

	// State cho theme settings khác (có thể mở rộng)
	const [theme, setTheme] = useState(() => {
		const saved = localStorage.getItem('app_theme')
		return saved || 'dark'
	})

	// Lưu background image khi thay đổi
	useEffect(() => {
		localStorage.setItem('app_background_image', backgroundImage)
	}, [backgroundImage])

	// Lưu theme khi thay đổi
	useEffect(() => {
		localStorage.setItem('app_theme', theme)
	}, [theme])

	// ============================================================================
	// FUNCTIONS
	// ============================================================================

	/**
	 * Upload và set background image mới từ file
	 * @param {File} file - File ảnh được upload
	 * @returns {Promise<string>} - URL của ảnh mới
	 */
	const uploadBackgroundImage = async (file) => {
		return new Promise((resolve, reject) => {
			if (!file) {
				reject(new Error('No file provided'))
				return
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				reject(new Error('File must be an image'))
				return
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				reject(new Error('Image size must be less than 5MB'))
				return
			}

			const reader = new FileReader()

			reader.onload = (e) => {
				const imageUrl = e.target.result
				setBackgroundImage(imageUrl)
				console.log('✅ Background image updated')
				resolve(imageUrl)
			}

			reader.onerror = () => {
				reject(new Error('Failed to read file'))
			}

			reader.readAsDataURL(file)
		})
	}

	/**
	 * Set background image từ URL
	 * @param {string} url - URL của ảnh
	 */
	const setBackgroundFromUrl = (url) => {
		if (!url) {
			console.warn('⚠️ No URL provided')
			return
		}
		setBackgroundImage(url)
		console.log('✅ Background image updated from URL')
	}

	/**
	 * Reset về ảnh nền mặc định
	 */
	const resetBackground = () => {
		setBackgroundImage(DEFAULT_BACKGROUND)
		console.log('✅ Background reset to default')
	}

	/**
	 * Toggle theme dark/light
	 */
	const toggleTheme = () => {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
	}

	// ============================================================================
	// CONTEXT VALUE
	// ============================================================================

	const value = {
		// States
		backgroundImage,
		theme,

		// Functions
		uploadBackgroundImage,
		setBackgroundFromUrl,
		resetBackground,
		setTheme,
		toggleTheme,

		// Constants
		DEFAULT_BACKGROUND,
	}

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
