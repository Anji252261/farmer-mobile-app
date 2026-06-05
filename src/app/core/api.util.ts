import { Role } from '../models/user.model';

export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export function extractData<T>(response: unknown): T {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const envelope = response as ApiEnvelope<T>;
    if ('data' in envelope && envelope.data !== undefined) {
      return envelope.data as T;
    }
  }

  return response as T;
}

export function extractList<T>(response: unknown): T[] {
  const data = extractData<unknown>(response);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['items', 'sales', 'customers', 'users', 'lines', 'purchaseHistory']) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}

export function buildOwnerQueryParams(role: Role | undefined, ownerId?: string): Record<string, string> {
  if (role === 'MAIN_OWNER' && ownerId) {
    return { ownerId };
  }

  return {};
}

export function normalizeId(entity: { id?: string; _id?: string } | null | undefined): string {
  return String(entity?.id || entity?._id || '');
}
