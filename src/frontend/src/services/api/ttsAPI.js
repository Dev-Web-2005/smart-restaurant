/**
 * Text-to-Speech API Service
 * Uses ElevenLabs API via backend notification service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888'

/**
 * Convert text to speech using ElevenLabs
 * @param {string} text - Text to convert (max 5000 characters)
 * @param {string} token - JWT authentication token
 * @returns {Promise<{success: boolean, data?: {audio: string, mimeType: string}, message?: string}>}
 */
export const textToSpeechAPI = async (text, token) => {
	try {
		console.log('🔊 TTS API Request:', {
			url: `${API_BASE_URL}/api/v1/notification/tts`,
			textLength: text.length,
			hasToken: !!token,
			tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
		})

		const response = await fetch(`${API_BASE_URL}/api/v1/notification/tts`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ text }),
		})

		const result = await response.json()

		console.log('🔊 TTS API Response:', {
			status: response.status,
			ok: response.ok,
			resultStructure: {
				hasCode: 'code' in result,
				hasMessage: 'message' in result,
				hasData: 'data' in result,
				hasStatusCode: 'statusCode' in result,
			},
			result,
		})

		if (!response.ok) {
			return {
				success: false,
				message: result.message || result.error || 'Failed to convert text to speech',
			}
		}

		// Handle both response structures:
		// 1. Direct: {code, message, data: {audio, mimeType}}
		// 2. Wrapped: {statusCode, message, data: {audio, mimeType}}
		const data = result.data

		if (!data) {
			console.error('❌ No data in response:', result)
			return {
				success: false,
				message: 'No audio data in response',
			}
		}

		if (!data.audio) {
			console.error('❌ No audio in data:', data)
			return {
				success: false,
				message: 'No audio field in response data',
			}
		}

		console.log('✅ TTS API Success:', {
			audioLength: data.audio.length,
			mimeType: data.mimeType || 'audio/mpeg',
		})

		return {
			success: true,
			data: {
				audio: data.audio,
				mimeType: data.mimeType || 'audio/mpeg',
			},
		}
	} catch (error) {
		console.error('❌ TTS API Error:', error)
		return {
			success: false,
			message: error.message || 'Network error',
		}
	}
}

/**
 * Play audio from base64 string
 * @param {string} base64Audio - Base64 encoded audio data
 * @param {string} mimeType - Audio mime type (default: audio/mpeg)
 * @returns {Promise<void>}
 */
export const playAudioFromBase64 = (base64Audio, mimeType = 'audio/mpeg') => {
	return new Promise((resolve, reject) => {
		try {
			console.log('🔊 Playing audio:', {
				audioLength: base64Audio.length,
				mimeType,
			})

			const audio = new Audio(`data:${mimeType};base64,${base64Audio}`)

			audio.onended = () => {
				console.log('✅ Audio playback completed')
				resolve()
			}
			audio.onerror = (error) => {
				console.error('❌ Audio playback error:', error)
				reject(error)
			}

			audio
				.play()
				.then(() => {
					console.log('▶️ Audio started playing')
				})
				.catch((error) => {
					console.error('❌ Audio play() failed:', error)
					reject(error)
				})
		} catch (error) {
			console.error('❌ Error creating audio:', error)
			reject(error)
		}
	})
}

/**
 * Convert text to speech and play immediately
 * @param {string} text - Text to speak
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Success status
 */
export const speakText = async (text, token) => {
	try {
		const result = await textToSpeechAPI(text, token)

		if (!result.success) {
			console.error('❌ TTS failed:', result.message)
			return false
		}

		await playAudioFromBase64(result.data.audio, result.data.mimeType)
		return true
	} catch (error) {
		console.error('❌ Error playing audio:', error)
		return false
	}
}
