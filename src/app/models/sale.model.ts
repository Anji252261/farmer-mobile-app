export interface Sale {
  id: string;
  itemId: string;
  ownerId: string; // sub-owner
  customerId?: string;
  customerName?: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  date: string;
}
