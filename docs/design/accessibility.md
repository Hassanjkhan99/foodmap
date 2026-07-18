# FoodMap — Accessibility Notes

Accessibility is a launch requirement, not a polish pass. The **core journey must be fully
usable through the Ahead view without a map**.

## Global requirements

- **Semantic controls** (buttons, lists, radiogroups, dialogs) — no div-only interactives.
- **Focus management:** sheets/dialogs trap focus and **return focus** to the invoking control
  on close; when a candidate is removed from Ahead, focus moves to a stable neighbour, never lost.
- **Restrained live regions:** announce only meaningful changes (e.g. "3 new places ahead",
  selection change) — never every GPS tick or in-place value patch.
- **No color-only status:** open/closed/unknown, source, and detour always pair color with an
  **icon + text label**.
- **Text scaling:** support up to 200% without truncation or loss of function; layouts reflow.
- **Touch targets:** ≥44px (rich), ≥56px (moving).
- **Reduced motion (`prefers-reduced-motion`):** no camera animation, no row-reshuffle
  animation; values update instantly in place.
- **Reduced transparency (`prefers-reduced-transparency`) & `prefers-contrast: more` &
  `forced-colors`:** **disable Liquid Glass** — render solid `glass.*.fallbackSurface` at full
  opacity (see [tokens.json `glass.adaptiveContrast`](tokens.json)). Text on any glass layer
  must meet **WCAG AA ≥4.5:1**; if a busy map backdrop threatens this, escalate tint or fall
  back to solid.
- **Contrast:** all text/icons meet AA in light **and** dark; sunlight legibility validated.

## Per-interaction notes

| Interaction | Accessibility behavior |
|---|---|
| Permission education/denied | Focus trapped in sheet; primary/secondary clearly labelled; **no auto re-prompt**; manual mode reachable by keyboard/screen reader |
| Acquiring location | `aria-busy`; status announced once; Cancel focusable |
| Map ↔ Ahead toggle | `radiogroup`; selection preserved and announced on switch |
| Marker/row selection | Shared selection; selecting a marker announces the venue and highlights its Ahead row (and vice-versa) |
| Compact venue card | ≥56px targets; ≤2 actions; unsupported actions omitted (not announced as disabled) |
| Rich details sheet | Focus trap + return; attribution readable by screen reader; unknown fields announced as "Not available", never 0/false |
| Navigation chooser | User-initiated; each target labelled; copy-address fallback focusable |
| Filters | Chips are labelled toggle buttons; grouped fields; changes announced succinctly |
| Degraded banners | `role="status"`/`alert` used sparingly; one clear recovery action |
| Session stop | Confirms teardown; summary contains counts only (no coords/names) |

## Verification checklist (per UI issue)

- Keyboard-only pass (tab order, focus return, no traps except intended dialogs).
- Screen-reader pass (VoiceOver/NVDA): names, roles, states, restrained announcements.
- 200% text + small-viewport reflow.
- `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`, `forced-colors`
  all exercised — confirm glass → solid fallback and AA contrast.
- Ahead-only run of the full journey with the map disabled.
- Automated axe checks in Playwright for each surface.
