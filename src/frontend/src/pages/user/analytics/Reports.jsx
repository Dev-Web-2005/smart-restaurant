// import React, { useState, useEffect, useCallback } from 'react'
// import {
// 	LineChart,
// 	Line,
// 	XAxis,
// 	YAxis,
// 	CartesianGrid,
// 	Tooltip,
// 	ResponsiveContainer,
// 	PieChart,
// 	Pie,
// 	Cell,
// 	Legend,
// } from 'recharts'
// import BasePageLayout from '../../../components/layout/BasePageLayout'

// // ====================================================================
// // --- Mock Data APIs (Dữ liệu giả để vẽ biểu đồ) ---
// // ====================================================================

// // Base API URL (URL API thực tế sẽ sử dụng)
// const BASE_API_URL = 'https://your-restaurant-api.com/api/v1'

// // Hàm lấy dữ liệu Doanh thu (Mock - Dữ liệu giả)
// const fetchRevenueData = async (range) => {
// 	console.log(`Fetching revenue data for: ${range}`)
// 	// Thêm độ trễ để mô phỏng call API thực tế
// 	await new Promise((resolve) => setTimeout(resolve, 500))

// 	const baseData = {
// 		// Dữ liệu giả cho "day"
// 		day: [
// 			{ name: '10AM', Revenue: 450 },
// 			{ name: '12PM', Revenue: 1800 },
// 			{ name: '2PM', Revenue: 2150 },
// 			{ name: '4PM', Revenue: 2300 },
// 			{ name: '6PM', Revenue: 3400 },
// 			{ name: '8PM', Revenue: 4500 },
// 			{ name: '10PM', Revenue: 5120 },
// 		],
// 		// Dữ liệu giả cho "month"
// 		month: [
// 			{ name: 'Wk1', Revenue: 15500 },
// 			{ name: 'Wk2', Revenue: 18000 },
// 			{ name: 'Wk3', Revenue: 19500 },
// 			{ name: 'Wk4', Revenue: 22100 },
// 		],
// 		// Dữ liệu giả cho "year"
// 		year: [
// 			{ name: 'Q1', Revenue: 45000 },
// 			{ name: 'Q2', Revenue: 58000 },
// 			{ name: 'Q3', Revenue: 62500 },
// 			{ name: 'Q4', Revenue: 71000 },
// 		],
// 	}
// 	return baseData[range] || baseData.day
// }

// // Hàm lấy dữ liệu Phân chia Thanh toán (Mock - Dữ liệu giả)
// const fetchPaymentSplitData = async () => {
// 	await new Promise((resolve) => setTimeout(resolve, 300))
// 	return [
// 		{ name: 'Digital', value: 65, color: '#137fec' }, // Xanh dương đậm
// 		{ name: 'Cash', value: 35, color: 'rgba(59, 130, 246, 0.4)' }, // Xanh dương nhạt
// 	]
// }

// // Hàm lấy dữ liệu Bán chạy nhất (Mock - Dữ liệu giả)
// const fetchBestsellersData = async () => {
// 	await new Promise((resolve) => setTimeout(resolve, 200))
// 	return [
// 		{ rank: 1, name: 'Classic Cheeseburger', sales: 320, progress: 100 },
// 		{ rank: 2, name: 'Margherita Pizza', sales: 295, progress: 92 },
// 		{ rank: 3, name: 'Chicken Alfredo Pasta', sales: 272, progress: 85 },
// 		{ rank: 4, name: 'Caesar Salad', sales: 250, progress: 78 },
// 		{ rank: 5, name: 'Grilled Salmon', sales: 224, progress: 70 },
// 		{ rank: 6, name: 'Tiramisu', sales: 180, progress: 56 },
// 		{ rank: 7, name: 'French Fries', sales: 150, progress: 47 },
// 		{ rank: 8, name: 'Espresso', sales: 130, progress: 41 },
// 		{ rank: 9, name: 'Veggie Burger', sales: 110, progress: 34 },
// 		{ rank: 10, name: 'Soda (Avg.)', sales: 90, progress: 28 },
// 	]
// }

// // Hàm lấy dữ liệu Ít phổ biến nhất (Mock - Dữ liệu giả)
// const fetchLeastPopularData = async () => {
// 	await new Promise((resolve) => setTimeout(resolve, 150))
// 	return [
// 		{ name: 'Vegan Tofu Scramble', sales: 12 },
// 		{ name: 'Anchovy Special Pizza', sales: 15 },
// 		{ name: 'Liver & Onions', sales: 19 },
// 		{ name: 'Oat Milk Latte', sales: 23 },
// 		{ name: 'Beetroot Salad', sales: 25 },
// 	]
// }

// // Hàm lấy dữ liệu Lợi nhuận cao nhất (Mock - Dữ liệu giả)
// const fetchHighestProfitData = async () => {
// 	await new Promise((resolve) => setTimeout(resolve, 150))
// 	return [
// 		{ name: 'Truffle Risotto', profit: 2450.0 },
// 		{ name: 'Filet Mignon', profit: 2120.5 },
// 		{ name: 'Lobster Bisque', profit: 1890.0 },
// 		{ name: 'Craft Cocktails (Avg.)', profit: 1750.8 },
// 		{ name: 'House Special Pizza', profit: 1545.0 },
// 	]
// }

// // ====================================================================
// // --- Actual API Call Logic (Dành cho sản xuất, đang comment) ---
// // ====================================================================

// /**
//  * * *******************************************************************
//  * Vui lòng UNCOMMENT và thay thế các hàm Mock bằng logic thực tế này
//  * khi chuyển sang môi trường sản xuất.
//  * *******************************************************************
//  * */

// /*
// // API thực tế: Lấy dữ liệu Doanh thu
// const fetchRevenueData_Actual = async (range) => {
//   try {
//     const response = await fetch(`${BASE_API_URL}/revenue?range=${range}`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Dữ liệu trả về cần phải có format: [{ name: "...", Revenue: number }, ...]
//     return data;
//   } catch (error) {
//     console.error("Error fetching actual revenue data:", error);
//     // Trả về dữ liệu trống hoặc một số dữ liệu mặc định/lỗi
//     return [];
//   }
// };

// // API thực tế: Lấy dữ liệu Phân chia Thanh toán
// const fetchPaymentSplitData_Actual = async () => {
//   try {
//     const response = await fetch(`${BASE_API_URL}/payments/split`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Dữ liệu trả về cần phải có format: [{ name: "Digital", value: 65, color: "#137fec" }, ...]
//     return data.map(item => ({
//         ...item,
//         color: item.name === 'Digital' ? "#137fec" : "rgba(59, 130, 246, 0.4)" // Gán màu theo tên
//     }));
//   } catch (error) {
//     console.error("Error fetching actual payment split data:", error);
//     return [];
//   }
// };

// // API thực tế: Lấy dữ liệu Bán chạy nhất
// const fetchBestsellersData_Actual = async () => {
//   try {
//     const response = await fetch(`${BASE_API_URL}/products/bestsellers`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Dữ liệu trả về cần phải có format: [{ rank: 1, name: "...", sales: 320, progress: 100 }, ...]
//     return data;
//   } catch (error) {
//     console.error("Error fetching actual bestsellers data:", error);
//     return [];
//   }
// };

// // API thực tế: Lấy dữ liệu Ít phổ biến nhất
// const fetchLeastPopularData_Actual = async () => {
//   try {
//     const response = await fetch(`${BASE_API_URL}/products/least-popular`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Dữ liệu trả về cần phải có format: [{ name: "...", sales: 12 }, ...]
//     return data;
//   } catch (error) {
//     console.error("Error fetching actual least popular data:", error);
//     return [];
//   }
// };

// // API thực tế: Lấy dữ liệu Lợi nhuận cao nhất
// const fetchHighestProfitData_Actual = async () => {
//   try {
//     const response = await fetch(`${BASE_API_URL}/products/highest-profit`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Dữ liệu trả về cần phải có format: [{ name: "...", profit: 2450.0 }, ...]
//     return data;
//   } catch (error) {
//     console.error("Error fetching actual highest profit data:", error);
//     return [];
//   }
// };
// */

// // ====================================================================
// // --- Components (Giữ nguyên) ---
// // ====================================================================

// const RevenueChart = ({ title, data, range, setRange }) => {
// 	const timeRanges = ['day', 'month', 'year']

// 	return (
// 		// Đảm bảo chiều cao hợp lý khi chiếm trọn một hàng
// 		<div className="bg-[#1A202C] rounded-xl p-6 h-[400px] flex flex-col">
// 			<div className="flex flex-wrap justify-between items-center gap-4 mb-6">
// 				<h2 className="text-xl font-bold text-white mt-0">{title}</h2>
// 				<div className="flex items-center gap-2 bg-[#2D3748] p-1 rounded-lg">
// 					{timeRanges.map((r) => (
// 						<button
// 							key={r}
// 							onClick={() => setRange(r)}
// 							className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors duration-150 ease-in-out ${
// 								range === r ? 'text-white bg-blue-600' : 'text-[#9dabb9] hover:text-white'
// 							}`}
// 						>
// 							{r}
// 						</button>
// 					))}
// 				</div>
// 			</div>

// 			<ResponsiveContainer width="100%" height="100%">
// 				<LineChart
// 					data={data}
// 					// Giảm margin trái (left) để tránh bị cắt chữ số YAxis khi biểu đồ rộng hơn
// 					margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
// 				>
// 					<CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
// 					<XAxis dataKey="name" stroke="#9dabb9" tickLine={false} />
// 					<YAxis
// 						stroke="#9dabb9"
// 						tickLine={false}
// 						tickFormatter={(value) => `$${value.toLocaleString()}`}
// 					/>
// 					<Tooltip
// 						formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
// 						contentStyle={{
// 							backgroundColor: '#1A202C',
// 							border: '1px solid #4A5568',
// 							borderRadius: '4px',
// 						}}
// 						labelStyle={{ color: '#ffffff' }}
// 					/>
// 					<Line
// 						type="monotone"
// 						dataKey="Revenue"
// 						stroke="#137fec"
// 						strokeWidth={3}
// 						dot={{ r: 4 }}
// 						activeDot={{ r: 6 }}
// 					/>
// 				</LineChart>
// 			</ResponsiveContainer>
// 		</div>
// 	)
// }

// const PaymentSplitChart = ({ title, data }) => {
// 	const COLORS = data.map((d) => d.color)

// 	const renderCustomizedLabel = useCallback(
// 		({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
// 			if (percent * 100 < 5) return null
// 			const radius = innerRadius + (outerRadius - innerRadius) * 0.5
// 			const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
// 			const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)

// 			return (
// 				<text
// 					x={x}
// 					y={y}
// 					fill="white"
// 					textAnchor={x > cx ? 'start' : 'end'}
// 					dominantBaseline="central"
// 					className="text-xs font-bold"
// 				>
// 					{`${(percent * 100).toFixed(0)}%`}
// 				</text>
// 			)
// 		},
// 		[],
// 	)

// 	return (
// 		// Tăng chiều cao lên 400px để phù hợp với bố cục một hàng
// 		<div className="bg-[#1A202C] rounded-xl p-6 flex flex-col items-center h-[400px]">
// 			<h2 className="text-xl font-bold text-white mb-4 mt-0 w-full">{title}</h2>
// 			{/* Tăng height lên 250 để biểu đồ lớn hơn trong khung 400px */}
// 			<ResponsiveContainer width="100%" height={300}>
// 				<PieChart>
// 					<Pie
// 						data={data}
// 						innerRadius={80} // Tăng innerRadius để phù hợp với kích thước lớn hơn
// 						outerRadius={120} // Tăng outerRadius
// 						fill="#8884d8"
// 						paddingAngle={5}
// 						dataKey="value"
// 						labelLine={false}
// 						label={renderCustomizedLabel}
// 					>
// 						{data.map((entry, index) => (
// 							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
// 						))}
// 					</Pie>
// 					<Tooltip
// 						formatter={(value, name) => [`${value}%`, name]}
// 						contentStyle={{
// 							backgroundColor: '#1A202C',
// 							border: '1px solid #4A5568',
// 							borderRadius: '4px',
// 						}}
// 						labelStyle={{ color: '#ffffff' }}
// 					/>
// 					<Legend
// 						wrapperStyle={{ paddingTop: '16px' }}
// 						payload={data.map((item, index) => ({
// 							value: `${item.name} (${item.value}%)`,
// 							type: 'square',
// 							id: item.name,
// 							color: COLORS[index],
// 						}))}
// 					/>
// 				</PieChart>
// 			</ResponsiveContainer>
// 		</div>
// 	)
// }

// const BestsellersList = ({ title, data }) => {
// 	const topFive = data.slice(0, 5)

// 	return (
// 		<div className="bg-[#1A202C] rounded-xl p-6">
// 			<h2 className="text-xl font-bold text-white mb-6 mt-0">{title}</h2>
// 			<div className="space-y-4">
// 				{topFive.map((item) => (
// 					<div key={item.rank} className="flex items-center gap-4">
// 						<span className="text-sm font-medium text-[#9dabb9] w-8 text-right flex-shrink-0">
// 							{item.rank}.
// 						</span>
// 						<p className="text-sm text-white flex-1 truncate">{item.name}</p>
// 						<div className="w-1/2 bg-[#2D3748] rounded-full h-2.5 overflow-hidden">
// 							<div
// 								className="bg-blue-600 h-full rounded-full transition-all duration-500"
// 								style={{ width: `${item.progress}%` }}
// 							></div>
// 						</div>
// 						<span className="text-sm font-medium text-[#9dabb9] w-16 text-right flex-shrink-0">
// 							{item.sales} sold
// 						</span>
// 					</div>
// 				))}
// 			</div>
// 			{data.length > topFive.length && (
// 				<p className="text-center text-sm text-[#9dabb9] pt-4 mt-0">
// 					... and {data.length - topFive.length} more
// 				</p>
// 			)}
// 		</div>
// 	)
// }

// const SimpleListCard = ({ title, data }) => {
// 	return (
// 		<div className="bg-[#1A202C] rounded-xl p-6">
// 			<h2 className="text-xl font-bold text-white mb-6 mt-0">{title}</h2>
// 			<ul className="space-y-3 list-none p-0 m-0">
// 				{data.map((item, index) => (
// 					<li
// 						key={index}
// 						className="flex justify-between items-center p-3 bg-[#2D3748] rounded-lg"
// 					>
// 						<p className="text-sm text-white truncate">{item.name}</p>
// 						<span className={`text-sm font-medium flex-shrink-0 ${item.colorClass}`}>
// 							{item.value}
// 						</span>
// 					</li>
// 				))}
// 			</ul>
// 		</div>
// 	)
// }

// // Component TabButton đơn giản
// const TabButton = ({ name, icon, active, onClick }) => (
// 	<button
// 		onClick={onClick}
// 		className={`flex items-center space-x-2 px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors duration-200
//             ${
// 							active
// 								? 'text-blue-400 border-b-4 border-blue-600'
// 								: 'text-[#9dabb9] hover:text-white border-b-4 border-transparent hover:border-gray-600'
// 						}`}
// 	>
// 		<span className="text-2xl">{icon}</span>
// 		<span>{name}</span>
// 	</button>
// )

// // ====================================================================
// // --- Main Component ---
// // ====================================================================

// const AnalyticsDashboard = () => {
// 	const [activeTab, setActiveTab] = useState('financials') // 'financials' hoặc 'menu'
// 	const [revenueRange, setRevenueRange] = useState('day')
// 	const [revenueData, setRevenueData] = useState([])
// 	const [paymentSplitData, setPaymentSplitData] = useState([])
// 	const [bestsellers, setBestsellers] = useState([])
// 	const [leastPopular, setLeastPopular] = useState([])
// 	const [highestProfit, setHighestProfit] = useState([])

// 	// Load Revenue Data dựa trên range
// 	useEffect(() => {
// 		const loadRevenue = async () => {
// 			try {
// 				// Thay thế 'fetchRevenueData' bằng 'fetchRevenueData_Actual' khi dùng API thực tế
// 				const data = await fetchRevenueData(revenueRange)
// 				setRevenueData(data)
// 			} catch (error) {
// 				console.error('Error fetching revenue data:', error)
// 			}
// 		}
// 		loadRevenue()
// 	}, [revenueRange])

// 	// Load Payment Split Data (Chỉ chạy 1 lần)
// 	useEffect(() => {
// 		const loadPaymentSplit = async () => {
// 			try {
// 				// Thay thế 'fetchPaymentSplitData' bằng 'fetchPaymentSplitData_Actual' khi dùng API thực tế
// 				const data = await fetchPaymentSplitData()
// 				setPaymentSplitData(data)
// 			} catch (error) {
// 				console.error('Error fetching payment split data:', error)
// 			}
// 		}
// 		loadPaymentSplit()
// 	}, [])

// 	// Load Dish Performance Data (Bestsellers, Least Popular, Highest Profit)
// 	useEffect(() => {
// 		const loadDishData = async () => {
// 			try {
// 				// Thay thế bằng fetchBestsellersData_Actual() khi dùng API thực tế
// 				setBestsellers(await fetchBestsellersData())

// 				// Thay thế bằng fetchLeastPopularData_Actual() khi dùng API thực tế
// 				const leastPopData = await fetchLeastPopularData()
// 				setLeastPopular(
// 					leastPopData.map((d) => ({
// 						name: d.name,
// 						value: `${d.sales} sold`,
// 						colorClass: 'text-red-400', // Màu đỏ cho ít phổ biến
// 					})),
// 				)

// 				// Thay thế bằng fetchHighestProfitData_Actual() khi dùng API thực tế
// 				const highProfitData = await fetchHighestProfitData()
// 				setHighestProfit(
// 					highProfitData.map((d) => ({
// 						name: d.name,
// 						value: `$${d.profit.toLocaleString('en-US', {
// 							minimumFractionDigits: 2,
// 						})} Profit`,
// 						colorClass: 'text-green-400', // Màu xanh lá cây cho lợi nhuận cao
// 					})),
// 				)
// 			} catch (error) {
// 				console.error('Error fetching dish data:', error)
// 			}
// 		}
// 		loadDishData()
// 	}, [])

// 	return (
// 		<BasePageLayout>
// 			<div className="min-h-screen bg-[#101922] p-8 text-white">
// 				<div className="max-w-7xl mx-auto">
// 					<header className="mb-8">
// 						<h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
// 							Analytics Dashboard
// 						</h1>
// 						<p className="text-lg text-[#9dabb9]">
// 							Insights into your restaurant's performance.
// 						</p>
// 					</header>

// 					{/* --- Tab Navigation --- */}
// 					<div className="flex border-b border-gray-700 mb-8">
// 						<TabButton
// 							name="Sales & Financials"
// 							active={activeTab === 'financials'}
// 							onClick={() => setActiveTab('financials')}
// 						/>
// 						<TabButton
// 							name="Menu Item Performance"
// 							active={activeTab === 'menu'}
// 							onClick={() => setActiveTab('menu')}
// 						/>
// 					</div>

// 					{/* --- Tab Content: Sales & Financials ---
//               Thay đổi: grid-cols-1 để mỗi item chiếm trọn 1 hàng (lg:grid-cols-1)
//           */}
// 					{activeTab === 'financials' && (
// 						<div className="animate-in fade-in slide-in-from-top-1">
// 							{/* Thay đổi từ lg:grid-cols-3 thành grid-cols-1 để mỗi item chiếm 1 hàng */}
// 							<div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
// 								{/* Loại bỏ lg:col-span-2 vì không cần thiết khi chỉ có 1 cột */}
// 								<div>
// 									<RevenueChart
// 										title="Revenue Performance"
// 										data={revenueData}
// 										range={revenueRange}
// 										setRange={setRevenueRange}
// 									/>
// 								</div>
// 								{/* Loại bỏ div bao bọc và giữ nguyên component */}
// 								<div>
// 									<PaymentSplitChart
// 										title="Payment Method Split"
// 										data={paymentSplitData}
// 									/>
// 								</div>
// 							</div>
// 						</div>
// 					)}

// 					{/* --- Tab Content: Menu Item Performance (Giữ nguyên bố cục cũ) --- */}
// 					{activeTab === 'menu' && (
// 						<div className="animate-in fade-in slide-in-from-top-1">
// 							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// 								<div className="lg:col-span-2">
// 									<BestsellersList
// 										title="Top 5 Bestsellers (By Volume)"
// 										data={bestsellers}
// 									/>
// 								</div>
// 								<div>
// 									<SimpleListCard title="Bottom 5 Least Popular" data={leastPopular} />
// 								</div>
// 								<div className="lg:col-span-2">
// 									<SimpleListCard
// 										title="Top 5 Highest Profit Margin Dishes"
// 										data={highestProfit}
// 									/>
// 								</div>
// 								<div className="bg-black/40 backdrop-blur-md rounded-xl p-6 flex items-center justify-center text-gray-300 italic h-full min-h-[280px] border border-white/10">
// 									<p>Additional Metric Card (e.g., Waste/Inventory)</p>
// 								</div>
// 							</div>
// 						</div>
// 					)}
// 				</div>
// 			</div>
// 		</BasePageLayout>
// 	)
// }

// export default AnalyticsDashboard

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { useUser } from '../../../contexts/UserContext'

// ====================================================================
// --- Mock Data APIs (Dữ liệu giả để vẽ biểu đồ) ---
// ====================================================================

// Base API URL (URL API thực tế sẽ sử dụng)
const BASE_API_URL = 'https://your-restaurant-api.com/api/v1'

// Hàm lấy dữ liệu Doanh thu (Mock - Dữ liệu giả)
const fetchRevenueData = async (range) => {
	console.log(`Fetching revenue data for: ${range}`)
	// Thêm độ trễ để mô phỏng call API thực tế
	await new Promise((resolve) => setTimeout(resolve, 500))

	const baseData = {
		// Dữ liệu giả cho "day"
		day: [
			{ name: '10AM', Revenue: 450 },
			{ name: '12PM', Revenue: 1800 },
			{ name: '2PM', Revenue: 2150 },
			{ name: '4PM', Revenue: 2300 },
			{ name: '6PM', Revenue: 3400 },
			{ name: '8PM', Revenue: 4500 },
			{ name: '10PM', Revenue: 5120 },
		],
		// Dữ liệu giả cho "month"
		month: [
			{ name: 'Wk1', Revenue: 15500 },
			{ name: 'Wk2', Revenue: 18000 },
			{ name: 'Wk3', Revenue: 19500 },
			{ name: 'Wk4', Revenue: 22100 },
		],
		// Dữ liệu giả cho "year"
		year: [
			{ name: 'Q1', Revenue: 45000 },
			{ name: 'Q2', Revenue: 58000 },
			{ name: 'Q3', Revenue: 62500 },
			{ name: 'Q4', Revenue: 71000 },
		],
	}
	return baseData[range] || baseData.day
}

// Hàm lấy dữ liệu Phân chia Thanh toán (Mock - Dữ liệu giả)
const fetchPaymentSplitData = async () => {
	await new Promise((resolve) => setTimeout(resolve, 300))
	return [
		{ name: 'Digital', value: 65, color: '#137fec' }, // Xanh dương đậm
		{ name: 'Cash', value: 35, color: 'rgba(59, 130, 246, 0.4)' }, // Xanh dương nhạt
	]
}

// Hàm lấy dữ liệu Bán chạy nhất (Mock - Dữ liệu giả)
const fetchBestsellersData = async () => {
	await new Promise((resolve) => setTimeout(resolve, 200))
	return [
		{ rank: 1, name: 'Classic Cheeseburger', sales: 320, progress: 100 },
		{ rank: 2, name: 'Margherita Pizza', sales: 295, progress: 92 },
		{ rank: 3, name: 'Chicken Alfredo Pasta', sales: 272, progress: 85 },
		{ rank: 4, name: 'Caesar Salad', sales: 250, progress: 78 },
		{ rank: 5, name: 'Grilled Salmon', sales: 224, progress: 70 },
		{ rank: 6, name: 'Tiramisu', sales: 180, progress: 56 },
		{ rank: 7, name: 'French Fries', sales: 150, progress: 47 },
		{ rank: 8, name: 'Espresso', sales: 130, progress: 41 },
		{ rank: 9, name: 'Veggie Burger', sales: 110, progress: 34 },
		{ rank: 10, name: 'Soda (Avg.)', sales: 90, progress: 28 },
	]
}

// Hàm lấy dữ liệu Ít phổ biến nhất (Mock - Dữ liệu giả)
const fetchLeastPopularData = async () => {
	await new Promise((resolve) => setTimeout(resolve, 150))
	return [
		{ name: 'Vegan Tofu Scramble', sales: 12 },
		{ name: 'Anchovy Special Pizza', sales: 15 },
		{ name: 'Liver & Onions', sales: 19 },
		{ name: 'Oat Milk Latte', sales: 23 },
		{ name: 'Beetroot Salad', sales: 25 },
	]
}

// Hàm lấy dữ liệu Lợi nhuận cao nhất (Mock - Dữ liệu giả)
const fetchHighestProfitData = async () => {
	await new Promise((resolve) => setTimeout(resolve, 150))
	return [
		{ name: 'Truffle Risotto', profit: 2450.0 },
		{ name: 'Filet Mignon', profit: 2120.5 },
		{ name: 'Lobster Bisque', profit: 1890.0 },
		{ name: 'Craft Cocktails (Avg.)', profit: 1750.8 },
		{ name: 'House Special Pizza', profit: 1545.0 },
	]
}

// ====================================================================
// --- Actual API Call Logic (Dành cho sản xuất, đang comment) ---
// ====================================================================

/**
 * * *******************************************************************
 * Vui lòng UNCOMMENT và thay thế các hàm Mock bằng logic thực tế này
 * khi chuyển sang môi trường sản xuất.
 * *******************************************************************
 * */

/*
// API thực tế: Lấy dữ liệu Doanh thu
const fetchRevenueData_Actual = async (range) => {
  try {
    const response = await fetch(`${BASE_API_URL}/revenue?range=${range}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Dữ liệu trả về cần phải có format: [{ name: "...", Revenue: number }, ...]
    return data; 
  } catch (error) {
    console.error("Error fetching actual revenue data:", error);
    // Trả về dữ liệu trống hoặc một số dữ liệu mặc định/lỗi
    return [];
  }
};

// API thực tế: Lấy dữ liệu Phân chia Thanh toán
const fetchPaymentSplitData_Actual = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/payments/split`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Dữ liệu trả về cần phải có format: [{ name: "Digital", value: 65, color: "#137fec" }, ...]
    return data.map(item => ({
        ...item,
        color: item.name === 'Digital' ? "#137fec" : "rgba(59, 130, 246, 0.4)" // Gán màu theo tên
    }));
  } catch (error) {
    console.error("Error fetching actual payment split data:", error);
    return [];
  }
};

// API thực tế: Lấy dữ liệu Bán chạy nhất
const fetchBestsellersData_Actual = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/products/bestsellers`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Dữ liệu trả về cần phải có format: [{ rank: 1, name: "...", sales: 320, progress: 100 }, ...]
    return data;
  } catch (error) {
    console.error("Error fetching actual bestsellers data:", error);
    return [];
  }
};

// API thực tế: Lấy dữ liệu Ít phổ biến nhất
const fetchLeastPopularData_Actual = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/products/least-popular`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Dữ liệu trả về cần phải có format: [{ name: "...", sales: 12 }, ...]
    return data;
  } catch (error) {
    console.error("Error fetching actual least popular data:", error);
    return [];
  }
};

// API thực tế: Lấy dữ liệu Lợi nhuận cao nhất
const fetchHighestProfitData_Actual = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/products/highest-profit`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Dữ liệu trả về cần phải có format: [{ name: "...", profit: 2450.0 }, ...]
    return data;
  } catch (error) {
    console.error("Error fetching actual highest profit data:", error);
    return [];
  }
};
*/

// ====================================================================
// --- Drag & Drop Order Management ---
// ====================================================================

/**
 * Card order state for drag-and-drop functionality
 * Maintains the display order of cards in each tab
 */
const DEFAULT_FINANCIALS_ORDER = ['revenue', 'payment']
const DEFAULT_MENU_ORDER = ['bestsellers', 'leastpopular', 'highestprofit', 'additional']

// ====================================================================
// --- Components (Giữ nguyên) ---
// ====================================================================

const RevenueChart = ({ title, data, range, setRange }) => {
	const timeRanges = ['day', 'month', 'year']

	return (
		<div className="bg-black/40 backdrop-blur-md rounded-xl p-6 h-[400px] flex flex-col border border-white/10">
			<div className="flex flex-wrap justify-between items-center gap-4 mb-6">
				<h2 className="text-xl font-bold text-white mt-0">{title}</h2>
				<div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-1 rounded-lg">
					{timeRanges.map((r) => (
						<button
							key={r}
							onClick={() => setRange(r)}
							className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors duration-150 ease-in-out ${
								range === r ? 'text-white bg-blue-600' : 'text-gray-300 hover:text-white'
							}`}
						>
							{r}
						</button>
					))}
				</div>
			</div>

			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
					<XAxis dataKey="name" stroke="#9dabb9" tickLine={false} />
					<YAxis
						stroke="#9dabb9"
						tickLine={false}
						tickFormatter={(value) => `$${value.toLocaleString()}`}
					/>
					<Tooltip
						formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
						contentStyle={{
							backgroundColor: '#1A202C',
							border: '1px solid #4A5568',
							borderRadius: '4px',
						}}
						labelStyle={{ color: '#ffffff' }}
					/>
					<Line
						type="monotone"
						dataKey="Revenue"
						stroke="#137fec"
						strokeWidth={3}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	)
}

const PaymentSplitChart = ({ title, data }) => {
	const COLORS = data.map((d) => d.color)

	const renderCustomizedLabel = useCallback(
		({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
			if (percent * 100 < 5) return null
			const radius = innerRadius + (outerRadius - innerRadius) * 0.5
			const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
			const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)

			return (
				<text
					x={x}
					y={y}
					fill="white"
					textAnchor={x > cx ? 'start' : 'end'}
					dominantBaseline="central"
					className="text-xs font-bold"
				>
					{`${(percent * 100).toFixed(0)}%`}
				</text>
			)
		},
		[],
	)

	return (
		<div className="bg-black/40 backdrop-blur-md rounded-xl p-6 flex flex-col items-center h-[400px] border border-white/10">
			<h2 className="text-xl font-bold text-white mb-4 mt-0 w-full">{title}</h2>
			<ResponsiveContainer width="100%" height={300}>
				<PieChart>
					<Pie
						data={data}
						innerRadius={80}
						outerRadius={120}
						fill="#8884d8"
						paddingAngle={5}
						dataKey="value"
						labelLine={false}
						label={renderCustomizedLabel}
					>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Tooltip
						formatter={(value, name) => [`${value}%`, name]}
						contentStyle={{
							backgroundColor: '#1A202C',
							border: '1px solid #4A5568',
							borderRadius: '4px',
						}}
						labelStyle={{ color: '#ffffff' }}
					/>
					<Legend
						wrapperStyle={{ paddingTop: '16px' }}
						payload={data.map((item, index) => ({
							value: `${item.name} (${item.value}%)`,
							type: 'square',
							id: item.name,
							color: COLORS[index],
						}))}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}

const BestsellersList = ({ title, data }) => {
	const topFive = data.slice(0, 5)

	return (
		<div className="bg-[#1A202C] rounded-xl p-6">
			<h2 className="text-xl font-bold text-white mb-6 mt-0">{title}</h2>
			<div className="space-y-4">
				{topFive.map((item) => (
					<div key={item.rank} className="flex items-center gap-4">
						<span className="text-sm font-medium text-[#9dabb9] w-8 text-right flex-shrink-0">
							{item.rank}.
						</span>
						<p className="text-sm text-white flex-1 truncate">{item.name}</p>
						<div className="w-1/2 bg-[#2D3748] rounded-full h-2.5 overflow-hidden">
							<div
								className="bg-blue-600 h-full rounded-full transition-all duration-500"
								style={{ width: `${item.progress}%` }}
							></div>
						</div>
						<span className="text-sm font-medium text-[#9dabb9] w-16 text-right flex-shrink-0">
							{item.sales} sold
						</span>
					</div>
				))}
			</div>
			{data.length > topFive.length && (
				<p className="text-center text-sm text-gray-300 pt-4 mt-0">
					... and {data.length - topFive.length} more
				</p>
			)}
		</div>
	)
}

const SimpleListCard = ({ title, data }) => {
	return (
		<div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
			<h2 className="text-xl font-bold text-white mb-6 mt-0">{title}</h2>
			<ul className="space-y-3 list-none p-0 m-0">
				{data.map((item, index) => (
					<li
						key={index}
						className="flex justify-between items-center p-3 bg-black/30 backdrop-blur-md rounded-lg"
					>
						<p className="text-sm text-white truncate">{item.name}</p>
						<span className={`text-sm font-medium flex-shrink-0 ${item.colorClass}`}>
							{item.value}
						</span>
					</li>
				))}
			</ul>
		</div>
	)
}

// Component TabButton đơn giản
const TabButton = ({ name, icon, active, onClick }) => (
	<button
		onClick={onClick}
		className={`flex items-center space-x-2 px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors duration-200 
            ${
							active
								? 'text-blue-400 border-b-4 border-blue-600'
								: 'text-[#9dabb9] hover:text-white border-b-4 border-transparent hover:border-gray-600'
						}`}
	>
		{icon && <span className="text-2xl">{icon}</span>}
		<span>{name}</span>
	</button>
)

// ====================================================================
// --- Draggable Wrapper Component ---
// ====================================================================

const DraggableWrapper = ({
	id,
	children,
	onDragStart,
	onDragOver,
	onDrop,
	isDragging,
	className = '',
}) => {
	const handleDragStart = (e) => {
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/plain', id)
		onDragStart(id)
	}

	const handleDragOver = (e) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		onDragOver(id)
	}

	const handleDrop = (e) => {
		e.preventDefault()
		onDrop(id)
	}

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className={`${className} ${
				isDragging === id ? 'opacity-50' : ''
			} transition-opacity duration-200 cursor-move`}
		>
			{children}
		</div>
	)
}

// ====================================================================
// --- Main Component ---
// ====================================================================

const AnalyticsDashboard = () => {
	const { user, loading: userLoading } = useUser()
	const [activeTab, setActiveTab] = useState('financials')
	const [revenueRange, setRevenueRange] = useState('day')
	const [revenueData, setRevenueData] = useState([])
	const [paymentSplitData, setPaymentSplitData] = useState([])
	const [bestsellers, setBestsellers] = useState([])
	const [leastPopular, setLeastPopular] = useState([])
	const [highestProfit, setHighestProfit] = useState([])

	// Drag and drop state - load from session storage
	const [financialsOrder, setFinancialsOrder] = useState(() => {
		const saved = sessionStorage.getItem('analytics-financials-order')
		if (saved) {
			try {
				return JSON.parse(saved)
			} catch (e) {
				console.error('Error loading financials order:', e)
			}
		}
		return DEFAULT_FINANCIALS_ORDER
	})
	const [menuOrder, setMenuOrder] = useState(() => {
		const saved = sessionStorage.getItem('analytics-menu-order')
		if (saved) {
			try {
				return JSON.parse(saved)
			} catch (e) {
				console.error('Error loading menu order:', e)
			}
		}
		return DEFAULT_MENU_ORDER
	})
	const [draggingId, setDraggingId] = useState(null)
	const dragOverIdRef = useRef(null) // Use ref instead of state to avoid unused warning

	// 📊 Display user info in console for debugging
	useEffect(() => {
		if (user) {
			console.log('📊 Analytics - User:', user.username, '| Role:', user.role)
		}
	}, [user])

	// Save order whenever it changes
	useEffect(() => {
		sessionStorage.setItem('analytics-financials-order', JSON.stringify(financialsOrder))
	}, [financialsOrder])

	useEffect(() => {
		sessionStorage.setItem('analytics-menu-order', JSON.stringify(menuOrder))
	}, [menuOrder])

	// Load Revenue Data dựa trên range
	useEffect(() => {
		const loadRevenue = async () => {
			try {
				// Thay thế 'fetchRevenueData' bằng 'fetchRevenueData_Actual' khi dùng API thực tế
				const data = await fetchRevenueData(revenueRange)
				setRevenueData(data)
			} catch (error) {
				console.error('Error fetching revenue data:', error)
			}
		}
		loadRevenue()
	}, [revenueRange])

	// Load Payment Split Data (Chỉ chạy 1 lần)
	useEffect(() => {
		const loadPaymentSplit = async () => {
			try {
				// Thay thế 'fetchPaymentSplitData' bằng 'fetchPaymentSplitData_Actual' khi dùng API thực tế
				const data = await fetchPaymentSplitData()
				setPaymentSplitData(data)
			} catch (error) {
				console.error('Error fetching payment split data:', error)
			}
		}
		loadPaymentSplit()
	}, [])

	// Load Dish Performance Data (Bestsellers, Least Popular, Highest Profit)
	useEffect(() => {
		const loadDishData = async () => {
			try {
				// Thay thế bằng fetchBestsellersData_Actual() khi dùng API thực tế
				setBestsellers(await fetchBestsellersData())

				// Thay thế bằng fetchLeastPopularData_Actual() khi dùng API thực tế
				const leastPopData = await fetchLeastPopularData()
				setLeastPopular(
					leastPopData.map((d) => ({
						name: d.name,
						value: `${d.sales} sold`,
						colorClass: 'text-red-400',
					})),
				)

				// Thay thế bằng fetchHighestProfitData_Actual() khi dùng API thực tế
				const highProfitData = await fetchHighestProfitData()
				setHighestProfit(
					highProfitData.map((d) => ({
						name: d.name,
						value: `$${d.profit.toLocaleString('en-US', {
							minimumFractionDigits: 2,
						})} Profit`,
						colorClass: 'text-green-400',
					})),
				)
			} catch (error) {
				console.error('Error fetching dish data:', error)
			}
		}
		loadDishData()
	}, [])

	// Drag and drop handlers
	const handleDragStart = (id) => {
		setDraggingId(id)
	}

	const handleDragOver = (id) => {
		dragOverIdRef.current = id
	}

	const handleDrop = (dropTargetId) => {
		if (draggingId && dropTargetId && draggingId !== dropTargetId) {
			const currentOrder = activeTab === 'financials' ? financialsOrder : menuOrder
			const setOrder = activeTab === 'financials' ? setFinancialsOrder : setMenuOrder

			const dragIndex = currentOrder.indexOf(draggingId)
			const dropIndex = currentOrder.indexOf(dropTargetId)

			if (dragIndex !== -1 && dropIndex !== -1) {
				const newOrder = [...currentOrder]
				newOrder.splice(dragIndex, 1)
				newOrder.splice(dropIndex, 0, draggingId)
				setOrder(newOrder)
			}
		}
		setDraggingId(null)
		dragOverIdRef.current = null
	}

	// Render card content by ID
	const renderCardById = (id) => {
		switch (id) {
			case 'revenue':
				return (
					<RevenueChart
						title="Revenue Performance"
						data={revenueData}
						range={revenueRange}
						setRange={setRevenueRange}
					/>
				)
			case 'payment':
				return <PaymentSplitChart title="Payment Method Split" data={paymentSplitData} />
			case 'bestsellers':
				return (
					<BestsellersList title="Top 5 Bestsellers (By Volume)" data={bestsellers} />
				)
			case 'leastpopular':
				return <SimpleListCard title="Bottom 5 Least Popular" data={leastPopular} />
			case 'highestprofit':
				return (
					<SimpleListCard
						title="Top 5 Highest Profit Margin Dishes"
						data={highestProfit}
					/>
				)
			case 'additional':
				return (
					<div className="bg-black/40 backdrop-blur-md rounded-xl p-6 flex items-center justify-center text-gray-300 italic h-full min-h-[280px] border border-white/10">
						<p>Additional Metric Card (e.g., Waste/Inventory)</p>
					</div>
				)
			default:
				return null
		}
	}

	return (
		<BasePageLayout>
			<div className="min-h-screen p-8 text-white">
				<div className="max-w-7xl mx-auto">
					<header className="mb-8">
						<h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
							Analytics Dashboard
						</h1>
						<p className="text-lg text-gray-300">
							Insights into your restaurant's performance.
						</p>
					</header>

					{/* --- Tab Navigation --- */}
					<div className="flex border-b border-gray-700 mb-8">
						<TabButton
							name="Sales & Financials"
							active={activeTab === 'financials'}
							onClick={() => setActiveTab('financials')}
						/>
						<TabButton
							name="Menu Item Performance"
							active={activeTab === 'menu'}
							onClick={() => setActiveTab('menu')}
						/>
					</div>

					{/* --- Tab Content: Sales & Financials --- */}
					{activeTab === 'financials' && (
						<div className="animate-in fade-in slide-in-from-top-1">
							<div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
								{financialsOrder.map((cardId) => (
									<DraggableWrapper
										key={cardId}
										id={cardId}
										onDragStart={handleDragStart}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										isDragging={draggingId}
									>
										{renderCardById(cardId)}
									</DraggableWrapper>
								))}
							</div>
						</div>
					)}

					{/* --- Tab Content: Menu Item Performance --- */}
					{activeTab === 'menu' && (
						<div className="animate-in fade-in slide-in-from-top-1">
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{menuOrder.map((cardId) => {
									// Determine grid span based on card type
									let gridClass = ''
									if (cardId === 'bestsellers' || cardId === 'highestprofit') {
										gridClass = 'lg:col-span-2'
									} else {
										gridClass = ''
									}

									return (
										<DraggableWrapper
											key={cardId}
											id={cardId}
											onDragStart={handleDragStart}
											onDragOver={handleDragOver}
											onDrop={handleDrop}
											isDragging={draggingId}
											className={gridClass}
										>
											{renderCardById(cardId)}
										</DraggableWrapper>
									)
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</BasePageLayout>
	)
}

export default AnalyticsDashboard
