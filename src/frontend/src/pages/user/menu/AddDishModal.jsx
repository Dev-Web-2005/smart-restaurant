import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { uploadFile } from '../../../services/api/fileAPI'

const AddDishModal = ({ isOpen, onClose, onSave, categorySlug, categoryName }) => {
	const modalRef = useRef(null)
	const nameInputRef = useRef(null)
	const priceInputRef = useRef(null)
	const descriptionInputRef = useRef(null)
	const lastFocusedField = useRef(null)
	const cursorPosition = useRef(null) // Store cursor position
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		price: '',
		preparationTime: '', // In minutes, 0-240
	})
	const [images, setImages] = useState([]) // Array of {file, preview, url, uploading, error}
	const [uploadingCount, setUploadingCount] = useState(0)
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
			setFormData({ name: '', description: '', price: '', preparationTime: '' })
			setImages([])
			setUploadingCount(0)
			lastFocusedField.current = null
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	// Restore focus and cursor position after re-render
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
		// Save cursor position before state update
		cursorPosition.current = e.target.selectionStart
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleFileChange = async (e) => {
		const files = Array.from(e.target.files)
		if (files.length === 0) return

		// Limit to 5 images
		const remainingSlots = 5 - images.length
		if (files.length > remainingSlots) {
			alert(
				`You can only upload ${remainingSlots} more image(s). Maximum 5 images per item.`,
			)
			return
		}

		// Add new images with preview and uploading state
		const newImages = files.map((file) => {
			const reader = new FileReader()
			const imageId = Date.now() + Math.random()

			const imageObj = {
				id: imageId,
				file,
				preview: null,
				url: null,
				uploading: true,
				error: null,
			}

			reader.onloadend = () => {
				setImages((prev) =>
					prev.map((img) =>
						img.id === imageId ? { ...img, preview: reader.result } : img,
					),
				)
			}
			reader.readAsDataURL(file)

			return imageObj
		})

		setImages((prev) => [...prev, ...newImages])
		setUploadingCount((prev) => prev + files.length)

		// Upload all files
		files.forEach(async (file, index) => {
			const imageId = newImages[index].id
			try {
				console.log(`📤 Uploading dish image ${index + 1}/${files.length} to cloud...`)
				const url = await uploadFile(file, 'image')
				console.log(`✅ Dish image ${index + 1} uploaded successfully! URL:`, url)

				setImages((prev) =>
					prev.map((img) =>
						img.id === imageId ? { ...img, url, uploading: false, error: null } : img,
					),
				)
			} catch (error) {
				console.error(`❌ Dish image ${index + 1} upload failed:`, error)
				setImages((prev) =>
					prev.map((img) =>
						img.id === imageId
							? {
									...img,
									uploading: false,
									error: error.message || 'Upload failed',
							  }
							: img,
					),
				)
			} finally {
				setUploadingCount((prev) => prev - 1)
			}
		})
	}

	const handleRetryUpload = async (imageId) => {
		const image = images.find((img) => img.id === imageId)
		if (!image || !image.file) return

		setImages((prev) =>
			prev.map((img) =>
				img.id === imageId ? { ...img, uploading: true, error: null } : img,
			),
		)
		setUploadingCount((prev) => prev + 1)

		try {
			console.log('🔄 Retrying dish image upload...')
			const url = await uploadFile(image.file, 'image')
			console.log('✅ Dish image uploaded successfully! URL:', url)

			setImages((prev) =>
				prev.map((img) =>
					img.id === imageId ? { ...img, url, uploading: false, error: null } : img,
				),
			)
		} catch (error) {
			console.error('❌ Dish image upload failed again:', error)
			setImages((prev) =>
				prev.map((img) =>
					img.id === imageId
						? { ...img, uploading: false, error: error.message || 'Upload failed' }
						: img,
				),
			)
		} finally {
			setUploadingCount((prev) => prev - 1)
		}
	}

	const handleRemoveImage = (imageId) => {
		setImages((prev) => prev.filter((img) => img.id !== imageId))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		// Check if any image upload is still in progress
		if (uploadingCount > 0) {
			alert('Please wait for all image uploads to complete.')
			return
		}

		// Check if any image upload failed
		const failedImages = images.filter((img) => img.error)
		if (failedImages.length > 0) {
			alert(
				`${failedImages.length} image(s) failed to upload. Please retry or remove them before saving.`,
			)
			return
		}

		setLoading(true)

		try {
			// Prepare dish data with pre-uploaded image URLs
			const imageUrls = images.filter((img) => img.url).map((img) => img.url)

			const dishData = {
				id: Date.now(),
				name: formData.name,
				price: parseFloat(formData.price),
				description: formData.description,
				preparationTime: formData.preparationTime
					? parseInt(formData.preparationTime)
					: undefined,
				imageUrls: imageUrls, // Array of pre-uploaded image URLs
			}

			console.log(`📦 Dish data ready for ${categorySlug}:`, dishData)

			// Call onSave callback with dish data
			if (onSave) {
				await onSave(dishData)
			}

			// Reset form and close modal
			setFormData({ name: '', description: '', price: '', preparationTime: '' })
			setImages([])
			setUploadingCount(0)
			onClose()
		} catch (error) {
			console.error('❌ Error submitting dish:', error)
			alert(error.message || 'Failed to save dish. Please try again.')
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
								htmlFor="preparationTime"
								className="block text-sm font-medium text-gray-300"
							>
								Preparation Time (minutes)
							</label>
							<input
								type="number"
								id="preparationTime"
								name="preparationTime"
								value={formData.preparationTime}
								onChange={handleChange}
								placeholder="e.g., 15"
								min="0"
								max="240"
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
							/>
							<p className="text-xs text-gray-400">
								Optional. Maximum 240 minutes (4 hours).
							</p>
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
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
								placeholder="Briefly describe the ingredients and flavor profile."
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400 resize-y"
							></textarea>
						</div>

						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-300">
								Dish Images (Max 5)
							</label>

							{/* Upload status summary */}
							{uploadingCount > 0 && (
								<p className="text-blue-400 text-sm mb-2">
									⏳ Uploading {uploadingCount} image(s) to cloud...
								</p>
							)}

							{/* Image Grid */}
							<div className="grid grid-cols-3 gap-3 mb-3">
								{images.map((image, index) => (
									<div key={image.id} className="relative">
										<div
											className="w-full aspect-square bg-[#2D3748] rounded-lg flex items-center justify-center border-2 border-dashed border-[#4b5563] overflow-hidden bg-cover bg-center relative"
											style={
												image.preview
													? {
															backgroundImage: `url(${image.preview})`,
															border: 'none',
													  }
													: {}
											}
										>
											{!image.preview && (
												<span className="material-symbols-outlined text-gray-500 text-3xl">
													image
												</span>
											)}
											{image.uploading && (
												<div className="absolute inset-0 bg-black/70 flex items-center justify-center">
													<div className="text-center">
														<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto mb-1"></div>
														<p className="text-xs text-white">Uploading...</p>
													</div>
												</div>
											)}
											{image.url && !image.uploading && (
												<div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
													<span className="material-symbols-outlined text-white text-xs">
														check
													</span>
												</div>
											)}
											{image.error && !image.uploading && (
												<>
													<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
														<span className="material-symbols-outlined text-red-500 text-2xl">
															error
														</span>
													</div>
													<button
														type="button"
														onClick={() => handleRetryUpload(image.id)}
														className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
													>
														Retry
													</button>
												</>
											)}
										</div>
										{/* Remove button */}
										{!image.uploading && (
											<button
												type="button"
												onClick={() => handleRemoveImage(image.id)}
												className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
											>
												<span className="material-symbols-outlined text-sm">close</span>
											</button>
										)}
										{/* Primary badge for first image */}
										{index === 0 && !image.error && (
											<div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
												Primary
											</div>
										)}
									</div>
								))}

								{/* Upload button (show if less than 5 images) */}
								{images.length < 5 && (
									<label
										htmlFor="dish-file-upload"
										className={`w-full aspect-square bg-[#2D3748] rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-[#4b5563] cursor-pointer hover:border-[#137fec] hover:bg-[#2D3748]/80 transition-colors ${
											uploadingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''
										}`}
									>
										<span className="material-symbols-outlined text-gray-500 text-3xl mb-1">
											add_photo_alternate
										</span>
										<span className="text-xs text-gray-400">Add Image</span>
										<input
											id="dish-file-upload"
											name="dish-file-upload"
											type="file"
											className="sr-only"
											accept="image/*"
											multiple
											onChange={handleFileChange}
											disabled={uploadingCount > 0}
										/>
									</label>
								)}
							</div>

							<p className="text-xs text-gray-400">
								{images.length}/5 images uploaded. First image will be the primary image.
							</p>
						</div>

						<div className="flex justify-end items-center gap-4 pt-4 border-t border-[#374151]">
							<button
								type="button"
								onClick={onClose}
								className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-transparent text-gray-300 text-sm font-bold hover:bg-[#4b5563] transition-colors"
								disabled={loading || uploadingCount > 0}
							>
								<span className="truncate">Cancel</span>
							</button>
							<button
								type="submit"
								className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={
									loading ||
									uploadingCount > 0 ||
									images.some((img) => img.error) ||
									!formData.name ||
									!formData.price
								}
								title={
									uploadingCount > 0
										? 'Please wait for all image uploads to complete'
										: images.some((img) => img.error)
										? 'Please fix image upload errors before saving'
										: ''
								}
							>
								{loading ? (
									<span className="truncate">Saving...</span>
								) : uploadingCount > 0 ? (
									<span className="truncate">Uploading...</span>
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
