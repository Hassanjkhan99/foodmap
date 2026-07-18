# FoodMap — Assumptions & Open Questions

## Assumptions

1. **Design delivered as markdown specs + `tokens.json`** (no Figma this round; Claude
   Designer/Figma not runnable here). See [ADR-0010](../adr/0010-design-as-markdown-tokens.md).
2. **Repo is private**; proprietary license ([ADR-0009](../adr/0009-repository-license.md)).
3. **Herald is reached over the network only** (mock adapter now, real in Phase 2);
   `DeliveryBranchRef = {restaurantSlug, branchId?}`; unauthenticated deep-link handoff.
4. **Locale = Pakistan** (Herald parity): PKR minor units, `+92` phones, PKT timezone.
5. Real Herald wiring, PostGIS code, and the PWA are **later phases**, tracked as issues.
6. Stack versions follow Herald parity and are **pinned at implementation time**.

## Liquid Glass — resolved tension (validate in a real device/sunlight test)

The product spec requires **sunlight legibility, low distraction while moving, and never
reducing contrast**, and originally said to *avoid contrast-reducing glass*. The chosen
**Liquid Glass** aesthetic is reconciled with these via **Adaptive Contrast**
([handoff §1](foodmap-design-handoff.md), [tokens `glass`](tokens.json)):

- Glass renders only on **chrome/overlays** in calm contexts (`stationary_rich`,
  `passenger_rich`, pre-session).
- It **auto-degrades to solid, full-opacity surfaces** in `moving_compact`/`unknown_compact`,
  bright ambient light, `prefers-reduced-transparency`, `prefers-contrast: more`,
  `forced-colors`, or when `backdrop-filter` is unsupported.
- Reading content never sits directly on translucency; all text-on-glass meets **AA ≥4.5:1**.

**Open validation items:**
- Confirm real-world sunlight legibility of the `stationary_rich` glass tints on target devices.
- Decide the **ambient-light trigger source** (Ambient Light Sensor API is limited/unavailable
  on many browsers) — fallback may be manual "high-contrast" toggle + time-of-day heuristic.
- Confirm `backdrop-filter` performance budget on low-end Android during an active map session
  (glass must not cost frames while the map renders).

## Other open questions

- **Prototypes:** clickable prototypes / a Figma project are **deferred**; do we commission a
  visual pass later, or treat the built PWA as the visual source of truth?
- **Ambient-light / "driver vs passenger":** exact heuristics for `MotionContext` thresholds
  and when to *offer* passenger mode (never assume) need field tuning.
- **Cuisine taxonomy:** align FoodMap's allowlisted cuisines with Herald's `CUISINE_TAGS`, or
  maintain an independent list with a mapping?
- **Attribution formats:** exact provider attribution strings depend on the chosen places
  provider's TOS (finalize in Phase 3).
- **Result-count bounds:** default 5; confirm the server hard max.
- **Detour thresholds:** default max-detour value and shortlist size for exact detour compute.
- **Analytics store:** confirm Postgres analytics sink schema + retention.
