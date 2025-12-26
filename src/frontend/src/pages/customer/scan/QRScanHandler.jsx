import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../../services/apiClient'

/**
 * QR Scan Handler - Validates QR token and redirects to ordering interface
 * Route: /tenants/:tenantId/tables/scan/:token
 */
const QRScanHandler = () => {
	const { tenantId, token } = useParams()
	const navigate = useNavigate()
	const [error, setError] = useState(null)
	const [validating, setValidating] = useState(true)

	useEffect(() => {
		const validateToken = async () => {
			try {
				console.log('🔍 Validating QR token:', { tenantId, token })

				// Call backend to validate token
				const response = await apiClient.get(`/tenants/${tenantId}/tables/scan/${token}`)

				console.log('✅ Validation response:', response.data)
				const { code, data, message, redirect } = response.data

				// Backend có thể trả về 2 format:
				// 1. { code, data: { tableId }, message }
				// 2. { redirect: "/order/..." }
				if (redirect) {
					// Format 2: Backend trả về redirect URL
					console.log('🔀 Redirecting to:', redirect)
					navigate(redirect, { replace: true })
				} else if (code === 1000 || code === 200) {
					// Format 1: Backend trả về tableId
					const { tableId } = data
					console.log('🔀 Redirecting to:', `/order/${tenantId}/table/${tableId}`)
					navigate(`/order/${tenantId}/table/${tableId}`, { replace: true })
				} else {
					console.error('❌ Validation failed:', { code, message })
					setError(message || 'Invalid QR code')
					setValidating(false)
				}
			} catch (err) {
				console.error('❌ QR validation error:', err)
				console.error('Response:', err.response?.data)
				setError(
					err.response?.data?.message ||
						'QR code không hợp lệ hoặc đã hết hạn. Vui lòng quét lại.',
				)
				setValidating(false)
			}
		}

		validateToken()
	}, [tenantId, token, navigate])

	if (validating) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
					<p className="text-xl font-semibold text-gray-700">Đang xác thực QR code...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
				<div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl text-center">
					<div className="text-6xl mb-4">❌</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">QR Code Không Hợp Lệ</h1>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => navigate('/')}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Về Trang Chủ
					</button>
				</div>
			</div>
		)
	}

	return null
}

export default QRScanHandler
