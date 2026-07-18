/**
 * Core FoodMap domain types. Framework- and provider-free.
 * Terms follow docs/product/glossary.md exactly.
 */

/** WGS84 coordinate. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/** One validated location observation. Never persisted as history. */
export interface LocationSample {
  readonly point: GeoPoint;
  /** epoch milliseconds */
  readonly timestamp: number;
  /** horizontal accuracy in metres (smaller is better) */
  readonly accuracyM: number;
  /** ground speed in m/s, if provided */
  readonly speedMps?: number;
  /** device-reported heading in degrees [0,360), if provided */
  readonly headingDeg?: number;
}

/** Derived motion state (hysteresis-smoothed). */
export type MotionContext = "unknown" | "stationary" | "slow" | "moving";

/** How the UI should present, derived from motion + explicit passenger opt-in. */
export type PresentationContext =
  | "moving_compact"
  | "unknown_compact"
  | "stationary_rich"
  | "passenger_rich";

/** A smoothed heading with a confidence in [0,1]. */
export interface Heading {
  readonly deg: number;
  readonly confidence: number;
}

export type SourceType =
  | "foodmap"
  | "merchant"
  | "delivery_linked"
  | "provider"
  | "mixed"
  | "unknown";

export type OpenState = "open" | "closed" | "unknown";

/** Reference to a branch in the food-delivery platform (Herald). */
export interface DeliveryBranchRef {
  readonly restaurantSlug: string;
  readonly branchId?: string;
}

/** A physical restaurant location FoodMap can display and route to. */
export interface Venue {
  readonly id: string;
  readonly brandId: string;
  readonly name: string;
  readonly point: GeoPoint;
  readonly cuisines: readonly string[];
  readonly openState: OpenState;
  readonly opensAtLabel?: string;
  readonly source: SourceType;
  readonly deliveryBranchRef?: DeliveryBranchRef;
  /** short distinguishing fact; omit when unknown (never fabricate). */
  readonly distinguishingFact?: string;
}

/** Capability-driven action a venue supports (declared, never inferred client-side). */
export type VenueActionKind =
  | "navigate"
  | "view_menu"
  | "start_delivery"
  | "start_pickup"
  | "call"
  | "report_incorrect"
  | "save";

export interface VenueAction {
  readonly kind: VenueActionKind;
}

/** Where a candidate sits relative to the traveller's direction of travel. */
export type AheadClass = "ahead" | "near_current" | "likely_passed" | "off_route" | "unknown";

/** A normalized venue considered by discovery, with derived geometry. */
export interface Candidate {
  readonly venue: Venue;
  /** great-circle distance from the traveller in metres */
  readonly distanceM: number;
  /** classification relative to travel direction */
  readonly aheadClass: AheadClass;
  /** internal ordering score (never displayed) */
  readonly score: number;
  /** internal, human-readable reasons (never displayed) */
  readonly reasons: readonly string[];
  readonly actions: readonly VenueAction[];
}
