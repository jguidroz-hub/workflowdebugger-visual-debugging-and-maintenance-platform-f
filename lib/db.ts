import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Build-safe: don't crash if DATABASE_URL is missing (e.g., during next build)
const databaseUrl = process.env.DATABASE_URL ?? '';
const sql = databaseUrl ? neon(databaseUrl) : (undefined as any);
export const db = databaseUrl ? drizzle(sql, { schema }) : (undefined as any);

// Re-export for convenience
export { schema };
