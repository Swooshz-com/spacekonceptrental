# Supabase Seed Fixtures

This directory contains reviewed fake/sample seed fixtures only.

`sample_catalogue.sql` inserts a small catalogue-like fixture set for local
validation:

- `workspaces`
- `categories`
- `products`
- `product_images` metadata

It intentionally does not insert admin users, memberships, quote requests,
quote request items, conversations, messages, usage events, audit logs,
integration connection metadata, credentials, private media, binary files, or
production exports.

Run the local Docker-only validation from the repo root:

```powershell
npm run test:supabase-seed
```

The validation starts a disposable Docker Postgres container, applies committed
migrations, applies the seed fixture, verifies FK and RLS behaviour, then
stops/removes the container unless `SUPABASE_SEED_KEEP_DB=1` is set for local
debugging.

Do not use these fixtures as approval to connect to Supabase Cloud, seed
production, add runtime Supabase app wiring, add public DB catalogue reads, add
quote or conversation persistence, or deploy.
