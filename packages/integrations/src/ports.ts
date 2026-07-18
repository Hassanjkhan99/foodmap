import type {
  Candidate,
  DeliveryBranchRef,
  GeoPoint,
  Venue,
} from "@foodmap/domain";

/**
 * Ports (interfaces) for every external dependency. Concrete adapters are
 * wired by config; each port has a zero-key default. Provider payloads are
 * normalized behind the port and never leak into domain/GraphQL/UI. See ADR-0004.
 */

export interface BoundingBox {
  readonly minLat: number;
  readonly minLng: number;
  readonly maxLat: number;
  readonly maxLng: number;
}

export interface CatalogQuery {
  readonly center: GeoPoint;
  readonly radiusM: number;
}

/** Internal venue catalog (DB or fixtures). */
export interface CatalogProvider {
  nearby(query: CatalogQuery): Promise<Venue[]>;
}

/** External POIs (Google Places, etc.). No-op default. */
export interface PlacesProvider {
  nearby(query: CatalogQuery): Promise<Venue[]>;
}

/** A normalized branch resolved from the delivery platform. */
export interface DeliveryBranch {
  readonly ref: DeliveryBranchRef;
  readonly name: string;
  readonly isOpenNow: boolean;
  readonly opensAtLabel?: string;
}

export interface DeliveryQuote {
  /** minor currency units (PKR paisa) */
  readonly minSubtotalMinor: number;
  readonly deliveryFeeMinor: number;
  readonly currency: string;
}

/** Adapter to the Herald food-delivery platform (network GraphQL). See ADR-0002/0003. */
export interface DeliveryPlatformClient {
  getBranch(ref: DeliveryBranchRef): Promise<DeliveryBranch | null>;
  quote?(ref: DeliveryBranchRef): Promise<DeliveryQuote | null>;
  /** Deep-link into Herald's PWA: /r/<slug>?branch=&item= */
  buildBranchUrl(ref: DeliveryBranchRef, opts?: { itemId?: string }): string;
  buildMenuUrl(ref: DeliveryBranchRef): string;
}

/** Strictly-schema'd analytics events (privacy-safe; no coords/names). */
export interface AnalyticsEvent {
  readonly type: string;
  readonly schemaVersion: number;
  readonly sessionId: string;
  readonly props?: Readonly<Record<string, string | number | boolean>>;
}

export interface AnalyticsSink {
  record(events: readonly AnalyticsEvent[]): Promise<void>;
}

export interface FoodMapCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
}

/** Map renderer abstraction — mock default, Google Maps JS later. */
export interface MapRenderer {
  readonly kind: "mock" | "google";
  render(input: {
    center: GeoPoint;
    candidates: readonly Candidate[];
    selectedId?: string;
  }): void;
  destroy(): void;
}
