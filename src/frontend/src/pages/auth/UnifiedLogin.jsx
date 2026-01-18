import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useLoading } from '../../contexts/LoadingContext'
import FloatingInputField from '../../components/form/FloatingInputField'
import BackgroundImage from '../../components/common/BackgroundImage'

/**
 * Unified Login Page - Handles all user types in multi-tenant architecture
 *
 * Routes:
 * - /login - Owner/Admin login (no ownerId)
 * - /login/:ownerId - Staff/Chef/Customer login (with ownerId = tenant context)
 *
 * After login, auto-redirects based on role:
 * - ADMIN -> /admin/dashboard
 * - USER (Owner) -> /user/menu
 * - CHEF -> /kitchen (with tenant context)
 * - STAFF -> /waiter (with tenant context)
 * - CUSTOMER -> /order/:tenantId/table/:tableId
 */
const UnifiedLogin = () => {
	const navigate = useNavigate()
	const { ownerId } = useParams()
	const [searchParams] = useSearchParams()
	const { login, loginWithOwner } = useUser()
	const { showLoading, hideLoading } = useLoading()

	// Get ownerId from URL params, query params, or localStorage
	const currentOwnerId = ownerId || searchParams.get('ownerId') || null
	const tableId = searchParams.get('tableId') || searchParams.get('table') || '0'

	// Determine login mode
	const isOwnerLogin = !currentOwnerId // No ownerId = Owner/Admin login
	const isTenantLogin = !!currentOwnerId // Has ownerId = Staff/Chef/Customer login

	const [credentials, setCredentials] = useState({
		username: '',
		password: '',
	})
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [loading, setLoading] = useState(false)

	// Store ownerId in localStorage for tenant context persistence
	useEffect(() => {
		if (currentOwnerId) {
			localStorage.setItem('currentOwnerId', currentOwnerId)
			localStorage.setItem('currentTenantId', currentOwnerId)
		}
	}, [currentOwnerId])

	const handleChange = (e) => {
		const { id, value } = e.target
		setCredentials((prev) => ({ ...prev, [id]: value }))
	}

	const handleLogin = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setLoading(true)

		// Frontend validation
		if (!credentials.username.trim()) {
			setErrorMessage('Username is required.')
			setLoading(false)
			return
		}

		if (!credentials.password.trim()) {
			setErrorMessage('Password is required.')
			setLoading(false)
			return
		}

		try {
			showLoading('Đang đăng nhập...')

			let result

			if (isTenantLogin) {
				// Login with ownerId for Staff/Chef/Customer
				result = await loginWithOwner(
					credentials.username,
					credentials.password,
					currentOwnerId,
				)
			} else {
				// Normal login for Owner/Admin
				result = await login(credentials.username, credentials.password)
			}

			if (result.success) {
				// ✅ Login successful - Smart routing based on role and ownerId
				navigateBasedOnRole(result.user, currentOwnerId, tableId)
			} else {
				setErrorMessage(result.message || 'Invalid username or password.')
			}
		} catch (error) {
			console.error('Login error:', error)
			setErrorMessage('Login failed. Please try again.')
		} finally {
			setLoading(false)
			hideLoading()
		}
	}

	/**
	 * Smart navigation based on user role and tenant context
	 * Multi-tenant routes use pattern: /r/:ownerId/...
	 */
	const navigateBasedOnRole = (user, ownerId, tableId) => {
		const roles = user.roles || []
		const userOwnerId = user.ownerId || ownerId

		// ADMIN - System administrator
		if (roles.includes('ADMIN')) {
			navigate('/admin/dashboard', { replace: true })
			return
		}

		// USER (Owner) - Restaurant owner
		if (roles.includes('USER')) {
			navigate('/user/menu', { replace: true })
			return
		}

		// CHEF - Kitchen staff (requires tenant context)
		if (roles.includes('CHEF')) {
			if (userOwnerId) {
				// Store tenant context for kitchen operations
				localStorage.setItem('currentTenantId', userOwnerId)
				navigate(`/r/${userOwnerId}/kitchen`, { replace: true })
			} else {
				setErrorMessage(
					'Chef account requires restaurant context. Please use QR code to login.',
				)
			}
			return
		}

		// STAFF (Waiter) - Front of house staff (requires tenant context)
		if (roles.includes('STAFF')) {
			if (userOwnerId) {
				localStorage.setItem('currentTenantId', userOwnerId)
				navigate(`/r/${userOwnerId}/waiter`, { replace: true })
			} else {
				setErrorMessage(
					'Staff account requires restaurant context. Please use QR code to login.',
				)
			}
			return
		}

		// CUSTOMER - Restaurant customer (requires tenant context + table)
		if (roles.includes('CUSTOMER')) {
			if (userOwnerId) {
				localStorage.setItem('currentTenantId', userOwnerId)
				navigate(`/r/${userOwnerId}/order/table/${tableId}`, { replace: true })
			} else {
				setErrorMessage(
					'Customer account requires restaurant context. Please scan QR code.',
				)
			}
			return
		}

		// Default fallback
		navigate('/', { replace: true })
	}

	const handleGoogleLogin = () => {
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
		const redirectUri =
			import.meta.env.VITE_REDIRECT_URI || import.meta.env.VITE_GOOGLE_REDIRECT_URI

		// Include ownerId in state for post-OAuth routing
		const state = JSON.stringify({
			ownerId: currentOwnerId || '',
			tableId: tableId,
		})

		const googleAuthUrl =
			`https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${clientId}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&response_type=code` +
			`&scope=email profile` +
			`&state=${encodeURIComponent(state)}`

		window.location.href = googleAuthUrl
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 font-[Work_Sans] w-full">
			<BackgroundImage overlayOpacity={75} fixed={true} />

			<div className="flex w-full max-w-md flex-col items-center">
				{/* Logo */}
				<div className="mb-8 flex items-center gap-3">
					<h1 className="text-white text-4xl font-bold z-50">SpillProofPOS</h1>
				</div>

				{/* Login Mode Indicator */}
				{isTenantLogin && (
					<div className="mb-4 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg z-50">
						<p className="text-blue-300 text-sm text-center">
							🏪 Logging in to Restaurant #{currentOwnerId?.slice(0, 8)}...
						</p>
					</div>
				)}

				{/* Login Card */}
				<div className="w-full rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-lg border border-white/10">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-white">
							{isOwnerLogin ? 'Owner Login' : 'Login'}
						</h2>
						<p className="mt-1 text-sm text-[#9dabbb]">
							{isOwnerLogin
								? 'Access your restaurant management panel'
								: 'Login as Staff, Chef, or Customer'}
						</p>
					</div>

					<form className="flex flex-col gap-5" onSubmit={handleLogin} autoComplete="off">
						{errorMessage && (
							<div className="text-sm text-red-400 bg-red-600/10 p-2 rounded-lg text-center">
								{errorMessage}
							</div>
						)}

						<FloatingInputField
							label="Username or Email"
							type="text"
							id="username"
							name="username"
							value={credentials.username}
							onChange={handleChange}
							placeholder=""
							disabled={loading}
							autoComplete="off"
							icon={<span className="material-symbols-outlined">person</span>}
							iconPosition="left"
						/>

						<div className="relative">
							<FloatingInputField
								label="Password"
								type={passwordVisible ? 'text' : 'password'}
								id="password"
								name="password"
								value={credentials.password}
								onChange={handleChange}
								placeholder=""
								disabled={loading}
								autoComplete="new-password"
								icon={<span className="material-symbols-outlined">lock</span>}
								iconPosition="left"
							/>
							<button
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
								type="button"
								title="Toggle Password Visibility"
								onClick={() => setPasswordVisible(!passwordVisible)}
								disabled={loading}
							>
								<span className="material-symbols-outlined text-lg">
									{passwordVisible ? 'visibility_off' : 'visibility'}
								</span>
							</button>
						</div>

						<div className="text-right">
							<Link
								to="/forgot-password"
								className="text-sm text-[#137fec] hover:text-white transition-colors"
							>
								Forgot password?
							</Link>
						</div>

						<button
							className={`${
								loading ? 'opacity-70 cursor-wait' : ''
							} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer`}
							type="submit"
							disabled={loading}
						>
							{loading ? (
								<svg
									className="animate-spin h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								'Login'
							)}
						</button>
					</form>

					{/* Google Login - Only show for tenant login (customers) */}
					{isTenantLogin && (
						<>
							<div className="flex items-center my-6">
								<div className="flex-1 border-t border-gray-600"></div>
								<span className="px-4 text-gray-400 text-sm">OR</span>
								<div className="flex-1 border-t border-gray-600"></div>
							</div>

							<button
								type="button"
								onClick={handleGoogleLogin}
								disabled={loading}
								className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
									<path
										d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
										fill="#4285F4"
									/>
									<path
										d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z"
										fill="#34A853"
									/>
									<path
										d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
										fill="#FBBC05"
									/>
									<path
										d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
										fill="#EA4335"
									/>
								</svg>
								Continue with Google
							</button>
						</>
					)}
				</div>

				{/* Sign Up Link */}
				<div className="mt-4 text-center z-50">
					{isOwnerLogin ? (
						<p className="text-sm text-white">
							Don't have an account?{' '}
							<Link
								to="/signup"
								className="text-[#137fec] font-medium hover:text-white transition-colors"
							>
								Sign up
							</Link>
						</p>
					) : (
						<p className="text-sm text-white">
							Don't have an account?{' '}
							<Link
								to={`/customer-signup/${currentOwnerId}`}
								className="text-[#137fec] font-medium hover:text-white transition-colors"
							>
								Sign up as Customer
							</Link>
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

export default UnifiedLogin
