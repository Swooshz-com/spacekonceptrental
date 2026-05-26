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
  `docs/PHASE-ROADMAP.md` for the approved website direction.
- `presentation/` - capstone walkthrough deck.
- `scripts/` - local workflow validation.
- `website/` - Phase 1A Next.js frontend app root, with preserved design
  assets under `website/web_design/` and prepared assets used by the current
  public shell.
- `SpaceKonceptRental_website_display_design_wishlist.jpg` - future website
  design reference, not part of the RAG upload.

## What To Upload For RAG

Upload only these files to the Google Drive folder watched by the ingestion
workflow:

- `kb/01-service-faq.md`
- `kb/02-rental-terms.md`
- `kb/03-product-catalogue-summary.md`
- `kb/04-privacy-policy.md`

Do not upload `n8n-workflows/`, `scripts/`, `presentation/`, `.tmp/`, or the
website display wishlist image.

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
npm run validate:n8n
npm run test:n8n-validation
```

Current warning categories are expected when the local exports intentionally
include configured emails, Pinecone values, Google Drive folders, and Google
Sheets selections for import.

Before final runtime smoke testing, use the manual security closure runbook in
`docs/security-smoke-test-runbook.md`.

## CI Validation

GitHub Actions runs CI on pull requests and pushes to `main`. CI validates the
static n8n workflow exports and validation tests, then validates the Next.js
website with `npm ci`, tests, typecheck, and build.

This is CI only. It does not deploy, configure Vercel, use secrets, or add CD;
deployment remains deferred until separately approved.

## Website App

The website frontend is now a Vercel-ready Next.js scaffold under `website/`.
The current public surface includes the homepage, catalogue, quote shell, and
first-party `POST /api/chat` route.

The chat UI is custom and calls `/api/chat` only. The provider is currently a
safe placeholder boundary; no live n8n provider wiring is included yet. Any
future n8n access must stay server-only through environment variables such as
`N8N_CHAT_WEBHOOK_URL`, not browser-side config.

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
