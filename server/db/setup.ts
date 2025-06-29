import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const setup = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse the DATABASE_URL to get credentials but connect to postgres database
  const url = new URL(process.env.DATABASE_URL);
  const postgresUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`;
  
  const sql = postgres(postgresUrl);
  
  try {
    console.log('Checking for existing database...');
    
    // Check if database exists
    const result = await sql`
      SELECT 1 FROM pg_database WHERE datname = 'familytree'
    `;
    
    if (result.length === 0) {
      console.log('Database does not exist, creating...');
      // We need to use text for CREATE DATABASE as it cannot be parameterized
      await sql.unsafe('CREATE DATABASE familytree;');
      console.log('✅ Database "familytree" created successfully');
    } else {
      console.log('✅ Database "familytree" already exists');
    }
  } catch (error) {
    console.error('Failed to create database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

setup();