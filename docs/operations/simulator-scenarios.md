# FoodMap — Simulator Scenario Coverage

Deterministic scenarios live in `packages/test-fixtures/src/scenarios.ts`
(`SCENARIO_LIBRARY_VERSION`) and are executed as checkpoint tests in
`packages/test-fixtures/test/scenarios.test.ts`. Bump the library version whenever a
scenario's expected outcome changes.

Two families:
- **MOTION_SCENARIOS** — synthetic GPS tracks (+ optional route) run through the heading /
  motion / route engines.
- **DISCOVERY_SCENARIOS** — catalog + stepped requests run through the discovery pipeline.

## Coverage vs the master scenario matrix

| Required scenario | Status | Where |
|---|---|---|
| Straight route | ✅ | `straight-eastbound` |
| Restaurants ahead and behind | ✅ | `ahead-and-behind` |
| Stationary GPS drift | ✅ | `stationary-drift` |
| Heading wrap 359°→1° | ✅ | `heading-wrap-north` |
| Unknown heading | ✅ | `unknown-heading-start` |
| Route turns | ✅ | `route-turn-L` |
| Route loop | ✅ | `route-loop` |
| Short GPS regression | ✅ | `short-gps-regression` |
| Real U-turn | ✅ | `real-u-turn` |
| Accelerate from stop | ✅ | `accelerate-from-stop` |
| Linked duplicate | ✅ | `linked-duplicate` |
| Similar neighbouring restaurants | ✅ | `similar-neighbors` |
| New market without popularity | ✅ | `new-market` |
| Chain flooding / diversity | ✅ | `chain-flooding` |
| Selected candidate passed | ✅ | `selected-candidate-passed` |
| Denied then granted permission | ✅ | `packages/domain` location state-machine tests |
| All filters empty | ✅ | `packages/domain` discovery tests (`ALL_FILTERED`) |
| Out-of-order responses | ✅ (partial) | `apps/web` controller coalescing test |
| Off-route recovery | ⏳ Phase 4 | needs the route corridor + off-route classifier |
| Detour partial failure | ⏳ Phase 4 | needs the route detour shortlist |
| Provider timeout | ⏳ Phase 3 | needs the external Places provider + resilience |
| Map failure → Ahead fallback | ⏳ Phase 3 | needs the real map renderer; Ahead-only path already works |
| Offline reconnect | ⏳ Phase 5 | needs offline session buffering |

⏳ scenarios depend on engine/app layers not yet built; they will be added to the library as
those phases land, each with expected checkpoints. Nothing here is faked — pending scenarios
are omitted rather than stubbed green.

## Using scenarios

- **Tests/CI:** the checkpoint test iterates every scenario; no real GPS or provider calls.
- **PWA demo:** the in-app simulated driver (`apps/web` "Try demo") replays a straight-eastbound
  drive built from the same `simulateDrive` primitive, so app and tests stay consistent.
