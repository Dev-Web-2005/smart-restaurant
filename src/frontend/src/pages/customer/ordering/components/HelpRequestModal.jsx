import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const HelpRequestModal = ({ isOpen, onClose, onSubmit }) => {
	const [message, setMessage] = useState('')
	const [urgency, setUrgency] = useState('NORMAL')
	const [isSending, setIsSending] = useState(false)
	const modalRef = useRef(null)
	const textareaRef = useRef(null)

	// Add CSS to hide scrollbar globally for this component
	useEffect(() => {
		const style = document.createElement('style')
		style.innerHTML = `
			.scrollbar-hide::-webkit-scrollbar {
				display: none;
			}
		`
		document.head.appendChild(style)
		return () => {
			document.head.removeChild(style)
		}
	}, [])

	useEffect(() => {
		if (isOpen && textareaRef.current) {
			// Focus on textarea when modal opens
			setTimeout(() => {
				textareaRef.current?.focus()
			}, 100)
		}

		// Handle ESC key
		const handleEsc = (e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEsc)
		return () => document.removeEventListener('keydown', handleEsc)
	}, [isOpen, onClose])

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen, onClose])

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!message.trim()) {
			return
		}

		setIsSending(true)

		try {
			// Call the onSubmit prop with help request data
			await onSubmit({
				message: message.trim(),
				urgency,
			})

			// Reset form
			setMessage('')
			setUrgency('NORMAL')
			onClose()
		} catch (error) {
			console.error('Failed to send help request:', error)
		} finally {
			setIsSending(false)
		}
	}

	const urgencyOptions = [
		{ value: 'LOW', label: 'Low', icon: 'info', color: 'text-blue-400' },
		{ value: 'NORMAL', label: 'Normal', icon: 'priority_high', color: 'text-yellow-400' },
		{ value: 'HIGH', label: 'Urgent', icon: 'warning', color: 'text-red-400' },
	]

	const quickMessages = [
		'Need waiter assistance',
		'Request for menu recommendation',
		'Need extra napkins',
		'Request for bill',
		'Food not arrived yet',
		'Question about dish',
	]

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
					>
						<div
							ref={modalRef}
							className="bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10 scrollbar-hide"
							style={{
								scrollbarWidth: 'none',
								msOverflowStyle: 'none',
							}}
						>
							{/* Header */}
							<div className="sticky top-0 bg-gradient-to-br from-gray-900 to-black border-b border-white/10 p-4 sm:p-6 rounded-t-3xl z-10">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2 sm:gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
											<span className="material-symbols-outlined text-white text-xl sm:text-2xl">
												support_agent
											</span>
										</div>
										<div>
											<h2 className="text-lg sm:text-2xl font-black text-white m-0">
												Request Help
											</h2>
											<p className="text-xs sm:text-sm text-gray-400 m-0">
												We're here to assist you
											</p>
										</div>
									</div>
									<button
										onClick={onClose}
										disabled={isSending}
										className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
									>
										<span className="material-symbols-outlined text-gray-400 text-lg sm:text-xl">
											close
										</span>
									</button>
								</div>
							</div>

							{/* Content */}
							<form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
								{/* Urgency Level */}
								<div>
									<label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3">
										Urgency Level
									</label>
									<div className="grid grid-cols-3 gap-2 sm:gap-3">
										{urgencyOptions.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() => setUrgency(option.value)}
												disabled={isSending}
												className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 ${
													urgency === option.value
														? 'border-white bg-white/10 shadow-lg'
														: 'border-white/10 bg-white/5 hover:bg-white/10'
												}`}
											>
												<span
													className={`material-symbols-outlined block mb-1 sm:mb-2 ${
														option.color
													} ${
														urgency === option.value
															? 'text-xl sm:text-2xl'
															: 'text-lg sm:text-xl'
													}`}
												>
													{option.icon}
												</span>
												<span
													className={`block text-xs font-bold ${
														urgency === option.value ? 'text-white' : 'text-gray-400'
													}`}
												>
													{option.label}
												</span>
												{urgency === option.value && (
													<motion.div
														layoutId="urgencyIndicator"
														className="absolute inset-0 border-2 border-white rounded-xl"
														transition={{
															type: 'spring',
															stiffness: 400,
															damping: 30,
														}}
													/>
												)}
											</button>
										))}
									</div>
								</div>

								{/* Quick Messages */}
								<div>
									<label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3">
										Quick Messages (Optional)
									</label>
									<div className="grid grid-cols-2 gap-2">
										{quickMessages.map((quickMsg) => (
											<button
												key={quickMsg}
												type="button"
												onClick={() => setMessage(quickMsg)}
												disabled={isSending}
												className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] sm:text-xs text-gray-300 text-left transition-colors disabled:opacity-50"
											>
												{quickMsg}
											</button>
										))}
									</div>
								</div>

								{/* Message Input */}
								<div>
									<label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3">
										Your Message *
									</label>
									<textarea
										ref={textareaRef}
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										placeholder="Describe how we can help you..."
										disabled={isSending}
										rows={5}
										maxLength={500}
										className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50"
										required
									/>
									<div className="flex justify-between items-center mt-2">
										<span className="text-[10px] sm:text-xs text-gray-500">
											{message.length}/500 characters
										</span>
										{message.trim() && (
											<button
												type="button"
												onClick={() => setMessage('')}
												disabled={isSending}
												className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
											>
												Clear
											</button>
										)}
									</div>
								</div>

								{/* Info Box */}
								<div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
									<span className="material-symbols-outlined text-blue-400 flex-shrink-0 text-lg sm:text-xl">
										info
									</span>
									<div className="text-xs sm:text-sm text-blue-300">
										<p className="font-semibold mb-1">Response Time</p>
										<p className="text-blue-400/80">
											Our staff will receive your request immediately and will assist you
											as soon as possible.
										</p>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2 sm:gap-3 pt-2">
									<button
										type="button"
										onClick={onClose}
										disabled={isSending}
										className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm sm:text-base font-bold transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={!message.trim() || isSending}
										className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
									>
										{isSending ? (
											<>
												<div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
												<span>Sending...</span>
											</>
										) : (
											<>
												<span className="material-symbols-outlined text-lg sm:text-xl">
													send
												</span>
												<span>Send Request</span>
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

export default HelpRequestModal
