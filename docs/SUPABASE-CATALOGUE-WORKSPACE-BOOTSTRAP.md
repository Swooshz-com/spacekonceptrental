# Supabase Catalogue Workspace Bootstrap

Phase 1N-A documents the safe operational path for setting the active public
catalogue workspace after Phase 1M-A. It adds only a docs-only SQL example and
static guards. It does not connect to Supabase Cloud, add production seed data,
change catalogue RLS, or add a service-role runtime path.

## What The Config Row Does

`catalogue_public_workspace_config` is the database-owned singleton that points
the trusted public catalogue read surface at one active workspace. The
server-only catalogue repository resolves `CATALOGUE_WORKSPACE_ID` from trusted
server-side configuration and calls
`get_public_catalogue(expected_workspace_id, product_slug)`.

The RPC returns published public catalogue rows only when the server-provided
workspace ID matches the database-owned active workspace config. The browser
does not choose the workspace and never receives a Supabase client.

## Why It Is Required

After Phase 1M-A, direct anonymous base-table reads for `categories`,
`products`, and `product_images` are denied. DB-backed public catalogue reads
therefore depend on all of these being present:

- Server-side `SUPABASE_URL`.
- Server-side `SUPABASE_ANON_KEY`.
- Trusted server-side `CATALOGUE_WORKSPACE_ID`.
- An enabled `catalogue_public_workspace_config` row that points to the same
  active workspace.

If the Supabase env, `CATALOGUE_WORKSPACE_ID`, RPC result, or missing config
prevents a trusted DB-backed read, the runtime intentionally uses the existing
safe fallback to shell catalogue data. That fallback keeps local builds and
unconfigured environments working without exposing cross-workspace catalogue
rows.

Treat the row as deployment/database-owned configuration, not browser input.
Client-provided workspace IDs must never authorize public catalogue reads.

## Phase 1N-A Boundaries

No Supabase Cloud work is performed in this phase.

No production seed data is added in this phase.

No service-role runtime writes are approved in this phase.

This phase also does not add browser Supabase code, product/category/product
image writes, quote persistence changes, quote throttling changes,
conversation/message persistence writes, admin/auth UI, Supabase Storage
wiring, deployment configuration, or n8n workflow changes.

The local-only scaffold is:

```text
docs/examples/supabase/active-catalogue-workspace.example.sql
```

It is an operator-reviewed template for later approved database work. It is not
a production migration, not a seed file, not imported by runtime code, and not
automatically executed by the app.

## Future Operator Process

Once Supabase Cloud connection and deployment work are separately approved,
operators should set the active catalogue workspace through an approved
database change process:

1. Identify the reviewed workspace that should power the public catalogue.
2. Verify the workspace exists, is active, and is the intended deployment
   workspace.
3. Verify published categories, products, and product images are ready for
   public display.
4. Review the SQL template and replace only the placeholder workspace ID with
   the approved workspace ID.
5. Run the change in a transaction and verify `get_public_catalogue` returns
   only the intended public rows.
6. Commit the transaction only after review; otherwise roll it back.
7. Record the operator, timestamp, environment, workspace ID, and verification
   result in the approved change log for that environment.

The template intentionally starts with rollback-oriented review posture. The
future production process may adapt the exact transaction wrapper, but it must
preserve the same review, verification, and rollback expectations.

## Manual Verification Before Enabling

Before enabling DB-backed public catalogue reads in a real environment, verify:

- Supabase server env is configured only in the server/deployment environment.
- `CATALOGUE_WORKSPACE_ID` names the intended workspace and is not browser
  visible.
- `catalogue_public_workspace_config` points to the same active workspace.
- `get_public_catalogue` returns published categories and products only for
  that workspace.
- Product images are returned only for published products in that workspace.
- Draft, unpublished, private, quote, conversation, message, membership,
  usage, and audit rows remain unreadable to anonymous callers.
- Direct anonymous base-table catalogue reads still return no rows.
- Missing or disabled config still triggers safe fallback to shell catalogue
  data.
- No service-role key, browser Supabase client, deployment secret, live n8n
  webhook, or production seed file is introduced for the public catalogue
  runtime.

## Deferred

The following remain deferred until separately approved:

- Supabase Cloud connection.
- Deployment configuration.
- Production seed data.
- Service-role runtime writes.
- Browser Supabase client code.
- Product/category/product image persistence writes.
- Public product/category/product image mutation routes.
- Conversation/message persistence writes.
- Admin/auth UI.
- Supabase Storage wiring.
- Multi-host workspace routing.
