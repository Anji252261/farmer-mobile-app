import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  user: User;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(private http: HttpClient) {
    this.initializeFromToken();
  }

  private initializeFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: payload.id || payload.sub || '',
        name: payload.name || '',
        email: payload.email || '',
        role: payload.role || 'SUB_OWNER',
        phone: payload.phone,
        shopName: payload.shopName,
        parentOwnerId: payload.parentOwnerId,
        token
      };

      if (user.id && user.role) {
        this._currentUser.next(user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
      console.warn('Invalid token in localStorage:', error);
    }
  }

  login(identifier: string, password: string) {
    const trimmed = identifier.trim();
    const body = /^\d{10}$/.test(trimmed)
      ? { phone: trimmed, password }
      : { email: trimmed, password };

    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiBaseUrl}/auth/login`, body)
      .pipe(
        map((res) => {
          if (!res?.success || !res?.data?.token || !res?.data?.user) {
            throw new Error(res?.message || 'Invalid login response');
          }
          return res.data;
        }),
        tap((data) => {
          localStorage.setItem('token', data.token);
          this._currentUser.next(data.user);
        })
      );
  }

  logout() {
    const hadToken = !!localStorage.getItem('token');
    localStorage.removeItem('token');
    this._currentUser.next(null);

    if (hadToken) {
      this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).subscribe({
        error: () => undefined
      });
    }
  }

  get currentUserValue(): User | null {
    return this._currentUser.value;
  }
}
