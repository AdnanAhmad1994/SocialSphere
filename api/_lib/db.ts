import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

let dbInstance: any = null;

export function createDbConnectionPool() {
  if (dbInstance) {
    return dbInstance;
  }
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const sql = neon(connectionString);
  dbInstance = drizzle(sql);
  
  return dbInstance;
}