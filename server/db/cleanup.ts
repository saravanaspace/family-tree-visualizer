import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const cleanup = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS family_members, relationships, family_events CASCADE;`;
    console.log('✅ Tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

cleanup();