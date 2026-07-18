import type { Venue } from "@foodmap/domain";
import type { FoodMapPool } from "./pool.js";

/**
 * Seed brands + venues into PostGIS. Idempotent (upsert by id). The same seed
 * data backs the fixture catalog, so the PostGIS path returns the same venues.
 */
export async function seedVenues(pool: FoodMapPool, venues: readonly Venue[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const v of venues) {
      await client.query(
        `INSERT INTO restaurant_brand (id, name) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
        [v.brandId, v.name],
      );
      await client.query(
        `INSERT INTO venue (
           id, brand_id, name, geom, cuisines, open_state, opens_at_label, source,
           delivery_restaurant_slug, delivery_branch_id, distinguishing_fact
         ) VALUES (
           $1, $2, $3, ST_MakePoint($5, $4)::geography, $6, $7, $8, $9, $10, $11, $12
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, geom = EXCLUDED.geom, cuisines = EXCLUDED.cuisines,
           open_state = EXCLUDED.open_state, opens_at_label = EXCLUDED.opens_at_label,
           source = EXCLUDED.source,
           delivery_restaurant_slug = EXCLUDED.delivery_restaurant_slug,
           delivery_branch_id = EXCLUDED.delivery_branch_id,
           distinguishing_fact = EXCLUDED.distinguishing_fact,
           updated_at = now()`,
        [
          v.id,
          v.brandId,
          v.name,
          v.point.lat,
          v.point.lng,
          v.cuisines,
          v.openState,
          v.opensAtLabel ?? null,
          v.source,
          v.deliveryBranchRef?.restaurantSlug ?? null,
          v.deliveryBranchRef?.branchId ?? null,
          v.distinguishingFact ?? null,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
