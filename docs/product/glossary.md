# FoodMap Glossary — Canonical Domain Language

Use these terms **exactly and consistently** across code, GraphQL, UI, tests, and docs. Do
**not** use *restaurant / place / store / branch / location / venue* interchangeably.

| Term | Definition | Notes / distinctions |
|---|---|---|
| **RestaurantBrand** | Brand-level identity (the name/logo a chain or independent shares across locations). | Not a physical place. A brand has one or more `Venue`s. |
| **Venue** | A **physical** restaurant branch/location that FoodMap can display and route to. | The unit the user physically passes. Has a geo point, timezone, hours. May optionally link to one Herald `DeliveryBranchRef`. |
| **ExternalPlaceRef** | A stable identity for a venue from an external provider (e.g. Google Places). | We store only the allowed stable external ID + FoodMap-owned data — never a permanent copy of restricted payloads. |
| **DeliveryBranchRef** | A reference to a branch in the food-delivery platform (Herald). | `{ restaurantSlug: string, branchId?: string }`. Resolved via Herald `branchBySlug`. Optional — most venues have none. |
| **DiscoverySession** | An explicit, foreground FoodMap session the user starts and stops. | No background tracking. Owns the active location watcher + candidate state. |
| **LocationSample** | One validated location observation (coords, time, accuracy, speed, heading). | Validated at ingestion; never persisted as history. |
| **MotionContext** | Derived motion state: `unknown` \| `stationary` \| `slow` \| `moving`. | Uses hysteresis. Drives presentation context. Never asserts "driver". |
| **Route** | A provider-normalized route (decoded/validated polyline + metadata). | Only in *Along a Route* mode. |
| **RouteProgress** | The user's current projected position along the route. | Feeds ahead/passed/off-route classification. |
| **Corridor** | The searchable area around the **remaining** route. | Used to prefilter candidates; not the travelled route. |
| **Candidate** | A normalized venue considered by the discovery pipeline. | Internal-catalog and external-provider results are normalized into candidates before merge/filter. |
| **CandidateExposure** | Session-level history of which candidates were made visible. | Enables stability, cooldowns, dedup, and the analytics funnel. |
| **QualifiedDiscovery** | An impressed candidate followed by a high-intent action. | The numerator of the primary product metric. |
| **VenueAttribute** | Flexible, source-aware metadata about a venue (allowlisted key + JSONB value). | Versioned Zod key registry. Carries source type + provenance. |
| **ProviderAttribution** | Required provider/author attribution for provider-owned facts (photos, ratings, reviews). | Must be preserved wherever provider content is shown. |

## Presentation contexts

`moving_compact` · `unknown_compact` · `stationary_rich` · `passenger_rich`. The user may
**explicitly** enter passenger-rich mode. FoodMap never infers that the phone holder is the
driver.

## Motion vs presentation

`MotionContext` (motion truth) is distinct from **presentation context** (what the UI shows).
E.g. `moving` → `moving_compact`; `unknown` → `unknown_compact`; `stationary` →
`stationary_rich`; explicit passenger → `passenger_rich`.

## Herald (food-delivery) terms referenced

| Herald term | Meaning here |
|---|---|
| **Branch** | Herald's orderable location; maps to a FoodMap `Venue` via `DeliveryBranchRef`. |
| **Restaurant / slug** | Herald restaurant; `slug` is the durable public key used in `DeliveryBranchRef` and deep-links (`/r/<slug>`). |
| **quoteCart** | Unauthenticated Herald pricing preview (no order commit). |
