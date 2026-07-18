# ADR-0008 — Privacy: no raw GPS/route persistence; no exact-coordinate analytics

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap continuously reads precise location. Storing traces or emitting exact-location
analytics would create serious privacy and regulatory exposure with no product benefit for an
MVP focused on foreground discovery.

## Decision

- **Never persist:** raw GPS history, encoded route history, full provider payloads, provider
  photo bytes, provider reviews, destination text, inferred hunger profile, exact-location
  analytics.
- **Never record in analytics:** exact coordinates, route polyline, destination text,
  addresses, restaurant names, provider payloads, phone/email, arbitrary JSON.
- Analytics uses **allowlisted, versioned event schemas** only. Analytics failures are
  **non-blocking**. Logs are structured and redacted; exact coords are coarsened or omitted.

## Consequences

- Strong privacy posture by construction; smaller compliance surface.
- Product metrics rely on the funnel (`served → impression → selected → qualified`) using
  privacy-safe fields only.
- Some analyses (e.g. precise heatmaps) are intentionally impossible — acceptable for MVP.
