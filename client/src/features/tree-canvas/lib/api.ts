import type { FamilyEvent, FamilyMember, InsertFamilyMember, InsertRelationship, Relationship } from '@shared/schema';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') message = data.message;
    } catch {
      // keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export type Position = { id: number; x: number; y: number };

export const api = {
  savePositions: (positions: Position[]) =>
    request<{ updated: number }>('PATCH', '/api/family-members/positions', { positions }),
  createMember: (member: InsertFamilyMember) => request<FamilyMember>('POST', '/api/family-members', member),
  deleteMember: (id: number) => request<unknown>('DELETE', `/api/family-members/${id}`),
  restoreMember: (snapshot: { member: unknown; relationships: unknown[]; events: unknown[] }) =>
    request<{ member: FamilyMember; relationships: Relationship[]; events: FamilyEvent[] }>(
      'POST', '/api/family-members/restore', snapshot),
  createRelationship: (rel: InsertRelationship) => request<Relationship>('POST', '/api/relationships', rel),
  updateRelationship: (id: number, data: Partial<InsertRelationship>) =>
    request<Relationship>('PATCH', `/api/relationships/${id}`, data),
  deleteRelationship: (id: number) => request<unknown>('DELETE', `/api/relationships/${id}`),
};

/** Strips server-managed timestamps; null columns are accepted by the restore schema. */
export function toRestoreRow<T extends object>(row: T): Omit<T, 'createdAt' | 'updatedAt'> {
  const { createdAt: _c, updatedAt: _u, ...rest } = row as T & { createdAt?: unknown; updatedAt?: unknown };
  return rest as Omit<T, 'createdAt' | 'updatedAt'>;
}
