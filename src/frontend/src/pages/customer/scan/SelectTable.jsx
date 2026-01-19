import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../../services/apiClient'

/**
 * Table Selection Page
 * Route: /select-table/:ownerId
 *
 * After customer logs in via restaurant QR (no specific table),
 * they select which table they're sitting at.
 */
const SelectTable = () => {
	const { ownerId } = useParams()
	const navigate = useNavigate()
	const [tables, setTables] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		const fetchTables = async () => {
			try {
				setLoading(true)
				// Fetch available tables for this restaurant (public endpoint)
				const response = await apiClient.get(`/public/tenants/${ownerId}/tables`)

				if (response.data && Array.isArray(response.data)) {
					setTables(response.data)
				} else if (response.data.code === 200 && response.data.data) {
					setTables(response.data.data)
				} else {
					setError('Failed to load tables')
				}
			} catch (err) {
				console.error('Error fetching tables:', err)
				setError('Failed to load tables. Please try again.')
			} finally {
				setLoading(false)
			}
		}

		if (ownerId) {
			fetchTables()
		}
	}, [ownerId])

	const handleTableSelect = (tableNumber) => {
		// Save selected table
		localStorage.setItem('currentTableNumber', tableNumber.toString())
		// Navigate to ordering interface
		navigate(`/tenant/${ownerId}/table/${tableNumber}`)
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
					<h2 className="text-xl font-semibold text-white">Loading tables...</h2>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
				<div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl text-center">
					<div className="text-6xl mb-4">❌</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => navigate('/')}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Go Home
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-12 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-white mb-2">Select Your Table</h1>
					<p className="text-white/90">Choose the table number where you're sitting</p>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{tables.map((table) => (
						<button
							key={table.tableId}
							onClick={() => handleTableSelect(table.tableNumber)}
							className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
						>
							<div className="text-center">
								<div className="text-5xl mb-3">🪑</div>
								<div className="text-2xl font-bold text-gray-800 mb-1">
									Table {table.tableNumber}
								</div>
								{table.tableName && (
									<div className="text-sm text-gray-500">{table.tableName}</div>
								)}
								<div
									className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
										table.status === 'AVAILABLE'
											? 'bg-green-100 text-green-700'
											: table.status === 'OCCUPIED'
												? 'bg-red-100 text-red-700'
												: 'bg-yellow-100 text-yellow-700'
									}`}
								>
									{table.status || 'Available'}
								</div>
							</div>
						</button>
					))}
				</div>

				{tables.length === 0 && (
					<div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-12">
						<div className="text-6xl mb-4">🍽️</div>
						<h2 className="text-2xl font-bold text-white mb-2">No Tables Available</h2>
						<p className="text-white/80">
							Please contact restaurant staff for assistance.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default SelectTable
