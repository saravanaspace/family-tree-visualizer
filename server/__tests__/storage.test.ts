import { describe } from 'vitest';
import { PostgresStorage } from '../storage';
import { resetDatabase } from './setup';
import { runStorageContract } from './storage.contract';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// The Postgres leg needs a real test database; it is skipped when none is configured.
const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!hasTestDatabase)('PostgresStorage', () => {
  const queryClient = postgres(process.env.DATABASE_URL || '', {
    max: 1,
    types: {
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (date: Date) => date.toISOString().split('T')[0],
        parse: (str: string) => str ? new Date(str) : null,
      }
    }
  });
  const storage = new PostgresStorage(drizzle(queryClient));

  runStorageContract('contract', async () => {
    await resetDatabase();
    return storage;
  });
});
