# Phase Roadmap

## Roadmap Rules

Phase 0 and Phase 1 are active or near-term. Phase 2 and later are future
guardrails only and are not approval to implement those phases now.

Any phase change must update this roadmap, the relevant checklist, the ADR or
decision log, and safety docs in the same PR.

Before any implementation work, start from a clean branch or explicitly separate
unrelated local changes.

## Phase 0: Planning, Docs, And Context Only

Goal: record the approved architecture and safety boundaries before app
development starts.

Checklist: `docs/checklists/PHASE-0-PLANNING.md`

No app development, Next.js scaffold, Supabase migrations, workflow JSON
changes, or live/runtime actions belong in Phase 0.

## Phase 1: Small MVP

Goal: build the smallest production-shaped Next.js foundation under `website/`
with custom chat UI, first-party `/api/chat`, server-only `N8nChatProvider`,
server-only quote capture with route-level abuse throttling, chat persistence
design/scaffolding, product/admin persistence design/scaffolding, trusted
active-workspace catalogue RLS hardening proof, deployment environment
readiness, Phase 1 closeout audit, Phase 2 readiness plan, and a basic
Supabase core schema.

Checklist: `docs/checklists/PHASE-1-MVP.md`

Phase 1 is not the full SaaS platform, full RAG system, full admin inbox, vector
stack, billing system, or streaming implementation.

## Phase 2: Deployment, Admin, Product, And Quote Operations

Goal: prepare reviewed deployment operations and expand operational admin tools
after the MVP foundation exists.

Checklist: `docs/checklists/PHASE-2-ADMIN-OPS.md`

Readiness plan: `docs/PHASE-2-READINESS-PLAN.md`

Deployment readiness checklist:
`docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md`

Admin/auth readiness checklist:
`docs/checklists/PHASE-2B-ADMIN-AUTH.md`

Phase 2A-A adds deployment smoke-test runbook and operator evidence templates
only. It is not approval to deploy, connect Supabase Cloud, add Vercel config,
or add runtime features.

Phase 2B-A adds admin/auth and workspace membership authorization design only.
It is not approval to implement real auth, add admin UI, add product, category,
or product image writes, add browser Supabase, add service-role runtime paths,
or deploy.

Phase 2B-B adds a pure server-only admin authorization policy module and tests
only. It is not approval to add Supabase Auth runtime wiring, login/logout
routes, protected admin pages, admin UI, product writes, service-role runtime
paths, browser Supabase, deployment, or Supabase Cloud connection.

Phase 2B-C adds a server-only admin auth/membership resolver contract and
disabled scaffold only. It is not approval to implement real auth, add Supabase
Auth runtime wiring, add login/logout routes, add protected admin pages, add
admin UI, wire runtime routes/pages/server actions, add product writes, add
service-role runtime paths, add browser Supabase, deploy, or connect Supabase
Cloud.

Phase 2B-D adds server-only admin auth/membership adapter contracts and
dependency-injected resolver tests with fake adapters only. It is not approval
to implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, wire
runtime routes/pages/server actions, add product writes, add service-role
runtime paths, add browser Supabase, deploy, or connect Supabase Cloud.

Phase 2B-E adds admin auth provider/session/security design and an unchecked
auth implementation checklist only. It is not approval to implement real auth,
add Supabase Auth runtime wiring, read cookies, read headers, add login/logout
routes, add protected admin pages, add admin UI, wire runtime routes/pages/server
actions, add product writes, add service-role runtime paths, add browser
Supabase, deploy, or connect Supabase Cloud.

This phase is not approved for implementation yet.

## Phase 3: Internal Chatbot Provider

Goal: implement `InternalSaasChatProvider` behind the same provider contract and
switch providers without changing the frontend.

Checklist: `docs/checklists/PHASE-3-INTERNAL-CHATBOT.md`

This phase is not approved for implementation yet.

## Phase 4: RAG, Knowledge, And Vector Work

Goal: introduce knowledge source models, document ingestion, chunking,
embeddings, retrieval, and vector storage decisions.

Checklist: `docs/checklists/PHASE-4-RAG-KNOWLEDGE.md`

This phase is not approved for implementation yet.

## Phase 5: SaaS Platform Hardening

Goal: harden multi-tenant SaaS operations, onboarding, analytics, abuse
controls, retention, and security posture.

Checklist: `docs/checklists/PHASE-5-SAAS.md`

This phase is not approved for implementation yet.

## Phase 6: Billing And Public SaaS Launch

Goal: make pricing, billing, launch operations, monitoring, incident response,
and legal readiness decisions if a public SaaS launch is needed.

Checklist: `docs/checklists/PHASE-6-BILLING-LAUNCH.md`

This phase is not approved for implementation yet.
