import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiPurchaseEntry, Item, ItemApiPayload, PurchaseEntry } from '../models/item.model';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import {
  buildOwnerQueryParams,
  extractData,
  extractList,
  normalizeId
} from '../core/api.util';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly baseUrl = `${environment.apiBaseUrl}/items`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getByOwner(ownerId?: string): Observable<Item[]> {
    const params = buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId);
    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeItem(entry)))
    );
  }

  searchByName(name: string, ownerId?: string): Observable<Item[]> {
    const params = {
      name,
      ...buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId)
    };

    return this.http.get<unknown>(`${this.baseUrl}/search`, { params }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeItem(entry)))
    );
  }

  getPurchaseHistory(itemId: string, ownerId?: string): Observable<PurchaseEntry[]> {
    const params = buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId);

    return this.http.get<unknown>(`${this.baseUrl}/${itemId}/purchase-history`, { params }).pipe(
      map(response => this.normalizePurchaseHistory(extractList<unknown>(response)))
    );
  }

  create(item: Partial<Item> & { buyMore?: boolean }): Observable<Item> {
    return this.http.post<unknown>(this.baseUrl, this.toApiPayload(item)).pipe(
      map(response => this.normalizeItem(extractData<unknown>(response)))
    );
  }

  update(item: Partial<Item> & { id: string; buyMore?: boolean }): Observable<Item> {
    const payload = this.toApiPayload(item);
    const request$ = item.buyMore
      ? this.http.patch<unknown>(`${this.baseUrl}/${item.id}`, payload)
      : this.http.put<unknown>(`${this.baseUrl}/${item.id}`, payload);

    return request$.pipe(map(response => this.normalizeItem(extractData<unknown>(response))));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<unknown>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  toApiPayload(item: Partial<Item> & { buyMore?: boolean }): ItemApiPayload {
    const latestEntry = this.getLatestPurchaseEntry(item);
    const purchaseEntry = this.toApiPurchaseEntry(item, latestEntry);
    const payload: ItemApiPayload = {
      name: String(item.name || ''),
      unit: String(item.unit || ''),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      lowStockThreshold: Number(item.lowStockThreshold ?? 10)
    };

    if (purchaseEntry) {
      payload.purchaseEntry = purchaseEntry;
    }

    return payload;
  }

  private getLatestPurchaseEntry(item: Partial<Item>): PurchaseEntry | undefined {
    const history = item.purchaseHistory;
    if (!Array.isArray(history) || !history.length) {
      return undefined;
    }

    return history[history.length - 1];
  }

  private toApiPurchaseEntry(
    item: Partial<Item>,
    entry?: PurchaseEntry
  ): ApiPurchaseEntry | undefined {
    const quantity = Number(entry?.boughtQuantity ?? item.quantity ?? 0);
    const purchasePrice = Number(entry?.purchaseRate ?? item.price ?? 0);
    const date = entry?.purchaseDate || item.purchaseDate;

    if (!quantity && !purchasePrice && !date) {
      return undefined;
    }

    const noteParts = [
      entry?.supplierName || item.vendor,
      entry?.grade,
      entry?.paid === false ? 'unpaid' : ''
    ].filter(Boolean);

    return {
      quantity,
      purchasePrice,
      date: date || new Date().toISOString().split('T')[0],
      note: noteParts.join(' - ') || undefined
    };
  }

  private normalizeItem(raw: unknown): Item {
    const item = (raw || {}) as Record<string, unknown>;
    const purchaseHistory = this.normalizePurchaseHistory(
      Array.isArray(item['purchaseHistory']) ? item['purchaseHistory'] : []
    );

    return {
      id: normalizeId(item as { id?: string; _id?: string }),
      name: String(item['name'] || ''),
      unit: String(item['unit'] || ''),
      price: Number(item['price'] || 0),
      quantity: Number(item['quantity'] || 0),
      image: typeof item['image'] === 'string' ? item['image'] : undefined,
      ownerId: String(item['ownerId'] || ''),
      createdAt: typeof item['createdAt'] === 'string' ? item['createdAt'] : undefined,
      vendor: typeof item['vendor'] === 'string' ? item['vendor'] : undefined,
      purchaseDate: typeof item['purchaseDate'] === 'string' ? item['purchaseDate'] : undefined,
      paid: typeof item['paid'] === 'boolean' ? item['paid'] : undefined,
      paymentProofImage:
        typeof item['paymentProofImage'] === 'string' ? item['paymentProofImage'] : undefined,
      availableInWarehouse:
        typeof item['availableInWarehouse'] === 'boolean' ? item['availableInWarehouse'] : undefined,
      availableQuantity:
        item['availableQuantity'] !== undefined ? Number(item['availableQuantity']) : undefined,
      lowStockThreshold:
        item['lowStockThreshold'] !== undefined ? Number(item['lowStockThreshold']) : undefined,
      purchaseHistory
    };
  }

  private normalizePurchaseHistory(raw: unknown[]): PurchaseEntry[] {
    return raw.map((entry, index) => {
      const row = (entry || {}) as Record<string, unknown>;
      const note = String(row['note'] || row['supplierName'] || '');
      const supplierName = String(row['supplierName'] || note.split(' - ')[0] || 'Supplier');

      return {
        id: normalizeId(row as { id?: string; _id?: string }) || `ph-${index}`,
        supplierName,
        grade: typeof row['grade'] === 'string' ? row['grade'] : undefined,
        boughtQuantity: Number(row['boughtQuantity'] ?? row['quantity'] ?? 0),
        availableQuantity: Number(row['availableQuantity'] ?? row['quantity'] ?? 0),
        purchaseRate: Number(row['purchaseRate'] ?? row['purchasePrice'] ?? 0),
        paid: row['paid'] !== false,
        purchaseDate: String(row['purchaseDate'] || row['date'] || ''),
        paymentProofImage:
          typeof row['paymentProofImage'] === 'string' ? row['paymentProofImage'] : undefined
      };
    });
  }
}
