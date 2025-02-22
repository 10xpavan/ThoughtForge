
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in Secrets");
}
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL must be set in .env");
}


// Use connection pooling URL
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });
