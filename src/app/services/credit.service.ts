import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CreditEntry, CustomerCreditSummary } from '../models/credit.model';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private readonly storagePrefix = 'farmer_udhar_';
  private entries$ = new BehaviorSubject<CreditEntry[]>([]);

  watchEntries(ownerId: string) {
    this.entries$.next(this.loadEntries(ownerId));
    return this.entries$.asObservable();
  }

  getEntries(ownerId: string): CreditEntry[] {
    return this.loadEntries(ownerId);
  }

  addCredit(ownerId: string, customerId: string, amount: number, note?: string): CreditEntry {
    return this.addEntry(ownerId, {
      customerId,
      type: 'credit',
      amount,
      note: note?.trim() || undefined
    });
  }

  addPayment(ownerId: string, customerId: string, amount: number, note?: string): CreditEntry {
    return this.addEntry(ownerId, {
      customerId,
      type: 'payment',
      amount,
      note: note?.trim() || undefined
    });
  }

  getBalance(ownerId: string, customerId: string): number {
    return this.loadEntries(ownerId)
      .filter(entry => entry.customerId === customerId)
      .reduce((balance, entry) => {
        return entry.type === 'credit' ? balance + entry.amount : balance - entry.amount;
      }, 0);
  }

  getCustomerSummaries(ownerId: string): CustomerCreditSummary[] {
    const byCustomer = new Map<string, CustomerCreditSummary>();

    for (const entry of this.loadEntries(ownerId)) {
      const current = byCustomer.get(entry.customerId) ?? {
        customerId: entry.customerId,
        balance: 0,
        lastEntryDate: null,
        entryCount: 0
      };

      current.balance += entry.type === 'credit' ? entry.amount : -entry.amount;
      current.entryCount += 1;

      if (!current.lastEntryDate || entry.date > current.lastEntryDate) {
        current.lastEntryDate = entry.date;
      }

      byCustomer.set(entry.customerId, current);
    }

    return Array.from(byCustomer.values())
      .filter(summary => summary.balance > 0 || summary.entryCount > 0)
      .sort((a, b) => b.balance - a.balance);
  }

  getTotalOutstanding(ownerId: string): number {
    return this.getCustomerSummaries(ownerId)
      .filter(summary => summary.balance > 0)
      .reduce((total, summary) => total + summary.balance, 0);
  }

  getCustomerEntries(ownerId: string, customerId: string): CreditEntry[] {
    return this.loadEntries(ownerId)
      .filter(entry => entry.customerId === customerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  private addEntry(
    ownerId: string,
    partial: Pick<CreditEntry, 'customerId' | 'type' | 'amount' | 'note'>
  ): CreditEntry {
    const entry: CreditEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...partial
    };

    const entries = [...this.loadEntries(ownerId), entry];
    this.saveEntries(ownerId, entries);
    this.entries$.next(entries);
    return entry;
  }

  private loadEntries(ownerId: string): CreditEntry[] {
    if (!ownerId) {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.storageKey(ownerId));
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as CreditEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveEntries(ownerId: string, entries: CreditEntry[]): void {
    localStorage.setItem(this.storageKey(ownerId), JSON.stringify(entries));
  }

  private storageKey(ownerId: string): string {
    return `${this.storagePrefix}${ownerId}`;
  }
}
