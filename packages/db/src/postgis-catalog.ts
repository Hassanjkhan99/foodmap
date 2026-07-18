import type { GeoPoint, Venue } from "@foodmap/domain";
import type { FoodMapPool } from "./pool.js";
import { nearbyVenues } from "./venue-repository.js";

/** Matches @foodmap/integrations CatalogQuery structurally (no runtime coupling). */
export interface CatalogQuery {
  readonly center: GeoPoint;
  readonly radiusM: number;
}

/**
 * PostGIS-backed CatalogProvider. Structurally implements the same
 * `CatalogProvider` port as FixtureCatalogProvider, so the app can swap between
 * fixtures (zero-key default) and PostGIS by config alone.
 */
export class PostgisCatalogProvider {
  constructor(private readonly pool: FoodMapPool) {}

  async nearby(query: CatalogQuery): Promise<Venue[]> {
    return nearbyVenues(this.pool, query.center, query.radiusM);
  }
}
