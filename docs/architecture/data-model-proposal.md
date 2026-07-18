# FoodMap — Data Model Proposal

Typed core fields **plus** validated extensible metadata. PostgreSQL + PostGIS. Zod at every
persistence boundary. Provider payloads are normalized before storage; restricted payloads are
never permanently stored.

## Entities

### `RestaurantBrand`
- `id`, `canonicalName`, `slug`, `ownedMetadata (jsonb)`, `createdAt`, `updatedAt`.

### `Venue` (a physical location — the thing the user passes)
- `id`, `brandId`, `canonicalName`, `normalizedAddress`,
- `geom` — **PostGIS `geography(Point,4326)`** (the searchable point),
- `timezone`, `discoveryStatus`, `merchantVerificationState`,
- `deliveryBranchRef (jsonb, nullable)` — `{ restaurantSlug, branchId? }` (Herald link, optional),
- `createdAt`, `updatedAt`.
- Spatial index (GiST) on `geom` for corridor/bbox prefilter.

### `ExternalPlaceRef`
- `id`, `venueId`, `provider`, `externalId`, `status`, `lastValidatedAt`, audit trail.
- **Unique** on `(provider, externalId)`.
- External-only provider results remain **runtime candidates**; do **not** auto-create a
  permanent venue for every provider result.

### `VenueAttribute` (source-aware flexible metadata)
- `id`, `venueId`, `key` (**allowlisted**), `value (jsonb)`, `schemaVersion`,
- `sourceType` + `sourceRef`, `confidence` (internal only), `observedAt`, `verifiedAt`, `expiresAt`.
- Governed by a **versioned Zod key registry**. Initial keys:
  `venue.parking`, `venue.family_seating`, `venue.outdoor_seating`, `venue.entrance_notes`,
  `service.dine_in`, `service.takeaway`, `service.pickup`, `food.specialties`.
- Frequently-queried attributes are later promoted to typed columns via **additive** migrations.

### `FoodMapPreference` (versioned account-level JSON document)
- `primaryMeasure` (`TIME` | `DISTANCE`), `maxResults`, `preferredCuisines[]`, `openNow`,
  `maxMinutesAhead`, `maxMetresAhead`, `maxDetourMinutes`, `schemaVersion`.
- Guest preferences use the **same validated schema** locally (localStorage/IndexedDB).

## Runtime-only (not persisted) domain objects

`DiscoverySession`, `LocationSample`, `MotionContext`, `Route`, `RouteProgress`, `Corridor`,
`Candidate`, `CandidateExposure` — these live in the session, never in durable storage.

## Do NOT persist (privacy)

- raw GPS history;
- encoded route history;
- complete provider responses;
- provider photo bytes;
- provider reviews;
- destination search text;
- inferred hunger profile;
- exact-location analytics.

## Source & trust

Every displayed field carries internal `sourceType` (merchant-owned / FoodMap-owned /
delivery-linked / provider-owned / mixed / unknown). Provider-owned photos/ratings/reviews
carry `ProviderAttribution` and preserve it in the UI. Internal `confidence` and provider trust
rules are **never** exposed. Unknown → omitted or labelled unknown; never `0`/`false`.

## Attribute key registry (sketch)

```ts
// packages/domain — versioned, framework-free
export const VENUE_ATTRIBUTE_KEYS = {
  'venue.parking':        { v: 1, schema: z.enum(['none','street','lot','valet']) },
  'venue.family_seating': { v: 1, schema: z.boolean() },
  'venue.outdoor_seating':{ v: 1, schema: z.boolean() },
  'venue.entrance_notes': { v: 1, schema: z.string().max(280) },
  'service.dine_in':      { v: 1, schema: z.boolean() },
  'service.takeaway':     { v: 1, schema: z.boolean() },
  'service.pickup':       { v: 1, schema: z.boolean() },
  'food.specialties':     { v: 1, schema: z.array(z.string().max(60)).max(10) },
} as const;
```

## Migration policy

Additive only. New attribute keys bump the registry version. Promoting an attribute to a typed
column is an additive migration that backfills from `VenueAttribute` and leaves the JSONB in
place until fully cut over.
