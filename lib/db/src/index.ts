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

// Bound connection and query waits so a transient Neon/network problem cannot
// leave auth/session requests hanging indefinitely on Render.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  query_timeout: 20_000,
  statement_timeout: 15_000,
  keepAlive: true,
});
export const db = drizzle(pool, { schema });

/**
 * Apply the small, reviewed set of additive production migrations required by
 * the running application before any startup query can depend on new schema.
 */
export async function runRuntimeMigrations(): Promise<string[]> {
  return runRuntimeMigrationsWithPool(pool);
}

export * from "./schema";
