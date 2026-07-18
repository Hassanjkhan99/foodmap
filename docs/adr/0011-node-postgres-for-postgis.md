# ADR-0011 — node-postgres (raw SQL) for the PostGIS catalog layer

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

ADR-0005 established PostgreSQL + PostGIS for catalog prefiltering, with exact geometry kept
framework-free in `packages/domain`. The remaining choice was the persistence/query layer.
PostGIS `geography(Point,4326)` columns and spatial predicates (`ST_DWithin`, `ST_MakePoint`,
GiST indexes) are first-class in SQL but are not natively modelled by Prisma — Prisma requires
`Unsupported(...)` columns plus raw queries for exactly the operations the catalog needs.

## Decision

Implement `packages/db` with **`node-postgres` (`pg`) and hand-written, parameterised SQL**:
- migrations as an ordered, additive list applied by `runMigrations`;
- a GiST-indexed `geography` column;
- repository functions issuing parameterised `ST_DWithin` queries;
- Zod validation of rows at the boundary (`rowToVenue`);
- a `PostgisCatalogProvider` that structurally satisfies the `CatalogProvider` port, so it can
  be swapped for the zero-key fixture catalog by config alone.

This supersedes ADR-0005's tentative "Prisma plus raw PostGIS" for the catalog layer.

## Consequences

- No ORM/codegen step; the spatial queries are explicit and reviewable.
- Zero-key preserved: local/CI run against fixtures; the DB integration tests are gated on
  `DATABASE_URL` and run in CI against a PostGIS service container.
- We hand-maintain SQL and row mapping (mitigated by Zod validation + tests).
- If a broader relational surface later needs an ORM, it can be introduced alongside these
  raw spatial queries without replacing them.
