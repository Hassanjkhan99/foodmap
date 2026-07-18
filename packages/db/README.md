# @foodmap/db — PostGIS catalog

PostgreSQL + PostGIS internal catalog. Provides a `PostgisCatalogProvider` that structurally
implements the same `CatalogProvider` port as the zero-key `FixtureCatalogProvider`, so the app
can swap between them by config alone. See [ADR-0011](../../docs/adr/0011-node-postgres-for-postgis.md).

## Zero-key by default

Local dev and CI run against the **fixture** catalog and need no database. The PostGIS path is
opt-in via `DATABASE_URL`; its integration tests **skip** when that variable is absent and run
in CI against a PostGIS service container.

## Usage

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/foodmap
pnpm --filter @foodmap/db migrate   # apply migrations (creates extension + tables + GiST index)
pnpm --filter @foodmap/db seed       # load the seed venues (same data as the fixtures)
```

```ts
import { createPool, PostgisCatalogProvider } from "@foodmap/db";
const catalog = new PostgisCatalogProvider(createPool());
const venues = await catalog.nearby({ center, radiusM: 5000 }); // GiST ST_DWithin prefilter
```

Exact ahead/corridor geometry still runs in `@foodmap/domain`; this layer is the coarse spatial
prefilter only.

## Migrations

Ordered, additive list in `src/migrations.ts` (never edit a shipped migration — append a new
one). `runMigrations` is idempotent and records applied ids in `_foodmap_migration`.
