# Local Supabase RLS Behaviour Tests

Phase 1F-C-B adds a local-only, Docker-only database execution harness for
behavioural RLS and tenant-isolation checks. It does not connect to a live
Supabase project, does not link the repo to Supabase Cloud, does not require
the Supabase CLI on the host machine, and did not add runtime Supabase app
wiring. Phase 1G-A later adds only server-side Supabase runtime wiring under
`website/lib/supabase/`; this harness still must not approve broad direct
anonymous catalogue table reads, persistence flows, Supabase Cloud connection,
or deployment.

## Requirements

- Docker CLI available locally.
- Node.js available for the root package scripts.
- No Supabase Cloud credentials.
- No host Supabase CLI install.

The harness uses a throwaway Docker Postgres database with the minimal
Supabase-compatible `anon`, `authenticated`, and `auth.uid()` surfaces needed by
the current RLS policies. The `auth.uid()` shim and request JWT claim settings
live only in `scripts/test-supabase-rls.cjs` test setup, not in production
migrations. The command applies the committed SQL migrations from
`supabase/migrations/`, inserts fake test fixtures inside the temporary
database only, runs role-scoped assertions, and stops/removes the container.
Phase 1M-A extends the harness for direct anonymous catalogue RLS hardening.
The test database seeds two fake workspaces, marks workspace A as the
database-owned active public catalogue workspace, and proves that direct
anonymous base-table catalogue reads are denied while the trusted
`get_public_catalogue` read surface still returns DB-backed rows for the active
workspace.

## Run

From the repo root:

```powershell
npm run test:supabase-rls
```

Before starting the throwaway Postgres container, the command now checks local
Docker readiness:

- If the Docker daemon already answers `docker info`, the RLS harness continues
  immediately.
- If Docker CLI exists but the daemon is unavailable, the helper makes one
  bounded best-effort startup attempt.
- On Windows, it tries Docker Desktop through a hidden PowerShell
  `Start-Process` call, preferring the common Docker Desktop install path when
  present.
- On macOS, it tries `open -a Docker`.
- On Linux, it may try `systemctl --user start docker` when `systemctl` is
  available. It never uses `sudo`.
- Unknown platforms print manual instructions instead of guessing.

The helper polls for a bounded time and then exits non-zero if Docker is still
not responsive. The failure output reports whether Docker CLI exists, whether a
startup attempt was made, which platform command was attempted, how long it
waited, and the manual next step. It prints status and command labels only; it
does not print environment values or secrets.

The first run may pull the default local test image:

```text
postgres:16-alpine
```

The command does not run `npx supabase`, `supabase login`, `supabase link`,
`supabase db push`, `supabase migration up`, or any command against a remote
project ref. It does not install the Supabase CLI globally and does not add
`supabase` as a host npm dependency.

## Difference From Supabase CLI Local Stack

The official Supabase CLI local stack starts the full local Supabase service
set. This Phase 1F-C-B harness intentionally starts only the database service
needed for RLS behaviour checks. Because the current policy SQL calls
`auth.uid()`, the harness creates a test-only `auth.uid()` shim that reads the
same request JWT claim setting used in Supabase RLS tests:
`request.jwt.claim.sub`.

This difference keeps the command disposable and avoids host Supabase CLI
requirements, while still executing the committed migrations and RLS policies
inside Postgres with `anon` and `authenticated` role simulation. It is not a
replacement for future runtime integration tests against a fuller local stack
when Supabase app wiring, Auth UI, direct trusted-workspace catalogue reads, or
persistence flows are approved.

## Coverage

The local RLS test command proves:

- RLS is enabled on every MVP table.
- An authenticated admin with active membership can read admin-only rows in
  their workspace.
- That admin cannot read admin-only rows from another workspace.
- An authenticated user without membership cannot read admin-only workspace
  rows.
- Anonymous reads return only published categories, published products, and
  images whose parent product is published through the trusted
  active-workspace `get_public_catalogue` RPC.
- Direct anonymous base-table reads return no `categories`, `products`, or
  `product_images`.
- Direct anonymous base-table reads cannot return published catalogue rows from
  another workspace.
- Direct anonymous base-table reads still cannot return draft catalogue rows.
- The trusted active-workspace RPC returns configured workspace rows and does
  not return inactive or other workspace rows.
- Anonymous product/category/product image writes remain rejected.
- Anonymous reads do not return draft catalogue rows, membership data, quote
  request data, conversation data, message data, usage events, audit logs, or
  integration connection metadata. The active catalogue workspace config table
  is also private to anonymous callers.
- Service-only tables do not expose broad anonymous or authenticated client
  read access, and representative client writes are rejected.
- Runtime website Supabase code stays server-only, private-env-only, and
  workspace-scoped for catalogue reads.
- Phase 1M-A includes the direct anonymous cross-workspace denial tests and the
  runtime proof that trusted server-side workspace configuration still returns
  DB-backed catalogue rows through the RPC.

## Safety Notes

- Fixtures are fake UUIDs and fake `example.test` identities.
- No real SpaceKonceptRental customer, product, quote, conversation, or private
  business data is used.
- The test database is disposable and is stopped after the command unless
  `SUPABASE_RLS_KEEP_DB=1` is set for local debugging.
- No Docker volume is required; test state stays in the disposable container.
- This harness proves only local disposable database behaviour. It does not
  approve persistence flows, production seed data, deployment, Supabase Cloud
  connection, or active workspace configuration changes in a live project.
