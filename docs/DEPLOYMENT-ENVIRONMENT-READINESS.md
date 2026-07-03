# Deployment Environment Readiness

Phase 2D-A is readiness only. No deployment is performed, no Supabase Cloud
connection is used, no Vercel project config is added, and no real environment
values are added.

This document is the reviewed environment contract for a future deployment of
the `website/` Next.js app after the catalogue, storage-backed listing media,
admin shell, and quote workflow phases. It classifies environment variables by
visibility and names the reviews required before public traffic is enabled.
Phase 2L-A/B adds local release-candidate acceptance coverage for these
surfaces. No deployment is performed by that release-candidate acceptance
work.
Phase 2M-A/B adds preview/deployment review preflight and CI parity
hardening. No deployment is performed by that preflight work.
Phase 2N-A/B adds server runtime configuration hardening and a local deploy
dry-run harness. No deployment is performed by that dry-run work.
Phase 2O-A/B adds preview deployment approval package docs and redacted
operator evidence templates. No deployment is performed by that approval
package work.

The final hosted Hostinger/Coolify/VPS execution sequence for the owner MVP is
documented in `docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md`. This document
remains the environment contract; the hosted runbook owns the cutover
checklist, hold conditions, and rollback/disable sequence.

The current hosted target is Hostinger VPS/Coolify for the `website/` Next.js
app, not a Vercel-hosted `website/` Next.js app. The hosted execution sequence
lives in `docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md`. Hosted Supabase and
Resend are required services for the current owner-MVP launch path. Any
temporary server-side n8n provider remains optional and integration-specific;
n8n must not be treated as required for owner-MVP public launch unless it is
explicitly approved in a separate scoped task. No `website/chat-config.js`,
`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, `SUPABASE_SERVICE_ROLE_KEY`,
`N8N_CHAT_WEBHOOK_URL`, `PINECONE_*`, or `HUBSPOT_*` runtime dependency is
required for owner-MVP launch; server-only Supabase remains behind first-party routes. Catalogue
missing-env behaviour renders safe unavailable or empty recovery states instead of sample listings. Quote route fails safely, and Chat route fails safely, when
required runtime configuration is absent. Future deployment preflight checklist now lives in the required pre-deployment review below. Future
deployment preflight checklist coverage is preserved.

The machine-readable companion contract is:

```text
docs/contracts/server-env-contract.json
```

It lists names, feature ownership, visibility, and browser-exposure rules only.
It does not contain values.

The server runtime parser in `website/lib/server-runtime-config.ts` is the
code-level contract for the existing server-only app settings. It normalizes
missing or invalid values into safe unavailable, empty-recovery, or
provider-unavailable behaviour and exposes only public-safe issue names/reasons
for local review.

## Public-safe client env

No public client environment variable is currently required for SKR deployment.

Allowed future public variables must be reviewed separately, must be
non-secret, and must not include Supabase, n8n, workspace, admin, quote, or
provider credentials. No `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, or
`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE` variable may be present.

`NEXT_PUBLIC_SKR_DEMO_CONTENT` may remain a local/review-only demo content
switch, but it must not be set to `true` in the hosted production environment.

## Server-only app env

These values are used only by server-side Next.js routes, repositories, or
helpers:

- `CHAT_PROVIDER`: server-side provider selector for the first-party chat API.
- `CHAT_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  chat throttling.
- `QUOTE_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  quote throttling.
- `QUOTE_ENQUIRY_EMAIL_PROVIDER`: optional server-side quote email provider
  selector; blank or missing defaults to `resend`.
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT`: server-only business recipient for quote
  enquiry email handoff.
- `QUOTE_ENQUIRY_EMAIL_FROM`: server-only verified Resend sender/from address.
- `RESEND_API_KEY`: server-only Resend provider secret for quote enquiry email
  handoff.
- `ADMIN_EXPECTED_ORIGIN`: trusted expected admin request origin.
- `ADMIN_EXPECTED_HOST`: trusted expected admin request host.
- `ADMIN_CSRF_PROOF_SECRET`: server-only proof signing secret for admin CSRF
  proof material.

Trusted client IP header values must name only headers overwritten by the
deployment proxy or CDN. In-process quote and chat throttling remains
best-effort and must not be treated as final distributed abuse protection.

## Quote enquiry email handoff env

Quote enquiry email delivery is server-only and environment-managed:

- `QUOTE_ENQUIRY_EMAIL_PROVIDER`: optional. Omit or set to `resend`; unsupported
  values are invalid.
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT`: required before production quote email
  handoff is enabled. Must be a valid email address.
- `QUOTE_ENQUIRY_EMAIL_FROM`: required for Resend. Must be a valid email
  address on a verified Resend sending domain or sender identity.
- `RESEND_API_KEY`: required for Resend. Store only as a server-side secret.

Safe example names for local documentation or screenshots:

- Provider env name: `QUOTE_ENQUIRY_EMAIL_PROVIDER`; safe placeholder value:
  `resend`.
- Recipient env name: `QUOTE_ENQUIRY_EMAIL_RECIPIENT`; safe placeholder
  address: `events@example.invalid`.
- From env name: `QUOTE_ENQUIRY_EMAIL_FROM`; safe placeholder address:
  `quotes@example.invalid`.
- Provider API key env name: `RESEND_API_KEY`; use only the hosting
  provider's server-side secret field for the real value.

Do not commit real values. Do not paste `RESEND_API_KEY` into PR bodies,
screenshots, admin pages, browser code, logs, or `.env` examples.

Resend setup expectation:

1. Verify the sending domain or sender identity in Resend outside this repo.
2. Use that verified address as `QUOTE_ENQUIRY_EMAIL_FROM`.
3. Store `RESEND_API_KEY` only in the hosting provider's server-side secret
   store.
4. Run the readiness command in the same runtime environment before hosting:

```powershell
npm run validate:quote-email-runtime-readiness
```

The readiness command reports only env names and status labels. It
distinguishes configured, missing recipient, missing from address, missing
provider API key, and unsupported provider states without printing values.
Normal local/CI release validation does not require real email secrets; this
readiness command is the production-hosting check.

Safe quote submission verification after env is configured:

1. Submit a normal public quote request through the existing quote form or
   first-party `POST /api/quote` path.
2. Confirm the quote persisted first, then the server attempted email handoff.
3. Expect the public response to be success only when persistence and email
   delivery both succeed.
4. Expect a generic 503-style public response with a request reference when the
   email handoff is unconfigured or fails.
5. Inspect protected admin Enquiry Email for provider/recipient status and
   redacted recipient only.
6. Inspect protected admin Delivery Log for technical delivery metadata only.

Expected storage and privacy behaviour:

- Delivery log rows store technical metadata only: request/reference ids,
  provider, status, provider message id or safe error code, attempted time, and
  redacted recipient state.
- Delivery log rows do not store raw email bodies, full customer messages, item
  details, raw provider payloads, headers, cookies, tokens, secrets, or provider
  response bodies.
- Admin Enquiry Email remains status-only. It has no editable settings and must
  not show `RESEND_API_KEY`, raw env values, or provider response bodies.

Do not expect this feature to provide a quote inbox, quote detail admin route,
customer confirmation email, retry system, webhook, bounce handling, scheduler,
CRM workflow, HubSpot sync, customer accounts, public quote tracking, cart,
checkout, payment, order, booking, reservation, stock, or fulfilment flow.

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

## Optional n8n/server-only webhook env

Any separately approved temporary n8n bridge remains server-only and
integration-specific:

- `N8N_CHAT_WEBHOOK_URL`: server-only n8n webhook URL for a separately
  approved temporary chat provider.
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
- No production `NEXT_PUBLIC_SKR_DEMO_CONTENT` demo content switch set to
  `true`.
- No browser-visible n8n URLs.
- No browser Supabase unless separately approved.
- No `SUPABASE_SERVICE_ROLE_KEY` in runtime paths.
- No service-role key in browser/client/public env.
- No `website/chat-config.js` source usage.
- No real secrets or env values in docs, examples, PR bodies, screenshots, or
  logs.

Service-role key prohibition in runtime paths remains active. never put service-role keys in browser/client/public env, and never document a path that does so.

## Safe missing-env behaviour

- Catalogue: renders safe unavailable or empty recovery states when Supabase
  env, `CATALOGUE_WORKSPACE_ID`, the RPC response, or the active workspace
  config row is missing; sample listings must not be shown as real data.
- Quote: returns a safe persistence-unavailable response when required
  persistence env is missing or persistence fails.
- Chat: returns an explicit safe unavailable response when provider or webhook
  config is missing.
- Admin: protected admin paths fail closed or render generic unavailable states
  when admin auth, workspace, request-security, CSRF, Supabase, or RLS
  dependencies are missing.

## Required pre-deployment review

Before public traffic is enabled, reviewers must confirm:

- No deployment is approved by Phase 2D-A.
- The Phase 2M-A/B preview/deployment preflight in
  `docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md` has been reviewed.
- `npm run validate:release-candidate` has passed locally or in CI for the
  candidate branch.
- `npm run validate:deploy-dry-run` has passed locally for the candidate
  branch without deployment.
- `npm run validate:preview-approval-package` has passed locally or in CI for
  the candidate branch without deployment.
- `docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md` has been reviewed.
- The Phase 2L-A/B release-candidate acceptance suite has passed locally or in
  CI for the candidate branch.
- A later deployment PR has explicit current approval.
- `CATALOGUE_WORKSPACE_ID`, `QUOTE_WORKSPACE_ID`, and
  `ADMIN_TRUSTED_WORKSPACE_ID` are reviewed before public traffic.
- Server-only Supabase env placement is reviewed.
- Server-only n8n webhook placement is reviewed only if a separately approved
  n8n integration is in scope.
- Trusted proxy/CDN client IP header behaviour is reviewed.
- The remaining-work map is reviewed so deployment is not bundled with
  unrelated privacy, runtime, CRM, notification, SaaS chatbot, or ecommerce
  work.
- The smoke-test checklist in `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md` is run
  before public traffic.
- Evidence is captured using redacted templates only. Filled production
  evidence stays outside the repo unless a later approved policy says
  otherwise.
- Direct browser-role listing metadata table writes are blocked while
  `execute_admin_product_write(...)` still succeeds for owner/admin users and
  enqueues a local search-index job.
- Public catalogue/quote UX, protected admin operations, quote workflow,
  admin write-boundary preservation, and search-index non-runtime scope remain
  covered by deterministic release-candidate acceptance checks.

## Deferred

The following remain deferred until separately approved:

- Actual deployment.
- Actual Vercel deployment is not part of the current owner-MVP launch path.
- Vercel project config is not part of the current owner-MVP launch path.
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
