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
  It requires an explicitly injected authenticated admin-read client, fails
  closed without one, and does not default to the plain anon-key Supabase
  helper. It is not wired into runtime routes, pages, server actions,
  protected admin runtime, login/logout, admin UI, product/category/product
  image writes, Storage, browser Supabase, service-role runtime paths,
  deployment, Supabase Cloud, n8n workflows, Pinecone runtime code,
  `website/chat-config.js`, or SaaS chatbot app code.
- Phase 2B-M adds a server-only admin workspace resolution boundary only.
  Admin workspace resolution is restricted to
  `website/lib/admin/authorization/server-admin-workspace-resolver.ts`. It
  implements the existing `AdminWorkspaceResolver` contract, requires an
  explicitly injected trusted server-side workspace ID, treats browser/request
  workspace IDs as validation-only, fails closed without trusted input or on
  mismatches, and does not use public catalogue workspace config as an admin
  authorization shortcut. It is not wired into runtime routes, pages, server
  actions, protected admin runtime, login/logout, admin UI,
  product/category/product image writes, Storage, browser Supabase,
  service-role runtime paths, deployment, Supabase Cloud, n8n workflows,
  Pinecone runtime code, `website/chat-config.js`, or SaaS chatbot app code.
- Phase 2B-N adds a server-only session-bound admin read-client factory only.
  The factory is restricted to
  `website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`,
  the existing Phase 2B-K cookie/Auth server boundary. It creates a
  session-bound Supabase SSR admin-read client from reviewed server-only
  Supabase env plus request cookies and returns the Phase 2B-L
  `SupabaseAdminReadClientResult` shape for future profile/membership reads.
  It does not query `admin_users` or `memberships`, is not wired into runtime
  routes, pages, server actions, protected admin runtime, login/logout, admin
  UI, or product writes, and does not approve runtime admin auth completion.
- Phase 2B-O adds a server-only admin authorization adapter-set composition boundary
  only. The composition module is restricted to
  `website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
  It assembles the existing admin authorization adapter contracts from the
  reviewed Phase 2B-K/N identity/read-client, Phase 2B-L
  profile/membership, and Phase 2B-M workspace resolver boundaries. It fails
  closed without a session-bound admin read client or trusted server-side
  workspace input, is not wired into runtime routes, pages, server actions,
  protected admin runtime, login/logout, admin UI, or product writes, and does
  not approve runtime admin auth completion.
- Phase 2B-P adds a server-only composed admin authorization decision boundary
  only. The decision module is restricted to
  `website/lib/admin/authorization/server-admin-authorization-decision.ts`.
  It composes the Phase 2B-O adapter set and calls the existing
  `resolveAdminAuthorizationWithAdapters()` decision function without
  duplicating policy logic. It fails closed when composition or provider
  dependencies are unavailable, is not wired into runtime routes, pages,
  server actions, protected admin runtime, login/logout, admin UI, or product
  writes, and does not approve runtime admin auth completion.
- Phase 2B-Q adds a server-only admin request security preflight boundary
  only. The validator module is restricted to
  `website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
  It validates only explicitly injected request metadata and optional injected
  CSRF verifier results, treats request/browser supplied fields as untrusted
  validation inputs, requires same-origin Origin/Host metadata, and requires
  POST plus a valid CSRF proof for state-changing admin operations. It does
  not read real headers and is not wired into runtime routes, pages, server
  actions, protected admin runtime, login/logout, admin UI, or product writes.
- Phase 2B-R adds a server-only CSRF proof verifier boundary only. The verifier
  module is restricted to
  `website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
  validates only explicitly injected proof material, expected session binding,
  expected nonce, timestamps, and dependency-injected signature or replay
  checks, returns only Phase 2B-Q-compatible safe CSRF proof results, does not
  issue CSRF tokens, does not read real headers, cookies, or env, and is not
  wired into runtime routes, pages, server actions, protected admin runtime,
  login/logout, admin UI, or product writes.
- Phase 2B-S adds a server-only CSRF proof issuer boundary only. The issuer
  module is restricted to
  `website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It
  creates verifier-compatible structured CSRF proofs only from explicitly
  injected operation, session binding, nonce or nonce generator, issued-at and
  expiry timestamps, and dependency-injected signature signer. It supports only
  state-changing admin operations, returns safe issue shapes, does not verify
  proofs, does not read real headers, cookies, or env, does not call Supabase,
  does not store replay state, and is not wired into runtime routes, pages,
  server actions, protected admin runtime, login/logout, admin UI, or product
  writes.

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

Phase 2B-T adds a server-only admin authorization gate composition boundary at
`website/lib/admin/authorization/server-admin-authorization-gate.ts`. It runs
the Phase 2B-Q request-security preflight before the Phase 2B-P composed
admin authorization decision, may inject the Phase 2B-R CSRF proof verifier
when verifier dependencies are supplied, returns only safe allow, deny, or
unavailable shapes, and is not wired into runtime routes, pages, server
actions, protected admin pages, login/logout, admin UI, or product writes.
Phase 2B-U adds a docs/checklist-only admin runtime wiring approval lane for
future use of the Phase 2B-T server-only admin authorization gate. The future
lane is limited to first-party server-only route handlers or server actions,
allows real request header reads only inside a future reviewed server-only
request metadata adapter, requires explicit metadata to be passed into
`resolveServerAdminAuthorizationGate()`, and keeps runtime implementation,
login/logout, protected admin pages, admin UI, product writes, Storage,
browser Supabase, service-role paths, Supabase Cloud, deployment, n8n,
Pinecone, and `website/chat-config.js` out of this PR.

Phase 2B-V adds a server-only admin request metadata adapter boundary at
`website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.
It is the only newly approved production module in this phase that may import
`next/headers` and call `headers()`. It reads only minimal untrusted request
metadata for future injection into `resolveServerAdminAuthorizationGate()`,
requires trusted expected Origin and expected Host through explicit dependency
injection, and does not call the gate, preflight, decision, CSRF, adapter-set,
Supabase, or product write boundaries. It does not approve runtime route,
page, or server-action usage.

Phase 2B-W adds a server-only admin runtime gate invocation boundary at
`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.
It composes the Phase 2B-V metadata adapter with the Phase 2B-T gate using
explicit trusted expected origin/host dependencies and existing safe gate
result shapes. It does not import `next/headers`, read cookies, read env, call
Supabase, query admin tables, duplicate preflight/decision/CSRF logic, or
approve runtime route, page, or server-action usage.

Phase 2B-X adds a docs/checklist/static-guard approval lane for future first-party server-only usage of the Phase 2B-W runtime gate invocation helper. It records that future runtime code may call `resolveServerAdminRuntimeGateInvocation()` only from first-party server-only route handlers or server actions, while all lower-level reads and decisions stay inside their approved Phase 2B-K through Phase 2B-W boundaries. It does not add route handlers, pages, server actions, runtime helper usage, login/logout, protected admin pages, admin UI, product/category/product image writes, Storage, browser Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

Phase 2B-Y adds a server-only admin runtime route gate adapter boundary at `website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`. It gives future first-party server-only routes or server actions one reviewed adapter seam that calls only the Phase 2B-W runtime gate invocation helper from explicit inputs. It does not add route handlers, pages, server actions, runtime helper usage, login/logout, protected admin pages, admin UI, product/category/product image writes, Storage, browser Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.
Phase 2B-Z adds a docs/checklist/static-guard approval lane for future first-party server-only usage of the Phase 2B-Y route gate adapter. Future route handlers or server actions may call `resolveServerAdminRuntimeRouteGateAdapter()` only through that adapter and must keep all lower-level auth/security reads and decisions inside their approved Phase 2B-K through Phase 2B-Y boundaries. This phase does not add route handlers, pages, server actions, runtime route gate adapter usage, login/logout, protected admin pages, admin UI, product/category/product image writes, Storage, browser Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

Phase 2B-AA adds the first admin runtime route gate adapter usage boundary at `website/app/api/admin/auth-check/route.ts`. It introduces exactly one harmless authorization probe route handler that uses the Phase 2B-Y route gate adapter. It is not approval to add other routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.