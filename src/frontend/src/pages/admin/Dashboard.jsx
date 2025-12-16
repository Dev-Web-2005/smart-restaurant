import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import BasePageLayout from '../../components/layout/BasePageLayout' // Import component Layout
import { useUser } from '../../contexts/UserContext'
import { useLoading } from '../../contexts/LoadingContext'
import { InlineLoader, CardSkeleton } from '../../components/common/LoadingSpinner'

// Import components từ Recharts
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'

// --- DỮ LIỆU MOCK BIỂU ĐỒ ---
const mockChartData = {
	'12m': [
		{ name: "Dec '24", tenants: 500, registrations: 50 },
		{ name: "Jan '25", tenants: 550, registrations: 60 },
		{ name: "Feb '25", tenants: 610, registrations: 70 },
		{ name: "Mar '25", tenants: 680, registrations: 85 },
		{ name: "Apr '25", tenants: 765, registrations: 90 },
		{ name: "May '25", tenants: 855, registrations: 105 },
		{ name: "Jun '25", tenants: 960, registrations: 110 },
		{ name: "Jul '25", tenants: 1070, registrations: 125 },
		{ name: "Aug '25", tenants: 1195, registrations: 130 },
		{ name: "Sep '25", tenants: 1325, registrations: 140 },
		{ name: "Oct '25", tenants: 1465, registrations: 155 },
		{ name: "Nov '25", tenants: 1620, registrations: 160 },
	],
	'6m': [
		{ name: "Jun '25", tenants: 960 },
		{ name: "Jul '25", tenants: 1070 },
		{ name: "Aug '25", tenants: 1195 },
		{ name: "Sep '25", tenants: 1325 },
		{ name: "Oct '25", tenants: 1465 },
		{ name: "Nov '25", tenants: 1620 },
	],
	'30d': [
		{ name: 'W1', tenants: 1400 },
		{ name: 'W2', tenants: 1440 },
		{ name: 'W3', tenants: 1510 },
		{ name: 'W4', tenants: 1620 },
	],
	all: [
		{ name: '2023', tenants: 300 },
		{ name: '2024', tenants: 800 },
		{ name: '2025', tenants: 1620 },
	],
}
// ------------------------------

// Tương đương với Stat Card
const StatCard = ({
	title,
	value,
	footerText,
	icon,
	iconColorClass,
	footerColorClass,
	children,
}) => (
	<div className="bg-[#1A202C] p-6 rounded-xl flex flex-col">
		<div className="flex items-center justify-between mb-4">
			<p className="text-sm font-medium text-[#9dabb9]">{title}</p>
			{children ? (
				children
			) : (
				<span className={`material-symbols-outlined text-2xl ${iconColorClass}`}>
					{icon}
				</span>
			)}
		</div>
		<p className="text-4xl font-bold text-white">{value}</p>
		<p className={`text-sm mt-1 ${footerColorClass}`}>{footerText}</p>
	</div>
)

// Tương đương với Chart Component đã được thay thế
const TenantGrowthChart = ({ data, loading }) => {
	if (loading) {
		return (
			<div className="bg-[#101922] h-80 rounded-sm flex items-center justify-center text-center text-[#9dabb9]">
				<p className="text-lg">Loading Chart Data...</p>
			</div>
		)
	}

	return (
		<div className="h-80 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{
						top: 5,
						right: 20,
						left: 0,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
					<XAxis dataKey="name" stroke="#9dabb9" tickLine={false} />
					{/* Dùng YAxis cho giá trị tenants */}
					<YAxis stroke="#9dabb9" tickLine={false} domain={['auto', 'auto']} />
					<Tooltip
						contentStyle={{
							backgroundColor: '#1A202C',
							border: '1px solid #2D3748',
							color: 'white',
						}}
						itemStyle={{ color: '#137fec' }}
					/>
					{/* Đường biểu thị tổng số tenants (Tổng số tích lũy) */}
					<Line
						type="monotone"
						dataKey="tenants"
						stroke="#137fec"
						strokeWidth={3}
						dot={false}
						name="Total Tenants"
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	)
}

const Dashboard = () => {
	// 👈 SỬ DỤNG CONTEXT: Lấy thông tin người dùng đang đăng nhập
	const { user, loading: contextLoading } = useUser()

	// 1. State cho Dữ liệu
	const [activeTenants, setActiveTenants] = useState('...')
	const [disabledTenants, setDisabledTenants] = useState('...')
	const [newRegistrations, setNewRegistrations] = useState('...')
	const [regPeriod, setRegPeriod] = useState('week') // 'day', 'week', 'month'

	// State mới cho biểu đồ
	const [chartData, setChartData] = useState([])
	const [chartTimeRange, setChartTimeRange] = useState('12m') // '12m', '6m', '30d', 'all'
	const [chartLoading, setChartLoading] = useState(true) // Loading riêng cho biểu đồ

	const [loading, setLoading] = useState(true) // Loading chung cho Stat Cards

	// 2. Hàm Fetch Data (Chuẩn bị cho Axios)
	const fetchStatCardsData = async () => {
		// Comment: BẮT ĐẦU: Logic gọi API lấy Stat Cards
		console.log('Fetching general stat card data...')
		setLoading(true)
		// try {
		//     // Gửi kèm token hoặc ID người dùng trong header
		//     const response = await axios.get('/api/dashboard/stats');
		//     setActiveTenants(response.data.totalActive.toLocaleString());
		//     setDisabledTenants(response.data.totalDisabled.toLocaleString());
		// } catch (error) {
		//     console.error("Error fetching stats:", error);
		// } finally {
		//     setLoading(false);
		// }

		// Dữ liệu giả định cho UI
		setTimeout(() => {
			setActiveTenants('1,254')
			setDisabledTenants('78')
			setLoading(false)
		}, 500)
		// Comment: KẾT THÚC: Logic gọi API lấy Stat Cards
	}

	const fetchNewRegData = async (period) => {
		// Comment: BẮT ĐẦU: Logic gọi API lấy số lượng đăng ký mới
		console.log(`Fetching new registrations for: ${period}`)
		// try {
		//     const response = await axios.get(`/api/dashboard/new_registrations?period=${period}`);
		//     setNewRegistrations(response.data.count.toLocaleString());
		// } catch (error) {
		//     console.error("Error fetching new regs:", error);
		// }

		// Dữ liệu giả định
		if (period === 'day') setNewRegistrations('5')
		else if (period === 'week') setNewRegistrations('36')
		else if (period === 'month') setNewRegistrations('120')
		// Comment: KẾT THÚC: Logic gọi API lấy số lượng đăng ký mới
	}

	const fetchChartData = async (timeRange) => {
		// Comment: BẮT ĐẦU: Logic gọi API lấy dữ liệu biểu đồ
		console.log(`Fetching chart data for range: ${timeRange}`)
		setChartLoading(true)

		// Dữ liệu giả định
		setTimeout(() => {
			const data = mockChartData[timeRange] || mockChartData['12m']
			setChartData(data)
			setChartLoading(false)
		}, 800)

		// Logic Axios thực tế (khi có API)
		// try {
		//     const response = await axios.get(`/api/dashboard/growth?range=${timeRange}`);
		//     setChartData(response.data.growthData);
		// } catch (error) {
		//     console.error("Error fetching chart data:", error);
		// } finally {
		//     setChartLoading(false);
		// }
		// Comment: KẾT THÚC: Logic gọi API lấy dữ liệu biểu đồ
	}

	// 3. useEffect để gọi dữ liệu ban đầu
	useEffect(() => {
		// Comment: Đảm bảo dữ liệu StatCards được load
		fetchStatCardsData()

		// Gọi lại fetchNewRegData khi regPeriod thay đổi
		fetchNewRegData(regPeriod)
	}, [regPeriod])

	useEffect(() => {
		// Gọi lại fetchChartData khi chartTimeRange thay đổi
		fetchChartData(chartTimeRange)
	}, [chartTimeRange])

	// 4. Helper function cho Footer text
	const getNewRegFooter = () => {
		// Comment: API có thể trả về phần trăm thay đổi trực tiếp, hoặc bạn tự tính toán.
		if (regPeriod === 'day') return '+1.5% from yesterday'
		if (regPeriod === 'week') return '+5.2% from last week'
		if (regPeriod === 'month') return '+20% from last month'
		return ''
	}

	const dashboardContent = (
		<>
			{/* Header */}
			<header className="flex flex-wrap justify-between items-center gap-4 mb-8">
				<div className="flex flex-col space-y-2">
					<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
						Dashboard Overview
					</h1>
					{/* Hiển thị tên người dùng đã đăng nhập */}
					<p className="text-[#9dabb9] text-base">
						Welcome back, {user?.name || 'User'}. Here's a look at the platform's health.
					</p>
				</div>
			</header>

			{/* Stat Cards Grid */}
			<div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
				<StatCard
					title="Total Active Tenants"
					// Hiển thị '...' nếu đang load data của Stat Card
					value={loading ? '...' : activeTenants}
					footerText="+12 since last month" // Comment: Có thể lấy từ API
					icon="storefront"
					iconColorClass="text-[#137fec]"
					footerColorClass="text-[#4ade80]"
				/>

				<StatCard
					title="Total Disabled Tenants"
					value={loading ? '...' : disabledTenants} // Hiển thị '...' nếu đang load data của Stat Card
					footerText="2 due to non-payment" // Comment: Có thể lấy từ API
					icon="storefront"
					iconColorClass="text-red-500"
					footerColorClass="text-gray-400"
				/>

				<StatCard
					title="New Tenant Registrations"
					value={newRegistrations}
					footerText={getNewRegFooter()}
					footerColorClass="text-[#4ade80]"
				>
					<div className="flex items-center bg-[#2D3748] rounded-full text-xs">
						{['Day', 'Week', 'Month'].map((period) => (
							<button
								key={period}
								onClick={() => setRegPeriod(period.toLowerCase())}
								className={`px-2 py-0.5 rounded-full transition-colors border-none cursor-pointer ${
									regPeriod === period.toLowerCase()
										? 'bg-[#137fec] text-white font-semibold'
										: 'text-[#9dabb9] bg-transparent hover:bg-blue-600/20 hover:text-white'
								}`}
							>
								{period}
							</button>
						))}
					</div>
				</StatCard>
			</div>

			{/* Chart Card */}
			<div className="bg-[#1A202C] p-6 rounded-xl">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
					<div>
						<h3 className="text-lg font-bold text-white">Tenant Growth</h3>
						<p className="text-sm text-[#9dabb9]">
							Platform-wide tenant registrations over time.
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-[#9dabb9]">Time Range:</span>
						<select
							className="bg-[#2D3748] border-none text-white text-sm rounded-sm p-2 cursor-pointer focus:ring-0 focus:border-transparent"
							value={chartTimeRange}
							onChange={(e) => setChartTimeRange(e.target.value)}
						>
							<option value="12m">Last 12 Months</option>
							<option value="6m">Last 6 Months</option>
							<option value="30d">Last 30 Days</option>
							<option value="all">All Time</option>
						</select>
					</div>
				</div>

				{/* THAY THẾ ChartPlaceholder bằng component Biểu đồ thực tế */}
				<TenantGrowthChart data={chartData} loading={chartLoading} />
			</div>
		</>
	)

	// Trả về nội dung Dashboard được bọc trong BasePageLayout
	return <BasePageLayout activeRoute="Dashboard">{dashboardContent}</BasePageLayout>
}

export default Dashboard
