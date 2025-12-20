// Authentication Check Component for Table Management
import React, { useState, useEffect } from 'react'

const AuthenticationWarning = () => {
	const [hasToken, setHasToken] = useState(false)
	const [tenantId, setTenantId] = useState(null)

	useEffect(() => {
		// Check token on mount
		const token = window.accessToken
		setHasToken(!!token)

		// Check tenant ID
		const storedTenantId = localStorage.getItem('tenantId')
		setTenantId(storedTenantId)

		// Log status for debugging
		console.log('🔐 Authentication Status:', {
			hasToken: !!token,
			tokenPreview: token?.substring(0, 20) + '...',
			tenantId: storedTenantId,
		})
	}, [])

	// If authenticated, don't show warning
	if (hasToken) {
		return null
	}

	// Show warning banner
	return (
		<div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center gap-3">
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div>
						<p className="font-bold">⚠️ Authentication Required</p>
						<p className="text-sm">
							You need to login first. Table operations will fail without authentication.
						</p>
					</div>
				</div>
				<a
					href="/login"
					className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
				>
					Login Now
				</a>
			</div>
		</div>
	)
}

export default AuthenticationWarning
