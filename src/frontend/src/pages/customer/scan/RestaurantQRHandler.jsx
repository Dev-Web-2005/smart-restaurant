import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CustomerAuth from '../ordering/pages/CustomerAuth'
import apiClient from '../../../services/apiClient'

/**
 * Restaurant QR Handler - TOKEN-BASED VERSION
 * Route: /restaurant/:ownerId/:token/:tableNumber
 *
 * When customer scans restaurant QR code, they are directed here.
 * Validates the token before showing login/signup modal.
 */
const RestaurantQRHandler = () => {
	const { ownerId, token, tableNumber } = useParams()
	const navigate = useNavigate()
	const [validating, setValidating] = useState(true)
	const [validationError, setValidationError] = useState(null)
	const [restaurantInfo, setRestaurantInfo] = useState(null)

	const validateQrToken = async () => {
		try {
			setValidating(true)
			const response = await apiClient.post(
				`/identity/users/restaurant-qr/validate/${ownerId}/${token}`,
			)

			if (response.data.code === 200 && response.data.data) {
				const data = response.data.data
				if (data.valid) {
					// Token is valid
					setRestaurantInfo(data)
					// Store ownerId and tableNumber in localStorage for persistence
					localStorage.setItem('currentOwnerId', ownerId)
					localStorage.setItem('currentTenantId', ownerId)
					if (tableNumber) {
						localStorage.setItem('currentTableNumber', tableNumber)
					}
					console.log(
						'✅ Restaurant QR validated - ownerId:',
						ownerId,
						'tableNumber:',
						tableNumber,
					)
				} else {
					// Token is invalid
					setValidationError(data.message || 'Invalid or expired QR code')
				}
			} else {
				setValidationError('Validation failed. Please try again.')
			}
		} catch (error) {
			console.error('Error validating QR:', error)
			setValidationError(
				error.response?.data?.message || 'Failed to validate QR code. Please try again.',
			)
		} finally {
			setValidating(false)
		}
	}

	useEffect(() => {
		if (ownerId && token) {
			validateQrToken()
		} else {
			setValidating(false)
			setValidationError('Missing required parameters')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ownerId, token])

	const handleAuthSuccess = (customer) => {
		console.log('✅ Customer authenticated:', customer)

		// Handle guest mode
		if (customer?.isGuest) {
			console.log('🚶 Guest mode - no authentication required')
			localStorage.setItem('isGuestMode', 'true')
			// Remove any existing auth tokens for guest
			localStorage.removeItem('authToken')
			localStorage.removeItem('customerAuth')
			localStorage.removeItem('customerData')
		} else {
			// Normal login - store customer data
			localStorage.setItem('isGuestMode', 'false')
			if (customer?.token) {
				localStorage.setItem('authToken', customer.token)
			}
			if (customer) {
				// Store in customerAuth (used by ProfilePage)
				localStorage.setItem('customerAuth', JSON.stringify(customer))
			}
		}

		// Check if tableNumber exists from QR code
		if (tableNumber) {
			// Table QR - navigate directly to that table
			const table = tableNumber || '0'
			localStorage.setItem('currentTableNumber', table)
			navigate(`/order/${ownerId}/table/${table}`)
		} else {
			// Restaurant QR - show table selection
			navigate(`/select-table/${ownerId}`)
		}
	}

	const handleAuthClose = () => {
		// Do nothing - customer cannot close the modal
	}

	// Validating state
	if (validating) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
				<div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Validating QR Code...
					</h2>
					<p className="text-gray-600">Please wait a moment</p>
				</div>
			</div>
		)
	}

	// Error state
	if (validationError) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
				<div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl text-center">
					<div className="text-6xl mb-4">❌</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid QR Code</h1>
					<p className="text-gray-600 mb-6">{validationError}</p>
					<button
						onClick={() => navigate('/')}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Go Home
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					}}
				></div>
			</div>

			{/* Auth Modal - Always show */}
			<CustomerAuth
				onClose={handleAuthClose}
				onSuccess={handleAuthSuccess}
				tenantId={ownerId}
			/>
		</div>
	)
}

export default RestaurantQRHandler
