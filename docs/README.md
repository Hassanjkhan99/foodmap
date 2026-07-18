# FoodMap Documentation Index

This repository is currently at **Phase 0 — Product & Architecture** plus the **design
handoff**. The runnable MVP is built in later phases (see the phase plan). Every planning and
design artifact lives here.

## Product

- [Product spec](product/product-spec.md) — mission, personas, boundaries, features, MVP scope, metrics.
- [Glossary](product/glossary.md) — canonical domain language (use these terms exactly).
- [Implementation phases](product/implementation-phases.md) — Phases 0–6 with entry/exit criteria.

## Design handoff

- [Design handoff (master)](design/foodmap-design-handoff.md) — visual directions, design system, per-screen handoff.
- [User flows](design/foodmap-user-flows.md) — the 6 journeys, degraded states, Map/Ahead interaction model.
- [Component inventory](design/foodmap-component-inventory.md) — components with compact/rich variants.
- [Design tokens](design/tokens.json) — machine-readable tokens (light + dark).
- [Copy deck](design/copy-deck.md) — buttons, permission education, empty/error copy.
- [Accessibility](design/accessibility.md) — a11y notes per major interaction.
- [Assumptions & open questions](design/assumptions-and-open-questions.md).

## Architecture

- [Architecture plan](architecture/architecture-plan.md) — monorepo, ports/adapters, engines, config.
- [Dependency graph](architecture/dependency-graph.md) — package boundaries.
- [API contract proposal](architecture/api-contract-proposal.md) — GraphQL ops + `DeliveryPlatformClient`.
- [Data model proposal](architecture/data-model-proposal.md) — entities, attribute registry, do-not-persist.
- [Security & privacy assessment](architecture/security-privacy-assessment.md).

## Decisions (ADRs)

See [adr/](adr/) — [0001](adr/0001-modular-monorepo.md) … [0010](adr/0010-design-as-markdown-tokens.md).

## Flows

- [flows/README.md](flows/README.md) — pointers to the journey step maps (in the design user-flows doc).

## Operations

- [Failure matrix](operations/failure-matrix.md) — degraded-state recovery table.
- [Kill switches](operations/kill-switches.md) — runtime feature switches.

---

**Reading order for an implementation agent:** glossary → product spec → implementation
phases → architecture plan → API contract → data model → design handoff → relevant ADRs →
the specific issue.
