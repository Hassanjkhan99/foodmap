# FoodMap — Product Specification (MVP)

## Mission

Help a hungry person discover restaurants they are **about to pass** — while driving, riding,
walking or travelling — by answering:

> **Which restaurants worth considering are ahead of me before I pass them?**

FoodMap is discovery, not navigation, not delivery, not reviews. It is an independent product
that integrates with the Herald food-delivery platform over a versioned network API.

## Product boundaries

FoodMap is **not**: a Google Maps clone; a turn-by-turn navigator; a separate delivery app; a
Yelp-style reviews network; a general POI browser; a social network; a background tracker; an
ad platform (MVP); an AI-generated-facts platform. Familiar map conventions are used, but the
UI must not visually copy Google Maps.

## Core design principle — adapt density to context

The app must **not** assert the phone holder is the driver. Four presentation contexts:

- `moving_compact` / `unknown_compact` — concise, large targets, few actions, low motion;
  never auto-open a venue, never auto-launch navigation, no full-screen photos, no reshuffling.
- `stationary_rich` / `passenger_rich` — richer photos/info, full filters, menus, hours,
  entrance/parking notes, more actions.

The user may configure result count and time/distance preferences, but **moving mode may
restrict simultaneous information density for safety**.

## Personas

1. Driver who becomes hungry with **no destination**.
2. Driver **with a destination** who accepts a limited detour.
3. **Passenger** who can safely inspect more.
4. **Motorbike rider**.
5. **Parked** user browsing nearby.
6. **Guest** without an account.
7. **Signed-in** customer linked to the Herald account.
8. User who **denies location** access.
9. User with **weak GPS / weak connectivity**.
10. User in a **new market** with limited restaurant data.

## Features (MVP)

1. **Food Radar** — discovery from location + heading, no destination.
2. **Along a Route** — discovery within the remaining-route corridor.
3. **Map View** — food markers + route context.
4. **Ahead View** — chronological list of upcoming venues (works without a map).
5. **Filters** — cuisine multi-select, Open Now, time↔distance emphasis, max time ahead, max
   distance ahead, max detour, bounded result count (default 5).
6. **Restaurant decision flow** — compact while moving, rich while stationary/passenger;
   source-aware (FoodMap-owned / merchant / Herald-linked / provider / mixed / unknown).
7. **Navigation handoff** — Google Maps / Apple Maps / other, user-initiated only.
8. **Food-delivery integration** — open the linked Herald branch/menu/pickup where supported.

### Capability-driven venue actions

Actions are declared by the server per venue, never inferred client-side: `navigate`,
`view_menu`, `start_delivery`, `start_pickup`, `call`, `report_incorrect`, (future) `save`.
Unsupported actions are **omitted**, never shown as disabled promises. External-only venues
never imply Herald ordering support.

## MVP scope & non-goals

**In:** foreground Radar + Route discovery, Map/Ahead, filters/preferences, source-aware
cards, navigation handoff, Herald deep-link handoff, degraded-state handling, deterministic
simulator + tests. **Out (MVP):** background tracking, reviews network, ads, AI-generated
facts, native vehicle clients (Android Auto / CarPlay are a later feasibility spike only).

## Success metrics

**Primary:** `qualified_restaurant_discoveries / active_foodmap_session`.

A candidate becomes **qualified** only after a meaningful impression **followed by** a
high-intent action: details opened, navigation started, linked menu opened, order/pickup
journey started, incorrect-data report initiated, or (future) save.

**Funnel — keep these distinct:** `candidate_served` → `candidate_impression` →
`candidate_selected` → `qualified_discovery`. Strict versioned event schemas. Analytics must
**never** record exact coordinates, route polyline, destination text, addresses, restaurant
names, provider payloads, phone/email, or arbitrary JSON. Analytics failure must never block
discovery or navigation.

## Trust & source rules

Every displayed field carries internal source metadata (merchant-owned, FoodMap-owned,
Herald-linked, provider-owned, mixed, unknown) even if not all of it is exposed in the UI.
Provider photos/ratings/reviews **preserve required attribution**. Internal confidence scores
and provider trust rules are **never** exposed. Unknown values are **omitted or labelled
unknown** — never shown as `0`/`false`.

## Key journeys

See [design/foodmap-user-flows.md](../design/foodmap-user-flows.md) for the six end-to-end
journeys (first launch/permission, Food Radar, Along a Route, filters, restaurant decision,
degraded states) and the shared Map/Ahead interaction model.
