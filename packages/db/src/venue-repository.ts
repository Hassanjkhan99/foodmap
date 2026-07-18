import { z } from "zod";
import type { GeoPoint, Venue } from "@foodmap/domain";
import type { FoodMapPool } from "./pool.js";

/** Row shape returned by the nearby query. Validated at the boundary with Zod. */
const VenueRowSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  name: z.string(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  cuisines: z.array(z.string()),
  open_state: z.enum(["open", "closed", "unknown"]),
  opens_at_label: z.string().nullable(),
  source: z.enum(["foodmap", "merchant", "delivery_linked", "provider", "mixed", "unknown"]),
  delivery_restaurant_slug: z.string().nullable(),
  delivery_branch_id: z.string().nullable(),
  distinguishing_fact: z.string().nullable(),
});
export type VenueRow = z.infer<typeof VenueRowSchema>;

/** Map a validated DB row to a framework-free domain Venue. */
export function rowToVenue(raw: unknown): Venue {
  const r = VenueRowSchema.parse(raw);
  const deliveryBranchRef = r.delivery_restaurant_slug
    ? {
        restaurantSlug: r.delivery_restaurant_slug,
        ...(r.delivery_branch_id ? { branchId: r.delivery_branch_id } : {}),
      }
    : undefined;
  return {
    id: r.id,
    brandId: r.brand_id,
    name: r.name,
    point: { lat: r.lat, lng: r.lng },
    cuisines: r.cuisines,
    openState: r.open_state,
    source: r.source,
    ...(r.opens_at_label ? { opensAtLabel: r.opens_at_label } : {}),
    ...(deliveryBranchRef ? { deliveryBranchRef } : {}),
    ...(r.distinguishing_fact ? { distinguishingFact: r.distinguishing_fact } : {}),
  };
}

const NEARBY_SQL = /* sql */ `
  SELECT id, brand_id, name,
         ST_Y(geom::geometry) AS lat,
         ST_X(geom::geometry) AS lng,
         cuisines, open_state, opens_at_label, source,
         delivery_restaurant_slug, delivery_branch_id, distinguishing_fact
  FROM venue
  WHERE ST_DWithin(geom, ST_MakePoint($2, $1)::geography, $3)
  ORDER BY ST_Distance(geom, ST_MakePoint($2, $1)::geography), id
`;

/**
 * Venues within `radiusM` of `center`, using the GiST-indexed geography column.
 * This is the coarse PostGIS prefilter; exact ahead/corridor geometry runs in
 * @foodmap/domain (see ADR-0005).
 */
export async function nearbyVenues(
  pool: FoodMapPool,
  center: GeoPoint,
  radiusM: number,
): Promise<Venue[]> {
  const { rows } = await pool.query(NEARBY_SQL, [center.lat, center.lng, radiusM]);
  return rows.map(rowToVenue);
}
