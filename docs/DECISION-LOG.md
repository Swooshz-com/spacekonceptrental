# Decision Log

## 2026-05-26: Vercel/Next.js Direction

Decision: `website/` becomes the future Next.js app root deployed by Vercel.

Reason: the public site needs a first-party app and API boundary instead of a
static direct-n8n demo architecture.

## 2026-05-26: Supabase System Of Record

Decision: Supabase becomes the system of record for products, quote requests,
conversations, messages, auth, storage, RLS, and tenant-ready boundaries.

Reason: the future site and SaaS chatbot need durable business data outside
n8n and Google Sheets.

## 2026-05-26: n8n Temporary Provider

Decision: n8n remains a temporary server-side chat provider and automation
integration layer.

Reason: the existing workflow can support Phase 1 while the app owns the public
API boundary.

## 2026-05-26: Custom Chat UI And `/api/chat`

Decision: long-term production chat uses custom UI that calls first-party
`POST /api/chat`.

Reason: the browser must not depend on n8n webhooks or the n8n chat widget.

## 2026-05-26: Provider Adapter Pattern

Decision: use a server-only `ChatProvider` interface with `N8nChatProvider` now
and `InternalSaasChatProvider` later.

Reason: provider swap should not require a frontend rewrite.

## 2026-05-26: Phase 1 Narrowed Deliberately

Decision: Phase 1 is limited to Next.js scaffold, public page/catalogue shell,
custom chat UI, `/api/chat`, server-only provider boundary, `N8nChatProvider`,
safe errors, basic Supabase schema, and tests.

Reason: Phase 1 must not become a full SaaS/RAG/admin rebuild.

## 2026-05-26: No Direct Browser-to-n8n

Decision: browser-to-n8n direct calls are not part of the long-term app.

Reason: direct calls expose n8n as the runtime boundary and make future
migration harder.

## 2026-05-26: MVP Non-streaming

Decision: MVP chat is non-streaming.

Reason: the current workflow is non-streaming and streaming/SSE should not
become a Phase 1 frontend dependency.

## 2026-05-26: Deferred Work

Decision: full SaaS admin, RAG, internal chatbot runtime, vector DB,
streaming/SSE, billing, and public SaaS onboarding are deferred.

Reason: these belong to later phases and require separate approval.

## 2026-05-26: Local Chat Config Must Not Be Reused

Decision: `website/chat-config.js` must never be read, printed, copied,
migrated, committed, or used as source for the new app.

Reason: it is gitignored and may contain a local real webhook URL.

## 2026-05-26: Server-only Provider Selection

Decision: Phase 1 chat provider selection reads server-only `CHAT_PROVIDER`.
Unset, empty, and `n8n` use `N8nChatProvider`; unknown values fail through the
safe provider-unavailable `/api/chat` response.

Reason: provider selection must not create browser-visible n8n configuration or
revive the old static n8n chat path as a production route.

## 2026-05-27: Fail-closed Chat Rate-limit Fallback

Decision: public chat rate limiting uses `clientSessionId` for per-session
limits, a trusted client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER`
names a proxy/CDN-overwritten header, and a server-side fallback bucket when no
trusted client IP source is available.

Reason: user-supplied forwarding headers are spoofable, but relying only on
attacker-controlled `clientSessionId` lets callers bypass the public chat cap
by rotating sessions. The fallback bucket fails closed until deployment
configures a trusted client IP header.

## 2026-05-27: Local-only Supabase RLS Behaviour Tests

Decision: behavioural RLS and tenant-isolation coverage runs against a
throwaway local Docker database with fake fixtures and a minimal
Supabase-compatible auth role surface.

Reason: the project needs executable proof for the committed RLS policies
before runtime Supabase use, without linking to Supabase Cloud, adding
credentials, deploying, or introducing app-side Supabase wiring.

## 2026-05-27: Fake Catalogue Seed Fixtures

Decision: Phase 1F-D seed data is limited to reviewed fake/sample catalogue
fixtures under `supabase/seeds/`, validated with a Docker-only local database
harness.

Reason: the project needs deterministic sample catalogue rows for future local
checks while keeping production seeding, Supabase Cloud connection, runtime
Supabase wiring, catalogue DB reads, quote persistence, conversation/message
persistence, and deployment deferred.

## 2026-05-27: Server-only Supabase Runtime Wiring

Decision: Phase 1G-A adds a server-only Supabase JS wrapper under
`website/lib/supabase/` that reads only `SUPABASE_URL` and
`SUPABASE_ANON_KEY`, returns an explicit disabled result when missing, and is
covered by static tests that keep `@supabase/*` out of browser-facing code.

Reason: future server routes need a narrow Supabase foundation, but this phase
must not introduce browser clients, service-role keys, Supabase Cloud
connection, catalogue reads, persistence flows, deployment, or n8n workflow
changes.

## 2026-05-27: Server-only Published Catalogue Reads

Decision: Phase 1G-B adds a server-only public catalogue repository under
`website/lib/catalogue/` and wires public catalogue pages to read published
`categories`, published `products`, and image metadata for published products
when Supabase server env and trusted server-only `CATALOGUE_WORKSPACE_ID` are
configured.

Reason: public catalogue pages can now use the approved Supabase runtime
boundary without mixing workspace-owned catalogue rows or adding browser
Supabase code, service-role keys, writes, quote/chat/admin persistence,
Supabase Storage delivery, deployment, or live Supabase Cloud validation.

## 2026-05-27: Defer Direct Anonymous Catalogue RLS Hardening

Decision: direct anonymous RLS access to published `categories`, `products`,
and `product_images` remains available for the server-side anon-key catalogue
runtime in Phase 1H-A. Runtime catalogue queries must still use trusted
server-only `CATALOGUE_WORKSPACE_ID` filters. Direct anonymous RLS hardening is
deferred until a trusted active-workspace read strategy exists.

Reason: disabling direct anonymous catalogue reads while the runtime still uses
the anon key would make configured DB-backed catalogue reads return empty rows.
A future hardening phase needs a strategy that avoids broad direct reads
without service-role keys or browser Supabase code.

## 2026-05-27: First-party Quote Request Persistence

Decision: Phase 1H-A adds `POST /api/quote`, a server-only quote repository,
bounded quote request validation, and narrow Supabase insert policies for
`quote_requests` and freeform `quote_request_items`.

Reason: quote persistence gives immediate MVP lead-capture value while keeping
product/admin persistence, conversation/message persistence, browser Supabase
clients, service-role keys, deployment, and n8n workflow changes out of scope.
The quote request row is the durable lead-capture boundary for this phase; if
freeform item insertion fails after the quote row is captured, the public
request is still treated as received and atomic quote/item writes remain
deferred.

## 2026-05-27: Chat Persistence Design Before Writes

Decision: Phase 1I-A documents the future chat persistence privacy/security
boundary and adds only disabled server-only scaffolding under
`website/lib/chat/persistence/`.

Reason: `conversations` and `messages` are privacy-sensitive and need trusted
server-side workspace resolution, first-party route boundaries, idempotency
rules, and PII minimization before any real writes are approved. This phase
does not add conversation/message persistence, Supabase reads or writes,
migrations, service-role keys, browser Supabase code, Supabase Cloud
connection, n8n workflow changes, RAG/vector DB, streaming/SSE, admin chat
history tools, or authenticated user-linked conversations.

## 2026-05-27: Product/Admin Persistence Design Before Writes

Decision: Phase 1J-A documents the future product/admin persistence boundary
and adds only disabled server-only scaffolding under
`website/lib/products/persistence/`.

Reason: category, product, and product image writes are trusted-admin
operations that need auth, membership-scoped workspace resolution, first-party
server routes/actions, media strategy, and audit/publishing decisions before
real writes are approved. This phase does not add product/category/product
image persistence, public mutation routes, admin/auth UI, Supabase reads or
writes, migrations, service-role keys, browser Supabase code, Supabase Storage,
product image upload flows, Supabase Cloud connection, deployment, or n8n
workflow changes.

## 2026-05-27: Quote Endpoint Abuse Throttling

Decision: Phase 1K-A adds best-effort in-process abuse throttling to
`POST /api/quote` before quote persistence writes.

Reason: the public unauthenticated quote route intentionally accepts bounded
website quote submissions, but repeated valid submissions can pollute quote
data and consume Supabase write quota. The route now uses bounded in-memory
client and normalized-email buckets, trusts forwarding headers only when
`QUOTE_TRUSTED_CLIENT_IP_HEADER` is configured to an approved proxy/CDN
header, falls back to a shared fail-closed bucket otherwise, and returns safe
generic `429` responses with `retry-after`. This phase does not change quote
table schema, quote persistence semantics, Supabase RLS policies, direct
anonymous catalogue RLS, browser Supabase code, service-role keys, deployment,
external anti-abuse services, or n8n workflows.

## 2026-05-27: Catalogue RLS Hardening Strategy First

Decision: Phase 1L-A documents the trusted active-workspace catalogue RLS
hardening strategy and adds static proof guards, but does not tighten direct
anonymous catalogue RLS yet.

Reason: current DB-backed catalogue reads still use the anon Supabase key from
a server-only runtime and must keep returning rows for trusted
`CATALOGUE_WORKSPACE_ID`. Removing anonymous catalogue `select` policies before
a trusted active-workspace read surface is proven would break configured
catalogue pages. The future hardening path must deny cross-workspace direct
anonymous catalogue reads without adding service-role keys, browser Supabase
clients, client-provided workspace IDs, deployment changes, Supabase Cloud
connection, or n8n workflow changes.

## 2026-05-27: Trusted Active-Workspace Catalogue Read Surface

Decision: Phase 1M-A adds `catalogue_public_workspace_config` and the
server-only `get_public_catalogue(expected_workspace_id, product_slug)` RPC,
then tightens direct anonymous base-table catalogue select policies with
`alter policy ... using (false)`.

Reason: DB-backed public catalogue pages need to keep working through the
anon-key server runtime for trusted `CATALOGUE_WORKSPACE_ID`, but direct
anonymous callers must not be able to query published catalogue base tables
across workspaces. The RPC validates the server-configured expected workspace
against database-owned active workspace state, uses no service-role key, keeps
Supabase out of browser-facing code, and is covered by local behavioural RLS
tests.

## 2026-05-27: Active Catalogue Workspace Bootstrap Plan

Decision: Phase 1N-A documents `catalogue_public_workspace_config` as
deployment/database-owned configuration and adds a docs-only SQL example for a
future approved operator to set the active public catalogue workspace.

Reason: Phase 1M-A made DB-backed catalogue reads depend on a database-owned
active workspace config row. The project needs a reviewed bootstrap path before
real environments enable DB-backed public catalogue reads, while keeping
Supabase Cloud connection, deployment, production seed data, service-role
runtime writes, browser Supabase code, catalogue writes, quote throttling
changes, and n8n workflow changes deferred.

## 2026-05-27: Deployment Environment Readiness Before Deployment

Decision: Phase 1O-A documents the future server-only environment contract and
forbidden public variables before any Vercel deployment or Supabase Cloud
connection is approved.

Reason: the project now has server-only Supabase, catalogue, quote, chat, and
trusted proxy header paths that will need deployment configuration later. The
required env names, safe missing-env behaviour, and preflight checks should be
explicit before real secrets, deployment config, browser Supabase, service-role
runtime paths, production seed data, or live external systems are introduced.

## 2026-05-27: Phase 1 Closeout Before Phase 2 Runtime Work

Decision: Phase 1P-A adds a closeout audit and Phase 2 readiness plan without
adding runtime features.

Reason: the repo now has enough local foundation, server-only boundaries,
Supabase schema/RLS proof, catalogue/quote runtime paths, and safety guards
that future work should start from an explicit decision gate. Product writes,
conversation/message persistence, Supabase Storage, deployment, Supabase Cloud
connection, admin/auth UI, service-role runtime paths, browser Supabase, and
internal RAG remain deferred until separately approved.

## 2026-05-27: Deployment Smoke-Test Runbook Before Deployment

Decision: Phase 2A-A adds a deployment smoke-test runbook, unchecked operator
checklist, and deployment evidence template before any real deployment work is
approved.

Reason: the first Phase 2 deployment track needs an operator-facing way to
review server-only env placement, forbidden public variables, active catalogue
workspace config, quote workspace config, server-only n8n webhook handling,
trusted proxy headers, smoke-test evidence, rollback, and monitoring before
Vercel or Supabase Cloud work begins. This phase does not deploy, connect to
Supabase Cloud, add Vercel config, add real env values, add service-role
runtime paths, add browser Supabase, add runtime features, change catalogue
RLS/runtime behaviour, change quote throttling, add product/category/product
image writes, add conversation/message writes, or change n8n workflows.

## 2026-05-27: Admin/Auth Membership Design Before Product Writes

Decision: Phase 2B-A adds the admin/auth and workspace membership
authorization design plus an unchecked implementation checklist before any
product-management writes are approved.

Reason: category, product, and product image mutations need a reviewed
authenticated admin identity, active workspace membership, role model,
server-side workspace resolution, route/action boundary, audit expectations,
and RLS test plan before runtime writes exist. This phase does not implement
auth, add admin UI, add product/category/product image writes, add public
mutation routes, add browser Supabase, add service-role runtime paths, deploy,
connect to Supabase Cloud, change catalogue RLS/runtime behaviour, change quote
throttling, add conversation/message writes, or change n8n workflows.

## 2026-05-27: Server-only Admin Authorization Policy Boundary

Decision: Phase 2B-B adds a pure server-only admin authorization policy module
and tests that model future admin identity, active admin profile, active
workspace membership, role, workspace, and operation decisions from explicit
inputs only.

Reason: future product-management routes or server actions need a small,
testable policy boundary before real auth and membership resolution are wired
to runtime code. This phase does not implement real auth, add Supabase Auth
runtime wiring, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add service-role runtime paths,
add browser Supabase, deploy, connect to Supabase Cloud, change catalogue
RLS/runtime behaviour, change quote throttling, add conversation/message
writes, or change n8n workflows.

## 2026-05-27: Disabled Admin Auth Membership Resolver Contract

Decision: Phase 2B-C adds a server-only admin auth/membership resolver contract
and disabled scaffold that defines how future server-side auth and membership
resolution should produce inputs for the existing admin authorization policy.

Reason: future runtime admin routes or server actions need a clear boundary between
auth identity resolution, admin profile lookup, workspace membership
resolution, policy input construction, and policy decision output before real
auth is implemented. This phase returns `auth_resolver_disabled` by default and
does not implement real auth, add Supabase Auth runtime wiring, add
login/logout routes, add protected admin pages, add admin UI, add runtime
routes/pages/server actions, add product/category/product image writes, add
service-role runtime paths, add browser Supabase, deploy, connect to Supabase
Cloud, change catalogue RLS/runtime behaviour, change quote throttling, add
conversation/message writes, or change n8n workflows.

## 2026-05-28: Dependency-injected Admin Auth Adapter Boundary

Decision: Phase 2B-D adds server-only admin auth/membership adapter contracts
and a dependency-injected resolver path that can build policy input through
explicit fake/test adapters only.

Reason: future runtime admin boundaries need named contracts for authenticated
identity lookup, admin profile lookup, workspace resolution, and membership
lookup before real auth or database resolution is implemented. This phase does
not implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, add
runtime routes/pages/server actions, add product/category/product image writes,
add service-role runtime paths, add browser Supabase, deploy, connect to
Supabase Cloud, change catalogue RLS/runtime behaviour, change quote
throttling, add conversation/message writes, or change n8n workflows.
