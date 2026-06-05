export interface Sale {
  id: string;
  itemId: string;
  ownerId: string;
  customerId?: string;
  customerName?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalPrice: number;
  date: string;
}

export interface SaleLinePayload {
  itemId: string;
  quantity: number;
  totalPrice: number;
  customerId?: string;
  customerName?: string;
  unitPrice?: number;
  date?: string;
}

export interface SaleBulkPayload {
  customerId?: string;
  customerName?: string;
  lines: SaleLinePayload[];
}

export interface CustomerSaleSummary {
  itemTypes: number;
  totalOrders: number;
  totalQuantity: number;
  totalCost: number;
  lastPurchaseDate: string | null;
}
