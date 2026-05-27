# Supabase Seed Fixtures

Phase 1F-D adds fake/sample catalogue seed fixtures for local validation only.
It does not connect to Supabase Cloud, require the Supabase CLI, add runtime
Supabase app wiring, or approve production seeding.

## Files

- `supabase/seeds/sample_catalogue.sql` - fake/sample catalogue fixture SQL.
- `scripts/test-supabase-seed.cjs` - Docker-only local validation harness.

The seed file inserts only:

- `workspaces`
- `categories`
- `products`
- `product_images` metadata

Product image rows are metadata only. They use sample bucket/path values and do
not upload media, create Supabase Storage buckets, or require Supabase Storage.

## Run

From the repo root:

```powershell
npm run test:supabase-seed
```

The command starts a disposable Docker Postgres container, applies committed
migrations, applies `supabase/seeds/sample_catalogue.sql`, runs seed and RLS
assertions, and stops/removes the container. No Docker volume is required; test
state stays inside the disposable container unless `SUPABASE_SEED_KEEP_DB=1` is
set for local debugging.

The command does not run `npx supabase`, `supabase login`, `supabase link`,
`supabase db push`, `supabase migration up`, or any command against a remote
project ref. It does not install the Supabase CLI globally and does not add
`supabase` as a host npm dependency.

## Validation Coverage

The seed validation proves:

- The seed SQL applies cleanly after committed migrations.
- Seed rows preserve workspace-safe foreign keys.
- Seed SQL inserts only the approved fake/sample catalogue tables.
- Non-catalogue tables remain empty, including admin users, memberships, quote
  requests, quote request items, conversations, messages, usage events, audit
  logs, and integration connections.
- Anonymous reads can see only published categories, products, and image
  metadata whose parent product is published.
- Draft/unpublished categories, products, and image metadata remain hidden from
  anonymous reads.
- Image seed rows are metadata-only sample paths.
- Runtime website code still does not rely on Supabase.

## Boundary

These fixtures are intentionally fake and small. They do not include real
customer data, real quote data, real conversation data, private event data,
private business files, private media, production exports, credentials, or
secrets.

This phase still does not add runtime app Supabase use, hardened anonymous
catalogue RLS, product persistence in the app, quote persistence,
conversation/message persistence, deployment configuration, or production seed
data.
