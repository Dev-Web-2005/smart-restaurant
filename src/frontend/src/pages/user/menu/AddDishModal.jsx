import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { uploadFile } from '../../../services/api/fileAPI'

const AddDishModal = ({ isOpen, onClose, onSave, categorySlug, categoryName }) => {
	const modalRef = useRef(null)
	const nameInputRef = useRef(null)
	const priceInputRef = useRef(null)
	const descriptionInputRef = useRef(null)
	const lastFocusedField = useRef(null)
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		price: '',
		imageFile: null,
	})
	const [previewImage, setPreviewImage] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
				// Focus first field only on initial open
				if (!lastFocusedField.current && nameInputRef.current) {
					nameInputRef.current.focus()
				}
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
			setFormData({ name: '', description: '', price: '', imageFile: null })
			setPreviewImage(null)
			lastFocusedField.current = null
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	// Restore focus after re-render
	useEffect(() => {
		if (isOpen && lastFocusedField.current) {
			const refMap = {
				name: nameInputRef,
				price: priceInputRef,
				description: descriptionInputRef,
			}
			const targetRef = refMap[lastFocusedField.current]
			if (targetRef?.current) {
				targetRef.current.focus()
			}
		}
	})

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
		lastFocusedField.current = name
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleFileChange = (e) => {
		const file = e.target.files[0]
		if (file) {
			setFormData((prev) => ({ ...prev, imageFile: file }))
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewImage(reader.result)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)

		try {
			let imageUrl = null

			// Upload image to server if file is selected
			if (formData.imageFile) {
				console.log('📤 Uploading dish image to server...')
				imageUrl = await uploadFile(formData.imageFile, 'image')
				console.log('✅ Dish image uploaded successfully!')
				console.log('🖼️ Dish Image URL:', imageUrl)
			}

			// Prepare dish data
			const dishData = {
				id: Date.now(),
				name: formData.name,
				price: parseFloat(formData.price),
				description: formData.description,
				image: imageUrl || 'default_image_url',
			}

			console.log(`📦 Dish data ready for ${categorySlug}:`, dishData)

			// Call onSave callback with dish data
			if (onSave) {
				onSave(dishData)
			}

			// Reset form and close modal
			setFormData({ name: '', description: '', price: '', imageFile: null })
			setPreviewImage(null)
			onClose()
		} catch (error) {
			console.error('❌ Error submitting dish:', error)
			alert(error.message || 'Failed to upload image. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	if (!isOpen) return null

	const ModalContent = () => (
		<>
			<style>
				{`
					.modal-content-no-scrollbar::-webkit-scrollbar {
						display: none;
					}
				`}
			</style>
			<div
				className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
					isVisible
						? 'bg-black/70 backdrop-blur-sm'
						: 'bg-transparent pointer-events-none'
				}`}
			>
				<div
					ref={modalRef}
					className={`modal-content-no-scrollbar relative w-full max-w-lg mx-4 bg-black/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
						isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
					}`}
					style={{
						maxHeight: '90vh',
						overflowY: 'auto',
						scrollbarWidth: 'none',
						msOverflowStyle: 'none',
					}}
				>
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-[#9dabb9] hover:text-white transition-colors z-10"
					>
						<span className="material-symbols-outlined text-2xl">close</span>
					</button>

					<div className="mb-8">
						<h2 className="text-2xl font-bold text-white m-0">
							Add Dish to {categoryName}
						</h2>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<label htmlFor="name" className="block text-sm font-medium text-gray-300">
								Dish Name
							</label>
							<input
								ref={nameInputRef}
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="e.g., Chicken Curry, Margherita Pizza"
								required
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="price" className="block text-sm font-medium text-gray-300">
								Price ($)
							</label>
							<input
								ref={priceInputRef}
								type="number"
								step="0.01"
								id="price"
								name="price"
								value={formData.price}
								onChange={handleChange}
								placeholder="e.g., 12.99"
								required
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="description"
								className="block text-sm font-medium text-gray-300"
							>
								Description
							</label>
							<textarea
								ref={descriptionInputRef}
								placeholder="Briefly describe the ingredients and flavor profile."
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400 resize-y"
							></textarea>
						</div>

						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-300">
								Dish Image
							</label>
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
								<div className="shrink-0">
									<div
										className="w-24 h-24 bg-[#2D3748] rounded-lg flex items-center justify-center border-2 border-dashed border-[#4b5563] overflow-hidden bg-cover bg-center"
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
											<span className="material-symbols-outlined text-gray-500 text-4xl">
												image
											</span>
										)}
									</div>
								</div>

								<div className="flex-1">
									<label
										htmlFor="dish-file-upload"
										className="cursor-pointer inline-flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors"
									>
										<span>{formData.imageFile ? 'Change Image' : 'Upload Image'}</span>
										<input
											id="dish-file-upload"
											name="dish-file-upload"
											type="file"
											className="sr-only"
											accept="image/*"
											onChange={handleFileChange}
										/>
									</label>
									{formData.imageFile && (
										<p className="text-xs text-[#9dabb9] mt-1 truncate max-w-full">
											{formData.imageFile.name}
										</p>
									)}
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
								disabled={loading || !formData.name || !formData.price}
							>
								{loading ? (
									<span className="truncate">Saving...</span>
								) : (
									<span className="truncate">Save Dish</span>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

export default AddDishModal
