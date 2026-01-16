import React from 'react'
import {
	Activity,
	Clock,
	CheckCircle,
	AlertTriangle,
	TrendingUp,
	TrendingDown,
} from 'lucide-react'

/**
 * Kitchen Stats Dashboard
 *
 * Displays real-time kitchen performance metrics
 * Inspired by Toast POS Analytics, Square Dashboard
 */
const KitchenStats = ({ stats }) => {
	if (!stats) return null

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
			{/* Active Tickets */}
			<div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Active</div>
						<div className="text-3xl font-bold text-blue-600">
							{stats.activeCount || 0}
						</div>
					</div>
					<Activity className="text-blue-500" size={32} />
				</div>
			</div>

			{/* Pending */}
			<div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Pending</div>
						<div className="text-3xl font-bold text-gray-600">
							{stats.pendingCount || 0}
						</div>
					</div>
					<Clock className="text-gray-400" size={32} />
				</div>
			</div>

			{/* In Progress */}
			<div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Cooking</div>
						<div className="text-3xl font-bold text-orange-600">
							{stats.inProgressCount || 0}
						</div>
					</div>
					<div className="text-3xl">🍳</div>
				</div>
			</div>

			{/* Ready */}
			<div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Ready</div>
						<div className="text-3xl font-bold text-green-600">
							{stats.readyCount || 0}
						</div>
					</div>
					<CheckCircle className="text-green-500" size={32} />
				</div>
			</div>

			{/* Avg Prep Time */}
			<div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Avg Time</div>
						<div className="text-2xl font-bold text-purple-600">
							{stats.averagePrepTime
								? `${Math.floor(stats.averagePrepTime / 60)}m`
								: '--'}
						</div>
					</div>
					<TrendingUp className="text-purple-500" size={32} />
				</div>
			</div>

			{/* Delayed Tickets */}
			<div
				className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
					stats.delayedCount > 0 ? 'border-red-500' : 'border-gray-300'
				}`}
			>
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-gray-600 font-medium">Delayed</div>
						<div
							className={`text-3xl font-bold ${
								stats.delayedCount > 0 ? 'text-red-600' : 'text-gray-400'
							}`}
						>
							{stats.delayedCount || 0}
						</div>
					</div>
					{stats.delayedCount > 0 ? (
						<AlertTriangle className="text-red-500 animate-pulse" size={32} />
					) : (
						<TrendingDown className="text-gray-300" size={32} />
					)}
				</div>
			</div>
		</div>
	)
}

export default KitchenStats
