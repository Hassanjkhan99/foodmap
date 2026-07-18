# ADR-0006 — Dedicated foreground location state machine

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap's location needs are continuous, safety-sensitive, and privacy-bound: permission after
explicit action, one watcher, heading confidence, motion hysteresis, deterministic teardown,
and simulation in CI. A one-shot "get my delivery address" location store does not model this.

## Decision

Build a **separate foreground location state machine** with explicit states: `idle`,
`checkingPermission`, `permissionRequired`, `acquiring`, `tracking`, `degraded`, `denied`,
`unsupported`, `paused`, `stopped`. Rules: permission only after explicit action; exactly one
active watcher; validate coords/time/accuracy/speed/heading; derive heading only after
accuracy-aware displacement; circular-angle smoothing; hysteresis for `MotionContext`; never
assert "driver"; no location persistence; support a **simulated location driver** used in CI.

## Consequences

- Predictable, testable lifecycle with deterministic cleanup (Stop clears watcher/timers/requests).
- Reusable in Radar and Route modes; the simulator drives the same machine.
- Do not reuse or entangle with any delivery-address location code.
