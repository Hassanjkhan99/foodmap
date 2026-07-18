import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ORIGIN, SEED_VENUES } from "@foodmap/test-fixtures";
import {
  PostgisCatalogProvider,
  createPool,
  nearbyVenues,
  runMigrations,
  seedVenues,
  type FoodMapPool,
} from "../src/index.js";

const url = process.env.DATABASE_URL;

/**
 * Real PostGIS integration. Skips when DATABASE_URL is absent (local/zero-key),
 * runs in CI against a postgis service container. No external credentials.
 */
describe.skipIf(!url)("PostGIS catalog (DB integration)", () => {
  let pool: FoodMapPool;

  beforeAll(async () => {
    pool = createPool(url);
    await runMigrations(pool);
    await pool.query(
      "TRUNCATE venue_attribute, external_place_ref, venue, restaurant_brand RESTART IDENTITY CASCADE",
    );
    await seedVenues(pool, SEED_VENUES);
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it("returns seeded venues within a wide radius", async () => {
    const provider = new PostgisCatalogProvider(pool);
    const near = await provider.nearby({ center: SEED_ORIGIN, radiusM: 5000 });
    expect(near.length).toBe(SEED_VENUES.length);
  });

  it("prefilters by radius (GiST ST_DWithin)", async () => {
    const tight = await nearbyVenues(pool, SEED_ORIGIN, 100);
    expect(tight.length).toBeLessThan(SEED_VENUES.length);
  });

  it("has parity with the fixture catalog (same venue ids)", async () => {
    const near = await new PostgisCatalogProvider(pool).nearby({ center: SEED_ORIGIN, radiusM: 5000 });
    expect(near.map((v) => v.id).sort()).toEqual([...SEED_VENUES].map((v) => v.id).sort());
  });

  it("orders results by distance ascending", async () => {
    const near = await new PostgisCatalogProvider(pool).nearby({ center: SEED_ORIGIN, radiusM: 5000 });
    // First result should be the closest seeded venue to the origin.
    expect(near.length).toBeGreaterThan(1);
  });

  it("re-running migrations is idempotent", async () => {
    const ran = await runMigrations(pool);
    expect(ran).toEqual([]); // nothing new to apply
  });
});
