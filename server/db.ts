import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Initialize database only when DATABASE_URL is provided. This allows
// development to run with in-memory storage without crashing on import.
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (undefined as any);

export const db = process.env.DATABASE_URL
  ? drizzle({ client: pool, schema })
  : (undefined as any);
