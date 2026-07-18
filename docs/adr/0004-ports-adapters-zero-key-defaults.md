# ADR-0004 — Ports & adapters with zero-key fixture defaults

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap depends on external providers (places, routes, map, Herald) that require credentials
and cost money. Local development, CI, and deterministic testing must not require keys or make
billable calls, and provider outages must not break the core experience.

## Decision

Define **ports** (interfaces) for every external dependency — `CatalogProvider`,
`PlacesProvider`, `RouteProvider`, `MapRenderer`, `DeliveryPlatformClient`, `AnalyticsSink`,
`FoodMapCache`, `RuntimeConfigProvider` — and wire concrete adapters via typed config. Every
port ships a **zero-key default** (fixture/mock/no-op). Provider payloads are normalized behind
the port and never leak into domain/GraphQL/UI contracts.

## Consequences

- One documented command runs the full Phase-1 slice with **no external keys**.
- CI uses simulation/fixture adapters; **no billable provider calls in tests**.
- Swapping providers is a config change, not a code rewrite.
- Requires each adapter to fully normalize provider quirks (money units, phone/tz formats).
