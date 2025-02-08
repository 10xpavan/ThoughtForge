
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in Secrets");
}

const connectionString = `${process.env.SUPABASE_URL}:5432/postgres?connection_string=true`;
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
