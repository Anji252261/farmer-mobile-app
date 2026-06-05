export interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface DashboardMetrics {
  totalItems: number;
  totalCustomers: number;
  totalOrders: number;
  todaySaleAmount: number;
  last7DaysSaleAmount: number;
  topSellingItem: string;
  lowStockItems: LowStockItem[];
}
