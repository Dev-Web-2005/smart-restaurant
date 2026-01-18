import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import apiClient from '../../../services/apiClient'

const GoogleAuthenticate = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const hasProcessed = useRef(false)

	const navigateOnFailure = (ownerId, tableNumber) => {
		if (ownerId && tableNumber) {
			navigate(`/select-table/${ownerId}`, { replace: true })
		} else if (ownerId) {
			navigate(`/select-table/${ownerId}`, { replace: true })
		} else {
			navigate('/', { replace: true })
		}
	}

	useEffect(() => {
		if (hasProcessed.current) {
			return
		}

		const handleGoogleCallback = async () => {
			const params = new URLSearchParams(location.search)
			const code = params.get('code')
			const stateParam = params.get('state') || ''

			const [ownerId, tableNumberFromState] = stateParam.split('|')

			if (!code) {
				alert('Google authentication failed. No authorization code received.')
				navigateOnFailure(ownerId, tableNumberFromState)
				return
			}

			hasProcessed.current = true

			try {
				const endpoint = ownerId
					? `/identity/auth/google-authenticate/${ownerId}`
					: '/identity/auth/google-authenticate'

				const response = await apiClient.post(endpoint, { code })

				if (response.status === 200 && response.data && response.data.code === 1000) {
					const {
						userId,
						username,
						email,
						roles,
						accessToken,
						isGoogleLogin,
						ownerId: responseOwnerId,
					} = response.data.data

					if (accessToken) {
						window.accessToken = accessToken
					} else {
						alert('Authentication failed: No access token received')
						navigateOnFailure(ownerId, tableNumberFromState)
						return
					}

					const finalOwnerId = responseOwnerId || ownerId
					if (finalOwnerId) {
						localStorage.setItem('currentOwnerId', finalOwnerId)
						localStorage.setItem('currentTenantId', finalOwnerId)
					}

					const customerData = {
						userId,
						username,
						email,
						roles,
						ownerId: finalOwnerId,
					}
					localStorage.setItem('customerAuth', JSON.stringify(customerData))

					const tableNumber =
						tableNumberFromState || localStorage.getItem('currentTableNumber') || ''
					if (tableNumber) {
						localStorage.setItem('currentTableNumber', tableNumber)
					}

					if (isGoogleLogin) {
						navigate('/set-password', {
							state: {
								firstTimeGoogleLogin: true,
								userId: userId,
								ownerId: finalOwnerId,
								tableNumber: tableNumber,
								fromGoogleAuth: true,
							},
							replace: true,
						})
					} else {
						if (finalOwnerId) {
							if (tableNumber) {
								navigate(`/tenant/${finalOwnerId}/table/${tableNumber}`, {
									replace: true,
								})
							} else {
								navigate(`/select-table/${finalOwnerId}`, { replace: true })
							}
						} else {
							navigate('/', { replace: true })
						}
					}
				} else {
					alert(response.data?.message || 'Authentication failed')
					navigateOnFailure(ownerId, tableNumberFromState)
				}
			} catch (error) {
				const errorMessage =
					error.response?.data?.message ||
					error.response?.data?.error ||
					'Authentication failed. Please try again.'

				alert(errorMessage)
				navigateOnFailure(ownerId, tableNumberFromState)
			}
		}

		handleGoogleCallback()
	}, [location, navigate])

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
			}}
		>
			<div style={{ textAlign: 'center' }}>
				<h2>Authenticating with Google...</h2>
				<p>Please wait while we complete your login.</p>
			</div>
		</div>
	)
}

export default GoogleAuthenticate
