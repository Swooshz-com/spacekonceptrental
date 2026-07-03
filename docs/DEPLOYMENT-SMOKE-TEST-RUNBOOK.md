# Deployment Smoke-Test Runbook

No deployment is approved by this runbook.

This runbook does not approve or perform deployment.

Phase 2D-A is preparation only. It does not deploy, connect Supabase Cloud, add
hosting provider project config, add real env values, add production config, or
change runtime behaviour.

Phase 2L-A/B adds release-candidate acceptance coverage before any future
preview/deployment review. No deployment is performed by the
release-candidate acceptance suite.

Phase 2M-A/B adds preview/deployment review preflight and CI parity
hardening before any future preview/deployment review. No deployment is
performed by the preflight gate.

Phase 2N-A/B adds server runtime configuration hardening and a local deploy
dry-run harness. No deployment is performed by the dry-run harness.

Phase 2O-A/B adds preview deployment approval package docs and redacted
operator evidence templates before any later deployment approval. No
deployment is performed by Phase 2O-A/B.

## Purpose

Use this runbook during a future approved deployment review to prove the SKR
public site, admin-managed furniture/event-rental catalogue, storage-backed
listing media, quote request flow, admin quote workflow, and any separately
approved temporary server-only n8n chat bridge behave safely before public
traffic is enabled.

## Scope

This runbook covers:

- Required pre-deployment review.
- Environment contract review.
- Active catalogue workspace configuration.
- Quote workspace configuration.
- Admin trusted workspace configuration.
- Listing media bucket expectations.
- Optional server-only n8n webhook expectations when a separately approved n8n
  integration is in scope.
- Trusted proxy/CDN client IP header review.
- Rate-limit caveats.
- Smoke-test sequence.
- Rollback/disable plan.
- Evidence checklist.

## Non-goals

This runbook does not approve:

- Real deployment.
- Vercel project config for the current owner-MVP hosted target.
- Supabase Cloud connection.
- Production seed data.
- Service-role runtime reads or writes.
- Browser Supabase.
- Customer uploads or arbitrary public upload routes.
- Public quote status tracking or customer-visible internal notes.
- Notifications or CRM integration.
- Customer accounts, carts, checkout, payments, stock reservation, order
  fulfilment, confirmed booking, or online ordering.
- Live n8n workflow import, export, activation, execution, or mutation.

## Required pre-deployment review

Before any future deployment is approved, reviewers must confirm:

- The deployment PR has explicit current approval to deploy.
- The target environment name is recorded as `<environment-name>`.
- The target deployment URL placeholder is recorded as `<deployment-url>` until
  the deployment exists.
- Server-only Supabase settings are represented only by placeholders such as
  `<server-only-supabase-url>`.
- Any separately approved n8n webhook is represented only by
  `<server-only-n8n-webhook-url>`.
- The selected Supabase project is reviewed without committing real project
  URLs, keys, dashboard links, or screenshots containing secrets.
- `CATALOGUE_WORKSPACE_ID`, `QUOTE_WORKSPACE_ID`, and
  `ADMIN_TRUSTED_WORKSPACE_ID` are reviewed before public traffic.
- Rollback owner, backup approver, rollback trigger, and rollback action are
  named.
- The remaining-work map is reviewed so deployment does not bundle unrelated
  privacy, runtime, CRM, notification, SaaS chatbot, or ecommerce work.
- Smoke-test evidence will be captured using
  `docs/templates/DEPLOYMENT-EVIDENCE.md`.

## Environment contract review

Review `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md` and
`docs/contracts/server-env-contract.json` before deployment. Confirm:

- No public client env is currently required.
- Supabase, catalogue, quote, admin, any separately approved n8n integration,
  and trusted proxy settings are server-only.
- No `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, or
  `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE` variable exists.
- No `SUPABASE_SERVICE_ROLE_KEY` runtime path exists.
- No browser Supabase is introduced.
- No `website/chat-config.js` source usage exists.
- No real env values appear in docs, screenshots, PR bodies, logs, or browser
  configuration.
- `npm run validate:production-security-readiness` passes in local/dev mode
  without real production secrets.
- `npm run validate:production-security-readiness -- --launch`
  passes in the hosted/runtime environment after server-side env is
  configured.

Service-role runtime paths remain forbidden unless separately approved.

## Phase 2A-A compatibility labels

The original Phase 2A-A guard names are retained as aliases for the current
Phase 2D-A sections:

- Required preflight review.
- Server-only env placement checks.
- Forbidden public/browser env checks.
- Active catalogue workspace checks.
- Quote workspace checks.
- Server-only n8n webhook checks are optional when separately approved.
- Trusted proxy/client IP header checks.
- Catalogue fallback smoke tests.
- DB-backed catalogue smoke tests.
- Quote submission smoke tests.
- Chat fallback smoke tests.
- Server-only n8n chat smoke tests are optional when separately approved.
- Failure/rollback checks.
- Post-deployment monitoring checks.
- Evidence to capture in the future deployment PR.
- server-only Supabase env placement.

## Active catalogue workspace configuration

Before DB-backed catalogue reads are enabled:

- Confirm `<approved-catalogue-workspace-id>` is the intended public catalogue
  workspace for `<environment-name>`.
- Confirm the reviewed `catalogue_public_workspace_config` row points to the
  same workspace.
- Confirm `CATALOGUE_WORKSPACE_ID` matches the reviewed row.
- Confirm public catalogue rendering is metadata-gated by active published
  listing data.
- Confirm draft, archived, inactive, or other-workspace listings do not render.
- Confirm missing or disabled DB config returns the safe catalogue fallback.

## Quote workspace configuration

Before public quote persistence is enabled:

- Confirm `<approved-quote-workspace-id>` is the intended quote capture
  workspace for `<environment-name>`.
- Confirm `QUOTE_WORKSPACE_ID` matches the reviewed workspace.
- Confirm quote submissions still go only through first-party `POST /api/quote`.
- Confirm quote route errors remain normalized and do not expose provider,
  SQL, stack trace, customer internals, or workspace details.
- Confirm no quote throttling constants or trusted header behaviour changed as
  part of deployment.

## Admin trusted workspace configuration

Before protected admin smoke tests:

- Confirm `ADMIN_TRUSTED_WORKSPACE_ID` is the intended protected admin
  workspace for `<environment-name>`.
- Confirm `ADMIN_TRUSTED_WORKSPACE_ID` is reviewed separately from public
  catalogue and quote workspace settings.
- Confirm `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, and
  `ADMIN_CSRF_PROOF_SECRET` are server-only.
- Confirm owner/admin memberships can access protected admin workflows.
- Confirm viewer, no-membership, and wrong-workspace actors are denied.

## Listing media bucket expectations

The `listing-media` bucket is public. Object serving is public to anyone with
the unguessable server-generated URL. Public catalogue rendering is
metadata-gated; RLS is not a public URL serving gate.

Before public traffic:

- Confirm uploaded listing image URLs come only from active published metadata.
- Confirm fallback images render when no public listing image URL exists.
- Confirm admin listing image upload remains protected by the admin shell,
  `productImage.write`, same-origin checks, CSRF proof, trusted workspace
  scope, and session-bound authenticated Supabase access.
- Confirm no customer upload route and no arbitrary public upload route exists.

## Optional server-only n8n webhook expectations

Before chat provider smoke testing, only if a separately approved n8n
integration is in scope:

- Confirm `N8N_CHAT_WEBHOOK_URL` is stored only as server-only n8n webhook env.
- Confirm browser code calls only `POST /api/chat`.
- Confirm the browser bundle contains no n8n webhook URL and no
  `NEXT_PUBLIC_N8N*` variable.
- Confirm n8n workflow JSON is not changed for deployment.
- Confirm no live n8n workflow import, export, activation, execution, or
  mutation is part of the deployment PR unless separately approved.

## Local validation checklist

Run these commands before a future deployment PR is considered for public
traffic:

- `npm run validate:release-candidate`.
- `npm run validate:deploy-dry-run`.
- `npm run validate:preview-approval-package`.
- Confirm the Phase 2L-A/B release-candidate acceptance tests are included in
  `cd website && npm test`.
- `cd website && npm test`.
- `cd website && npm run typecheck`.
- `cd website && npm run build`.
- `npm run validate:supabase-migrations`.
- `npm run test:supabase-migrations`.
- `npm run test:supabase-rls`.
- `npm run validate:production-security-readiness` locally without real
  production secrets.
- `git diff --check`.

## Manual smoke-test checklist

- Public homepage loads.
- Public listings load.
- Public listing detail loads.
- Public quote/enquiry can submit customer message with no item selected.
- Public quote success has no tracking/status link.
- Admin login/route gate blocks unauthenticated users.
- Admin dashboard loads.
- Admin category/listing/image metadata write works through protected UI/API.
- Local search-index job is enqueued after admin listing/category/image write.
- Admin quote inbox/detail shows customer message and separates internal notes.
- Admin quote status/internal note update works.
- Public user cannot read quote records back.
- Public catalogue pages display published public-safe listing/category/image
  data only.
- Direct authenticated browser-role writes to listing metadata tables fail.

## Trusted proxy/CDN client IP header review

Before enabling trusted client IP buckets:

- Confirm `CHAT_TRUSTED_CLIENT_IP_HEADER` names only a header overwritten by
  the deployment proxy or CDN.
- Confirm `QUOTE_TRUSTED_CLIENT_IP_HEADER` names only a header overwritten by
  the deployment proxy or CDN.
- Confirm user-supplied forwarding headers are not trusted by default.
- Confirm chat and quote routes still use fail-closed fallback buckets when no
  trusted header is configured or present.

Rate-limit caveats: current in-process throttling is best-effort only. It does
not replace future CDN, WAF, platform, or distributed abuse controls.

## Smoke-test sequence

Run these in order and capture evidence before public traffic.

### Static/fallback homepage

- Visit `<deployment-url>/`.
- Confirm the homepage renders without DB, provider, SQL, stack trace, or secret
  leakage.
- Confirm primary navigation reaches catalogue, events, quote, and chat pages.

### Catalogue fallback without DB config

- In a reviewed missing-env environment, visit `<deployment-url>/catalogue`.
- Confirm the catalogue fallback renders without Supabase env.
- Visit a fallback listing detail path.
- Confirm no Supabase error, workspace ID, or stack trace appears.

### DB-backed public catalogue reads for active workspace

- With reviewed server-only Supabase env and `CATALOGUE_WORKSPACE_ID`, visit
  `<deployment-url>/catalogue`.
- Confirm active published listings from the reviewed workspace render.
- Confirm inactive, draft, archived, or other-workspace listings do not render.
- Confirm public catalogue pages remain read-only.

### Listing detail page

- Visit a reviewed DB-backed listing detail page.
- Confirm the listing name, category, rental unit, description, and quote CTA
  render from public read data only.
- Confirm fallback detail content remains safe if the listing is unavailable.

### Uploaded listing image rendering using existing public bucket model

- Confirm catalogue cards render reviewed uploaded image URLs when available.
- Confirm the detail page renders the primary image and additional gallery
  images when available.
- Confirm fallback images render when listing media is missing.
- Confirm known object URLs are public by URL, while website rendering remains
  metadata-gated.

### Public quote form submission

- Confirm launch mode has already passed in the hosted/runtime environment.
- Submit a valid quote request through `<deployment-url>/quote`.
- Confirm the browser receives only safe public receipt fields.
- Confirm the quote row is created in the reviewed quote workspace through the
  approved database inspection process.
- Confirm the server-side quote email handoff succeeds only after the Resend
  sender/domain has been verified outside the repo.
- Confirm missing or failed email handoff returns a generic temporary
  unavailable response with a safe reference id and no provider response body.
- Confirm invalid payloads are rejected before persistence.
- Confirm throttled responses remain safe generic `429` responses.

### Protected Enquiry Email And Delivery Log

- Visit `<deployment-url>/admin/enquiry-email` as an approved owner/admin.
- Confirm provider/recipient status is status-only and any recipient display is
  redacted.
- Visit `<deployment-url>/admin/delivery-log`.
- Confirm recent rows show bounded technical metadata only: provider, delivery
  status, safe provider message id or safe error code, request reference,
  timestamp, and redacted recipient.
- Confirm the pages do not expose customer messages, requested item detail,
  full email bodies, raw provider payloads, headers, cookies, tokens, secrets,
  API keys, or provider response bodies.

### Quote handoff from catalogue/detail to quote page

- Use catalogue and listing detail CTA links to reach `<deployment-url>/quote`.
- Confirm optional listing context is display-only and resolved through public
  catalogue data before it appears.
- Confirm the quote backend contract is unchanged and does not trust query
  string context as authoritative input.

### Admin login/protected shell

- Visit `<deployment-url>/admin`.
- Confirm unauthenticated access reaches the generic login or unauthenticated
  state.
- Sign in with a reviewed admin account.
- Confirm the protected shell renders without provider, SQL, token, membership,
  workspace, or stack trace leakage.

### Admin product/category/listing management access

- As an owner/admin, confirm category and listing management controls render.
- Confirm create, edit, publish/unpublish, and archive actions remain
  first-party, CSRF-protected, RPC-backed, and generic in success/failure
  states.
- Confirm metadata mutations go through `execute_admin_product_write(...)`.
- Confirm direct authenticated inserts, updates, and deletes on `categories`,
  `products`, and `product_images` fail.
- Confirm a successful admin metadata write creates the expected product audit
  row and enqueues a local search-index job.
- Confirm viewer or wrong-workspace users cannot use management controls.

### Admin listing image upload

- Upload an approved listing image through the protected admin UI.
- Confirm only approved image types and size limits are accepted.
- Confirm metadata is created through the existing listing image metadata
  contract.
- Confirm upload failures and metadata failures do not expose storage paths,
  provider errors, SQL, tokens, or secrets.

### Admin quote inbox/status/internal note workflow

- Open the protected admin quote inbox.
- Confirm recent quote requests and item snapshots render only for the trusted
  admin workspace.
- Save a status change and bounded internal note.
- Confirm public quote pages do not show quote workflow status or internal
  notes.

### Atomic quote workflow RPC behaviour

- Confirm the protected admin status/note action persists through
  `execute_admin_quote_workflow`.
- Confirm status and internal activity succeed or fail together.
- Confirm direct authenticated table writes remain revoked or narrowed.
- Confirm oversized notes, viewer users, no-membership users, wrong-workspace
  users, and anonymous callers are denied.

### Chat safe fallback

Chat fallback checks are not an owner-MVP public launch requirement unless a
separately approved chat integration is in scope.

- With n8n webhook env absent or disabled in a reviewed non-production check,
  send a chat message.
- Confirm the browser calls only `POST /api/chat`.
- Confirm the response is safe fallback or provider-unavailable copy.
- Confirm no n8n webhook URL, provider internals, trace ID, node name, or stack
  trace appears.

### Server-only n8n webhook path

- With separately approved server-only n8n webhook env, send a bounded chat
  message.
- Confirm the browser still calls only `POST /api/chat`.
- Confirm the server-side provider returns a normalized assistant response.
- Confirm timeout and provider error responses remain normalized.
- Confirm no browser-visible n8n URL or `NEXT_PUBLIC_N8N*` variable appears.

### 404/error states

- Visit a nonexistent public route and a nonexistent catalogue detail route.
- Confirm responses are generic and do not expose provider, SQL, storage,
  workspace, token, env, or stack details.

### No provider/SQL/secret leakage

- Review page output, network responses, server logs, and browser console.
- Confirm no provider internals, SQL, stack traces, env names with values,
  storage internals, tokens, webhook URLs, customer payloads, or private
  dashboard links are exposed.

### No browser console exposure of server-only env values

- Inspect browser console and built page source.
- Confirm server-only env values are not present.
- Confirm no Supabase service-role key, n8n webhook URL, workspace IDs, admin
  secrets, CSRF secrets, or provider credentials are visible.

## Rollback/disable plan

Do not add runtime kill switches in Phase 2D-A. Use existing hosting,
configuration, and rollback controls:

- Disable public traffic through the approved hosting or edge control.
- Remove or rotate leaked env values.
- Disable n8n webhook env by removing the server-only value.
- Revert deployment through the approved hosting rollback process.
- Verify fallback catalogue behaviour after DB env or active config is removed.
- Verify quote submission is unavailable or safe if env is removed.
- Verify chat fallback is safe if provider env is removed.
- Capture incident notes, timeline, affected surfaces, evidence, and follow-up
  actions in the deployment PR or incident record.

## Rollback notes

- Database migration rollback considerations: reverting Phase 2K hardening
  would re-open direct authenticated browser-role metadata writes, so rollback
  requires a reviewed compensating control or immediate re-application of the
  RPC-only write boundary.
- Admin write-boundary hardening rollback considerations: if
  `execute_admin_product_write(...)` fails in a future deployment, disable
  admin metadata writes at the route/UI level while keeping direct table writes
  blocked until the RPC is repaired.
- No Pinecone/n8n runtime rollback is required for Phase 2K-A/B because no
  Pinecone runtime, n8n workflow/runtime change, retrieval/RAG wiring, sync
  worker, vector upsert/delete, or external search executor is added.

## Evidence checklist

Future deployment PR authors should capture:

- Environment reviewed: `<environment-name>`.
- Deployment target placeholder or reviewed deployment URL:
  `<deployment-url>`.
- Remaining-work map and largest safe bundle rationale.
- Server-only env placement confirmation.
- Forbidden public env confirmation.
- Active catalogue workspace confirmation.
- Quote workspace confirmation.
- Admin trusted workspace confirmation.
- Listing media bucket/model confirmation.
- Optional server-only n8n webhook confirmation when separately approved.
- Trusted proxy/CDN client IP header confirmation.
- Static/fallback homepage smoke-test result.
- Catalogue fallback without DB config smoke-test result.
- DB-backed public catalogue smoke-test result.
- Listing detail page smoke-test result.
- Uploaded listing image rendering smoke-test result.
- Public quote form submission smoke-test result.
- Protected Enquiry Email and Delivery Log status/technical-metadata review
  result.
- Quote handoff smoke-test result.
- Admin login/protected shell smoke-test result.
- Admin product/category/listing management smoke-test result.
- Admin listing image upload smoke-test result.
- Admin quote inbox/status/internal note workflow smoke-test result.
- Atomic quote workflow RPC behaviour smoke-test result.
- Chat safe fallback smoke-test result.
- Optional server-only n8n webhook path smoke-test result when separately
  approved.
- 404/error states smoke-test result.
- No provider/SQL/secret leakage review result.
- No browser console exposure of server-only env values review result.
- Rollback/disable plan review result.
- Known limitations and follow-up decisions.
