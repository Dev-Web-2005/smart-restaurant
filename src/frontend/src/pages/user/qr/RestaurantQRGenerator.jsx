import React, { useState, useEffect } from 'react'
import { useUser } from '../../../contexts/UserContext'
import QRCode from 'qrcode'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import apiClient from '../../../services/apiClient'

/**
 * Restaurant QR Generator Page - TOKEN-BASED VERSION
 * Allows restaurant owners to generate, regenerate, view, and download QR codes
 * Token-based system with versioning to invalidate old QR codes
 */
const RestaurantQRGenerator = () => {
	const { user } = useUser()
	const [qrCodeUrl, setQrCodeUrl] = useState('')
	const [qrData, setQrData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [regenerating, setRegenerating] = useState(false)
	const [copied, setCopied] = useState(false)

	const fetchQrData = async () => {
		try {
			setLoading(true)
			const response = await apiClient.get('/identity/users/restaurant-qr')

			if (response.data.code === 200 && response.data.data) {
				const data = response.data.data
				setQrData(data)

				// Generate QR code from URL
				const qrUrl = await QRCode.toDataURL(data.qrUrl, {
					errorCorrectionLevel: 'M',
					type: 'image/png',
					width: 512,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF',
					},
				})
				setQrCodeUrl(qrUrl)
			}
		} catch (error) {
			console.error('Error fetching QR:', error)
			const errorMessage =
				error.response?.data?.message || 'Failed to fetch QR code. Please try again.'
			alert(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	const generateQr = async () => {
		try {
			setRegenerating(true)
			const response = await apiClient.post('/identity/users/restaurant-qr', {})

			if (response.data.code === 200 && response.data.data) {
				const data = response.data.data
				setQrData(data)

				// Generate QR code from URL
				const qrUrl = await QRCode.toDataURL(data.qrUrl, {
					errorCorrectionLevel: 'M',
					type: 'image/png',
					width: 512,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF',
					},
				})
				setQrCodeUrl(qrUrl)
			}
		} catch (error) {
			console.error('Error generating QR:', error)
			alert('Failed to generate QR code. Please try again.')
		} finally {
			setRegenerating(false)
		}
	}

	useEffect(() => {
		if (user?.userId) {
			fetchQrData()
		}
	}, [user?.userId])

	const handleDownloadQR = () => {
		if (!qrCodeUrl) return

		const link = document.createElement('a')
		link.href = qrCodeUrl
		link.download = `Restaurant_QR_${user?.username || 'code'}_v${qrData?.version || 0}.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const handlePrintQR = () => {
		if (!qrCodeUrl) return

		const printWindow = window.open('', '_blank')
		if (!printWindow) {
			alert('Please allow popups to print QR code')
			return
		}

		const restaurantName = user?.username || 'Restaurant'

		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Restaurant QR Code - ${restaurantName}</title>
				<style>
					@media print {
						body { 
							margin: 0; 
							padding: 20px; 
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							min-height: 100vh;
						}
						.no-print { display: none; }
					}
					body {
						font-family: Arial, sans-serif;
						text-align: center;
						background: white;
					}
					h1 {
						font-size: 32px;
						margin: 20px 0;
						color: #333;
					}
					.subtitle {
						font-size: 18px;
						color: #666;
						margin: 10px 0 30px 0;
					}
					.info {
						margin: 20px 0;
						font-size: 14px;
						color: #888;
					}
					img {
						max-width: 400px;
						width: 100%;
						height: auto;
						border: 2px solid #ddd;
						padding: 20px;
						margin: 20px 0;
					}
					.instructions {
						max-width: 500px;
						margin: 20px auto;
						padding: 15px;
						background: #f9f9f9;
						border-radius: 8px;
						font-size: 14px;
						line-height: 1.6;
					}
				</style>
			</head>
			<body>
				<h1>${restaurantName}</h1>
				<div class="subtitle">Customer Login QR Code</div>
				<img src="${qrCodeUrl}" alt="Restaurant QR Code" />
				<div class="info">
					<p><strong>Version:</strong> ${qrData?.version || 'N/A'}</p>
					<p><strong>Generated:</strong> ${qrData?.generatedAt ? new Date(qrData.generatedAt).toLocaleString() : 'N/A'}</p>
				</div>
				<div class="instructions">
					<p><strong>Instructions for Customers:</strong></p>
					<ol style="text-align: left; display: inline-block;">
						<li>Scan this QR code with your mobile device</li>
						<li>You will be redirected to the login page</li>
						<li>Login or sign up to place orders</li>
					</ol>
				</div>
			</body>
			</html>
		`)
		printWindow.document.close()
		printWindow.focus()
		setTimeout(() => {
			printWindow.print()
			printWindow.close()
		}, 250)
	}

	const handleCopyUrl = () => {
		if (qrData?.qrUrl) {
			navigator.clipboard.writeText(qrData.qrUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	const handleRegenerate = async () => {
		if (
			!confirm(
				'Are you sure you want to regenerate the QR code? This will invalidate the old QR code.',
			)
		) {
			return
		}
		await generateQr()
	}

	return (
		<BasePageLayout
			title="Restaurant QR Code"
			subtitle="Generate a permanent QR code for customers to access your restaurant"
		>
			<div className="max-w-4xl mx-auto p-6">
				{loading ? (
					<div className="flex justify-center items-center py-20">
						<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* QR Code Display */}
						<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-8">
							<h3 className="text-xl font-semibold mb-6 text-center text-white">
								Your Restaurant QR Code
							</h3>

							{qrCodeUrl && (
								<div className="flex flex-col items-center">
									<div className="bg-white p-4 rounded-lg border-2 border-white/20 mb-4">
										<img src={qrCodeUrl} alt="Restaurant QR Code" className="w-64 h-64" />
									</div>

									<div className="text-center text-sm text-gray-300 mb-6">
										<p className="mb-1">
											<strong className="text-white">Version:</strong>{' '}
											{qrData?.version || 'N/A'}
										</p>
										<p>
											<strong className="text-white">Generated:</strong>{' '}
											{qrData?.generatedAt
												? new Date(qrData.generatedAt).toLocaleString()
												: 'N/A'}
										</p>
									</div>

									<div className="flex flex-col gap-3 w-full">
										<button
											onClick={handleDownloadQR}
											className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
										>
											<span className="material-symbols-outlined">download</span>
											<span>Download QR Code</span>
										</button>
										<button
											onClick={handlePrintQR}
											className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
										>
											<span className="material-symbols-outlined">print</span>
											<span>Print QR Code</span>
										</button>
										<button
											onClick={handleRegenerate}
											disabled={regenerating}
											className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											<span className="material-symbols-outlined">
												{regenerating ? 'progress_activity' : 'refresh'}
											</span>
											<span>{regenerating ? 'Regenerating...' : 'Regenerate QR'}</span>
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Information Panel */}
						<div className="space-y-6">
							{/* URL Display */}
							<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
								<h4 className="font-semibold text-lg mb-3 text-white">Restaurant URL</h4>
								<div className="flex gap-2">
									<input
										type="text"
										value={qrData?.qrUrl || ''}
										readOnly
										className="flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<button
										onClick={handleCopyUrl}
										className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
											copied
												? 'bg-green-600 text-white'
												: 'bg-black/40 border border-white/20 text-white hover:bg-black/60'
										}`}
									>
										<span className="material-symbols-outlined text-sm">
											{copied ? 'check' : 'content_copy'}
										</span>
										<span>{copied ? 'Copied' : 'Copy'}</span>
									</button>
								</div>
							</div>

							{/* Instructions */}
							<div className="bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/30 p-6">
								<h4 className="font-semibold text-lg mb-3 text-blue-300 flex items-center gap-2">
									<span className="material-symbols-outlined">menu_book</span>
									<span>How to Use</span>
								</h4>
								<ol className="list-decimal list-inside space-y-2 text-sm text-blue-200">
									<li>Download or print the QR code</li>
									<li>
										Display it prominently in your restaurant (entrance, tables, etc.)
									</li>
									<li>Customers scan the QR to access your restaurant's page</li>
									<li>They can login, signup, and place orders</li>
								</ol>
							</div>

							{/* Warning */}
							<div className="bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/30 p-6">
								<h4 className="font-semibold text-lg mb-3 text-amber-300 flex items-center gap-2">
									<span className="material-symbols-outlined">warning</span>
									<span>Important Note</span>
								</h4>
								<p className="text-sm text-amber-200 mb-2">
									<strong>Regenerating the QR code will invalidate the old one.</strong>
								</p>
								<p className="text-sm text-amber-200">
									If you've already printed and displayed QR codes, regenerating will make
									them unusable. Only regenerate if necessary (e.g., security concerns).
								</p>
							</div>

							{/* Statistics (optional) */}
							<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
								<h4 className="font-semibold text-lg mb-3 text-white flex items-center gap-2">
									<span className="material-symbols-outlined">analytics</span>
									<span>QR Statistics</span>
								</h4>
								<div className="space-y-2 text-sm text-gray-300">
									<p>
										<strong className="text-white">Restaurant Owner:</strong>{' '}
										{user?.username || 'N/A'}
									</p>
									<p>
										<strong className="text-white">Owner ID:</strong>{' '}
										{user?.userId || 'N/A'}
									</p>
									<p>
										<strong className="text-white">Current Version:</strong>{' '}
										{qrData?.version || 0}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</BasePageLayout>
	)
}

export default RestaurantQRGenerator
