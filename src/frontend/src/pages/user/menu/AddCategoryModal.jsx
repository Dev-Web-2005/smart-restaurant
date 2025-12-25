import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { uploadFile } from '../../../services/api/fileAPI'

// CSS to hide scrollbar for WebKit browsers
const modalScrollbarStyles = `
	.modal-content::-webkit-scrollbar {
		display: none;
	}
`

const AddCategoryModal = ({ isOpen, onClose, onSave }) => {
	const modalRef = useRef(null)
	const categoryNameInputRef = useRef(null)
	const displayOrderInputRef = useRef(null)
	const [formData, setFormData] = useState({
		name: '',
		status: 'ACTIVE',
		displayOrder: 0,
		imageFile: null,
	})
	const [previewImage, setPreviewImage] = useState(null)
	const [imageUrl, setImageUrl] = useState(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [uploadError, setUploadError] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [activeField, setActiveField] = useState(null)
	const [cursorPosition, setCursorPosition] = useState(0)

	// Inject CSS for WebKit scrollbar hiding
	useEffect(() => {
		const styleElement = document.createElement('style')
		styleElement.textContent = modalScrollbarStyles
		document.head.appendChild(styleElement)
		return () => {
			document.head.removeChild(styleElement)
		}
	}, [])

	// Control body scroll và animation
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
				// Focus first field on initial open
				if (categoryNameInputRef.current) {
					categoryNameInputRef.current.focus()
				}
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
			// Reset form khi đóng modal
			setFormData({
				name: '',
				status: 'ACTIVE',
				displayOrder: 0,
				imageFile: null,
			})
			setPreviewImage(null)
			setImageUrl(null)
			setUploadError(null)
			setUploadingImage(false)
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	// Restore focus and cursor position after re-render
	useEffect(() => {
		if (activeField && isOpen) {
			const inputRef =
				activeField === 'name' ? categoryNameInputRef : displayOrderInputRef
			if (inputRef.current) {
				inputRef.current.focus()
				// Restore cursor position for text inputs
				if (activeField === 'name' && typeof cursorPosition === 'number') {
					inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
				}
			}
		}
	}, [formData, activeField, cursorPosition, isOpen])

	// Close on outside click và ESC
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
		// Save cursor position before state update
		const cursorPos = e.target.selectionStart
		setCursorPosition(cursorPos)
		setActiveField(name)
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleBlur = () => {
		// Clear active field when user leaves the input
		setActiveField(null)
	}

	const handleFileChange = async (e) => {
		const file = e.target.files[0]
		if (!file) return

		// Reset previous states
		setUploadError(null)
		setImageUrl(null)

		// Show preview immediately
		setFormData((prev) => ({ ...prev, imageFile: file }))
		const reader = new FileReader()
		reader.onloadend = () => {
			setPreviewImage(reader.result)
		}
		reader.readAsDataURL(file)

		// Upload to cloud immediately
		setUploadingImage(true)
		try {
			console.log('📤 Uploading image to cloud...')
			const url = await uploadFile(file, 'image')
			console.log('✅ Image uploaded successfully! URL:', url)
			setImageUrl(url)
			setUploadError(null)
		} catch (error) {
			console.error('❌ Image upload failed:', error)
			setUploadError(error.message || 'Failed to upload image. Please try again.')
			setImageUrl(null)
		} finally {
			setUploadingImage(false)
		}
	}

	const handleRetryUpload = async () => {
		if (!formData.imageFile) return

		setUploadError(null)
		setUploadingImage(true)
		try {
			console.log('🔄 Retrying image upload...')
			const url = await uploadFile(formData.imageFile, 'image')
			console.log('✅ Image uploaded successfully! URL:', url)
			setImageUrl(url)
			setUploadError(null)
		} catch (error) {
			console.error('❌ Image upload failed again:', error)
			setUploadError(error.message || 'Failed to upload image. Please try again.')
			setImageUrl(null)
		} finally {
			setUploadingImage(false)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		// Validate category name (2-50 characters as per backend requirement)
		if (!formData.name || formData.name.trim().length < 2) {
			alert('Category name must be at least 2 characters long.')
			return
		}

		if (formData.name.trim().length > 50) {
			alert('Category name must not exceed 50 characters.')
			return
		}

		// Check if image upload is still in progress
		if (uploadingImage) {
			alert('Please wait for image upload to complete.')
			return
		}

		// Check if image upload failed
		if (uploadError) {
			alert(
				'Image upload failed. Please retry uploading the image before creating category.',
			)
			return
		}

		setLoading(true)

		try {
			// Prepare category data matching backend API structure
			const categoryData = {
				name: formData.name.trim(),
				status: formData.status || 'ACTIVE',
				displayOrder:
					formData.displayOrder !== undefined && formData.displayOrder !== ''
						? parseInt(formData.displayOrder, 10)
						: undefined,
				image: imageUrl, // Use pre-uploaded image URL
			}

			console.log('📦 Category data ready:', categoryData)

			// Call onSave callback with category data
			if (onSave) {
				await onSave(categoryData)
			}

			// Reset form and close modal
			setFormData({
				name: '',
				status: 'ACTIVE',
				displayOrder: 0,
				imageFile: null,
			})
			setPreviewImage(null)
			setImageUrl(null)
			setUploadError(null)
			onClose()
		} catch (error) {
			console.error('❌ Error submitting category:', error)
			alert(error.message || 'Failed to create category. Please try again.')
		} finally {
			setLoading(false)
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
				className={`relative w-full max-w-2xl mx-4 bg-black/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
					scrollbarWidth: 'none' /* Firefox */,
					msOverflowStyle: 'none' /* IE and Edge */,
				}}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#9dabb9] hover:text-white transition-colors z-10"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="mb-8">
					<h2 className="text-2xl font-bold text-white m-0">Add New Category</h2>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Category Name */}
					<div className="space-y-2">
						<label htmlFor="name" className="block text-sm font-medium text-gray-300">
							Category Name <span className="text-red-400">*</span>
						</label>
						<input
							ref={categoryNameInputRef}
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							onBlur={handleBlur}
							placeholder="e.g., Appetizers, Main Courses"
							minLength={2}
							maxLength={50}
							required
							className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
						/>
						<p className="text-xs text-gray-400 m-0">2-50 characters required</p>
					</div>

					{/* Status and Display Order */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="status" className="block text-sm font-medium text-gray-300">
								Status
							</label>
							<select
								id="status"
								name="status"
								value={formData.status}
								onChange={handleChange}
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec]"
							>
								<option value="ACTIVE">Active</option>
								<option value="INACTIVE">Inactive</option>
							</select>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="displayOrder"
								className="block text-sm font-medium text-gray-300"
							>
								Display Order
							</label>
							<input
								ref={displayOrderInputRef}
								type="number"
								id="displayOrder"
								name="displayOrder"
								value={formData.displayOrder}
								onChange={handleChange}
								onBlur={handleBlur}
								min={0}
								placeholder="0"
								className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Category Icon/Image
						</label>
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
							<div className="shrink-0">
								<div
									className="w-32 h-32 bg-[#2D3748] rounded-lg flex items-center justify-center border-2 border-dashed border-[#4b5563] overflow-hidden bg-cover bg-center relative"
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
									{uploadingImage && (
										<div className="absolute inset-0 bg-black/70 flex items-center justify-center">
											<div className="text-center">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
												<p className="text-xs text-white">Uploading...</p>
											</div>
										</div>
									)}
									{imageUrl && !uploadingImage && (
										<div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
											<span className="material-symbols-outlined text-white text-sm">
												check
											</span>
										</div>
									)}
									{uploadError && !uploadingImage && (
										<div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
											<span className="material-symbols-outlined text-white text-sm">
												error
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="flex-1">
								<p className="text-gray-400 text-sm mb-3 m-0">
									Upload an image or select an icon for the category. Recommended size:
									200x200px.
								</p>

								{/* Upload status messages */}
								{uploadingImage && (
									<p className="text-blue-400 text-sm mb-3 m-0">
										⏳ Uploading image to cloud...
									</p>
								)}
								{imageUrl && !uploadingImage && (
									<p className="text-green-400 text-sm mb-3 m-0">
										✅ Image uploaded successfully!
									</p>
								)}
								{uploadError && !uploadingImage && (
									<div className="mb-3">
										<p className="text-red-400 text-sm m-0 mb-2">❌ {uploadError}</p>
										<button
											type="button"
											onClick={handleRetryUpload}
											className="text-xs text-blue-400 hover:text-blue-300 underline"
										>
											🔄 Retry Upload
										</button>
									</div>
								)}

								<div className="flex gap-2">
									<label
										htmlFor="file-upload"
										className={`cursor-pointer inline-flex items-center justify-center rounded-lg h-10 px-4 text-white text-sm font-bold tracking-[0.015em] transition-colors ${
											uploadingImage
												? 'bg-gray-500 cursor-not-allowed'
												: 'bg-[#137fec] hover:bg-[#137fec]/90'
										}`}
									>
										<span>{formData.imageFile ? 'Change Image' : 'Upload Image'}</span>
										<input
											id="file-upload"
											name="file-upload"
											type="file"
											className="sr-only"
											accept="image/*"
											onChange={handleFileChange}
											disabled={uploadingImage}
										/>
									</label>
								</div>
							</div>
						</div>
					</div>

					<div className="flex justify-end items-center gap-4 pt-4 border-t border-[#374151]">
						<button
							type="button"
							onClick={onClose}
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-transparent text-gray-300 text-sm font-bold hover:bg-[#4b5563] transition-colors"
							disabled={loading || uploadingImage}
						>
							<span className="truncate">Cancel</span>
						</button>
						<button
							type="submit"
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading || uploadingImage || uploadError}
							title={
								uploadingImage
									? 'Please wait for image upload to complete'
									: uploadError
									? 'Please fix image upload error before creating'
									: ''
							}
						>
							{loading ? (
								<span className="truncate">Creating...</span>
							) : uploadingImage ? (
								<span className="truncate">Uploading...</span>
							) : (
								<span className="truncate">Save Category</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

export default AddCategoryModal
