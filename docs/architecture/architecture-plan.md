# FoodMap — Architecture Plan

## Repository shape — modular monorepo

pnpm workspaces + Turborepo. TypeScript strict.

```
apps/
  web/                  # Next.js App Router customer PWA
  api/                  # GraphQL API (Yoga + Pothos) + application services
packages/
  domain/               # framework-free FoodMap contracts + pure logic (geometry, discovery rules)
  db/                   # PostgreSQL/PostGIS schema + repositories
  ui/                   # reusable FoodMap UI (compact + rich variants)
  config/               # typed runtime configuration + kill switches
  integrations/         # shared integration contracts (ports) + generated GraphQL clients
  test-fixtures/        # deterministic GPS, route, and provider scenarios
docs/                   # product / design / architecture / adr / flows / operations
```

**Rule:** `packages/domain` imports nothing from a framework or a provider. Provider payloads
never reach domain, GraphQL, or UI contracts.

## Stack (pin exact versions at implementation; Herald parity)

pnpm 11 · Turborepo 2.5 · Node ≥22 · TypeScript 5.9 strict · Next.js App Router 16.x · React
19 · GraphQL Yoga 5 + Pothos 4 · Prisma 7 + PostgreSQL/PostGIS · graphql-codegen client-preset
(generated clients) · Tailwind v4 + accessible primitives · Zustand 5 (deterministic session
store) · Zod 3.25 (all boundaries) · Playwright (E2E) · OpenTelemetry-compatible observability
· structured redacted logs.

> Do not adopt preview/beta deps for core MVP paths without an ADR + fallback.

## Ports & adapters

Domain and application code depend on **ports** (interfaces); concrete **adapters** are wired
by config. Every port has a **zero-key default** so local/CI need no external credentials.

```ts
interface CatalogProvider       // internal DB catalog + deterministic fixtures
interface PlacesProvider        // external POIs (no-op default, Google later)
interface RouteProvider         // routes (no-op / fixture default, Google Routes later)
interface MapRenderer           // map draw surface (mock default, Google Maps JS later)
interface DeliveryPlatformClient// Herald network adapter (mock default, real GraphQL later)
interface AnalyticsSink         // event sink (memory/Postgres)
interface FoodMapCache          // memory default, optional Redis
interface RuntimeConfigProvider // typed config + kill switches
```

Initial adapters: internal DB catalog · fixture catalog · no-op places · Google Places ·
no-op route · Google Routes · fixture route · Herald GraphQL adapter · **mock Herald adapter**
· Google Maps JS renderer · mock map renderer · Postgres analytics sink · memory cache ·
optional Redis cache.

## Location engine (foreground state machine)

A **separate** FoodMap foreground location state machine — **not** a reused one-shot
delivery-address store. States:

`idle → checkingPermission → permissionRequired → acquiring → tracking → degraded`, plus
`denied`, `unsupported`, `paused`, `stopped`.

Rules: request permission **only after explicit action**; exactly **one** active watcher;
deterministic cleanup on stop/pause; validate coords/time/accuracy/speed/heading; derive
heading **only after accuracy-aware displacement**; circular-angle smoothing; hysteresis for
`MotionContext`; never claim "driver"; **no location persistence**; support a simulated
location driver (used in CI).

## Route & geospatial engine

- **PostGIS** for catalog prefiltering (bounding box / corridor).
- **Framework-free exact geometry** in `packages/domain`: decode+validate polyline; route
  length; project location/candidate onto route; derive **remaining** route; along-route +
  lateral distance; classify ahead / near-current / likely-passed / off-route / unknown;
  tolerate bounded GPS regression; detect material off-route; build corridor; compute **exact
  detour only for a small shortlist**. Never label a geometric approximation as an exact
  routed detour. Never call a route matrix for all candidates.

## Discovery engine

A separate FoodMap discovery service (not delivery-radius browse). Pipeline:

```
validated request
  -> internal catalog candidates
  -> external provider candidates
  -> normalize
  -> exact identity merge
  -> conservative probable-duplicate suppression
  -> geometry / ahead / corridor eligibility
  -> explicit user filters
  -> diversity (prevent chain flooding)
  -> session stability (preserve prior order within tolerance; dismissed cooldown)
  -> bounded candidate response (default 5, server-bounded)
```

Determinism: same input + config + clock → same output. Internal reason codes allowed; no
numeric score is displayed. Low-confidence heading must **not** suppress venues as "behind".
Venues without popularity/order history must still appear. Exact external links merge into one
source-aware candidate; uncertain fuzzy matches stay separate.

## Runtime configuration & resilience

One typed FoodMap runtime config with **kill switches** (global, Radar, Route, external
places, external details, map, analytics, per-provider) — see
[operations/kill-switches.md](../operations/kill-switches.md). Implement request deadlines,
concurrency limits, request coalescing, per-provider cache policy, strict server budgets,
circuit breakers, bounded retry, normalized provider status, rate limits, redacted logging,
and internal-catalog fallback. Failure behavior: see
[operations/failure-matrix.md](../operations/failure-matrix.md).

## Client session state

Zustand (or a small deterministic store): current `DiscoverySession`, presentation context,
selected candidate (shared across Map/Ahead), camera state (Follow/Manual/Recenter), session
filters vs saved defaults. Harmless location updates change values **in place** rather than
reorder the list.
