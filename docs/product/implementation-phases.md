# FoodMap — Implementation Phases

Do not build the whole product in one PR. Each phase has entry/exit criteria and is tracked as
GitHub issues under the epic.

## Phase 0 — Product & Architecture (this session)

**Deliver:** product spec, glossary, user flows, ADRs, repository scaffold, design handoff
docs, phase plan, issue backlog, CI stub.
**Exit:** the planning set is internally consistent; epic + Phase 0/1 issues exist; docs
pushed to `main`.

## Phase 1 — Zero-key vertical slice

Build a working end-to-end **Radar** experience with **no Google credentials**:

- fixture catalog; PostGIS/internal catalog path;
- simulated location driver; foreground location state machine;
- Radar discovery service; minimal `foodMapDiscover` GraphQL op;
- PWA entry/session shell; Ahead view; mock map renderer; compact venue card;
- internal Herald **mock** `DeliveryPlatformClient`; core analytics event interfaces;
- unit + integration + Playwright happy path.

**Exit — Definition of Done for the first vertical slice:**
- one-command local startup; user opens `/foodmap`; user explicitly starts Radar;
- simulated location begins moving; internal seeded venues appear in Ahead;
- behind venues suppressed **only after** heading confidence is established;
- selection opens a compact venue card; internal-linked venue opens a mock/real Herald
  branch URL; navigation URL generated safely;
- **Stop clears watchers, timers, and requests**; no external keys required;
- deterministic unit/integration/Playwright tests pass; architecture + user-flow docs
  committed; issues updated with evidence and remaining blockers.

## Phase 2 — Real catalog & Herald integration

FoodMap DB entities; Herald GraphQL adapter (real `DeliveryPlatformClient`); exact branch
linking (`branchBySlug`); preferences (saved defaults vs session filters); source precedence;
internal branch/menu handoff via `/r/<slug>` deep-links.

## Phase 3 — External places & map

Google Places adapter; Google Maps JS renderer behind `MapRenderer`; attribution; lazy
details/photos; provider resilience + cost controls (deadlines, coalescing, circuit breakers,
field masks). No external key required for local/CI.

## Phase 4 — Route discovery

Route provider (fixture + Google Routes); corridor + progress; exact shortlist detours only;
route setup + Route Map/Ahead UI; off-route/reroute/provider-failure states.

## Phase 5 — Pilot quality

Analytics storage/funnel; catalog quality reporting; complete simulator scenarios;
performance/load/privacy checks; launch criteria.

## Phase 6 — Vehicle feasibility only (spike)

After PWA validation: Android Auto POI spike; CarPlay entitlement/quick-ordering spike. **No
production vehicle client** until a separate decision.

## Failure matrix (summary)

See [operations/failure-matrix.md](../operations/failure-matrix.md). Headlines: Places fail →
internal venues remain; Route fails → offer Radar; detour fails → omit detour, keep candidate;
details/photo fail → keep compact card + actions; Map fails → use Ahead; weak GPS → preserve
last trustworthy state, stop unsafe refreshes; offline → preserve bounded session data;
analytics fail → no customer impact; kill switch → stop watcher + provider activity.
