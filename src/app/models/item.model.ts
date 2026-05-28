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
  unit: string; // e.g., kg, piece
  price: number; // decided by Sub Owner
  quantity?: number; // available quantity
  image?: string; // base64 or URL
  ownerId: string; // sub-owner who added it
  createdAt?: string;
  vendor?: string; // vendor/supplier name
  purchaseDate?: string; // when item was purchased
  paid?: boolean; // payment status
  paymentProofImage?: string;
  availableInWarehouse?: boolean; // is item available in warehouse
  availableQuantity?: number; // quantity available in warehouse
  purchaseHistory?: PurchaseEntry[];
}
