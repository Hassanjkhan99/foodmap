import { createPool, runMigrations } from "../index.js";

const pool = createPool();
try {
  const ran = await runMigrations(pool);
  // eslint-disable-next-line no-console
  console.log(ran.length ? `applied migrations: ${ran.join(", ")}` : "no pending migrations");
} finally {
  await pool.end();
}
