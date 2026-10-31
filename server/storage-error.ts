export type StorageErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'INVALID';

/** Typed failure so routes can map to 404/409/400 without matching message text. */
export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode, message: string) {
    super(message);
    this.name = 'StorageError';
  }
}
