# FoodMap — Deployment (Vercel)

The PWA (`apps/web`) deploys to Vercel. It runs **zero-key**: the fixture catalog is the
default runtime, so no database or provider credentials are required for the demo.

**Live:** https://foodmap-one.vercel.app · project `foodmap` (org `hassanjkhan99s-projects`).

## Project settings (monorepo)

- **Root Directory:** `apps/web` (set in project settings). Deploy from the **repo root** so
  the whole pnpm workspace uploads and `@foodmap/*` packages resolve.
- **Build Command:** `next build --webpack` (in `apps/web/vercel.json`). The workspace
  `.js`→`.ts` resolution lives in the Next **webpack** config, so the webpack builder is
  required.
- **Framework:** Next.js · **Node:** 22 (from `engines`).
- **Install:** pnpm (auto-detected from `pnpm-workspace.yaml` + lockfile at the repo root).

## Collapsed-mode API

GraphQL is mounted inside Next at `/api/graphql` (`apps/web/app/api/graphql/route.ts`,
`runtime = "nodejs"`). The route uses Yoga's `handleRequest` and `createYoga` is configured
with `fetchAPI: { Response }` so Vercel's serverless runtime accepts the returned `Response`
(otherwise: *"No response is returned from route handler"* → 500).

## Environment variables

- `FOODMAP_REF_SECRET` — HMAC secret for signed venue refs. **Set in Production** (32-byte
  random, encrypted). Local/CI fall back to a dev default.
- No provider keys or `DATABASE_URL` needed for the fixture-catalog demo.

## Deploy

The GitHub repo is **connected to the Vercel project** (Git integration), so:

- **push/merge to `main` → production deploy** (auto).
- **open a PR / push a branch → preview deploy** (auto).

Manual deploys from the repo root remain available:

```bash
vercel deploy --yes           # preview
vercel deploy --prod --yes    # production
```

## Access / protection

Vercel Deployment Protection (Vercel Authentication) was **disabled** so the demo is publicly
viewable. Re-enable in Project → Settings → Deployment Protection if the demo should be private.

## CI vs deploy

GitHub Actions CI (PR-only) runs typecheck + tests + web build + Playwright E2E — the quality
gate. Vercel's Git integration handles deploys (preview per PR, production per `main` merge).
The two are independent: CI must pass for the PR to merge (branch ruleset), and the merge then
triggers the production deploy.
