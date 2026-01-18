// pages/user/analytics/Reports.jsx
// Report Dashboard - Comprehensive analytics and reporting for tenant admins

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	AreaChart,
	Area,
} from 'recharts'
import { motion } from 'framer-motion'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { useUser } from '../../../contexts/UserContext'
import {
	getRevenueReportAPI,
	getTopItemsReportAPI,
	getAnalyticsReportAPI,
	TIME_RANGE,
	formatCurrency,
	formatNumber,
	formatDate,
	getDateRangePreset,
	clearReportCache,
} from '../../../services/api/reportAPI'

// ==================== CONSTANTS ====================

const CHART_COLORS = {
	primary: '#3B82F6', // Blue
	secondary: '#10B981', // Green
	tertiary: '#F59E0B', // Amber
	quaternary: '#EF4444', // Red
	purple: '#8B5CF6',
	pink: '#EC4899',
}

const TIME_RANGE_OPTIONS = [
	{ value: TIME_RANGE.DAILY, label: 'Daily (30 days)' },
	{ value: TIME_RANGE.WEEKLY, label: 'Weekly (12 weeks)' },
	{ value: TIME_RANGE.MONTHLY, label: 'Monthly (12 months)' },
	{ value: TIME_RANGE.CUSTOM, label: 'Custom Range' },
]

const DATE_PRESETS = [
	{ value: 'week', label: 'Last 7 Days' },
	{ value: 'month', label: 'Last 30 Days' },
	{ value: 'quarter', label: 'Last 90 Days' },
	{ value: 'year', label: 'Last Year' },
]

// ==================== LOADING & ERROR COMPONENTS ====================

const LoadingSpinner = ({ message = 'Loading...' }) => (
	<div className="flex flex-col items-center justify-center py-12">
		<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
		<p className="text-gray-400 text-sm">{message}</p>
	</div>
)

const ErrorMessage = ({ message, onRetry }) => (
	<div className="flex flex-col items-center justify-center py-12">
		<span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
		<p className="text-red-400 text-sm mb-4">{message}</p>
		{onRetry && (
			<button
				onClick={onRetry}
				className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
			>
				Try Again
			</button>
		)}
	</div>
)

const NoDataMessage = ({ message = 'No data available' }) => (
	<div className="flex flex-col items-center justify-center py-12">
		<span className="material-symbols-outlined text-gray-500 text-5xl mb-4">inbox</span>
		<p className="text-gray-400 text-sm">{message}</p>
	</div>
)

// ==================== SUMMARY CARD COMPONENTS ====================

const SummaryCard = ({ icon, label, value, subValue, color = 'blue' }) => {
	const colorClasses = {
		blue: 'bg-blue-500/20 text-blue-400',
		green: 'bg-green-500/20 text-green-400',
		amber: 'bg-amber-500/20 text-amber-400',
		purple: 'bg-purple-500/20 text-purple-400',
		red: 'bg-red-500/20 text-red-400',
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10"
		>
			<div className="flex items-start justify-between mb-3">
				<div
					className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
				>
					<span className="material-symbols-outlined text-xl">{icon}</span>
				</div>
			</div>
			<p className="text-gray-400 text-sm mb-1">{label}</p>
			<p className="text-white text-2xl font-bold">{value}</p>
			{subValue && <p className="text-gray-500 text-xs mt-1">{subValue}</p>}
		</motion.div>
	)
}

// ==================== FILTER COMPONENTS ====================

const TimeRangeSelector = ({ value, onChange, disabled }) => (
	<div className="flex flex-wrap items-center gap-2">
		{TIME_RANGE_OPTIONS.map((option) => (
			<button
				key={option.value}
				onClick={() => onChange(option.value)}
				disabled={disabled}
				className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
					value === option.value
						? 'bg-blue-600 text-white'
						: 'bg-[#2D3748] text-gray-400 hover:text-white hover:bg-[#3D4758]'
				} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
			>
				{option.label}
			</button>
		))}
	</div>
)

const DateRangeFilter = ({
	startDate,
	endDate,
	onStartChange,
	onEndChange,
	disabled,
}) => (
	<div className="flex flex-wrap items-center gap-3">
		<div className="flex items-center gap-2">
			<label className="text-gray-400 text-sm">From:</label>
			<input
				type="date"
				value={startDate}
				onChange={(e) => onStartChange(e.target.value)}
				disabled={disabled}
				className="bg-[#2D3748] text-white px-3 py-1.5 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
			/>
		</div>
		<div className="flex items-center gap-2">
			<label className="text-gray-400 text-sm">To:</label>
			<input
				type="date"
				value={endDate}
				onChange={(e) => onEndChange(e.target.value)}
				disabled={disabled}
				className="bg-[#2D3748] text-white px-3 py-1.5 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
			/>
		</div>
	</div>
)

const DatePresetButtons = ({ onSelect, disabled }) => (
	<div className="flex flex-wrap items-center gap-2">
		{DATE_PRESETS.map((preset) => (
			<button
				key={preset.value}
				onClick={() => onSelect(preset.value)}
				disabled={disabled}
				className={`px-3 py-1 text-xs font-medium rounded-md bg-[#374151] text-gray-300 hover:bg-[#4B5563] hover:text-white transition-colors ${
					disabled ? 'opacity-50 cursor-not-allowed' : ''
				}`}
			>
				{preset.label}
			</button>
		))}
	</div>
)

const LimitSelector = ({ value, onChange, disabled }) => (
	<div className="flex items-center gap-2">
		<label className="text-gray-400 text-sm">Show top:</label>
		<select
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			disabled={disabled}
			className="bg-[#2D3748] text-white px-3 py-1.5 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
		>
			{[5, 10, 15, 20, 30, 50].map((num) => (
				<option key={num} value={num}>
					{num} items
				</option>
			))}
		</select>
	</div>
)

// ==================== CHART COMPONENTS ====================

const RevenueChart = ({ data, loading, error, onRetry }) => {
	if (loading) return <LoadingSpinner message="Loading revenue data..." />
	if (error) return <ErrorMessage message={error} onRetry={onRetry} />
	if (!data || data.length === 0)
		return <NoDataMessage message="No revenue data for selected period" />

	return (
		<div className="h-[350px]">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
					<defs>
						<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
							<stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.05} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
					<XAxis
						dataKey="period"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 12 }}
						tickLine={false}
					/>
					<YAxis
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 12 }}
						tickLine={false}
						tickFormatter={(value) => {
							if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
							if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
							return value
						}}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'rgba(31, 41, 55, 0.9)',
							backdropFilter: 'blur(12px)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '8px',
							color: '#fff',
						}}
						formatter={(value, name) => [
							formatCurrency(value),
							name === 'totalRevenue' ? 'Revenue' : 'Orders',
						]}
						labelFormatter={(label) => `Period: ${label}`}
					/>
					<Legend />
					<Area
						type="monotone"
						dataKey="totalRevenue"
						name="Revenue"
						stroke={CHART_COLORS.primary}
						strokeWidth={2}
						strokeOpacity={0.8}
						fill="url(#revenueGradient)"
						fillOpacity={0.6}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	)
}

const TopItemsChart = ({ data, loading, error, onRetry }) => {
	if (loading) return <LoadingSpinner message="Loading top items..." />
	if (error) return <ErrorMessage message={error} onRetry={onRetry} />
	if (!data || data.length === 0)
		return <NoDataMessage message="No items data available" />

	// Calculate max for progress bars
	const maxRevenue = Math.max(...data.map((item) => item.totalRevenue || 0))

	return (
		<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
			{data.map((item, index) => {
				const progress =
					maxRevenue > 0 ? ((item.totalRevenue || 0) / maxRevenue) * 100 : 0

				return (
					<motion.div
						key={item.menuItemId || index}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.05 }}
						className="flex items-center gap-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 transition-all border border-white/5"
					>
						<span className="text-lg font-bold text-blue-400 w-8 flex-shrink-0">
							#{index + 1}
						</span>
						<div className="flex-1 min-w-0">
							<p className="text-white font-medium truncate">
								{item.menuItemName || 'Unknown Item'}
							</p>
							<div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
								<span>Qty: {formatNumber(item.totalQuantity)}</span>
								<span>Orders: {formatNumber(item.orderCount)}</span>
							</div>
							<div className="w-full bg-[#1A202C] rounded-full h-2 mt-2 overflow-hidden">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.5, delay: index * 0.05 }}
									className="h-full rounded-full"
									style={{
										background: `linear-gradient(90deg, ${CHART_COLORS.primary}, ${CHART_COLORS.purple})`,
									}}
								/>
							</div>
						</div>
						<div className="text-right flex-shrink-0">
							<p className="text-green-400 font-bold">
								{formatCurrency(item.totalRevenue)}
							</p>
							<p className="text-xs text-gray-500">
								Avg: {formatCurrency(item.averagePrice)}
							</p>
						</div>
					</motion.div>
				)
			})}
		</div>
	)
}

const DailyOrdersChart = ({ data, loading, error, onRetry }) => {
	if (loading) return <LoadingSpinner message="Loading daily orders..." />
	if (error) return <ErrorMessage message={error} onRetry={onRetry} />
	if (!data || data.length === 0)
		return <NoDataMessage message="No orders data available" />

	return (
		<div className="h-[300px]">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
					<XAxis
						dataKey="date"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 11 }}
						tickLine={false}
						tickFormatter={(value) => {
							const date = new Date(value)
							return `${date.getDate()}/${date.getMonth() + 1}`
						}}
					/>
					<YAxis
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 12 }}
						tickLine={false}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'rgba(31, 41, 55, 0.9)',
							backdropFilter: 'blur(12px)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '8px',
							color: '#fff',
						}}
						formatter={(value, name) => [
							name === 'totalRevenue' ? formatCurrency(value) : formatNumber(value),
							name === 'orderCount' ? 'Orders' : 'Revenue',
						]}
						labelFormatter={(label) => formatDate(label)}
					/>
					<Legend />
					<Line
						type="monotone"
						dataKey="orderCount"
						name="Orders"
						stroke={CHART_COLORS.primary}
						strokeWidth={2}
						strokeOpacity={0.8}
						dot={{ r: 3, fill: CHART_COLORS.primary, fillOpacity: 0.6 }}
						activeDot={{ r: 5, fill: CHART_COLORS.primary, fillOpacity: 1 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	)
}

const PeakHoursChart = ({ data, loading, error, onRetry }) => {
	if (loading) return <LoadingSpinner message="Loading peak hours..." />
	if (error) return <ErrorMessage message={error} onRetry={onRetry} />
	if (!data || data.length === 0)
		return <NoDataMessage message="No peak hours data available" />

	return (
		<div className="h-[300px]">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
					<XAxis
						dataKey="hourLabel"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 10 }}
						tickLine={false}
						interval={2}
					/>
					<YAxis
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 12 }}
						tickLine={false}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'rgba(31, 41, 55, 0.9)',
							backdropFilter: 'blur(12px)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '8px',
							color: '#fff',
						}}
						formatter={(value) => [formatNumber(value), 'Orders']}
						labelFormatter={(label) => `Time: ${label}`}
					/>
					<Bar
						dataKey="orderCount"
						name="Orders"
						fill={CHART_COLORS.primary}
						fillOpacity={0.7}
						radius={[4, 4, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}

const PopularItemsTrend = ({ data, loading, error, onRetry }) => {
	if (loading) return <LoadingSpinner message="Loading popular items..." />
	if (error) return <ErrorMessage message={error} onRetry={onRetry} />
	if (!data || data.length === 0)
		return <NoDataMessage message="No popular items data available" />

	const colors = [
		CHART_COLORS.primary,
		CHART_COLORS.secondary,
		CHART_COLORS.tertiary,
		CHART_COLORS.purple,
		CHART_COLORS.pink,
	]

	return (
		<div className="space-y-4">
			{data.map((item, index) => (
				<div
					key={item.menuItemId || index}
					className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5"
				>
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-full flex-shrink-0"
								style={{ backgroundColor: colors[index % colors.length] }}
							/>
							<span className="text-white font-medium truncate">{item.menuItemName}</span>
						</div>
						<span className="text-gray-400 text-sm flex-shrink-0">
							Total: {formatNumber(item.totalQuantity)} units
						</span>
					</div>
					{item.dailyData && item.dailyData.length > 0 && (
						<div className="h-[60px]">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={item.dailyData}>
									<Area
										type="monotone"
										dataKey="quantity"
										stroke={colors[index % colors.length]}
										fill={colors[index % colors.length]}
										fillOpacity={0.2}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>
			))}
		</div>
	)
}

// ==================== SECTION COMPONENTS ====================

const ChartSection = ({ title, subtitle, children, actions, className = '' }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		className={`bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 ${className}`}
	>
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
			<div>
				<h2 className="text-xl font-bold text-white">{title}</h2>
				{subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
		</div>
		{children}
	</motion.div>
)

// ==================== MAIN COMPONENT ====================

const Reports = () => {
	const { user } = useUser()

	// Get tenant ID from user context
	const tenantId = useMemo(() => {
		return user?.ownerId || localStorage.getItem('currentTenantId') || null
	}, [user])

	// =============== STATE ===============

	// Revenue Report State
	const [revenueTimeRange, setRevenueTimeRange] = useState(TIME_RANGE.DAILY)
	const [revenueCustomStart, setRevenueCustomStart] = useState('')
	const [revenueCustomEnd, setRevenueCustomEnd] = useState('')
	const [revenueData, setRevenueData] = useState(null)
	const [revenueLoading, setRevenueLoading] = useState(false)
	const [revenueError, setRevenueError] = useState(null)

	// Top Items Report State
	const [topItemsLimit, setTopItemsLimit] = useState(10)
	const [topItemsStartDate, setTopItemsStartDate] = useState('')
	const [topItemsEndDate, setTopItemsEndDate] = useState('')
	const [topItemsData, setTopItemsData] = useState(null)
	const [topItemsLoading, setTopItemsLoading] = useState(false)
	const [topItemsError, setTopItemsError] = useState(null)

	// Analytics Report State
	const [analyticsStartDate, setAnalyticsStartDate] = useState('')
	const [analyticsEndDate, setAnalyticsEndDate] = useState('')
	const [analyticsData, setAnalyticsData] = useState(null)
	const [analyticsLoading, setAnalyticsLoading] = useState(false)
	const [analyticsError, setAnalyticsError] = useState(null)

	// Global State
	const [lastRefresh, setLastRefresh] = useState(new Date())
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [initialLoadDone, setInitialLoadDone] = useState(false)

	// Refs for debouncing and preventing duplicate calls
	const fetchTimeoutRefs = useRef({
		revenue: null,
		topItems: null,
		analytics: null,
	})
	const abortControllersRef = useRef({
		revenue: null,
		topItems: null,
		analytics: null,
	})

	// Request queue to prevent rate limiting (5 API/s limit)
	const requestQueueRef = useRef([])
	const isProcessingQueueRef = useRef(false)
	const lastRequestTimeRef = useRef(0)
	const MIN_REQUEST_INTERVAL = 250 // ms between requests (allows max ~4 requests/sec)

	// =============== DEBOUNCE HELPER ===============
	const DEBOUNCE_DELAY = 1200 // ms - increased to reduce rapid API calls

	// Process request queue with rate limiting
	const processRequestQueue = useCallback(async () => {
		if (isProcessingQueueRef.current || requestQueueRef.current.length === 0) return

		isProcessingQueueRef.current = true

		while (requestQueueRef.current.length > 0) {
			const timeSinceLastRequest = Date.now() - lastRequestTimeRef.current
			const waitTime = Math.max(0, MIN_REQUEST_INTERVAL - timeSinceLastRequest)

			if (waitTime > 0) {
				await new Promise((resolve) => setTimeout(resolve, waitTime))
			}

			const fetchFn = requestQueueRef.current.shift()
			if (fetchFn) {
				lastRequestTimeRef.current = Date.now()
				try {
					await fetchFn()
				} catch (error) {
					console.error('Queue request error:', error)
				}
			}
		}

		isProcessingQueueRef.current = false
	}, [])

	// Add request to queue with rate limiting
	const queueRequest = useCallback(
		(fetchFn) => {
			requestQueueRef.current.push(fetchFn)
			processRequestQueue()
		},
		[processRequestQueue],
	)

	const debouncedFetch = useCallback(
		(key, fetchFn) => {
			// Clear existing timeout
			if (fetchTimeoutRefs.current[key]) {
				clearTimeout(fetchTimeoutRefs.current[key])
			}

			// Set new timeout with queue
			fetchTimeoutRefs.current[key] = setTimeout(() => {
				queueRequest(fetchFn)
			}, DEBOUNCE_DELAY)
		},
		[queueRequest],
	)

	// =============== FETCH FUNCTIONS ===============

	const fetchRevenueReport = useCallback(
		async (useCache = true) => {
			if (!tenantId) return

			setRevenueLoading(true)
			setRevenueError(null)

			try {
				const params = {
					tenantId,
					timeRange: revenueTimeRange,
					useCache,
				}

				if (revenueTimeRange === TIME_RANGE.CUSTOM) {
					if (!revenueCustomStart || !revenueCustomEnd) {
						setRevenueError('Please select start and end dates for custom range')
						setRevenueLoading(false)
						return
					}
					params.startDate = revenueCustomStart
					params.endDate = revenueCustomEnd
				}

				const response = await getRevenueReportAPI(params)

				if (response.code === 1000 && response.data) {
					setRevenueData(response.data)
				} else {
					setRevenueError(response.message || 'Failed to load revenue report')
				}
			} catch (error) {
				console.error('Revenue report error:', error)
				setRevenueError(
					error.response?.data?.message ||
						error.message ||
						'Failed to load revenue report',
				)
			} finally {
				setRevenueLoading(false)
			}
		},
		[tenantId, revenueTimeRange, revenueCustomStart, revenueCustomEnd],
	)

	const fetchTopItemsReport = useCallback(
		async (useCache = true) => {
			if (!tenantId) return

			setTopItemsLoading(true)
			setTopItemsError(null)

			try {
				const params = {
					tenantId,
					limit: topItemsLimit,
					useCache,
				}

				if (topItemsStartDate) params.startDate = topItemsStartDate
				if (topItemsEndDate) params.endDate = topItemsEndDate

				const response = await getTopItemsReportAPI(params)

				if (response.code === 1000 && response.data) {
					setTopItemsData(response.data)
				} else {
					setTopItemsError(response.message || 'Failed to load top items report')
				}
			} catch (error) {
				console.error('Top items report error:', error)
				setTopItemsError(
					error.response?.data?.message ||
						error.message ||
						'Failed to load top items report',
				)
			} finally {
				setTopItemsLoading(false)
			}
		},
		[tenantId, topItemsLimit, topItemsStartDate, topItemsEndDate],
	)

	const fetchAnalyticsReport = useCallback(
		async (useCache = true) => {
			if (!tenantId) return

			setAnalyticsLoading(true)
			setAnalyticsError(null)

			try {
				const params = {
					tenantId,
					useCache,
				}

				if (analyticsStartDate) params.startDate = analyticsStartDate
				if (analyticsEndDate) params.endDate = analyticsEndDate

				const response = await getAnalyticsReportAPI(params)

				if (response.code === 1000 && response.data) {
					setAnalyticsData(response.data)
				} else {
					setAnalyticsError(response.message || 'Failed to load analytics report')
				}
			} catch (error) {
				console.error('Analytics report error:', error)
				setAnalyticsError(
					error.response?.data?.message ||
						error.message ||
						'Failed to load analytics report',
				)
			} finally {
				setAnalyticsLoading(false)
			}
		},
		[tenantId, analyticsStartDate, analyticsEndDate],
	)

	const handleRefreshAll = useCallback(async () => {
		if (isRefreshing) return // Prevent duplicate calls

		setIsRefreshing(true)
		clearReportCache()

		// Clear any pending debounced fetches and queue
		Object.values(fetchTimeoutRefs.current).forEach((timeout) => {
			if (timeout) clearTimeout(timeout)
		})
		requestQueueRef.current = [] // Clear pending queue

		try {
			// Fetch sequentially with 300ms delays to stay under 5 API/s rate limit
			await fetchRevenueReport(false)
			await new Promise((resolve) => setTimeout(resolve, 300))

			await fetchTopItemsReport(false)
			await new Promise((resolve) => setTimeout(resolve, 300))

			await fetchAnalyticsReport(false)

			setLastRefresh(new Date())
		} catch (error) {
			console.error('Refresh all error:', error)
		} finally {
			setIsRefreshing(false)
		}
	}, [fetchRevenueReport, fetchTopItemsReport, fetchAnalyticsReport, isRefreshing])

	// =============== EFFECTS ===============

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			Object.values(fetchTimeoutRefs.current).forEach((timeout) => {
				if (timeout) clearTimeout(timeout)
			})
		}
	}, [])

	// Initialize date ranges and fetch all data ONCE on mount
	useEffect(() => {
		if (!tenantId || initialLoadDone) return

		const { startDate, endDate } = getDateRangePreset('month')
		setRevenueCustomStart(startDate)
		setRevenueCustomEnd(endDate)
		setTopItemsStartDate(startDate)
		setTopItemsEndDate(endDate)
		setAnalyticsStartDate(startDate)
		setAnalyticsEndDate(endDate)

		// Fetch all reports with staggered timing to avoid rate limiting
		const fetchAllReports = async () => {
			setInitialLoadDone(true)

			// Fetch sequentially with 300ms delays to stay under 5 API/s rate limit
			try {
				// 1. Fetch revenue report first
				setRevenueLoading(true)
				const revenueResponse = await getRevenueReportAPI({
					tenantId,
					timeRange: revenueTimeRange,
					useCache: true,
				})
				if (revenueResponse.code === 1000 && revenueResponse.data) {
					setRevenueData(revenueResponse.data)
				}
				setRevenueLoading(false)

				// 300ms delay before next request (max ~3 requests/sec to be safe)
				await new Promise((resolve) => setTimeout(resolve, 300))

				// 2. Fetch top items report
				setTopItemsLoading(true)
				const topItemsResponse = await getTopItemsReportAPI({
					tenantId,
					limit: topItemsLimit,
					startDate,
					endDate,
					useCache: true,
				})
				if (topItemsResponse.code === 1000 && topItemsResponse.data) {
					setTopItemsData(topItemsResponse.data)
				}
				setTopItemsLoading(false)

				// 300ms delay before next request
				await new Promise((resolve) => setTimeout(resolve, 300))

				// 3. Fetch analytics report
				setAnalyticsLoading(true)
				const analyticsResponse = await getAnalyticsReportAPI({
					tenantId,
					startDate,
					endDate,
					useCache: true,
				})
				if (analyticsResponse.code === 1000 && analyticsResponse.data) {
					setAnalyticsData(analyticsResponse.data)
				}
				setAnalyticsLoading(false)

				setLastRefresh(new Date())
			} catch (error) {
				console.error('Initial load error:', error)
				// Set errors but don't break the whole page
				if (!revenueData) setRevenueError('Failed to load revenue report')
				if (!topItemsData) setTopItemsError('Failed to load top items report')
				if (!analyticsData) setAnalyticsError('Failed to load analytics report')
			}
		}

		fetchAllReports()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId])

	// Debounced fetch for revenue report when params change (after initial load)
	useEffect(() => {
		if (!initialLoadDone || !tenantId) return
		debouncedFetch('revenue', () => fetchRevenueReport())
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [revenueTimeRange, revenueCustomStart, revenueCustomEnd])

	// Debounced fetch for top items report when params change (after initial load)
	useEffect(() => {
		if (!initialLoadDone || !tenantId) return
		debouncedFetch('topItems', () => fetchTopItemsReport())
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [topItemsLimit, topItemsStartDate, topItemsEndDate])

	// Debounced fetch for analytics report when params change (after initial load)
	useEffect(() => {
		if (!initialLoadDone || !tenantId) return
		debouncedFetch('analytics', () => fetchAnalyticsReport())
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [analyticsStartDate, analyticsEndDate])

	// =============== HANDLERS ===============

	const handleDatePresetSelect = useCallback((preset, target) => {
		const { startDate, endDate } = getDateRangePreset(preset)

		if (target === 'revenue') {
			setRevenueCustomStart(startDate)
			setRevenueCustomEnd(endDate)
		} else if (target === 'topItems') {
			setTopItemsStartDate(startDate)
			setTopItemsEndDate(endDate)
		} else if (target === 'analytics') {
			setAnalyticsStartDate(startDate)
			setAnalyticsEndDate(endDate)
		}
	}, [])

	// =============== RENDER ===============

	// Show error if no tenant ID
	if (!tenantId) {
		return (
			<BasePageLayout title="Report Dashboard">
				<div className="flex flex-col items-center justify-center h-[60vh]">
					<span className="material-symbols-outlined text-red-500 text-6xl mb-4">
						error
					</span>
					<h2 className="text-white text-xl font-bold mb-2">No Tenant Selected</h2>
					<p className="text-gray-400">
						Please login with a valid tenant account to view reports.
					</p>
				</div>
			</BasePageLayout>
		)
	}

	return (
		<BasePageLayout title="Report Dashboard">
			{/* Header with Refresh Button */}
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Report Dashboard</h1>
					<p className="text-gray-400 text-sm mt-1">
						Comprehensive analytics and insights for your restaurant
					</p>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-gray-500 text-xs">
						Last updated: {lastRefresh.toLocaleTimeString()}
					</span>
					<button
						onClick={handleRefreshAll}
						disabled={isRefreshing}
						className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors ${
							isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						<span
							className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}
						>
							refresh
						</span>
						{isRefreshing ? 'Refreshing...' : 'Refresh All'}
					</button>
				</div>
			</div>

			{/* Summary Cards */}
			{analyticsData?.summary && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					<SummaryCard
						icon="payments"
						label="Total Revenue"
						value={formatCurrency(analyticsData.summary.totalRevenue)}
						subValue={`Currency: ${analyticsData.summary.currency || 'USD'}`}
						color="green"
					/>
					<SummaryCard
						icon="receipt_long"
						label="Total Orders"
						value={formatNumber(analyticsData.summary.totalOrders)}
						subValue={`Avg: ${formatCurrency(analyticsData.summary.averageOrderValue)}/order`}
						color="blue"
					/>
					<SummaryCard
						icon="schedule"
						label="Peak Hour"
						value={analyticsData.summary.peakHour?.hourLabel || 'N/A'}
						subValue={`${formatNumber(analyticsData.summary.peakHour?.orderCount || 0)} orders`}
						color="amber"
					/>
					<SummaryCard
						icon="calendar_today"
						label="Busiest Day"
						value={analyticsData.summary.busiestDay?.dayOfWeek || 'N/A'}
						subValue={`${formatNumber(analyticsData.summary.busiestDay?.orderCount || 0)} orders`}
						color="purple"
					/>
				</div>
			)}

			{/* Revenue Report Section */}
			<ChartSection
				title="📈 Revenue Report"
				subtitle="Track your revenue trends over time"
				className="mb-6"
				actions={
					<TimeRangeSelector
						value={revenueTimeRange}
						onChange={setRevenueTimeRange}
						disabled={revenueLoading}
					/>
				}
			>
				{revenueTimeRange === TIME_RANGE.CUSTOM && (
					<div className="mb-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5">
						<div className="flex flex-col sm:flex-row sm:items-center gap-4">
							<DateRangeFilter
								startDate={revenueCustomStart}
								endDate={revenueCustomEnd}
								onStartChange={setRevenueCustomStart}
								onEndChange={setRevenueCustomEnd}
								disabled={revenueLoading}
							/>
							<DatePresetButtons
								onSelect={(preset) => handleDatePresetSelect(preset, 'revenue')}
								disabled={revenueLoading}
							/>
						</div>
					</div>
				)}

				{/* Revenue Summary */}
				{revenueData?.summary && (
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
						<div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
							<p className="text-gray-400 text-xs mb-1">Total Revenue</p>
							<p className="text-green-400 font-bold">
								{formatCurrency(revenueData.summary.totalRevenue)}
							</p>
						</div>
						<div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
							<p className="text-gray-400 text-xs mb-1">Total Orders</p>
							<p className="text-blue-400 font-bold">
								{formatNumber(revenueData.summary.totalOrders)}
							</p>
						</div>
						<div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
							<p className="text-gray-400 text-xs mb-1">Avg Order Value</p>
							<p className="text-amber-400 font-bold">
								{formatCurrency(revenueData.summary.averageOrderValue)}
							</p>
						</div>
						<div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
							<p className="text-gray-400 text-xs mb-1">Time Range</p>
							<p className="text-purple-400 font-bold">
								{revenueData.summary.timeRange || revenueTimeRange}
							</p>
						</div>
					</div>
				)}

				<RevenueChart
					data={revenueData?.data || []}
					loading={revenueLoading}
					error={revenueError}
					onRetry={() => fetchRevenueReport(false)}
				/>
			</ChartSection>

			{/* Two Column Layout for Top Items and Popular Items */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				{/* Top Revenue Items */}
				<ChartSection
					title="🏆 Top Revenue Items"
					subtitle="Best performing menu items by revenue"
					actions={
						<LimitSelector
							value={topItemsLimit}
							onChange={setTopItemsLimit}
							disabled={topItemsLoading}
						/>
					}
				>
					<div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5">
						<DatePresetButtons
							onSelect={(preset) => handleDatePresetSelect(preset, 'topItems')}
							disabled={topItemsLoading}
						/>
					</div>

					{/* Top Items Summary */}
					{topItemsData?.summary && (
						<div className="grid grid-cols-3 gap-2 mb-4">
							<div className="p-2 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
								<p className="text-gray-400 text-xs">Items</p>
								<p className="text-white font-bold">{topItemsData.summary.totalItems}</p>
							</div>
							<div className="p-2 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
								<p className="text-gray-400 text-xs">Total Qty</p>
								<p className="text-white font-bold">
									{formatNumber(topItemsData.summary.totalQuantity)}
								</p>
							</div>
							<div className="p-2 bg-white/5 backdrop-blur-sm rounded-lg text-center border border-white/5">
								<p className="text-gray-400 text-xs">Revenue</p>
								<p className="text-green-400 font-bold text-xs">
									{formatCurrency(topItemsData.summary.totalRevenue)}
								</p>
							</div>
						</div>
					)}

					<TopItemsChart
						data={topItemsData?.topItems || []}
						loading={topItemsLoading}
						error={topItemsError}
						onRetry={() => fetchTopItemsReport(false)}
					/>
				</ChartSection>

				{/* Popular Items Trend */}
				<ChartSection
					title="📊 Popular Items Trend"
					subtitle="Top 5 items with sales trends"
				>
					<div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5">
						<DatePresetButtons
							onSelect={(preset) => handleDatePresetSelect(preset, 'analytics')}
							disabled={analyticsLoading}
						/>
					</div>
					<PopularItemsTrend
						data={analyticsData?.popularItems || []}
						loading={analyticsLoading}
						error={analyticsError}
						onRetry={() => fetchAnalyticsReport(false)}
					/>
				</ChartSection>
			</div>

			{/* Daily Orders and Peak Hours - Two Column */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				{/* Daily Orders Trend */}
				<ChartSection
					title="📅 Daily Orders Trend"
					subtitle="Order volume over the last 30 days"
				>
					<DailyOrdersChart
						data={analyticsData?.dailyOrders || []}
						loading={analyticsLoading}
						error={analyticsError}
						onRetry={() => fetchAnalyticsReport(false)}
					/>
				</ChartSection>

				{/* Peak Hours */}
				<ChartSection
					title="⏰ Peak Hours Analysis"
					subtitle="Order distribution by hour of day"
				>
					<PeakHoursChart
						data={analyticsData?.peakHours || []}
						loading={analyticsLoading}
						error={analyticsError}
						onRetry={() => fetchAnalyticsReport(false)}
					/>
				</ChartSection>
			</div>

			{/* Footer */}
			<div className="mt-6 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm">
						<span className="material-symbols-outlined text-lg">info</span>
						<span>
							Data is cached for 5 minutes. Click "Refresh All" to get the latest data.
						</span>
					</div>
					<div className="flex items-center gap-4 text-xs text-gray-500">
						<span>Currency: USD</span>
						<span>•</span>
						<span>Tenant ID: {tenantId?.substring(0, 8)}...</span>
					</div>
				</div>
			</div>

			{/* Custom Scrollbar Styles */}
			<style>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #1A202C;
					border-radius: 3px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #4A5568;
					border-radius: 3px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #718096;
				}
			`}</style>
		</BasePageLayout>
	)
}

export default Reports
