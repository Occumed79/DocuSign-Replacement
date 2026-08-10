import type { Pool } from "pg";

export type RuntimeMigration = {
  id: string;
  description: string;
  statements: readonly string[];
};

/**
 * Reviewed, additive migrations required by application startup.
 *
 * These are deliberately narrower than `drizzle-kit push`: they may add
 * backwards-compatible schema needed by the deployed code, but must never drop,
 * rename, or rewrite production data. Destructive changes require a separately
 * reviewed maintenance migration.
 */
export const RUNTIME_MIGRATIONS: readonly RuntimeMigration[] = [
  {
    id: "20260809_001_questions_source_key",
    description: "Add stable source_key identity to medical-history questions",
    statements: [
      `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "source_key" text`,
      `CREATE INDEX IF NOT EXISTS "questions_source_key_idx" ON "questions" ("source_key")`,
    ],
  },
] as const;

export async function runRuntimeMigrations(pool: Pool): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query("BEGIN");

    // Render can overlap old/new instances during a deploy. Serialize migrations
    // across those processes so a migration is applied and recorded exactly once.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "packetpath_runtime_migrations_v1",
    ]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "packetpath_schema_migrations" (
        "id" text PRIMARY KEY,
        "description" text NOT NULL,
        "applied_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const migration of RUNTIME_MIGRATIONS) {
      const existing = await client.query<{ id: string }>(
        `SELECT "id" FROM "packetpath_schema_migrations" WHERE "id" = $1 LIMIT 1`,
        [migration.id],
      );
      if (existing.rowCount) continue;

      for (const statement of migration.statements) {
        await client.query(statement);
      }

      await client.query(
        `INSERT INTO "packetpath_schema_migrations" ("id", "description") VALUES ($1, $2)`,
        [migration.id, migration.description],
      );
      applied.push(migration.id);
    }

    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
