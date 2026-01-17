/**
 * Response DTOs for Report Features
 */

/**
 * Revenue data point for a specific time period
 */
export interface RevenueDataPoint {
	period: string; // Date label: "2026-01-17", "Week 3 2026", "Jan 2026"
	date: Date; // Actual date for sorting/filtering
	orderCount: number; // Number of orders in this period
	totalRevenue: number; // Total revenue (sum of all order totals)
	averageOrderValue: number; // Average revenue per order
	currency: string; // Currency code (e.g., "VND")
}

/**
 * Revenue report response
 * Chart-friendly format for Recharts/Chart.js
 */
export class RevenueReportResponseDto {
	/**
	 * Time series data points
	 */
	data: RevenueDataPoint[];

	/**
	 * Summary statistics for the entire period
	 */
	summary: {
		totalRevenue: number;
		totalOrders: number;
		averageOrderValue: number;
		currency: string;
		timeRange: string; // DAILY, WEEKLY, MONTHLY, CUSTOM
		startDate: string;
		endDate: string;
	};

	/**
	 * Metadata for chart rendering
	 */
	metadata: {
		chartType: 'line' | 'bar' | 'area'; // Recommended chart type
		xAxisLabel: string; // "Date", "Week", "Month"
		yAxisLabel: string; // "Revenue (VND)"
		dataKeys: string[]; // ["totalRevenue", "orderCount", "averageOrderValue"]
	};
}

/**
 * Top selling item data
 */
export interface TopItemData {
	menuItemId: string;
	menuItemName: string;
	categoryName?: string;
	totalQuantity: number; // Total units sold
	totalRevenue: number; // Total revenue from this item
	orderCount: number; // Number of orders containing this item
	averagePrice: number; // Average price per unit
	currency: string;
}

/**
 * Top items report response
 * Leaderboard format for analytics dashboard
 */
export class TopItemsReportResponseDto {
	/**
	 * Ranked list of top items by revenue
	 */
	topItems: TopItemData[];

	/**
	 * Summary statistics
	 */
	summary: {
		totalItems: number; // Total unique items in report
		totalRevenue: number; // Sum of revenue from all items
		totalQuantity: number; // Sum of quantities sold
		currency: string;
		dateRange: {
			startDate: string;
			endDate: string;
		};
	};
}

/**
 * Hourly order distribution data
 */
export interface HourlyOrderData {
	hour: number; // 0-23
	hourLabel: string; // "00:00", "13:00", etc.
	orderCount: number;
	totalRevenue: number;
	averageOrderValue: number;
}

/**
 * Daily order trend data
 */
export interface DailyOrderData {
	date: string; // "2026-01-17"
	dayOfWeek: string; // "Monday", "Tuesday", etc.
	orderCount: number;
	totalRevenue: number;
	averageOrderValue: number;
}

/**
 * Popular item trend over time
 */
export interface PopularItemTrend {
	menuItemId: string;
	menuItemName: string;
	dailyData: {
		date: string;
		quantity: number;
		revenue: number;
	}[];
}

/**
 * Analytics report response
 * Comprehensive chart data for dashboard visualizations
 */
export class AnalyticsReportResponseDto {
	/**
	 * Orders per day (time series)
	 */
	dailyOrders: DailyOrderData[];

	/**
	 * Peak hours analysis (24-hour distribution)
	 */
	peakHours: HourlyOrderData[];

	/**
	 * Top 5 popular items with trends
	 */
	popularItems: PopularItemTrend[];

	/**
	 * Summary statistics
	 */
	summary: {
		totalOrders: number;
		totalRevenue: number;
		averageOrderValue: number;
		peakHour: {
			hour: number;
			hourLabel: string;
			orderCount: number;
		};
		busiestDay: {
			date: string;
			dayOfWeek: string;
			orderCount: number;
		};
		currency: string;
		dateRange: {
			startDate: string;
			endDate: string;
		};
	};

	/**
	 * Metadata for chart rendering
	 */
	metadata: {
		charts: {
			dailyOrders: {
				type: 'line' | 'bar';
				xAxisLabel: string;
				yAxisLabel: string;
			};
			peakHours: {
				type: 'bar' | 'radar';
				xAxisLabel: string;
				yAxisLabel: string;
			};
			popularItems: {
				type: 'line' | 'area';
				xAxisLabel: string;
				yAxisLabel: string;
			};
		};
	};
}
