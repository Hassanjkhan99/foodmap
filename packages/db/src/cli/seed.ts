import { SEED_VENUES } from "@foodmap/test-fixtures";
import { createPool, runMigrations, seedVenues } from "../index.js";

const pool = createPool();
try {
  await runMigrations(pool);
  await seedVenues(pool, SEED_VENUES);
  // eslint-disable-next-line no-console
  console.log(`seeded ${SEED_VENUES.length} venues`);
} finally {
  await pool.end();
}
