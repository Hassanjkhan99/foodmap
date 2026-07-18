# ADR-0002 — Herald integration via network GraphQL adapter only

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap must integrate with the Herald food-delivery platform (`Hassanjkhan99/food-delivery`)
for linked branches, menus, and ordering handoff. Recon of Herald established:

- Herald exposes a single **GraphQL endpoint** (`POST /api/graphql`, Yoga + Pothos) with a
  committed SDL (`apps/api/schema.graphql`). No REST, no external API keys/OAuth.
- **Licensing:** Herald **core** (`apps/api`, `apps/web`, `packages/db`, `packages/config`)
  is **AGPL-3.0-or-later**; only `packages/shared` (`@fd/shared`) is Apache-2.0. Linking AGPL
  code into FoodMap would impose AGPL network-copyleft on FoodMap.

## Decision

Integrate **only over the network** via a versioned `DeliveryPlatformClient` GraphQL adapter.
**Do not** import/vendor Herald core source, share its database, or duplicate its order/payment
state. If any Herald code is ever vendored, it may be **only** `@fd/shared` (Apache-2.0), and
even then via an explicit ADR.

## Consequences

- FoodMap stays clear of AGPL obligations.
- The adapter pins the Herald schema version it was generated against; mismatches degrade to a
  typed "delivery link unavailable" state (venue still navigable).
- All Herald calls are mockable; local/CI need no Herald instance (see ADR-0004).
- FoodMap cannot access Herald internals not exposed by the public GraphQL schema.
