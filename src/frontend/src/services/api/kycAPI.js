// services/api/kycAPI.js
// KYC Verification Service - Didit Business Identity Verification

import axios from 'axios'

// ✅ Direct API call - CORS is enabled on server
const DIDIT_API_BASE = 'https://verification.didit.me/v2'

// ✅ Environment variables from .env and GitHub Secrets
const DIDIT_API_KEY = import.meta.env.VITE_DIDIT_API_KEY
const DIDIT_WORKFLOW_ID = import.meta.env.VITE_DIDIT_WORKFLOW_ID
const DIDIT_CALLBACK_URL = import.meta.env.VITE_DIDIT_CALLBACK_URL

/**
 * Create KYC verification session
 * @param {string} userId - User identifier for vendor_data
 * @param {string} email - User email for contact details
 * @param {string} phone - User phone for contact details
 * @returns {Promise<{sessionId: string, verificationUrl: string}>}
 */
export const createKYCSession = async (userId, email, phone) => {
	try {
		const payload = {
			workflow_id: DIDIT_WORKFLOW_ID,
			// No callback URL - we'll poll for results instead of redirect
			vendor_data: `user-${userId}-${Date.now()}`,
			metadata: {
				created: new Date().toISOString(),
				purpose: 'Restaurant Owner Identity Verification',
				extract_data: true,
				user_id: userId,
			},
			contact_details: {
				email: email || 'noreply@spillproofpos.com',
				email_lang: 'vi',
				phone: phone || '+84000000000',
			},
		}

		// ✅ Direct API call with X-Api-Key header
		const response = await axios.post(`${DIDIT_API_BASE}/session/`, payload, {
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': DIDIT_API_KEY,
			},
			timeout: 15000,
		})

		const { session_id, url, status } = response.data

		return {
			success: true,
			sessionId: session_id,
			verificationUrl: url,
			status,
		}
	} catch (error) {
		console.error('❌ Failed to create KYC session:', error)

		if (error.response?.status === 401) {
			throw new Error('Invalid API key. Please check configuration.')
		}

		if (error.response?.status === 400) {
			throw new Error('Invalid KYC session parameters.')
		}

		throw new Error(
			error.response?.data?.message || 'Failed to create verification session',
		)
	}
}

/**
 * Get KYC session result by session_id using decision endpoint
 * @param {string} sessionId - Didit session ID
 * @returns {Promise<Object>} KYC verification result with extracted data
 */
export const getKYCResult = async (sessionId) => {
	try {
		// ✅ Direct API call with X-Api-Key header
		const response = await axios.get(`${DIDIT_API_BASE}/session/${sessionId}/decision/`, {
			headers: {
				'X-Api-Key': DIDIT_API_KEY,
			},
			timeout: 15000,
		})

		const result = response.data

		return {
			success: true,
			data: result,
			status: result.status,
		}
	} catch (error) {
		console.error('❌ Failed to fetch KYC result:', error)

		if (error.response?.status === 404) {
			throw new Error('KYC session not found')
		}

		throw new Error(
			error.response?.data?.message || 'Failed to fetch verification result',
		)
	}
}

/**
 * Extract CCCD images from KYC result
 * @param {Object} kycResult - Full KYC result from Didit
 * @returns {Object} Extracted CCCD images { frontImage, backImage, portraitImage, citizenInfo }
 */
export const extractCCCDImages = (kycResult) => {
	try {
		const { id_verification, status } = kycResult

		if (status !== 'Approved') {
			throw new Error(`Verification not approved. Status: ${status}`)
		}

		if (!id_verification) {
			throw new Error('No ID verification data found')
		}

		const { front_image, back_image, portrait_image, document_data } = id_verification

		// Extract citizen information from OCR data
		const citizenInfo = document_data
			? {
					fullName: document_data.full_name || '',
					idNumber: document_data.personal_number || document_data.document_number || '',
					dateOfBirth: document_data.date_of_birth || '',
					gender: document_data.gender || '',
					nationality: document_data.nationality || '',
					address: document_data.address || '',
					issueDate: document_data.issue_date || '',
					expiryDate: document_data.expiry_date || '',
			  }
			: null

		return {
			success: true,
			frontImage: front_image,
			backImage: back_image,
			portraitImage: portrait_image,
			citizenInfo,
			verificationStatus: status,
		}
	} catch (error) {
		console.error('❌ Failed to extract CCCD images:', error)
		throw error
	}
}

/**
 * Validate KYC session status
 * @param {string} sessionId - Didit session ID
 * @returns {Promise<{isApproved: boolean, status: string}>}
 */
export const validateKYCStatus = async (sessionId) => {
	try {
		const result = await getKYCResult(sessionId)

		const isApproved = result.data.status === 'Approved'

		return {
			success: true,
			isApproved,
			status: result.data.status,
			sessionId,
		}
	} catch (error) {
		console.error('❌ Failed to validate KYC status:', error)
		return {
			success: false,
			isApproved: false,
			status: 'Error',
			error: error.message,
		}
	}
}

/**
 * Upload image URL to backend (re-upload from Didit S3 to our file service)
 * @param {string} imageUrl - Didit S3 URL (signed URL)
 * @returns {Promise<string>} New permanent URL from our file service
 */
export const reuploadImageFromURL = async (imageUrl) => {
	try {
		// Fetch image as blob from Didit S3
		const imageResponse = await axios.get(imageUrl, {
			responseType: 'blob',
			timeout: 30000,
		})

		// Create File object from blob
		const blob = imageResponse.data
		const file = new File([blob], `cccd-${Date.now()}.jpg`, { type: 'image/jpeg' })

		// Upload to our file service via existing fileAPI
		// Import fileAPI dynamically to avoid circular dependency
		const { uploadFile } = await import('./fileAPI.js')
		const permanentUrl = await uploadFile(file, 'image')

		return permanentUrl
	} catch (error) {
		console.error('❌ Failed to re-upload image:', error)
		throw new Error('Failed to save verification image')
	}
}

/**
 * Complete KYC verification flow - get result and extract images
 * @param {string} sessionId - Didit session ID
 * @returns {Promise<{cccdFrontUrl, cccdBackUrl, citizenInfo}>}
 */
export const completeKYCVerification = async (sessionId) => {
	try {
		// 1. Get KYC result
		const { data: kycResult } = await getKYCResult(sessionId)

		// 2. Extract CCCD images
		const { frontImage, backImage, citizenInfo, verificationStatus } =
			extractCCCDImages(kycResult)

		if (verificationStatus !== 'Approved') {
			throw new Error('Identity verification was not approved')
		}

		// 3. Re-upload images to our permanent storage
		const [cccdFrontUrl, cccdBackUrl] = await Promise.all([
			reuploadImageFromURL(frontImage),
			reuploadImageFromURL(backImage),
		])

		return {
			success: true,
			cccdFrontUrl,
			cccdBackUrl,
			citizenInfo,
			sessionId,
		}
	} catch (error) {
		console.error('❌ KYC verification failed:', error)
		throw error
	}
}
