# FoodMap — Security & Privacy Assessment

## Location & permissions

- **Foreground only.** No background tracking in the PWA. All location activity is bound to an
  explicit `DiscoverySession`.
- **Permission after action.** Never trigger the OS permission prompt on load; only after the
  user explicitly starts Radar or a Route. Denial must **not** create a prompt loop; manual
  area / demonstration mode remains available.
- **Exactly one active watcher**; deterministic teardown on Stop/Pause/kill-switch (clears
  watchers, timers, in-flight requests).
- **No location persistence.** `LocationSample`s live only in session memory.

## Data minimization

Never persist: raw GPS history, route history, full provider payloads, provider photo bytes,
provider reviews, destination text, inferred hunger profile, exact-location analytics. (See
[data-model-proposal.md](data-model-proposal.md).)

## Analytics privacy

Product analytics must **never** record: exact coordinates, route polyline, destination text,
addresses, restaurant names, provider payloads, phone/email, or arbitrary JSON. Only
allowlisted, versioned event types. Analytics failures are non-blocking.

## Logging

Structured + **redacted**. Exact coordinates are never logged (coarsen or omit). No PII in
logs. OpenTelemetry-compatible traces exclude sensitive fields.

## Provider key isolation

- **Server-side keys stay server-side** (Places/Routes/details). The browser never sees them.
- The **browser map key is separate** and **referrer/API-restricted**; used only on FoodMap
  map pages, lazy-loaded.
- **No external API key is required for local development or CI** — fixture/mock adapters are
  the default. Tests make **no billable provider calls**.

## API surface hardening

- Guest discovery works; signed-in identity attached **server-side**; session IDs are not auth.
- `RouteRef`/`VenueRef` are **opaque, signed (HMAC), versioned, expiring** — clients can't
  enumerate internal IDs, submit provider names, ranking weights, field masks, or unbounded radius.
- Responses for exact-location discovery set cache headers that **prevent shared caching**.
- Strict server budgets, deadlines, rate limits, circuit breakers on every provider path.

## Herald integration boundary

- Network GraphQL only; **no shared DB, no code import.** Herald core is **AGPL-3.0**; only
  `@fd/shared` is Apache-2.0 — FoodMap stays clear of AGPL by integrating over the network
  (see [ADR-0002](../adr/0002-herald-network-adapter-only.md)).
- FoodMap **cannot** mint or attach a Herald identity (Herald auth is first-party phone-OTP).
  Ordering is an **unauthenticated deep-link**; Herald enforces its own auth at checkout.
- Never bypass Herald's server-side ordering/payment rules. FoodMap holds no card/payment data.

## Guest → account preference merge

- On first sign-in with **no** server preferences: seed **once** from validated guest prefs.
- If server preferences **exist**: server wins.
- **Logout must not expose another account's preferences** (clear in-memory + guest cache
  scoping).
- **Never** synchronize location or route data as preferences.

## External provider conduct

No scraping, no city-wide bulk copying, no permanent copies of restricted responses. Store only
allowed stable external IDs + FoodMap-owned data. Lazy-load expensive details/photos. Preserve
attribution. Use strict field masks. Provider failure returns **partial internal results**.

## Threats considered (summary)

| Threat | Mitigation |
|---|---|
| Location leakage via logs/analytics | Redaction, coarsening, no-persist, allowlisted events |
| Ref tampering / IDOR | Signed opaque expiring refs; server-side resolution |
| Provider key exfiltration | Server-only keys; separate restricted browser map key |
| Prompt-loop / permission fatigue | Permission-after-action; no auto re-prompt; manual mode |
| Cross-origin identity confusion | No token handoff; deep-link only; Herald owns auth |
| Cost/DoS via provider calls | Budgets, deadlines, coalescing, circuit breakers, kill switches |
