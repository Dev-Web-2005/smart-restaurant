import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../../../contexts/UserContext'
import { useAlert } from '../../../contexts/AlertContext'

// Role options
const ROLE_OPTIONS = [
	{ value: 'WAITER', label: 'Waiter', icon: 'restaurant_menu', color: 'text-blue-400' },
	{
		value: 'KITCHEN_STAFF',
		label: 'Kitchen Staff',
		icon: 'soup_kitchen',
		color: 'text-orange-400',
	},
]

// Mock data for existing accounts
const mockAccounts = [
	{
		id: 1,
		username: 'waiter01',
		role: 'WAITER',
		isActive: true,
		createdAt: new Date('2024-01-15').toISOString(),
	},
	{
		id: 2,
		username: 'kitchen01',
		role: 'KITCHEN_STAFF',
		isActive: true,
		createdAt: new Date('2024-01-20').toISOString(),
	},
]

// Add/Edit Account Modal Component
const AccountModal = ({ isOpen, onClose, onSave, editingAccount }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		confirmPassword: '',
		role: 'WAITER',
	})
	const [errors, setErrors] = useState({})
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			if (editingAccount) {
				setFormData({
					username: editingAccount.username,
					password: '',
					confirmPassword: '',
					role: editingAccount.role,
				})
			} else {
				setFormData({
					username: '',
					password: '',
					confirmPassword: '',
					role: 'WAITER',
				})
			}
			setErrors({})
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen, editingAccount])

	const validateForm = () => {
		const newErrors = {}

		if (!formData.username.trim()) {
			newErrors.username = 'Username is required'
		} else if (formData.username.length < 4) {
			newErrors.username = 'Username must be at least 4 characters'
		}

		if (!editingAccount) {
			// Only validate password for new accounts
			if (!formData.password) {
				newErrors.password = 'Password is required'
			} else if (formData.password.length < 6) {
				newErrors.password = 'Password must be at least 6 characters'
			}

			if (formData.password !== formData.confirmPassword) {
				newErrors.confirmPassword = 'Passwords do not match'
			}
		} else if (formData.password) {
			// For editing, only validate if password is provided
			if (formData.password.length < 6) {
				newErrors.password = 'Password must be at least 6 characters'
			}
			if (formData.password !== formData.confirmPassword) {
				newErrors.confirmPassword = 'Passwords do not match'
			}
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!validateForm()) return

		setSaving(true)
		try {
			await onSave(formData)
			onClose()
		} catch (error) {
			console.error('Save error:', error)
		} finally {
			setSaving(false)
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: '' }))
		}
	}

	if (!isOpen) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-md mx-4 border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<h2 className="text-2xl font-bold text-white m-0">
						{editingAccount ? 'Edit Account' : 'Create New Account'}
					</h2>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{/* Username */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Username *
						</label>
						<input
							type="text"
							name="username"
							value={formData.username}
							onChange={handleChange}
							disabled={saving}
							className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all disabled:opacity-50"
							placeholder="Enter username"
						/>
						{errors.username && (
							<p className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">error</span>
								{errors.username}
							</p>
						)}
					</div>

					{/* Role */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
						<div className="relative">
							<select
								name="role"
								value={formData.role}
								onChange={handleChange}
								disabled={saving}
								className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all disabled:opacity-50 appearance-none cursor-pointer"
							>
								{ROLE_OPTIONS.map((role) => (
									<option key={role.value} value={role.value}>
										{role.label}
									</option>
								))}
							</select>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
								<span className="material-symbols-outlined text-[#9dabb9]">
									expand_more
								</span>
							</div>
						</div>
					</div>

					{/* Password */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Password {editingAccount ? '(leave blank to keep current)' : '*'}
						</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							disabled={saving}
							className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all disabled:opacity-50"
							placeholder={editingAccount ? 'Enter new password' : 'Enter password'}
						/>
						{errors.password && (
							<p className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">error</span>
								{errors.password}
							</p>
						)}
					</div>

					{/* Confirm Password */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Confirm Password {editingAccount && !formData.password ? '' : '*'}
						</label>
						<input
							type="password"
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							disabled={saving}
							className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all disabled:opacity-50"
							placeholder="Confirm password"
						/>
						{errors.confirmPassword && (
							<p className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">error</span>
								{errors.confirmPassword}
							</p>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={saving}
							className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className="px-6 py-2 rounded-lg bg-[#137fec] text-white font-semibold hover:bg-[#0d6ecc] transition-colors disabled:opacity-50 flex items-center gap-2"
						>
							{saving && (
								<div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
							)}
							{editingAccount ? 'Update Account' : 'Create Account'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// Account Card Component
const AccountCard = ({ account, onEdit, onToggleActive, onDelete }) => {
	const roleInfo = ROLE_OPTIONS.find((r) => r.value === account.role)

	return (
		<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-5 hover:bg-black/50 transition-all">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#137fec] to-[#0d6ecc] flex items-center justify-center">
						<span className="material-symbols-outlined text-white text-2xl">
							{roleInfo?.icon}
						</span>
					</div>
					<div>
						<h3 className="text-white font-bold text-lg m-0">{account.username}</h3>
						<div className="flex items-center gap-2 mt-1">
							<span
								className={`text-sm font-medium ${roleInfo?.color || 'text-gray-400'}`}
							>
								{roleInfo?.label}
							</span>
							<span className="text-[#9dabb9] text-xs">•</span>
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${
									account.isActive
										? 'bg-green-500/20 text-green-400'
										: 'bg-gray-500/20 text-gray-400'
								}`}
							>
								{account.isActive ? 'Active' : 'Disabled'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between pt-3 border-t border-white/10">
				<span className="text-xs text-[#9dabb9]">
					Created: {new Date(account.createdAt).toLocaleDateString()}
				</span>

				<div className="flex items-center gap-2">
					<button
						onClick={() => onEdit(account)}
						className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
						title="Edit"
					>
						<span className="material-symbols-outlined text-lg">edit</span>
					</button>
					<button
						onClick={() => onToggleActive(account)}
						className={`p-2 rounded-lg transition-colors ${
							account.isActive
								? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
								: 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
						}`}
						title={account.isActive ? 'Disable' : 'Enable'}
					>
						<span className="material-symbols-outlined text-lg">
							{account.isActive ? 'block' : 'check_circle'}
						</span>
					</button>
					<button
						onClick={() => onDelete(account)}
						className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
						title="Delete"
					>
						<span className="material-symbols-outlined text-lg">delete</span>
					</button>
				</div>
			</div>
		</div>
	)
}

// Main Account Management Component
const AccountManagement = () => {
	const { user } = useUser()
	const { showSuccess, showError, showConfirm } = useAlert()
	const [accounts, setAccounts] = useState([])
	const [loading, setLoading] = useState(true)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingAccount, setEditingAccount] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [roleFilter, setRoleFilter] = useState('ALL')

	// Load accounts
	useEffect(() => {
		fetchAccounts()
	}, [])

	const fetchAccounts = async () => {
		setLoading(true)
		// Simulate API call
		setTimeout(() => {
			setAccounts(mockAccounts)
			setLoading(false)
		}, 500)
	}

	const handleCreateAccount = () => {
		setEditingAccount(null)
		setIsModalOpen(true)
	}

	const handleEditAccount = (account) => {
		setEditingAccount(account)
		setIsModalOpen(true)
	}

	const handleSaveAccount = async (formData) => {
		try {
			if (editingAccount) {
				// Update existing account
				console.log('Updating account:', editingAccount.id, formData)
				setAccounts((prev) =>
					prev.map((acc) =>
						acc.id === editingAccount.id
							? {
									...acc,
									username: formData.username,
									role: formData.role,
									// Only update password if provided
									...(formData.password && { passwordUpdated: true }),
							  }
							: acc,
					),
				)
				showSuccess(`Account "${formData.username}" updated successfully!`)
			} else {
				// Create new account
				const newAccount = {
					id: Date.now(),
					username: formData.username,
					role: formData.role,
					isActive: true,
					createdAt: new Date().toISOString(),
				}
				console.log('Creating account:', newAccount)
				setAccounts((prev) => [newAccount, ...prev])
				showSuccess(`Account "${formData.username}" created successfully!`)
			}
		} catch (error) {
			showError('Failed to save account. Please try again.')
		}
	}

	const handleToggleActive = async (account) => {
		const action = account.isActive ? 'disable' : 'enable'
		const confirmed = await showConfirm(
			`${action.charAt(0).toUpperCase() + action.slice(1)} Account`,
			`Are you sure you want to ${action} "${account.username}"?`,
		)

		if (confirmed) {
			console.log(`${action} account:`, account.id)
			setAccounts((prev) =>
				prev.map((acc) =>
					acc.id === account.id ? { ...acc, isActive: !acc.isActive } : acc,
				),
			)
			showSuccess(`Account "${account.username}" ${action}d successfully!`)
		}
	}

	const handleDeleteAccount = async (account) => {
		const confirmed = await showConfirm(
			'Delete Account',
			`Are you sure you want to delete "${account.username}"? This action cannot be undone.`,
		)

		if (confirmed) {
			console.log('Deleting account:', account.id)
			setAccounts((prev) => prev.filter((acc) => acc.id !== account.id))
			showSuccess(`Account "${account.username}" deleted successfully!`)
		}
	}

	// Filter accounts
	const filteredAccounts = accounts.filter((account) => {
		const matchesSearch = account.username
			.toLowerCase()
			.includes(searchQuery.toLowerCase())
		const matchesRole = roleFilter === 'ALL' || account.role === roleFilter
		return matchesSearch && matchesRole
	})

	return (
		<div className="settings-card bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
			{/* Header */}
			<div className="card-header p-6 border-b border-white/10">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-white m-0 flex items-center gap-2">
							<span className="material-symbols-outlined">manage_accounts</span>
							Staff Account Management
						</h2>
						<p className="text-sm text-gray-300 mt-1">
							Create and manage staff accounts for waiters and kitchen staff.
						</p>
					</div>
					<button
						onClick={handleCreateAccount}
						className="px-4 py-2 bg-[#137fec] hover:bg-[#0d6ecc] text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
					>
						<span className="material-symbols-outlined">add</span>
						Create Account
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="p-6 border-b border-white/10">
				<div className="flex gap-4">
					<div className="flex-1">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by username..."
							className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						/>
					</div>
					<div className="relative min-w-[180px]">
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all appearance-none cursor-pointer"
						>
							<option value="ALL">All Roles</option>
							{ROLE_OPTIONS.map((role) => (
								<option key={role.value} value={role.value}>
									{role.label}
								</option>
							))}
						</select>
						<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
							<span className="material-symbols-outlined text-[#9dabb9]">
								expand_more
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Account List */}
			<div className="p-6">
				{loading ? (
					<div className="text-center py-12">
						<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#137fec] mb-4"></div>
						<p className="text-[#9dabb9]">Loading accounts...</p>
					</div>
				) : filteredAccounts.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{filteredAccounts.map((account) => (
							<AccountCard
								key={account.id}
								account={account}
								onEdit={handleEditAccount}
								onToggleActive={handleToggleActive}
								onDelete={handleDeleteAccount}
							/>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
							person_off
						</span>
						<p className="text-[#9dabb9] text-lg">
							{searchQuery || roleFilter !== 'ALL'
								? 'No accounts found matching your filters.'
								: 'No accounts yet. Create your first staff account!'}
						</p>
					</div>
				)}
			</div>

			{/* Modal */}
			<AccountModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false)
					setEditingAccount(null)
				}}
				onSave={handleSaveAccount}
				editingAccount={editingAccount}
			/>
		</div>
	)
}

export default AccountManagement
