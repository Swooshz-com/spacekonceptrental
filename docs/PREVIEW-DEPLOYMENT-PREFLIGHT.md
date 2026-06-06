# Preview/Deployment Review Preflight

This checklist does not approve deployment.

No deployment is performed by Phase 2M-A/B.

No deployment is performed by Phase 2N-A/B.

No deployment is performed by Phase 2O-A/B.

Phase 2M-A/B is a local and CI readiness gate for a future preview/deployment
review. It makes the release-candidate validation commands deterministic and
names the operator checks that must be completed before any later approved
deployment PR can enable public traffic.

Phase 2N-A/B adds a server-only runtime config contract and local deploy
dry-run harness for the same future review lane.

Phase 2O-A/B adds the operator-facing approval package and redacted evidence
templates for the same future review lane. It does not approve deployment.

## Future Preview/Deployment Review Checklist

- Confirm the later deployment PR has explicit current approval to deploy.
- Confirm `npm run validate:release-candidate` passes for the candidate branch.
- Confirm `npm run validate:deploy-dry-run` passes for the candidate branch.
- Confirm `npm run validate:preview-approval-package` passes for the candidate
  branch.
- Confirm CI runs the same release-gate commands, including
  `npm run test:supabase-rls` and `git diff --check`.
- Confirm `docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md` and the redacted
  templates under `docs/templates/` are reviewed before public traffic.
- Confirm the candidate branch does not add Vercel config, Supabase Cloud
  config, real secrets, env values, production evidence, browser Supabase,
  service-role runtime paths, n8n/Pinecone runtime changes, customer accounts,
  public quote tracking, public/customer uploads, notifications, CRM
  integration, or ecommerce flows.
- Confirm public wording remains listing, enquiry, quote, and request oriented.
- Confirm the smoke checklist in `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md` is
  ready before public traffic.

## Environment Variable Inventory

No public client environment variable is currently required.

Server-only review inventory:

- `SUPABASE_URL`: server-only Supabase endpoint for approved server-side
  access.
- `SUPABASE_ANON_KEY`: server-only anon key used with RLS through first-party
  server routes and repositories.
- `CATALOGUE_WORKSPACE_ID`: server-only public listing/catalogue workspace
  gate.
- `QUOTE_WORKSPACE_ID`: server-only quote/enquiry persistence workspace gate.
- `ADMIN_TRUSTED_WORKSPACE_ID`: server-only protected admin workspace gate.
- `ADMIN_EXPECTED_ORIGIN`: server-only admin same-origin validation setting.
- `ADMIN_EXPECTED_HOST`: server-only admin host validation setting.
- `ADMIN_CSRF_PROOF_SECRET`: server-only admin CSRF proof signing secret.
- `CHAT_PROVIDER`: server-only first-party chat provider selector.
- `N8N_CHAT_WEBHOOK_URL`: server-only temporary n8n webhook URL.
- `N8N_CHAT_WEBHOOK_TIMEOUT_MS`: optional server-only n8n timeout setting.
- `CHAT_TRUSTED_CLIENT_IP_HEADER`: optional server-only trusted edge header
  name.
- `QUOTE_TRUSTED_CLIENT_IP_HEADER`: optional server-only trusted edge header
  name.

Forbidden public or committed values:

- No `NEXT_PUBLIC_SUPABASE_*`.
- No `NEXT_PUBLIC_N8N*`.
- No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE`.
- No `SUPABASE_SERVICE_ROLE_KEY` runtime path.
- No `.env` files.
- No real URLs, keys, tokens, webhook values, workspace IDs, screenshots, logs,
  or production evidence artifacts in the repo.

Runtime config parsing is centralized in the server-only app contract. Local
dry-run output may name missing or invalid setting names, but must not print
raw values.

## Workspace ID Review Checklist

- Confirm `CATALOGUE_WORKSPACE_ID` matches the reviewed active public catalogue
  workspace before DB-backed listing reads are enabled.
- Confirm `QUOTE_WORKSPACE_ID` matches the reviewed quote/enquiry capture
  workspace before public quote persistence is enabled.
- Confirm `ADMIN_TRUSTED_WORKSPACE_ID` is reviewed separately from catalogue
  and quote workspace settings.
- Confirm workspace IDs are server-owned configuration only and are never read
  from browser input.
- Confirm public listing pages render only public-safe published listing,
  category, and listing image data.

## Supabase Cloud Review Checklist

- Supabase Cloud must remain disconnected in Phase 2M-A/B.
- A future deployment PR must name the reviewed Supabase project without
  committing project URLs, dashboard links, keys, or screenshots containing
  private values.
- Confirm migrations have passed `npm run validate:supabase-migrations`,
  `npm run test:supabase-migrations`, and `npm run test:supabase-rls`.
- Confirm direct authenticated browser-role writes to listing metadata tables
  remain blocked.
- Confirm approved admin listing/category/image writes still go through
  `execute_admin_product_write(...)` and enqueue local search-index jobs only.
- Confirm quote workflow writes still go through
  `execute_admin_quote_workflow(...)`.

## Admin Access Review Checklist

- Confirm owner/admin users in the reviewed workspace can access protected
  admin listing, category, media, quote inbox, and quote detail surfaces.
- Confirm viewer, no-membership, wrong-workspace, and anonymous users are
  denied.
- Confirm state-changing admin routes require same-origin checks, CSRF proof,
  trusted workspace scope, and owner/admin membership.
- Confirm admin internal notes remain admin-only and are never exposed on
  public quote/enquiry pages or APIs.
- Confirm safe generic failure messages are shown for admin unavailable states.

## Public Quote/Listing Smoke Checklist

- Public homepage loads without provider, SQL, stack trace, token, or env value
  leakage.
- Public listings and listing details show only public-safe published listing
  data.
- Category and catalogue compatibility routes use listing/enquiry/quote wording.
- Public quote/enquiry submission posts only to first-party `POST /api/quote`.
- Public quote/enquiry success shows a safe receipt and no public tracking or
  status link.
- Missing public routes and missing listing detail routes show safe not-found
  states.
- Public chat remains first-party `POST /api/chat` only and is not wired to
  retrieval, RAG, Pinecone, or transcript runtime reads/writes.

## Rollback/Abort Checklist

- Abort before public traffic if any release-gate command fails.
- Abort before public traffic if `npm run validate:deploy-dry-run` fails.
- Abort before public traffic if `npm run validate:preview-approval-package`
  fails.
- Abort before public traffic if Docker-backed `npm run test:supabase-rls`
  cannot run.
- Abort before public traffic if any secret, env value, local config,
  production evidence artifact, Vercel config, or Supabase Cloud config is
  added to the PR.
- Abort before public traffic if browser Supabase, service-role runtime paths,
  public/customer uploads, customer accounts, public quote tracking,
  notifications, CRM integration, n8n/Pinecone runtime changes, `/api/chat`
  retrieval/RAG wiring, transcript runtime wiring, or ecommerce flows appear.
- If a later deployment fails review, disable public traffic through the
  approved hosting control, remove or rotate affected env values, and rerun
  the release-candidate gate before another review.
