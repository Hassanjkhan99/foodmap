# ADR-0003 — `DeliveryBranchRef` shape & unauthenticated deep-link ordering handoff

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap venues may optionally link to a Herald branch for menu/order handoff. Herald recon:

- A restaurant's **`slug`** is globally unique and deliberately stable across profile edits;
  **`Branch` has no slug**, only a `branchId` (cuid). A branch is resolved via
  `branchBySlug(slug, branchId)`.
- Herald auth is **first-party phone-OTP → HttpOnly `fd_session` cookie**. There is **no**
  API-key/OAuth/token-exchange for external apps, and the cookie is first-party — so an
  external origin cannot attach or reuse a signed-in identity.
- The customer PWA deep-link route is **`/r/<slug>`**, with `?branch=<branchId>` and
  `?item=<dishId>`. `/checkout` is auth-gated and redirects to `/login?next=…` when signed out.

## Decision

- Represent a linked venue as **`DeliveryBranchRef = { restaurantSlug: string, branchId?: string }`**.
- Handoff is an **unauthenticated deep-link** to `/r/<slug>?branch=<branchId>&item=<dishId>`.
  Herald runs its own OTP/checkout. FoodMap never attempts to mint/attach a Herald identity.
- Build URLs with `URL`/`URLSearchParams`; treat `branchId`/`itemId` as opaque pass-throughs.

## Consequences

- Simple, durable linking key; resilient to Herald profile edits.
- Ordering degrades gracefully into Herald's own login when the user isn't signed in.
- FoodMap holds no Herald session/payment state.
- If Herald later adds a token-handoff, revisit in a new ADR.
