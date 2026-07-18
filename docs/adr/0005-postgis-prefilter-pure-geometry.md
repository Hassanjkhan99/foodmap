# ADR-0005 — PostGIS prefilter + framework-free exact geometry

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

Discovery needs fast geospatial prefiltering over the catalog **and** exact, testable geometry
(project a point onto a route, remaining-route, along-route/lateral distance, ahead/passed
classification, corridor, shortlist detour). These are different jobs with different needs.

## Decision

- Use **PostgreSQL + PostGIS** (GiST-indexed `geography(Point,4326)`) for **coarse prefilter**
  (bounding box / corridor candidate selection).
- Keep **exact geometry framework-free in `packages/domain`** — pure functions, deterministic,
  unit-tested against fixtures. Compute **exact detour only for a small shortlist**; never call
  a route matrix for all candidates; never label a geometric approximation as an exact routed detour.

## Consequences

- Cheap spatial narrowing at the DB; precise, portable, testable math in the domain layer.
- Domain geometry runs in Node and the browser without DB coupling.
- Two representations of geometry to keep consistent (DB prefilter vs exact domain math).
- Alternative rejected: doing all geometry in SQL (hard to unit-test, couples logic to DB).
