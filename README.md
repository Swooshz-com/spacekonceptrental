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
- `presentation/` - capstone walkthrough deck.
- `scripts/` - local workflow validation.
- `website/` - simple static website demo that embeds the live support chat.
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

The workflow exports contain the expected column mappings for these tabs.

## Local Validation

Run:

```bash
npm run validate:n8n
```

Current warning categories are expected when the local exports intentionally
include configured emails, Pinecone values, Google Drive folders, and Google
Sheets selections for import.

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

## Website Demo

Open `website/index.html` in a browser for a simple capstone website demo. The
page embeds the current live n8n hosted chat URL and includes a fallback link
that opens the chat in a new tab.

For final submission, deploy this static folder or the repo root to a simple
host such as Netlify or GitHub Pages, then replace the ngrok chat URL if the
public n8n webhook URL changes.

## Presentation Status

Ignoring live testing, the project is presentation-ready once the workflow JSON
passes local validation, the KB Markdown files are uploaded and ingested, the
Google Sheets tabs exist, and the deck in `presentation/` is ready for the
walkthrough.

It is not production-ready until live end-to-end testing, business/legal review,
credential hardening, monitoring, and final website or WhatsApp deployment
checks are complete.
