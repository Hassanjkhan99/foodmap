# FoodMap — Runtime Kill Switches

One typed FoodMap runtime configuration exposes kill switches. When a switch is off, the client
receives a typed `FEATURE_DISABLED` state and the server **stops the relevant watcher/provider
activity**. Switches are read through `RuntimeConfigProvider` and versioned (`configVersion`
appears in responses).

| Switch | Effect when disabled | Fallback |
|---|---|---|
| `foodmap.global` | Entire FoodMap surface disabled | Static maintenance state |
| `foodmap.radar` | Food Radar mode disabled | Route mode (if enabled) |
| `foodmap.route` | Along-a-Route disabled | Radar mode |
| `foodmap.places.external` | External places provider off | Internal catalog only |
| `foodmap.places.details` | External details/photos off | Compact card + actions |
| `foodmap.map` | Map renderer off | Ahead view |
| `foodmap.analytics` | Analytics ingestion off | No customer impact |
| `foodmap.provider.google_places` | Disable a specific provider | Other providers / internal |
| `foodmap.provider.google_routes` | Disable a specific provider | Fixture/no-op route |

## Resilience controls (also config-driven)

Request deadlines · concurrency limits · request coalescing · per-provider cache policy ·
strict server budgets · circuit breakers · bounded retry · normalized provider status · rate
limits · redacted logging · internal-catalog fallback.

## Operational rules

- Flipping a switch must **immediately** halt the corresponding location watcher and in-flight
  provider requests for new sessions; existing sessions degrade to the typed state on next poll.
- Kill switches never require a deploy; they are runtime config.
- Every switch has a documented owner and a default (safe) value for local/CI (external
  providers **off** by default → zero-key operation).
