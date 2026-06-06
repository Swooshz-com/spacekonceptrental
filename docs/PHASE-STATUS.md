# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2N-A/B - server runtime configuration hardening and deploy dry-run harness.

Latest completed capability: Phase 2M-A/B preview/deployment review preflight and CI parity hardening.

Last merged capability PR: #118

Merge commit: `a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489`

Phase 2N-A/B adds server runtime configuration hardening and a local deploy
dry-run harness. It centralizes parsing for the existing server-only settings,
normalizes invalid or missing values into safe unavailable/fallback behavior,
and adds a local `npm run validate:deploy-dry-run` command for release-gate
plus config/static checks before any future separately approved deployment
review.

Public users only see public-safe published listing, category, and listing
image data. Public quote/enquiry success stays receipt-only with no public
tracking/status link. Admin internal notes remain admin-only. Supabase remains
canonical for website/admin listing and quote data. Pinecone remains a future
derived index only and is not used as canonical business storage.

Phase 2N-A/B is local hardening and dry-run readiness only. It does not deploy, add
Vercel config, connect Supabase Cloud, add real secrets or env values, add
production evidence, add Pinecone runtime code, Pinecone packages, Pinecone
env reads, secrets, API keys, Pinecone executors, n8n workflow/runtime
changes, embedding runtime, sync workers, `/api/chat` retrieval wiring,
search-index document writers, real vector upsert/delete, runtime reranking,
hybrid search runtime, browser Supabase, service-role runtime paths, public or
customer upload routes, public quote tracking, customer-visible internal
notes, notifications, CRM integration, customer accounts, or ecommerce flows.

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Live Supabase RPC executor remains blocked. Any service-role or
privileged DB execution strategy remains blocked. `/api/chat` transcript write
wiring remains blocked. Transcript deletion/export runtime paths remain
blocked. Retention cleanup jobs remain blocked. Audit/evidence runtime writers
remain blocked. Production evidence files remain blocked. Admin transcript UI
remains blocked. Customer accounts remain blocked. Public quote tracking or
public transcript access remains blocked. Notifications remain blocked. CRM
integration remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS
chatbot runtime work remains blocked. Deployment, Vercel config, Supabase
Cloud config, env/secrets, production evidence remain blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden. Customer uploads, arbitrary
public upload routes, customer accounts, public quote tracking,
customer-visible internal notes, notifications, CRM integration, ecommerce
flows, carts, checkout, payments, stock reservation, order fulfilment,
confirmed booking, online ordering, deployment, Vercel config, Supabase Cloud
config, env/secrets, and production evidence remain blocked.

## Remaining-work map

Completed through PR #118:

- PR #118 merged Phase 2M-A/B preview/deployment review preflight and CI
  parity hardening at merge commit
  `a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489`.
- The latest completed capability is Phase 2M-A/B preview/deployment review
  preflight and CI parity hardening. It aligns CI and local review gates
  around the release-candidate command set and records a future
  preview/deployment preflight without deploying or adding live service config.
- Phase 2N-A/B is current as server runtime configuration hardening and deploy
  dry-run harness work. It centralizes typed server-only config parsing for the
  existing runtime settings and adds a local deploy dry-run harness without
  live deployment, cloud config, real env values, production evidence, or
  runtime scope expansion.

Previous Current Phase 2M-A/B status:

Current phase: Phase 2M-A/B - preview/deployment review preflight and CI parity hardening.

Latest completed capability: Phase 2L-A/B release-candidate acceptance suite and final MVP polish.

Last merged capability PR: #117

Merge commit: `aceee2ded00aee41b4e20197091f8527d9e8f8b7`

- PR #117 merged Phase 2L-A/B release-candidate acceptance suite and final
  MVP polish at merge commit
  `aceee2ded00aee41b4e20197091f8527d9e8f8b7`.
- The latest completed capability is Phase 2L-A/B release-candidate
  acceptance suite and final MVP polish. It ties public catalogue/listing/
  category/quote UX, protected admin operations, admin quote workflow, admin
  write-boundary preservation, and static security boundaries into local
  deterministic acceptance coverage.
- Phase 2M-A/B is current as preview/deployment review preflight and CI parity
  hardening. It makes CI and local review gates line up around the full
  release-gate command set and records a future preview/deployment preflight
  without deploying or adding live service config.

Previous Current Phase 2L-A/B status:

Current phase: Phase 2L-A/B - release-candidate acceptance suite and final MVP polish.

Latest completed capability: Phase 2K-A/B admin write-boundary hardening and deployment readiness.

Last merged capability PR: #116

Merge commit: `0bf12dad7255ce667cdbfbdc86c27b59abaac4bc`

- PR #116 merged Phase 2K-A/B admin write-boundary hardening and deployment
  readiness at merge commit
  `0bf12dad7255ce667cdbfbdc86c27b59abaac4bc`.
- The latest completed capability is Phase 2K-A/B admin write-boundary
  hardening and deployment readiness. It blocks direct authenticated
  browser-role writes to listing metadata tables, keeps admin
  listing/category/image writes on `execute_admin_product_write(...)`,
  preserves local search-index enqueue and audit invariants, refreshes
  deployment/demo runbooks, and does not add deployment, Pinecone/n8n/RAG
  runtime work, public quote tracking, customer accounts, notifications, CRM,
  uploads, browser Supabase, service-role runtime paths, or ecommerce flows.
- Phase 2L-A/B is current as release-candidate acceptance suite and final MVP
  polish. Public catalogue/quote UX, admin operations, quote workflow, admin
  write boundary, and final static security boundaries are now covered by
  local deterministic release-candidate acceptance checks. The repo is ready
  for a future preview/deployment review, but no deployment is performed in
  this PR.

Previous Current Phase 2K-A/B status:

Current phase: Phase 2K-A/B - admin write-boundary hardening and deployment readiness.

Latest completed capability: Phase 2J-A/B MVP hardening, quote intake correctness, and demo readiness.

Last merged capability PR: #115

Merge commit: `611ef1eafee5971b1d60929d17ab41a94a357522`

- PR #115 merged Phase 2J-A/B MVP hardening, quote intake correctness, and
  demo readiness at merge commit
  `611ef1eafee5971b1d60929d17ab41a94a357522`.
- The latest completed capability is Phase 2J-A/B MVP hardening, quote intake
  correctness, and demo readiness. It preserved public quote/enquiry customer
  messages, added a protected dedicated admin quote-detail read path, and
  improved public quote/listing empty, error, success, and not-found states.
- Phase 2K-A/B is current as admin write-boundary hardening and deployment
  readiness. It blocks direct authenticated browser-role writes to listing
  metadata tables, keeps admin listing/category/image writes on
  `execute_admin_product_write(...)`, preserves local search-index enqueue and
  audit invariants, refreshes deployment/demo runbooks, and does not add
  deployment, Pinecone/n8n/RAG runtime work, public quote tracking, customer
  accounts, notifications, CRM, uploads, browser Supabase, service-role
  runtime paths, or ecommerce flows.

- PR #114 merged Phase 2I-A/B public rental catalogue and quote request UX MVP
  at merge commit `6bf9202df80fbfac995ee168dceea0ef7c26edfa`.
- The latest completed capability is Phase 2I-A/B public rental catalogue and
  quote request UX MVP. It improved the public homepage, listing/category/
  detail browsing, and quote/enquiry handoff while keeping public users on
  published public-safe listing/category/image data only.
- Phase 2J-A/B completed MVP hardening, quote intake correctness, and demo
  readiness. It preserves public customer messages, adds a protected dedicated
  admin quote-detail read path, keeps admin internal notes admin-only, and does
  not add public quote tracking, customer accounts, notifications, CRM,
  Pinecone/n8n/RAG runtime work, or ecommerce flows.

- PR #113 merged Phase 2H-A/B protected admin operations UI MVP at merge
  commit `dbf59c1250e22956162475284dcbe94899f50c4b`.
- The latest completed capability is Phase 2H-A/B protected admin operations
  UI MVP. It added focused protected admin pages for listing, category, media,
  quote request, and quote detail operations while keeping listing/category/
  image writes on `execute_admin_product_write(...)` and quote workflow writes
  on `execute_admin_quote_workflow(...)`.
- Phase 2I-A/B completed the public rental catalogue and quote request UX MVP.
  Public listing/category/detail browsing and quote/enquiry submission are
  improved while public users only see public-safe listing/category/image data
  and never see admin internal notes or internal quote workflow state.

- PR #112 merged Phase 2G-C/D server-only local search-index enqueue
  integration at merge commit
  `116f3761032b2af23e2bc240a77b6e810f45e918`.
- The latest completed capability is Phase 2G-C/D server-only local
  search-index enqueue integration. It added the narrow authenticated
  `enqueue_search_index_job` RPC, admin listing/category/image metadata enqueue
  hooks inside the existing database transaction boundary, a server-only
  Supabase enqueue adapter, and pure safe job builders, with no Pinecone
  runtime/package/env/executor, no n8n workflow/runtime change, no sync worker,
  no search-index document writer, and no `/api/chat` retrieval wiring.
- Phase 2H-A/B completed the protected admin operations UI MVP. It keeps
  listing/category/image writes on the existing RPC-backed admin product write
  boundary and quote workflow writes on the existing RPC-backed quote workflow
  boundary.

- PR #111 merged Phase 2G-B local search-index outbox foundation at merge
  commit `f73c7c5515d3e5242975280b25edf28cbc25f96b`.
- The latest completed capability is the local search-index outbox foundation.
  It added local `search_index_jobs` and `search_index_documents` queue/
  document tracking tables plus a disabled server-only TypeScript contract,
  with fail-closed table access and no external search runtime.
- Phase 2G-C/D is current as server-only local search-index enqueue
  integration only. It adds a narrow local enqueue RPC, admin listing/category/
  image write enqueue hooks inside the existing database transaction boundary,
  a server-only Supabase enqueue adapter, and pure safe job builders, with no
  Pinecone runtime/package/env/executor, no n8n workflow/runtime change, no
  sync worker, no search-index document writer, and no `/api/chat` retrieval
  wiring.

- PR #110 merged the transcript metadata diagnostic denylist hotfix at merge
  commit `608e53892964c172b64286a554ee202c8d1147d8`.
- The PR #110 metadata diagnostic denylist hotfix restored provider debug and
  trace dump key rejection in the shared transcript metadata helper and
  TypeScript audit/evidence contract only, adding no transcript runtime writes
  or reads, no live Supabase executor, no admin transcript UI, no Pinecone/n8n
  runtime changes, no customer/public quote tracking functionality, and no
  ecommerce functionality.

- PR #109 merged Phase 2G-A RAG search-index architecture and sync governance
  at merge commit `02a16bdfd938841ddeac408f4d204d455050f714`.
- Phase 2G-A RAG search-index architecture and sync governance is complete as
  docs/static-guard work only.
- PR #108 merged Phase 2F-A admin rental listing/media foundation at merge
  commit `8385ac2d925b5edd44cdf016707bb2cd00d67264`.
- Phase 2F-A admin rental listing/media foundation is complete as a
  server-only listing-facing domain contract and injected adapter foundation
  only.
- PR #107 merged Phase 2E-I transcript audit/evidence server-only insert
  boundary at merge commit `0f114c3085917f80afab2a5a2b8d30d90596b66f`.
- Phase 2E-I transcript audit/evidence server-only insert boundary is complete
  as local ungranted RPC and server-only injected adapter work only.
- PR #106 merged Phase 2E-H transcript audit/evidence local schema, RLS, and
  server-only contract foundation at merge commit
  `8607e16d3c405df0797ec08536cce79f1b4f68d2`.
- Phase 2E-H transcript audit/evidence local schema, RLS, and server-only
  contract foundation is complete as local schema/RLS and server-only contract
  work only.
- PR #105 merged Phase 2E-G transcript audit/evidence model and operator runbook readiness
  at merge commit `a59547130c33ec56e275dfdee48ceac9a1f8587f`.
- Phase 2E-G transcript audit/evidence model and operator runbook readiness is
  complete as docs, checklist, and static guard work only.
- PR #104 merged Phase 2E-F transcript lifecycle governance and retention/deletion/export readiness
  at merge commit `49bb60131af99a0a3829a536eb5d29575218a442`.
- Phase 2E-F transcript lifecycle governance and retention/deletion/export
  readiness is complete as docs, checklist, and static guard work only.
- PR #103 merged the Phase 2E-D hotfix and Phase 2E-E transcript persistence
  activation governance at merge commit
  `72a85eedfcd30da26e716f95973785cb1408760b`.
- Phase 2E-E transcript persistence activation governance and executor
  approval gate is complete as docs, checklist, and static guard work only.
- Phase 2E-D hotfix coverage is complete for conflicting `clientMessageId`
  reuse rejection and total/non-throwing malformed runtime command validation.
- Phase 2E-D server-only transcript persistence RPC/adapter boundary is
  complete as local ungranted SQL/RPC, injected server-only adapter, docs, and
  static guard work only.
- Phase 2E-C server-only transcript persistence contract and validation
  boundary is complete as server-only TypeScript contract, validation, docs,
  and static guard work only.
- Phase 2E-B conversation/message schema and RLS foundation is complete as
  local migration, RLS, docs, and static guard work only.
- Phase 2E-A conversation privacy, retention, identity, transcript access,
  admin visibility, idempotency, and redaction governance is complete as
  planning/static guard work.
- Phase 2D-A deployment readiness, environment contract, smoke-test runbook,
  rollback/disable plan, evidence template, and static guard coverage remain
  completed preparation only.
- Phase 2D-B post-readiness status, remaining-work mapping, deployment
  evidence expectations, and stale blocker reconciliation are complete.

Safe next phases:

- Continue only narrow local-only contract/schema hardening or docs/static-guard
  readiness work for conversation/message privacy, retention, deletion/export,
  transcript access, and operator evidence when it remains separate from
  runtime implementation.
- A future transcript audit/evidence runtime implementation phase must be
  separately approved and must define the audited lifecycle actions, approved
  event fields, redaction policy, operator runbook, evidence template,
  rollback/disable controls, local SQL/RLS proof, static guard proof, and the
  server-side execution model before runtime writers exist.
- A future transcript lifecycle implementation phase must be separately
  approved and must define retention/deletion/export ownership, data
  classification, admin access, audit events, evidence templates,
  rollback/disable controls, local SQL/RLS proof, and static guard proof before
  runtime paths exist.
- A future live Supabase RPC executor must be separately approved, have a
  reviewed privilege model, avoid browser/client service-role exposure, prove
  idempotency and failure redaction, and include audit/evidence plus
  rollback/disable controls before `/api/chat` can use it.
- A future transcript write path must be separately approved, server-only,
  trusted-workspace scoped, idempotent, adapter-backed, and tested before any
  runtime storage exists.
- A future transcript read/admin UI path must be separately approved, protected
  by owner/admin access, audited, and tested before admin visibility exists.
- A separately approved deployment PR can use the Phase 2D-A runbook and
  evidence template, but must not bundle transcript persistence or unrelated
  runtime expansion.

Blocked phases requiring explicit owner approval:

- Runtime transcript writes, Runtime transcript reads, Live Supabase RPC
  executor, Any service-role or privileged DB execution strategy, `/api/chat`
  transcript write wiring, Transcript deletion/export runtime paths, Retention
  cleanup jobs, Audit/evidence runtime writers, Production evidence files,
  Admin transcript UI, Customer accounts, Public quote tracking or public
  transcript access, Notifications, CRM integration, n8n/Pinecone runtime
  changes, SaaS chatbot runtime work, browser Supabase, service-role runtime
  paths, and `website/chat-config.js` access.
- Real deployment, Vercel project config, Supabase Cloud connection,
  production env files, real secrets, production seed data, production
  evidence, and deployment actions. Deployment, Vercel config, Supabase Cloud
  config, env/secrets, production evidence remain blocked.
- Ecommerce flows including carts, checkout, payments, customer accounts,
  stock reservation, order fulfilment, confirmed booking, and online ordering.

Too broad or risky to bundle here:

- Lifecycle governance plus runtime transcript deletion/export, retention
  cleanup jobs, transcript reads, admin transcript UI, or `/api/chat`
  persistence wiring.
- Audit/evidence readiness plus runtime writers, production evidence files, or
  operator execution.
- Executor approval governance plus a live executor implementation.
- Transcript access plus customer accounts, public quote tracking,
  notifications, CRM, or SaaS chatbot runtime implementation.

## Previous merged status snapshot: Phase 2E-H

Current phase: Phase 2E-H - transcript audit/evidence local schema, RLS, and server-only contract foundation.

This phase adds local-only transcript audit/evidence schema, fail-closed RLS,
and a server-only TypeScript contract foundation for future reviewed audit and
evidence capture. It defines `transcript_audit_events` and
`transcript_evidence_records` tables with workspace scope, safe event/result/
actor checks, bounded redacted metadata, no browser grants, and no public
policies. It also adds `website/lib/chat/audit/` as a server-only,
dependency-injected contract with a disabled default adapter. This is local
schema/RLS plus contract foundation only. It does not wire `/api/chat`, does
not add runtime transcript writes or reads, does not add audit/evidence runtime
writers, does not add deletion/export runtime paths, does not add retention
jobs, does not add a live Supabase RPC executor, does not add service-role
runtime paths, does not add browser Supabase, does not add admin transcript UI,
and does not add production evidence.

Latest completed phase: Phase 2E-G - transcript audit/evidence model and operator runbook readiness.

Last merged phase PR: #105

Merge commit: `a59547130c33ec56e275dfdee48ceac9a1f8587f`

## Previous merged status snapshot: Phase 2E-G

Current phase: Phase 2E-G - transcript audit/evidence model and operator runbook readiness.

This phase records the future audit/evidence model and operator runbook
readiness required before transcript lifecycle actions can move toward
implementation. It documents safe event categories, approved future
audit/evidence fields, forbidden audit/evidence fields, owner approval capture,
dry-run/local proof, local SQL/RLS proof, static guard proof, evidence template
placeholders, failure triage, rollback/disable steps, audit review, data
minimisation review, redaction review, post-action verification, and "Do not
proceed" stop conditions. This is docs, checklist, and static-guard work only.
It does not implement audit/evidence storage, does not add an audit/evidence
runtime writer, does not add runtime transcript writes or reads, does not
implement transcript deletion/export, does not implement retention cleanup jobs,
does not wire transcript persistence into `/api/chat`, does not add a live
Supabase RPC executor, and does not add admin transcript UI.

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Live Supabase RPC executor remains blocked. Any service-role or
privileged DB execution strategy remains blocked. `/api/chat` transcript write
wiring remains blocked. Transcript deletion/export runtime paths remain
blocked. Retention cleanup jobs remain blocked. Audit/evidence runtime writers
remain blocked. Production evidence files remain blocked. Admin transcript UI
remains blocked. Customer accounts remain blocked. Public quote tracking or
public transcript access remains blocked. Notifications remain blocked. CRM
integration remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS
chatbot runtime work remains blocked. Deployment, Vercel config, Supabase
Cloud config, env/secrets, production evidence remain blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2E-F - transcript lifecycle governance and retention/deletion/export readiness.

Last merged phase PR: #104

Merge commit: `49bb60131af99a0a3829a536eb5d29575218a442`

Completed through PR #104:

- PR #104 merged Phase 2E-F transcript lifecycle governance and retention/deletion/export readiness
  at merge commit `49bb60131af99a0a3829a536eb5d29575218a442`.

## Previous merged status snapshot: Phase 2E-F

Current phase: Phase 2E-F - transcript lifecycle governance and retention/deletion/export readiness.

This phase records the future lifecycle governance required before transcript
retention, deletion, export, admin transcript access review, audit/evidence,
operator runbooks, rollback/disable controls, redaction, customer identity
linking, or public transcript/quote access can move toward implementation.
This is docs, checklist, and static-guard work only. It does not implement
runtime transcript deletion/export, does not implement retention cleanup jobs,
does not wire transcript writes or reads into `/api/chat`, does not add a live
Supabase RPC executor, and does not add admin transcript UI.

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Live Supabase RPC executor remains blocked. Any service-role or
privileged DB execution strategy remains blocked. `/api/chat` transcript write
wiring remains blocked. Transcript deletion/export runtime paths remain
blocked. Retention cleanup jobs remain blocked. Admin transcript UI remains
blocked. Customer accounts remain blocked. Public quote tracking or public
transcript access remains blocked. Notifications remain blocked. CRM
integration remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS
chatbot runtime work remains blocked. Deployment, Vercel config, Supabase
Cloud config, env/secrets, production evidence remain blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2E-E - transcript persistence activation governance and executor approval gate.

Last merged phase PR: #103

Merge commit: `72a85eedfcd30da26e716f95973785cb1408760b`

Completed through PR #103:

- PR #103 merged the Phase 2E-D hotfix and Phase 2E-E transcript persistence activation governance
  at merge commit `72a85eedfcd30da26e716f95973785cb1408760b`.

## Previous merged status snapshot: Phase 2E-E

Current phase: Phase 2E-E - transcript persistence activation governance and executor approval gate.

This phase first hotfixes two Phase 2E-D findings, then records the governance
and approval gates required before any transcript persistence activation work.
The Phase 2E-D hotfix makes conflicting `clientMessageId` reuse reject instead
of silently dropping changed messages, and it makes transcript command
validation total/non-throwing for malformed JSON-like runtime input. Phase
2E-E then documents that the current RPC remains ungranted to browser roles,
the TypeScript adapter still requires an injected executor, and no live
Supabase RPC executor exists yet. This is hotfix, docs, checklist, and
static-guard work only. It does not wire `POST /api/chat` to transcript
persistence, does not add a live executor, does not add a service-role runtime
path, does not add transcript reads, and does not add admin transcript UI.
Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Admin transcript UI remains blocked. Customer accounts remain
blocked. Public quote tracking remains blocked. Notifications remain blocked.
CRM integration remains blocked. n8n/Pinecone runtime changes remain blocked.
SaaS chatbot runtime work remains blocked. Deployment remains blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2E-D - server-only transcript persistence RPC/adapter boundary.

Last merged phase PR: #102

Merge commit: `b34cc02a67e73d497e9b90fd904786da3bbe77d3`

## Previous merged status snapshot: Phase 2E-D

Current phase: Phase 2E-D - server-only transcript persistence RPC/adapter boundary.

This phase adds the local server-only transcript persistence RPC/adapter
boundary after the Phase 2E-C contract and validation boundary. It adds a local
SQL/RPC contract for persisting validated workspace-scoped conversation/message
batches into the existing `conversations` and `messages` tables, preserves
`clientMessageId` idempotency, keeps anonymous session hashes as correlation
only, preserves retention fields and minimised metadata, and keeps browser
roles ungranted. It also adds a server-only TypeScript adapter that maps the
Phase 2E-C validated command into an injected RPC executor payload. The default
persistence adapter remains unavailable. This is local SQL/RPC, adapter, docs,
and static-guard work only. It does not wire `POST /api/chat` to transcript
persistence and does not create a live service-role runtime path. Runtime
transcript writes remain blocked. Runtime transcript reads remain blocked.
Admin transcript UI remains blocked. Customer accounts remain blocked. Public
quote tracking remains blocked. Notifications remain blocked. CRM integration
remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS chatbot
runtime work remains blocked. Deployment remains blocked. Browser Supabase
remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2E-C - server-only transcript persistence contract and validation boundary.

Last merged phase PR: #101

Merge commit: `cfc48f132e170121e1eb90f6b1af4c60762a7227`

## Previous merged status snapshot: Phase 2E-C

Current phase: Phase 2E-C - server-only transcript persistence contract and validation boundary.

This phase adds the server-only TypeScript transcript persistence contract
after the Phase 2E-B schema/RLS foundation. It defines conversation, message,
batch transcript, result, unavailable, and injected adapter shapes; adds pure
validation and minimisation helpers for trusted workspace IDs, server-generated
conversation/message IDs, role/type pairs, bounded content, bounded metadata,
unsafe metadata keys, anonymous session-hash correlation, and client-message
idempotency; and proves the behavior with fake/injected adapter tests. This is
contract/validation/docs/static-guard work only. It does not wire
`POST /api/chat` to transcript persistence and does not call Supabase,
SQL/RPC, n8n, Pinecone, or external providers. Runtime transcript writes
remain blocked. Runtime transcript reads remain blocked. Admin transcript UI
remains blocked. Customer accounts remain blocked. Public quote tracking
remains blocked. Notifications remain blocked. CRM integration remains
blocked. n8n/Pinecone runtime changes remain blocked. SaaS chatbot runtime
work remains blocked. Deployment remains blocked. Browser Supabase remains
forbidden. Service-role runtime paths remain forbidden. `website/chat-config.js`
access remains forbidden.

Latest completed phase: Phase 2E-B - conversation/message schema and RLS foundation.

Last merged phase PR: #100

Merge commit: `28610850213950d256862a6b16936c9362402b42`

## Previous merged status snapshot: Phase 2E-B

Current phase: Phase 2E-B - conversation/message schema and RLS foundation.

This phase adds the local Supabase schema and RLS foundation for the existing
`conversations` and `messages` tables after the Phase 2E-A privacy governance
bundle. It adds additive metadata, retention, deletion marker, ordering, and
message-type constraints; bounds message content and metadata; documents the
anonymous session hash as non-identity correlation only; and changes direct
conversation/message RLS to fail closed for anonymous/public and authenticated
client roles. This is schema/RLS/docs/static-guard work only. Runtime
transcript writes remain blocked. Runtime transcript reads remain blocked.
Admin transcript UI remains blocked. Customer accounts remain blocked. Public
quote tracking remains blocked. Notifications remain blocked. CRM integration
remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS chatbot
runtime work remains blocked. Deployment remains blocked. Browser Supabase
remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2E-A - privacy, retention, identity, and conversation/message governance planning.

Last merged phase PR: #99

Merge commit: `8fc982616e119cce9484ef5feb1f11dc4705c17e`

## Previous merged status snapshot: Phase 2E-A

Current phase: Phase 2E-A - privacy, retention, identity, and conversation/message governance planning.

This phase adds conversation privacy and retention governance before future
conversation/message persistence. It documents the PII minimisation model,
anonymous visitor identity model, future authenticated/admin-linked identity
considerations, retention rules, deletion/export expectations, transcript
access rules, admin visibility boundaries, future persistence idempotency, and
redaction guidance. This is docs/checklist/static-guard planning only.
Conversation/message persistence is not implemented. Transcript storage is not
implemented. Admin transcript UI is not implemented. Customer accounts are not
approved. Public quote tracking is not approved. Notifications are not
approved. CRM integration is not approved. n8n/Pinecone runtime changes are
not approved. SaaS chatbot runtime work is not approved. Deployment is not
approved. Browser Supabase remains forbidden. Service-role runtime paths remain
forbidden. `website/chat-config.js` access remains forbidden.

Latest completed phase: Phase 2D-B - post-readiness status, remaining-work map, and evidence guard reconciliation.

Last merged phase PR: #98

Merge commit: `173138e81e612e8effe54803c495c056f2c5bfd3`

## Previous merged status snapshot: Phase 2D-B

Current phase: Phase 2D-B - post-readiness status, remaining-work map, and evidence guard reconciliation.

This phase reconciles the canonical status surfaces after PR #97 merged Phase
2D-A. It records Phase 2D-A as the latest completed capability, adds a
remaining-work map, hardens future deployment evidence expectations, and adds
static guard coverage for post-readiness status and stale blocker wording. No
deployment is approved by this phase. It does not add Vercel project config,
Supabase Cloud config, production env files, real secrets, production seed
data, runtime env behaviour changes, browser Supabase, service-role runtime
paths, customer uploads, public upload routes, public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2D-A - deployment readiness, environment contract, and smoke-test runbook.

Last merged phase PR: #97

Merge commit: `e04444a41a8993758bb00d6be234c255abb1ff9b`

## Remaining-work map

Completed through PR #97:

- Phase 2D-A deployment readiness, environment contract, smoke-test runbook,
  rollback/disable plan, evidence template, and static guard coverage are
  complete as preparation only.
- Admin-managed listing metadata, protected listing media upload, public
  listing image rendering, quote handoff, admin quote inbox/status/internal
  note workflow, and atomic quote workflow RPC hardening are already reflected
  in the Phase 2D-A readiness package.

Safe next phases:

- A separately approved deployment PR can use the Phase 2D-A runbook and
  evidence template, but must remain isolated from unrelated runtime expansion.
- Docs/static-guard work for privacy, retention, conversation/message
  governance, or operator evidence hardening can proceed if scoped separately.
- Small copy or checklist reconciliations can proceed when they preserve the
  furniture/event-rental enquiry and quote direction.

Blocked phases requiring explicit owner approval:

- Real deployment, Vercel project config, Supabase Cloud connection,
  production env files, real secrets, production seed data, and deployment
  actions.
- Browser Supabase, service-role runtime paths, public/customer uploads,
  arbitrary public upload routes, public quote status tracking,
  customer-visible internal notes, notifications, CRM integration,
  n8n/Pinecone runtime changes, Pinecone migration, SaaS chatbot runtime work,
  and `website/chat-config.js` access.
- Ecommerce flows including carts, checkout, payments, customer accounts,
  stock reservation, order fulfilment, confirmed booking, and online ordering.

Too broad or risky to bundle here:

- Real deployment plus any new runtime feature.
- Privacy/retention governance plus deployment readiness or deployment action.
- Database/API/table/RPC/RLS renames, ecommerce pivots, CRM/notification
  workflows, customer-facing quote tracking, or SaaS chatbot implementation.

## Previous merged status snapshot: Phase 2D-A

Current phase: Phase 2D-A - deployment readiness, environment contract, and smoke-test runbook.

This phase updates deployment readiness documentation, the environment
contract, operator smoke-test runbook, rollback/disable plan, evidence
template, and static guard coverage for the current SKR app after
storage-backed listing media, public catalogue/detail handoff, protected admin
listing management, and atomic admin quote workflow hardening. No deployment
is approved by this phase. It does not add Vercel project config, Supabase
Cloud config, production env files, real secrets, production seed data,
runtime env behaviour changes, browser Supabase, service-role runtime paths,
customer uploads, public upload routes, public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-D - quote workflow atomicity and admin operations hardening.

Last merged phase PR: #96

Merge commit: `3147c1206e763412e9edc6e8b792cc87b80e523b`

## Previous merged status snapshot: Phase 2C-D

Current phase: Phase 2C-D - quote workflow atomicity and admin operations hardening.

This phase hardens the internal admin quote workflow write path. The protected
admin status/note route still uses the existing `quote.write` route gate,
same-origin checks, CSRF proof, trusted workspace resolution, and a
session-bound authenticated Supabase client, but persistence now calls a single
`execute_admin_quote_workflow` RPC. The database function validates the
authenticated owner/admin workspace actor, locks the target quote request,
updates only `quote_requests.status` and `quote_requests.updated_at`, and
inserts status-change and internal-note activity in one transaction. Status and
activity now succeed or fail together. Direct authenticated table update/insert
grants for quote workflow writes are revoked, while admin activity reads remain
RLS-scoped. This phase does not add public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, customer uploads, arbitrary public upload
routes, browser Supabase, service-role runtime paths, deployment config,
Supabase Cloud actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-C - admin quote operations and enquiry workflow closeout.

Last merged phase PR: #95

Merge commit: `ab59adb8bf3c328b71ed91cc7a8141df9a43948e`

## Previous merged status snapshot: Phase 2C-C

Current phase: Phase 2C-C - admin quote operations and enquiry workflow closeout.

This phase improves internal quote/enquiry follow-up for authorised admins.
The protected admin quote inbox can now save internal follow-up notes alongside
status changes, and the server-only quote read boundary returns recent
admin-only quote activity scoped to the trusted workspace. Persistence uses a
session-bound authenticated Supabase client, owner/admin RLS policies, CSRF
proofs for `quote.write`, generic route responses, and a new admin-only
`quote_request_activity` table. Internal activity is never shown on public
quote pages. This phase does not add public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, customer uploads, arbitrary public upload
routes, browser Supabase, service-role runtime paths, deployment config,
Supabase Cloud actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-B - public catalogue polish and enquiry handoff.

Last merged phase PR: #94

Merge commit: `33067c3b3dd86847885db7c57c81c8e17962b043`

## Previous merged status snapshot: Phase 2C-B

Current phase: Phase 2C-B - public catalogue polish and enquiry handoff.

This phase polishes the public catalogue and listing detail experience for the
furniture/event-rental website now that admin-uploaded listing images can be
rendered. Catalogue cards and detail pages use stable image frames, clearer
category/rental-unit hierarchy, safe fallback imagery, and enquiry-oriented CTA
copy. Catalogue and detail CTA links may pass an optional listing slug to the
existing quote request page; the quote page validates that slug through the
public catalogue read surface before displaying context or pre-filling the
existing items text area. This phase also adds safe catalogue/detail metadata
using only public listing data. It does not add carts, checkout, payments,
customer accounts, stock reservation, order fulfilment, confirmed booking,
online ordering, customer uploads, arbitrary public upload routes, public quote
status tracking, notifications, CRM integration, browser Supabase, service-role
runtime paths, DB/API/table/RPC/RLS renames, n8n/Pinecone runtime behavior,
SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-A - storage-backed listing media upload and public image rendering.

Last merged phase PR: #93

Merge commit: `88f8b7147bcabb06189f44c300187a4149415c2f`

## Previous merged status snapshot: Phase 2C-A

Current phase: Phase 2C-A - storage-backed listing media upload and public image rendering.

This phase adds an admin-controlled listing media workflow. Authorised
owner/admin users can upload approved JPEG, PNG, WebP, or AVIF listing images
through the protected admin shell. The existing `POST /api/admin/product-images`
route now keeps JSON metadata creation unchanged and handles multipart uploads
through a server-only branch that requires `productImage.write`, same-origin
Origin/Host validation, a valid CSRF proof, trusted workspace resolution, and a
session-bound authenticated Supabase client. Uploaded files are stored in the
public `listing-media` bucket under server-generated workspace/listing paths,
then existing `product_images` metadata is created through the current
metadata persistence contract. Because the bucket is public, object serving is
public to anyone with the unguessable server-generated URL; RLS is not treated
as a public URL serving gate. Public catalogue and listing detail pages render
only URLs surfaced by active published listing metadata and keep safe fallback
imagery when they are not available. This phase does not add customer uploads, arbitrary
public upload routes, carts, checkout, payments, customer accounts, stock
reservation, order fulfilment, confirmed booking, online ordering, quote
status tracking, notifications, CRM integration, browser Supabase, service-role
runtime paths, DB/API/table/RPC/RLS renames, n8n/Pinecone runtime behavior,
SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AY - admin listing image metadata UI boundary.

Last merged phase PR: #92

Merge commit: `eaf6f19a42e47b9bfb7f9ecb780bbec5bed50cbd`

## Previous merged status snapshot: Phase 2B-AY

Current phase: Phase 2B-AY - admin listing image metadata UI boundary.

This phase adds metadata-only listing image management controls inside the
protected admin shell. Authorised owner/admin users can request a
`productImage.write` CSRF proof and create, update, or archive listing image
metadata through the existing protected product-image metadata backend routes.
The dashboard read boundary now includes the editable image metadata needed by
the UI, scoped to the trusted admin workspace and mapped to generic unavailable
states on provider errors. This phase does not add binary image upload,
`<input type="file">`, multipart form handling, Supabase Storage bucket
creation or API calls, public image upload or management routes, browser
Supabase, service-role runtime paths, SQL migrations, DB/API/table/RPC/RLS
renames, carts, checkout, payments, customer accounts, stock reservation,
order fulfilment, confirmed booking, online ordering, notifications, CRM
integration, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, or
`website/chat-config.js` access.

Latest completed phase: Phase 2B-AX - admin quote request status update boundary.

Last merged phase PR: #91

Merge commit: `0977f70a85c15cc82350160d6b8d8394b16ba5d9`

## Previous merged status snapshot: Phase 2B-AX

Current phase: Phase 2B-AX - admin quote request status update boundary.

This phase adds admin-only quote request status updates from the protected
admin quote request inbox. Authorised owner/admin users can request a
`quote.write` CSRF proof and update only the `status` field of an existing
quote request through a first-party server-only route scoped to the trusted
admin workspace. Viewer memberships cannot use `quote.write`. The UI presents
these statuses as internal follow-up status only and returns generic success or
failure states. It does not add public quote tracking, customer-facing status
pages, notifications, CRM integration, internal notes, assignment, customer
accounts, ecommerce ordering, checkout, payments, fulfilment, stock
reservation, confirmed booking, online ordering, image upload, Supabase
Storage, SQL migrations, DB/API/table/RPC/RLS renames, browser Supabase,
service-role runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AW - admin quote request inbox boundary.

Last merged phase PR: #90

Merge commit: `1852b6910fdd1eb5ddf19aaf788ead47d4a05bf0`

## Previous merged status snapshot: Phase 2B-AW

Current phase: Phase 2B-AW - admin quote request inbox boundary.

This phase adds a read-only admin quote request inbox inside the protected
admin shell. Authorised admins can review recent customer quote requests and
requested item snapshots for the trusted admin workspace through a server-only,
session-bound admin read path. The inbox is read-only and returns only generic
unavailable UI when quote data cannot be loaded. It does not add quote status
writes, notifications, CRM integration, customer accounts, ordering, checkout,
payments, fulfilment, stock reservation, confirmed booking, SQL migrations,
browser Supabase, service-role runtime paths, ecommerce flows, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, or `website/chat-config.js`
access.

Latest completed phase: Phase 2B-AV - admin anti-framing header hardening.

Last merged phase PR: #89

Merge commit: `59c79e8e6e08f3065944e0252333f2f6a8947597`

## Previous merged status snapshot: Phase 2B-AV

Current phase: Phase 2B-AV - admin anti-framing header hardening.

This phase adds a narrow browser-side clickjacking hardening control for the
protected admin UI. The Next.js config now applies only
`Content-Security-Policy: frame-ancestors 'none'` and
`X-Frame-Options: DENY` to `/admin` and nested admin UI routes. This is a
low-severity hardening fix: SameSite=Lax auth cookies may reduce arbitrary
off-site exploitability, but anti-framing headers close the missing
browser-side defence for the real first-party admin UI. It does not change
admin auth, CSRF, Origin/Host checks, Supabase SSR cookies, write route logic,
admin UI behavior, SQL migrations, browser Supabase, service-role runtime
paths, ecommerce flows, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AU - public events and quote copy polish.

Last merged phase PR: #88

Merge commit: `8b7ef181ba44c63847d3accc324627ae38e4b5b8`

## Previous merged status snapshot: Phase 2B-AU

Current phase: Phase 2B-AU - public events and quote copy polish.

This phase polishes public events and quote-request copy without changing the
public data path or quote form behavior. The events page now uses normal
event-rental, furniture-rental, styled-setup, enquiry, and quote-request
language instead of public shell/MVP wording. The quote page and site metadata
stay focused on quote requests and do not imply checkout, payment, online
ordering, stock reservation, or confirmed bookings. It does not add enquiry
form implementation beyond the existing quote request form, admin changes,
image upload, Supabase Storage, SQL migrations, DB/API/table/RPC/RLS renames,
ecommerce flows, browser Supabase, service-role runtime paths, n8n/Pinecone
changes, SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AT - public furniture catalogue UX polish.

Last merged phase PR: #87

Merge commit: `806395ba83e1b7114a4305be772ec8ac2a6d190c`

## Previous merged status snapshot: Phase 2B-AT

Current phase: Phase 2B-AT - public furniture catalogue UX polish.

This phase polishes public catalogue and listing detail UX without changing the
public data path. The pages now use listing-forward copy for browsing and detail
views, keep a safe fallback empty state, and preserve existing read paths using
`getPublicCatalogue()` and `getPublicProductBySlug()`. It does not add image
upload, Supabase Storage, public image generation from Supabase Storage URLs,
enquiry form implementation, DB/API/table/RPC/RLS renames, ecommerce flows,
browser Supabase, service-role runtime paths, or `website/chat-config.js`
access.

Latest completed phase: Phase 2B-AS - metadata-only admin listing management.

Last merged phase PR: #86

Merge commit: `6b031b3a287a6b763f55676a791ee29a7504b4a8`

## Previous merged status snapshot: Phase 2B-AS

Current phase: Phase 2B-AS - admin furniture listing management UI boundary.

This phase adds metadata-only furniture listing management controls inside the
existing protected admin shell. Authorised admins can create, edit,
publish/unpublish, and archive listing metadata through the existing hardened
`product.write` backend routes. The UI requests a first-party CSRF proof and
sends `x-csrf-proof` on write requests. It does not add image upload, Supabase
Storage, public catalogue redesign, enquiry forms, DB/API/table/RPC/RLS
renames, ecommerce flows, browser Supabase, service-role runtime paths, or
`website/chat-config.js` access.

Latest completed phase: Phase 2B-AR - admin shell GET origin handling fix.

Last merged phase PR: #85

Merge commit: `b120ebe24290c9a7d675fc51160f9b63ded464e2`

## Previous merged status snapshot: Phase 2B-AR

Current phase: Phase 2B-AR - admin shell GET origin handling fix.

This phase fixes the protected admin shell request-security gate so safe
top-level `GET`/`HEAD` admin shell access can proceed when the browser omits
`Origin` and the request `Host` matches trusted expected host configuration.
Strict Origin/Host validation remains required when Origin is present, for
`admin.csrf.issue`, and for state-changing admin writes. The shell maps
request-security denials to generic unavailable copy rather than implying an
authenticated-but-not-authorised account state.

Latest completed phase: Phase 2B-AQ - furniture listing catalogue direction pivot.

Last merged phase PR: #84

Merge commit: `0cc3db57d7f2d1f578a5e1384fc17fe530e8a9f7`

## Previous merged status snapshot: Phase 2B-AQ

Current phase: Phase 2B-AQ - furniture listing catalogue direction pivot.

This phase updates direction and presentation copy so the current product track is clearly a furniture/event-rental listing catalogue plus customer enquiry/quote request system. Admin-managed categories and catalogue listings remain the operating model; carts, checkout, payments, customer accounts, stock reservation, order fulfilment, and online ordering are not the near-term direction. Internal database/API names such as `products`, `categories`, and `product_images` remain unchanged for now to avoid risky churn.

Latest completed phase: Phase 2B-AP - admin category management UI boundary.

Last merged phase PR: #83

Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`

## Previous merged status snapshot: Phase 2B-AP

Current phase: Phase 2B-AP - admin category management UI boundary.
Latest completed phase: Phase 2B-AO - admin read-only product dashboard boundary.
Last merged phase PR: #83
Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`

## Previous merged status snapshot

Current phase: Phase 2B-AN - admin auth login logout protected shell.

This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AM - admin product write audit atomicity boundary.

Last merged phase PR: #80

Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`

## Completed foundation

- Next.js app root exists under `website/`.
- Public homepage, catalogue, furniture listing detail, events, quote, and chat shells
  exist.
- Browser chat calls first-party `POST /api/chat` only.
- n8n remains behind the server-only `N8nChatProvider`.
- Supabase schema, migrations, RLS strategy, local RLS tests, server-only
  Supabase helper, public catalogue reads, quote persistence, and
  session-bound admin product persistence exist.
- Disabled server-only chat persistence scaffold exists.

## Completed deployment readiness docs

- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md`
- `docs/templates/DEPLOYMENT-EVIDENCE.md`
- `docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md`

These are preparation only. They do not deploy, connect Supabase Cloud, add
Vercel config, add real env values, or add runtime features.

## Completed admin/auth design and policy scaffolds

- `docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md`
- `docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md`
- `docs/checklists/PHASE-2B-ADMIN-AUTH.md`
- `docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md`
- Server-only admin authorization policy module.
- Server-only disabled auth/membership resolver scaffold.
- Server-only admin auth/membership adapter contracts with fake-adapter tests.
- Checklist ownership, maintenance rules, and quick phase status docs.
- Reviewed server-side resolver decisions for trusted fake adapter inputs.
- Admin auth implementation-gate cleanup and runtime-readiness checklist/static
  guard refinement is complete.
- Future server-only Supabase Auth runtime approval lane is complete.
- Server-only Supabase Auth identity/session-read boundary is complete.
- Server-only Supabase admin profile/membership read boundary is complete.
- Server-only admin workspace resolution boundary is complete.
- Server-only session-bound admin read-client factory is complete.
- Server-only admin authorization adapter-set composition boundary is complete.
- Server-only composed admin authorization decision boundary is complete.
- Server-only admin request security preflight boundary is complete.
- Server-only CSRF proof verifier boundary is complete.
- Server-only CSRF proof issuer boundary is complete.
- Server-only admin authorization gate composition boundary is complete.
- Admin runtime wiring approval lane is complete.
- Server-only admin request metadata adapter boundary is complete.
- Server-only admin runtime gate invocation boundary is complete.
- Admin runtime gate invocation usage approval lane is complete.
- Server-only admin runtime route gate adapter boundary is complete.
- Admin runtime route gate adapter usage approval lane is complete.
- First admin runtime route gate adapter usage boundary is complete.
- Admin CSRF proof issuer runtime usage approval lane is complete.
- Admin auth-check trusted workspace dependency repair is complete.
- Admin CSRF proof issuer route operation approval boundary is complete.
- Admin CSRF issue operation policy and preflight boundary is complete.
- Admin CSRF proof issuer route readiness and route-if-safe boundary is complete.
- Admin CSRF proof runtime dependency boundary is complete. This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.
- Admin CSRF proof issuer route deferred because of missing safe server-side session/workspace binding is complete.
- Admin CSRF proof issuer session/workspace binding boundary is complete.
- Admin CSRF proof session/workspace binding runtime dependency boundary is complete.
- Admin CSRF proof issuer route implementation is complete.
- Backend-only protected admin product persistence and write API routes are
  complete.
- Admin product write audit atomicity boundary is complete.
- Minimal first-party admin login/logout and protected admin shell boundary is
  complete.
- Read-only admin furniture listing dashboard boundary is complete.
- Admin shell GET missing-Origin route-gate repair is complete.
- Metadata-only admin furniture listing management UI boundary is complete.
Supabase Auth is approved as the future server-side admin auth provider. The
Phase 2B-K identity boundary remains the only approved place to read Supabase
Auth cookies or call Supabase Auth server APIs. The Phase 2B-L
profile/membership boundary is the only approved place in this phase to read
`admin_users` or `memberships` for admin authorization. The Phase 2B-M
workspace resolver boundary is the only approved place in this phase to
resolve trusted admin workspace scope. The Phase 2B-N session-bound admin
read-client factory is restricted to the Phase 2B-K identity boundary and is
not a runtime wiring approval. The Phase 2B-O adapter-set composition boundary
is restricted to composing those existing server-only contracts and is not a
runtime wiring approval. The Phase 2B-P composed decision boundary is
restricted to composing the adapter set and calling the existing adapter-driven
decision resolver; it is not a runtime wiring approval. The Phase 2B-Q request
security preflight boundary is restricted to validating explicitly injected
request metadata and optional injected CSRF verifier results; it is not a
runtime wiring or header-read approval. The Phase 2B-R CSRF proof verifier
boundary is restricted to validating explicitly injected proof material and
dependency-injected verifier checks; it is not a runtime wiring, header-read,
cookie-read, or CSRF issuance approval. The Phase 2B-S CSRF proof issuer
boundary is restricted to issuing verifier-compatible proofs from explicitly
injected proof material and dependency-injected signer/nonce dependencies; it
is not a runtime wiring, header-read, cookie-read, env-read, replay-store, or
CSRF verification approval. The Phase 2B-T admin authorization gate
composition boundary is restricted to composing those server-only boundaries
from explicit inputs only and is not a runtime wiring approval. Phase 2B-U
approves only the future runtime lane for gate usage from first-party
server-only routes or server actions after a reviewed request metadata adapter
exists; it is not runtime implementation approval. The Phase 2B-V request
metadata adapter boundary is restricted to reading minimal untrusted request
metadata and trusted expected origin/host inputs for future gate injection; it
is not runtime route/page/server-action wiring approval. The Phase 2B-W
runtime gate invocation boundary is restricted to composing the Phase 2B-V
metadata adapter and Phase 2B-T gate from explicit inputs; it is not runtime
route/page/server-action wiring approval. The Phase 2B-X approval lane is
docs/checklist/static-guard approval only and is not runtime implementation
approval. The Phase 2B-Y route gate adapter boundary is restricted to calling
the Phase 2B-W invocation helper from explicit inputs only and is not runtime
route/page/server-action wiring approval. The Phase 2B-Z approval lane is
docs/checklist/static-guard approval only for future first-party server-only
usage of `resolveServerAdminRuntimeRouteGateAdapter()`, and it is not runtime
implementation approval. Phase 2B-AA approves and adds the first admin runtime
route gate adapter usage boundary from exactly one first-party server-only
route handler. Phase 2B-AB approves only the future server-only admin CSRF
proof issuer runtime usage lane. Phase 2B-AC repairs the admin auth-check
trusted workspace dependency. Phase 2B-AD is docs/checklist/static-guard approval only for the future admin CSRF proof issuer route operation model, and it is not runtime implementation approval. Phase 2B-AE implements only the admin CSRF issue operation policy and preflight boundary. Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented. Phase 2B-AG implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. Phase 2B-AH is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries. Phase 2B-AI implements only the server-only admin CSRF proof issuer session/workspace binding boundary. Phase 2B-AJ implements only the server-only runtime dependency that derives opaque session/workspace bindings for that boundary from canonical operation, auth user, admin user, trusted workspace, and membership role inputs. Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route. It reuses the approved `admin.csrf.issue` route gate lane, `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, `ADMIN_TRUSTED_WORKSPACE_ID`, the Phase 2B-AI binding boundary, and the Phase 2B-AJ runtime dependencies. It does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access. These boundaries are not wired into pages, server actions,
protected admin runtime, login/logout, admin UI, or product writes. Phase
2B-AL implements only backend protected product/category/product-image metadata
write routes and session-bound persistence through the approved admin
gate/CSRF/RLS/audit boundaries. Phase 2B-AM resolves the atomicity limitation in
2B-AL by migrating product metadata mutations and audit insertions to a single
Postgres RPC transaction block (`execute_admin_product_write`), and hardens
route methods to POST-only for state changes. These 2B-AL/AM boundaries are not
wired into pages, server actions, protected admin runtime, login/logout, admin
UI, Storage, uploads, browser Supabase, or service-role paths. Phase 2B-AN
adds only minimal login/logout and a protected admin shell. Login/logout uses
the existing server-only Supabase Auth boundary for session creation and
clearing. The protected shell uses the existing route-gate stack with the new
read-only `admin.shell.access` operation, which allows owner/admin membership
and denies viewer membership. It does not add product-management UI, product
write forms, server actions, Storage, uploads, browser Supabase, service-role
paths, deployment config, Supabase Cloud, n8n changes, Pinecone runtime code,
SaaS chatbot work, or `website/chat-config.js` access.
Phase 2B-AO adds only a read-only furniture listing dashboard inside that protected
shell. It keeps the existing `admin.shell.access` gate as the page boundary,
uses a session-bound authenticated read client for select-only catalogue table
reads, and renders only safe catalogue management summaries. It does not add
write forms, mutation controls, server actions, Storage/uploads, browser
Supabase, service-role paths, deployment config, Supabase Cloud, n8n changes,
Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Runtime session-bound read-client usage remains deferred outside the approved
first-party admin, listing media, and quote workflow boundaries documented
through Phase 2C-D.
Runtime adapter-set, decision-boundary, request-security preflight, admin
authorization gate, request metadata adapter, gate invocation helper, and
route gate adapter usage remains deferred outside the approved first-party
admin route/page boundaries documented through Phase 2C-D.
Runtime CSRF proof verifier usage remains restricted to approved
state-changing admin operations, including product/category/listing image
metadata writes, admin-controlled listing media upload, and quote workflow
writes. Runtime CSRF proof issuer and session/workspace binding usage remains
deferred except the approved Phase 2B-AK `POST /api/admin/csrf-proof` route.

## Still blocked

- Real auth runtime wiring outside the Phase 2B-AN login/logout and protected
  admin shell boundary.
- Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth
  session boundaries.
- Cookie reads outside the Phase 2B-K server-only identity boundary.
- Admin profile/membership Supabase table reads outside the Phase 2B-L
  server-only read boundary.
- Admin workspace resolution outside the Phase 2B-M server-only workspace
  boundary.
- Session-bound admin read-client factory usage outside the approved
  first-party admin, listing media, and quote workflow boundaries documented
  through Phase 2C-D.
- Admin authorization adapter-set, decision-boundary, request-security
  preflight, and gate usage outside approved first-party admin route/page
  boundaries documented through Phase 2C-D.
- Admin CSRF proof verifier usage outside approved state-changing admin
  operations documented through Phase 2C-D.
- Admin CSRF proof issuer usage from other runtime routes, pages, or server
  actions.
- Admin CSRF proof session/workspace binding usage from other runtime routes,
  pages, or server actions.
- Admin runtime gate invocation and route gate adapter usage outside approved
  first-party admin route/page boundaries documented through Phase 2C-D.
- Header reads outside the Phase 2B-V request metadata adapter.
- Login/logout routes outside the Phase 2B-AN first-party admin auth boundary.
- Protected admin pages outside the Phase 2B-AN minimal protected shell and
  Phase 2B-AO read-only dashboard boundary.
- Furniture listing write UI beyond the approved category management,
  metadata listing, metadata listing image controls, and Phase 2C-A
  admin-controlled listing media upload boundary.
- Resolver/adapter runtime wiring into routes, pages, or server actions.
- Product writes outside the Phase 2B-AL backend API route boundary.
- Customer uploads, arbitrary public upload routes, and storage usage outside
  the approved admin-controlled `listing-media` workflow.
- Conversation/message writes.
- Supabase Cloud connection.
- Deployment and Vercel project config.
- Production seed data.
- Browser Supabase.
- Service-role runtime paths unless separately approved.
- Pinecone runtime changes or migration.
- SaaS chatbot app work in this repo.
- n8n workflow import, export, activation, execution, or mutation.

Furniture listing metadata writes currently use the existing Phase 2B-AL/AM backend API route boundary, whose internal technical names still reference product/product image tables and routes.
Listing media uploads currently use the approved Phase 2C-A protected
server-only multipart branch and public `listing-media` bucket model.

Furniture listing write UI beyond categories, Phase 2B-AS metadata-only
listing controls, Phase 2B-AY metadata-only listing image controls, and the
Phase 2C-A admin-controlled listing media upload boundary remains blocked.
Customer uploads, arbitrary public upload routes, server actions, storage
usage outside the approved listing media workflow, service-role shortcuts, and
browser Supabase product writes remain blocked.

## Current n8n/Pinecone position

The current SKR website may keep using the existing n8n/Pinecone chatbot workflow as a temporary production bridge.

n8n remains temporary server-side integration only.

Browser must never call n8n directly.

Do not migrate Pinecone in this repo yet.

Do not add Pinecone runtime code or credentials in this repo yet.

## Future SaaS chatbot note

The future SaaS chatbot should be a separate project/app.

SKR can later become the first client/tenant of that SaaS chatbot.

Do not implement SaaS chatbot work inside this repo yet.

Do not force the current n8n/Pinecone workflow into the future SaaS
architecture.

## Next recommended PR

The next recommended PR after this reconciliation should keep tracks separate.
A future deployment PR must be separately approved and should use the Phase
2D-A runbook and evidence template without bundling unrelated runtime work.
Safe non-deployment follow-up can be docs/static-guard work for privacy,
retention, conversation/message governance, or operator evidence hardening.
Customer uploads, arbitrary public upload routes, public quote status
tracking, customer-visible internal notes, notifications, CRM integration,
carts, checkout, payments, customer accounts, stock reservation, order
fulfilment, online ordering, deployment config without explicit approval,
browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime
code, SaaS chatbot work, and `website/chat-config.js` access remain blocked.

## Phase 2B-AP Current Boundary

Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell for authorised owner/admin users. The browser requests a CSRF proof for `category.write` from the first-party `/api/admin/csrf-proof` route and then calls only the existing first-party category write endpoints with `x-csrf-proof`.

Product create/edit/archive/publish UI, product image write UI, binary uploads, Supabase Storage, server actions, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.


## Previous merged status snapshot: Phase 2B-AO

Current phase: Phase 2B-AO - admin read-only product dashboard boundary.
Latest completed phase: Phase 2B-AN - admin auth login logout protected shell.
Last merged phase PR: #81
Merge commit: `f66a37644c51123780fee0944e584ab5e00d6f3e`

## Phase 2B-AQ Current Boundary

Phase 2B-AQ is a terminology and direction pivot only. It makes current docs, checklists, and safe visible copy point to an admin-managed furniture/event-rental listing catalogue with customer enquiry/quote requests.

This phase does not rename database tables, Supabase tables, API routes, RPCs, RLS policies, or server helper modules. The existing internal `products`, `categories`, and `product_images` names remain in place until a separately approved migration/rename strategy exists.

Carts, checkout, payments, customer accounts, stock reservation, order fulfilment, online order flows, new listing write UI, uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.

## Phase 2B-AS Current Boundary

Phase 2B-AS adds only metadata furniture listing management controls inside
the protected admin shell. The browser component requests a CSRF proof for
`product.write`, then calls only `POST /api/admin/products`,
`POST /api/admin/products/[productId]`, and
`POST /api/admin/products/[productId]/archive` with `x-csrf-proof`.

Image upload, Supabase Storage, public catalogue redesign, enquiry forms,
DB/API/table/RPC/RLS renames, cart, checkout, payments, customer accounts,
stock reservation, order fulfilment, online ordering, browser Supabase,
service-role runtime paths, deployment config, n8n changes, Pinecone runtime
code, SaaS chatbot work, and `website/chat-config.js` access remain out of
scope.

## Phase 2B-AY Current Boundary

Phase 2B-AY adds only metadata listing image management controls inside the
protected admin shell. The browser component requests a CSRF proof for
`productImage.write`, then calls only `POST /api/admin/product-images`,
`POST /api/admin/product-images/[imageId]`, and
`POST /api/admin/product-images/[imageId]/archive` with `x-csrf-proof`.

Binary image upload, file inputs, multipart form handling, Supabase Storage,
public image upload or management routes, DB/API/table/RPC/RLS renames, SQL
migrations, cart, checkout, payments, customer accounts, stock reservation,
order fulfilment, confirmed booking, online ordering, notifications, CRM
integration, browser Supabase, service-role runtime paths, deployment config,
n8n/Pinecone runtime behavior, SaaS chatbot runtime work, and
`website/chat-config.js` access remain out of scope.
