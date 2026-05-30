import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap  } from 'rxjs';
import { Customer } from '../models/customer.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const MOCK_CUSTOMERS: Customer[] = [
  
];

@Injectable({ providedIn: 'root' })
export class CustomerService {
   private readonly customer = `${environment.apiBaseUrl}/customers`;
  private customersSubject = new BehaviorSubject<Customer[]>(MOCK_CUSTOMERS);
  private nextId = 3;
    
  constructor(private http: HttpClient) {}

  getByOwner(subOwnerId: string) {
    return of(this.customersSubject.value.filter(c => c.subOwnerId === subOwnerId));
  }
  
  getCustomer(){
    return this.http.get<Customer[]>(this.customer);
  }
create(customer:Customer): Observable<any> {
  return this.http.post(this.customer, customer);  // ← return + correct URL
}
  deleteCustomer(obj:any): Observable<any> {
    return this.http.post(`${this.customer}/status/update`, obj);
  }

  delete(id: string) {
    this.customersSubject.next(this.customersSubject.value.filter(c => c._id !== id));
    return of(null);
  }
}
