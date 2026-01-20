// contexts/ThemeContext.jsx
// ============================================================================
// THEME CONTEXT - Quản lý ảnh nền và theme toàn cục
// ============================================================================

import React, { createContext, useState, useEffect, useContext } from 'react'
import { uploadFile } from '../services/api/fileAPI'
import { getMyProfileAPI, updateProfileAPI } from '../services/api/authAPI'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

// Default background image
const DEFAULT_BACKGROUND =
	'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070'

/**
 * Get current user ID from localStorage
 */
const getCurrentUserId = () => {
	try {
		const user = localStorage.getItem('user')
		if (user) {
			const parsed = JSON.parse(user)
			return parsed.userId || null
		}
	} catch (e) {
		console.error('Error parsing user:', e)
	}
	return null
}

/**
 * Get localStorage key for background (per user)
 */
const getBackgroundKey = (userId) => {
	return userId ? `app_background_image_${userId}` : null
}

export const ThemeProvider = ({ children }) => {
	// State cho background image - always start with DEFAULT for public pages
	const [backgroundImage, setBackgroundImage] = useState(DEFAULT_BACKGROUND)

	// State cho theme settings khác (có thể mở rộng)
	const [theme, setTheme] = useState(() => {
		const saved = localStorage.getItem('app_theme')
		return saved || 'dark'
	})

	// State để theo dõi việc đã load từ profile chưa
	const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false)
	
	// State để track current user ID để detect user change
	const [currentLoadedUserId, setCurrentLoadedUserId] = useState(null)

	// Load background từ profile API khi user đăng nhập
	const loadBackgroundFromProfile = async () => {
		try {
			const userId = getCurrentUserId()
			
			// No user logged in - use default
			if (!userId) {
				setBackgroundImage(DEFAULT_BACKGROUND)
				setCurrentLoadedUserId(null)
				setIsBackgroundLoaded(true)
				return
			}

			// IMPORTANT: Reset to default FIRST before loading new user's background
			// This prevents showing old user's background while loading
			setBackgroundImage(DEFAULT_BACKGROUND)

			// Always fetch from API to get latest (don't trust cache for different users)
			console.log('📤 Loading background from profile for user:', userId)
			const response = await getMyProfileAPI()
			
			if (response.success && response.data?.imageBackground) {
				// User has custom background
				setBackgroundImage(response.data.imageBackground)
				// Cache for this user
				const cacheKey = getBackgroundKey(userId)
				if (cacheKey) {
					localStorage.setItem(cacheKey, response.data.imageBackground)
				}
				console.log('✅ Background loaded from profile:', response.data.imageBackground)
			} else {
				// No background in profile - use default
				setBackgroundImage(DEFAULT_BACKGROUND)
				console.log('ℹ️ No custom background in profile, using default')
			}
			
			setCurrentLoadedUserId(userId)
			setIsBackgroundLoaded(true)
		} catch (error) {
			console.error('❌ Failed to load background from profile:', error)
			setBackgroundImage(DEFAULT_BACKGROUND)
			setIsBackgroundLoaded(true)
		}
	}

	// Check if user changed and reload background
	useEffect(() => {
		const checkUserChange = () => {
			const userId = getCurrentUserId()
			
			// User changed or logged out
			if (userId !== currentLoadedUserId) {
				console.log('🔄 User changed, reloading background...', { from: currentLoadedUserId, to: userId })
				setIsBackgroundLoaded(false)
			}
		}
		
		// Check on mount and periodically (for same-tab login/logout detection)
		checkUserChange()
		const interval = setInterval(checkUserChange, 500)
		
		return () => clearInterval(interval)
	}, [currentLoadedUserId])

	// Load background khi component mount và user có session
	useEffect(() => {
		const user = localStorage.getItem('user')
		if (user && !isBackgroundLoaded) {
			loadBackgroundFromProfile()
		} else if (!user && !isBackgroundLoaded) {
			// No user - ensure default background
			setBackgroundImage(DEFAULT_BACKGROUND)
			setCurrentLoadedUserId(null)
			setIsBackgroundLoaded(true)
		}
	}, [isBackgroundLoaded])

	// Listen for user login/logout changes (storage event)
	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === 'user') {
				if (e.newValue) {
					// User logged in - reload background from profile
					setIsBackgroundLoaded(false)
				} else {
					// User logged out - reset to default
					setBackgroundImage(DEFAULT_BACKGROUND)
					setIsBackgroundLoaded(false)
				}
			}
		}

		window.addEventListener('storage', handleStorageChange)
		return () => window.removeEventListener('storage', handleStorageChange)
	}, [])

	// Lưu theme khi thay đổi
	useEffect(() => {
		localStorage.setItem('app_theme', theme)
	}, [theme])

	// ============================================================================
	// FUNCTIONS
	// ============================================================================

	/**
	 * Upload và set background image mới từ file
	 * Upload lên file service, lưu URL vào profile
	 * @param {File} file - File ảnh được upload
	 * @returns {Promise<string>} - URL của ảnh mới
	 */
	const uploadBackgroundImage = async (file) => {
		if (!file) {
			throw new Error('No file provided')
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			throw new Error('File must be an image')
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			throw new Error('Image size must be less than 5MB')
		}

		try {
			// 1. Upload file to file service
			console.log('📤 Uploading background image to file service...')
			const imageUrl = await uploadFile(file, 'image')
			console.log('✅ File uploaded, URL:', imageUrl)

			// 2. Save URL to profile
			console.log('💾 Saving background URL to profile...')
			const updateResult = await updateProfileAPI({ imageBackground: imageUrl })

			if (!updateResult.success) {
				throw new Error(updateResult.message || 'Failed to save background to profile')
			}
			console.log('✅ Background saved to profile')

			// 3. Update local state and cache
			setBackgroundImage(imageUrl)
			const userId = getCurrentUserId()
			const cacheKey = getBackgroundKey(userId)
			if (cacheKey) {
				localStorage.setItem(cacheKey, imageUrl)
			}

			return imageUrl
		} catch (error) {
			console.error('❌ Upload background error:', error)
			throw error
		}
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
	 * Reset về ảnh nền mặc định và lưu vào profile
	 */
	const resetBackground = async () => {
		try {
			// Save default to profile
			const updateResult = await updateProfileAPI({ imageBackground: DEFAULT_BACKGROUND })
			if (!updateResult.success) {
				console.warn('⚠️ Failed to save default background to profile')
			}

			setBackgroundImage(DEFAULT_BACKGROUND)
			const userId = getCurrentUserId()
			const cacheKey = getBackgroundKey(userId)
			if (cacheKey) {
				localStorage.setItem(cacheKey, DEFAULT_BACKGROUND)
			}
			console.log('✅ Background reset to default')
		} catch (error) {
			console.error('❌ Reset background error:', error)
			// Still reset locally even if API fails
			setBackgroundImage(DEFAULT_BACKGROUND)
		}
	}

	/**
	 * Toggle theme dark/light
	 */
	const toggleTheme = () => {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
	}

	/**
	 * Reload background từ profile (gọi khi user login)
	 */
	const reloadBackgroundFromProfile = () => {
		setIsBackgroundLoaded(false)
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
		reloadBackgroundFromProfile,
		loadBackgroundFromProfile,

		// Constants
		DEFAULT_BACKGROUND,
	}

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
