# FoodMap — Component Inventory

Every component ships **compact** (moving/unknown) and **rich** (stationary/passenger)
variants. Presentation context selects the variant. Tokens: [tokens.json](tokens.json).

| Component | Purpose | Key props | States | Compact variant | Rich variant | A11y |
|---|---|---|---|---|---|---|
| **AppShell / SessionShell** | Frame for an active `DiscoverySession`; hosts Map/Ahead toggle, banners, filter + Stop | `mode`, `presentationContext`, `status` | idle/active/degraded/stopped | minimal chrome, big Stop | adds full filters entry | landmark regions; Stop always reachable |
| **VenueCardCompact** | Minimal decision surface while moving | `candidate`, `actions` | linked/external/mixed; open/closed/unknown | name, ahead, cuisine, open, detour?, ≤2 actions | — | ≥56px targets; no photos |
| **VenueDetailsSheet** | Rich info when safe | `venueDetails` | loading/loaded/details-unavailable | — | image, rating+count, address, hours, notes, specialties, actions, attribution | focus trap + return |
| **AheadList** | Chronological upcoming venues | `candidates`, `selectedRef` | normal/heading-unknown/stale/empty/all-filtered | compact rows, in-place updates | rows + thumbnails | list semantics; restrained live region |
| **AheadRow** | One upcoming venue | `candidate`, `selected` | selected/unselected/passing/updated | name+ahead+open | +thumb+fact | row is a button; selection announced |
| **MapCanvas** | Map render surface behind `MapRenderer` | `candidates`, `location`, `heading`, `route`, `camera` | loading/ready/failed | — | — | has Ahead equivalent; controls labelled |
| **VenueMarker** | Map marker | `state`, `selected` | selected/unselected/behind | large ember when selected | same | not sole info channel |
| **CurrentLocationMarker** | User position (+heading cone) | `heading?`, `accuracy` | known/heading-unknown | dot | dot+cone | decorative + labelled |
| **RoutePolyline** | Remaining route | `remaining`, `travelled` | on/off-route | remaining bold | + travelled muted | — |
| **CameraControls** | Follow/Manual/Recenter | `cameraState` | follow/manual | Recenter button | + follow toggle | ≥44/56px; labelled |
| **ViewToggle (SegmentedControl)** | Switch Map ↔ Ahead | `value` | map/ahead | large segments | same | radiogroup semantics |
| **QuickFilters** | Fast session filters | `sessionFilters` | open/applied | few big chips | — | chips are toggle buttons |
| **FullFilters / Preferences** | Complete filters + saved defaults | `prefs`, `sessionFilters` | editing/saved | — | full form | labelled inputs; grouped |
| **CuisineChips (multi-select)** | Cuisine filter | `selected[]`, `options[]` | selected/unselected | subset | full | toggle role; not color-only |
| **StatusPill** | Open/closed/unknown | `openState`, `opensAtLabel?` | open/closed/unknown | icon+short | icon+label | icon + text (never color alone) |
| **SourceBadge** | Provenance | `sourceType` | foodmap/merchant/linked/provider/mixed/unknown | icon | icon+label | text label available |
| **AttributionLabel** | Provider/author attribution | `attribution` | present | inline small | inline | always rendered with provider content |
| **DetourTag** | Exact added detour | `detour?` | exact/omitted | shown only if exact | same | omitted when not exact (never approximated) |
| **AheadTag** | Time/distance ahead | `ahead`, `emphasis` | time/distance | tabular numerals | same | numeric label |
| **DegradedBanner** | Degraded-state message | `status`, `recovery` | per failure-matrix | one line + 1 action | same | role=alert (restrained) |
| **Skeletons** | Loading placeholders | `variant` | row/card/map | rows | + card/photo | aria-busy |
| **BottomSheet** | Rich container | `open`, `snapPoints` | open/closed | — | photos/actions | focus trap + return |
| **PrimaryButton / SecondaryButton** | Actions | `variant`, `disabled?` | default/pressed/loading | ≥56px | ≥44px | labelled; no nested controls |
| **NavAppChooser** | Navigation targets | `targets`, `fallback` | choices/fallback | list | list | user-action only |
| **PermissionSheet** | Permission education | `permissionState` | grant/dismiss/deny/granted/unsupported | — | sheet | focus trap; no auto re-prompt |
| **ManualAreaPicker / DemoMode** | No-location fallback | `area?` | picking/selected | — | map/list | keyboard reachable |
| **SessionSummary** | Post-stop summary | `counts` | shown | counts only | counts only | no coords/names |

## Variant selection rule

```
presentationContext = f(MotionContext, explicitPassenger, kill switches)
moving/unknown  -> compact variants, ≥56px targets, ≤2 actions, no photos, low motion
stationary      -> rich variants, full filters, photos, more actions
passenger_rich  -> rich variants (explicit opt-in), even while vehicle moves
```

## Liquid Glass surface application

Glass (`tokens.json → glass`) is applied to **chrome/overlay** components only, and every one
carries the solid **Adaptive-Contrast fallback**:

| Component | Glass layer | Falls back to solid when |
|---|---|---|
| BottomSheet / VenueDetailsSheet | `tintRegular` + `blur.regular` + `scrim` behind | moving/unknown, reduced-transparency, high contrast, sunlight, no `backdrop-filter` |
| DegradedBanner | `tintThin` + `blur.thin` | same triggers (banners must stay legible → often solid) |
| Control bars (CameraControls, ViewToggle, Stop bar) | `tintThin` + `blur.thin` | moving_compact → **solid** (control bars are visible while moving, so they render solid there) |
| QuickFilters / CuisineChips | `tintThin` | reduced-transparency / contrast / forced-colors |
| AppShell top/bottom bars | `tintRegular` over map | Adaptive-Contrast triggers |

Rules: **primary reading content sits on a solid content plate**, never directly on a
translucent layer; text on any glass layer meets **AA (≥4.5:1)** — escalate tint
(`thin→regular→thick`) or fall back before shipping a low-contrast combo; **do not animate the
blur** while moving. `VenueCardCompact`, `AheadRow`, markers, and numeric tags are **solid**
by default (content, not chrome).

## Interaction invariants (all list/map components)

- One shared `selectedRef`; selecting in Map highlights the Ahead row and vice-versa;
  switching views preserves selection.
- Harmless location updates **do not reorder**; values patch **in place**.
- Manual camera pan never snaps back; Recenter is explicit.
- Map failure leaves Ahead fully functional; every map action exists in Ahead.
