import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardMetrics } from '../models/dashboard.model';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { buildOwnerQueryParams, extractData, normalizeId } from '../core/api.util';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard/metrics`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getMetrics(ownerId?: string): Observable<DashboardMetrics> {
    const params = buildOwnerQueryParams(this.auth.currentUserValue?.role, ownerId);

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(response => {
        const data = extractData<Record<string, unknown>>(response);
        const lowStockItems = Array.isArray(data['lowStockItems'])
          ? data['lowStockItems'].map((item: Record<string, unknown>) => ({
              id: normalizeId(item as { id?: string; _id?: string }),
              name: String(item['name'] || ''),
              quantity: Number(item['quantity'] || 0),
              unit: String(item['unit'] || '')
            }))
          : [];

        return {
          totalItems: Number(data['totalItems'] || 0),
          totalCustomers: Number(data['totalCustomers'] || 0),
          totalOrders: Number(data['totalOrders'] || 0),
          todaySaleAmount: Number(data['todaySaleAmount'] || 0),
          last7DaysSaleAmount: Number(data['last7DaysSaleAmount'] || 0),
          topSellingItem: String(data['topSellingItem'] || 'No sales yet'),
          lowStockItems
        };
      })
    );
  }
}
