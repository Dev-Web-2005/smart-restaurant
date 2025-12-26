import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import AddDishModal from './AddDishModal'
import { useUser } from '../../../contexts/UserContext'
import {
	createMenuItemAPI,
	addMenuItemPhotoAPI,
	getMenuItemsAPI,
	getMenuItemPhotosAPI,
	deleteMenuItemPhotoAPI,
	setPrimaryPhotoAPI,
	deleteMenuItemAPI,
	updateMenuItemAPI,
	updateMenuItemStatusAPI,
} from '../../../services/api/itemAPI'
import { uploadFile } from '../../../services/api/fileAPI'
import {
	createModifierGroupAPI,
	getModifierGroupsAPI,
	updateModifierGroupAPI,
	deleteModifierGroupAPI,
	createModifierOptionAPI,
	getModifierOptionsAPI,
	updateModifierOptionAPI,
	deleteModifierOptionAPI,
	attachModifierGroupsAPI,
	getMenuItemModifierGroupsAPI,
	detachModifierGroupAPI,
} from '../../../services/api/modifierAPI'

// --- Helper functions for status display ---
const getStatusColor = (status) => {
	switch (status) {
		case 'AVAILABLE':
			return 'bg-green-500/20 text-green-400'
		case 'SOLD_OUT':
			return 'bg-orange-500/20 text-orange-400'
		case 'UNAVAILABLE':
		default:
			return 'bg-gray-500/20 text-gray-400'
	}
}

const getStatusLabel = (status) => {
	switch (status) {
		case 'AVAILABLE':
			return 'Có sẵn'
		case 'SOLD_OUT':
			return 'Hết hàng'
		case 'UNAVAILABLE':
		default:
			return 'Không có sẵn'
	}
}

// --- Dữ liệu Mock ---
const mockDishesData = {
	'noodle-dishes': [
		{
			id: 1,
			name: 'Spicy Miso Ramen',
			description:
				'A rich and flavorful ramen with a spicy miso broth, tender chashu pork, and a soft-boiled egg.',
			price: 15.5,
			image:
				'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=500&q=80',
			status: 'READY',
			preparationTime: 15,
			cookingTime: 15,
			spicyLevel: 3,
			isChefRecommendation: true,
			modifiers: [
				{
					id: 1,
					name: 'Size',
					type: 'SINGLE', // SINGLE or MULTIPLE
					required: true,
					minSelection: 1,
					maxSelection: 1,
					displayOrder: 1,
					options: [
						{ id: 1, name: 'Small', priceAdjustment: -2, isActive: true },
						{ id: 2, name: 'Medium', priceAdjustment: 0, isActive: true },
						{ id: 3, name: 'Large', priceAdjustment: 3, isActive: true },
					],
				},
				{
					id: 2,
					name: 'Add-ons',
					type: 'MULTIPLE',
					required: false,
					minSelection: 0,
					maxSelection: 5,
					displayOrder: 2,
					options: [
						{ id: 4, name: 'Extra Egg', priceAdjustment: 2, isActive: true },
						{ id: 5, name: 'Extra Pork', priceAdjustment: 4, isActive: true },
						{ id: 6, name: 'Extra Noodles', priceAdjustment: 2.5, isActive: true },
					],
				},
			],
		},
		{
			id: 2,
			name: 'Classic Pad Thai',
			description:
				'Wok-fried rice noodles with shrimp, tofu, peanuts, bean sprouts, and a tangy tamarind sauce.',
			price: 14.0,
			image:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCylxfP50ETWvYyVwTx3qbbPj27wYtyyW5GQ&s',
			status: 'READY',
			preparationTime: 12,
			cookingTime: 12,
			spicyLevel: 2,
			isChefRecommendation: false,
			modifiers: [],
		},
		{
			id: 3,
			name: 'Vietnamese Pho',
			description: 'Traditional Vietnamese beef noodle soup with herbs and lime.',
			price: 13.75,
			image:
				'https://iamafoodblog.b-cdn.net/wp-content/uploads/2017/11/authentic-instant-pot-pho-recipe-1959w.jpg',
			status: 'NOT_READY',
			preparationTime: 20,
			cookingTime: 20,
			spicyLevel: 1,
			isChefRecommendation: true,
			modifiers: [],
		},
		{
			id: 4,
			name: 'Udon Noodles',
			description: 'Thick wheat noodles in a savory broth with tempura.',
			price: 12.5,
			image:
				'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?auto=format&fit=crop&w=500&q=80',
			status: 'READY',
			preparationTime: 10,
			cookingTime: 10,
			spicyLevel: 0,
			isChefRecommendation: false,
			modifiers: [],
		},
	],
	soups: [],
	salads: [],
}

const formatCategoryName = (slug) => {
	if (!slug) return 'Dishes'
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

// 🆕 MODAL QUẢN LÝ MODIFIERS
const ModifiersModal = ({ isOpen, dish, onClose, onSave }) => {
	const modalRef = useRef(null)
	const { user } = useUser()
	const [isVisible, setIsVisible] = useState(false)
	const [modifierGroups, setModifierGroups] = useState([]) // All available modifier groups
	const [attachedGroups, setAttachedGroups] = useState([]) // Groups attached to this item
	const [editingGroup, setEditingGroup] = useState(null)
	const [isAddingNew, setIsAddingNew] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)

	// Fetch modifier groups and attached groups when modal opens
	useEffect(() => {
		console.log(
			'🔄 [ModifiersModal] useEffect triggered. isOpen:',
			isOpen,
			'dish:',
			dish?.id,
			'tenantId:',
			user?.userId,
		)
		if (isOpen && dish && user?.userId) {
			console.log('✅ [ModifiersModal] All conditions met, calling fetchModifierData...')
			fetchModifierData()
		} else {
			console.log('❌ [ModifiersModal] Conditions not met:', {
				isOpen,
				hasDish: !!dish,
				hasTenant: !!user?.userId,
			})
		}
	}, [isOpen, dish, user])

	const fetchModifierData = async () => {
		console.log('📥 [ModifiersModal] Fetching modifier data for tenant:', user.userId)
		setLoading(true)
		try {
			// Fetch all modifier groups for tenant
			const groupsResponse = await getModifierGroupsAPI(user.userId, {
				isActive: true,
			})
			console.log('✅ [ModifiersModal] Groups response:', groupsResponse)

			// Fetch groups with options
			const groupsWithOptions = await Promise.all(
				(groupsResponse.data || []).map(async (group) => {
					try {
						const optionsResponse = await getModifierOptionsAPI(user.userId, group.id, {
							isActive: true,
						})
						return { ...group, options: optionsResponse.data || [] }
					} catch (error) {
						console.error('Error fetching options for group:', group.id, error)
						return { ...group, options: [] }
					}
				}),
			)
			console.log('✅ [ModifiersModal] Groups with options:', groupsWithOptions)
			setModifierGroups(groupsWithOptions)

			// Fetch attached groups for this menu item
			try {
				const attachedResponse = await getMenuItemModifierGroupsAPI(user.userId, dish.id)
				console.log('✅ [ModifiersModal] Attached groups:', attachedResponse)
				setAttachedGroups(attachedResponse.data || [])
			} catch (attachError) {
				console.warn(
					'⚠️ [ModifiersModal] Failed to fetch attached groups (API may not be implemented):',
					attachError.response?.status,
					attachError.message,
				)
				// Don't crash - just set empty attached groups
				setAttachedGroups([])
			}
		} catch (error) {
			console.error('❌ [ModifiersModal] Error fetching modifier data:', error)
			console.error('❌ [ModifiersModal] Error response:', error.response)
			console.error('❌ [ModifiersModal] Error data:', error.response?.data)
			console.error('❌ [ModifiersModal] Error status:', error.response?.status)
			alert(
				'Failed to load modifier data: ' +
					(error.response?.data?.message || error.message),
			)
		} finally {
			console.log('✅ [ModifiersModal] Fetch complete. Loading:', false)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
			setEditingGroup(null)
			setIsAddingNew(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen || !dish) return null

	const handleAddGroup = () => {
		console.log(
			'➕ [ModifiersModal] Adding new group. Current groups:',
			modifierGroups.length,
		)
		const newGroup = {
			id: null, // null means it's a new group
			name: '',
			description: '',
			displayOrder: modifierGroups.length,
			isActive: true,
			options: [],
		}
		console.log('➕ [ModifiersModal] New group template:', newGroup)
		setEditingGroup(newGroup)
		setIsAddingNew(true)
	}

	const handleSaveGroup = async (group) => {
		console.log('💾 [ModifiersModal] Saving group:', group)
		console.log('💾 [ModifiersModal] Is adding new:', isAddingNew)
		if (!group.name.trim()) {
			console.error('❌ [ModifiersModal] Group name is empty')
			alert('Please enter group name')
			return
		}

		console.log('💾 [ModifiersModal] Starting save process...')
		setSaving(true)
		try {
			if (isAddingNew) {
				console.log('➕ [ModifiersModal] Creating new group via API...')
				// Create new group
				const response = await createModifierGroupAPI(user.userId, {
					name: group.name,
					description: group.description,
					displayOrder: group.displayOrder,
					isActive: group.isActive,
				})

				console.log('🔍 Create group response:', response)

				// Backend returns { status, message, data: { id, ... } }
				const newGroupId = response.data?.id || response.id

				if (!newGroupId) {
					console.error('❌ No group ID in response:', response)
					throw new Error('Failed to get group ID from server response')
				}

				// Create options for the new group
				for (const option of group.options) {
					if (option.label?.trim()) {
						await createModifierOptionAPI(user.userId, newGroupId, {
							label: option.label || option.name,
							priceDelta: option.priceDelta || option.priceAdjustment || 0,
							displayOrder: option.displayOrder,
							isActive: option.isActive,
						})
					}
				}
			} else {
				// Update existing group
				await updateModifierGroupAPI(user.userId, group.id, {
					name: group.name,
					description: group.description,
					displayOrder: group.displayOrder,
					isActive: group.isActive,
				})

				// Update options
				for (const option of group.options) {
					if (option.id && typeof option.id === 'string' && option.id.length > 10) {
						// Existing option - update
						await updateModifierOptionAPI(user.userId, group.id, option.id, {
							label: option.label || option.name,
							priceDelta: option.priceDelta || option.priceAdjustment || 0,
							displayOrder: option.displayOrder,
							isActive: option.isActive,
						})
					} else {
						// New option - create
						await createModifierOptionAPI(user.userId, group.id, {
							label: option.label || option.name,
							priceDelta: option.priceDelta || option.priceAdjustment || 0,
							displayOrder: option.displayOrder,
							isActive: option.isActive,
						})
					}
				}
			}

			// Refresh data
			await fetchModifierData()
			setEditingGroup(null)
			setIsAddingNew(false)
		} catch (error) {
			console.error('Error saving group:', error)
			alert('Failed to save group: ' + (error.response?.data?.message || error.message))
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteGroup = async (groupId) => {
		if (!confirm('Bạn có chắc muốn xóa nhóm modifier này?')) return

		setSaving(true)
		try {
			await deleteModifierGroupAPI(user.userId, groupId)
			await fetchModifierData()
		} catch (error) {
			console.error('Error deleting group:', error)
			alert('Failed to delete group: ' + (error.response?.data?.message || error.message))
		} finally {
			setSaving(false)
		}
	}

	const handleAttachGroup = async (groupId, config = {}) => {
		setSaving(true)
		try {
			await attachModifierGroupsAPI(user.userId, dish.id, {
				modifierGroups: [
					{
						modifierGroupId: groupId,
						displayOrder: config.displayOrder || 0,
						isRequired: config.isRequired || false,
						minSelections: config.minSelections || 0,
						maxSelections: config.maxSelections || 1,
					},
				],
			})
			await fetchModifierData()
		} catch (error) {
			console.error('Error attaching group:', error)
			alert('Failed to attach group: ' + (error.response?.data?.message || error.message))
		} finally {
			setSaving(false)
		}
	}

	const handleDetachGroup = async (groupId) => {
		if (!confirm('Bạn có chắc muốn gỡ nhóm modifier này khỏi món ăn?')) return

		setSaving(true)
		try {
			await detachModifierGroupAPI(user.userId, dish.id, groupId)
			await fetchModifierData()
		} catch (error) {
			console.error('Error detaching group:', error)
			alert('Failed to detach group: ' + (error.response?.data?.message || error.message))
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteOption = async (groupId, optionId) => {
		if (!confirm('Bạn có chắc muốn xóa option này?')) return

		setSaving(true)
		try {
			await deleteModifierOptionAPI(user.userId, groupId, optionId)
			await fetchModifierData()
		} catch (error) {
			console.error('Error deleting option:', error)
			alert(
				'Failed to delete option: ' + (error.response?.data?.message || error.message),
			)
		} finally {
			setSaving(false)
		}
	}

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div>
						<h2 className="text-2xl font-bold text-white m-0">Manage Modifiers</h2>
						<p className="text-sm text-[#9dabb9] mt-1">{dish.name}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{loading ? (
						<div className="text-center py-12">
							<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#137fec] mb-4"></div>
							<p className="text-[#9dabb9]">Loading modifiers...</p>
						</div>
					) : editingGroup ? (
						<ModifierGroupEditor
							group={editingGroup}
							onSave={handleSaveGroup}
							onCancel={() => {
								setEditingGroup(null)
								setIsAddingNew(false)
							}}
							saving={saving}
						/>
					) : (
						<>
							{/* Attached Groups Section */}
							<div className="mb-6">
								<h3 className="text-lg font-bold text-white mb-4">
									Các nhóm modifier đã gắn ({attachedGroups.length})
								</h3>
								{attachedGroups.length === 0 ? (
									<div className="text-center py-8 bg-[#2D3748] rounded-lg border border-white/10">
										<p className="text-[#9dabb9]">Chưa có nhóm modifier nào được gắn</p>
									</div>
								) : (
									<div className="space-y-3">
										{attachedGroups.map((attached) => {
											const group = attached.modifierGroup
											return (
												<div
													key={attached.id}
													className="bg-[#2D3748] rounded-lg p-4 border border-green-500/30"
												>
													<div className="flex items-start justify-between mb-3">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<h4 className="text-base font-bold text-white m-0">
																	{group.name}
																</h4>
																<span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
																	Đã gắn
																</span>
																{attached.isRequired && (
																	<span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
																		Bắt buộc
																	</span>
																)}
															</div>
															{group.description && (
																<p className="text-sm text-[#9dabb9] m-0">
																	{group.description}
																</p>
															)}
															<p className="text-xs text-[#9dabb9] mt-1">
																Chọn: {attached.minSelections} - {attached.maxSelections}
															</p>
														</div>
														<button
															onClick={() => handleDetachGroup(group.id)}
															disabled={saving}
															className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
														>
															<span className="material-symbols-outlined text-lg">
																link_off
															</span>
														</button>
													</div>

													{/* Options */}
													<div className="space-y-2 ml-4">
														{(group.options || []).map((option) => (
															<div
																key={option.id}
																className="flex items-center justify-between p-2 bg-[#1A202C] rounded"
															>
																<span className="text-white text-sm">{option.label}</span>
																{option.priceDelta !== 0 && (
																	<span
																		className={`text-sm font-semibold ${
																			option.priceDelta > 0
																				? 'text-green-400'
																				: 'text-red-400'
																		}`}
																	>
																		{option.priceDelta > 0 ? '+' : ''}$
																		{option.priceDelta.toFixed(2)}
																	</span>
																)}
															</div>
														))}
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>

							{/* Available Groups Section */}
							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-bold text-white m-0">
										Tất cả nhóm modifier ({modifierGroups.length})
									</h3>
									<button
										onClick={handleAddGroup}
										disabled={saving}
										className="px-3 py-1.5 bg-[#137fec] text-white rounded text-sm hover:bg-[#0d6ecc] flex items-center gap-1 disabled:opacity-50"
									>
										<span className="material-symbols-outlined text-sm">add</span>
										Tạo nhóm mới
									</button>
								</div>

								{modifierGroups.length === 0 ? (
									<div className="text-center py-8 bg-[#2D3748] rounded-lg border border-white/10">
										<span className="material-symbols-outlined text-5xl text-[#9dabb9] mb-4">
											tune
										</span>
										<p className="text-[#9dabb9] mb-4">Chưa có nhóm modifier nào</p>
										<button
											onClick={handleAddGroup}
											disabled={saving}
											className="px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0d6ecc] font-semibold disabled:opacity-50"
										>
											Tạo nhóm đầu tiên
										</button>
									</div>
								) : (
									<div className="space-y-3">
										{modifierGroups.map((group) => {
											const isAttached = attachedGroups.some(
												(a) => a.modifierGroup.id === group.id,
											)
											return (
												<div
													key={group.id}
													className="bg-[#2D3748] rounded-lg p-4 border border-white/10"
												>
													<div className="flex items-start justify-between mb-3">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<h4 className="text-base font-bold text-white m-0">
																	{group.name}
																</h4>
																{isAttached && (
																	<span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
																		Đã gắn
																	</span>
																)}
															</div>
															{group.description && (
																<p className="text-sm text-[#9dabb9] m-0">
																	{group.description}
																</p>
															)}
															<p className="text-xs text-[#9dabb9] mt-1">
																{(group.options || []).length} options
															</p>
														</div>
														<div className="flex gap-2">
															{!isAttached && (
																<button
																	onClick={() => handleAttachGroup(group.id)}
																	disabled={saving}
																	className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50"
																	title="Gắn vào món ăn"
																>
																	<span className="material-symbols-outlined text-lg">
																		add_link
																	</span>
																</button>
															)}
															<button
																onClick={() => setEditingGroup(group)}
																disabled={saving}
																className="p-2 text-[#9dabb9] hover:text-white hover:bg-[#1A202C] rounded transition-colors disabled:opacity-50"
															>
																<span className="material-symbols-outlined text-lg">
																	edit
																</span>
															</button>
															<button
																onClick={() => handleDeleteGroup(group.id)}
																disabled={saving}
																className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
															>
																<span className="material-symbols-outlined text-lg">
																	delete
																</span>
															</button>
														</div>
													</div>

													{/* Options */}
													{(group.options || []).length > 0 && (
														<div className="space-y-2 ml-4">
															{group.options.map((option) => (
																<div
																	key={option.id}
																	className="flex items-center justify-between p-2 bg-[#1A202C] rounded text-sm"
																>
																	<span className="text-white">{option.label}</span>
																	<div className="flex items-center gap-2">
																		{option.priceDelta !== 0 && (
																			<span
																				className={`font-semibold ${
																					option.priceDelta > 0
																						? 'text-green-400'
																						: 'text-red-400'
																				}`}
																			>
																				{option.priceDelta > 0 ? '+' : ''}$
																				{option.priceDelta.toFixed(2)}
																			</span>
																		)}
																		<span
																			className={`text-xs px-2 py-1 rounded ${
																				option.isActive
																					? 'bg-green-500/20 text-green-400'
																					: 'bg-gray-500/20 text-gray-400'
																			}`}
																		>
																			{option.isActive ? 'Active' : 'Inactive'}
																		</span>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				{!editingGroup && (
					<div className="flex justify-end gap-3 p-6 border-t border-white/10">
						<button
							onClick={onClose}
							disabled={saving}
							className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors disabled:opacity-50"
						>
							Đóng
						</button>
					</div>
				)}
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// 🆕 MODIFIER GROUP EDITOR COMPONENT
const ModifierGroupEditor = ({ group, onSave, onCancel, saving }) => {
	const [formData, setFormData] = useState(group)

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const handleAddOption = () => {
		const newOption = {
			id: Date.now(), // Temporary ID for new options
			label: '',
			priceDelta: 0,
			displayOrder: formData.options.length,
			isActive: true,
		}
		setFormData((prev) => ({
			...prev,
			options: [...prev.options, newOption],
		}))
	}

	const handleUpdateOption = (optionId, field, value) => {
		setFormData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId ? { ...opt, [field]: value } : opt,
			),
		}))
	}

	const handleDeleteOption = (optionId) => {
		setFormData((prev) => ({
			...prev,
			options: prev.options.filter((opt) => opt.id !== optionId),
		}))
	}

	return (
		<div className="space-y-4">
			<div className="bg-[#2D3748] rounded-lg p-4 border border-white/10">
				<h3 className="text-lg font-bold text-white mb-4">Chi tiết nhóm modifier</h3>

				<div className="space-y-4">
					<div>
						<label className="block text-[#9dabb9] text-sm mb-2">Tên nhóm *</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleChange('name', e.target.value)}
							className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
							placeholder="VD: Size, Topping, Thêm món"
							disabled={saving}
						/>
					</div>

					<div>
						<label className="block text-[#9dabb9] text-sm mb-2">Mô tả</label>
						<textarea
							value={formData.description || ''}
							onChange={(e) => handleChange('description', e.target.value)}
							className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
							placeholder="Mô tả cho nhóm modifier này..."
							rows={2}
							disabled={saving}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-[#9dabb9] text-sm mb-2">Thứ tự hiển thị</label>
							<input
								type="number"
								min="0"
								value={formData.displayOrder}
								onChange={(e) => handleChange('displayOrder', parseInt(e.target.value))}
								className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
								disabled={saving}
							/>
						</div>

						<div>
							<label className="block text-[#9dabb9] text-sm mb-2">Trạng thái</label>
							<label className="flex items-center gap-2 px-4 py-2 bg-[#1A202C] rounded-lg border border-white/10 cursor-pointer">
								<input
									type="checkbox"
									checked={formData.isActive}
									onChange={(e) => handleChange('isActive', e.target.checked)}
									className="w-4 h-4"
									disabled={saving}
								/>
								<span className="text-white">Kích hoạt</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Options Section */}
			<div className="bg-[#2D3748] rounded-lg p-4 border border-white/10">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-white m-0">Options</h3>
					<button
						onClick={handleAddOption}
						disabled={saving}
						className="px-3 py-1.5 bg-[#137fec] text-white rounded text-sm hover:bg-[#0d6ecc] flex items-center gap-1 disabled:opacity-50"
					>
						<span className="material-symbols-outlined text-sm">add</span>
						Thêm option
					</button>
				</div>

				<div className="space-y-2">
					{formData.options.map((option, index) => (
						<div
							key={option.id}
							className="flex items-center gap-2 p-3 bg-[#1A202C] rounded-lg"
						>
							<span className="text-[#9dabb9] text-sm w-6">{index + 1}.</span>
							<input
								type="text"
								value={option.label || option.name || ''}
								onChange={(e) => handleUpdateOption(option.id, 'label', e.target.value)}
								className="flex-1 px-3 py-2 bg-[#2D3748] text-white rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] text-sm"
								placeholder="Tên option"
								disabled={saving}
							/>
							<div className="flex items-center gap-1">
								<span className="text-[#9dabb9] text-sm">$</span>
								<input
									type="number"
									step="0.01"
									value={option.priceDelta || option.priceAdjustment || 0}
									onChange={(e) =>
										handleUpdateOption(
											option.id,
											'priceDelta',
											parseFloat(e.target.value) || 0,
										)
									}
									className="w-20 px-2 py-2 bg-[#2D3748] text-white rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] text-sm"
									disabled={saving}
								/>
							</div>
							<label className="flex items-center gap-1 cursor-pointer">
								<input
									type="checkbox"
									checked={option.isActive}
									onChange={(e) =>
										handleUpdateOption(option.id, 'isActive', e.target.checked)
									}
									className="w-4 h-4"
									disabled={saving}
								/>
								<span className="text-[#9dabb9] text-xs">Active</span>
							</label>
							<button
								onClick={() => handleDeleteOption(option.id)}
								disabled={saving}
								className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded disabled:opacity-50"
							>
								<span className="material-symbols-outlined text-lg">delete</span>
							</button>
						</div>
					))}
					{formData.options.length === 0 && (
						<p className="text-center text-[#9dabb9] py-4 text-sm italic">
							Chưa có option. Click "Thêm option" để tạo mới.
						</p>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3">
				<button
					onClick={onCancel}
					disabled={saving}
					className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors disabled:opacity-50"
				>
					Hủy
				</button>
				<button
					onClick={() => onSave(formData)}
					disabled={saving}
					className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
				>
					{saving && (
						<div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
					)}
					Lưu nhóm modifier
				</button>
			</div>
		</div>
	)
}

// Modal Xác nhận Xóa
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-black/80 backdrop-blur-md rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				<h3 className="text-2xl font-bold text-red-500 mb-4">{title}</h3>
				<p className="text-[#9dabb9] mb-6">{message}</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-lg bg-[#2D3748] text-white transition-colors hover:bg-[#4A5568]"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold transition-colors hover:bg-red-700"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// DishDetailsModal (đã cập nhật với Modifiers)
const DishDetailsModal = ({ isOpen, dish, onClose, onSave, onToggleStatus }) => {
	const modalRef = useRef(null)
	const { user } = useUser()
	const [isVisible, setIsVisible] = useState(false)
	const [activeTab, setActiveTab] = useState('view')
	const [editFormData, setEditFormData] = useState(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false)

	// Focus and cursor position tracking for Edit tab
	const nameInputRef = useRef(null)
	const descriptionInputRef = useRef(null)
	const priceInputRef = useRef(null)
	const preparationTimeInputRef = useRef(null)
	const imageInputRef = useRef(null)
	const lastFocusedField = useRef(null)
	const cursorPosition = useRef(null)

	// Photo management states
	const [photos, setPhotos] = useState([])
	const [loadingPhotos, setLoadingPhotos] = useState(false)
	const [uploadingPhoto, setUploadingPhoto] = useState(false)

	useEffect(() => {
		if (dish) {
			setEditFormData({
				name: dish.name || '',
				description: dish.description || '',
				price: dish.price || 0,
				image: dish.image || '',
				preparationTime: dish.preparationTime || 0,
			})
			// Ensure photos is always an array
			const dishPhotos = dish.photos || []
			setPhotos(Array.isArray(dishPhotos) ? dishPhotos : [])
		}
	}, [dish])

	// Fetch photos when Photos tab is active
	useEffect(() => {
		if (activeTab === 'photos' && dish && user) {
			fetchPhotos()
		}
	}, [activeTab, dish, user])

	// Restore focus and cursor position in Edit tab after re-render
	useEffect(() => {
		if (isOpen && activeTab === 'edit' && lastFocusedField.current) {
			const refMap = {
				name: nameInputRef,
				description: descriptionInputRef,
				price: priceInputRef,
				preparationTime: preparationTimeInputRef,
				image: imageInputRef,
			}
			const targetRef = refMap[lastFocusedField.current]
			if (targetRef?.current) {
				targetRef.current.focus()
				// Restore cursor position for text inputs/textareas
				if (cursorPosition.current !== null) {
					targetRef.current.setSelectionRange(
						cursorPosition.current,
						cursorPosition.current,
					)
				}
			}
		}
	})

	const fetchPhotos = async () => {
		if (!dish || !user) return

		setLoadingPhotos(true)
		try {
			const result = await getMenuItemPhotosAPI(user.userId, dish.id)
			if (result.success) {
				const fetchedPhotos = result.photos || []
				// Ensure photos is always an array
				setPhotos(Array.isArray(fetchedPhotos) ? fetchedPhotos : [])
			}
		} catch (error) {
			console.error('Failed to fetch photos:', error)
			setPhotos([]) // Reset to empty array on error
		} finally {
			setLoadingPhotos(false)
		}
	}

	const handleAddPhoto = async (e) => {
		const file = e.target.files?.[0]
		if (!file || !user || !dish) return

		// Check limit
		if (photos.length >= 5) {
			alert('Maximum 5 photos per item')
			return
		}

		setUploadingPhoto(true)
		try {
			// Upload to cloud
			const url = await uploadFile(file, 'image')

			// Add to backend
			const result = await addMenuItemPhotoAPI(user.userId, dish.id, {
				url,
				isPrimary: photos.length === 0, // First photo is primary
				displayOrder: photos.length + 1,
			})

			if (result.success) {
				setPhotos([...photos, result.photo])
				// Update parent component
				onSave({ ...dish, photos: [...photos, result.photo] })
				alert('Photo added successfully!')
			}
		} catch (error) {
			console.error('Failed to add photo:', error)
			alert(error.message || 'Failed to add photo')
		} finally {
			setUploadingPhoto(false)
			e.target.value = '' // Reset input
		}
	}

	const handleSetPrimary = async (photoId) => {
		if (!user || !dish) return

		try {
			const result = await setPrimaryPhotoAPI(user.userId, dish.id, photoId)
			if (result.success) {
				// Update photos list
				const updatedPhotos = photos.map((p) => ({
					...p,
					isPrimary: p.id === photoId,
				}))
				setPhotos(updatedPhotos)
				// Update parent component
				onSave({ ...dish, photos: updatedPhotos })
				alert('Primary photo updated!')
			}
		} catch (error) {
			console.error('Failed to set primary photo:', error)
			alert(error.message || 'Failed to set primary photo')
		}
	}

	const handleDeletePhoto = async (photoId) => {
		if (!user || !dish) return
		if (!confirm('Delete this photo?')) return

		try {
			const result = await deleteMenuItemPhotoAPI(user.userId, dish.id, photoId)
			if (result.success) {
				const updatedPhotos = photos.filter((p) => p.id !== photoId)
				setPhotos(updatedPhotos)
				// Update parent component
				onSave({ ...dish, photos: updatedPhotos })
				alert('Photo deleted successfully!')
			}
		} catch (error) {
			console.error('Failed to delete photo:', error)
			alert(error.message || 'Failed to delete photo')
		}
	}

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			setActiveTab('view')
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen || !dish) return null

	const handleInputChange = (e) => {
		const { name, value } = e.target
		lastFocusedField.current = name
		// Save cursor position before state update
		cursorPosition.current = e.target.selectionStart
		setEditFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSave = async () => {
		if (
			!editFormData.name.trim() ||
			!editFormData.description.trim() ||
			editFormData.price <= 0
		) {
			alert('Vui lòng điền đầy đủ các trường bắt buộc')
			return
		}

		if (!user || !user.userId) {
			alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
			return
		}

		setIsSaving(true)
		try {
			const tenantId = user.userId
			const itemId = dish.id

			console.log('📝 Updating menu item:', itemId)

			// Prepare update data
			const updateData = {
				name: editFormData.name.trim(),
				description: editFormData.description.trim(),
				price: editFormData.price,
			}

			// Add preparation time if provided
			if (
				editFormData.preparationTime !== undefined &&
				editFormData.preparationTime !== null &&
				editFormData.preparationTime !== ''
			) {
				updateData.prepTimeMinutes = parseInt(editFormData.preparationTime)
			}

			// Call backend API
			const result = await updateMenuItemAPI(tenantId, itemId, updateData)

			if (!result.success) {
				throw new Error(result.message || 'Không thể cập nhật món ăn')
			}

			console.log('✅ Menu item updated successfully')

			// Update local state with returned data
			const updatedDish = {
				...dish,
				name: result.item.name,
				description: result.item.description,
				price: result.item.price,
				preparationTime: result.item.prepTimeMinutes || 0,
				cookingTime: result.item.prepTimeMinutes || 0,
			}

			onSave(updatedDish)
			setActiveTab('view')
			alert('Cập nhật món ăn thành công!')
		} catch (error) {
			console.error('❌ Update menu item error:', error)
			alert(`Không thể cập nhật món ăn: ${error.message}`)
		} finally {
			setIsSaving(false)
		}
	}

	const isAvailable = dish.status === 'AVAILABLE'

	const calculateTotalPrice = (basePrice, selectedModifiers) => {
		let total = basePrice
		selectedModifiers.forEach((mod) => {
			mod.selectedOptions.forEach((opt) => {
				total += opt.priceAdjustment
			})
		})
		return total
	}

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div className="flex items-center gap-3">
						<h2 className="text-2xl font-bold text-white m-0">{dish.name}</h2>
						<span
							className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
								dish.status,
							)}`}
						>
							{getStatusLabel(dish.status)}
						</span>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				<div className="flex border-b border-white/10">
					<button
						onClick={() => setActiveTab('view')}
						className={`flex-1 px-6 py-3 font-semibold transition-colors ${
							activeTab === 'view'
								? 'text-[#137fec] border-b-2 border-[#137fec]'
								: 'text-[#9dabb9] hover:text-white'
						}`}
					>
						View Details
					</button>
					<button
						onClick={() => setActiveTab('photos')}
						className={`flex-1 px-6 py-3 font-semibold transition-colors ${
							activeTab === 'photos'
								? 'text-[#137fec] border-b-2 border-[#137fec]'
								: 'text-[#9dabb9] hover:text-white'
						}`}
					>
						Photos ({photos.length}/5)
					</button>
					<button
						onClick={() => setActiveTab('edit')}
						className={`flex-1 px-6 py-3 font-semibold transition-colors ${
							activeTab === 'edit'
								? 'text-[#137fec] border-b-2 border-[#137fec]'
								: 'text-[#9dabb9] hover:text-white'
						}`}
					>
						Edit Dish
					</button>
				</div>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
					{activeTab === 'view' ? (
						<div className="space-y-6">
							<div className="w-full h-64 rounded-lg overflow-hidden">
								<img
									src={
										dish.primaryPhoto?.url ||
										dish.image ||
										'https://via.placeholder.com/400x300?text=No+Image'
									}
									alt={dish.name}
									className="w-full h-full object-cover"
									onError={(e) => {
										e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'
									}}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-[#9dabb9] text-sm mb-1">Price</p>
									<p className="text-white text-2xl font-bold">
										${dish.price.toFixed(2)}
									</p>
								</div>
								{dish.preparationTime && (
									<div>
										<p className="text-[#9dabb9] text-sm mb-1">Preparation Time</p>
										<p className="text-white text-lg">{dish.preparationTime} mins</p>
									</div>
								)}
							</div>

							<div>
								<p className="text-[#9dabb9] text-sm mb-2">Description</p>
								<p className="text-white leading-relaxed">{dish.description}</p>
							</div>

							{/* 🆕 HIỂN THỊ MODIFIERS */}
							{dish.modifiers && dish.modifiers.length > 0 && (
								<div>
									<div className="flex items-center justify-between mb-3">
										<p className="text-[#9dabb9] text-sm m-0">Customization Options</p>
										<button
											onClick={() => setIsModifiersModalOpen(true)}
											className="text-sm text-[#137fec] hover:text-[#0d6ecc] flex items-center gap-1"
										>
											<span className="material-symbols-outlined text-sm">edit</span>
											Manage
										</button>
									</div>
									<div className="space-y-3">
										{dish.modifiers.map((modifier) => (
											<div key={modifier.id} className="bg-[#2D3748] rounded-lg p-3">
												<div className="flex items-center gap-2 mb-2">
													<h4 className="text-white font-semibold m-0">
														{modifier.name}
													</h4>
													<span
														className={`text-xs px-2 py-0.5 rounded ${
															modifier.type === 'SINGLE'
																? 'bg-blue-500/20 text-blue-400'
																: 'bg-purple-500/20 text-purple-400'
														}`}
													>
														{modifier.type === 'SINGLE' ? 'Single' : 'Multiple'}
													</span>
													{modifier.required && (
														<span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
															Required
														</span>
													)}
												</div>
												<div className="flex flex-wrap gap-2">
													{modifier.options.map((option) => (
														<div
															key={option.id}
															className={`px-2 py-1 rounded text-xs ${
																option.isActive
																	? 'bg-[#1A202C] text-white'
																	: 'bg-gray-500/20 text-gray-400'
															}`}
														>
															{option.name}
															{option.priceAdjustment !== 0 && (
																<span className="ml-1 font-semibold text-green-400">
																	+${option.priceAdjustment.toFixed(2)}
																</span>
															)}
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex gap-3 pt-4 border-t border-white/10">
								<button
									onClick={() => {
										console.log(
											'📖 [CategoryDishes] Opening modifiers modal for dish:',
											dish.id,
											dish.name,
										)
										setIsModifiersModalOpen(true)
									}}
									className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors bg-[#137fec]/20 text-[#137fec] hover:bg-[#137fec]/30"
								>
									<span className="material-symbols-outlined">tune</span>
									{dish.modifiers?.length > 0 ? 'Manage Modifiers' : 'Add Modifiers'}
								</button>
								<div className="flex gap-2">
									<button
										onClick={() => onToggleStatus(dish, 'AVAILABLE')}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
											dish.status === 'AVAILABLE'
												? 'bg-green-500/30 text-green-300 border-2 border-green-500'
												: 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
										}`}
									>
										<span className="material-symbols-outlined text-sm">
											check_circle
										</span>
										Có sẵn
									</button>
									<button
										onClick={() => onToggleStatus(dish, 'SOLD_OUT')}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
											dish.status === 'SOLD_OUT'
												? 'bg-orange-500/30 text-orange-300 border-2 border-orange-500'
												: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
										}`}
									>
										<span className="material-symbols-outlined text-sm">
											production_quantity_limits
										</span>
										Hết hàng
									</button>
									<button
										onClick={() => onToggleStatus(dish, 'UNAVAILABLE')}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
											dish.status === 'UNAVAILABLE'
												? 'bg-gray-500/30 text-gray-300 border-2 border-gray-500'
												: 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
										}`}
									>
										<span className="material-symbols-outlined text-sm">block</span>
										Không sẵn
									</button>
								</div>
							</div>
						</div>
					) : activeTab === 'photos' ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-white m-0">
									Photo Gallery ({photos.length}/5)
								</h3>
								{photos.length < 5 && (
									<label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#137fec] text-white font-semibold hover:bg-[#0d6ecc] cursor-pointer transition-colors">
										<span className="material-symbols-outlined">add_photo_alternate</span>
										{uploadingPhoto ? 'Uploading...' : 'Add Photo'}
										<input
											type="file"
											accept="image/*"
											onChange={handleAddPhoto}
											className="sr-only"
											disabled={uploadingPhoto}
										/>
									</label>
								)}
							</div>

							{loadingPhotos ? (
								<div className="flex items-center justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
								</div>
							) : photos.length === 0 ? (
								<div className="text-center py-12 bg-[#2D3748] rounded-lg border-2 border-dashed border-white/10">
									<span className="material-symbols-outlined text-gray-500 text-6xl mb-3">
										photo_library
									</span>
									<p className="text-[#9dabb9] mb-4">No photos yet</p>
									<label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#137fec] text-white font-semibold hover:bg-[#0d6ecc] cursor-pointer transition-colors">
										<span className="material-symbols-outlined">add</span>
										Add First Photo
										<input
											type="file"
											accept="image/*"
											onChange={handleAddPhoto}
											className="sr-only"
											disabled={uploadingPhoto}
										/>
									</label>
								</div>
							) : (
								Array.isArray(photos) && (
									<div className="grid grid-cols-2 gap-4">
										{photos.map((photo, index) => (
											<div key={photo.id} className="relative group">
												<div className="aspect-square rounded-lg overflow-hidden bg-[#2D3748]">
													<img
														src={photo.url}
														alt={`Photo ${index + 1}`}
														className="w-full h-full object-cover"
													/>
												</div>

												{/* Primary badge */}
												{photo.isPrimary && (
													<div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
														<span className="material-symbols-outlined text-sm">
															star
														</span>
														Primary
													</div>
												)}

												{/* Action buttons */}
												<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
													{!photo.isPrimary && (
														<button
															onClick={() => handleSetPrimary(photo.id)}
															className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
															title="Set as primary"
														>
															<span className="material-symbols-outlined">star</span>
														</button>
													)}
													<button
														onClick={() => handleDeletePhoto(photo.id)}
														className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
														title="Delete photo"
													>
														<span className="material-symbols-outlined">delete</span>
													</button>
												</div>

												{/* Display order */}
												<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
													#{photo.displayOrder}
												</div>
											</div>
										))}
									</div>
								)
							)}

							<p className="text-sm text-[#9dabb9] mt-4">
								💡 The primary photo will be displayed as the main image. You can add up
								to 5 photos per item.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Dish Name *</label>
								<input
									ref={nameInputRef}
									type="text"
									name="name"
									value={editFormData?.name || ''}
									onChange={handleInputChange}
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									placeholder="Enter dish name"
								/>
							</div>

							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Description *</label>
								<textarea
									ref={descriptionInputRef}
									name="description"
									value={editFormData?.description || ''}
									onChange={handleInputChange}
									rows={4}
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] resize-none"
									placeholder="Enter dish description"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[#9dabb9] text-sm mb-2">Price ($) *</label>
									<input
										ref={priceInputRef}
										type="number"
										name="price"
										value={editFormData?.price || 0}
										onChange={handleInputChange}
										step="0.01"
										min="0.01"
										className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									/>
								</div>

								<div>
									<label className="block text-[#9dabb9] text-sm mb-2">
										Prep Time (mins)
									</label>
									<input
										ref={preparationTimeInputRef}
										type="number"
										name="preparationTime"
										value={editFormData?.preparationTime || 0}
										onChange={handleInputChange}
										min="0"
										className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Image URL</label>
								<input
									ref={imageInputRef}
									type="url"
									name="image"
									value={editFormData?.image || ''}
									onChange={handleInputChange}
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									placeholder="https://example.com/image.jpg"
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t border-white/10">
								<button
									onClick={() => setActiveTab('view')}
									className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSaving ? (
										<>
											<span className="material-symbols-outlined animate-spin">
												refresh
											</span>
											Saving...
										</>
									) : (
										<>
											<span className="material-symbols-outlined">check</span>
											Save Changes
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 🆕 NESTED MODIFIERS MODAL */}
			<ModifiersModal
				isOpen={isModifiersModalOpen}
				dish={dish}
				user={user}
				onClose={() => setIsModifiersModalOpen(false)}
				onSave={(updatedDish) => {
					onSave(updatedDish)
					setIsModifiersModalOpen(false)
				}}
			/>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// DishCard Component
const DishCard = ({ dish, onDelete, onClick, viewMode = 'grid' }) => {
	const [isHovering, setIsHovering] = useState(false)

	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDelete(dish)
	}

	const getStatusBadge = (status) => {
		switch (status) {
			case 'READY':
				return (
					<span className="text-green-400 text-sm font-bold bg-green-500/20 px-2 py-1 rounded-full">
						Ready
					</span>
				)
			case 'NOT_READY':
				return (
					<span className="text-yellow-400 text-sm font-bold bg-yellow-500/20 px-2 py-1 rounded-full">
						Not Ready
					</span>
				)
			default:
				return null
		}
	}

	if (viewMode === 'list') {
		return (
			<div
				onClick={() => onClick(dish)}
				className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:shadow-2xl hover:bg-black/50 transition-all cursor-pointer group"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
					<img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-xl font-bold text-white truncate">{dish.name}</h3>
						{dish.isChefRecommendation && (
							<span
								className="material-symbols-outlined text-yellow-400"
								title="Chef's Recommendation"
							>
								star
							</span>
						)}
						{getStatusBadge(dish.status)}
						{dish.modifiers?.length > 0 && (
							<span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#137fec]/20 text-[#137fec]">
								<span className="material-symbols-outlined text-sm">tune</span>
								{dish.modifiers.length}
							</span>
						)}
					</div>
					<p className="text-sm text-[#9dabb9] line-clamp-2">{dish.description}</p>
					<div className="flex items-center gap-4 mt-2 text-xs text-[#9dabb9]">
						{dish.cookingTime && (
							<span className="flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">schedule</span>
								{dish.cookingTime} mins
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-4">
					<p className="text-2xl font-black text-[#137fec]">
						${(dish.price || 0).toFixed(2)}
					</p>
					{isHovering && (
						<button
							onClick={handleDeleteClick}
							title={`Delete ${dish.name}`}
							className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700 active:scale-[0.98] border-none cursor-pointer p-0"
						>
							<span className="material-symbols-outlined text-base">close</span>
						</button>
					)}
				</div>
			</div>
		)
	}

	const isActive = dish.status === 'Active'

	return (
		<div className="flex flex-col items-center">
			<div
				onClick={() => onClick(dish)}
				className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-900 backdrop-blur-md transition-all group hover:shadow-2xl hover:scale-[1.02] border border-white/10 cursor-pointer"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<div
					className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
					style={{ backgroundImage: `url('${dish.image}')` }}
				>
					{!isActive && (
						<div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
							{getStatusBadge(dish.status)}
						</div>
					)}
					{dish.modifiers?.length > 0 && isActive && (
						<div className="absolute top-3 left-3 z-10 bg-[#137fec]/90 text-white px-2 py-1 rounded-full flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">tune</span>
							<span className="text-xs font-bold">{dish.modifiers.length}</span>
						</div>
					)}
				</div>
				<div className="absolute bottom-0 left-0 right-0 z-10 p-4">
					<div className="p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-lg backdrop-blur-sm transition-colors duration-300 group-hover:from-black/90 group-hover:via-black/70">
						<h3 className="text-xl font-bold text-white m-0 leading-tight">
							{dish.name}
						</h3>
						<p className="text-xs text-[#E2E8F0] mt-1 line-clamp-2 m-0">
							{dish.description}
						</p>
					</div>
				</div>

				{isHovering && (
					<button
						onClick={handleDeleteClick}
						title={`Delete ${dish.name}`}
						className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700 active:scale-[0.98] border-none cursor-pointer p-0"
					>
						<span className="material-symbols-outlined text-base">close</span>
					</button>
				)}
			</div>

			<div className="mt-3 text-center">
				<p className="text-3xl font-black text-[#137fec] mt-1 m-0">
					${(dish.price || 0).toFixed(2)}
				</p>
			</div>
		</div>
	)
}

const AddDishCard = ({ onClick }) => (
	<button
		onClick={onClick}
		className="flex flex-col items-center justify-center w-full aspect-square bg-black/30 backdrop-blur-md rounded-xl border-2 border-dashed border-white/20 h-full p-6 text-center transition-all duration-200 hover:bg-black/50 hover:border-blue-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
	>
		<span className="material-symbols-outlined text-7xl text-[#137fec] opacity-90 mb-2">
			add_circle
		</span>
		<h3 className="text-lg font-bold text-white">Add New Dish</h3>
	</button>
)

// Edit Category Modal
const EditCategoryModal = ({ isOpen, onClose, onSave, categoryData }) => {
	const modalRef = useRef(null)
	const [formData, setFormData] = useState({
		name: '',
		image: '',
	})
	const [previewImage, setPreviewImage] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (categoryData) {
			setFormData({
				name: categoryData.name || '',
				image: categoryData.image || '',
			})
			setPreviewImage(categoryData.image || null)
		}
	}, [categoryData])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose()
			}
		}

		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleEscape)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleFileChange = (e) => {
		const file = e.target.files[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewImage(reader.result)
				setFormData((prev) => ({ ...prev, image: reader.result }))
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)

		console.log('Updating category:', formData)

		setTimeout(() => {
			if (onSave) {
				onSave(formData)
			}
			setLoading(false)
			onClose()
		}, 1000)
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
				className={`relative w-full max-w-2xl mx-4 bg-[#1A202C] p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#9dabb9] hover:text-white transition-colors z-10"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="mb-8">
					<h2 className="text-2xl font-bold text-white m-0">Edit Category</h2>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label htmlFor="name" className="block text-sm font-medium text-gray-300">
							Category Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							placeholder="e.g., Appetizers, Main Courses"
							required
							autoFocus
							className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Category Image
						</label>
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
							<div className="shrink-0">
								<div
									className="w-32 h-32 bg-[#2D3748] rounded-lg flex items-center justify-center border-2 border-dashed border-[#4b5563] overflow-hidden bg-cover bg-center"
									style={
										previewImage
											? {
													backgroundImage: `url(${previewImage})`,
													border: 'none',
											  }
											: {}
									}
								>
									{!previewImage && (
										<span className="material-symbols-outlined text-gray-500 text-5xl">
											image
										</span>
									)}
								</div>
							</div>

							<div className="flex-1 space-y-3">
								<label
									htmlFor="file-upload"
									className="cursor-pointer inline-flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors"
								>
									<span>Upload New Image</span>
									<input
										id="file-upload"
										name="file-upload"
										type="file"
										className="sr-only"
										accept="image/*"
										onChange={handleFileChange}
									/>
								</label>
								<p className="text-xs text-[#9dabb9]">Or paste image URL below</p>
								<input
									type="url"
									id="image"
									name="image"
									value={formData.image}
									onChange={(e) => {
										handleChange(e)
										setPreviewImage(e.target.value)
									}}
									placeholder="https://example.com/image.jpg"
									className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400 text-sm"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end items-center gap-4 pt-4 border-t border-[#374151]">
						<button
							type="button"
							onClick={onClose}
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-transparent text-gray-300 text-sm font-bold hover:bg-[#4b5563] transition-colors"
							disabled={loading}
						>
							<span className="truncate">Cancel</span>
						</button>
						<button
							type="submit"
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
							disabled={loading || !formData.name.trim()}
						>
							{loading ? (
								<span className="truncate">Saving...</span>
							) : (
								<span className="truncate">Save Changes</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

const CategoryDishes = ({ categorySlug = 'noodle-dishes', category, onBack }) => {
	const navigate = useNavigate()
	const { user, loading: contextLoading } = useUser()
	const [dishes, setDishes] = useState([])
	const [categoryName, setCategoryName] = useState(category?.name || '')
	const [loading, setLoading] = useState(true)
	const [dishToDelete, setDishToDelete] = useState(null)
	const [selectedDish, setSelectedDish] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [sortBy, setSortBy] = useState('default')
	const [viewMode, setViewMode] = useState('grid')
	const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false)
	const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
	const [categoryImage, setCategoryImage] = useState(category?.image || '')

	// Debug user object
	console.log('🔍 [CategoryDishes] User object:', JSON.stringify(user, null, 2))
	console.log('🔍 [CategoryDishes] User keys:', user ? Object.keys(user) : 'null')

	// Helper function to delay execution for rate limiting
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	const fetchDishes = async () => {
		if (!user || !user.userId || !category || !category.id) {
			console.log('⏳ Waiting for user and category data...')
			return
		}

		const tenantId = user.userId
		const categoryId = category.id

		setLoading(true)
		try {
			console.log('📥 Fetching menu items for category:', categoryId)
			const result = await getMenuItemsAPI(tenantId, {
				categoryId: categoryId,
				sortBy: 'name',
				sortOrder: 'ASC',
			})

			if (result.success) {
				// Fetch photos for each item with rate limiting to avoid 5 API calls/second limit
				console.log(
					'📸 Fetching photos for',
					result.items.length,
					'items with rate limiting...',
				)

				const itemsWithPhotos = []
				const BATCH_SIZE = 4 // Fetch 4 items at a time to stay under 5 calls/second
				const DELAY_MS = 1000 // Wait 1 second between batches

				// Process items in batches
				for (let i = 0; i < result.items.length; i += BATCH_SIZE) {
					const batch = result.items.slice(i, i + BATCH_SIZE)
					console.log(
						`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
							result.items.length / BATCH_SIZE,
						)}...`,
					)

					const batchResults = await Promise.all(
						batch.map(async (item) => {
							try {
								const photosResult = await getMenuItemPhotosAPI(tenantId, item.id)
								const photos = photosResult.success ? photosResult.photos : []
								const primaryPhoto = photosResult.success
									? photosResult.primaryPhoto
									: null

								return {
									id: item.id,
									name: item.name,
									description: item.description || '',
									price: item.price,
									currency: item.currency || 'VND',
									image: primaryPhoto?.url || photos[0]?.url || '', // Use primary photo as main image
									photos: photos, // Store all photos
									primaryPhoto: primaryPhoto, // Store primary photo reference
									status: item.status, // "AVAILABLE", "UNAVAILABLE", "SOLD_OUT"
									preparationTime: item.prepTimeMinutes || 0,
									cookingTime: item.prepTimeMinutes || 0,
									isChefRecommendation: item.isChefRecommended || false,
									modifiers: [], // TODO: Implement modifiers if needed
								}
							} catch (photoError) {
								console.warn(`⚠️ Failed to fetch photos for item ${item.id}:`, photoError)
								return {
									id: item.id,
									name: item.name,
									description: item.description || '',
									price: item.price,
									currency: item.currency || 'VND',
									image: '',
									photos: [],
									status: item.status,
									preparationTime: item.prepTimeMinutes || 0,
									cookingTime: item.prepTimeMinutes || 0,
									isChefRecommendation: item.isChefRecommended || false,
									modifiers: [],
								}
							}
						}),
					)

					itemsWithPhotos.push(...batchResults)

					// Wait before processing next batch (except for the last batch)
					if (i + BATCH_SIZE < result.items.length) {
						console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`)
						await delay(DELAY_MS)
					}
				}

				// 🖼️ Preload all images before displaying dishes
				console.log('🖼️ Preloading images for', itemsWithPhotos.length, 'dishes...')
				const imagePromises = itemsWithPhotos
					.filter((dish) => dish.image) // Only preload dishes with images
					.map((dish) => {
						return new Promise((resolve) => {
							const img = new Image()
							img.onload = () => {
								console.log('✅ Image loaded:', dish.name)
								resolve()
							}
							img.onerror = () => {
								console.warn('⚠️ Failed to load image for:', dish.name)
								resolve() // Still resolve to not block other images
							}
							img.src = dish.image
						})
					})

				// Wait for all images to load
				await Promise.all(imagePromises)
				console.log('✅ All images preloaded')

				setDishes(itemsWithPhotos)
				console.log('✅ Menu items loaded:', itemsWithPhotos.length)
			} else {
				console.error('❌ Failed to fetch menu items:', result.message)
				setDishes([])
			}
		} catch (error) {
			console.error('❌ Error fetching menu items:', error)
			setDishes([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!contextLoading && user && category) {
			fetchDishes()
		}
	}, [contextLoading, user, category])

	const handleUpdateDish = (updatedDish) => {
		setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)))
		setSelectedDish(updatedDish)
	}

	const handleToggleDishStatus = async (dish, newStatus) => {
		if (!user || !user.userId) {
			alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
			return
		}

		if (dish.status === newStatus) {
			// Already in this status, no need to update
			return
		}

		try {
			const tenantId = user.userId
			const itemId = dish.id

			console.log(`🔄 Updating item status to: ${newStatus}`)

			// Call backend API
			const result = await updateMenuItemStatusAPI(tenantId, itemId, newStatus)

			if (!result.success) {
				throw new Error(result.message || 'Không thể cập nhật trạng thái')
			}

			console.log('✅ Status updated successfully')

			// Update local state
			setDishes((prev) =>
				prev.map((d) => (d.id === dish.id ? { ...d, status: newStatus } : d)),
			)

			if (selectedDish?.id === dish.id) {
				setSelectedDish({ ...dish, status: newStatus })
			}

			const statusLabel = getStatusLabel(newStatus)
			alert(`Đã cập nhật trạng thái thành: ${statusLabel}`)
		} catch (error) {
			console.error('❌ Update status error:', error)
			alert(`Không thể cập nhật trạng thái: ${error.message}`)
		}
	}

	const executeDeleteDish = async () => {
		if (!dishToDelete) return

		if (!user || !user.userId) {
			alert('User not found. Please login again.')
			setDishToDelete(null)
			return
		}

		const tenantId = user.userId
		const itemId = dishToDelete.id

		setDishToDelete(null)

		try {
			console.log('🗑️ Deleting menu item:', itemId)

			// Call backend API to delete menu item
			const result = await deleteMenuItemAPI(tenantId, itemId)

			if (!result.success) {
				throw new Error(result.message || 'Failed to delete menu item')
			}

			console.log('✅ Menu item deleted successfully')

			// Remove from UI
			setDishes((prevDishes) => prevDishes.filter((dish) => dish.id !== itemId))

			// Close modal if the deleted dish was being viewed
			if (selectedDish?.id === itemId) {
				setSelectedDish(null)
			}

			alert('Món ăn đã được xóa thành công!')
		} catch (error) {
			console.error('❌ Delete menu item error:', error)
			alert(`Không thể xóa món ăn: ${error.message}`)
		}
	}

	const handleSaveNewDish = async (newDish) => {
		if (!user || !user.userId) {
			alert('User not found. Please login again.')
			return
		}

		if (!category || !category.id) {
			alert('Category information is missing. Please go back and try again.')
			return
		}

		const tenantId = user.userId
		const categoryId = category.id

		try {
			console.log('📤 Creating new menu item for category:', categoryId)

			// Prepare item data for backend
			const itemData = {
				categoryId: categoryId,
				name: newDish.name,
				description: newDish.description || '',
				price: newDish.price,
				currency: 'VND',
				status: 'AVAILABLE',
			}

			// Add prepTimeMinutes if provided (0-240 minutes)
			if (
				newDish.preparationTime !== undefined &&
				newDish.preparationTime !== null &&
				newDish.preparationTime !== ''
			) {
				itemData.prepTimeMinutes = parseInt(newDish.preparationTime)
			}

			// Create menu item
			const result = await createMenuItemAPI(tenantId, itemData)

			if (!result.success) {
				throw new Error(result.message || 'Failed to create menu item')
			}

			console.log('✅ Menu item created:', result.item)

			// If there are image URLs, add them as photos
			const photoUrls = []
			if (newDish.imageUrls && newDish.imageUrls.length > 0) {
				console.log(
					`📤 Adding ${newDish.imageUrls.length} photo(s) to menu item:`,
					result.item.id,
				)

				// Upload photos sequentially with isPrimary flag for first photo
				for (let i = 0; i < newDish.imageUrls.length; i++) {
					const url = newDish.imageUrls[i]
					try {
						const photoResult = await addMenuItemPhotoAPI(tenantId, result.item.id, {
							url: url,
							isPrimary: i === 0, // First image is primary
							displayOrder: i + 1,
						})

						if (photoResult.success) {
							console.log(
								`✅ Photo ${i + 1}/${newDish.imageUrls.length} added successfully`,
							)
							photoUrls.push(photoResult.photo)
						} else {
							console.warn(`⚠️ Photo ${i + 1} upload failed:`, photoResult.message)
						}
					} catch (photoError) {
						console.error(`❌ Error adding photo ${i + 1}:`, photoError)
						// Continue with other photos even if one fails
					}
				}
			}

			// Add the new dish to local state
			// Find the primary photo (first one uploaded has isPrimary=true)
			const primaryPhoto = photoUrls.find((p) => p.isPrimary) || photoUrls[0]

			setDishes((prev) => [
				...prev,
				{
					...result.item,
					image: primaryPhoto?.url || '', // Use primary photo as main image
					photos: photoUrls,
					primaryPhoto: primaryPhoto, // Store primary photo reference
					modifiers: [],
				},
			])

			setIsAddDishModalOpen(false)
			alert(
				`Menu item created successfully${
					photoUrls.length > 0 ? ` with ${photoUrls.length} photo(s)` : ''
				}!`,
			)
		} catch (error) {
			console.error('❌ Error creating menu item:', error)
			alert(error.message || 'Failed to create menu item. Please try again.')
		}
	}

	const handleEditCategory = () => {
		setIsEditCategoryModalOpen(true)
	}

	const handleSaveCategory = (updatedCategory) => {
		if (updatedCategory.name.trim()) {
			setCategoryName(updatedCategory.name.trim())
		}
		if (updatedCategory.image) {
			setCategoryImage(updatedCategory.image)
		}
		setIsEditCategoryModalOpen(false)
		console.log('Category updated:', updatedCategory)
		// TODO: Call API to update category
	}

	const filteredDishes = React.useMemo(() => {
		let result = [...dishes]
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			result = result.filter(
				(dish) =>
					dish.name.toLowerCase().includes(query) ||
					dish.description.toLowerCase().includes(query),
			)
		}
		if (statusFilter !== 'ALL') {
			result = result.filter((dish) => dish.status === statusFilter)
		}
		switch (sortBy) {
			case 'name_asc':
				result.sort((a, b) => a.name.localeCompare(b.name))
				break
			case 'price_asc':
				result.sort((a, b) => a.price - b.price)
				break
			case 'price_desc':
				result.sort((a, b) => b.price - a.price)
				break
		}
		return result
	}, [dishes, searchQuery, statusFilter, sortBy])

	if (contextLoading || loading) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-transparent p-8">
			<div className="max-w-7xl mx-auto">
				<header className="mb-8 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-white text-4xl font-black mb-0">{categoryName}</h1>
						<button
							onClick={handleEditCategory}
							className="p-2 text-[#9dabb9] hover:text-white transition-colors"
							title="Edit category"
						>
							<span className="material-symbols-outlined">edit</span>
						</button>
					</div>
					<button
						onClick={() => navigate('/menu')}
						className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
						title="Back to categories"
					>
						<span className="material-symbols-outlined">close</span>
						<span>Close</span>
					</button>
				</header>

				<div className="mb-6 p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/20">
					<div className="flex gap-4">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search dishes..."
							className="flex-1 px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-all"
						/>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						>
							<option value="ALL">All Status</option>
							<option value="READY">Ready</option>
							<option value="NOT_READY">Not Ready</option>
						</select>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						>
							<option value="default">Default Sort</option>
							<option value="name_asc">Name A-Z</option>
							<option value="price_asc">Price Low-High</option>
							<option value="price_desc">Price High-Low</option>
						</select>
						<button
							onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
							className="px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0d6ecc] transition-colors"
						>
							<span className="material-symbols-outlined">
								{viewMode === 'grid' ? 'view_list' : 'grid_view'}
							</span>
						</button>
					</div>
				</div>

				<div
					className={`grid gap-6 ${
						viewMode === 'grid'
							? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
							: 'grid-cols-1'
					}`}
				>
					{filteredDishes.map((dish) => (
						<DishCard
							key={dish.id}
							dish={dish}
							onDelete={(d) => setDishToDelete(d)}
							onClick={(d) => setSelectedDish(d)}
							viewMode={viewMode}
						/>
					))}
					<AddDishCard onClick={() => setIsAddDishModalOpen(true)} />
				</div>
			</div>

			<DishDetailsModal
				isOpen={!!selectedDish}
				dish={selectedDish}
				onClose={() => setSelectedDish(null)}
				onSave={handleUpdateDish}
				onToggleStatus={handleToggleDishStatus}
			/>

			<ConfirmationModal
				isOpen={!!dishToDelete}
				title="Confirm Dish Deletion"
				message={dishToDelete ? `Delete "${dishToDelete.name}"?` : ''}
				onConfirm={executeDeleteDish}
				onClose={() => setDishToDelete(null)}
			/>

			<AddDishModal
				isOpen={isAddDishModalOpen}
				onClose={() => setIsAddDishModalOpen(false)}
				onSave={handleSaveNewDish}
				categorySlug={categorySlug}
				categoryName={categoryName}
			/>

			<EditCategoryModal
				isOpen={isEditCategoryModalOpen}
				onClose={() => setIsEditCategoryModalOpen(false)}
				onSave={handleSaveCategory}
				categoryData={{ name: categoryName, image: categoryImage }}
			/>

			<link
				href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
				rel="stylesheet"
			/>
		</div>
	)
}

export default CategoryDishes
