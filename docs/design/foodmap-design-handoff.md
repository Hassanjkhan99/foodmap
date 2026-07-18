# FoodMap — Design Handoff (Master)

Implementation-ready design specification. Pairs with
[tokens.json](tokens.json), [foodmap-user-flows.md](foodmap-user-flows.md),
[foodmap-component-inventory.md](foodmap-component-inventory.md),
[copy-deck.md](copy-deck.md), and [accessibility.md](accessibility.md).

> Design is delivered as specs + tokens (no Figma this round — see
> [ADR-0010](../adr/0010-design-as-markdown-tokens.md)). Clickable prototypes are deferred
> ([assumptions](assumptions-and-open-questions.md)).

---

## 1. Visual direction — **Liquid Glass** (warm-tinted) ✅ chosen

FoodMap's signature aesthetic is **Liquid Glass**: translucent, layered, "lensed" chrome —
sheets, banners, control bars and chips float as frosted glass over the live map, with a soft
top highlight and a hairline edge. Content color comes from restaurant imagery and merchant
branding; the glass chrome is warm-neutral tinted (ember accent used sparingly for the primary
action and the selected marker). Large tabular numerals for time/distance/detour.

### The one hard rule — **Adaptive Contrast**
The original product constraints (sunlight-legible, low-distraction while moving, never reduce
contrast) are non-negotiable and **override the glass look whenever they conflict**. Glass is
therefore an *adaptive* material, not a constant one:

- **Glass renders** in calm contexts: `stationary_rich`, `passenger_rich`, and all pre-session
  screens.
- **Glass falls back to a solid, full-opacity surface** (`glass.*.fallbackSurface`, no
  backdrop-filter) whenever **any** trigger fires:
  `moving_compact` / `unknown_compact` · `prefers-reduced-transparency: reduce` ·
  `prefers-contrast: more` · `forced-colors: active` · high ambient light (sunlight) where a
  reading is available · no `backdrop-filter` support.
- **Primary reading content is never placed directly on a translucent layer** — venue names,
  time/distance, and Ahead rows always sit on a solid content plate. Every text-on-glass
  combination must still meet **WCAG AA (≥4.5:1)**; if a busy map threatens that, escalate the
  tint (`thin → regular → thick`) or fall back to solid.

Recipe + all values live in `tokens.json → glass`. This is why the "sunlight-legible /
avoid-contrast-reducing-glass" guidance below and the glass aesthetic coexist: the material
yields to legibility automatically.

### Alternate considered — **Fresh Slate (flat)**
A flat, high-contrast, teal-on-white/near-black system with no translucency. Kept as the
**automatic fallback vocabulary** (its solid surfaces *are* what glass degrades to) and as a
no-transparency theme, but not the primary look.

---

## 2. Design system

- **Typography:** Inter; scale in tokens (`display/title/cardTitle/body/bodyStrong/meta`);
  `movingPrimary` (20px/700) is the floor for primary text in `moving_compact`. Tabular
  numerals for numeric fields.
- **Spacing:** 4px base scale (`space.1`–`space.10`).
- **Elevation & surface hierarchy:** `bg → surface → surfaceRaised`; `surfaceSunken` for
  insets. **Glass layers** (`glass.*`) sit above the map for chrome/overlays only — sheets,
  banners, control bars, chips — as `tint fill + backdrop-blur + top highlight + hairline
  border`, with a modal `scrim` behind sheets to lift contrast. Reading content sits on solid
  plates, not on the translucent layer. Glass obeys **Adaptive Contrast** (§1) and degrades to
  `glass.*.fallbackSurface`.
- **Color:** light + dark palettes in tokens. `brand` (ember) for primary action + selected
  marker only. **Status never color-only** — always icon + text.
- **Map tokens:** `markerSelected` (ember, larger), `markerUnselected` (dark), `markerBehind`
  (muted), `currentLocation` (blue dot + optional heading cone), `routePolyline` (remaining),
  `routePolylineTravelled` (muted, de-emphasized).
- **Cards / timeline rows / bottom sheets / chips / segmented controls / buttons:** see
  [component inventory](foodmap-component-inventory.md); each has **compact** and **rich**
  variants.
- **Loading states:** skeletons for Ahead rows and card; never block Ahead on the map.
- **Degraded banners:** one-line, icon + message + single recovery action (copy from
  [copy-deck.md](copy-deck.md) and [failure-matrix](../operations/failure-matrix.md)).
- **Attribution components:** provider/author attribution rendered wherever provider content
  (photo/rating/review) appears; never stripped.
- **Motion & reduced-motion:** `motion.*` tokens; in `moving_compact` no constant camera
  animation and no row reshuffle — values update **in place**; honor `prefers-reduced-motion`.
- **Touch targets:** min 44px (rich), **56px** (moving).
- **Iconography:** simple, filled-on-selected, consistent 24px grid; markers large enough to
  tap while moving (no tiny markers).

### Component variants: compact vs rich
Every content component ships a **compact** variant (moving/unknown — minimal fields, big
targets, few actions) and a **rich** variant (stationary/passenger — photos, full info, more
actions). The presentation context selects the variant; the user may explicitly enter
passenger-rich.

### Avoid
Glass that reduces contrast **below AA** (escalate tint or fall back to solid instead) · glass
on primary reading content (use a solid plate) · glass in `moving_compact`/sunlight/reduced-
transparency (Adaptive Contrast forces solid) · tiny markers · animated promotions · full-
screen restaurant photos while moving · long text on map overlays · nested interactive
controls · color-only status · constant camera animation · animating the blur itself while
moving.

---

## 3. Per-screen handoff

Each screen lists: **Purpose · Entry · States/variants · Data · Actions · Responsive ·
Moving-vs-rich · Loading/empty/error · A11y · Analytics · Impl notes · Acceptance.** Analytics
events use privacy-safe, versioned schemas (never coords/names/addresses).

### S1 — Entry / value screen
- **Purpose:** explain FoodMap value + foreground-only location before any prompt.
- **Entry:** app open / cold start.
- **States:** default; returning user (skips straight to mode select).
- **Data:** none (static copy).
- **Actions:** Continue → mode selection.
- **Responsive:** single column mobile; centered card tablet/desktop.
- **Moving/rich:** n/a (pre-session).
- **Loading/empty/error:** none.
- **A11y:** headings, focusable Continue, readable in dark + large text.
- **Analytics:** `app_opened`, `value_screen_viewed`.
- **Impl:** no location API touched here.
- **Acceptance:** no permission prompt fires; Continue advances.

### S2 — Mode selection
- **Purpose:** choose **Food Radar** or **Along a Route**.
- **Entry:** from S1 / app home.
- **States:** default; route-disabled (kill switch) → Radar only + note.
- **Data:** `foodMapCapabilities`.
- **Actions:** Start Radar; Start Route; open manual-area/demo.
- **Responsive:** two large cards.
- **Moving/rich:** n/a.
- **Loading/empty/error:** capabilities loading skeleton; if global disabled → maintenance state.
- **A11y:** each mode a labelled button ≥56px.
- **Analytics:** `mode_selected {mode}`.
- **Impl:** selecting a mode is the "explicit action" gating permission.
- **Acceptance:** permission requested only after a mode is chosen.

### S3 — Permission education
- **Purpose:** explain *why* location is needed just before the OS prompt.
- **Entry:** after mode chosen, permission not yet granted.
- **States:** grant · dismiss · deny · previously-granted (skip) · unsupported.
- **Data:** none.
- **Actions:** Allow location (triggers OS prompt); Use manual area / demo.
- **Responsive:** sheet on mobile.
- **A11y:** clear primary/secondary; focus trapped in sheet, returns on close.
- **Analytics:** `permission_education_viewed`, `permission_prompt_requested`.
- **Impl:** exactly one OS prompt per explicit action; no auto re-prompt.
- **Acceptance:** dismiss → no loop; manual mode always reachable.

### S4 — Permission denied
- **Purpose:** recover gracefully after denial.
- **Entry:** OS prompt denied, or previously denied.
- **States:** denied; unsupported (variant copy).
- **Actions:** Use manual area; Try demo; How to enable (deep-link to OS settings info, no
  forced re-prompt).
- **Analytics:** `permission_denied`, `manual_mode_started`.
- **Acceptance:** no repeated prompts; app remains usable.

### S5 — Acquiring location
- **Purpose:** transitional state while first fix is obtained.
- **Entry:** permission granted, no trustworthy fix yet.
- **States:** acquiring; slow-acquire (>Ns) → offer manual area.
- **Data:** location machine state.
- **Actions:** Cancel → stop; Pick area.
- **Loading:** Ahead skeleton visible.
- **Analytics:** `location_acquiring`.
- **Acceptance:** cancel tears down watcher.

### S6 — Food Radar Map (moving_compact)
- **Purpose:** map of ahead candidates while moving.
- **Entry:** Radar tracking with map enabled.
- **States:** heading-unknown (no behind-suppression) · heading-confident · follow/manual/recenter camera · stale.
- **Data:** `foodMapDiscover(mode:RADAR)` candidates, current location, heading.
- **Actions:** select marker; switch to Ahead; Recenter; Stop; open quick filters.
- **Moving/rich:** compact markers/labels only; no full photos; low motion.
- **Loading/empty/error:** map fail → Ahead; no results → prompt widen/keep moving.
- **A11y:** map has an equivalent Ahead; controls ≥56px.
- **Analytics:** `candidate_served`, `candidate_impression`, `view_switched {to:map}`.
- **Impl:** advanced markers; stable marker lifecycle; no constant camera animation; manual pan never snaps back.
- **Acceptance:** behind suppressed only when heading trustworthy; selection shared with Ahead.

### S7 — Food Radar Ahead (moving_compact)
- **Purpose:** scannable chronological list of upcoming venues.
- **Entry:** Radar tracking, Ahead view (also the map-fail fallback).
- **States:** normal; heading-unknown; stale; empty; all-filtered.
- **Data:** same candidate collection as S6.
- **Actions:** select row → compact card; switch to Map; Stop; quick filters.
- **Moving/rich:** compact rows (name, ahead, cuisine, open, detour?); values update in place.
- **Loading/empty/error:** skeleton rows; empty/all-filtered copy.
- **A11y:** list semantics; restrained live-region for meaningful changes only.
- **Analytics:** `candidate_impression`, `candidate_selected`.
- **Impl:** harmless updates never reorder; row values patch in place.
- **Acceptance:** fully usable with no map.

### S8 — Route destination setup
- **Purpose:** choose a destination to build a route.
- **Entry:** Along-a-Route selected.
- **States:** input; building; provider-failure → offer Radar.
- **Data:** `foodMapCreateRoute`.
- **Actions:** set destination; start; cancel.
- **Analytics:** `route_setup_started`, `route_created` (no destination text logged).
- **Acceptance:** provider failure offers Radar; destination text never persisted/logged.

### S9 — Route Map (moving_compact)
- **Purpose:** remaining route + ahead candidates on map.
- **Entry:** route active, map enabled.
- **States:** on-route; off-route; rerouting; camera states; stale.
- **Data:** route (remaining), `RouteProgress`, candidates with detour.
- **Actions:** select; switch to Ahead; Recenter; Stop.
- **Moving/rich:** remaining polyline only (travelled de-emphasized); compact markers.
- **Loading/empty/error:** route fail → Radar; map fail → Ahead; detour fail → omit detour.
- **Analytics:** `candidate_impression`, `offroute_detected`.
- **Acceptance:** shows remaining route; passed venues drop without chaotic movement.

### S10 — Route Ahead (moving_compact)
- **Purpose:** chronological upcoming venues along route.
- **Entry:** route active, Ahead view.
- **States:** normal; off-route; stale; empty; all-filtered.
- **Data:** candidates with `ahead` + `detour?`.
- **Actions:** select; switch to Map; Stop; quick filters.
- **Acceptance:** detour shown only when exact; otherwise omitted.

### S11 — Stationary rich Map/Ahead split
- **Purpose:** richer combined browsing when stopped/passenger.
- **Entry:** `stationary_rich` or explicit passenger mode.
- **States:** split (map + list); single-pane on small screens.
- **Data:** candidates + lazy details/photos.
- **Actions:** all rich actions; full filters; enter/exit passenger mode.
- **Responsive:** side-by-side tablet/desktop; stacked mobile.
- **Analytics:** `passenger_mode_entered`, `details_opened`.
- **Acceptance:** richer density only when not moving; explicit passenger toggle.

### S12 — Quick filters (compact)
- **Purpose:** fast, safe filter tweaks while moving.
- **Entry:** filter button in session shell.
- **States:** open; applied.
- **Data:** session filters.
- **Actions:** cuisine chips, Open Now, distance/time quick set; Reset session filters.
- **Moving/rich:** few large chips; no deep settings.
- **Analytics:** `filters_changed {session:true}`.
- **Acceptance:** changes apply to **session only**, not defaults.

### S13 — Full filters & preferences (rich)
- **Purpose:** complete filter + saved-default management.
- **Entry:** stationary/passenger, or settings.
- **States:** editing; saved.
- **Data:** `myFoodMapPreferences`, session filters.
- **Actions:** cuisine multi-select; Open Now; time↔distance emphasis; max time/distance
  ahead; max detour; result count; Reset session; **Save as default**.
- **Analytics:** `preferences_saved`.
- **Acceptance:** session vs saved defaults clearly separated; Save as Default explicit.

### S14 — Compact venue card
- **Purpose:** minimal decision surface while moving.
- **Entry:** select a candidate in moving/unknown.
- **States:** FoodMap/Herald-linked; external-only; mixed; open/closed/unknown.
- **Data:** name, ahead, cuisine, openState, detour?, capability actions, source badge.
- **Actions:** Navigate; View Menu **only if supported**; dismiss (cooldown).
- **Moving/rich:** no photos/reviews; ≤2 primary actions.
- **Analytics:** `candidate_selected`, `navigate_started`, `menu_opened`.
- **Acceptance:** unsupported actions omitted; external-only never implies ordering.

### S15 — Rich venue details sheet
- **Purpose:** full info when safe.
- **Entry:** select in stationary/passenger, or expand card.
- **States:** by source (owned/linked/external/mixed); details/photo loading/unavailable.
- **Data:** `foodMapVenueDetails` — image, rating+count, address, hours, entrance/parking
  notes, specialties, delivery/pickup availability, source + attribution.
- **Actions:** Navigate; View Menu; Start pickup/delivery (linked only); Call; Report incorrect.
- **Loading/empty/error:** details/photo fail → keep compact card + actions; unknown fields
  omitted/labelled.
- **A11y:** sheet focus trap + return; attribution readable.
- **Analytics:** `details_opened`, `report_incorrect_started`.
- **Acceptance:** attribution preserved; unknown never shown as 0/false.

### S16 — Navigation app chooser
- **Purpose:** hand off to an installed nav app.
- **Entry:** Navigate action.
- **States:** choices (Google/Apple/other); copy-address fallback.
- **Data:** venue coordinates/address; built URLs.
- **Actions:** open chosen app; copy address; cancel.
- **Impl:** build with `URL`/`URLSearchParams`; omit stale origin by default; do not assume an
  app is installed; **user action only**.
- **Analytics:** `navigate_started {target}`.
- **Acceptance:** safe URLs; browser/copy fallback present.

### S17 — Internal restaurant/menu handoff (Herald)
- **Purpose:** open the linked Herald branch/menu/pickup.
- **Entry:** View Menu / Start pickup on a linked venue.
- **States:** linked (deep-link); link unavailable (degraded).
- **Data:** `DeliveryBranchRef` → `/r/<slug>?branch=&item=`.
- **Actions:** open Herald PWA; back to FoodMap.
- **Impl:** unauthenticated deep-link; Herald owns auth/checkout; never bypass its rules.
- **Analytics:** `menu_opened {linked:true}`, `pickup_started`.
- **Acceptance:** external-only venues never reach this; degraded → navigate still works.

### S18 — External-only venue
- **Purpose:** show a provider-only venue honestly.
- **Entry:** select an external-only candidate.
- **States:** compact/rich; attribution present.
- **Data:** provider fields + attribution; **no** ordering capabilities.
- **Actions:** Navigate; allowed details; Report incorrect.
- **Acceptance:** no delivery/pickup actions; attribution shown; no ordering implication.

### S19 — No-results state
- **Purpose:** nothing ahead right now.
- **Entry:** discovery returns empty (`NO_RESULTS`).
- **Actions:** widen distance/time; keep moving; change mode.
- **Analytics:** `no_results_shown`.
- **Acceptance:** explains + offers recovery.

### S20 — All-filtered state
- **Purpose:** results exist but filters hid them.
- **Entry:** `ALL_FILTERED`.
- **Actions:** relax filters; Reset session filters.
- **Acceptance:** distinct from No-results; one-tap reset.

### S21 — Weak GPS state
- **Entry:** `DEGRADED_GPS_ACCURACY`.
- **Behavior:** preserve last trustworthy candidates; pause unsafe refreshes; banner.
- **Analytics:** `gps_degraded`.
- **Acceptance:** no jittery reshuffle; clear recovery.

### S22 — Offline state
- **Entry:** `OFFLINE`.
- **Behavior:** preserve bounded current-session data; banner; retry on reconnect.
- **Acceptance:** no crash; session data retained within bounds.

### S23 — Provider partial-failure state
- **Entry:** `DEGRADED_PLACES_UNAVAILABLE` / `DEGRADED_DETAILS_UNAVAILABLE` / `DEGRADED_DETOUR_UNAVAILABLE`.
- **Behavior:** internal results remain; detour/details omitted gracefully; banner.
- **Acceptance:** partial results, never a hard failure.

### S24 — Map failure with Ahead fallback
- **Entry:** `DEGRADED_MAP_UNAVAILABLE`.
- **Behavior:** Ahead fully functional; every map action available in Ahead; banner + retry.
- **Acceptance:** core journey completes without a map.

### S25 — Session stop & optional summary
- **Purpose:** explicit stop; optional privacy-safe summary.
- **Entry:** Stop.
- **Behavior:** tear down watcher/timers/requests; show optional summary (counts only, no
  coords/names).
- **Analytics:** `session_stopped`, `session_summary_viewed`.
- **Acceptance:** all location/network activity ceases.

### S26 — Desktop/tablet responsive view
- **Purpose:** larger-screen layout (parked/passenger/planning).
- **Behavior:** split Map/Ahead; full filters; rich cards; keyboard navigable.
- **Acceptance:** all mobile capabilities available; no moving-only restrictions when stationary.

### S27 — Dark mode
- **Purpose:** dark palette across all screens.
- **Behavior:** tokens `color.dark`; sunlight + night legibility; status still icon+label.
- **Acceptance:** contrast AA; no color-only status.

### S28 — Large-text / accessibility examples
- **Purpose:** demonstrate text scaling + a11y at 200%.
- **Behavior:** reflow without truncation; targets preserved; live regions restrained.
- **Acceptance:** usable at large text; see [accessibility.md](accessibility.md).
