import React from 'react'

/**
 * PasswordStrengthIndicator - Component hiển thị yêu cầu mật khẩu động
 *
 * Hiển thị các yêu cầu mật khẩu và cập nhật trạng thái theo thời gian thực
 * khi người dùng nhập mật khẩu.
 *
 * @param {string} password - Mật khẩu hiện tại
 * @param {boolean} showRequirements - Hiển thị danh sách yêu cầu
 */
const PasswordStrengthIndicator = ({ password = '', showRequirements = true }) => {
	// Kiểm tra các yêu cầu mật khẩu
	const requirements = [
		{
			id: 'length',
			label: 'At least 8 characters',
			test: (pwd) => pwd.length >= 8,
			icon: 'straighten',
		},
		{
			id: 'uppercase',
			label: 'At least one uppercase letter (A-Z)',
			test: (pwd) => /[A-Z]/.test(pwd),
			icon: 'text_fields',
		},
		{
			id: 'lowercase',
			label: 'At least one lowercase letter (a-z)',
			test: (pwd) => /[a-z]/.test(pwd),
			icon: 'text_fields',
		},
		{
			id: 'number',
			label: 'At least one number (0-9)',
			test: (pwd) => /\d/.test(pwd),
			icon: 'pin',
		},
		{
			id: 'special',
			label: 'At least one special character (@$!%*?&)',
			test: (pwd) => /[@$!%*?&]/.test(pwd),
			icon: 'password',
		},
	]

	// Tính toán trạng thái từng yêu cầu
	const requirementStatus = requirements.map((req) => ({
		...req,
		met: req.test(password),
	}))

	// Đếm số yêu cầu đã đáp ứng
	const metCount = requirementStatus.filter((req) => req.met).length
	const totalCount = requirements.length

	// Tính phần trăm độ mạnh
	const strengthPercent = (metCount / totalCount) * 100

	// Xác định màu sắc dựa trên độ mạnh
	const getStrengthColor = () => {
		if (strengthPercent === 0) return 'bg-gray-600'
		if (strengthPercent <= 40) return 'bg-red-500'
		if (strengthPercent <= 60) return 'bg-yellow-500'
		if (strengthPercent <= 80) return 'bg-blue-500'
		return 'bg-green-500'
	}

	const getStrengthText = () => {
		if (strengthPercent === 0) return ''
		if (strengthPercent <= 40) return 'Weak'
		if (strengthPercent <= 60) return 'Fair'
		if (strengthPercent <= 80) return 'Good'
		return 'Strong'
	}

	// Chỉ hiển thị các yêu cầu chưa đáp ứng
	const unmetRequirements = requirementStatus.filter((req) => !req.met)

	if (!showRequirements || password.length === 0) {
		return null
	}

	return (
		<div className="mt-3 space-y-3">
			{/* Thanh tiến trình độ mạnh mật khẩu */}
			<div className="space-y-1">
				<div className="flex items-center justify-between text-xs">
					<span className="text-gray-400">Password strength</span>
					<span
						className={`font-medium ${
							strengthPercent === 100
								? 'text-green-500'
								: strengthPercent >= 60
								? 'text-blue-500'
								: strengthPercent >= 40
								? 'text-yellow-500'
								: 'text-red-500'
						}`}
					>
						{getStrengthText()}
					</span>
				</div>
				<div className="h-1.5 w-full rounded-full bg-black/30 overflow-hidden">
					<div
						className={`h-full transition-all duration-300 ${getStrengthColor()}`}
						style={{ width: `${strengthPercent}%` }}
					/>
				</div>
			</div>

			{/* Danh sách yêu cầu chưa đáp ứng */}
			{unmetRequirements.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs text-gray-400">
						{unmetRequirements.length === totalCount
							? 'Password must contain:'
							: 'Still missing:'}
					</p>
					<div className="space-y-1.5">
						{unmetRequirements.map((req) => (
							<div key={req.id} className="flex items-start gap-2 text-xs text-gray-400">
								<span className="material-symbols-outlined text-sm mt-0.5 opacity-50">
									{req.icon}
								</span>
								<span>{req.label}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Thông báo hoàn thành */}
			{strengthPercent === 100 && (
				<div className="flex items-center gap-2 text-xs text-green-500 bg-green-600/10 px-3 py-2 rounded-lg">
					<span className="material-symbols-outlined text-sm">check_circle</span>
					<span className="font-medium">Password meets all requirements!</span>
				</div>
			)}
		</div>
	)
}

export default PasswordStrengthIndicator
