# Supabase Catalogue RLS Hardening Strategy

Phase 1L-A is a strategy and proof-scaffold phase. Actual direct anonymous
catalogue RLS hardening remains deferred until a non-breaking runtime path is
implemented and tested.

## Problem

Current catalogue table policies allow `anon` and `authenticated` clients to
select published `categories`, published `products`, and `product_images` for
published products. That keeps the Phase 1G-B server runtime working with the
anon Supabase key, but it also means someone who obtains the anon key could
query published catalogue rows directly across workspaces instead of going
through the website.

Draft rows, private tables, quote records, conversations, messages, usage
events, audit logs, and memberships remain blocked by RLS. The remaining
catalogue risk is cross-workspace exposure of published catalogue rows through
direct anonymous table reads.

## Current Mitigation

The approved runtime mitigation is application-level workspace filtering:

- Public catalogue code lives in `website/lib/catalogue/`.
- The module imports `server-only`.
- The browser does not get a Supabase client.
- Runtime reads use server-side `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Runtime reads require trusted server-side `CATALOGUE_WORKSPACE_ID`.
- List and detail queries filter by `workspace_id`, published category state,
  and published product state.

This keeps the public pages scoped to the configured workspace, but it is not
the final hardening boundary because direct anonymous table reads can bypass
the application filter.

## Non-Approved Shortcuts

The hardening path must not use these shortcuts:

- No browser Supabase client.
- No client-provided workspace ID.
- No service-role key.
- No service-role catalogue reads.
- No `NEXT_PUBLIC_SUPABASE_*` variables.
- No product, category, or product image mutation routes.
- No direct public mutation routes.

Simply removing the anonymous catalogue `select` policies is also not approved
yet. The current DB-backed catalogue runtime still uses the anon key and direct
table reads, so removing those policies now would make configured public
catalogue reads return empty rows and would silently fall back to shell data.

## Trusted Active-Workspace Strategy

The future hardening path should move public catalogue reads behind a trusted
server-only read boundary before broad anonymous table policies are tightened.

The target shape is:

1. The browser continues to call only the first-party Next.js pages and APIs.
2. The server resolves the active catalogue workspace from trusted
   server-side configuration, currently `CATALOGUE_WORKSPACE_ID`.
3. The Supabase read surface accepts only trusted active-workspace context. It
   must not let a direct anonymous caller choose an arbitrary workspace.
4. Direct anonymous base-table reads are denied across workspaces.
5. The public catalogue runtime still returns DB-backed rows for the configured
   workspace without service-role credentials.

One strategy to prove in a later PR is a narrow database-owned public catalogue
read surface, such as a carefully reviewed RPC or view/function pair, that
returns only published rows for an active workspace recorded in database-owned
configuration or a future trusted host/workspace mapping. If such a read
surface accepts a workspace argument, it must validate that argument against
database-owned active-workspace state and must not rely on browser-provided
values.

The function/view approach must be reviewed as privileged database code if it
uses `security definer`. It must have a fixed `search_path`, avoid dynamic SQL,
return only the public catalogue columns needed by the website, and include
direct anonymous abuse tests. It is not the same as using a Supabase
service-role key from the application.

## Proof Required Before Tightening

Before direct anonymous catalogue RLS is tightened, a PR must prove all of the
following locally:

- DB-backed catalogue reads still return Supabase rows for the configured
  server-side workspace.
- Direct anonymous reads cannot return published catalogue rows from another
  workspace.
- Direct anonymous reads still cannot return draft catalogue rows.
- Product images are returned only for published products in the active
  workspace.
- Runtime code remains server-only and uses trusted `CATALOGUE_WORKSPACE_ID`
  or a future trusted server-side workspace mapping.
- No browser Supabase client is added.
- No service-role key is added.
- No `NEXT_PUBLIC_SUPABASE_*` variables are added.
- No public product/category/product image writes are added.
- Existing catalogue fallback behaviour still works when Supabase is
  unconfigured or the workspace setting is missing.

## Test Plan

The future hardening PR must include:

- SQL or behavioural RLS tests with at least two workspaces and published rows
  in both workspaces.
- A direct anonymous cross-workspace denial test for `categories`, `products`,
  and `product_images`.
- A runtime catalogue test proving the configured trusted workspace still
  returns DB-backed rows after table-level anonymous reads are tightened.
- Static browser/server boundary tests proving no browser Supabase client,
  service-role key, or `NEXT_PUBLIC_SUPABASE_*` configuration was introduced.
- Static mutation guard tests proving no anonymous product/category/product
  image writes were added.

The current Phase 1L-A scaffold adds documentation and static guard coverage
only. It intentionally keeps the existing published-row anonymous table
policies in place.

## Deferred

Direct anonymous catalogue RLS hardening remains deferred. Supabase Cloud
connection, Supabase CLI usage, deployment, browser Supabase clients,
service-role reads/writes, production seed data, product persistence,
conversation/message persistence, admin/auth UI, and Supabase Storage wiring
also remain deferred.
