# ADR-0007 — GraphQL API with typed degraded payloads & opaque refs

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap's API must serve guests, degrade gracefully under provider failure, protect exact
location, and prevent clients from steering providers/ranking. GraphQL (Yoga + Pothos) matches
Herald's stack and gives typed clients via codegen.

## Decision

Expose a typed **GraphQL** API (Yoga + Pothos) with these rules:

- Guest discovery works; signed-in identity attached **server-side**; session IDs ≠ auth.
- **Expected degradation is a typed payload state**, not an exception (every discovery/route
  response carries `status`, `warnings[]`, `refreshAfterMs`, `configVersion`, `selectionVersion`).
- Route/venue references are **opaque, signed (HMAC), versioned, expiring**; clients can't
  submit provider names, ranking weights, field masks, or unbounded radius.
- Exact-location responses set cache headers preventing shared caching; exact coords never logged.

## Consequences

- Clients render degraded states declaratively; fewer error paths.
- Server retains control of providers/ranking/limits; safer, cheaper.
- Slightly richer payload envelopes; codegen keeps clients typed.
