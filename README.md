# FoodMap

**FoodMap helps a hungry person discover restaurants they are about to pass** while driving,
riding, walking or travelling. It answers one question:

> **Which restaurants worth considering are ahead of me before I pass them?**

FoodMap is an **independent product and repository**. It integrates with our existing
food-delivery platform (**Herald** — `Hassanjkhan99/food-delivery`) **only through a
versioned network API adapter**. It does not share Herald's database, import its private
code, or duplicate ordering/payment.

## What FoodMap is

1. **Food Radar** — restaurant discovery from current location + heading, no destination needed.
2. **Along a Route** — discovery within the remaining route corridor.
3. **Map View** — food-focused markers + route context.
4. **Ahead View** — a scannable chronological list of restaurants you'll encounter next.
5. **Filters** — cuisine, open now, time/distance emphasis, look-ahead limits, max detour, bounded results.
6. **Restaurant decision flow** — compact while moving, rich while stationary/passenger.
7. **Navigation handoff** — Google Maps, Apple Maps, or another installed app.
8. **Food-delivery integration** — open the linked Herald branch/menu/pickup where supported.

## What FoodMap is **not**

- a Google Maps clone
- a turn-by-turn navigation system
- a separate food-delivery application
- a Yelp-style reviews network
- a general-purpose POI browser
- a social network
- a background tracking service in the PWA
- an advertising platform in the MVP
- an AI-generated restaurant-facts platform

## Core principle — adapt information density to context

FoodMap **never claims the phone holder is the driver**. It adapts to four presentation
contexts: `moving_compact`, `unknown_compact`, `stationary_rich`, `passenger_rich`.
While moving/uncertain it stays concise, large-target, low-motion, and **never auto-opens a
restaurant or auto-launches navigation**.

## Integration boundary (read before writing code)

Herald is the source of truth for accounts/auth, merchant accounts, branches, menus,
ordering, delivery, pickup, payment, and operating state. FoodMap talks to it **over the
network only**, via a versioned `DeliveryPlatformClient`.

> **Licensing note:** Herald's core (`apps/api`, `apps/web`, `packages/db`, `packages/config`)
> is **AGPL-3.0**; only `@fd/shared` is Apache-2.0. FoodMap integrates over the network to
> stay clear of AGPL and **must not vendor Herald core code**. See
> [ADR-0002](docs/adr/0002-herald-network-adapter-only.md).

## Documentation

Start at **[docs/README.md](docs/README.md)** — the index for product, design, architecture,
ADRs, flows, and operations. This repository is currently **design + Phase 0 planning**; the
runnable MVP is built in later phases tracked as GitHub issues.

## Status

Phase 0 (product + architecture + design handoff). See
[docs/product/implementation-phases.md](docs/product/implementation-phases.md).
