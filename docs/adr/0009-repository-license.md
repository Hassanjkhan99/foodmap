# ADR-0009 — FoodMap repository license

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap is a private, unpublished commercial MVP. It integrates with Herald, whose **core is
AGPL-3.0** and whose `@fd/shared` is Apache-2.0. FoodMap integrates with Herald **over the
network only** (ADR-0002), so it incurs no AGPL obligation from that boundary. We still need an
explicit license for the FoodMap repo.

## Decision

Ship a **proprietary "All rights reserved"** `LICENSE` for the private MVP. Because integration
is network-only, FoodMap is free to choose its own license. Revisit if/when the project is
open-sourced or if any Herald code is ever vendored (only `@fd/shared`, Apache-2.0, would be
permissible — and only via a new ADR).

## Consequences

- No copyleft obligations propagate into FoodMap.
- If open-sourcing later, this ADR must be superseded with a compatible license choice.
- Contributors must not paste Herald AGPL core code into FoodMap.
