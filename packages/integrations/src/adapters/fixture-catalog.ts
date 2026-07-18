import { haversineM, type Venue } from "@foodmap/domain";
import { SEED_VENUES } from "@foodmap/test-fixtures";
import type { CatalogProvider, CatalogQuery } from "../ports.js";

/**
 * Zero-key internal catalog backed by deterministic fixtures. Filters seed
 * venues by radius (the PostGIS-backed adapter replaces this in Phase 2 with
 * the same interface).
 */
export class FixtureCatalogProvider implements CatalogProvider {
  constructor(private readonly venues: readonly Venue[] = SEED_VENUES) {}

  async nearby(query: CatalogQuery): Promise<Venue[]> {
    return this.venues.filter((v) => haversineM(query.center, v.point) <= query.radiusM);
  }
}
