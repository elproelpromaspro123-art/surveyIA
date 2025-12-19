import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

// Only require database URL if we're not using mock storage
if (!databaseUrl) {
  // If no database URL, we'll use mock storage
  // Don't throw error, just continue without database
  console.log("No DATABASE_URL provided. Using mock storage.");
}

if (databaseUrl && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    "DATABASE_URL must be a valid PostgreSQL connection string. " +
    "Check your environment variables."
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
