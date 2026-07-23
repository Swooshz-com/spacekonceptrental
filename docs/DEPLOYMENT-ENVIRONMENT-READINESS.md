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
server-side n8n enquiry handoff configuration are required services for the
current owner-MVP launch path. Resend is no longer the SKR app runtime handoff
path; any email provider credential belongs inside n8n. No
`website/chat-config.js`,
`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, `SUPABASE_SERVICE_ROLE_KEY`,
`PINECONE_*`, or `HUBSPOT_*` runtime dependency is required for owner-MVP
launch; server-only Supabase and n8n handoff stay behind first-party routes.
Catalogue
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

`NEXT_PUBLIC_SKR_DEMO_CONTENT` runtime support has been removed. Do not
configure it in local, preview, hosted build, or hosted runtime env; production
must use hosted Supabase data or honest empty states.

## Server-only app env

These values are used only by server-side Next.js routes, repositories, or
helpers:

- `CHAT_PROVIDER`: server-side provider selector for the first-party chat API.
- `CHAT_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  chat throttling.
- `QUOTE_TRUSTED_CLIENT_IP_HEADER`: optional trusted proxy/CDN header name for
  quote throttling.
- `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`: server-only n8n webhook endpoint for
  persisted enquiry handoff.
- `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`: server-only HMAC signing secret for
  persisted enquiry handoff.
- `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`: optional bounded timeout for the n8n
  enquiry handoff request.
- `ADMIN_EXPECTED_ORIGIN`: trusted expected admin request origin.
- `ADMIN_EXPECTED_HOST`: trusted expected admin request host.
- `ADMIN_CSRF_PROOF_SECRET`: server-only proof signing secret for admin CSRF
  proof material.
- `ADMIN_MUTATIONS_ENABLED`: fail-closed server-only admin-write capability.
  Only exact lowercase `true` enables writes. Stage A requires explicit
  `false`; missing, blank, malformed, or false values deny mutation routes.

Trusted client IP header values must name only headers overwritten by the
deployment proxy or CDN. In-process quote and chat throttling remains
best-effort and must not be treated as final distributed abuse protection.

## Quote enquiry n8n handoff env

Quote enquiry handoff is server-only and environment-managed:

- `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`: required before hosted launch handoff is
  enabled. Store only as server-side config.
- `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`: required before hosted launch handoff is
  enabled. Store only as a server-side secret.
- `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`: optional. Must be positive and bounded.

Safe example names for local documentation or screenshots:

- Webhook env name: `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`; do not put a real URL
  in docs, screenshots, PRs, or admin UI.
- Shared secret env name: `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`; store the real
  value only in the hosting provider's server-side secret field.
- Timeout env name: `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`; optional tuning only.

Do not commit real values. Do not paste webhook URLs or shared secrets into PR
bodies, screenshots, admin pages, browser code, logs, or `.env` examples.

n8n setup expectation:

1. Review the inactive repo-side n8n skeleton at
   `n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json`.
2. Replace the skeleton's manual HMAC, timestamp freshness, idempotency, and
   email/internal handoff placeholders inside n8n before activation.
3. Store email credentials in n8n credentials, not in SKR repo files or n8n
   text fields.
4. Configure SKR with the server-only n8n handoff endpoint and shared secret.
5. Apply the hosted Supabase delivery-log contract migration only after
   explicit approval, using
   `docs/N8N-ENQUIRY-HANDOFF-HOSTED-MIGRATION-RUNBOOK.md`.
6. Run the readiness command in the same runtime environment before hosting:

```powershell
npm run validate:quote-email-runtime-readiness
```

The readiness command reports only env names and status labels. It
distinguishes configured, missing webhook endpoint, missing shared secret, and
invalid timeout states without printing values. Normal local/CI release
validation does not require real secrets; this readiness command is the
production-hosting check.

Safe quote submission verification after env is configured:

1. Submit a normal public quote request through the existing quote form or
   first-party `POST /api/quote` path.
2. Confirm the quote persisted first, then the server attempted n8n handoff.
3. Expect the public response to acknowledge receipt after persistence. It must
   not claim email delivery, final quote details, or confirmed rental fit.
4. Expect n8n not-configured or failed attempts to appear only in protected
   Delivery Log with safe status/error categories.
5. Inspect protected admin Enquiry Email for n8n readiness and last status
   only.
6. Inspect protected admin Delivery Log for technical delivery metadata only.

Expected storage and privacy behaviour:

- Delivery log rows store technical metadata only: request/reference ids,
  provider/channel, status, optional safe handoff id or safe error code, and
  attempted time.
- Delivery log rows do not store raw email bodies, full customer messages, item
  details, raw n8n/provider payloads, webhook URLs, workflow execution data,
  headers, cookies, tokens, secrets, or provider response bodies.
- Admin Enquiry Email remains status-only. It has no editable settings and must
  not show webhook URLs, shared secrets, raw env values, or provider response
  bodies.

Do not expect this feature to provide a quote inbox, quote detail admin route,
customer confirmation email, retry system, webhook, bounce handling, scheduler,
CRM workflow, HubSpot sync, customer accounts, public quote tracking, cart,
checkout, payment, order, booking, reservation, stock, or fulfilment flow.

The hosted end-to-end smoke checklist for the later approved enquiry -> n8n ->
email/internal handoff -> Delivery Log verification is
`docs/N8N-ENQUIRY-HANDOFF-HOSTED-SMOKE-CHECKLIST.md`.

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
- `QUOTE_SUBMISSION_ADMISSION_SECRET`: dedicated server-only HMAC secret for
  short-lived, payload-bound quote admission proofs. It must match the private
  database configuration and must not be exposed to browser roles.

`CATALOGUE_WORKSPACE_ID` must match the reviewed
`catalogue_public_workspace_config` active workspace row before DB-backed
catalogue reads are enabled. `QUOTE_WORKSPACE_ID` must match the reviewed
`quote_public_workspace_config` active workspace row before quote persistence
is enabled. These database-owned gates are independent: their workspace IDs
may be equal only when that is the explicit deployment decision, and either
gate fails closed when disabled, missing, mismatched, or pointed at an inactive
workspace.

## Optional n8n/server-only webhook env

Any separately approved temporary n8n bridge remains server-only and
integration-specific. The quote enquiry handoff has its own required env names
listed above. Chat remains separate:

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
- `ADMIN_MUTATIONS_ENABLED`: fail-closed protected-admin mutation capability;
  never expose it through `NEXT_PUBLIC_*`.

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

Every protected admin mutation also requires the server-only
`ADMIN_MUTATIONS_ENABLED` capability. Stage A requires the capability to be
disabled while login, callback, logout, session reads, and protected admin-page
reads remain functional. Missing, blank, malformed, and false values fail
closed before repository or provider mutation. Exact lowercase `true` is a
later separately reviewed activation and does not replace authentication,
workspace, role, CSRF, Origin/Referer, or validation controls.

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
- No `NEXT_PUBLIC_SKR_DEMO_CONTENT`; the public demo-content runtime switch is
  removed and forbidden.
- No browser-visible n8n URLs.
- No client/public exposure of `ADMIN_MUTATIONS_ENABLED`.
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
- Admin mutations: deny with a stable privacy-safe result before repository or
  provider mutation unless `ADMIN_MUTATIONS_ENABLED` is exact lowercase
  `true`.

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
- live n8n workflow import, activation, execution, or mutation.
