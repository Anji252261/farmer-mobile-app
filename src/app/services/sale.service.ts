import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CustomerSaleSummary,
  Sale,
  SaleBulkPayload,
  SaleLinePayload
} from '../models/sale.model';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import {
  buildOwnerQueryParams,
  extractData,
  extractList,
  normalizeId
} from '../core/api.util';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly baseUrl = `${environment.apiBaseUrl}/sales`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getByOwner(ownerId?: string): Observable<Sale[]> {
    const params = buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId);
    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeSale(entry)))
    );
  }

  getByCustomer(ownerId: string | undefined, customerId: string): Observable<Sale[]> {
    const params = {
      customerId,
      ...buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId)
    };

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeSale(entry)))
    );
  }

  getByDate(ownerId: string | undefined, date: string): Observable<Sale[]> {
    const params = {
      date,
      ...buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId)
    };

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeSale(entry)))
    );
  }

  getCustomerSummary(
    ownerId: string | undefined,
    from: string,
    to: string
  ): Observable<CustomerSaleSummary> {
    const params = {
      from,
      to,
      ...buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId)
    };

    return this.http.get<unknown>(`${this.baseUrl}/customer-summary`, { params }).pipe(
      map(response => {
        const data = extractData<Record<string, unknown>>(response);
        return {
          itemTypes: Number(data['itemTypes'] || 0),
          totalOrders: Number(data['totalOrders'] || 0),
          totalQuantity: Number(data['totalQuantity'] || 0),
          totalCost: Number(data['totalCost'] || 0),
          lastPurchaseDate:
            typeof data['lastPurchaseDate'] === 'string' ? data['lastPurchaseDate'] : null
        };
      })
    );
  }

  create(sale: SaleLinePayload): Observable<Sale> {
    return this.http.post<unknown>(this.baseUrl, this.toApiLine(sale)).pipe(
      map(response => this.normalizeSale(extractData<unknown>(response)))
    );
  }

  createBulk(payload: SaleBulkPayload): Observable<Sale[]> {
    return this.http.post<unknown>(`${this.baseUrl}/bulk`, {
      customerId: payload.customerId,
      customerName: payload.customerName,
      lines: payload.lines.map(line => this.toApiLine(line))
    }).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeSale(entry)))
    );
  }

  private toApiLine(sale: SaleLinePayload): Record<string, unknown> {
    const body: Record<string, unknown> = {
      itemId: sale.itemId,
      quantity: sale.quantity,
      totalPrice: sale.totalPrice
    };

    if (sale.customerId) {
      body['customerId'] = sale.customerId;
    }

    if (sale.customerName) {
      body['customerName'] = sale.customerName;
    }

    if (sale.unitPrice !== undefined) {
      body['unitPrice'] = sale.unitPrice;
    }

    if (sale.date) {
      body['date'] = sale.date.split('T')[0];
    }

    return body;
  }

  private normalizeSale(raw: unknown): Sale {
    const sale = (raw || {}) as Record<string, unknown>;

    return {
      id: normalizeId(sale as { id?: string; _id?: string }),
      itemId: String(sale['itemId'] || ''),
      ownerId: String(sale['ownerId'] || ''),
      customerId: sale['customerId'] ? String(sale['customerId']) : undefined,
      customerName: typeof sale['customerName'] === 'string' ? sale['customerName'] : undefined,
      quantity: Number(sale['quantity'] || 0),
      unit: typeof sale['unit'] === 'string' ? sale['unit'] : undefined,
      unitPrice: sale['unitPrice'] !== undefined ? Number(sale['unitPrice']) : undefined,
      totalPrice: Number(sale['totalPrice'] || 0),
      date: String(sale['date'] || '')
    };
  }
}
