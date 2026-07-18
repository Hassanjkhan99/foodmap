# FoodMap — API Contract Proposal

FoodMap exposes its **own** typed GraphQL API (Yoga + Pothos). Herald is reached only through
the `DeliveryPlatformClient` adapter (network GraphQL). This document proposes both.

## Principles

- **Guest discovery works.** Signed-in identity is attached **server-side**; a session ID is
  **not** authentication.
- **Expected degradation is a typed payload state, not an exception.** Every discovery/route
  response carries `status`, `warnings[]`, `refreshAfterMs`, `configVersion`, `selectionVersion`.
- **Opaque, signed, versioned, expiring refs** for routes and venues. The client cannot submit
  provider names, ranking weights, field masks, or an unbounded radius.
- **Privacy:** exact coordinates are never logged; responses for exact-location discovery send
  cache headers preventing shared caching.
- Capability-driven actions: venue actions are declared server-side (see data model).

## FoodMap GraphQL operations

```graphql
# Capabilities + kill-switch-aware feature flags for the client shell.
query foodMapCapabilities: FoodMapCapabilities!

# Create a normalized route from a chosen destination (Along a Route mode).
mutation foodMapCreateRoute(input: CreateRouteInput!): CreateRoutePayload!

# The core discovery call. Guest-callable. Returns a typed, possibly-degraded payload.
query foodMapDiscover(input: DiscoverInput!): DiscoverPayload!

# Lazy, richer details for one venue (stationary/passenger rich sheet).
query foodMapVenueDetails(ref: VenueRef!): VenueDetailsPayload!

# Preferences (saved defaults). Guest = local; signed-in = server-synced.
query myFoodMapPreferences: FoodMapPreferences!
mutation updateFoodMapPreferences(input: FoodMapPreferencesInput!): FoodMapPreferences!

# Strictly-schema'd, privacy-safe analytics events (fire-and-forget).
mutation recordFoodMapEvents(events: [FoodMapEventInput!]!): RecordEventsPayload!
```

### Representative input/payload shapes (illustrative)

```graphql
input DiscoverInput {
  mode: DiscoveryMode!          # RADAR | ROUTE
  location: GeoPointInput!      # lat/lng/accuracy/timestamp; heading optional
  heading: HeadingInput         # value + confidence (server decides suppression)
  motion: MotionContext!        # UNKNOWN | STATIONARY | SLOW | MOVING
  routeRef: RouteRef            # required for ROUTE mode (opaque, signed, expiring)
  filters: DiscoveryFiltersInput
  resultLimit: Int              # server-bounded (default 5, hard max e.g. 15)
  sessionId: ID!               # correlation only; NOT auth
  selectionVersion: Int         # client's last-seen selection version (stability)
}

input DiscoveryFiltersInput {
  cuisines: [String!]           # allowlisted cuisine tags
  openNow: Boolean
  emphasis: Emphasis            # TIME | DISTANCE
  maxMinutesAhead: Int
  maxMetresAhead: Int
  maxDetourMinutes: Int         # ROUTE mode
}

type DiscoverPayload {
  status: DiscoveryStatus!      # OK | DEGRADED_* | NO_RESULTS | ALL_FILTERED | ...
  warnings: [DiscoveryWarning!]!
  candidates: [Candidate!]!     # bounded, source-aware, ordered, ahead-first
  refreshAfterMs: Int!          # client throttling hint
  configVersion: String!
  selectionVersion: Int!
  attribution: [ProviderAttribution!]!  # required where provider content is present
}

type Candidate {
  ref: VenueRef!                # opaque, signed, expiring
  name: String!
  cuisine: [String!]!
  openState: OpenState!         # OPEN | CLOSED | UNKNOWN (+ opensAtLabel?)
  ahead: AheadInfo!             # time or distance ahead
  detour: DetourInfo            # exact only when available; else omitted
  distinguishingFact: String    # concise; omitted/unknown-labelled if absent
  actions: [VenueAction!]!      # capability-driven (NAVIGATE, VIEW_MENU, ...)
  source: SourceBadge!          # FOODMAP | MERCHANT | DELIVERY_LINKED | PROVIDER | MIXED | UNKNOWN
  photo: PhotoRef               # lazy; rich contexts only
}
```

`DiscoveryStatus` enumerates the degraded states in
[operations/failure-matrix.md](../operations/failure-matrix.md) (e.g. `DEGRADED_HEADING_UNKNOWN`,
`DEGRADED_PLACES_UNAVAILABLE`, `DEGRADED_DETOUR_UNAVAILABLE`, `STALE_CANDIDATES`).

### Contract rules

- Unknown values are **omitted or explicitly `UNKNOWN`** — never `0`/`false`.
- `VenueRef` / `RouteRef` are opaque signed tokens (HMAC + version + expiry); the server
  resolves them back to internal IDs. Clients never see internal IDs.
- `recordFoodMapEvents` accepts **only** allowlisted event types with versioned schemas; it
  drops (does not error) on unknown fields and never blocks discovery/navigation.

## `DeliveryPlatformClient` adapter contract (Herald)

Herald is a **network GraphQL** service (`POST /api/graphql`), versioned against its committed
`apps/api/schema.graphql`. **No REST, no shared DB, no code import.** A branch is referenced as
`DeliveryBranchRef = { restaurantSlug, branchId? }`.

```ts
interface DeliveryPlatformClient {
  // Resolve a live branch for a linked venue (Herald: branchBySlug(slug, branchId)).
  getBranch(ref: DeliveryBranchRef): Promise<DeliveryBranch | null>;

  // Optional geo listing to help catalog linking/enrichment (Herald: browseBranches).
  browseNearby(input: { lat: number; lng: number; filter?: BrowseFilter }): Promise<DeliveryBranchSummary[]>;

  // Unauthenticated pricing/ETA preview for a compact "from Rs X" hint (Herald: quoteCart).
  quote(input: QuoteInput): Promise<DeliveryQuote | null>;

  // Build safe deep-link URLs into Herald's PWA for the handoff.
  buildBranchUrl(ref: DeliveryBranchRef, opts?: { itemId?: string }): string; // /r/<slug>?branch=&item=
  buildMenuUrl(ref: DeliveryBranchRef): string;
}
```

### Herald-grounded facts baked into the adapter

- **Ordering handoff is an unauthenticated deep-link** to `/r/<slug>?branch=<branchId>&item=<dishId>`.
  Herald owns identity (phone-OTP → first-party HttpOnly `fd_session` cookie); there is **no
  external token/OAuth handoff**. `/checkout` is auth-gated and degrades to Herald's own
  `/login?next=…`. FoodMap **cannot** attach a signed-in identity across origins.
- **Normalize Herald payloads** (branch, hours, open-state, money) into FoodMap domain types.
  Herald money is **PKR minor units**; phone is `+923\d{9}`; timezone **PKT (UTC+5)**;
  open-state is `Branch.isOpenNow` + `opensAtLabel`.
- Never bypass Herald's server-side ordering rules; FoodMap only **links out**.
- Default wiring is the **mock adapter** (deterministic branch fixtures) — no Herald instance
  or keys required for local/CI. Real adapter is Phase 2.
- Subscriptions: don't rely on Herald live order push (in-memory pubsub on Vercel); if FoodMap
  ever needs order state, poll. (MVP does not track orders.)

## Versioning & compatibility

- FoodMap GraphQL is additive; breaking changes go through a schema version bump + ADR.
- The Herald adapter pins the Herald schema version it was generated against; a mismatch
  surfaces as a typed `DEGRADED_DELIVERY_LINK_UNAVAILABLE` (venue still shows navigate).
