// api/kyc/session.js
// ⚠️ DEPRECATED: This Vercel Edge Function is no longer needed
// KYC API now supports CORS - frontend makes direct API calls
// See: src/services/api/kycAPI.js
//
// Kept for backward compatibility only

import axios from 'axios'

const DIDIT_API_BASE = 'https://verification.didit.me/v2'
const DIDIT_API_KEY = process.env.VITE_DIDIT_API_KEY

export default async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	// Check if API key is configured
	if (!DIDIT_API_KEY) {
		console.error('❌ VITE_DIDIT_API_KEY not configured in Vercel environment')
		return res.status(500).json({
			error: 'KYC service not configured',
			message: 'VITE_DIDIT_API_KEY environment variable is missing',
		})
	}

	try {
		const payload = req.body

		console.log('📤 Proxying KYC session request to Didit API')

		// Forward request to Didit API
		const response = await axios.post(`${DIDIT_API_BASE}/session`, payload, {
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': DIDIT_API_KEY,
			},
			timeout: 15000,
		})

		console.log('✅ KYC session created successfully')

		// Return response to client
		return res.status(200).json(response.data)
	} catch (error) {
		console.error('❌ Didit API error:', error.response?.data || error.message)

		// Return error to client
		return res.status(error.response?.status || 500).json({
			error: error.response?.data?.error || 'Failed to create KYC session',
			message: error.response?.data?.message || error.message,
		})
	}
}
