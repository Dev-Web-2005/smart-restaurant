import React from 'react'
import PropTypes from 'prop-types'

/**
 * KitchenStats Component
 *
 * Displays kitchen performance statistics and KPIs
 * Shows active tickets, average prep time, completion rate, etc.
 */
const KitchenStats = ({ stats, className = '' }) => {
	if (!stats) {
		return (
			<div className={`bg-white rounded-lg shadow p-6 ${className}`}>
				<div className="text-gray-500 text-center">Loading statistics...</div>
			</div>
		)
	}

	const statCards = [
		{
			title: 'Active Tickets',
			value: stats.activeTickets || 0,
			icon: '📋',
			color: 'bg-blue-100 text-blue-700',
			description: 'Currently cooking',
		},
		{
			title: 'Ready to Serve',
			value: stats.readyTickets || 0,
			icon: '✅',
			color: 'bg-green-100 text-green-700',
			description: 'Waiting for pickup',
		},
		{
			title: 'Avg Prep Time',
			value: stats.averagePrepTime ? `${Math.round(stats.averagePrepTime / 60)}m` : 'N/A',
			icon: '⏱️',
			color: 'bg-yellow-100 text-yellow-700',
			description: 'Time to ready',
		},
		{
			title: 'Completed Today',
			value: stats.completedToday || 0,
			icon: '🎯',
			color: 'bg-purple-100 text-purple-700',
			description: 'Tickets bumped',
		},
	]

	const performanceMetrics = [
		{
			label: 'On-Time Rate',
			value: stats.onTimeRate || 0,
			target: 95,
			unit: '%',
			color: (stats.onTimeRate || 0) >= 95 ? 'text-green-600' : 'text-red-600',
		},
		{
			label: 'Avg Items/Ticket',
			value: stats.averageItemsPerTicket || 0,
			unit: '',
			color: 'text-blue-600',
		},
		{
			label: 'Peak Time',
			value: stats.peakHour || 'N/A',
			unit: '',
			color: 'text-purple-600',
		},
	]

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Main Stats Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((stat, idx) => (
					<div
						key={idx}
						className={`${stat.color} rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow`}
					>
						<div className="flex items-center justify-between mb-2">
							<span className="text-3xl">{stat.icon}</span>
							<div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
						</div>
						<div className="font-semibold text-sm">{stat.title}</div>
						<div className="text-xs opacity-75 mt-1">{stat.description}</div>
					</div>
				))}
			</div>

			{/* Performance Metrics */}
			<div className="bg-white rounded-lg shadow-md p-4">
				<h3 className="text-lg font-bold mb-3 text-gray-800">📊 Performance</h3>
				<div className="grid grid-cols-3 gap-4">
					{performanceMetrics.map((metric, idx) => (
						<div key={idx} className="text-center">
							<div className={`text-2xl font-bold ${metric.color}`}>
								{metric.value}
								{metric.unit}
								{metric.target && (
									<span className="text-sm text-gray-500 ml-1">
										/ {metric.target}
										{metric.unit}
									</span>
								)}
							</div>
							<div className="text-xs text-gray-600 mt-1">{metric.label}</div>
							{metric.target && (
								<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
									<div
										className={`h-2 rounded-full ${
											metric.value >= metric.target ? 'bg-green-500' : 'bg-red-500'
										}`}
										style={{
											width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
										}}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Status Breakdown */}
			{stats.statusBreakdown && (
				<div className="bg-white rounded-lg shadow-md p-4">
					<h3 className="text-lg font-bold mb-3 text-gray-800">📈 Ticket Status</h3>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
						{Object.entries(stats.statusBreakdown).map(([status, count]) => (
							<div key={status} className="text-center p-2 bg-gray-50 rounded">
								<div className="text-xl font-bold text-gray-700">{count}</div>
								<div className="text-xs text-gray-500">{status}</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Priority Breakdown */}
			{stats.priorityBreakdown && (
				<div className="bg-white rounded-lg shadow-md p-4">
					<h3 className="text-lg font-bold mb-3 text-gray-800">🔥 Priority Levels</h3>
					<div className="flex gap-3">
						{stats.priorityBreakdown.fire > 0 && (
							<div className="flex-1 text-center p-2 bg-red-100 rounded">
								<div className="text-2xl font-bold text-red-700">
									{stats.priorityBreakdown.fire}
								</div>
								<div className="text-xs text-red-600">🔥 FIRE</div>
							</div>
						)}
						{stats.priorityBreakdown.urgent > 0 && (
							<div className="flex-1 text-center p-2 bg-orange-100 rounded">
								<div className="text-2xl font-bold text-orange-700">
									{stats.priorityBreakdown.urgent}
								</div>
								<div className="text-xs text-orange-600">⚡ URGENT</div>
							</div>
						)}
						{stats.priorityBreakdown.high > 0 && (
							<div className="flex-1 text-center p-2 bg-yellow-100 rounded">
								<div className="text-2xl font-bold text-yellow-700">
									{stats.priorityBreakdown.high}
								</div>
								<div className="text-xs text-yellow-600">⬆️ HIGH</div>
							</div>
						)}
						{stats.priorityBreakdown.normal > 0 && (
							<div className="flex-1 text-center p-2 bg-gray-100 rounded">
								<div className="text-2xl font-bold text-gray-700">
									{stats.priorityBreakdown.normal}
								</div>
								<div className="text-xs text-gray-600">📋 NORMAL</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

KitchenStats.propTypes = {
	stats: PropTypes.shape({
		activeTickets: PropTypes.number,
		readyTickets: PropTypes.number,
		completedToday: PropTypes.number,
		averagePrepTime: PropTypes.number,
		onTimeRate: PropTypes.number,
		averageItemsPerTicket: PropTypes.number,
		peakHour: PropTypes.string,
		statusBreakdown: PropTypes.object,
		priorityBreakdown: PropTypes.object,
	}),
	className: PropTypes.string,
}

export default KitchenStats
