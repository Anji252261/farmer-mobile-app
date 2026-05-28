import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { Sale } from '../models/sale.model';

// Mock sales database
const MOCK_SALES: Sale[] = [
  { id: '1', itemId: '1', ownerId: '2', quantity: 10, unit: 'kg', totalPrice: 500, date: '2026-02-25' },
  { id: '2', itemId: '2', ownerId: '2', quantity: 5, unit: 'kg', totalPrice: 300, date: '2026-02-26' },
];

@Injectable({ providedIn: 'root' })
export class SaleService {
  private salesSubject = new BehaviorSubject<Sale[]>(MOCK_SALES);
  private nextId = 3;

  constructor(private http: HttpClient) {}

  create(sale: Partial<Sale>) {
    const newSale: Sale = {
      id: String(this.nextId++),
      itemId: sale.itemId || '',
      ownerId: sale.ownerId || '',
      customerId: sale.customerId,
      customerName: sale.customerName,
      quantity: sale.quantity || 0,
      unit: sale.unit || '',
      totalPrice: sale.totalPrice || 0,
      date: sale.date || new Date().toISOString()
    };
    const sales = this.salesSubject.value;
    this.salesSubject.next([...sales, newSale]);
    return of(newSale);
  }

  getByOwner(ownerId: string) {
    return of(this.salesSubject.value.filter(s => s.ownerId === ownerId));
  }
}
