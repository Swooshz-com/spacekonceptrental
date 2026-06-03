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
bind the policy membership input to the active admin profile so a same-workspace
membership owned by another admin cannot authorize the actor. It does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, add
runtime routes/pages/server actions, add product/category/product image writes,
add service-role runtime paths, add browser Supabase, deploy, connect to
Supabase Cloud, change catalogue RLS/runtime behaviour, change quote
throttling, add conversation/message writes, or change n8n workflows.

## 2026-05-28: Admin Auth Provider And Session Design Before Runtime Auth

Decision: Phase 2B-E documents Supabase Auth as the preferred future
server-side admin auth provider and records the session/cookie, CSRF,
login/logout, protected admin page, adapter integration, and implementation
gates before any real auth runtime is added.

Reason: future auth wiring needs an explicit provider and session security
contract before cookies, headers, login/logout routes, protected admin pages,
or admin UI exist. This phase does not implement real auth, add Supabase Auth
runtime wiring, read cookies, read headers, add login/logout routes, add
protected admin pages, add admin UI, add runtime routes/pages/server actions,
add product/category/product image writes, add service-role runtime paths, add
browser Supabase, deploy, connect to Supabase Cloud, change catalogue
RLS/runtime behaviour, change quote throttling, add conversation/message
writes, or change n8n workflows.

## 2026-05-28: Checklist Hygiene And Current Phase Status

Decision: Phase 2B-F adds checklist maintenance rules, a quick phase status
page, reconciled checklist ownership/status, and static guard coverage only.

Reason: after the Phase 2B admin/auth design, policy, resolver, adapter, and
provider-session milestones, the repo needs checklists that stay truthful,
non-duplicative, and maintained along with development. This phase does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, wire
resolver/adapters into runtime routes/pages/server actions, add
product/category/product image writes, deploy, connect to Supabase Cloud,
change catalogue RLS/runtime behaviour, change quote throttling, add
conversation/message writes, change n8n workflows, add Pinecone runtime code,
migrate Pinecone, or add SaaS chatbot app code.

## 2026-05-28: Separate Future SaaS Chatbot Boundary

Decision: the current SKR repo may keep using the existing n8n/Pinecone chatbot
workflow as a temporary production bridge while the website stabilizes. The
future SaaS chatbot should be a separate project/app, and SKR can later become
its first client/tenant.

Reason: the current n8n/Pinecone workflow should remain current RAG workflow
context only, not be forced into the future SaaS architecture. This keeps the
Phase 2B-F PR limited to docs/status hygiene and avoids Pinecone migration,
Pinecone credentials, SaaS chatbot app code, or n8n workflow changes.

## 2026-05-28: Repo Agent Instruction Refresh

Decision: Phase 2B-G refreshes repo agent instructions and static guard
coverage while keeping runtime auth, admin UI, product writes, browser
Supabase, service-role runtime paths, deployment, n8n workflow changes,
Pinecone runtime changes, and SaaS chatbot app work blocked.

Reason: future coding agents need the current architecture direction, phase
status, checklist rules, and hard safety boundaries in the repo-local
instructions before additional admin/auth boundary work continues.

## 2026-05-28: Reviewed Server-side Admin Auth Resolution Boundary

Decision: Phase 2B-H strengthens the dependency-injected server-only admin
authorization resolver/adapter boundary and proves safe allow/deny decisions
from trusted fake adapter inputs only.

Reason: future runtime admin routes or server actions need a reviewed
server-side boundary that denies anonymous identity, missing or inactive admin
profiles, missing or inactive memberships, wrong-actor memberships,
cross-workspace memberships, requested record workspace mismatches,
unsupported operations, and role violations before product writes are
approved. This phase keeps real auth runtime wiring, Supabase Auth runtime
wiring, cookie reads, header reads, login/logout routes, protected admin pages,
admin UI, runtime route/page/server-action wiring, product/category/product
image writes, Supabase Storage, service-role runtime paths, browser Supabase,
deployment, Supabase Cloud connection, n8n workflow changes, Pinecone runtime
changes, and SaaS chatbot app code out of scope.

## 2026-05-28: Admin Auth Implementation Gate Wording Cleanup

Decision: Phase 2B-I cleans stale stacked current-PR wording in the admin auth
membership design and refines runtime-readiness checklist/static guard wording
only.

Reason: the admin auth membership design had accumulated phase-specific
sentences from older Phase 2B PRs that could make the current work look like
Phase 2B-D, Phase 2B-E, or Phase 2B-H runtime boundary work. This phase keeps
the completed phase history, records Phase 2B-H as the latest completed
server-side boundary state, and leaves real auth runtime wiring, Supabase Auth
runtime wiring, cookie reads, header reads, login/logout routes, protected
admin pages, admin UI, runtime route/page/server-action wiring,
product/category/product image writes, Supabase Storage, service-role runtime
paths, browser Supabase, deployment, Supabase Cloud connection, n8n workflow
changes, Pinecone runtime changes, and SaaS chatbot app code out of scope.

## 2026-05-28: Admin Auth Runtime Approval Lane

Decision: Phase 2B-J selects Supabase Auth as the future admin auth provider
and approves the exact future server-only admin auth runtime lane.

The approved future lane is limited to first-party server-only routes or
server actions that use Supabase Auth server APIs only on the server, map the
provider identity to exactly one active `admin_users.auth_user_id`, resolve
active workspace membership owned by that admin profile, build policy input
through the existing server-only resolver/adapter contracts, use
server-managed HttpOnly cookies that are Secure in production and SameSite=Lax
by default unless a later OAuth flow documents an exception, validate CSRF
proof plus Origin/Host before any state-changing admin boundary, and prove the
required anonymous, expired-session, inactive-profile, missing-membership,
wrong-actor, cross-workspace, viewer-denial, admin-allowed,
owner-membership-management, CSRF-failure, safe-redirect, safe-error, no
browser Supabase, and no service-role runtime-path tests.

Reason: future runtime auth now needs one explicit approved lane before code
starts. This phase approves the lane and checklist gates only. It does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI,
wire resolver/adapters into runtime routes/pages/server actions, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, deploy, connect Supabase Cloud, change
n8n workflows, add Pinecone runtime code, migrate Pinecone, or add SaaS chatbot
app code.

## 2026-05-28: Server-only Supabase Auth Identity Boundary

Decision: Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary.

The approved implementation boundary is
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`. It
is a server-only `AdminAuthAdapter` identity adapter that may read request
cookies with `cookies()` and call Supabase Auth `auth.getUser()` through
`@supabase/ssr` only inside that module. It returns the existing safe
authenticated identity shape or boring unauthenticated denial reasons, and it
does not expose tokens, cookies, provider internals, stack traces, Supabase
internals, SQL, or env values.

Reason: Phase 2B-J approved Supabase Auth as the future provider and approved
a server-only auth lane. The next safe step is a narrow identity/session-read
boundary behind the existing adapter contract, without wiring auth into
runtime routes, pages, server actions, protected admin pages, login/logout,
admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, deployment, Supabase Cloud, n8n
workflows, Pinecone runtime code, or SaaS chatbot code. Header reads remain
blocked; no headers are needed for this boundary.

## 2026-05-29: Server-only Admin Profile And Membership Read Boundary

Decision: Phase 2B-L adds only the server-only admin profile and membership read boundary.

The approved implementation boundary is
`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`.
It is a server-only `AdminProfileAdapter` and `AdminMembershipAdapter`
implementation that may read `admin_users` by `auth_user_id` and
`memberships` by server-resolved `admin_user_id` plus `workspace_id` only
inside that module when an authenticated admin-read client is explicitly
injected. It does not default to the plain anon-key Supabase helper. Without
that injected dependency, the adapters fail closed with `null`. It returns the
existing safe adapter shapes only. Missing, inactive, duplicate, non-exact,
wrong-actor, cross-workspace, query-error, or provider-error results fail
closed without exposing Supabase errors, SQL, provider internals, env values,
stack traces, cookies, or tokens.

Reason: Phase 2B-K established the server-only Supabase Auth identity boundary.
The next safe step is the smallest Supabase-backed profile/membership read
boundary behind the existing adapter contracts, while live authenticated
read-client wiring remains deferred. This avoids silently using an
unauthenticated anon-key client for RLS-scoped admin reads. The phase does not
wire auth into runtime routes, pages, server actions, protected admin pages,
login/logout, admin UI, product/category/product image writes, Supabase
Storage, service-role runtime paths, browser Supabase, deployment, Supabase
Cloud, n8n workflows, Pinecone runtime code, `website/chat-config.js`, or SaaS
chatbot code. Cookie reads and Supabase Auth calls remain restricted to the
Phase 2B-K identity boundary; header reads remain blocked.

## 2026-05-29: Server-only Admin Workspace Resolution Boundary

Decision: Phase 2B-M adds only the server-only admin workspace resolution boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-workspace-resolver.ts`. It is a
server-only `AdminWorkspaceResolver` implementation that resolves trusted
workspace scope only from an explicitly injected trusted server-side workspace
ID. Browser/request workspace IDs are validation-only and never become
authority. Missing, empty, whitespace-only, mismatched, or provider-error
values fail closed with `{ serverResolvedWorkspaceId: null }`. Matching
validation-only workspace IDs may pass only when trusted server-side workspace
input is already present.

Reason: Phase 2B-L established the server-only admin profile/membership read
boundary behind the existing adapter contracts. The next safe step is to fill
the existing workspace resolver seam without using public catalogue workspace
configuration as an admin authorization shortcut and without wiring the
resolver into runtime routes, pages, or server actions. This phase does not
read cookies, call Supabase Auth, read headers, call Supabase tables, use
service-role keys, add browser Supabase, add login/logout, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or add SaaS chatbot code.

## 2026-05-29: Server-only Session-bound Admin Read-client Factory

Decision: Phase 2B-N adds only the server-only session-bound admin read-client factory.

The approved implementation boundary remains
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
because that module already owns the reviewed Phase 2B-K server-only cookie
read and Supabase Auth boundary. The factory creates a session-bound Supabase
SSR client from the reviewed server-only Supabase URL, anon key, and request
cookies, and returns the Phase 2B-L `SupabaseAdminReadClientResult` dependency
shape. Missing server env, cookie-read failure, client-factory failure, or a
missing explicit session-bound client fail closed with
`{ configured: false, client: null, reason: "authenticated_admin_read_client_required" }`.

Reason: Phase 2B-L profile/membership adapters require an explicitly injected
authenticated admin-read client and fail closed without one. The next safe step
is to create that dependency factory without wiring it into runtime routes,
pages, server actions, protected admin pages, login/logout, admin UI, or
product writes. This phase does not query `admin_users` or `memberships`, does
not call Supabase Auth from the read-client factory, does not read headers, use
service-role keys, add browser Supabase, add Supabase Storage, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, access
`website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only Admin Authorization Adapter-set Composition Boundary

Decision: Phase 2B-O adds only the server-only admin authorization adapter-set composition boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
It composes the existing `AdminAuthAdapter`, `AdminProfileAdapter`,
`AdminMembershipAdapter`, and `AdminWorkspaceResolver` contracts by assembling
the reviewed Phase 2B-K/N Supabase Auth identity and session-bound read-client
boundary, the Phase 2B-L profile/membership read boundary, and the Phase 2B-M
trusted workspace resolver boundary. The factory returns an
`AdminAuthorizationAdapterSet` only when the session-bound admin read client
and trusted server-side workspace input are available; otherwise it fails
closed with a safe unavailable result.

Reason: Phase 2B-N created the missing session-bound admin read-client
factory, while Phase 2B-L profile/membership adapters and Phase 2B-M workspace
resolution remained unwired. The next safe step is a server-only composition
boundary for future runtime use without importing route/page/server-action
code or completing runtime admin auth. This phase does not use the adapter set
from runtime routes, pages, or server actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, read
headers, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or make runtime admin auth
complete.

## 2026-05-29: Server-only Composed Admin Authorization Decision Boundary

Decision: Phase 2B-P adds only the server-only composed admin authorization decision boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-authorization-decision.ts`. It
uses the Phase 2B-O adapter-set composition boundary and calls the existing
`resolveAdminAuthorizationWithAdapters()` decision function. It returns normal
adapter-driven policy decisions when the composed adapter set is available and
returns a safe unavailable result when composition, the session-bound admin
read client, trusted workspace input, or provider dependencies fail.

Reason: Phase 2B-O created the server-only adapter-set composition boundary,
but runtime routes, pages, and server actions still need a future decision
entrypoint that does not duplicate policy logic. The next safe step is a
server-only decision wrapper for future runtime use, while keeping actual
runtime usage blocked. This phase does not use the decision boundary from
runtime routes, pages, or server actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, read
headers, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or make runtime admin auth
complete.

## 2026-05-29: Server-only Admin Request Security Preflight Boundary

Decision: Phase 2B-Q adds only the server-only admin request security preflight boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
It validates only explicitly injected request metadata and optional injected
CSRF verifier results. It treats request/browser supplied method, Origin,
Host, and CSRF proof values as untrusted validation inputs, permits safe
read-only `catalogue.read` requests with same-origin metadata, requires POST
and a valid injected CSRF proof for state-changing admin operations, and fails
closed with safe shapes for missing, invalid, stale, replayed, mismatched, or
unsupported inputs.

Reason: Phase 2B-P created the future server-only composed authorization
decision boundary, but future state-changing admin routes and server actions
also need a request-security preflight before runtime wiring is approved. The
next safe step is a pure server-only validator that does not read real
headers, cookies, Supabase, route handlers, pages, or server actions. This
phase does not use the preflight boundary from runtime routes, pages, or
server actions, read headers, read cookies, call Supabase Auth, query
`admin_users` or `memberships`, compose the adapter set, call the decision
boundary, add login/logout routes, add protected admin pages, add admin UI,
add product/category/product image writes, add Supabase Storage, use
service-role keys, add browser Supabase, deploy, connect Supabase Cloud,
change n8n workflows, add Pinecone runtime code, access
`website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only CSRF Proof Verifier Boundary

Decision: Phase 2B-R adds only the server-only CSRF proof verifier boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
validates only explicitly injected proof material, expected session binding,
expected nonce, injected timestamps, and dependency-injected signature or
replay checks. It parses the simple structured
`base64url(JSON payload).base64url(signature)` proof shape and returns only
Phase 2B-Q-compatible verifier results: valid or one of the safe CSRF proof
failure reasons.

Reason: Phase 2B-Q added the request security preflight validator and requires
an injected CSRF verifier for future state-changing admin operations. The next
safe step is to add the verifier boundary without issuing tokens, reading real
headers, reading cookies, reading env, calling Supabase, or wiring the
verifier into runtime routes, pages, server actions, protected admin pages,
login/logout, admin UI, or product writes. This phase does not use the
verifier from runtime routes, pages, or server actions, read headers, read
cookies, call Supabase Auth, query `admin_users` or `memberships`, compose the
adapter set, call the decision boundary, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code,
access `website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only CSRF Proof Issuer Boundary

Decision: Phase 2B-S adds only the server-only CSRF proof issuer boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It issues
only verifier-compatible structured
`base64url(JSON payload).base64url(signature)` CSRF proofs for supported
state-changing admin operations. It accepts only explicitly injected operation,
session binding, nonce or nonce generator, issued-at/expiry timestamps, and a
dependency-injected signature signer. It returns a proof and safe expiry
metadata only when all required inputs are present and valid; otherwise it
fails closed with safe issue reasons.

Reason: Phase 2B-R created the verifier boundary, and future state-changing
admin routes or server actions need a matching issuer before any runtime use
can be considered. The next safe step is to add the issuer boundary without
reading real headers, cookies, env, Supabase, route handlers, pages, or server
actions, and without storing replay state or wiring the issuer into runtime.
This phase does not use the issuer from runtime routes, pages, or server
actions, read headers, read cookies, call Supabase Auth, query `admin_users`
or `memberships`, compose the adapter set, call the decision boundary, call
the preflight boundary from runtime, call the verifier from runtime, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, use service-role
keys, add browser Supabase, deploy, connect Supabase Cloud, change n8n
workflows, add Pinecone runtime code, access `website/chat-config.js`, or make
runtime admin auth complete.

## 2026-05-31: Phase 2B-AC Admin Auth-check Trusted Workspace Dependency Repair

Decision: Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted workspace dependency through the existing approved dependency path.

Reason: The route previously passed only request metadata to the route gate adapter. Because the default `trustedServerWorkspaceId` was undefined without explicit injection, the internal workspace resolver failed closed (returning `{ serverResolvedWorkspaceId: null }`). The auth-check would therefore return HTTP 503 Service Unavailable, failing closed unconditionally. The fix leverages `process.env.ADMIN_TRUSTED_WORKSPACE_ID` and injects it as the trusted workspace dependency. It remains fail-closed and does not add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app code, or `website/chat-config.js` access.

## 2026-05-31: Phase 2B-AD Admin CSRF Proof Issuer Route Operation Approval Boundary

Decision: Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary.

Reason: A future first-party server-only CSRF proof issuer route needs a dedicated route-gate operation model before implementation. The current request preflight requires state-changing operations to be `POST` and to already include a valid CSRF proof. Therefore, a future CSRF proof issuer route must not route-gate itself as `product.write`, `category.write`, `productImage.write`, or `membership.manage`, because that creates a chicken-and-egg path where the proof issuer already needs the proof it is issuing. It must also not use only `admin.auth.check` as a loose substitute for write-operation authorisation without a clearly reviewed operation model. The likely future operation name is `admin.csrf.issue`.

The future route must remain server-only, use the approved route-gate path, and not call lower-level auth/security boundaries directly except the approved CSRF proof issuer boundary. It must not issue proofs for unsupported operations, nor expose CSRF secrets, verifier internals, signer internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, membership internals, workspace internals, or stack traces. Phase 2B-AD does not implement the actual route, approve or implement product/category/product image writes by itself, add admin UI, protected admin pages, login/logout routes, Storage, deployment config, Supabase Cloud connection, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-05-29: Server-only Admin Authorization Gate Composition Boundary

Decision: Phase 2B-T adds only the server-only admin authorization gate composition boundary at `website/lib/admin/authorization/server-admin-authorization-gate.ts`.

Reason: future admin runtime boundaries need one reviewed server-only seam that runs request-security preflight before the composed admin authorization decision without duplicating CSRF verification, role policy, membership policy, adapter composition, provider reads, or runtime route/page/server-action wiring.

The gate may run the Phase 2B-Q request security preflight, inject the Phase 2B-R CSRF proof verifier into preflight when verifier dependencies are supplied, and call the Phase 2B-P composed admin authorization decision only after preflight passes. It is not approval to issue CSRF proofs, read real headers, read cookies, read env, call Supabase, query `admin_users` or `memberships`, use the gate from runtime routes, pages, or server actions, add login/logout routes, protected admin pages, admin UI, product writes, Storage, browser Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, or SaaS chatbot app code.

## 2026-05-29: Admin Runtime Wiring Approval Lane

Decision: Phase 2B-U adds only the admin runtime wiring approval lane for future use of `resolveServerAdminAuthorizationGate()`.

Reason: Phase 2B-T created the server-only gate, but future runtime code still needs an explicit approval lane before any route handler, page, server action, or real header-read adapter uses it. Recording the lane now lets the next implementation PR stay narrow and testable without accidentally approving product writes or admin UI.

The approved future lane is limited to first-party server-only route handlers or server actions. Real request headers may be read only inside a future reviewed server-only request metadata adapter, which must pass explicit method, Origin, Host, expected Origin, expected Host, request ID, operation, workspace-validation metadata, and CSRF proof values into `resolveServerAdminAuthorizationGate()`. Supabase Auth cookie reads remain only inside `supabase-admin-auth-identity-adapter.ts`; `admin_users` and `memberships` reads remain only inside `supabase-admin-profile-membership-adapters.ts`; workspace resolution remains only inside `server-admin-workspace-resolver.ts`; CSRF proof issuing and verification remain behind the Phase 2B-S and Phase 2B-R boundaries; and the Phase 2B-T gate must preserve preflight-before-decision ordering.

This phase is docs/checklist approval only. It does not implement real auth runtime wiring, read headers, add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud, deployment, real env values, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-29: Server-only Admin Request Metadata Adapter Boundary

Decision: Phase 2B-V adds only the server-only admin request metadata adapter boundary at `website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.

Reason: Phase 2B-U approved a future runtime lane that requires a reviewed place for reading real request headers before any route, page, or server action may use the Phase 2B-T gate. The narrow adapter lets future runtime code pass explicit method, Origin, Host, expected Origin, expected Host, request ID, and CSRF proof metadata into the gate without letting headers become identity, membership, workspace, provider, or authorization authority.

The adapter is the only newly approved production module in this phase that may import `next/headers` and call `headers()`. Trusted expected origin and expected host values must come from explicit dependency/config injection, not from untrusted request headers or env reads. Missing trusted expected origin or host fails closed. Header read failures and dependency throws return only safe unavailable shapes.

Phase 2B-V does not call `resolveServerAdminAuthorizationGate()`, the request-security preflight, the composed authorization decision, the CSRF verifier, the CSRF issuer, adapter-set composition, Supabase Auth, Supabase table reads, or product write logic. It does not add route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, service-role runtime paths, browser Supabase, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-30: Server-only Admin Runtime Gate Invocation Boundary

Decision: Phase 2B-W adds only the server-only admin runtime gate invocation boundary at `website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.

Reason: Phase 2B-V created the reviewed request metadata adapter and Phase 2B-T created the gate. Future admin routes, pages, or server actions need one narrow server-only invocation seam that composes those two approved boundaries without duplicating header reads, preflight, CSRF verification, role policy, membership policy, provider reads, or runtime implementation.

The helper calls the Phase 2B-V request metadata adapter, passes trusted expected origin and expected host only through explicit dependency/config injection, then invokes the Phase 2B-T gate with the explicit operation/workspace validation inputs plus configured metadata. Metadata failures or dependency throws return the existing safe gate unavailable shape.

Phase 2B-W does not import `next/headers`, call `headers()`, read cookies, read env, call Supabase Auth, query `admin_users` or `memberships`, resolve workspaces directly, compose adapter sets directly, call the decision boundary directly, call request-security preflight directly, issue or verify CSRF proofs directly, or add runtime route/page/server-action usage. It does not add login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-30: Admin Runtime Gate Invocation Usage Approval Lane

Decision: Phase 2B-X adds only the admin runtime gate invocation usage approval lane for future use of `resolveServerAdminRuntimeGateInvocation()`.

Reason: Phase 2B-W created the reviewed server-only invocation helper, but runtime routes and server actions still need an explicit approval lane before any first-party runtime boundary may call it. This phase documents and guards that future lane without adding implementation.

The approved future lane is limited to first-party server-only route handlers or server actions. Future runtime usage must call only the Phase 2B-W invocation helper from the route/action boundary. Header reads remain inside the Phase 2B-V request metadata adapter; cookie reads and Supabase Auth calls remain inside the Phase 2B-K/N identity boundary; `admin_users` and `memberships` reads remain inside Phase 2B-L; workspace resolution remains inside Phase 2B-M; adapter-set composition remains inside Phase 2B-O; decision logic remains inside Phase 2B-P; request-security preflight remains inside Phase 2B-Q / Phase 2B-T gate; CSRF verification remains inside Phase 2B-R / Phase 2B-T gate; and CSRF issuance remains inside Phase 2B-S.

This phase is docs/checklist/static-guard approval only. It does not add route handlers, pages, server actions, runtime helper usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud, deployment, real env values, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Server-only Admin Runtime Route Gate Adapter Boundary

Decision: Phase 2B-Y adds only the server-only admin runtime route gate adapter boundary at `website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`.

Reason: Phase 2B-X approved the future lane for first-party server-only route handlers or server actions to call the Phase 2B-W invocation helper. The next safe step is one reviewed server-only adapter seam that future runtime code can call without duplicating lower-level auth/security logic.

The adapter accepts explicit operation/workspace inputs, trusted expected origin and host dependencies, gate dependencies, and an explicit request method or method from a minimal request-like object. It passes the method into the Phase 2B-W invocation helper through request metadata dependencies and returns the existing safe gate result shape.

Phase 2B-Y does not read headers directly, read cookies, read env, import route/page/server-action code, call `readServerAdminRequestMetadata()` directly, call `resolveServerAdminAuthorizationGate()` directly, call preflight, decision, CSRF verifier, CSRF issuer, adapter-set composition, Supabase Auth, `admin_users`, `memberships`, or workspace resolver boundaries directly, add route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Admin Runtime Route Gate Adapter Usage Approval Lane

Decision: Phase 2B-Z adds only the admin runtime route gate adapter usage approval lane.

The future approved lane is limited to first-party server-only route handlers or server actions. Future runtime route/action code may call `resolveServerAdminRuntimeRouteGateAdapter()` only through the Phase 2B-Y route gate adapter and must not duplicate lower-level boundary logic.

Header reads remain inside Phase 2B-V, cookie reads and Supabase Auth calls remain inside Phase 2B-K/N, `admin_users` and `memberships` reads remain inside Phase 2B-L, workspace resolution remains inside Phase 2B-M, adapter-set composition remains inside Phase 2B-O, decision logic remains inside Phase 2B-P, request-security preflight remains inside Phase 2B-Q / Phase 2B-T, CSRF verification remains inside Phase 2B-R / Phase 2B-T, CSRF issuance remains inside Phase 2B-S, runtime gate invocation remains inside Phase 2B-W, and route gate adapter plumbing remains inside Phase 2B-Y.

Phase 2B-Z does not add route handlers, pages, server actions, runtime route gate adapter usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: First Admin Runtime Route Gate Adapter Usage Boundary

Decision: Phase 2B-AA adds the first admin runtime route gate adapter usage boundary at `website/app/api/admin/auth-check/route.ts`.

Reason: Phase 2B-Z approved the lane for route usage, and now the system needs a harmless authorization probe to verify the entire server-side authorization stack without modifying product data or exposing protected admin UI.

The route handler is a first-party server-only boundary that only calls the Phase 2B-Y route gate adapter. It does not import or call lower-level boundaries directly. Phase 2B-AA does not add login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Admin CSRF Proof Issuer Runtime Usage Approval Lane

Decision: Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane for future use of `issueServerAdminCsrfProof()` from a first-party server-only CSRF proof issuer route.

Reason: Phase 2B-AA proved the route gate adapter can be used safely from exactly one harmless auth-check route. The next smallest safe step is to approve the future runtime lane for issuing CSRF proofs, because future state-changing admin routes will eventually require CSRF proof flow.

The approved future lane is limited to exactly one first-party server-only CSRF proof issuer route under `website/app/api/admin/**`. The future route must remain server-only and must not bypass the Phase 2B-Y/AA route-gate authorization path. The future route must not call lower-level auth/security boundaries directly except the approved Phase 2B-S CSRF issuer boundary and the Phase 2B-AI session/workspace binding boundary. The future route must not expose CSRF secrets, verifier internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, workspace internals, membership internals, or stack traces. The future route must not approve product/category/product image writes by itself. The future route must not add login/logout, protected admin pages, or admin UI.

This phase is docs/checklist/static-guard approval only. It does not add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.
Decision: Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary. It does not implement the actual CSRF proof issuer route.

## 2026-06-01: Admin CSRF Proof Issuer Session/Workspace Binding Boundary

Decision: Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary at `website/lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding.ts`.

Reason: Phase 2B-AH deferred the actual issuer route because existing approved boundaries could authorize a request and issue a signed proof, but did not yet provide a safe opaque session/workspace binding for proof payloads. The new boundary resolves the authenticated admin session, active admin profile, active owner/admin membership, and trusted workspace through existing server-only Phase 2B adapters before invoking an explicitly injected binding deriver.

This phase does not implement the actual CSRF proof issuer route, does not approve binding usage from routes/pages/server actions, and does not add product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Admin Auth Login Logout And Protected Shell

Decision: Phase 2B-AN adds a minimal first-party admin login/logout and
protected admin shell boundary.

Reason: The product-management API routes now exist, but operators still need
a first-party session entry point and a safe protected shell before any admin
product-management UI is built. The smallest safe step is a login page,
server-owned login/logout routes, and a protected shell that proves
owner/admin access while keeping product editing out of scope.

Login/logout use the existing server-only Supabase Auth boundary in
`supabase-admin-auth-identity-adapter.ts`. Cookie reads and session mutation
stay inside that boundary, and the routes return only generic
unauthenticated/unavailable redirects without exposing provider errors, SQL,
tokens, cookies, env values, or stack traces.

The protected shell uses the existing server-only route-gate path with the
new read-only `admin.shell.access` operation. Owner/admin memberships are
allowed, viewer memberships are denied, and the UI renders only safe states:
unauthenticated, authenticated but not authorised, authorised admin, and
unavailable/misconfigured.

Phase 2B-AN does not add product-management UI, product/category/product-image
write forms, server actions, binary uploads, Supabase Storage, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud,
n8n changes, Pinecone runtime code, SaaS chatbot work, or
`website/chat-config.js` access.

## 2026-06-02: Admin Read-only Product Dashboard Boundary

Decision: Phase 2B-AO adds a read-only admin product dashboard inside the protected admin shell.

Reason: PR #81 proved the first-party login/logout and protected admin shell
boundary. The next smallest safe operator surface is read-only catalogue
visibility for authorised owner/admin users before any product-management
write UI, upload flow, or server action exists.

The dashboard remains under the existing `admin.shell.access` page gate, which
allows owner/admin membership and denies viewer membership. After that gate
allows access, the dashboard uses a server-only session-bound authenticated
admin read client and trusted `ADMIN_TRUSTED_WORKSPACE_ID` configuration to
perform select-only RLS-scoped reads of `categories`, `products`, and
`product_images`. The UI renders only category/product summaries and product
image metadata counts or alt-text summaries. It does not expose workspace
internals, membership internals, SQL/provider errors, stack traces, cookies,
tokens, env values, storage paths, or secrets.

Phase 2B-AO does not add product/category/product-image create, edit, archive,
publish, upload, or delete controls; product write forms; server actions;
Supabase Storage; binary uploads; browser Supabase; service-role runtime
paths; deployment config; Supabase Cloud actions; n8n changes; Pinecone
runtime code; SaaS chatbot work; or `website/chat-config.js` access.

## 2026-06-01: Admin Product Persistence And Protected Write API Routes

Decision: Phase 2B-AL adds the first backend-only protected admin product-management write surface.

Reason: Phase 2B-AK made CSRF proof issuance available for state-changing admin operations. The next bounded step is to use the approved route-gate, CSRF, trusted workspace, session-bound Supabase, RLS, and audit boundaries for actual product/category/product-image metadata writes without adding UI, uploads, Storage, or service-role shortcuts.

The implementation adds session-bound product persistence under `website/lib/products/persistence/`, owner/admin RLS write policies and product-management audit inserts, and first-party admin API routes for category, product, and product-image metadata create/update/publish/archive operations. Route responses stay safe and no-store, and product image writes are metadata-only.

Phase 2B-AL does not add admin UI, login/logout routes, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin Product Write Audit Atomicity Boundary

Decision: Phase 2B-AM resolves the atomicity limitation from Phase 2B-AL by migrating product metadata mutations and audit insertions into a single Postgres RPC transaction block (`execute_admin_product_write`).

Reason: The initial protected admin API routes successfully gated persistence but allowed a state where a write could commit without an audit log if the second insert failed. By moving the mutation boundary into a single PL/pgSQL function with explicit static SQL branches per action, both operations happen within an atomic transaction. This also keeps the RPC type-aware, prevents dynamic SQL injection, securely resolves the actor ID via `current_product_admin_user_id()`, and hardens route methods to POST-only for all state changes.

Phase 2B-AM does not add admin UI, login/logout routes, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin CSRF Proof Issuer Route Implementation

Decision: Phase 2B-AK adds only the first-party server-only admin CSRF proof issuer route at `website/app/api/admin/csrf-proof/route.ts`.

Reason: Phase 2B-AE added the dedicated `admin.csrf.issue` operation/preflight lane, Phase 2B-AI added the safe session/workspace binding boundary, and Phase 2B-AJ added the runtime deriver/signer dependencies. The next narrow implementation step is the actual proof issuer route that can issue proof material for future state-changing admin routes without making those write routes available yet.

The route accepts only `POST`, validates safe JSON body input, rejects missing, malformed, unsupported, and non-state-changing target operations, gates itself as `admin.csrf.issue`, resolves the requested target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime dependencies, and returns only `{ ok: true, csrfProof, expiresAt }` or `{ ok: false, error }`.

Phase 2B-AK does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin CSRF Proof Session/Workspace Binding Runtime Dependency Boundary

Decision: Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary at `website/lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies.ts`.

Reason: Phase 2B-AI created the binding boundary but required an explicitly injected opaque deriver. The runtime dependency factory now supplies that deriver from canonical requested operation, auth user ID, admin user ID, trusted workspace ID, and membership role inputs using the existing server-only `ADMIN_CSRF_PROOF_SECRET` and Node crypto. The binding is deterministic for the same canonical input and secret, changes when any security-relevant input changes, and fails closed for missing secrets, malformed input, or crypto failures.

This phase does not implement the actual CSRF proof issuer route, does not approve binding usage from routes/pages/server actions, and does not add product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Admin Category Management UI Boundary

Decision: Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell.

Reason: PR #82 added safe read-only catalogue visibility for authorised admins. The next smallest product-management write surface is category management only, using the already protected backend category routes rather than adding product/product-image UI, server actions, browser Supabase, service-role paths, uploads, Storage, deployment changes, or external workflow changes.

The browser component requests a CSRF proof for `category.write` from the first-party `/api/admin/csrf-proof` route, then calls only `POST /api/admin/categories`, `POST /api/admin/categories/[categoryId]`, or `POST /api/admin/categories/[categoryId]/archive` with `x-csrf-proof`. Route-gate, same-origin, CSRF proof, owner/admin membership, trusted workspace, RLS, audit, and atomic RPC boundaries remain server-side. UI success and failure messages stay generic and do not render raw CSRF proof values, provider errors, SQL, stack traces, cookies, tokens, env values, workspace internals, membership internals, or secrets.

Phase 2B-AP does not add product create/edit/archive/publish UI, product image write UI, binary uploads, Supabase Storage, server actions, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Furniture Listing Catalogue Direction Pivot

Decision: Phase 2B-AQ pivots the current product direction to furniture/event-rental listings plus customer enquiries.

Reason: SpaceKonceptRental is not pursuing ecommerce carts, checkout, payments, customer accounts, stock reservation, order fulfilment, or online ordering as the near-term product direction. The useful near-term operator surface is an admin-managed listing catalogue where authorised admins can organise furniture/event-rental listings and customers can browse listings before submitting enquiry or quote requests.

Existing `products`, `categories`, `product_images`, product-management routes, RLS policies, RPCs, and server helper names remain technical internals for now. Renaming those database/API concepts is explicitly deferred to avoid risky churn and should happen only through a separately approved migration/compatibility plan.

Phase 2B-AQ does not add listing write UI, upload/storage implementation, public catalogue rebuilds, enquiry form implementation, SQL migrations, service-role runtime paths, browser Supabase, n8n changes, Pinecone runtime code, SaaS chatbot work, deployment config, or `website/chat-config.js` access.

## 2026-06-02: Admin Shell GET Origin Handling Fix

Decision: Phase 2B-AR repairs protected admin shell GET handling for normal
top-level browser navigations that omit the `Origin` header.

Reason: The admin shell uses the approved server-only route-gate path with
`admin.shell.access` and `requestMethod: "GET"`. Browser top-level navigation,
including a 303 GET after login, may omit Origin. The request-security
preflight previously required Origin before reaching the read-only method
branch, so legitimate admins could be denied before the authorization decision
ran.

Safe read-only admin operations may now pass preflight without Origin only when
the request Host matches the trusted expected host or the host derived from the
trusted expected Origin. If Origin is present, strict Origin/Host validation
still applies. `admin.csrf.issue` and state-changing admin writes still require
strict Origin/Host validation, POST, and the existing CSRF proof checks for
writes. Shell request-security denials map to generic unavailable UI copy.

Phase 2B-AR does not add listing CRUD UI, listing image upload/storage, public
catalogue redesign, enquiry form implementation, SQL migrations, browser
Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone
runtime code, SaaS chatbot work, or access `website/chat-config.js`.

## 2026-06-02: Admin Furniture Listing Management UI Boundary

Decision: Phase 2B-AS adds metadata-only furniture listing management controls
inside the existing protected admin shell.

Reason: Phase 2B-AQ confirmed the current direction as a furniture/event-rental
listing catalogue rather than ecommerce. The existing Phase 2B-AL/AM backend
routes already provide route-gated, CSRF-protected, RLS/audit-backed product
metadata mutations. The next narrow operator surface is a browser UI that uses
those existing routes without adding new backend write paths or renaming
technical internals.

The browser component requests a CSRF proof for `product.write`, then calls
only `POST /api/admin/products`, `POST /api/admin/products/[productId]`, and
`POST /api/admin/products/[productId]/archive` with `x-csrf-proof`. Create and
edit payloads use only `categoryId`, `slug`, `name`, `shortDescription`,
`description`, `rentalUnit`, `status`, and `sortOrder`. Publish and unpublish
use the update route with `status: "published"` or `status: "draft"`, and
archive uses the archive route rather than hard delete.

Phase 2B-AS does not add listing image upload, Supabase Storage, public
catalogue redesign, enquiry form implementation, DB/API/table/RPC/RLS renames,
SQL migrations, browser Supabase, service-role runtime paths, deployment
config, n8n changes, Pinecone runtime code, SaaS chatbot work, cart, checkout,
payments, customer accounts, stock reservation, order fulfilment, online
ordering, or access `website/chat-config.js`.

## 2026-06-03: Public Furniture Catalogue UX Polish

Decision: Phase 2B-AT adds only public-facing furniture/event-rental listing
UX and copy polish for the existing catalogue path.

Reason: the existing admin-managed listing management work in Phase 2B-AS
introduced listing metadata controls and required the public catalogue surfaces to
feel like a real furniture listing website. This phase updates listing copy,
CTA language, and no-data state handling while preserving existing read
paths and safe fallback behavior.

Phase 2B-AT does not add listing image upload or Supabase Storage, image
metadata admin UI, enquiry form implementation, DB/API/table/RPC/RLS renames,
SQL migrations, browser Supabase, service-role runtime paths, deployment
changes, n8n changes, Pinecone runtime code, SaaS chatbot work, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
online ordering, or access `website/chat-config.js`.

## 2026-06-03: Public Events And Quote Copy Polish

Decision: Phase 2B-AU adds only public-facing events and quote-request copy
polish.

Reason: Phase 2B-AT made the catalogue and listing detail pages read like a
real furniture/event-rental website, but the public events route still exposed
shell/MVP wording. This phase completes the adjacent public copy pass by using
normal event-rental, furniture-rental, styled-setup, enquiry, and quote-request
language while keeping the existing quote form honest as a follow-up request.

Phase 2B-AU does not add enquiry form implementation beyond the existing quote
request form, cart, checkout, payment, customer account, stock reservation,
confirmed booking, order fulfilment, online ordering, admin changes, image
upload, Supabase Storage, SQL migrations, DB/API/table/RPC/RLS renames, browser
Supabase, service-role runtime paths, deployment changes, n8n changes, Pinecone
runtime code, SaaS chatbot work, or access `website/chat-config.js`.

## 2026-06-03: Admin Anti-framing Header Hardening

Decision: Phase 2B-AV adds narrow anti-framing headers for the protected admin
UI.

Reason: the protected `/admin` UI renders real admin write controls, including
category and listing management controls, but the app did not configure
anti-framing response headers. CSRF proof validation and Origin/Host checks
remain necessary and unchanged, but they do not stop a same-session user from
interacting with a framed first-party admin UI. SameSite=Lax auth cookies may
reduce arbitrary off-site exploitability, but anti-framing headers close the
missing browser-side defence.

The Next.js config applies only `Content-Security-Policy: frame-ancestors
'none'` and `X-Frame-Options: DENY` to `/admin` and nested admin UI routes.
It does not introduce a broad public-site CSP.

Phase 2B-AV does not change admin auth, CSRF, Origin/Host checks, Supabase SSR
cookies, admin UI behavior, product/category write route logic, SQL
migrations, DB/API/table/RPC/RLS names, browser Supabase, service-role runtime
paths, image upload, Supabase Storage, n8n/Pinecone runtime behavior, SaaS
chatbot runtime work, ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Quote Request Inbox Boundary

Decision: Phase 2B-AW adds a read-only admin quote request inbox inside the
protected admin shell.

Reason: public quote requests are already validated, rate-limited, and
persisted through the existing `/quote` form and `POST /api/quote` route.
Admins now need a bounded review surface for recent submitted enquiries
without adding quote workflow writes, notifications, CRM sync, ecommerce
ordering, or customer accounts.

The inbox uses a server-only admin quote read boundary with the existing
session-bound admin Supabase read client and trusted `ADMIN_TRUSTED_WORKSPACE_ID`.
It queries recent `quote_requests` newest first, includes matching
`quote_request_items` when available, scopes every read to the trusted
workspace, and maps provider failures to generic unavailable UI.

Phase 2B-AW does not add public quote request lists, quote status writes,
notifications, CRM integration, customer accounts, ordering, checkout,
payments, fulfilment, stock reservation, confirmed booking, SQL migrations,
DB/API/table/RPC/RLS renames, browser Supabase, service-role runtime paths,
image upload, Supabase Storage, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Quote Request Status Update Boundary

Decision: Phase 2B-AX adds only admin quote request status updates from the
protected admin quote request inbox.

Reason: Phase 2B-AW gave authorised admins a read-only quote request inbox.
The next narrow operations step is to let owner/admin users move an existing
quote request through the already-defined internal status values without
adding customer-facing quote tracking, notifications, CRM sync, ecommerce
ordering, or broader workflow management.

The implementation introduces the quote-specific `quote.write` admin
operation instead of reusing product/category operations. Owner/admin
memberships are allowed, viewer memberships are denied, and the CSRF proof
issuer can issue operation-bound proofs for `quote.write`. The protected
route accepts only `POST` with a bounded `{ status }` JSON payload, validates
the quote request ID and allowed status, requires same-origin and
`x-csrf-proof` checks, resolves the trusted admin workspace, and updates only
`quote_requests.status`.

Phase 2B-AX does not add public quote status pages, customer-facing quote
tracking, notifications, CRM integration, internal notes, assignment,
customer accounts, cart, checkout, payments, stock reservation, fulfilment,
confirmed booking, online ordering, image upload, Supabase Storage, SQL
migrations, DB/API/table/RPC/RLS renames, browser Supabase, service-role
runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot runtime work,
ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Listing Image Metadata UI Boundary

Decision: Phase 2B-AY adds only metadata listing image management controls
inside the protected admin shell.

Reason: Phase 2B-AL/AM already added protected backend product-image metadata
routes, and Phase 2B-AS added listing metadata controls while leaving image
management UI out of scope. The next narrow admin step is to reuse the
existing `productImage.write` route/CSRF boundary for image metadata records
without adding file handling or Supabase Storage.

The implementation extends the existing server-only admin dashboard read
boundary to include editable image metadata rows scoped to
`ADMIN_TRUSTED_WORKSPACE_ID`. The browser component is visible only after the
protected admin shell has loaded authorised dashboard data. It requests a
first-party CSRF proof for `productImage.write`, posts only approved JSON
metadata fields to `POST /api/admin/product-images` and
`POST /api/admin/product-images/[imageId]`, and archives through
`POST /api/admin/product-images/[imageId]/archive`. Failures render only
generic admin-safe copy.

Phase 2B-AY does not add binary image upload, file inputs,
multipart/form-data, Supabase Storage bucket creation or API calls, public
image upload routes, public image management routes, DB/API/table/RPC/RLS
renames, SQL migrations, browser Supabase, service-role runtime paths,
notifications, CRM integration, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, ecommerce flows including cart, checkout, payments, customer
accounts, stock reservation, fulfilment, confirmed booking, online ordering,
or access `website/chat-config.js`.
