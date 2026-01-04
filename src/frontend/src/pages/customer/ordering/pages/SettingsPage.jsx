import React from 'react'

const SettingsPage = ({
	isOpen,
	onClose,
	backgroundImages,
	currentBackground,
	setCurrentBackground,
}) => {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="relative backdrop-blur-xl bg-[#1A202C]/90 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-white/20">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div>
						<h2 className="text-2xl font-bold text-white m-0">Settings</h2>
						<p className="text-[#9dabb9] text-sm mt-1">Customize your experience</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/10 transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					<h3 className="text-lg font-bold text-white mb-4">Background Image</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{backgroundImages.map((image, index) => (
							<button
								key={index}
								onClick={() => {
									setCurrentBackground(index)
									onClose()
								}}
								className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
									currentBackground === index
										? 'border-[#137fec] shadow-lg shadow-blue-500/30'
										: 'border-white/20 hover:border-white/40'
								}`}
							>
								<img
									src={image}
									alt={`Background ${index + 1}`}
									className="w-full h-full object-cover"
								/>
								{currentBackground === index && (
									<div className="absolute inset-0 bg-[#137fec]/20 flex items-center justify-center">
										<div className="bg-[#137fec] rounded-full p-2">
											<span className="material-symbols-outlined text-white text-2xl">
												check
											</span>
										</div>
									</div>
								)}
								<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
									<p className="text-white text-xs font-semibold text-center">
										Style {index + 1}
									</p>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-white/10 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded-lg font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

export default SettingsPage
