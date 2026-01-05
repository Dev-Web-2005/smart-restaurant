import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../services/apiClient';

const GoogleAuthenticate = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const hasProcessed = useRef(false);

	useEffect(() => {
		// Prevent multiple API calls with the same code
		if (hasProcessed.current) {
			return;
		}

		const handleGoogleCallback = async () => {
			const params = new URLSearchParams(location.search);
			const code = params.get('code');
			const stateParam = params.get('state') || '';
			
			// Parse state: format is "ownerId|tableNumber"
			const [ownerId, tableNumberFromState] = stateParam.split('|');

			if (!code) {
				alert('Google authentication failed. No authorization code received.');
				navigate('/login');
				return;
			}

			// Mark as processed to prevent re-running
			hasProcessed.current = true;

			try {
				const endpoint = ownerId
					? `/identity/auth/google-authenticate/${ownerId}`
					: '/identity/auth/google-authenticate';

				const response = await apiClient.post(endpoint, { code });

				if (response.status === 200 && response.data && response.data.code === 1000) {
					const { userId, username, email, roles, accessToken, isGoogleLogin, ownerId: responseOwnerId } = response.data.data;
					
					if (accessToken) {
						window.accessToken = accessToken;
					} else {
						alert('Authentication failed: No access token received');
						navigate('/login');
						return;
					}

					const finalOwnerId = responseOwnerId || ownerId;
					if (finalOwnerId) {
						localStorage.setItem('currentOwnerId', finalOwnerId);
						localStorage.setItem('currentTenantId', finalOwnerId);
					}

					const customerData = {
						userId,
						username,
						email,
						roles,
						ownerId: finalOwnerId,
					};
					localStorage.setItem('customerAuth', JSON.stringify(customerData));

					// Get table number from state or localStorage
					const tableNumber = tableNumberFromState || localStorage.getItem('currentTableNumber') || '';
					if (tableNumber) {
						localStorage.setItem('currentTableNumber', tableNumber);
					}

					if (isGoogleLogin) {
						// First time Google login - need to set password
						navigate('/set-password', {
							state: { 
								firstTimeGoogleLogin: true,
								userId: userId,
								ownerId: finalOwnerId,
								tableNumber: tableNumber,
								fromGoogleAuth: true
							},
						});
					} else {
						// Returning Google user - navigate based on tableNumber
						if (finalOwnerId) {
							if (tableNumber) {
								// Has table number - go directly to that table
								navigate(`/order/${finalOwnerId}/table/${tableNumber}`);
							} else {
								// No table number - show table selection
								navigate(`/select-table/${finalOwnerId}`);
							}
						} else {
							navigate('/');
						}
					}
				} else {
					alert(response.data?.message || 'Authentication failed');
					navigate('/login');
				}
			} catch (error) {
				const errorMessage = error.response?.data?.message || 
									error.response?.data?.error || 
									'Authentication failed. Please try again.';
				
				alert(errorMessage);
				navigate('/login');
			}
		};

		handleGoogleCallback();
	}, [location, navigate]);

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
	);
};

export default GoogleAuthenticate;
