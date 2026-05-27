# Supabase Migration Conventions

This document defines conventions for Supabase migration PRs. Phase 1F-A added
the scaffold and static validation harness. Phase 1F-B added the first base
schema migration. Phase 1F-C-A adds initial RLS policy SQL with static
coverage only. Seed SQL, Supabase CLI configuration, live Supabase
connections, and runtime app wiring remain deferred.

## Directory

Migration files belong in:

```text
supabase/migrations/
```

The first approved SQL migration is the Phase 1F-B base schema. Future `.sql`
migrations should remain small and separately reviewed.

## File Naming

Use timestamped filenames:

```text
YYYYMMDDHHMMSS_short_description.sql
```

Examples:

```text
20260526143000_create_workspaces.sql
20260526144500_create_products.sql
20260526150000_add_catalogue_rls.sql
```

Use UTC timestamps. Keep descriptions lowercase, concise, and separated with
underscores.

## Ordering

Migrations run in filename order. Prefer small, reviewable migrations:

1. Base tables.
2. Constraints and indexes.
3. RLS enablement and policies.
4. Seed fixtures, if approved.
5. Follow-up additive changes.

Do not mix broad schema creation, RLS policy work, seed data, and application
wiring in one migration PR.

## Review Expectations

Every real migration PR should include:

- The migration SQL.
- Static validator pass.
- RLS or tenant-isolation tests when policies are introduced.
- Fake/sample fixtures only when seed work is in scope.
- A short explanation of rollback risk and forward fix path.

No live apply should happen during PR review unless a future task explicitly
approves a named target and action in the current turn. Prefer local static
review and automated tests before any database interaction.

## Roll-Forward Preference

Prefer roll-forward fixes over editing already-merged migrations. If a merged
migration is wrong, add a new timestamped migration that corrects the issue.

History rewrites or mutation of merged migrations require explicit approval and
a clear reason.

## Secrets And Credentials

Migration files must not contain:

- Secrets, API keys, tokens, passwords, private keys, or bearer tokens.
- `.env` or `.env.local` references.
- Service-role keys.
- Browser-visible secret variables such as `NEXT_PUBLIC_*_SECRET`,
  `NEXT_PUBLIC_*_TOKEN`, or `NEXT_PUBLIC_*_KEY`.
- Live n8n webhook URLs or other live webhook URLs.
- Credential binding metadata or runtime payloads.

Service-role keys must never reach browser code. They bypass RLS and belong
only in server-side secret storage.

## Tenant Boundary

`workspaces` is the chosen tenant boundary table. Do not introduce a competing
`tenants` table unless the architecture decision is revisited in a separate
approved PR.

Workspace-scoped tables should use `workspace_id`, and future RLS policies
should scope admin access through active membership.

## RLS Requirements

RLS policy migrations must include static coverage. Runtime app use must wait
for behavioural database tests that prove both allowed and denied access paths,
including cross-workspace denial.

Policy PRs should cover:

- Member access to own workspace rows.
- Denial for rows in other workspaces.
- Anonymous catalogue reads limited to published catalogue data. Any future
  direct anonymous catalogue RLS hardening must include a trusted active
  workspace read strategy, runtime proof that configured DB-backed catalogue
  reads still return rows, and cross-workspace denial tests for direct
  anonymous reads.
- Service-only tables remaining unavailable to browser-role clients.

## Seed Data

Seed data must be fake/sample only. Do not copy live customer data, private
business files, real quote records, private event photos, production exports,
or local runtime payloads into the repo.

Product media should eventually live in Supabase Storage with metadata records
in `product_images`; Git-tracked prepared images are only for public shell
visuals.

## Static Validation

Run:

```powershell
npm run validate:supabase-migrations
npm run test:supabase-migrations
```

The validator is static only. It checks local migration filenames and content;
it does not require Supabase CLI, connect to a database, or apply migrations.
