// pages/kyc/KYCCallback.jsx
// KYC Callback Handler - Receives redirect from Didit after verification

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const KYCCallback = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [status, setStatus] = useState('processing')
	const [message, setMessage] = useState('Processing verification result...')

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const sessionId =
					searchParams.get('verificationSessionId') ||
					searchParams.get('session_id') ||
					searchParams.get('sessionId')
				const status = searchParams.get('status')

				if (!sessionId) {
					throw new Error('No session ID provided in callback URL')
				}

				// Send message to parent window (RestaurantSetupWizard)
				if (window.opener && !window.opener.closed) {
					const messageData = {
						type: 'KYC_COMPLETE',
						sessionId: sessionId,
						status: status,
						timestamp: Date.now(),
					}

					try {
						window.opener.postMessage(messageData, '*')
					} catch (err) {
						console.error('❌ postMessage error:', err)
					}

					setStatus('success')
					setMessage('Verification complete! Closing window...')

					// Close window after 2 seconds
					setTimeout(() => {
						window.close()
					}, 2000)
				} else {
					setStatus('redirect')
					setMessage('Redirecting to registration...')

					setTimeout(() => {
						navigate('/onboarding?kyc_session=' + sessionId)
					}, 2000)
				}
			} catch (error) {
				console.error('❌ KYC callback error:', error)
				setStatus('error')
				setMessage(error.message || 'Failed to process verification')
			}
		}

		handleCallback()
	}, [searchParams, navigate])

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="max-w-md w-full bg-black/60 backdrop-blur-md rounded-xl p-8 text-center border border-white/10">
				{status === 'processing' && (
					<>
						<div className="mb-6">
							<svg
								className="animate-spin h-16 w-16 mx-auto text-[#137fec]"
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
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
						<p className="text-[#9dabbb]">{message}</p>
					</>
				)}

				{status === 'success' && (
					<>
						<div className="mb-6">
							<span className="material-symbols-outlined text-6xl text-green-500">
								check_circle
							</span>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
						<p className="text-[#9dabbb]">{message}</p>
					</>
				)}

				{status === 'error' && (
					<>
						<div className="mb-6">
							<span className="material-symbols-outlined text-6xl text-red-500">
								error
							</span>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">Error</h2>
						<p className="text-red-400 mb-4">{message}</p>
						<button
							onClick={() => window.close()}
							className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors"
						>
							Close Window
						</button>
					</>
				)}

				{status === 'redirect' && (
					<>
						<div className="mb-6">
							<span className="material-symbols-outlined text-6xl text-[#137fec]">
								open_in_new
							</span>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">Redirecting...</h2>
						<p className="text-[#9dabbb]">{message}</p>
					</>
				)}
			</div>
		</div>
	)
}

export default KYCCallback
