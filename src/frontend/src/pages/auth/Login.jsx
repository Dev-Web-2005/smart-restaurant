import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../contexts/UserContext' // Giả định đã có UserContext
import { useLoading } from '../../contexts/LoadingContext'
import FloatingInputField from '../../components/form/FloatingInputField'
import { ButtonLoader } from '../../components/common/LoadingSpinner'

const AdminLogin = () => {
	const navigate = useNavigate()
	// Lấy hàm login từ Context (Dùng để thay thế onLoginSuccess prop)
	const { login } = useUser()
	const { showLoading, hideLoading } = useLoading()

	// 1. State để quản lý input form
	const [credentials, setCredentials] = useState({
		username: '',
		password: '',
	})
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [loading, setLoading] = useState(false)

	// 2. Hàm xử lý thay đổi input
	const handleChange = (e) => {
		const { id, value } = e.target
		setCredentials((prev) => ({ ...prev, [id]: value }))
	}

	// 3. Hàm xử lý đăng nhập (POST)
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

		if (credentials.username.length < 4 || credentials.username.length > 20) {
			setErrorMessage('Username must be between 4 and 20 characters.')
			setLoading(false)
			return
		}

		if (credentials.password.length < 8) {
			setErrorMessage('Password must be at least 8 characters long.')
			setLoading(false)
			return
		}

		try {
			showLoading('Đang đăng nhập...')
			// 🚀 Call login API from context
			const result = await login(credentials.username, credentials.password)

			if (result.success) {
				// ✅ Login successful - navigate based on role
				if (result.user.role === 'Super Administrator') {
					navigate('/admin/dashboard')
				} else {
					navigate('/user/menu')
				}
			} else {
				// ❌ Login failed
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

	return (
		<div
			className="flex min-h-screen flex-col items-center justify-center p-4 font-[Work_Sans] w-full "
			style={{
				backgroundImage:
					'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070")',
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundAttachment: 'fixed',
			}}
		>
			<div className="absolute inset-0 bg-black/75 h-full" />
			<div className="flex w-full max-w-md flex-col items-center ">
				{/* Logo Group */}
				<div className="mb-8 flex items-center gap-3">
					{/* <span className="material-symbols-outlined text-[#137fec] text-5xl">
            restaurant_menu
          </span> */}
					<h1 className="text-white text-4xl font-bold z-50">SpillProofPOS</h1>
				</div>

				{/* Login Card */}
				<div className="w-full rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-lg border border-white/10">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-white">Login</h2>
						<p className="mt-1 text-sm text-[#9dabbb]">
							Access the platform control panel
						</p>
					</div>

					<form className="flex flex-col gap-5" onSubmit={handleLogin} autoComplete="off">
						{/* Error Message */}
						{errorMessage && (
							<div className="text-sm text-red-400 bg-red-600/10 p-2 rounded-lg text-center">
								{errorMessage}
							</div>
						)}

						{/* Username/Email Input */}
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

						{/* Password Input */}
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

						{/* Login Button */}
						<button
							className={`${
								loading ? 'opacity-70 cursor-wait' : ''
							} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer`}
							type="submit"
							disabled={loading}
						>
							{loading ? (
								<svg
									className="animate-spin h-5 w-5 text-white  "
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25 "
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75 "
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								'Login'
							)}
						</button>
					</form>
				</div>

				{/* Sign Up Link (New Addition) */}
				<div className="mt-4 text-center z-50">
					<p className="text-sm text-white">
						Don't have an account?
						<a
							href="/signup"
							className="text-[#137fec] font-medium hover:text-white transition-colors"
						>
							{' '}
							Sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}

export default AdminLogin
