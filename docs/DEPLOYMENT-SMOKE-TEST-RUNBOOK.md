# Deployment Smoke-Test Runbook

This runbook does not approve or perform deployment.

Phase 2A-A is preparation only. It gives future operators a reviewed checklist
for a later Vercel and Supabase deployment PR, but it does not connect to
Supabase Cloud, add Vercel config, add real env values, add production config,
or change runtime behaviour.

## Purpose

Use this runbook during a future approved deployment review to prove that the
Phase 1 app foundation still behaves safely when real server-only deployment
configuration is present.

The expected target shape is the `website/` Next.js app deployed behind a
first-party browser boundary, with server-only Supabase access and temporary
server-only n8n chat provider access.

## Scope

This runbook covers:

- Required preflight review before deployment.
- Server-only Supabase env placement.
- Forbidden public/browser env checks.
- Active public catalogue workspace checks.
- Quote workspace checks.
- Server-only n8n webhook checks.
- Trusted proxy/client IP header checks.
- Catalogue fallback and DB-backed catalogue smoke tests.
- Quote and chat smoke tests.
- Failure, rollback, monitoring, and evidence capture.

## Non-goals

This runbook does not approve:

- Real deployment.
- Vercel project config.
- Supabase Cloud connection.
- Production seed data.
- Service-role runtime reads or writes.
- Browser Supabase.
- Product/category/product image writes.
- Conversation/message writes.
- Supabase Storage.
- Admin/auth UI.
- Internal SaaS chat/RAG work.
- Live n8n workflow import, export, activation, execution, or mutation.

## Required preflight review

Before any future deployment is approved, reviewers must confirm:

- The deployment PR has explicit current approval to deploy.
- The target environment name is documented as `<environment-name>`.
- The target deployment URL placeholder is recorded as `<deployment-url>` until
  the deployment exists.
- The selected Supabase project is reviewed without committing real project
  URLs, keys, or dashboard links.
- The active catalogue workspace is reviewed as
  `<approved-catalogue-workspace-id>`.
- The quote workspace is reviewed as `<approved-quote-workspace-id>`.
- The temporary n8n webhook is reviewed as a server-only value represented only
  by `<server-only-n8n-webhook-url>`.
- Rollback owner, rollback trigger, and rollback steps are named.
- Smoke-test evidence will be attached to the deployment PR using
  `docs/templates/DEPLOYMENT-EVIDENCE.md`.

## Server-only env placement checks

Confirm server-only Supabase env placement before deployment:

- `SUPABASE_URL` is configured only as a server-side deployment setting and is
  represented in review notes as `<server-only-supabase-url>`.
- `SUPABASE_ANON_KEY` is configured only as a server-side deployment setting
  and is represented as `<server-only-supabase-anon-key>`.
- `CATALOGUE_WORKSPACE_ID` is configured only as a server-side deployment
  setting and matches `<approved-catalogue-workspace-id>`.
- `QUOTE_WORKSPACE_ID` is configured only as a server-side deployment setting
  and matches `<approved-quote-workspace-id>`.
- `CHAT_PROVIDER`, `N8N_CHAT_WEBHOOK_URL`,
  `N8N_CHAT_WEBHOOK_TIMEOUT_MS`, `CHAT_TRUSTED_CLIENT_IP_HEADER`, and
  `QUOTE_TRUSTED_CLIENT_IP_HEADER` are configured only server-side when used.
- Real values are never copied into docs, screenshots, logs, PR text, or
  browser-visible configuration.

## Forbidden public/browser env checks

Review deployment settings and browser output for forbidden public variables:

- No `NEXT_PUBLIC_SUPABASE_*`.
- No `NEXT_PUBLIC_N8N*`.
- No browser-visible n8n webhook URL.
- No `SUPABASE_SERVICE_ROLE_KEY`.
- No service-role key, service-role runtime path, or service-role catalogue
  read path.
- No use of `website/chat-config.js`.
- No browser bundle reference to Supabase server env names or n8n webhook env
  names.

Service-role runtime paths remain forbidden unless separately approved.

## Active catalogue workspace checks

Before DB-backed catalogue reads are enabled:

- Confirm `<approved-catalogue-workspace-id>` is the intended public catalogue
  workspace for `<environment-name>`.
- Confirm the workspace is active.
- Confirm the reviewed database-owned `catalogue_public_workspace_config` row
  points to the same workspace.
- Confirm `CATALOGUE_WORKSPACE_ID` matches that row.
- Confirm draft or unpublished catalogue rows remain unavailable publicly.
- Confirm direct anonymous base-table catalogue reads remain denied.

## Quote workspace checks

Before public quote persistence is enabled:

- Confirm `<approved-quote-workspace-id>` is the intended quote capture
  workspace for `<environment-name>`.
- Confirm `QUOTE_WORKSPACE_ID` matches the reviewed workspace.
- Confirm quote submissions still go only through first-party `POST /api/quote`.
- Confirm quote route errors remain normalized and do not expose Supabase
  details, workspace IDs, or stack traces.
- Confirm no quote throttling constants or trusted header behaviour changed as
  part of deployment.

## Server-only n8n webhook checks

Before chat provider smoke testing:

- Confirm `N8N_CHAT_WEBHOOK_URL` is stored only as a server-side deployment
  setting represented as `<server-only-n8n-webhook-url>`.
- Confirm the browser calls only `POST /api/chat`.
- Confirm the browser bundle contains no n8n webhook URL and no
  `NEXT_PUBLIC_N8N*` variable.
- Confirm n8n workflow JSON is not changed for deployment.
- Confirm no live n8n workflow import, export, activation, execution, or
  mutation is part of the deployment PR unless separately approved.

## Trusted proxy/client IP header checks

Before enabling trusted client IP buckets:

- Confirm `CHAT_TRUSTED_CLIENT_IP_HEADER` names only a header overwritten by
  the deployment proxy or CDN.
- Confirm `QUOTE_TRUSTED_CLIENT_IP_HEADER` names only a header overwritten by
  the deployment proxy or CDN.
- Confirm user-supplied forwarding headers are not trusted by default.
- Confirm chat and quote routes still use fail-closed fallback buckets when no
  trusted header is configured or present.
- Confirm in-process throttling is documented as best-effort and not final
  distributed abuse protection.

## Catalogue fallback smoke tests

Run these before enabling real Supabase env, or in a reviewed missing-env test
environment:

- Visit `<deployment-url>/catalogue`.
- Confirm the catalogue page renders shell fallback data.
- Visit `<deployment-url>/catalogue/lounge-sofa-package`.
- Confirm the product detail page renders fallback product data.
- Confirm no Supabase error, workspace ID, or internal stack trace appears in
  the browser.

## DB-backed catalogue smoke tests

Run these after server-only Supabase env, `CATALOGUE_WORKSPACE_ID`, and
`catalogue_public_workspace_config` are reviewed:

- Visit `<deployment-url>/catalogue`.
- Confirm published rows from `<approved-catalogue-workspace-id>` render.
- Visit a reviewed DB-backed product detail page.
- Confirm the page renders the configured workspace product.
- Confirm inactive, other-workspace, draft, and unpublished rows do not render.
- Confirm product images appear only for published products in the active
  workspace.
- Confirm fallback behaviour still works if the active config is disabled in a
  reviewed non-production check.

## Quote submission smoke tests

Run these after `QUOTE_WORKSPACE_ID` and server-only Supabase env are reviewed:

- Submit a valid quote request through `<deployment-url>/quote`.
- Confirm the browser receives only the safe public receipt fields.
- Confirm the quote row is created in the approved quote workspace through the
  reviewed database inspection process.
- Confirm invalid payloads are rejected before persistence.
- Confirm throttled responses remain safe generic `429` responses.
- Confirm no Supabase errors, workspace IDs, customer internals, or stack
  traces appear in the browser.

## Chat fallback smoke tests

Run these with the n8n webhook intentionally absent or disabled in a reviewed
non-production check:

- Send a chat message from `<deployment-url>`.
- Confirm the browser calls only `POST /api/chat`.
- Confirm the response is the safe fallback or provider-unavailable message.
- Confirm no n8n webhook URL, provider internals, stack trace, or node name
  appears in the browser.

## Server-only n8n chat smoke tests

Run these only after server-only n8n webhook configuration is approved:

- Send a bounded chat message from `<deployment-url>`.
- Confirm the browser still calls only `POST /api/chat`.
- Confirm the server-side provider returns a normalized assistant response.
- Confirm timeout and provider error responses remain normalized.
- Confirm no browser-visible n8n URL, `NEXT_PUBLIC_N8N*` variable, provider
  trace, node name, or stack trace appears.
- Confirm no n8n workflow JSON was changed for the smoke test.

## Failure/rollback checks

Before approving a deployment PR:

- Confirm rollback owner and backup approver are named.
- Confirm the rollback action does not require committing secrets.
- Confirm the app can return to shell catalogue fallback if DB-backed catalogue
  config is disabled.
- Confirm quote persistence can fail safely without exposing internals.
- Confirm chat provider can fail safely without exposing n8n details.
- Confirm the deployment can be paused, reverted, or disabled according to the
  approved hosting process.

## Post-deployment monitoring checks

After an approved deployment:

- Check server logs for safe normalized error categories only.
- Check that no env values, webhook URLs, Supabase errors, customer payloads,
  or stack traces are logged.
- Check quote submission volume and throttling behaviour.
- Check chat provider timeout and unavailable rates.
- Check catalogue fallback and DB-backed read error rates.
- Record any manual operator action in the deployment PR.

## Evidence to capture in the future deployment PR

Future deployment PR authors should attach:

- Environment reviewed: `<environment-name>`.
- Deployment target placeholder or final reviewed deployment URL:
  `<deployment-url>`.
- Server-only env placement confirmation.
- Forbidden public env confirmation.
- Active catalogue workspace confirmation.
- Quote workspace confirmation.
- Server-only n8n webhook confirmation.
- Trusted proxy/client IP header confirmation.
- Catalogue fallback smoke-test result.
- DB-backed catalogue smoke-test result.
- Quote submission smoke-test result.
- Chat fallback smoke-test result.
- Server-only n8n chat smoke-test result.
- Failure and rollback check result.
- Known limitations.
- Safety confirmations that no secrets, real env values, service-role runtime
  paths, browser Supabase config, production seed data, product writes,
  conversation/message writes, Storage wiring, admin/auth UI, or n8n workflow
  changes were added unless separately approved in that future PR.
