import React from 'react'

const OrderStatusTimeline = ({ currentStep }) => {
	const steps = [
		{
			key: 'Received',
			label: 'Received',
			description: 'Order confirmed',
			icon: 'receipt_long',
			color: '#3B82F6',
			colorClass: 'text-blue-500',
		},
		{
			key: 'Preparing',
			label: 'Preparing',
			description: 'Chef is cooking',
			icon: 'restaurant',
			color: '#F59E0B',
			colorClass: 'text-yellow-500',
		},
		{
			key: 'Ready',
			label: 'Ready',
			description: 'Ready to serve',
			icon: 'check_circle',
			color: '#10B981',
			colorClass: 'text-green-500',
		},
	]

	const currentStepIndex = steps.findIndex((step) => step.key === currentStep)

	const getStepStatus = (index) => {
		if (index < currentStepIndex) return 'completed'
		if (index === currentStepIndex) return 'current'
		return 'pending'
	}

	return (
		<div className="w-full py-4" role="progressbar" aria-label="Order Status Timeline">
			{/* Desktop Timeline */}
			<div className="hidden sm:block">
				<div className="relative flex items-center justify-between px-8">
					{/* Background Line */}
					<div
						className="absolute top-[27px] h-1 bg-[#2D3748]"
						style={{
							left: '60px',
							right: '60px',
						}}
					/>
					{/* Progress Line */}
					{currentStepIndex > 0 && (
						<div
							className="absolute top-[27px] h-1 transition-all duration-700 ease-out overflow-hidden"
							style={{
								left: '60px',
								width: `calc((100% - 120px) * ${currentStepIndex / (steps.length - 1)})`,
								background: `linear-gradient(to right, ${steps[0].color}, ${
									steps[Math.min(currentStepIndex, steps.length - 1)].color
								})`,
							}}
						>
							{/* Shimmer Effect */}
							<div
								className="absolute inset-0 w-full h-full"
								style={{
									background:
										'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
									animation: 'shimmer 2s infinite',
								}}
							/>
						</div>
					)}
					{/* Steps */}
					{steps.map((step, index) => {
						const status = getStepStatus(index)
						return (
							<div key={step.key} className="relative flex flex-col items-center z-10">
								{/* Icon Circle */}
								<div
									className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
										status === 'completed'
											? 'bg-gradient-to-br border-transparent shadow-lg'
											: status === 'current'
											? 'bg-gradient-to-br border-white/20 shadow-2xl'
											: 'bg-[#2D3748] border-[#2D3748]'
									}`}
									style={{
										...(status === 'completed' && {
											background: `linear-gradient(to bottom right, ${step.color}, ${step.color}dd)`,
											animation: 'pulse-glow 2s ease-in-out infinite',
										}),
										...(status === 'current' && {
											background: `linear-gradient(to bottom right, ${step.color}, ${step.color}dd)`,
											animation: 'pulse-glow 2s ease-in-out infinite',
										}),
									}}
								>
									<span
										className={`material-symbols-outlined ${
											status === 'pending' ? 'text-[#9dabb9]' : 'text-white'
										}`}
										style={{ fontSize: '28px' }}
									>
										{step.icon}
									</span>
								</div>
								{/* Label */}
								<div className="mt-3 text-center">
									<p
										className={`text-sm font-bold ${
											status === 'pending' ? 'text-[#9dabb9]' : step.colorClass
										}`}
									>
										{step.label}
									</p>
									<p className="text-xs text-[#9dabb9] mt-0.5">{step.description}</p>
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Mobile Timeline */}
			<div className="block sm:hidden">
				<div className="flex items-center justify-between px-4">
					{steps.map((step, index) => {
						const status = getStepStatus(index)
						const isLast = index === steps.length - 1
						return (
							<React.Fragment key={step.key}>
								<div className="relative flex flex-col items-center">
									{/* Icon Circle */}
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
											status === 'completed'
												? 'bg-gradient-to-br border-transparent'
												: status === 'current'
												? 'bg-gradient-to-br border-white/20'
												: 'bg-[#2D3748] border-[#2D3748]'
										}`}
										style={{
											...(status === 'completed' && {
												background: `linear-gradient(to bottom right, ${step.color}, ${step.color}dd)`,
											}),
											...(status === 'current' && {
												background: `linear-gradient(to bottom right, ${step.color}, ${step.color}dd)`,
											}),
										}}
									>
										<span
											className={`material-symbols-outlined ${
												status === 'pending' ? 'text-[#9dabb9]' : 'text-white'
											}`}
											style={{ fontSize: '20px' }}
										>
											{step.icon}
										</span>
									</div>
									{/* Label */}
									<p
										className={`text-[10px] font-bold mt-1.5 ${
											status === 'pending' ? 'text-[#9dabb9]' : step.colorClass
										}`}
									>
										{step.label}
									</p>
								</div>
								{/* Connector Line */}
								{!isLast && (
									<div className="flex-1 h-0.5 bg-[#2D3748] mx-1 relative -mt-6">
										{status === 'completed' && (
											<div
												className="absolute inset-0 h-full"
												style={{
													background: `linear-gradient(to right, ${step.color}, ${
														steps[index + 1].color
													})`,
												}}
											/>
										)}
									</div>
								)}
							</React.Fragment>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export default OrderStatusTimeline
