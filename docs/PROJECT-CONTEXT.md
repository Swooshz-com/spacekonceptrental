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

The inspected design folder is `website/assets/web_design/`, not
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
- The current SKR website may keep using the existing n8n/Pinecone chatbot
  workflow as a temporary production bridge while the website stabilizes.
- The future SaaS chatbot should be a separate project/app, and SKR can later
  become the first client/tenant of that SaaS chatbot.
- Do not implement SaaS chatbot app work inside this repo yet.
- Do not migrate Pinecone in this repo yet.
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
- Phase 2B-B adds a pure server-only admin authorization policy module and
  tests only. The module evaluates explicit future server-resolved identity,
  membership, role, workspace, and operation inputs. It does not implement real
  auth, Supabase Auth wiring, admin UI, routes, server actions, product writes,
  browser Supabase, service-role runtime paths, deployment, or Supabase Cloud
  connection.
- Phase 2B-C adds a server-only admin auth/membership resolver contract and
  disabled scaffold only. It defines how future server-side auth and membership
  resolution should build policy inputs, but it remains disabled and is not
  wired into runtime routes, pages, or server actions. Real auth, Supabase Auth
  wiring, login/logout routes, protected admin pages, admin UI, product writes,
  browser Supabase, service-role runtime paths, deployment, and Supabase Cloud
  connection remain blocked.
- Phase 2B-D adds server-only admin auth/membership adapter contracts and
  dependency-injected resolver logic tested with fake adapters only. It does
  not read cookies, read headers, implement real auth, add Supabase Auth
  wiring, add routes, add server actions, add admin UI, add product writes, add
  browser Supabase, add service-role runtime paths, deploy, or connect
  Supabase Cloud.
- Phase 2B-E adds admin auth provider/session/security design only. It
  recommends Supabase Auth as the future server-side admin auth provider and
  documents session cookies, CSRF, login/logout, protected admin page, adapter
  integration, and implementation gates before real auth is approved. It does
  not implement real auth, read cookies, read headers, add routes, add server
  actions, add admin UI, add product writes, add browser Supabase, add
  service-role runtime paths, deploy, or connect Supabase Cloud.
- Phase 2B-F adds checklist hygiene, checklist maintenance rules, phase status
  reconciliation, and static guard coverage only. It does not implement real
  auth, add Supabase Auth runtime wiring, read cookies, read headers, add
  login/logout routes, add protected admin pages, add admin UI, add runtime
  routes/pages/server actions, add product writes, add browser Supabase, add
  service-role runtime paths, deploy, connect Supabase Cloud, change n8n
  workflows, add Pinecone runtime code, migrate Pinecone, or add SaaS chatbot
  app code.
- Phase 2B-G refreshes repo agent instructions and static guard coverage only.
  It does not implement real auth, add Supabase Auth runtime wiring, read
  cookies, read headers, add login/logout routes, add protected admin pages,
  add admin UI, add runtime routes/pages/server actions, add product writes,
  add browser Supabase, add service-role runtime paths, deploy, connect
  Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
  Pinecone, or add SaaS chatbot app code.
- Phase 2B-H strengthens the reviewed server-side admin auth/membership
  resolution boundary with dependency-injected fake adapters and safe
  allow/deny tests only. It does not implement real auth, add Supabase Auth
  runtime wiring, read cookies, read headers, add login/logout routes, add
  protected admin pages, add admin UI, wire runtime routes/pages/server
  actions, add product/category/product image writes, add Supabase Storage,
  add browser Supabase, add service-role runtime paths, deploy, connect
  Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
  Pinecone, or add SaaS chatbot app code.
- Phase 2B-I cleans admin auth implementation gate wording and
  runtime-readiness checklist/static guard wording only. It keeps runtime auth,
  Supabase Auth runtime wiring, cookie reads, header reads, login/logout
  routes, protected admin pages, admin UI, runtime route/page/server-action
  wiring, product writes, Storage, browser Supabase, service-role runtime
  paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime
  changes, and SaaS chatbot app code blocked.
- Phase 2B-J approves the future server-only Supabase Auth runtime lane and
  test-plan gates only. It selects Supabase Auth for future admin auth but does
  not implement runtime auth, read cookies, read headers, add login/logout
  routes, protected admin pages, admin UI, runtime route/page/server-action
  wiring, product writes, Storage, browser Supabase, service-role runtime
  paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime
  changes, or SaaS chatbot app code.
- Phase 2B-K adds the server-only Supabase Auth identity/session-read boundary
  only. Cookie reads and Supabase Auth `auth.getUser()` calls are restricted to
  `website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`.
  It is not wired into runtime routes, pages, server actions, protected admin
  runtime, login/logout, admin UI, or product writes.
- Phase 2B-L adds a server-only Supabase-backed admin profile and membership read boundary
  only. `admin_users` and `memberships` reads are restricted to
  `website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`.
  It is not wired into runtime routes, pages, server actions, protected admin
  runtime, login/logout, admin UI, product/category/product image writes,
  Storage, browser Supabase, service-role runtime paths, deployment, Supabase
  Cloud, n8n workflows, Pinecone runtime code, `website/chat-config.js`, or
  SaaS chatbot app code.

## Current Status Pages

- `docs/PHASE-STATUS.md` - quick current phase/status summary.
- `docs/checklists/README.md` - checklist ownership and maintenance rules.

## Planning Notes

Previous planning found the repo dirty before this docs pass. Future
implementation work must start from a clean branch or explicitly separate
unrelated local changes.

The previous Codex planning pass produced the approved architecture direction
but did not edit files. This docs pass records that context for future LLM
instances before implementation starts.
