# Supabase Catalogue RLS Hardening

Phase 1M-A implements and proves the first trusted active-workspace catalogue
read surface. In Phase 1M-A, direct anonymous base-table reads are denied for
`categories`, `products`, and `product_images`, while the server-only catalogue
runtime can still return DB-backed rows for the configured active workspace.

## Problem

The Phase 1G-B catalogue runtime used the anon Supabase key from server-only
Next.js code and filtered direct table reads by trusted
`CATALOGUE_WORKSPACE_ID`. That kept public pages scoped in application code,
but anyone with the anon key could still query published catalogue base tables
directly across workspaces.

Draft rows, private tables, quote records, conversations, messages, usage
events, audit logs, and memberships were already blocked by RLS. The remaining
catalogue risk was direct anonymous exposure of published catalogue rows across
workspaces.

## Implemented Read Surface

Phase 1M-A adds `catalogue_public_workspace_config`, a database-owned singleton
table that records the active public catalogue workspace. The table has RLS
enabled and no anonymous read policy. It stores no secrets and no customer
data.

The public read surface is `public.get_public_catalogue(expected_workspace_id
uuid, product_slug text default null)`. It is a narrow `security definer`
function with:

- Fixed `search_path = public`.
- No dynamic SQL.
- A database-owned active workspace check.
- Published category filtering.
- Published product filtering.
- Product image return only for published products in the active workspace.
- Only public catalogue fields needed by the website.

The function accepts the server-configured expected workspace ID, but it does
not trust that value alone. It returns rows only when the value matches the
database-owned active workspace config and that workspace is active. Passing
another workspace ID returns no data.

## Runtime Path

Public catalogue code remains in `website/lib/catalogue/` and imports
`server-only`.

Runtime reads still require:

- Server-side `SUPABASE_URL`.
- Server-side `SUPABASE_ANON_KEY`.
- Trusted server-side `CATALOGUE_WORKSPACE_ID`.

When those values are present, the repository calls
`rpc("get_public_catalogue", { expected_workspace_id, product_slug })`. The
browser never chooses the workspace and never receives a Supabase client. If
Supabase env, `CATALOGUE_WORKSPACE_ID`, the RPC result, or the database-owned
active workspace config is unavailable, the repository falls back to the
existing public catalogue shell data.

No service-role key is used.

## Direct Anonymous Base-Table Hardening

The existing broad public catalogue select policies were tightened with
non-destructive `alter policy ... using (false)` statements:

- `categories_public_read_published`
- `products_public_read_published`
- `product_images_public_read_published_products`

Authenticated member policies remain membership-scoped for future admin reads.
Anonymous callers can execute the trusted active-workspace RPC, but direct
anonymous base-table reads no longer return published or draft catalogue rows.

## Proof

The local Docker-only RLS harness now proves:

- cross-workspace denial for direct anonymous catalogue base-table reads.
- Direct anonymous base-table reads cannot return published `categories` from
  another workspace.
- Direct anonymous base-table reads cannot return published `products` from
  another workspace.
- Direct anonymous base-table reads cannot return `product_images` from another
  workspace.
- Direct anonymous base-table reads still cannot return draft or unpublished
  catalogue rows.
- The trusted active-workspace RPC returns DB-backed rows for the configured
  active workspace.
- The trusted active-workspace RPC does not return inactive or other workspace
  rows.
- Product images are returned only for published products in the active
  workspace.
- Anonymous product/category/product image writes remain rejected.
- Private tables, including the active-workspace config table, are not readable
  by anonymous callers.

Website tests prove the server-only repository uses the RPC path, keeps missing
Supabase env and missing `CATALOGUE_WORKSPACE_ID` fallback behaviour, and keeps
browser-facing source free of Supabase imports, service-role keys,
`NEXT_PUBLIC_SUPABASE_*`, and legacy `website/chat-config.js` usage.
DB-backed catalogue reads are preserved when the active workspace config is
present.

## Phase 1N-A Bootstrap Plan

Phase 1N-A adds the active workspace bootstrap plan in
`docs/SUPABASE-CATALOGUE-WORKSPACE-BOOTSTRAP.md` and a docs-only SQL example in
`docs/examples/supabase/active-catalogue-workspace.example.sql`.

The example is not a migration, not seed data, not imported by runtime code,
and not automatically executed by the app. It uses placeholder values only and
documents the future operator review path for setting
`catalogue_public_workspace_config` once Supabase Cloud connection and
deployment work are separately approved.

Catalogue RLS and runtime behaviour from Phase 1M-A are unchanged. Missing
active workspace config intentionally continues to trigger safe fallback to
shell catalogue data rather than exposing cross-workspace base-table reads.

## Non-Approved Shortcuts

The hardening did not add:

- No browser Supabase client code.
- Client-provided workspace authorization.
- No service-role keys.
- Service-role catalogue reads.
- `NEXT_PUBLIC_SUPABASE_*` variables.
- Product, category, or product image mutation routes.
- Product/category/product image writes.
- Supabase Cloud connection.
- Supabase CLI usage.
- Deployment configuration.
- n8n workflow changes.

## Deferred

Supabase Cloud connection, deployment, browser Supabase clients, service-role
reads/writes, production seed data, product persistence, conversation/message
persistence, admin/auth UI, and Supabase Storage wiring remain deferred.
