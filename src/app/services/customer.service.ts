import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.model';
import { environment } from '../../environments/environment';
import { extractData, extractList, normalizeId } from '../core/api.util';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly baseUrl = `${environment.apiBaseUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    return this.http.get<unknown>(this.baseUrl).pipe(
      map(response => extractList<unknown>(response).map(entry => this.normalizeCustomer(entry)))
    );
  }

  getByOwner(_subOwnerId?: string): Observable<Customer[]> {
    return this.getAll();
  }

  getCustomer(): Observable<{ data: Customer[] }> {
    return this.getAll().pipe(map(customers => ({ data: customers })));
  }

  create(customer: Customer): Observable<Customer> {
    return this.http.post<unknown>(this.baseUrl, customer).pipe(
      map(response => this.normalizeCustomer(extractData<unknown>(response)))
    );
  }

  update(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.patch<unknown>(`${this.baseUrl}/${id}`, customer).pipe(
      map(response => this.normalizeCustomer(extractData<unknown>(response)))
    );
  }

  deleteCustomer(payload: { customerId?: string; status: string }): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/status/update`, payload);
  }

  private normalizeCustomer(raw: unknown): Customer {
    const customer = (raw || {}) as Record<string, unknown>;

    return {
      _id: normalizeId(customer as { id?: string; _id?: string }),
      subOwnerId: customer['subOwnerId'] ? String(customer['subOwnerId']) : undefined,
      name: String(customer['name'] || ''),
      village: typeof customer['village'] === 'string' ? customer['village'] : undefined,
      phone: typeof customer['phone'] === 'string' ? customer['phone'] : undefined,
      houseNo: typeof customer['houseNo'] === 'string' ? customer['houseNo'] : undefined,
      createdAt: typeof customer['createdAt'] === 'string' ? customer['createdAt'] : undefined
    };
  }
}
