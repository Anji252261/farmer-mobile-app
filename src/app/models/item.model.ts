export interface ApiPurchaseEntry {
  quantity: number;
  purchasePrice: number;
  date: string;
  note?: string;
}

export interface PurchaseEntry {
  id: string;
  supplierName: string;
  grade?: string;
  boughtQuantity: number;
  availableQuantity: number;
  purchaseRate: number;
  paid: boolean;
  purchaseDate: string;
  paymentProofImage?: string;
}

export interface Item {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity?: number;
  image?: string;
  ownerId: string;
  createdAt?: string;
  vendor?: string;
  purchaseDate?: string;
  paid?: boolean;
  paymentProofImage?: string;
  availableInWarehouse?: boolean;
  availableQuantity?: number;
  lowStockThreshold?: number;
  purchaseHistory?: PurchaseEntry[];
}

export interface ItemApiPayload {
  name: string;
  unit: string;
  price: number;
  quantity: number;
  lowStockThreshold?: number;
  purchaseEntry?: ApiPurchaseEntry;
}
