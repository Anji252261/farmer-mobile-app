export type CreditEntryType = 'credit' | 'payment';

export interface CreditEntry {
  id: string;
  customerId: string;
  type: CreditEntryType;
  amount: number;
  note?: string;
  date: string;
}

export interface CustomerCreditSummary {
  customerId: string;
  balance: number;
  lastEntryDate: string | null;
  entryCount: number;
}
