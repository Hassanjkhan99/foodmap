# ADR-0001 — Modular monorepo (pnpm + Turborepo)

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

FoodMap needs a web PWA, a GraphQL API, pure domain/geometry logic, a PostGIS data layer,
shared UI, typed config, integration adapters, and deterministic test fixtures. Herald already
uses pnpm + Turborepo successfully, which eases parity and reviewer familiarity.

## Decision

Use a **modular monorepo**: `apps/{web,api}` + `packages/{domain,db,ui,config,integrations,
test-fixtures}`, managed with **pnpm workspaces + Turborepo**, TypeScript strict throughout.

## Consequences

- Clear package boundaries let us keep `domain` framework-/provider-free and lint the
  dependency graph ([dependency-graph.md](../architecture/dependency-graph.md)).
- Single install/build/test graph; shared tooling and codegen.
- Requires discipline: no cross-boundary imports; provider payloads normalized before crossing.
- Alternatives rejected: polyrepo (coordination overhead, harder atomic changes), single app
  (no enforceable purity boundary).
