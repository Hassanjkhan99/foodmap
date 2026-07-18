# Contributing to FoodMap

FoodMap is built incrementally through bounded GitHub issues under a phase plan. Whether you
are a human or an AI implementation agent, follow these rules.

## Repository boundary (non-negotiable)

FoodMap is separate from the food-delivery platform (**Herald**). You must **not**:

- share databases with Herald or read its database directly;
- import or vendor Herald's private/core source (`apps/*`, `packages/db`, `packages/config`
  are **AGPL-3.0**); integrate over the network API instead;
- duplicate checkout, payment, or order state;
- create a second merchant-account system;
- modify the Herald repository without a separate approved issue and PR.

All Herald communication goes through the versioned `DeliveryPlatformClient` adapter. See
[ADR-0002](docs/adr/0002-herald-network-adapter-only.md).

## Engineering principles

- **TypeScript strict** everywhere. Zod at all external and persistence boundaries.
- **Pure domain/geometry logic stays framework- and provider-free** (`packages/domain`).
- Provider-specific payloads must **not** leak into domain, GraphQL, or UI contracts.
- **Additive migrations only.**
- **Zero-key local/CI:** the app must run and tests must pass with **no external credentials**.
  Use fixture/mock adapters by default.
- **Typed runtime configuration** instead of scattered constants; every risky path has a kill switch.
- **Privacy:** never persist raw GPS/route history or restricted provider payloads; never log
  exact coordinates; never put coordinates/addresses/names into product analytics.

## Per-issue workflow

1. Read the parent epic, blockers, relevant ADRs, the design handoff, and current code.
2. Write a **file-level implementation plan** before editing.
3. Identify schema, migration, API, and compatibility changes. Reuse existing modules.
4. Add **deterministic** unit/integration tests; add Playwright/E2E for UI and journeys.
5. Verify empty, error, and degraded states; verify a11y + reduced-motion for UI; verify
   cleanup + bounded provider calls for session/provider work.
6. Run: format, typecheck, lint, tests, build, migrations, codegen. Report **exact** results.
7. Open **one focused branch/PR** with a Conventional Commit title and `Closes #<n>`.
8. Update docs, ADRs, and diagrams when behavior changes.
9. **Never claim** a simulator, device, entitlement, or provider call was tested without evidence.

## Canonical domain language

Use the terms in [docs/product/glossary.md](docs/product/glossary.md) consistently. Do **not**
use restaurant / place / store / branch / location / venue interchangeably.

## Branching, CI & merge flow

CI (`.github/workflows/ci.yml`) runs **only on pull requests to `main`** and via the manual
"Run workflow" button — not on direct pushes — to conserve GitHub Actions minutes on this
private repo. It cancels superseded runs, caps job time, and runs `pnpm typecheck` + `pnpm test`
with no external credentials.

Because CI is PR-only, **do all work on a branch and open a PR** — a direct push to `main`
runs no checks:

1. `git checkout -b <type>/<slug>`
2. commit; `git push -u origin <branch>`; open a PR to `main`
3. wait for the **build-test** check to go green
4. merge once green

> Note: a required-check *merge gate* (branch protection / rulesets) is **not** available on
> GitHub Free for private repos, so green CI is enforced by **discipline**, not by GitHub. See
> [ADR-0009](docs/adr/0009-repository-license.md) for the private-repo context. If the repo is
> ever made public or upgraded to Pro, enable a ruleset requiring `build-test`.

## Commit & PR conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- PRs include: what changed, test evidence (exact command output), migration + rollback notes
  for data changes, API/schema diff for contract changes, screenshots for UI, and
  `Closes #<issue>`.
