
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in Secrets");
}

// Use connection pooling URL
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);
