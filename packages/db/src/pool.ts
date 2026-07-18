import pg from "pg";
import { MIGRATIONS } from "./migrations.js";

export type FoodMapPool = pg.Pool;

/** Create a pooled PostgreSQL connection. Prefers the given URL, then DATABASE_URL. */
export function createPool(connectionString?: string): FoodMapPool {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) throw new Error("createPool: no connection string (set DATABASE_URL)");
  return new pg.Pool({ connectionString: url, max: 5 });
}

/** Apply any migrations not yet recorded. Idempotent. */
export async function runMigrations(pool: FoodMapPool): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _foodmap_migration (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const applied = new Set(
    (await pool.query<{ id: string }>("SELECT id FROM _foodmap_migration")).rows.map((r) => r.id),
  );
  const ran: string[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(migration.sql);
      await client.query("INSERT INTO _foodmap_migration (id) VALUES ($1)", [migration.id]);
      await client.query("COMMIT");
      ran.push(migration.id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  return ran;
}
