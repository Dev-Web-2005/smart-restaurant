import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../../services/apiClient'
import CustomerAuth from '../ordering/pages/CustomerAuth'

/**
 * QR Scan Handler - Validates QR token and shows login before ordering
 * Route: /tenants/:tenantId/tables/scan/:token
 */
const QRScanHandler = () => {
	const { tenantId, token } = useParams()
	const navigate = useNavigate()
	const [error, setError] = useState(null)
	const [validating, setValidating] = useState(true)
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [tableInfo, setTableInfo] = useState(null)

	useEffect(() => {
		const validateToken = async () => {
			try {
				console.log('🔍 Validating QR token:', { tenantId, token })

				// Call backend to validate token
				const response = await apiClient.get(`/tenants/${tenantId}/tables/scan/${token}`)

				console.log('✅ Validation response:', response.data)
				const { code, data, message } = response.data

				if (code === 1000 || code === 200) {
					// Token valid - store info and show login
					const { tableId, tableNumber } = data
					setTableInfo({ tableId, tableNumber: tableNumber || tableId })

					// Store BOTH tableId (UUID for API) and tableNumber (display) in localStorage
					localStorage.setItem('currentOwnerId', tenantId)
					localStorage.setItem('currentTenantId', tenantId)
					localStorage.setItem('currentTableId', tableId) // UUID for API calls
					localStorage.setItem('currentTableNumber', tableNumber || tableId) // Display name

					console.log('💾 Stored table info:', { tenantId, tableId, tableNumber })

					setValidating(false)
					setShowAuthModal(true)
				} else {
					console.error('❌ Validation failed:', { code, message })
					setError(message || 'Invalid QR code')
					setValidating(false)
				}
			} catch (err) {
				console.error('❌ QR validation error:', err)
				setError(
					err.response?.data?.message ||
						'QR code không hợp lệ hoặc đã hết hạn. Vui lòng quét lại.',
				)
				setValidating(false)
			}
		}

		validateToken()
	}, [tenantId, token])

	const handleAuthSuccess = (customer) => {
		console.log('✅ Customer authenticated:', customer)
		setShowAuthModal(false)

		// Navigate to ordering interface with tableId (UUID, not tableNumber)
		const storedTableId = tableInfo?.tableId || localStorage.getItem('currentTableId')
		if (!storedTableId) {
			console.error('❌ Missing tableId')
			alert('Table information not found. Please scan QR code again.')
			return
		}

		console.log('🔀 Navigating to ordering interface:', {
			tenantId,
			tableId: storedTableId,
		})
		navigate(`/order/${tenantId}/table/${storedTableId}`, { replace: true })
	}

	const handleAuthClose = () => {
		setShowAuthModal(false)
	}

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

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					}}
				></div>
			</div>

			{/* Welcome Message when modal closed */}
			{!showAuthModal && (
				<div className="min-h-screen flex items-center justify-center">
					<div className="relative z-10 text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl max-w-md">
						<div className="text-6xl mb-4">🍽️</div>
						<h1 className="text-3xl font-bold text-white mb-4">Welcome!</h1>
						<p className="text-white/90 mb-2">
							You're at Table {tableInfo?.tableNumber || 'N/A'}
						</p>
						<p className="text-white/70 mb-6">Please login to start ordering</p>
						<button
							onClick={() => setShowAuthModal(true)}
							className="px-8 py-3 bg-white text-purple-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
						>
							Login / Sign Up
						</button>
					</div>
				</div>
			)}

			{/* Auth Modal */}
			{showAuthModal && (
				<CustomerAuth
					onClose={handleAuthClose}
					onSuccess={handleAuthSuccess}
					tenantId={tenantId}
				/>
			)}
		</div>
	)
}

export default QRScanHandler
