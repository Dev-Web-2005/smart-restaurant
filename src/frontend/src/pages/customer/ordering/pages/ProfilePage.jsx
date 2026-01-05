import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const ProfilePage = ({ onBack }) => {
	const [customerAuth, setCustomerAuth] = useState(null)

	useEffect(() => {
		const auth = localStorage.getItem('customerAuth')
		if (auth) {
			try {
				setCustomerAuth(JSON.parse(auth))
			} catch (error) {
				console.error('Failed to parse customer auth:', error)
			}
		}
	}, [])

	const handleLogout = () => {
		// Clear customer authentication data
		localStorage.removeItem('customerAuth')
		localStorage.removeItem('customer_token')
		sessionStorage.clear()
		delete window.accessToken
		window.location.reload() // Reload to reset auth state
	}

	if (!customerAuth) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
					person_off
				</span>
				<p className="text-gray-400 text-lg mb-4">You are not logged in</p>
				<button
					onClick={onBack}
					className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
				>
					Go Back
				</button>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800"
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-700">
				<button
					onClick={onBack}
					className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				>
					<span className="material-symbols-outlined text-white">arrow_back</span>
				</button>
				<h1 className="text-xl font-bold text-white">My Profile</h1>
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
				>
					Logout
				</button>
			</div>

			{/* Profile Content */}
			<div className="flex-1 overflow-y-auto p-6">
				{/* Avatar Section */}
				<div className="flex flex-col items-center mb-8">
					<div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
						<span className="material-symbols-outlined text-white text-5xl">person</span>
					</div>
					<h2 className="text-2xl font-bold text-white mb-1">
						{customerAuth.username || customerAuth.name || 'Customer'}
					</h2>
					{customerAuth.roles && customerAuth.roles.length > 0 && (
						<div className="mt-2 flex gap-2">
							{customerAuth.roles.map((role, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
								>
									{role}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Profile Information Cards */}
				<div className="space-y-4">
					{/* Username Card */}
					{customerAuth.username && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-purple-400">badge</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Username</p>
									<p className="text-white font-medium">{customerAuth.username}</p>
								</div>
							</div>
						</div>
					)}

					{/* Email Card */}
					{customerAuth.email && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-blue-400">mail</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Email Address</p>
									<p className="text-white font-medium">{customerAuth.email}</p>
								</div>
							</div>
						</div>
					)}

					{/* Phone Card */}
					{customerAuth.phone && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-green-400">phone</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Phone Number</p>
									<p className="text-white font-medium">{customerAuth.phone}</p>
								</div>
							</div>
						</div>
					)}

					{/* Account Status */}
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
								<span className="material-symbols-outlined text-yellow-400">
									verified
								</span>
							</div>
							<div className="flex-1">
								<p className="text-gray-400 text-sm">Account Status</p>
								<p className="text-white font-medium">Active</p>
							</div>
						</div>
					</div>
				</div>

				{/* Actions Section */}
				<div className="mt-8 space-y-3">
					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">history</span>
								<span className="text-white font-medium">Order History</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">favorite</span>
								<span className="text-white font-medium">Favorite Dishes</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">
									location_on
								</span>
								<span className="text-white font-medium">Saved Addresses</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">
									notifications
								</span>
								<span className="text-white font-medium">Notifications</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>
				</div>
			</div>
		</motion.div>
	)
}

export default ProfilePage
