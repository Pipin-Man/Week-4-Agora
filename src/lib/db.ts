import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = postgres(databaseUrl, { max: 10, idle_timeout: 20 });
  dbInstance = drizzle(client);
  return dbInstance;
}
