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

  /**
   * Initialize user from stored JWT token on app startup.
   * This ensures that after page refresh, the user is still logged in.
   */
  private initializeFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      // Decode JWT to extract user info (JWT format: header.payload.signature)
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Build user object from JWT payload
      const user: User = {
        id: payload.id || payload.sub || '',
        name: payload.name || '',
        email: payload.email || '',
        role: payload.role || 'SUB_OWNER',
        phone: payload.phone,
        shopName: payload.shopName,
        token: token
      };

      if (user.id && user.role) {
        this._currentUser.next(user);
      } else {
        // Token is missing required fields, clear it
        localStorage.removeItem('token');
      }
    } catch (error) {
      // Token is invalid or malformed, clear it
      localStorage.removeItem('token');
      console.warn('Invalid token in localStorage:', error);
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiBaseUrl}/auth/login`, {
        email,
        password
      })
      .pipe(
        map((res) => {
          if (!res?.success || !res?.data?.token || !res?.data?.user) {
            throw new Error(res?.message || 'Invalid login response');
          }
          return res.data;
        }),
        tap((data) => {
          localStorage.setItem('token', data.token);
          debugger
          this._currentUser.next(data.user);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    this._currentUser.next(null);
  }

  get currentUserValue(): User | null {
    return this._currentUser.value;
  }
}
