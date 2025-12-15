import React, { useState, useEffect, useCallback } from 'react'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { saveTableLayoutAPI } from '../../../services/api/tableAPI'

// --- Dữ liệu Mock cho các bàn với vị trí grid (x, y) ---
// 🚨 Dùng let thay vì const để có thể thay đổi trong các hàm
let rawTablesData = [
	// Tầng 1 (Page 1) - với vị trí grid
	{ id: 101, status: 'Occupied', floor: 1, name: 'Table 101', gridX: 0, gridY: 0 },
	{ id: 102, status: 'Available', floor: 1, name: 'Table 102', gridX: 1, gridY: 0 },
	{ id: 103, status: 'Available', floor: 1, name: 'Table 103', gridX: 2, gridY: 0 },
	{ id: 104, status: 'Cleaning', floor: 1, name: 'Table 104', gridX: 0, gridY: 1 },
	{ id: 105, status: 'Available', floor: 1, name: 'Table 105', gridX: 1, gridY: 1 },
	{ id: 106, status: 'Available', floor: 1, name: 'Table 106', gridX: 2, gridY: 1 },
	{ id: 107, status: 'Occupied', floor: 1, name: 'Table 107', gridX: 0, gridY: 2 },
	{ id: 108, status: 'Available', floor: 1, name: 'Table 108', gridX: 1, gridY: 2 },
	{ id: 109, status: 'Available', floor: 1, name: 'Table 109', gridX: 2, gridY: 2 },
	{ id: 110, status: 'Available', floor: 1, name: 'Table 110', gridX: 3, gridY: 2 },
	// Tầng 2 (Page 2)
	{ id: 201, status: 'Available', floor: 2, name: 'Table 201', gridX: 0, gridY: 0 },
	{ id: 202, status: 'Occupied', floor: 2, name: 'Table 202', gridX: 1, gridY: 0 },
	{ id: 203, status: 'Cleaning', floor: 2, name: 'Table 203', gridX: 0, gridY: 1 },
	{ id: 204, status: 'Available', floor: 2, name: 'Table 204', gridX: 1, gridY: 1 },
	{ id: 205, status: 'Available', floor: 2, name: 'Table 205', gridX: 2, gridY: 1 },
]
// --- Kết thúc Mock Data ---

// Định nghĩa màu dựa trên trạng thái
const getStatusColor = (status) => {
	switch (status) {
		case 'Occupied':
			return 'bg-red-600/30 border-red-600/50'
		case 'Cleaning':
			return 'bg-yellow-600/30 border-yellow-600/50'
		default:
			return 'bg-green-600/30 border-green-600/50'
	}
}

// --- Sub-component: Table Card (Draggable) ---
const TableCard = ({ table, onClick, onDelete, onDragStart, onDragEnd, isDragging }) => {
	const cardColorClass = getStatusColor(table.status)
	const [isHovered, setIsHovered] = useState(false)

	const handleDragStart = (e) => {
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/plain', table.id)
		onDragStart(table)
	}

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`relative flex flex-col items-center justify-center aspect-square text-white transition-all cursor-move rounded-xl bg-black/40 backdrop-blur-md hover:bg-black/60 border-2 border-transparent hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#137fec] ${
				isDragging ? 'opacity-50' : ''
			}`}
			style={{ padding: 'clamp(4px, 3%, 24px)' }}
		>
			{isHovered && table.status === 'Available' && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete(table.id)
					}}
					className="absolute rounded-full bg-red-600/70 hover:bg-red-700 text-white flex items-center justify-center z-10 transition-opacity"
					style={{
						top: 'clamp(2px, 2%, 8px)',
						right: 'clamp(2px, 2%, 8px)',
						width: 'clamp(16px, 15%, 32px)',
						height: 'clamp(16px, 15%, 32px)',
						fontSize: 'clamp(10px, 2.5vw, 16px)',
					}}
					title="Delete Table"
				>
					✕
				</button>
			)}

			<button
				onClick={() => onClick(table)}
				className="w-full h-full flex flex-col items-center justify-center gap-1 overflow-hidden"
			>
				<div
					className={`rounded-full flex items-center justify-center ${cardColorClass}`}
					style={{
						width: 'clamp(24px, 40%, 64px)',
						height: 'clamp(24px, 40%, 64px)',
						minWidth: '24px',
						minHeight: '24px',
					}}
				>
					<span
						className="inline-flex items-center justify-center"
						style={{
							fontSize: 'clamp(16px, min(5vw, 5vh), 40px)',
							lineHeight: 1,
						}}
					>
						🍽️
					</span>
				</div>

				<h3
					className="font-bold leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full px-1"
					style={{
						fontSize: 'clamp(10px, min(2.5vw, 2.5vh), 20px)',
						marginTop: 'clamp(2px, 2%, 8px)',
					}}
				>
					{table.id}
				</h3>
				<p
					className="text-gray-300 leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full px-1"
					style={{
						fontSize: 'clamp(8px, min(1.8vw, 1.8vh), 14px)',
						marginTop: 'clamp(1px, 1%, 4px)',
					}}
				>
					{table.status}
				</p>
			</button>
		</div>
	)
}
// --- Sub-component: Empty Grid Cell (Drop Target) ---
const EmptyGridCell = ({ gridX, gridY, onDrop, onDragOver, isDropTarget }) => {
	const handleDragOver = (e) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		onDragOver(gridX, gridY)
	}

	const handleDrop = (e) => {
		e.preventDefault()
		onDrop(gridX, gridY)
	}

	return (
		<div
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className={`aspect-square border-2 border-dashed rounded-xl transition-all ${
				isDropTarget
					? 'border-blue-500 bg-blue-500/10'
					: 'border-[#2D3748] bg-[#1A202C]/30'
			}`}
		/>
	)
}

// --- Sub-component: Add Table Quick Card ---
const AddTableQuickCard = ({ onClick }) => (
	<button
		onClick={onClick}
		className="flex flex-col items-center justify-center aspect-square w-full rounded-xl p-6 text-center transition-all duration-200 bg-black/30 backdrop-blur-md border-2 border-dashed border-white/20 hover:bg-black/50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
	>
		<span className="text-7xl text-[#137fec] opacity-90 mb-2">+</span>
	</button>
)

// --- Modal quản lý trạng thái bàn ---
const TableStatusModal = ({ isOpen, onClose, table, onUpdateStatus }) => {
	if (!isOpen || !table) return null

	const statuses = ['Available', 'Occupied', 'Cleaning']

	const getStatusButtonClass = (status) => {
		const baseClasses =
			'w-full h-12 px-4 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

		if (table.status === status) {
			return `${baseClasses} bg-[#137fec] text-white`
		}
		return `${baseClasses} bg-black/30 backdrop-blur-md text-gray-300 hover:bg-black/50`
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="bg-black/80 backdrop-blur-md p-6 rounded-xl w-full max-w-sm shadow-2xl border border-white/10">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-xl font-bold text-white">Table {table.id}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						✕
					</button>
				</div>

				<div className="mb-6">
					<p className="text-sm text-gray-300">
						Current Status:{' '}
						<span
							className={`font-semibold ${
								table.status === 'Available'
									? 'text-green-500'
									: table.status === 'Occupied'
									? 'text-red-500'
									: 'text-yellow-500'
							}`}
						>
							{table.status}
						</span>
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<p className="text-sm text-gray-300 mb-2">Change Status:</p>
					{statuses.map((status) => (
						<button
							key={status}
							onClick={() => onUpdateStatus(table.id, status)}
							disabled={table.status === status}
							className={getStatusButtonClass(status)}
						>
							Set to {status}
						</button>
					))}
				</div>

				<div className="flex justify-end mt-6">
					<button
						onClick={onClose}
						className="h-10 px-4 rounded-lg bg-black/40 backdrop-blur-md text-white text-sm font-bold hover:bg-black/60 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

// ====================================================================
// --- Main Component ---
// ====================================================================

const RestaurantTableManagement = () => {
	const [tables, setTables] = useState([])
	const [loading, setLoading] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
	const [selectedTable, setSelectedTable] = useState(null)
	const [draggingTable, setDraggingTable] = useState(null)
	const [dropTarget, setDropTarget] = useState(null)
	// CRITICAL: Set initial grid to 12 columns (max width) x 5 rows as specified
	const [gridSize, setGridSize] = useState({ rows: 5, cols: 12 })
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const currentFloor = currentPage

	// UPDATED: Calculate grid size WITHOUT auto-contraction logic
	// Grid size is now only adjusted manually or on initial load
	// Empty rows/columns are preserved until explicitly deleted by user
	const calculateGridSize = (tablesOnFloor) => {
		if (tablesOnFloor.length === 0) {
			// Return initial grid size when no tables exist
			return { rows: 5, cols: 12 }
		}

		// Find the maximum X and Y positions of all tables
		const maxX = Math.max(...tablesOnFloor.map((t) => t.gridX))
		const maxY = Math.max(...tablesOnFloor.map((t) => t.gridY))

		// CRITICAL: Grid size must be at least maxX+1 and maxY+1 to contain all tables
		// This ensures the grid is large enough, but does NOT shrink automatically
		// Constrain columns to maximum of 12 as per specification
		return {
			cols: Math.min(Math.max(maxX + 1, 1), 12),
			rows: Math.max(maxY + 1, 1),
		}
	}

	const filterTablesByFloor = (floor) => {
		return rawTablesData.filter((table) => table.floor === floor)
	}

	const getNextTableId = (floor) => {
		const tablesOnFloor = rawTablesData.filter((table) => table.floor === floor)

		if (tablesOnFloor.length === 0) {
			return floor * 100 + 1
		}

		const maxId = Math.max(...tablesOnFloor.map((table) => table.id))
		return maxId + 1
	}

	const fetchTables = useCallback(async (page) => {
		// Comment: BẮT ĐẦU: Logic gọi API lấy danh sách bàn theo tầng
		console.log(`Fetching tables for Floor/Page: ${page}`)
		setLoading(true)

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Gửi request tới API /api/tenant/tables?floor=X
        // Expected Request: GET /api/tenant/tables?floor=1
        // Expected Response: { tables: [{ id: 101, status: "Occupied", floor: 1, name: "Table 101", gridX: 0, gridY: 0 }, ...], totalFloors: 3 }
        const response = await axios.get(`/api/tenant/tables?floor=${page}`);
        setTables(response.data.tables);
        setTotalPages(response.data.totalFloors);
        
        const size = calculateGridSize(response.data.tables);
        setGridSize(size);
    } catch (error) {
        console.error("Error fetching tables:", error);
    } finally {
        setLoading(false);
    }
    */

		setTimeout(() => {
			const filteredData = filterTablesByFloor(page)
			const floorsInUse = [...new Set(rawTablesData.map((t) => t.floor))]
			const totalFloors = floorsInUse.length > 0 ? Math.max(...floorsInUse) : 1

			setTables(filteredData)
			setTotalPages(totalFloors)

			// CRITICAL: Recalculate grid size based on actual tables
			const size = calculateGridSize(filteredData)
			setGridSize(size)

			setLoading(false)
		}, 300)
		// Comment: KẾT THÚC: Logic gọi API lấy danh sách bàn
	}, [])

	const handleTableClick = (table) => {
		setSelectedTable(table)
		setIsStatusModalOpen(true)
	}

	const handleStatusUpdate = async (tableId, newStatus) => {
		// Comment: BẮT ĐẦU: Logic gọi API PUT cập nhật trạng thái bàn
		console.log(`Updating table ${tableId} status to ${newStatus}`)

		setTables((prevTables) =>
			prevTables.map((table) =>
				table.id === tableId ? { ...table, status: newStatus } : table,
			),
		)

		const tableIndex = rawTablesData.findIndex((table) => table.id === tableId)
		if (tableIndex !== -1) {
			rawTablesData[tableIndex].status = newStatus
		}

		setIsStatusModalOpen(false)
		setSelectedTable(null)

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // API endpoint: PUT /api/tenant/tables/:id/status
        // Expected Request: PUT /api/tenant/tables/101/status | Body: { status: "Occupied" }
        // Expected Response: 200 OK | Body: { id: 101, status: "Occupied", ... }
        const response = await axios.put(`/api/tenant/tables/${tableId}/status`, {
            status: newStatus
        });

        if (response.status !== 200) {
            throw new Error('Failed to update table status');
        }
    } catch (error) {
        console.error("Error updating table status:", error);
        
        setTables((prevTables) =>
            prevTables.map((table) =>
                table.id === tableId ? { ...table, status: selectedTable?.status } : table
            )
        );
        
        alert(`Failed to update table ${tableId} status. Please try again.`);
    }
    */
		// Comment: KẾT THÚC: Logic gọi API PUT cập nhật trạng thái bàn
	}

	const handleDeleteTable = async (tableId) => {
		if (!window.confirm(`Are you sure you want to delete Table ${tableId}?`)) {
			return
		}

		// Comment: BẮT ĐẦU: Logic gọi API DELETE xóa bàn
		console.log(`Deleting table ${tableId}`)

		const originalTables = tables
		setTables((prevTables) => prevTables.filter((table) => table.id !== tableId))

		rawTablesData = rawTablesData.filter((table) => table.id !== tableId)

		// CRITICAL CHANGE: No longer recalculate/shrink grid after deletion
		// Empty rows/columns are preserved until user manually deletes them
		// Grid size remains unchanged - only manual controls can shrink the grid

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // API endpoint: DELETE /api/tenant/tables/:id
        // Expected Request: DELETE /api/tenant/tables/101
        // Expected Response: 204 No Content
        await axios.delete(`/api/tenant/tables/${tableId}`);

        fetchTables(currentPage);

    } catch (error) {
        console.error("Error deleting table:", error);
        
        setTables(originalTables);
        
        alert(`Failed to delete table ${tableId}. Please try again.`);
    }
    */
		// Comment: KẾT THÚC: Logic gọi API DELETE xóa bàn
	}

	const handleDragStart = (table) => {
		setDraggingTable(table)
	}

	const handleDragOver = (gridX, gridY) => {
		setDropTarget({ gridX, gridY })
	}

	const handleDragEnd = () => {
		setDraggingTable(null)
		setDropTarget(null)
	}

	const handleDrop = async (newGridX, newGridY) => {
		if (!draggingTable) return

		// Comment: BẮT ĐẦU: Logic cập nhật vị trí bàn
		console.log(`Moving table ${draggingTable.id} to position (${newGridX}, ${newGridY})`)

		// Check if position is already occupied by another table
		const isOccupied = tables.some(
			(t) => t.id !== draggingTable.id && t.gridX === newGridX && t.gridY === newGridY,
		)

		if (isOccupied) {
			alert('This position is already occupied!')
			setDraggingTable(null)
			setDropTarget(null)
			return
		}

		// Update table position in state
		const updatedTable = {
			...draggingTable,
			gridX: newGridX,
			gridY: newGridY,
		}

		setTables((prevTables) =>
			prevTables.map((table) => (table.id === draggingTable.id ? updatedTable : table)),
		)

		// Update table position in raw data
		const tableIndex = rawTablesData.findIndex((t) => t.id === draggingTable.id)
		if (tableIndex !== -1) {
			rawTablesData[tableIndex].gridX = newGridX
			rawTablesData[tableIndex].gridY = newGridY
		}

		// CRITICAL AUTO-EXPANSION LOGIC (ONLY):
		// Check if the new position is outside current grid boundaries
		// Grid will EXPAND but will NEVER auto-contract
		const needsExpansion = newGridX >= gridSize.cols || newGridY >= gridSize.rows

		if (needsExpansion) {
			// Expand grid by exactly 1 row or 1 column as needed
			// CONSTRAINT: Columns cannot exceed 12 (max width specification)
			setGridSize({
				cols: Math.min(Math.max(gridSize.cols, newGridX + 1), 12),
				rows: Math.max(gridSize.rows, newGridY + 1),
			})
			console.log('Grid expanded due to table placement outside boundary')
		}
		// REMOVED: Auto-contraction logic
		// Empty rows/columns now persist until user manually deletes them

		setDraggingTable(null)
		setDropTarget(null)
		setHasUnsavedChanges(true) // Mark layout as modified

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // API endpoint: PUT /api/tenant/tables/:id/position
        // Expected Request: PUT /api/tenant/tables/101/position | Body: { gridX: 2, gridY: 1 }
        // Expected Response: 200 OK | Body: { id: 101, gridX: 2, gridY: 1, ... }
        await axios.put(`/api/tenant/tables/${draggingTable.id}/position`, {
            gridX: newGridX,
            gridY: newGridY
        });
    } catch (error) {
        console.error("Error updating table position:", error);
        
        setTables((prevTables) =>
            prevTables.map((table) =>
                table.id === draggingTable.id ? draggingTable : table
            )
        );
        
        alert(`Failed to move table ${draggingTable.id}. Please try again.`);
    }
    */
		// Comment: KẾT THÚC: Logic cập nhật vị trí bàn
	}

	const handleSaveTable = async (newTableData) => {
		// Comment: BẮT ĐẦU: Logic xử lý kết quả sau khi POST thành công
		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: POST /api/tenant/tables | Body: { id: 206, floor: 2, name: "Table 206", status: "Available", gridX: 0, gridY: 0 }
        // Expected Response: 201 Created | Body: { id: 206, floor: 2, name: "Table 206", status: "Available", gridX: 0, gridY: 0 }
        await axios.post('/api/tenant/tables', newTableData);

        rawTablesData.push(newTableData);
        setCurrentPage(newTableData.floor);
    } catch (error) {
        console.error("Error adding table:", error);
        alert("Failed to add table via API.");
    }
    */

		// CRITICAL: Add table to raw data first
		rawTablesData.push(newTableData)

		// Switch to the floor where the table was added
		setCurrentPage(newTableData.floor)

		// Fetch tables to refresh the view and recalculate grid
		fetchTables(newTableData.floor)
		// Comment: KẾT THÚC: Logic xử lý kết quả sau khi POST thành công
	}

	const handleAddTable = () => {
		const floorToAdd = currentPage
		const nextId = getNextTableId(floorToAdd)

		// CRITICAL LOGIC CHECK FOR TABLE CREATION:
		// Find the first available position in the current grid
		let foundPosition = false
		let newGridX = 0
		let newGridY = 0

		// Search through entire grid to find empty position
		for (let y = 0; y < gridSize.rows && !foundPosition; y++) {
			for (let x = 0; x < gridSize.cols && !foundPosition; x++) {
				const isOccupied = tables.some((t) => t.gridX === x && t.gridY === y)
				if (!isOccupied) {
					newGridX = x
					newGridY = y
					foundPosition = true
				}
			}
		}

		// CRITICAL: If no empty position found, add to next available row
		// This ensures the new table will always render correctly
		if (!foundPosition) {
			// Place at the start of a new row
			newGridX = 0
			newGridY = gridSize.rows // This will trigger auto-expansion
		}

		// CRITICAL: Create table payload with validated position
		const payload = {
			id: nextId,
			floor: floorToAdd,
			name: `Table ${nextId}`,
			status: 'Available',
			gridX: newGridX,
			gridY: newGridY,
		}

		console.log('Adding new table:', payload)
		handleSaveTable(payload)
	}

	const handleAddFloor = async () => {
		// Comment: BẮT ĐẦU: Logic thêm tầng mới
		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: POST /api/tenant/floors | Body: { floorNumber: 4, floorName: "Floor 4" }
        // Expected Response: 201 Created | Body: { floorNumber: 4, floorName: "Floor 4" }
        const newFloorNumber = totalPages + 1;
        await axios.post('/api/tenant/floors', {
            floorNumber: newFloorNumber,
            floorName: `Floor ${newFloorNumber}`
        });

        setTotalPages(prev => prev + 1);
        setCurrentPage(newFloorNumber);
        alert(`Floor ${newFloorNumber} added successfully!`);
    } catch (error) {
        console.error("Error adding floor:", error);
        alert("Failed to add new floor via API.");
    }
    */

		const newFloorNumber = totalPages + 1
		setTotalPages(newFloorNumber)
		setCurrentPage(newFloorNumber)
		alert(`Floor ${newFloorNumber} added successfully!`)
		fetchTables(newFloorNumber)
		// Comment: KẾT THÚC: Logic thêm tầng mới
	}

	// ====================================================================
	// SAVE LAYOUT FUNCTION
	// ====================================================================

	const handleSaveLayout = async () => {
		if (!hasUnsavedChanges) {
			alert('No changes to save')
			return
		}

		if (tables.length === 0) {
			alert('No tables to save')
			return
		}

		setIsSaving(true)

		try {
			// Call API to save layout
			const result = await saveTableLayoutAPI(currentFloor, tables, gridSize)

			if (result.success) {
				alert(`✅ Layout saved successfully! Updated ${result.updatedCount} table(s)`)
				setHasUnsavedChanges(false)
			} else {
				alert(`❌ Failed to save layout: ${result.message}`)
			}
		} catch (error) {
			console.error('Error saving layout:', error)
			alert('❌ Network error. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	// ====================================================================
	// MANUAL GRID CONTROL FUNCTIONS
	// ====================================================================

	const handleAddRow = () => {
		// Comment: BẮT ĐẦU: Logic thêm hàng thủ công vào grid
		console.log('Manually adding row to grid')

		const newRows = gridSize.rows + 1
		setGridSize({
			...gridSize,
			rows: newRows,
		})

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: PUT /api/tenant/floors/:floorNumber/grid | Body: { rows: newRows, cols: gridSize.cols }
        // Expected Response: 200 OK | Body: { floorNumber: currentFloor, rows: newRows, cols: gridSize.cols }
        await axios.put(`/api/tenant/floors/${currentFloor}/grid`, {
            rows: newRows,
            cols: gridSize.cols
        });
    } catch (error) {
        console.error("Error updating grid size:", error);
        alert("Failed to update grid size via API.");
    }
    */
		// Comment: KẾT THÚC: Logic thêm hàng thủ công
	}

	const handleDeleteRow = () => {
		// Comment: BẮT ĐẦU: Logic xóa hàng cuối cùng khỏi grid
		console.log('Manually deleting last row from grid')

		if (gridSize.rows <= 1) {
			alert('Cannot delete row. Grid must have at least 1 row.')
			return
		}

		// Check if any tables exist in the last row
		const lastRowIndex = gridSize.rows - 1
		const tablesInLastRow = tables.filter((t) => t.gridY === lastRowIndex)

		if (tablesInLastRow.length > 0) {
			const tableNames = tablesInLastRow.map((t) => t.name).join(', ')
			alert(
				`Cannot delete row. The following tables are in this row: ${tableNames}. Please move or delete them first.`,
			)
			return
		}

		const newRows = gridSize.rows - 1
		setGridSize({
			...gridSize,
			rows: newRows,
		})

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: PUT /api/tenant/floors/:floorNumber/grid | Body: { rows: newRows, cols: gridSize.cols }
        // Expected Response: 200 OK | Body: { floorNumber: currentFloor, rows: newRows, cols: gridSize.cols }
        await axios.put(`/api/tenant/floors/${currentFloor}/grid`, {
            rows: newRows,
            cols: gridSize.cols
        });
    } catch (error) {
        console.error("Error updating grid size:", error);
        alert("Failed to update grid size via API.");
    }
    */
		// Comment: KẾT THÚC: Logic xóa hàng
	}

	const handleAddColumn = () => {
		// Comment: BẮT ĐẦU: Logic thêm cột thủ công vào grid
		console.log('Manually adding column to grid')

		if (gridSize.cols >= 12) {
			alert('Cannot add column. Maximum grid width is 12 columns.')
			return
		}

		const newCols = gridSize.cols + 1
		setGridSize({
			...gridSize,
			cols: newCols,
		})

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: PUT /api/tenant/floors/:floorNumber/grid | Body: { rows: gridSize.rows, cols: newCols }
        // Expected Response: 200 OK | Body: { floorNumber: currentFloor, rows: gridSize.rows, cols: newCols }
        await axios.put(`/api/tenant/floors/${currentFloor}/grid`, {
            rows: gridSize.rows,
            cols: newCols
        });
    } catch (error) {
        console.error("Error updating grid size:", error);
        alert("Failed to update grid size via API.");
    }
    */
		// Comment: KẾT THÚC: Logic thêm cột thủ công
	}

	const handleDeleteColumn = () => {
		// Comment: BẮT ĐẦU: Logic xóa cột cuối cùng khỏi grid
		console.log('Manually deleting last column from grid')

		if (gridSize.cols <= 1) {
			alert('Cannot delete column. Grid must have at least 1 column.')
			return
		}

		// Check if any tables exist in the last column
		const lastColIndex = gridSize.cols - 1
		const tablesInLastCol = tables.filter((t) => t.gridX === lastColIndex)

		if (tablesInLastCol.length > 0) {
			const tableNames = tablesInLastCol.map((t) => t.name).join(', ')
			alert(
				`Cannot delete column. The following tables are in this column: ${tableNames}. Please move or delete them first.`,
			)
			return
		}

		const newCols = gridSize.cols - 1
		setGridSize({
			...gridSize,
			cols: newCols,
		})

		// PHẦN GIAO TIẾP VỚI BACKEND - UNCOMMENT KHI SẴN SÀNG
		/*
    try {
        // Expected Request: PUT /api/tenant/floors/:floorNumber/grid | Body: { rows: gridSize.rows, cols: newCols }
        // Expected Response: 200 OK | Body: { floorNumber: currentFloor, rows: gridSize.rows, cols: newCols }
        await axios.put(`/api/tenant/floors/${currentFloor}/grid`, {
            rows: gridSize.rows,
            cols: newCols
        });
    } catch (error) {
        console.error("Error updating grid size:", error);
        alert("Failed to update grid size via API.");
    }
    */
		// Comment: KẾT THÚC: Logic xóa cột
	}

	// ====================================================================
	// END MANUAL GRID CONTROL FUNCTIONS
	// ====================================================================

	useEffect(() => {
		if (currentPage >= 1) {
			fetchTables(currentPage)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage])

	// Render grid function
	const renderGrid = () => {
		const grid = []

		// Render grid based on current gridSize
		for (let y = 0; y < gridSize.rows; y++) {
			for (let x = 0; x < gridSize.cols; x++) {
				const tableAtPosition = tables.find((t) => t.gridX === x && t.gridY === y)

				if (tableAtPosition) {
					grid.push(
						<TableCard
							key={tableAtPosition.id}
							table={tableAtPosition}
							onClick={handleTableClick}
							onDelete={handleDeleteTable}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							isDragging={draggingTable?.id === tableAtPosition.id}
						/>,
					)
				} else {
					grid.push(
						<EmptyGridCell
							key={`${x}-${y}`}
							gridX={x}
							gridY={y}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							isDropTarget={dropTarget?.gridX === x && dropTarget?.gridY === y}
						/>,
					)
				}
			}
		}

		return grid
	}

	const renderPagination = () => {
		const links = []
		for (let i = 1; i <= totalPages; i++) {
			links.push(
				<button
					key={i}
					onClick={() => setCurrentPage(i)}
					className={`inline-flex items-center justify-center rounded-lg w-10 h-10 text-base transition-colors border-none cursor-pointer ${
						i === currentPage
							? 'bg-[#137fec] text-white'
							: 'bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white'
					}`}
				>
					{i}
				</button>,
			)
		}
		return links
	}

	// Show loading while fetching tables
	if (loading) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center">
				<p className="text-white">Loading tables...</p>
			</div>
		)
	}

	return (
		<BasePageLayout>
			<div className="min-h-screen p-8 text-white">
				<div className="max-w-7xl mx-auto h-full flex flex-col">
					<header className="page-header flex justify-between items-center mb-8">
						<div className="flex flex-col gap-2">
							<h1 className="text-white text-4xl font-black leading-tight tracking-tight">
								Table Management (Floor {currentFloor})
							</h1>
							<p className="text-gray-300 text-base">
								Manage your restaurant's dining tables - Drag to rearrange
							</p>
						</div>
						<div className="flex gap-3">
							<button
								onClick={handleSaveLayout}
								disabled={!hasUnsavedChanges || isSaving}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
									hasUnsavedChanges && !isSaving
										? 'bg-green-600 text-white hover:bg-green-700'
										: 'bg-gray-600 text-gray-300 cursor-not-allowed'
								}`}
								title={hasUnsavedChanges ? 'Save current layout' : 'No changes to save'}
							>
								<span className="text-lg">{isSaving ? '⏳' : '💾'}</span>
								<span className="truncate">
									{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Layout' : 'Saved'}
								</span>
							</button>
							<button
								onClick={handleAddFloor}
								className="flex items-center gap-2 bg-[#137fec] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
								title="Add New Floor"
							>
								<span className="text-xl">+</span>
								<span className="truncate">Add Floor</span>
							</button>
						</div>
					</header>

					{/* Manual Grid Control - Inline Format */}
					<div className="mb-6 flex items-center justify-between">
						<div className="flex items-center gap-6">
							{/* Row Control */}
							<div className="flex items-center gap-2 text-white">
								<span className="text-sm font-medium text-gray-300">Row</span>
								<button
									onClick={handleAddRow}
									className="w-8 h-8 flex items-center justify-center rounded bg-black/40 backdrop-blur-md text-white hover:bg-[#137fec] transition-colors text-lg"
									title="Add Row to Grid"
								>
									+
								</button>
								<button
									onClick={handleDeleteRow}
									disabled={gridSize.rows <= 1}
									className="w-8 h-8 flex items-center justify-center rounded bg-black/40 backdrop-blur-md text-white hover:bg-[#137fec] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
									title="Delete Last Row"
								>
									−
								</button>
							</div>

							{/* Column Control */}
							<div className="flex items-center gap-2 text-white">
								<span className="text-sm font-medium text-gray-300">Column</span>
								<button
									onClick={handleAddColumn}
									disabled={gridSize.cols >= 12}
									className="w-8 h-8 flex items-center justify-center rounded bg-black/40 backdrop-blur-md text-white hover:bg-[#137fec] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
									title="Add Column to Grid (Max 12)"
								>
									+
								</button>
								<button
									onClick={handleDeleteColumn}
									disabled={gridSize.cols <= 1}
									className="w-8 h-8 flex items-center justify-center rounded bg-black/40 backdrop-blur-md text-white hover:bg-[#137fec] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
									title="Delete Last Column"
								>
									−
								</button>
							</div>
						</div>

						{/* Pagination moved here */}
						{totalPages > 1 && (
							<nav className="flex items-center space-x-2">
								<button
									onClick={() => setCurrentPage(currentPage - 1)}
									disabled={currentPage === 1}
									className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									title="Previous Floor"
								>
									←
								</button>
								{renderPagination()}
								<button
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={currentPage === totalPages}
									className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									title="Next Floor"
								>
									→
								</button>
							</nav>
						)}
					</div>

					<div className="flex-1">
						{tables.length > 0 || gridSize.rows > 0 ? (
							<div>
								<div
									className="grid gap-6"
									style={{
										gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
									}}
								>
									{renderGrid()}
								</div>
								<div className="mt-6 max-w-xs">
									<AddTableQuickCard onClick={handleAddTable} />
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-10">
								<p className="text-gray-300 text-center mb-4">
									No tables found on this floor.
								</p>
								<AddTableQuickCard onClick={handleAddTable} />
							</div>
						)}
					</div>
				</div>

				<TableStatusModal
					isOpen={isStatusModalOpen}
					onClose={() => {
						setIsStatusModalOpen(false)
						setSelectedTable(null)
					}}
					table={selectedTable}
					onUpdateStatus={handleStatusUpdate}
				/>
			</div>
		</BasePageLayout>
	)
}

export default RestaurantTableManagement
