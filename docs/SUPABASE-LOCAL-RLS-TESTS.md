# Local Supabase RLS Behaviour Tests

Phase 1F-C-B adds a local-only database execution harness for behavioural RLS
and tenant-isolation checks. It does not connect to a live Supabase project,
does not link the repo to Supabase Cloud, and does not add runtime Supabase app
wiring.

## Requirements

- Docker Desktop running locally.
- Node.js available for the root package scripts.
- No Supabase Cloud credentials.

The harness uses a throwaway Docker Postgres database with the minimal
Supabase-compatible `anon`, `authenticated`, and `auth.uid()` surfaces needed by
the current RLS policies. It applies the committed SQL migrations from
`supabase/migrations/`, inserts fake test fixtures inside the temporary
database only, runs role-scoped assertions, and stops the container.

## Run

From the repo root:

```powershell
npm run test:supabase-rls
```

The first run may pull the default local test image:

```text
postgres:16-alpine
```

The command does not run `supabase login`, `supabase link`, `supabase db push`,
`supabase migration up`, or any command against a remote project ref.

## Coverage

The local RLS test command proves:

- RLS is enabled on every MVP table.
- An authenticated admin with active membership can read admin-only rows in
  their workspace.
- That admin cannot read admin-only rows from another workspace.
- An authenticated user without membership cannot read admin-only workspace
  rows.
- Anonymous reads return only published categories, published products, and
  images whose parent product is published.
- Anonymous reads do not return draft catalogue rows, membership data, quote
  request data, conversation data, message data, usage events, audit logs, or
  integration connection metadata.
- Service-only tables do not expose broad anonymous or authenticated client
  read access, and representative client writes are rejected.
- Runtime website code still does not rely on Supabase.

## Safety Notes

- Fixtures are fake UUIDs and fake `example.test` identities.
- No real SpaceKonceptRental customer, product, quote, conversation, or private
  business data is used.
- The test database is disposable and is stopped after the command unless
  `SUPABASE_RLS_KEEP_DB=1` is set for local debugging.
- Do not use this harness as approval to add runtime Supabase wiring, seed
  production data, deploy, or connect to Supabase Cloud.
