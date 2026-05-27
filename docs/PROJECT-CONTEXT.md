# Project Context

## What SpaceKonceptRental Is

SpaceKonceptRental is a Singapore-focused B2B event furniture rental project.
The current capstone repo contains an n8n customer support agent, a small
knowledge base, workflow validation scripts, and website design material for a
future customer-facing rental site with AI-assisted support and quote capture.

## Current Repo Purpose

The repo currently serves two purposes:

- Capstone n8n workflow source and validation for customer support, RAG
  ingestion, Gmail/Sheets notifications, escalations, and error handling.
- Planning and design material for the future website and SaaS-ready chat
  architecture.

Rough contents:

- `n8n-workflows/` - n8n workflow JSON exports.
- `scripts/` - local workflow validation and sync helper scripts.
- `kb/` - Markdown knowledge base files for the current RAG demo.
- `docs/` - architecture, safety, phase roadmap, runbooks, and checklists.
- `website/` - Next.js app root plus current website design assets.

## Current Website State

The inspected design folder is `website/web_design/`, not
`website/.web_design/`.

The current website design plan was originally written for a static HTML site.
It assumes direct n8n/widget usage, direct n8n form submission, static JSON data,
and custom chat only in a later phase. That plan is now outdated.

`website/chat-config.js` is gitignored and may contain a local non-placeholder
webhook URL. Do not read, print, copy, migrate, commit, or expose that URL. Do
not use `website/chat-config.js` as a source for the new Next.js app.

## Why The Static Direct-n8n Plan Is Outdated

The old plan couples the public UI to n8n, exposes n8n as the runtime boundary,
delays ownership of the chat UX, and makes the future SaaS chatbot engine a
rewrite instead of a provider swap.

The approved direction is to own the frontend and API boundary from day one:

```text
Custom Chat UI -> POST /api/chat -> ChatProvider
```

## Approved Direction

- `website/` becomes the future Next.js app root deployed by Vercel.
- Supabase becomes the system of record for product data, quote requests,
  conversations, messages, auth, storage, RLS, and tenant-ready boundaries.
- n8n remains temporary server-side integration only.
- `N8nChatProvider` calls n8n from the server in Phase 1.
- `InternalSaasChatProvider` may later replace n8n as the chat runtime.
- MVP chat is non-streaming.
- The provider interface may support streaming later, but streaming/SSE is not
  Phase 1.
- Chat persistence design exists before writes. Conversation/message records
  are privacy-sensitive and actual persistence remains deferred.
- Product/admin persistence design exists before writes. Category, product, and
  product image writes are trusted-admin operations only, and actual
  persistence remains deferred until auth/admin and media boundaries are
  approved.
- Deployment/environment readiness is documented before deployment. The future
  Vercel + Supabase path must use server-only env placement, no browser
  Supabase variables, no browser-visible n8n variables, and no service-role
  runtime path until separately approved.
- Phase 1 closeout and Phase 2 readiness are documented. The closeout confirms
  the local foundation and the readiness plan keeps deployment, product writes,
  conversation/message persistence, Storage, admin/auth UI, and internal RAG
  work behind separate Phase 2 decisions.
- Phase 2A-A deployment smoke-test preparation is docs-only. It provides an
  operator runbook, unchecked readiness checklist, and evidence template for a
  future reviewed deployment PR, while deployment, Supabase Cloud connection,
  Vercel config, and runtime feature work remain blocked.
- Phase 2B-A admin/auth and workspace membership authorization design is
  docs-only. It defines the future admin identity, membership, role,
  route/action, audit, and RLS gates that must be implemented before
  product/category/product image writes. Real auth, admin UI, product writes,
  browser Supabase, service-role runtime paths, deployment, and Supabase Cloud
  connection remain blocked.

## Planning Notes

Previous planning found the repo dirty before this docs pass. Future
implementation work must start from a clean branch or explicitly separate
unrelated local changes.

The previous Codex planning pass produced the approved architecture direction
but did not edit files. This docs pass records that context for future LLM
instances before implementation starts.
