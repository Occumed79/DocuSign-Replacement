import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { runRuntimeMigrations as runRuntimeMigrationsWithPool } from "./runtime-migrations";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Apply the small, reviewed set of additive production migrations required by
 * the running application before any startup query can depend on new schema.
 */
export async function runRuntimeMigrations(): Promise<string[]> {
  return runRuntimeMigrationsWithPool(pool);
}

export * from "./schema";
