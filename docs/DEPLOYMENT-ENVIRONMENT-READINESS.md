# Deployment Environment Readiness

Phase 2D-A is readiness only. No deployment is performed, no Supabase Cloud
connection is used, no Vercel project config is added, and no real environment
values are added.

This document is the reviewed environment contract for a future deployment of
the `website/` Next.js app after the catalogue, storage-backed listing media,
admin shell, and quote workflow phases. It classifies environment variables by
visibility and names the reviews required before public traffic is enabled.

The future target shape remains a Vercel-hosted `website/` Next.js app with
server-only Supabase and a temporary server-side n8n provider behind
first-party routes. Catalogue missing-env behaviour keeps safe fallback to shell catalogue data. Quote route fails safely, and Chat route fails safely,
when required runtime configuration is absent. The future deployment preflight
checklist now lives in the required pre-deployment review below. Future deployment preflight checklist coverage is preserved.

The machine-readable companion contract is:

```text
docs/contracts/server-env-contract.json
```

It lists names, feature ownership, visibility, and browser-exposure rules only.
It does not contain values.

## Public-safe client env

No public client environment variable is currently required for SKR deployment.

Allowed future public variables must be reviewed separately, must be
non-secret, and must not include Supabase, n8n, workspace, admin, quote, or
provider credentials. No `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, or
`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE` variable may be present.

## Server-only app env

These values are used only by server-side Next.js routes, repositories, or
helpers:

- `CHAT_PROVIDER`: server-side provider selector for the first-party chat API.
- `CHAT_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  chat throttling.
- `QUOTE_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  quote throttling.
- `ADMIN_EXPECTED_ORIGIN`: trusted expected admin request origin.
- `ADMIN_EXPECTED_HOST`: trusted expected admin request host.
- `ADMIN_CSRF_PROOF_SECRET`: server-only proof signing secret for admin CSRF
  proof material.

Trusted client IP header values must name only headers overwritten by the
deployment proxy or CDN. In-process quote and chat throttling remains
best-effort and must not be treated as final distributed abuse protection.

## Supabase/project env

These values are server-only even when the Supabase anon key is used:

- `SUPABASE_URL`: server-side Supabase project endpoint used only by server
  helpers.
- `SUPABASE_ANON_KEY`: server-side anon key used with RLS through first-party
  server routes, repositories, and session-bound server clients.
- `CATALOGUE_WORKSPACE_ID`: trusted server-side workspace gate for DB-backed
  public catalogue reads.
- `QUOTE_WORKSPACE_ID`: trusted server-side workspace gate for public quote
  persistence.

`CATALOGUE_WORKSPACE_ID` must match the reviewed
`catalogue_public_workspace_config` active workspace row before DB-backed
catalogue reads are enabled. `QUOTE_WORKSPACE_ID` must match the reviewed quote
capture workspace before quote persistence is enabled.

## n8n/server-only webhook env

The temporary n8n bridge remains server-only:

- `N8N_CHAT_WEBHOOK_URL`: server-only n8n webhook URL for the temporary chat
  provider.
- `N8N_CHAT_WEBHOOK_TIMEOUT_MS`: optional server-only timeout setting.

n8n webhook values are server-only. Browser code must call only first-party
`POST /api/chat`; it must never receive, reconstruct, log, or configure n8n
webhook values. The app must not read `website/chat-config.js`.

## Admin/auth/workspace env

These values are server-only and are required for protected admin runtime
paths:

- `ADMIN_TRUSTED_WORKSPACE_ID`: trusted admin workspace gate for protected
  admin catalogue, listing media, and quote workflow operations.
- `ADMIN_EXPECTED_ORIGIN`: expected first-party admin origin.
- `ADMIN_EXPECTED_HOST`: expected first-party admin host.
- `ADMIN_CSRF_PROOF_SECRET`: server-only CSRF proof signing secret.

`ADMIN_TRUSTED_WORKSPACE_ID` must be reviewed separately from
`CATALOGUE_WORKSPACE_ID` and `QUOTE_WORKSPACE_ID`. It must not be supplied by
the browser and must not be inferred from public catalogue workspace config.

## Listing media bucket expectations

The `listing-media` bucket is public. Object serving is public to anyone with
the unguessable server-generated URL. Public catalogue rendering remains
metadata-gated by trusted public read surfaces; RLS must not be described as a
public URL serving gate.

Storage writes remain protected admin operations requiring same-origin request
checks, CSRF proof validation, owner/admin workspace scope, and a session-bound
authenticated Supabase client. Customer uploads and arbitrary public upload
routes remain forbidden.

## Admin write-boundary expectations

Admin listing/category/image metadata writes must use the protected
first-party admin API route, CSRF/session/workspace/admin gate, and
`execute_admin_product_write(...)`. Direct authenticated browser-role writes to
`categories`, `products`, `product_images`, and product audit inserts are
blocked.

The approved RPC performs the metadata mutation, product audit insert, and
local search-index job enqueue in one database transaction. Reviewers should
confirm admin UI writes still enqueue a local search-index job and that no
Pinecone, n8n, sync worker, vector upsert/delete, retrieval, or external search
runtime is added.

Storage object writes for listing media remain separate from product metadata
table writes. The protected upload route may verify a product exists in the
trusted workspace and write to the approved `listing-media` bucket, but listing
image metadata must still be created through `execute_admin_product_write(...)`.

## Forbidden env exposure

Forbidden exposure includes:

- No `NEXT_PUBLIC_SUPABASE_*`.
- No `NEXT_PUBLIC_N8N*`.
- No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE`.
- No browser-visible n8n URLs.
- No browser Supabase unless separately approved.
- No `SUPABASE_SERVICE_ROLE_KEY` in runtime paths.
- No service-role key in browser/client/public env.
- No `website/chat-config.js` source usage.
- No real secrets or env values in docs, examples, PR bodies, screenshots, or
  logs.

Service-role key prohibition in runtime paths remains active. never put service-role keys in browser/client/public env, and never document a path that does so.

## Safe missing-env behaviour

- Catalogue: uses safe fallback catalogue data when Supabase env,
  `CATALOGUE_WORKSPACE_ID`, the RPC response, or the active workspace config
  row is missing.
- Quote: returns a safe persistence-unavailable response when required
  persistence env is missing or persistence fails.
- Chat: returns or delegates to safe fallback behaviour when provider or
  webhook config is missing.
- Admin: protected admin paths fail closed or render generic unavailable states
  when admin auth, workspace, request-security, CSRF, Supabase, or RLS
  dependencies are missing.

## Required pre-deployment review

Before public traffic is enabled, reviewers must confirm:

- No deployment is approved by Phase 2D-A.
- A later deployment PR has explicit current approval.
- `CATALOGUE_WORKSPACE_ID`, `QUOTE_WORKSPACE_ID`, and
  `ADMIN_TRUSTED_WORKSPACE_ID` are reviewed before public traffic.
- Server-only Supabase env placement is reviewed.
- Server-only n8n webhook placement is reviewed.
- Trusted proxy/CDN client IP header behaviour is reviewed.
- The remaining-work map is reviewed so deployment is not bundled with
  unrelated privacy, runtime, CRM, notification, SaaS chatbot, or ecommerce
  work.
- The smoke-test checklist in `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md` is run
  before public traffic.
- Evidence is captured using `docs/templates/DEPLOYMENT-EVIDENCE.md`.
- Direct browser-role listing metadata table writes are blocked while
  `execute_admin_product_write(...)` still succeeds for owner/admin users and
  enqueues a local search-index job.

## Deferred

The following remain deferred until separately approved:

- Actual deployment.
- Actual Vercel deployment.
- Vercel project config.
- Supabase Cloud connection.
- Production seed data.
- Service-role runtime paths.
- Browser Supabase client code.
- Customer uploads.
- Arbitrary public upload routes.
- Public quote status tracking.
- Notifications or CRM integration.
- Customer accounts, carts, checkout, payments, stock reservation, order
  fulfilment, confirmed booking, or online ordering.
- n8n workflow import, export, activation, execution, or mutation.
