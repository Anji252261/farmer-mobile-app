import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';
import {
  ApiUser,
  CreateSubOwnerPayload,
  CreateSubOwnerResult,
  UpdateSubOwnerPayload,
  User
} from '../models/user.model';
import { environment } from '../../environments/environment';

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
  user?: unknown;
  users?: unknown;
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly usersUrl = `${environment.apiBaseUrl}/users`;
  private readonly subOwnersUrl = `${environment.apiBaseUrl}/users/sub-owners`;
  private readonly subOwnersRefresh$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {}

  getByRole(role: string): Observable<User[]> {
    if (role !== 'SUB_OWNER') {
      return of([]);
    }

    return this.subOwnersRefresh$.pipe(
      switchMap(() => this.http.get<unknown>(this.usersUrl, { params: { role } })),
      map(response => this.extractSubOwners(response))
    );
  }

  get(id: string) {
    return this.http.get<unknown>(`${this.subOwnersUrl}/${id}`).pipe(
      map(response => this.extractSingleUser(response))
    );
  }

  createSubOwner(payload: CreateSubOwnerPayload): Observable<CreateSubOwnerResult> {
    const normalizedEmail = String(payload.email || '').trim().toLowerCase();

    const requestBody: CreateSubOwnerPayload = {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      shopName: payload.shopName.trim()
    };

    if (normalizedEmail) {
      requestBody.email = normalizedEmail;
    }

    return this.http.post<unknown>(this.subOwnersUrl, requestBody).pipe(
      map(response => {
        const normalized = this.extractCreateResult(response);
        this.subOwnersRefresh$.next();
        return normalized;
      })
    );
  }

  updateSubOwner(id: string, payload: UpdateSubOwnerPayload): Observable<User> {
    const normalizedEmail = String(payload.email || '').trim().toLowerCase();
    const normalizedPassword = String(payload.password || '').trim();

    const requestBody: UpdateSubOwnerPayload = {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      shopName: payload.shopName.trim()
    };

    if (normalizedEmail) {
      requestBody.email = normalizedEmail;
    }

    if (normalizedPassword) {
      requestBody.password = normalizedPassword;
    }

    return this.http.put<unknown>(`${this.usersUrl}/${id}`, requestBody).pipe(
      map(response => {
        const normalized = this.extractSingleUser(response);
        this.subOwnersRefresh$.next();
        return normalized;
      })
    );
  }

  refreshSubOwners(): void {
    this.subOwnersRefresh$.next();
  }

  private extractSubOwners(response: unknown): User[] {
    if (Array.isArray(response)) {
      return response.map(user => this.normalizeSubOwner(user as ApiUser));
    }

    const envelope = this.toEnvelope(response);
    const fromData = envelope?.data as { users?: unknown } | unknown;

    if (Array.isArray(fromData)) {
      return fromData.map(user => this.normalizeSubOwner(user as ApiUser));
    }

    if (Array.isArray((fromData as { users?: unknown })?.users)) {
      return ((fromData as { users?: unknown }).users as unknown[]).map(user =>
        this.normalizeSubOwner(user as ApiUser)
      );
    }

    const envelopeUsers = envelope?.users;
    if (Array.isArray(envelopeUsers)) {
      return envelopeUsers.map(user => this.normalizeSubOwner(user as ApiUser));
    }

    return [];
  }

  private extractSingleUser(response: unknown): User {
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const direct = response as ApiUser;
      if (direct.id || direct._id) {
        return this.normalizeSubOwner(direct);
      }
    }

    const envelope = this.toEnvelope(response);
    const data = envelope?.data as { user?: unknown } | unknown;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const nestedUser = (data as { user?: unknown }).user;
      if (nestedUser && typeof nestedUser === 'object' && !Array.isArray(nestedUser)) {
        return this.normalizeSubOwner(nestedUser as ApiUser);
      }

      const asUser = data as ApiUser;
      if (asUser.id || asUser._id) {
        return this.normalizeSubOwner(asUser);
      }
    }

    if (envelope?.user && typeof envelope.user === 'object' && !Array.isArray(envelope.user)) {
      return this.normalizeSubOwner(envelope.user as ApiUser);
    }

    throw new Error('Unexpected user API response shape.');
  }

  private extractCreateResult(response: unknown): CreateSubOwnerResult {
    const envelope = this.toEnvelope(response);
    const data = envelope?.data as { user?: unknown; tempPassword?: unknown } | undefined;
    const tempPassword = typeof data?.tempPassword === 'string' ? data.tempPassword : undefined;

    return {
      user: this.extractSingleUser(response),
      tempPassword
    };
  }

  private toEnvelope(response: unknown): ApiEnvelope | null {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return null;
    }

    return response as ApiEnvelope;
  }

  private normalizeSubOwner(user: ApiUser): User {
    return {
      id: String(user.id || user._id || ''),
      name: String(user.name || ''),
      email: String(user.email || ''),
      password: typeof user.password === 'string' ? user.password : undefined,
      phone: user.phone,
      shopName: user.shopName,
      role: 'SUB_OWNER',
      token: user.token
    };
  }
}
