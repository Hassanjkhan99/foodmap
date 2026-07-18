# FoodMap — Failure & Degraded-State Matrix

Every degraded state must tell the user: **what happened**, **what remains usable**, and the
**safest recovery action**. Expected degradation is a **typed payload state**, not an
exception. Statuses map to `DiscoveryStatus` / `VenueDetailsPayload` in the API.

| Condition | What happened (user copy theme) | What remains usable | Safest recovery | Typed status |
|---|---|---|---|---|
| Permission denied | Location access is off | Manual area / demo mode | Choose an area, or enable in settings (no auto re-prompt) | `PERMISSION_DENIED` |
| Geolocation unavailable | Device can't provide location | Manual area / demo mode | Pick an area manually | `GEOLOCATION_UNAVAILABLE` |
| Acquiring location | Finding you… | Ahead skeleton | Wait; option to pick area | `ACQUIRING` |
| GPS accuracy too poor | Signal is weak | Last trustworthy candidates | Keep moving to open sky; refresh paused | `DEGRADED_GPS_ACCURACY` |
| Heading unknown | Direction not yet known | All nearby (not suppressed as "behind") | Keep moving to gain heading | `DEGRADED_HEADING_UNKNOWN` |
| Network offline | You're offline | Bounded current-session data | Reconnect; data preserved | `OFFLINE` |
| External places unavailable | Extra results are down | Internal venues | Retry later; internal results shown | `DEGRADED_PLACES_UNAVAILABLE` |
| Routes unavailable | Can't build the route | Food Radar | Switch to Radar | `DEGRADED_ROUTES_UNAVAILABLE` |
| Map renderer unavailable | Map can't load | Full **Ahead** view | Use Ahead; every action exists there | `DEGRADED_MAP_UNAVAILABLE` |
| Details/photo unavailable | Extra info is down | Compact card + actions | Retry; navigate/menu still work | `DEGRADED_DETAILS_UNAVAILABLE` |
| Exact detour unavailable | Can't compute exact detour | Candidate without detour value | Shown without detour (not approximated as exact) | `DEGRADED_DETOUR_UNAVAILABLE` |
| Delivery link unavailable | Menu link is down | Navigate + details | Retry; venue still navigable | `DEGRADED_DELIVERY_LINK_UNAVAILABLE` |
| No restaurants nearby | Nothing ahead right now | Filters, keep moving | Widen distance/time, keep moving | `NO_RESULTS` |
| All filtered out | Filters hid everything | Filter controls | Relax filters / reset session filters | `ALL_FILTERED` |
| Stale candidates | Results may be old | Last candidates (marked stale) | Refresh when safe | `STALE_CANDIDATES` |
| Session stopped | Session ended | Start screen (+ optional summary) | Start a new session | `SESSION_STOPPED` |
| Feature disabled (kill switch) | Temporarily unavailable | Whatever remains enabled | Try later | `FEATURE_DISABLED` |

## Provider failure behavior (headline rules)

- **Places fail → internal venues remain.**
- **Route fails → offer Radar.**
- **Exact detour fails → omit detour, keep candidate.**
- **Details/photo fail → retain compact card + actions.**
- **Map fails → use Ahead** (every map action also exists in Ahead).
- **Weak GPS → preserve last trustworthy state; stop unsafe refreshes.**
- **Offline → preserve bounded current-session data.**
- **Analytics fails → no customer impact.**
- **Kill switch → stop watcher + provider activity.**
