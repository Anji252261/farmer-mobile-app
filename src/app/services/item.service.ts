import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { Item } from '../models/item.model';

// Mock items database
const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Wheat',
    unit: 'kg',
    price: 50,
    quantity: 100,
    ownerId: '2',
    createdAt: '2026-02-20',
    purchaseHistory: [
      {
        id: 'ph-1',
        supplierName: 'Ramesh Traders',
        boughtQuantity: 60,
        availableQuantity: 30,
        purchaseRate: 48,
        paid: true,
        purchaseDate: '2026-02-20'
      },
      {
        id: 'ph-2',
        supplierName: 'Kiran Agro Supply',
        boughtQuantity: 70,
        availableQuantity: 70,
        purchaseRate: 50,
        paid: false,
        purchaseDate: '2026-03-01'
      }
    ]
  },
  {
    id: '2',
    name: 'Rice',
    unit: 'kg',
    price: 60,
    quantity: 80,
    ownerId: '2',
    createdAt: '2026-02-21',
    purchaseHistory: [
      {
        id: 'ph-3',
        supplierName: 'Lakshmi Wholesales',
        boughtQuantity: 100,
        availableQuantity: 80,
        purchaseRate: 57,
        paid: true,
        purchaseDate: '2026-02-25'
      }
    ]
  },
  { id: '3', name: 'Corn', unit: 'kg', price: 40, quantity: 120, ownerId: '3', createdAt: '2026-02-19' },
];

@Injectable({ providedIn: 'root' })
export class ItemService {
  private itemsSubject = new BehaviorSubject<Item[]>(MOCK_ITEMS);
  private nextId = 4;

  constructor(private http: HttpClient) {}

  getByOwner(ownerId: string) {
    return of(this.itemsSubject.value.filter(i => i.ownerId === ownerId));
  }

  create(item: Partial<Item>) {
    const newItem: Item = {
      id: String(this.nextId++),
      name: item.name || '',
      unit: item.unit || '',
      price: item.price || 0,
      quantity: item.quantity || 0,
      image: item.image || undefined,
      ownerId: item.ownerId || '',
      createdAt: new Date().toISOString().split('T')[0],
      purchaseHistory: item.purchaseHistory || []
    };
    const items = this.itemsSubject.value;
    this.itemsSubject.next([...items, newItem]);
    return of(newItem);
  }

  getAll() {
    return of(this.itemsSubject.value);
  }

  update(updated: Partial<Item> & { id: string }) {
    const items = this.itemsSubject.value.map(i => i.id === updated.id ? { ...i, ...updated } : i);
    this.itemsSubject.next(items);
    const found = items.find(i => i.id === updated.id);
    return of(found);
  }

  delete(id: string) {
    const items = this.itemsSubject.value.filter(i => i.id !== id);
    this.itemsSubject.next(items);
    return of(null);
  }

  searchByName(name: string) {
    const items = this.itemsSubject.value.filter(i => 
      i.name.toLowerCase().includes(name.toLowerCase())
    );
    return of(items);
  }
}
