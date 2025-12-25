import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { uploadFile } from '../../../services/api/fileAPI'

const AddCategoryModal = ({ isOpen, onClose, onSave }) => {
	const modalRef = useRef(null)
	const categoryNameInputRef = useRef(null)
	const lastFocusedField = useRef(null)
	const [formData, setFormData] = useState({
		categoryName: '',
		imageFile: null,
	})
	const [previewImage, setPreviewImage] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	// Control body scroll và animation
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
				// Focus first field only on initial open
				if (!lastFocusedField.current && categoryNameInputRef.current) {
					categoryNameInputRef.current.focus()
				}
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
			// Reset form khi đóng modal
			setFormData({ categoryName: '', imageFile: null })
			setPreviewImage(null)
			lastFocusedField.current = null
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	// Restore focus after re-render
	useEffect(() => {
		if (
			isOpen &&
			lastFocusedField.current === 'categoryName' &&
			categoryNameInputRef.current
		) {
			categoryNameInputRef.current.focus()
		}
	})

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
				console.log('📤 Uploading image to server...')
				imageUrl = await uploadFile(formData.imageFile, 'image')
				console.log('✅ Image uploaded successfully!')
				console.log('🖼️ Image URL:', imageUrl)
			}

			// Prepare category data (for future API call)
			const categoryData = {
				id: Date.now(),
				name: formData.categoryName,
				image: imageUrl || 'default_image_url',
			}

			console.log('📦 Category data ready:', categoryData)

			// Call onSave callback with category data
			if (onSave) {
				onSave(categoryData)
			}

			// Reset form and close modal
			setFormData({ categoryName: '', imageFile: null })
			setPreviewImage(null)
			onClose()
		} catch (error) {
			console.error('❌ Error submitting category:', error)
			alert(error.message || 'Failed to upload image. Please try again.')
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

				<form onSubmit={handleSubmit} className="space-y-8">
					<div className="space-y-2">
						<label
							htmlFor="categoryName"
							className="block text-sm font-medium text-gray-300"
						>
							Category Name
						</label>
						<input
							ref={categoryNameInputRef}
							type="text"
							id="categoryName"
							name="categoryName"
							value={formData.categoryName}
							onChange={handleChange}
							placeholder="e.g., Appetizers, Main Courses"
							required
							className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Category Icon/Image
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

							<div className="flex-1">
								<p className="text-gray-400 text-sm mb-4 m-0">
									Upload an image or select an icon for the category. Recommended size:
									200x200px.
								</p>
								<label
									htmlFor="file-upload"
									className="cursor-pointer inline-flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors"
								>
									<span>Upload Image</span>
									<input
										id="file-upload"
										name="file-upload"
										type="file"
										className="sr-only"
										accept="image/*"
										onChange={handleFileChange}
									/>
								</label>
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
							disabled={loading}
						>
							{loading ? (
								<span className="truncate">Saving...</span>
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
