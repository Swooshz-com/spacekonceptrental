# Phase Roadmap

## Roadmap Rules

Phase 0 and Phase 1 are active or near-term. Phase 2 and later are future
guardrails only and are not approval to implement those phases now.

Any phase change must update this roadmap, the relevant checklist, the ADR or
decision log, and safety docs in the same PR.

For the current quick status, see `docs/PHASE-STATUS.md`. For checklist
ownership and maintenance rules, see `docs/checklists/README.md`.

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

Future auth implementation checklist:
`docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md`

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

Phase 2B-F adds checklist hygiene and phase status reconciliation only. It is
not approval to implement real auth, add Supabase Auth runtime wiring, read
cookies, read headers, add login/logout routes, add protected admin pages, add
admin UI, wire runtime routes/pages/server actions, add product/category/product
image writes, add service-role runtime paths, add browser Supabase, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code, or add
SaaS chatbot app code.

Phase 2B-G refreshes repo agent instructions and static guard coverage only.
It is not approval to implement real auth, add Supabase Auth runtime wiring,
read cookies, read headers, add login/logout routes, add protected admin
pages, add admin UI, wire runtime routes/pages/server actions, add
product/category/product image writes, add service-role runtime paths, add
browser Supabase, deploy, connect Supabase Cloud, change n8n workflows, add
Pinecone runtime code, or add SaaS chatbot app code.

Phase 2B-H strengthens the reviewed server-side admin auth/membership
resolution boundary with dependency-injected fake adapters and safe
allow/deny tests only. It is not approval to implement real auth, add Supabase
Auth runtime wiring, read cookies, read headers, add login/logout routes, add
protected admin pages, add admin UI, wire runtime routes/pages/server actions,
add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone, or
add SaaS chatbot app code.

Phase 2B-I cleans admin auth implementation gate wording and refines
runtime-readiness checklist/static guard wording only. It is not approval to
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI,
wire runtime routes/pages/server actions, add product/category/product image
writes, add Supabase Storage, add service-role runtime paths, add browser
Supabase, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, migrate Pinecone, or add SaaS chatbot app code.

Phase 2B-J approves the future server-only Supabase Auth runtime lane and
auth implementation approval/test gates only. It is not approval to implement
real auth, add Supabase Auth runtime wiring, read cookies, read headers, add
login/logout routes, add protected admin pages, add admin UI, wire runtime
routes/pages/server actions, add product/category/product image writes, add
Supabase Storage, add service-role runtime paths, add browser Supabase,
deploy, connect Supabase Cloud, change n8n workflows, add Pinecone runtime
code, migrate Pinecone, or add SaaS chatbot app code.

Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary
needed for future admin auth. Cookie reads, `@supabase/ssr`, and Supabase Auth
server calls are allowed only inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`.
It is not approval to wire the resolver or adapters into runtime routes, pages,
or server actions, read headers, add login/logout routes, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, add service-role runtime paths, add browser Supabase, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
Pinecone, or add SaaS chatbot app code.

Phase 2B-L adds only the server-only Supabase-backed admin profile and membership read boundary
needed for future admin auth. `admin_users` and `memberships` reads are allowed only inside
`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`.
It requires an explicitly injected authenticated admin-read client and does not
default to the plain anon-key Supabase helper. Live authenticated read-client
wiring remains deferred. It is not approval to wire the resolver or adapters
into runtime routes, pages, or server actions, read cookies outside the Phase
2B-K identity boundary, call Supabase Auth outside the Phase 2B-K identity
boundary, read headers, add login/logout routes, add protected admin pages,
add admin UI, add product/category/product image writes, add Supabase Storage,
add service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-M adds only the server-only admin workspace resolution boundary
needed for future admin auth. Admin workspace resolution is allowed only inside
`website/lib/admin/authorization/server-admin-workspace-resolver.ts`. It
implements the existing `AdminWorkspaceResolver` contract, requires an
explicitly injected trusted server-side workspace ID, treats
browser/request workspace IDs as validation-only, fails closed for missing,
empty, whitespace-only, or mismatched values, and does not use public catalogue
workspace config as an admin authorization shortcut. It is not approval to wire
the resolver or adapters into runtime routes, pages, or server actions, read
cookies outside the Phase 2B-K identity boundary, call Supabase Auth outside
the Phase 2B-K identity boundary, read `admin_users` or `memberships` outside
the Phase 2B-L profile/membership boundary, read headers, add login/logout
routes, add protected admin pages, add admin UI, add product/category/product
image writes, add Supabase Storage, add service-role runtime paths, add
browser Supabase, deploy, connect Supabase Cloud, change n8n workflows, add
Pinecone runtime code, migrate Pinecone, access `website/chat-config.js`, or
add SaaS chatbot app code.

Phase 2B-N adds only the server-only session-bound admin read-client factory
needed for future Phase 2B-L profile/membership reads. The factory is allowed
only inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
because that module remains the reviewed Phase 2B-K server-only cookie and
Supabase Auth boundary. It reuses the reviewed server-only Supabase URL, anon
key, and request-cookie path to create a session-bound Supabase SSR client and
returns the Phase 2B-L `SupabaseAdminReadClientResult` dependency shape. It
fails closed when server env is missing, cookie reads fail, client creation
fails, or no explicit session-bound client can be created. It is not approval
to query `admin_users` or `memberships` outside the Phase 2B-L boundary, wire
the client into runtime routes, pages, or server actions, add login/logout
routes, add protected admin pages, add admin UI, add product/category/product
image writes, add Supabase Storage, add service-role runtime paths, add
browser Supabase, read headers, deploy, connect Supabase Cloud, change n8n
workflows, add Pinecone runtime code, migrate Pinecone, access
`website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-O adds only the server-only admin authorization adapter-set composition boundary
needed for future admin auth runtime wiring. The
composition boundary is allowed only inside
`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
It assembles the existing `AdminAuthAdapter`, `AdminProfileAdapter`,
`AdminMembershipAdapter`, and `AdminWorkspaceResolver` contracts by composing
the reviewed Phase 2B-K/N identity/read-client boundary, Phase 2B-L
profile/membership boundary, and Phase 2B-M trusted workspace resolver. It
fails closed when the session-bound admin read client or trusted server-side
workspace input cannot be assembled. It is not approval to use the adapter set
from runtime routes, pages, or server actions, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, read cookies or call Supabase
Auth outside the Phase 2B-K boundary, resolve workspace scope outside the Phase
2B-M boundary, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, read headers, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code,
migrate Pinecone, access `website/chat-config.js`, or add SaaS chatbot app
code.

Phase 2B-P adds only the server-only composed admin authorization decision boundary
needed for future admin auth runtime wiring. The decision boundary is allowed
only inside
`website/lib/admin/authorization/server-admin-authorization-decision.ts`. It
creates the Phase 2B-O adapter set and calls the existing
`resolveAdminAuthorizationWithAdapters()` decision function without
duplicating policy logic. It fails closed when adapter-set composition,
session-bound admin read-client creation, trusted workspace input, or provider
dependencies are unavailable. It is not approval to use the decision boundary
from runtime routes, pages, or server actions, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, read cookies or call Supabase
Auth outside the Phase 2B-K boundary, resolve workspace scope outside the Phase
2B-M boundary, compose adapter sets outside the Phase 2B-O boundary, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, read headers, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-Q adds only the server-only admin request security preflight boundary
needed for future state-changing admin routes and server actions. The
preflight boundary is allowed only inside
`website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
It validates only explicitly injected request metadata and optional injected
CSRF verifier results; it does not read real request headers. It treats
request/browser supplied fields as untrusted validation inputs, requires
same-origin Origin/Host metadata, requires POST and a valid injected CSRF
proof for state-changing admin operations, permits safe read-only
`catalogue.read` requests without CSRF proof, and fails closed for missing,
invalid, stale, replayed, mismatched, or unsupported inputs. It is not
approval to use the preflight boundary from runtime routes, pages, or server
actions, read headers, read cookies outside the Phase 2B-K boundary, call
Supabase Auth outside the Phase 2B-K boundary, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, resolve workspace scope outside
the Phase 2B-M boundary, compose adapter sets outside the Phase 2B-O boundary,
call the composed decision boundary outside the Phase 2B-P boundary, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, deploy, connect Supabase Cloud, change
n8n workflows, add Pinecone runtime code, migrate Pinecone, access
`website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-R adds only the server-only CSRF proof verifier boundary needed for
future injection into the Phase 2B-Q request security preflight validator. The
CSRF verifier boundary is allowed only inside
`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
validates only explicitly injected proof material, expected session binding,
expected nonce, timestamps, and dependency-injected signature or replay checks.
It may parse a simple structured `base64url(JSON payload).base64url(signature)`
proof and return only Phase 2B-Q-compatible safe verifier results. It does not
issue CSRF tokens, read headers, read cookies, read env, call Supabase, store
replay state except through an injected dependency, or wire itself into the
Phase 2B-Q preflight boundary outside isolated unit tests. It is not approval
to use the verifier from runtime routes, pages, or server actions, read
headers, read cookies outside the Phase 2B-K boundary, call Supabase Auth
outside the Phase 2B-K boundary, query `admin_users` or `memberships` outside
the Phase 2B-L boundary, resolve workspace scope outside the Phase 2B-M
boundary, compose adapter sets outside the Phase 2B-O boundary, call the
composed decision boundary outside the Phase 2B-P boundary, use the preflight
boundary from runtime routes/pages/actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image
writes, add Supabase Storage, add service-role runtime paths, add browser
Supabase, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, migrate Pinecone, access `website/chat-config.js`, or add SaaS
chatbot app code.

Phase 2B-S adds only the server-only CSRF proof issuer boundary needed for
future state-changing admin routes and server actions. The CSRF issuer
boundary is allowed only inside
`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It
issues verifier-compatible structured
`base64url(JSON payload).base64url(signature)` proofs only from explicitly
injected operation, session binding, nonce or nonce generator, issued-at and
expiry timestamps, and a dependency-injected signature signer. It supports only
state-changing admin operations, fails closed for read-only or unsupported
operations, missing session binding, missing nonce, invalid timestamps,
missing signer, signer failure, or dependency failure, and returns only safe
issue results. It does not verify CSRF proofs, read headers, read cookies,
read env, call Supabase, store replay state, or wire itself into the Phase
2B-Q preflight boundary or Phase 2B-R verifier outside isolated unit tests. It
is not approval to use the issuer from runtime routes, pages, or server
actions, read headers, read cookies outside the Phase 2B-K boundary, call
Supabase Auth outside the Phase 2B-K boundary, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, resolve workspace scope outside
the Phase 2B-M boundary, compose adapter sets outside the Phase 2B-O boundary,
call the composed decision boundary outside the Phase 2B-P boundary, use the
preflight boundary from runtime routes/pages/actions, use the verifier from
runtime routes/pages/actions, add login/logout routes, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, add service-role runtime paths, add browser Supabase, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
Pinecone, access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-T adds only the server-only admin authorization gate composition boundary
needed for future admin routes and server actions. The gate boundary is
allowed only inside
`website/lib/admin/authorization/server-admin-authorization-gate.ts`. It runs
the Phase 2B-Q request security preflight before the Phase 2B-P composed
admin authorization decision, may inject the Phase 2B-R CSRF proof verifier
into preflight when verifier dependencies are supplied, and returns safe
allow, deny, or unavailable shapes. It does not issue CSRF proofs, read real
headers, read cookies, read env, call Supabase, query `admin_users` or
`memberships`, create a session-bound admin read client, compose adapter sets
directly, duplicate admin role/membership policy logic, add route/page/server
action wiring, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.
Phase 2B-U adds only the admin runtime wiring approval lane for future use of
the Phase 2B-T server-only admin authorization gate. This phase is docs and
checklists only. It approves a future first runtime integration boundary
limited to first-party server-only route handlers or server actions, with real
request header reads allowed only inside a future reviewed server-only request
metadata adapter. That future adapter must pass explicit request metadata into
`resolveServerAdminAuthorizationGate()`, preserve preflight-before-decision
ordering, keep Supabase Auth cookie reads only inside the Phase 2B-K identity
boundary, keep `admin_users` and `memberships` reads only inside the Phase
2B-L profile/membership boundary, keep workspace resolution only inside the
Phase 2B-M workspace resolver, keep CSRF proof issuance and verification
inside the Phase 2B-S and Phase 2B-R boundaries, and return generic errors
without provider internals. It is not approval to add runtime route handlers,
pages, server actions, header reads, login/logout routes, protected admin
pages, admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, Supabase Cloud, deployment,
real env values, n8n workflow changes, Pinecone runtime code, or
`website/chat-config.js` access.

Phase 2B-V adds only the server-only admin request metadata adapter boundary
for future admin gate usage. The adapter is allowed only inside
`website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.
It may import `next/headers` and call `headers()` only there, reads only
minimal untrusted request metadata, requires trusted expected origin and host
inputs through dependency injection, and returns safe explicit metadata for a
future call to `resolveServerAdminAuthorizationGate()`. It does not call the
gate, preflight, decision boundary, CSRF verifier, CSRF issuer, adapter-set
composition, Supabase, or product write logic. Creating this adapter is not
approval to add runtime route handlers, pages, server actions, login/logout
routes, protected admin pages, admin UI, product/category/product image writes,
Supabase Storage, service-role runtime paths, browser Supabase, Supabase Cloud,
deployment, real env values, n8n workflow changes, Pinecone runtime code, or
`website/chat-config.js` access.

Phase 2B-W adds only the server-only admin runtime gate invocation boundary
for future admin routes, pages, or server actions. The invocation boundary is
allowed only inside
`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.
It composes the Phase 2B-V request metadata adapter and the Phase 2B-T admin
authorization gate, accepts trusted expected origin and host inputs through
explicit dependency/config injection, and returns the existing safe gate result
shape. It does not import `next/headers`, read headers directly, read cookies,
read env, call Supabase, query `admin_users` or `memberships`, duplicate
preflight/CSRF/policy logic, issue CSRF proofs, add runtime route/page/server
action usage, add login/logout routes, add protected admin pages, add admin UI,
add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, or access
`website/chat-config.js`.

Phase 2B-X adds only the admin runtime gate invocation usage approval lane.
It approves a future first-party server-only route handler or server action
lane for calling `resolveServerAdminRuntimeGateInvocation()` through the Phase
2B-W helper only. Header reads must remain inside Phase 2B-V, cookie reads and
Supabase Auth calls inside Phase 2B-K/N, `admin_users` and `memberships` reads
inside Phase 2B-L, workspace resolution inside Phase 2B-M, adapter-set
composition inside Phase 2B-O, decision logic inside Phase 2B-P,
request-security preflight inside Phase 2B-Q / Phase 2B-T, CSRF verification
inside Phase 2B-R / Phase 2B-T, and CSRF issuance inside Phase 2B-S. It is
not approval to add runtime route handlers, pages, server actions, helper
usage, login/logout routes, protected admin pages, admin UI,
product/category/product image writes, Supabase Storage, service-role runtime
paths, browser Supabase, Supabase Cloud, deployment, real env values, n8n
workflow changes, Pinecone runtime code, SaaS chatbot app code, or
`website/chat-config.js` access.
Phase 2B-Y adds only the server-only admin runtime route gate adapter boundary.
The adapter is allowed only inside
`website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`.
It accepts explicit requested operation/workspace inputs, trusted expected
origin and host dependencies, gate dependencies, and an explicit or minimal
request-like method, then calls only the Phase 2B-W
`resolveServerAdminRuntimeGateInvocation()` helper. It does not read headers,
read cookies, read env, call lower-level auth/security boundaries directly,
add route handlers, pages, server actions, login/logout routes, protected admin
pages, admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, Supabase Cloud, deployment, real
env values, n8n workflow changes, Pinecone runtime code, SaaS chatbot app code,
or `website/chat-config.js` access.
Phase 2B-Z adds only the admin runtime route gate adapter usage approval lane.
It approves future first-party server-only route handlers or server actions to
call `resolveServerAdminRuntimeRouteGateAdapter()` only through the Phase 2B-Y
route gate adapter, while keeping actual route/page/server-action usage
deferred. It is not approval to add routes, pages, server actions,
login/logout, protected admin pages, admin UI, product writes, Storage,
deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n
changes, Pinecone runtime code, SaaS chatbot app work, or
`website/chat-config.js` access.

Phase 2B-AA adds the first admin runtime route gate adapter usage boundary.
It adds exactly one first-party server-only route handler at
`website/app/api/admin/auth-check/route.ts` as a harmless authorization probe
only. It is not approval to add other routes, pages, server actions,
login/logout, protected admin pages, admin UI, product writes, Storage,
deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n
changes, Pinecone runtime code, SaaS chatbot app work, or
`website/chat-config.js` access.

Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane.
It approves only the future first-party server-only lane for issuing CSRF
proof material needed by later state-changing admin operations. The future
route must remain server-only and must not bypass the Phase 2B-Y/AA
route-gate authorization path. The future route must not call lower-level
auth/security boundaries directly except the approved Phase 2B-S CSRF issuer
boundary. The future route must not expose CSRF secrets, verifier internals,
provider internals, raw headers, cookies, tokens, SQL/provider errors,
workspace internals, membership internals, or stack traces. The future route
must not approve product/category/product image writes by itself. It is not
approval to add routes, pages, server actions, login/logout, protected admin
pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser
Supabase, service-role runtime paths, n8n changes, Pinecone runtime code,
SaaS chatbot app work, or `website/chat-config.js` access.

Further Phase 2 implementation work remains unapproved until scoped in a
separate phase PR.

## Phase 3: SaaS Chatbot Boundary

Goal: decide the separate SaaS chatbot project/app boundary and how SKR can
later become its first client/tenant, without implementing SaaS chatbot code in
this repo yet.

Checklist: `docs/checklists/PHASE-3-INTERNAL-CHATBOT.md`

Current SKR may keep using the existing n8n/Pinecone chatbot workflow as a
temporary bridge. The browser must never call n8n directly.

This phase is not approved for implementation yet.

## Phase 4: RAG, Knowledge, And Vector Work

Goal: introduce knowledge source models, document ingestion, chunking,
embeddings, retrieval, and vector storage decisions.

Checklist: `docs/checklists/PHASE-4-RAG-KNOWLEDGE.md`

Do not migrate Pinecone in this repo yet. Pinecone/n8n remain current RAG
workflow context only.

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
