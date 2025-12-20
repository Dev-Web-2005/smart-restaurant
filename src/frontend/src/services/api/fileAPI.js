// services/api/fileAPI.js
// File Upload Service - External API via Vite proxy
// Proxy: /api/file -> https://file-service-cdal.onrender.com/api/v1/file

import axios from 'axios'

// Use local proxy to avoid CORS issues
// In development: /api/file -> https://file-service-cdal.onrender.com/api/v1/file
const FILE_SERVICE_BASE_URL = '/api/file'

/**
 * Upload a single file to the file service
 * @param {File} file - File object to upload
 * @param {string} fieldName - Field name for FormData (default: 'image')
 * @returns {Promise<string>} URL of the uploaded file
 */
export const uploadFile = async (file, fieldName = 'image') => {
	try {
		// Create FormData with id and image fields as required by API
		const formData = new FormData()
		formData.append('id', Date.now().toString())
		formData.append(fieldName, file)

		// Upload via proxy (x-api-key added automatically)
		const response = await axios.post(`${FILE_SERVICE_BASE_URL}/uploads`, formData, {
			timeout: 60000,
		})

		const url = response.data?.result?.image

		if (!url) {
			throw new Error('No URL returned from file service')
		}

		return url
	} catch (error) {
		console.error('❌ File upload error:', error)

		// Handle different error scenarios
		if (error.code === 'ECONNABORTED') {
			throw new Error('File upload timeout. Please try again.')
		}

		if (error.response?.status === 413) {
			throw new Error('File is too large. Maximum size is 5MB.')
		}

		if (error.response?.status === 415) {
			throw new Error('File type not supported. Please use PNG, JPG, or PDF.')
		}

		throw new Error(error.response?.data?.message || 'Failed to upload file')
	}
}

/**
 * Upload multiple files to the file service
 * @param {File[]} files - Array of File objects to upload
 * @param {string} fieldName - Field name for FormData (default: 'files')
 * @returns {Promise<string[]>} Array of URLs of the uploaded files
 */
export const uploadFiles = async (files, fieldName = 'image') => {
	try {
		// Upload each file separately
		const uploadPromises = files.map((file) => uploadFile(file, fieldName))
		const urls = await Promise.all(uploadPromises)

		if (!urls.length) {
			throw new Error('No URLs returned from file service')
		}

		return urls
	} catch (error) {
		console.error('❌ Multiple file upload error:', error)

		// Handle different error scenarios
		if (error.code === 'ECONNABORTED') {
			throw new Error('File upload timeout. Please try again.')
		}

		if (error.response?.status === 413) {
			throw new Error('One or more files are too large. Maximum size is 5MB per file.')
		}

		if (error.response?.status === 415) {
			throw new Error(
				'One or more file types not supported. Please use PNG, JPG, or PDF.',
			)
		}

		throw new Error(error.response?.data?.message || 'Failed to upload files')
	}
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string | null }
 */
export const validateFile = (file, options = {}) => {
	const {
		maxSize = 5 * 1024 * 1024,
		allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
	} = options
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${
				maxSize / (1024 * 1024)
			}MB. Please choose a smaller file.`,
		}
	}

	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
		}
	}

	return { valid: true, error: null }
}

/**
 * Upload CCCD images (front and back) and return URLs
 * @param {File} frontFile - Front side of CCCD
 * @param {File} backFile - Back side of CCCD
 * @returns {Promise<{ frontImageUrl: string, backImageUrl: string }>}
 */
export const uploadCCCDImages = async (frontFile, backFile) => {
	try {
		// Validate files
		const frontValidation = validateFile(frontFile)
		if (!frontValidation.valid) {
			throw new Error(`Front image: ${frontValidation.error}`)
		}

		const backValidation = validateFile(backFile)
		if (!backValidation.valid) {
			throw new Error(`Back image: ${backValidation.error}`)
		}

		// Upload both files
		const urls = await uploadFiles([frontFile, backFile], 'image')

		if (urls.length !== 2) {
			throw new Error('Failed to upload both CCCD images')
		}

		return {
			frontImageUrl: urls[0],
			backImageUrl: urls[1],
		}
	} catch (error) {
		console.error('❌ CCCD upload error:', error)
		throw error
	}
}

export default {
	uploadFile,
	uploadFiles,
	validateFile,
	uploadCCCDImages,
}
