# SpaceKonceptRental

Capstone project for a RAG customer support agent built with n8n, Pinecone,
Google Drive, Google Sheets, Gmail, and OpenAI.

## Project Scope

The capstone track is a customer support agent. The workflow is designed to:

- answer FAQs, rental terms, product, and pricing-related questions from a RAG
  knowledge base;
- capture customer leads and rental enquiries;
- create support tickets for issues that need follow-up;
- route escalations through Gmail;
- log conversations, leads, tickets, unanswered questions, ingestion runs, and
  workflow failures in Google Sheets.

This repo uses n8n rather than AgentX, but the implementation still maps to the
customer-support-agent capstone requirements.

## Current Folders

- `n8n-workflows/` - importable n8n workflow JSON exports.
- `kb/` - Markdown files to upload into the Google Drive knowledge-base folder.
- `docs/` - operator runbooks, architecture docs, safety boundaries, phase
  roadmap, and checklists. Start with `docs/ARCHITECTURE.md` and
  `docs/PHASE-STATUS.md` for the quick current status, then
  `docs/PHASE-ROADMAP.md` for the approved website direction. Use
  `docs/checklists/README.md` for checklist ownership and maintenance rules,
  `docs/CHAT-PERSISTENCE-DESIGN.md` for the deferred chat persistence
  boundary, and `docs/N8N-TESTING-PLAN.md` for owner-only n8n testing.
- `presentation/` - capstone walkthrough deck.
- `scripts/` - local workflow validation.
- `website/` - Phase 1A Next.js frontend app root, with preserved design
  assets under `website/assets/web_design/` and prepared assets used by the current
  public shell.

## What To Upload For RAG

Upload only these files to the Google Drive folder watched by the ingestion
workflow:

- `kb/01-service-faq.md`
- `kb/02-rental-terms.md`
- `kb/03-product-catalogue-summary.md`
- `kb/04-privacy-policy.md`

Do not upload `n8n-workflows/`, `scripts/`, `presentation/`, `.tmp/`, or
website design assets.

## n8n Import Order

1. Import `SpaceKonceptRental - Global Error Handler`.
2. Import `SpaceKonceptRental - KB Ingestion to Pinecone`.
3. Import `SpaceKonceptRental - RAG Customer Support Agent`.
4. Attach the required credentials in n8n.
5. Confirm Google Drive, Google Sheets, Gmail, OpenAI, and Pinecone selections.
6. Set the error workflow on the two main workflows.
7. Run the KB ingestion workflow.
8. Test the customer support agent.

Keep imported workflows inactive until credentials, folder selections, sheet
tabs, and test data are confirmed.

## Required Google Sheets Tabs

Use one logs workbook with these tabs:

- `conversations`
- `leads`
- `tickets`
- `unanswered_questions`
- `failures`
- `kb_ingestion`
- `kb_current_state`

The workflow exports contain the expected column mappings for these tabs.

`kb_ingestion` is append-only audit history. It records each changed ingestion
event, including `modified_time`, `content_sha256`, `ingestion_key`, and numeric
`chunks_count`.

Manual deployment note for PR #12: before importing or updating the live
workflow, create or verify the `kb_current_state` sheet/tab. It is the dedupe
authority and must have one row per `file_id + namespace` with these headers:
`file_id`, `file_name`, `namespace`, `current_content_sha256`,
`current_ingestion_key`, `last_successful_execution_id`, `last_indexed_at`,
`status`, `chunks_count`, `modified_time`, and `file_url`.

RAG ingestion skips Pinecone delete/upsert only when the current-state row for
that `file_id + namespace` has `status = completed` and
`current_ingestion_key` matches the newly computed
`file_id::content_sha256::SpaceKonceptRental_kb` key. Historical
`kb_ingestion` rows are never enough to skip by themselves.

## Local Validation

Run:

```bash
npm run validate:supabase-migrations
npm run test:supabase-migrations
npm run test:supabase-rls
npm run local-uat:owner-flow
npm run smoke:owner-flow-local
npm run test:supabase-seed
npm run validate:n8n
npm run test:n8n-validation
```

Current warning categories are expected when the local exports intentionally
include configured emails, Pinecone values, Google Drive folders, and Google
Sheets selections for import.

`npm run test:supabase-rls` is local-only and Docker-only. It first checks
whether Docker CLI and the Docker daemon are ready. When Docker CLI exists but
the daemon is unavailable, it makes one bounded best-effort Docker Desktop or
daemon startup attempt for the local platform, waits briefly, then either runs
the RLS harness or exits with the attempted command and manual next step. The
RLS harness starts a throwaway Docker database, applies the committed Supabase
migrations, creates fake fixtures inside that temporary database, checks RLS
behaviour, and stops/removes the container. It does not run `npx supabase`,
install the Supabase CLI, add a host Supabase dependency, or run Supabase Cloud
commands such as `supabase login`, `supabase link`, `supabase db push`, or
`supabase migration up`.

See `docs/SUPABASE-LOCAL-RLS-TESTS.md` for the local RLS test runbook.

`npm run local-uat:owner-flow` starts or checks the local website server, waits
with a bounded timeout, then runs `npm run smoke:owner-flow-local`. Use
`npm run smoke:owner-flow-local` when the local server is already running and
you only want the smoke check. Both commands skip live quote submission by
default so real email is not sent. See
`docs/SKR-OWNER-FLOW-LOCAL-UAT-SMOKE.md`.

`npm run test:supabase-seed` is also local-only and Docker-only. It starts a
throwaway Docker database, applies the committed migrations, applies the
fake/sample catalogue seed fixture from `supabase/seeds/sample_catalogue.sql`,
checks seed safety and RLS visibility, and stops/removes the container. It does
not connect to Supabase Cloud or require the Supabase CLI.

See `docs/SUPABASE-SEED-FIXTURES.md` for the seed fixture runbook.

Before final runtime smoke testing, use the manual security closure runbook in
`docs/security-smoke-test-runbook.md`.

## CI Validation

GitHub Actions runs CI on pull requests and pushes to `main`. CI validates the
static n8n workflow exports and validation tests, then validates the Next.js
website with `npm ci`, tests, typecheck, and build.

This is CI only. It does not deploy, configure Vercel, use secrets, or add CD;
deployment remains deferred until separately approved.

Phase 1O-A adds the deployment/environment readiness contract in
`docs/DEPLOYMENT-ENVIRONMENT-READINESS.md` and the docs-only
`docs/contracts/server-env-contract.json` manifest. These files document the
future server-only environment requirements and forbidden public variables
before any real deployment or Supabase Cloud connection is approved.

Phase 1P-A adds the closeout audit in `docs/PHASE-1-CLOSEOUT-AUDIT.md` and the
Phase 2 readiness plan in `docs/PHASE-2-READINESS-PLAN.md`. These files do not
approve deployment or new runtime features; they define what Phase 1 completed
and which Phase 2 decision gates remain closed.

Phase 2A-A adds only deployment smoke-test preparation:
`docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md`,
`docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md`, and
`docs/templates/DEPLOYMENT-EVIDENCE.md`. These files are operator guidance for
a future reviewed deployment PR; they do not deploy, connect Supabase Cloud,
add Vercel config, or add runtime features.

Phase 2B-A adds only admin/auth and workspace membership authorization design:
`docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md` and
`docs/checklists/PHASE-2B-ADMIN-AUTH.md`. These files define the identity,
membership, role, route/action, audit, and RLS gates that must exist before
product/category/product image writes. They do not implement auth, admin UI,
product writes, browser Supabase, service-role runtime paths, deployment, or
Supabase Cloud connection.

Phase 2B-B adds only a pure server-only admin authorization policy module under
`website/lib/admin/authorization/`. It models future admin identity,
membership, role, workspace, and operation decisions from explicit inputs, but
does not implement real auth, Supabase Auth wiring, admin UI, routes, server
actions, product writes, browser Supabase, service-role runtime paths,
deployment, or Supabase Cloud connection.

Phase 2B-C adds only a server-only admin auth/membership resolver contract and
disabled scaffold. It defines how future server-side auth and membership
resolution should build policy inputs, but it does not implement real auth,
Supabase Auth wiring, login/logout routes, protected admin pages, admin UI,
runtime routes/pages/server actions, product writes, browser Supabase,
service-role runtime paths, deployment, or Supabase Cloud connection.

Phase 2B-D adds only server-only admin auth/membership adapter contracts and
dependency-injected resolver tests with fake adapters. It does not implement
real auth, add Supabase Auth wiring, read cookies, read headers, add
login/logout routes, add admin UI, wire runtime routes/pages/server actions,
add product writes, add browser Supabase, add service-role runtime paths,
deploy, or connect to Supabase Cloud.

Phase 2B-E adds only admin auth provider/session/security design and an
unchecked implementation checklist. It recommends Supabase Auth as the future
server-side admin auth provider and documents session cookie, CSRF,
login/logout, protected admin page, adapter integration, and implementation
gates. It does not implement real auth, add Supabase Auth wiring, read cookies,
read headers, add routes, add admin UI, wire runtime routes/pages/server
actions, add product writes, add browser Supabase, add service-role runtime
paths, deploy, or connect to Supabase Cloud.

Phase 2B-F adds only checklist hygiene, phase status reconciliation, and static
guard coverage. It adds `docs/PHASE-STATUS.md` and
`docs/checklists/README.md`, reconciles checklist ownership/status, and keeps
all real auth, Supabase Auth runtime wiring, cookie reads, header reads,
login/logout routes, protected admin pages, admin UI, product/category/product
image writes, runtime route/page/server action wiring, deployment, Supabase
Cloud connection, n8n workflow changes, Pinecone runtime work, and SaaS
chatbot app work out of scope.

## Website App

The website frontend is now a Vercel-ready Next.js scaffold under `website/`.
The current public surface includes the homepage, catalogue, quote shell, and
first-party `POST /api/chat` route.

The chat UI is custom and calls `/api/chat` only. n8n access stays server-only
behind `N8nChatProvider` and falls back safely when `N8N_CHAT_WEBHOOK_URL` is
not configured. Chat persistence has only disabled server-only scaffolding;
actual conversation/message writes remain deferred.

Current SKR may keep the existing n8n/Pinecone chatbot workflow as a temporary
production bridge while the website stabilizes. The future SaaS chatbot should
be a separate project/app, and SKR can later become its first client/tenant.
Do not implement SaaS chatbot app work or Pinecone migration in this repo yet.

Local frontend commands:

```bash
cd website
npm install
npm run test
npm run typecheck
npm run build
npm run dev
```

## Manual Test Checklist

After import, credential setup, and KB ingestion, test:

1. A normal FAQ question.
2. A pricing or quotation question.
3. A consultation or appointment request.
4. A damaged-item support ticket request.
5. A rental lead enquiry.
6. A question that should not be answered from invented facts.
7. An angry complaint that should escalate.
8. A duplicate `message_id`.
9. A controlled workflow error.

## Public Chat Demo

The retired static website demo HTML is no longer tracked. Keep any replacement
public chat UI stateless and keep real webhook URLs in ignored local or
deploy-time config only.

The current public Chat Trigger is temporary and demo-oriented. Keep it public
for the demo flow, but keep public chat stateless: the workflow may use
`session_id` for logging, debounce, dedupe, and operator transcript context, but
must not connect the public AI Agent to persisted AI memory keyed by client
session values. Current compensating controls include debounce, dedupe, safe
Sheets writes, escaped emails, bounded transcripts, and stateless public chat.
Full mitigation belongs in the future authenticated/backend-mediated UI.

Future frontend deployment target is Vercel. Do not deploy from this PR unless
separately approved, and do not commit temporary tunnel URLs, webhook URLs, or
secrets.

## Presentation Status

Ignoring live testing, the project is presentation-ready once the workflow JSON
passes local validation, the KB Markdown files are uploaded and ingested, the
Google Sheets tabs exist, and the deck in `presentation/` is ready for the
walkthrough.

It is not production-ready until live end-to-end testing, business/legal review,
credential hardening, monitoring, and final website or WhatsApp deployment
checks are complete.
