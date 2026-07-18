import {
  discover,
  type Candidate,
  type DiscoveryFilters,
  type GeoPoint,
  type Heading,
} from "@foodmap/domain";
import {
  boundedResultCount,
  isEnabled,
  type RuntimeConfig,
} from "@foodmap/config";
import type { CatalogProvider } from "../ports.js";

export type DiscoveryPayloadStatus =
  | "OK"
  | "NO_RESULTS"
  | "ALL_FILTERED"
  | "DEGRADED_HEADING_UNKNOWN"
  | "FEATURE_DISABLED";

export interface RadarDiscoverInput {
  readonly location: GeoPoint;
  readonly heading: Heading | null;
  readonly filters?: DiscoveryFilters;
  readonly requestedResultCount?: number;
  readonly searchRadiusM?: number;
  readonly priorOrder?: readonly string[];
  readonly dismissed?: readonly string[];
  /** monotonic selection version echoed back to the client for stability */
  readonly selectionVersion?: number;
}

export interface DiscoveryPayload {
  readonly status: DiscoveryPayloadStatus;
  readonly warnings: readonly string[];
  readonly candidates: readonly Candidate[];
  readonly refreshAfterMs: number;
  readonly configVersion: string;
  readonly selectionVersion: number;
}

/**
 * Radar discovery service: fetches internal candidates, runs the deterministic
 * domain pipeline, and applies runtime config (bounds, kill switch). Provider
 * enrichment (external places) is layered in later phases; failure of any
 * external provider must leave internal results intact.
 */
export class DiscoveryService {
  constructor(
    private readonly catalog: CatalogProvider,
    private readonly config: RuntimeConfig,
  ) {}

  async radar(input: RadarDiscoverInput): Promise<DiscoveryPayload> {
    const base = {
      refreshAfterMs: this.config.discovery.refreshMinIntervalMs,
      configVersion: this.config.version,
      selectionVersion: (input.selectionVersion ?? 0) + 1,
    };

    if (!isEnabled(this.config, "foodmap.radar")) {
      return { ...base, status: "FEATURE_DISABLED", warnings: ["radar_disabled"], candidates: [] };
    }

    const radiusM = input.searchRadiusM ?? 5000;
    const venues = await this.catalog.nearby({ center: input.location, radiusM });
    const limit = boundedResultCount(this.config, input.requestedResultCount);

    const result = discover(venues, {
      location: input.location,
      heading: input.heading,
      resultLimit: limit,
      ...(input.filters ? { filters: input.filters } : {}),
      ...(input.priorOrder ? { priorOrder: input.priorOrder } : {}),
      ...(input.dismissed ? { dismissed: input.dismissed } : {}),
    });

    return {
      ...base,
      status: result.status,
      warnings: result.warnings,
      candidates: result.candidates,
    };
  }
}
