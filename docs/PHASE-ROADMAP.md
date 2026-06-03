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
design/scaffolding, furniture listing/admin persistence design/scaffolding, trusted
active-workspace catalogue RLS hardening proof, deployment environment
readiness, Phase 1 closeout audit, Phase 2 readiness plan, and a basic
Supabase core schema.

Checklist: `docs/checklists/PHASE-1-MVP.md`

Phase 1 is not the full SaaS platform, full RAG system, full admin inbox, vector
stack, billing system, or streaming implementation.

## Phase 2: Deployment, Admin, Furniture Listing, And Quote Operations

Goal: prepare reviewed deployment operations and expand operational admin tools for furniture listings and enquiries
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

Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted
workspace dependency through the existing approved dependency path. It prevents
the route from failing closed unconditionally due to a missing expected
server-resolved workspace ID. It relies on the environment via
`process.env.ADMIN_TRUSTED_WORKSPACE_ID`. It remains fail-closed and does not
add any routes, pages, server actions, admin UI, product writes, login/logout
routes, protected admin pages, Storage, deployment, Supabase Cloud, browser
Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS
chatbot app work, or `website/chat-config.js` access.

Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary. It documents that a future first-party server-only CSRF proof issuer route needs a dedicated route-gate operation model (likely `admin.csrf.issue`) before implementation. The current request preflight requires state-changing operations to be `POST` and to already include a valid CSRF proof, so the issuer route must not route-gate itself as a state-changing operation (like `product.write`), nor use only `admin.auth.check` as a loose substitute for write-operation authorisation. The future route must remain server-only, use the approved route-gate path, and not call lower-level auth/security boundaries directly except the approved CSRF proof issuer boundary. It must not issue proofs for unsupported operations, nor expose CSRF secrets, verifier internals, signer internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, membership internals, workspace internals, or stack traces. Phase 2B-AD does not implement the actual route, approve or implement product/category/product image writes by itself, add admin UI, protected admin pages, login/logout routes, Storage, deployment config, Supabase Cloud connection, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

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

Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary. It does not implement the actual CSRF proof issuer route.

Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary. It resolves a binding only from existing Phase 2B server-only session, profile, membership, and trusted workspace boundaries, requires an explicitly injected opaque binding deriver, and keeps the actual issuer route deferred.

Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary. It derives an opaque binding from canonical requested operation, auth user ID, admin user ID, trusted workspace ID, and membership role inputs using the existing server-only `ADMIN_CSRF_PROOF_SECRET` and Node crypto. It does not implement the actual issuer route, add route/page/server-action usage, add a replay store, approve product/category/product image writes, add admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route at `website/app/api/admin/csrf-proof/route.ts`. The route accepts only `POST`, rejects missing or malformed JSON, rejects missing, unsupported, and non-state-changing target operations, gates itself with the approved `admin.csrf.issue` route-gate lane, resolves the target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime dependencies, and returns only safe JSON success or failure shapes. It issues proofs only for `product.write`, `category.write`, `productImage.write`, `quote.write`, and `membership.manage`. Phase 2B-AK does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AL implements the first backend-only admin product-management write surface. It adds session-bound product/category/product image metadata persistence under `website/lib/products/persistence/`, owner/admin RLS write policies and product-management audit inserts, and protected first-party admin routes under `website/app/api/admin/` for category, product, and product-image metadata mutations. The routes require the approved route-gate stack, a matching CSRF proof for `category.write`, `product.write`, or `productImage.write`, `ADMIN_TRUSTED_WORKSPACE_ID`, safe JSON validation, and no-store responses. Phase 2B-AL does not add admin UI, login/logout, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AN implements only a minimal first-party admin login page,
server-owned Supabase Auth login/logout routes, and a protected admin shell.
The protected shell uses the existing route-gate path with
`admin.shell.access`, allowing owner/admin membership and denying viewer
membership. Phase 2B-AN does not add product-management UI,
product/category/product-image write forms, server actions, binary uploads,
Supabase Storage, browser Supabase, service-role runtime paths, deployment
config, Supabase Cloud, n8n changes, Pinecone runtime code, SaaS chatbot work,
or access `website/chat-config.js`.

Phase 2B-AQ pivots current product direction to an admin-managed furniture/event-rental listing catalogue plus customer enquiry/quote request system. It is docs/status/checklist and safe-copy work only. It does not rename existing `products`, `categories`, or `product_images` tables/routes/helpers, add listing write UI, uploads, Storage, browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, carts, checkout, payments, stock reservation, order fulfilment, online ordering, or access `website/chat-config.js`.

Phase 2B-AR fixes only the protected admin shell GET missing-Origin handling
inside the existing server-only route-gate path. Safe read-only `GET`/`HEAD`
operations may proceed without Origin only when Host matches the trusted
expected host, while present Origin metadata remains strictly validated.
`admin.csrf.issue` and state-changing writes still require strict Origin/Host
validation, POST, and the existing CSRF proof requirements for writes. Phase
2B-AR does not add listing CRUD UI, listing uploads, Storage, browser Supabase,
service-role runtime paths, deployment config, n8n changes, Pinecone runtime
code, SaaS chatbot work, SQL migrations, or access `website/chat-config.js`.

Phase 2B-AS adds only metadata admin furniture listing management UI inside
the existing protected admin shell. It uses the existing Phase 2B-AL/AM
product internals and protected `product.write` backend routes for create,
update, publish/unpublish via status updates, and archive. The browser UI
requests a first-party CSRF proof and sends `x-csrf-proof` on write requests.
It does not add listing image upload, Supabase Storage, public catalogue
redesign, enquiry forms, DB/API/table/RPC/RLS renames, SQL migrations,
browser Supabase, service-role runtime paths, deployment config, n8n changes,
Pinecone runtime code, SaaS chatbot work, cart, checkout, payments, customer
accounts, stock reservation, order fulfilment, online ordering, or access
`website/chat-config.js`.

Phase 2B-AT adds only public furniture catalogue and listing detail UX polish.
The public catalogue and listing detail pages keep the existing
`getPublicCatalogue()` and `getPublicProductBySlug()` read paths, update
visible copy to reflect furniture/event-rental listings, keep safe fallback
behavior when env/catalogue data is unavailable, and add a clean empty-state
view when no public listings are available.

Phase 2B-AT does not add listing image upload/storage, image metadata admin
UI, enquiry form implementation, DB/API/table/RPC/RLS renames, SQL migrations,
browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone
runtime code, SaaS chatbot work, or ecommerce flows such as carts,
checkout, payments, customer accounts, stock reservation, order fulfilment,
or online ordering.

Phase 2B-AU adds only public events and quote copy polish. The public events
page removes shell/MVP wording and uses normal event-rental, furniture-rental,
styled-setup, enquiry, and quote-request language. The quote page and site
metadata remain quote-request oriented without implying checkout, payment,
online ordering, stock reservation, confirmed booking, or fulfilment.

Phase 2B-AU does not add enquiry form implementation beyond the existing quote
request form, admin changes, image upload, Supabase Storage, SQL migrations,
DB/API/table/RPC/RLS renames, browser Supabase, service-role runtime paths,
deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, or
ecommerce flows such as carts, checkout, payments, customer accounts, stock
reservation, order fulfilment, or online ordering.

Phase 2B-AV adds only narrow anti-framing response headers for the protected
admin UI. `website/next.config.mjs` applies
`Content-Security-Policy: frame-ancestors 'none'` and
`X-Frame-Options: DENY` to `/admin` and nested admin UI routes. This is a
low-severity clickjacking hardening fix: SameSite=Lax auth cookies may reduce
arbitrary off-site exploitability, but anti-framing headers close the missing
browser-side defence.

Phase 2B-AV does not add or change admin UI features, admin auth, CSRF,
Origin/Host checks, Supabase SSR cookie handling, product/category write route
logic, SQL migrations, DB/API/table/RPC/RLS names, browser Supabase,
service-role runtime paths, image upload, Supabase Storage, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, ecommerce flows, or access
`website/chat-config.js`.

Phase 2B-AW adds only a read-only admin quote request inbox inside the
protected admin shell. It uses a server-only, session-bound admin read client
and trusted admin workspace configuration to load recent quote requests and
requested item snapshots from `quote_requests` and `quote_request_items`.
Authorised admins can review recent quote request details, but cannot update
status, send notifications, assign follow-up, sync to CRM, confirm bookings,
or create orders from this phase.

Phase 2B-AW does not add quote status writes, notifications, CRM integration,
customer accounts, ordering, checkout, payments, fulfilment, stock reservation,
confirmed booking, SQL migrations, DB/API/table/RPC/RLS renames, browser
Supabase, service-role runtime paths, image upload, Supabase Storage,
n8n/Pinecone runtime behavior, SaaS chatbot runtime work, ecommerce flows, or
access `website/chat-config.js`.

Phase 2B-AX adds only admin quote request status updates from the protected
admin quote request inbox. It introduces the quote-specific `quote.write`
admin operation, permits it for owner/admin memberships only, adds it to the
CSRF proof target operation set, and uses a first-party server-only route at
`POST /api/admin/quote-requests/[quoteRequestId]/status` to accept only
`{ status }` payloads for existing quote requests. The server-side write
boundary updates only `quote_requests.status` for the trusted admin workspace
and returns generic failure results.

Phase 2B-AX does not add public quote status pages, customer-facing quote
tracking, notifications, CRM integration, internal notes, assignment,
customer accounts, cart, checkout, payments, stock reservation, fulfilment,
confirmed booking, online ordering, image upload, Supabase Storage, SQL
migrations, DB/API/table/RPC/RLS renames, browser Supabase, service-role
runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot runtime work,
ecommerce flows, or access `website/chat-config.js`.

Phase 2B-AY adds only metadata listing image management UI inside the existing
protected admin shell. It reuses the existing protected product-image metadata
backend routes and `productImage.write` CSRF operation for create, update, and
archive actions. The browser UI sends only JSON metadata fields and
`x-csrf-proof`; the server-only dashboard read boundary includes editable
image metadata scoped to `ADMIN_TRUSTED_WORKSPACE_ID`.

Phase 2B-AY does not add binary image upload, file inputs,
multipart/form-data, Supabase Storage bucket creation or API calls, public
image upload or management routes, DB/API/table/RPC/RLS renames, SQL
migrations, browser Supabase, service-role runtime paths, notifications, CRM
integration, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, access
to `website/chat-config.js`, or ecommerce flows such as carts, checkout,
payments, customer accounts, stock reservation, fulfilment, confirmed booking,
or online ordering.

Phase 2C-A adds storage-backed listing media upload and public image rendering.
Authorised owner/admin users may upload approved listing image files from the
protected admin shell. The existing `POST /api/admin/product-images` route
keeps JSON metadata creation unchanged and handles multipart uploads through a
server-only branch that requires `productImage.write`, same-origin Origin/Host
validation, a valid CSRF proof, trusted workspace resolution, a session-bound
authenticated Supabase client, safe MIME/size/filename validation, and
server-generated `listing-media` storage paths. Public catalogue and listing
detail pages render real listing image URLs from approved metadata and keep
fallback images when media is missing or unavailable.

Phase 2C-A approves only admin-controlled listing media upload and public
rendering. It does not add customer uploads, arbitrary public upload routes,
browser Supabase, service-role runtime paths, DB/API/table/RPC/RLS renames,
notifications, CRM integration, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, access to `website/chat-config.js`, or ecommerce flows such as
carts, checkout, payments, customer accounts, stock reservation, fulfilment,
confirmed booking, or online ordering.
