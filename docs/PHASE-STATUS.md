# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2B-AH - admin CSRF proof issuer route runtime boundary.

This phase is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries.

Latest completed phase: Phase 2B-AG - admin CSRF proof signer and nonce runtime dependency boundary.

Last merged phase PR: #73

Merge commit: `0c6edc05d8baed88ce1014cd9f9dd6c574dfef3d`
## Completed foundation

- Next.js app root exists under `website/`.
- Public homepage, catalogue, product detail, events, quote, and chat shells
  exist.
- Browser chat calls first-party `POST /api/chat` only.
- n8n remains behind the server-only `N8nChatProvider`.
- Supabase schema, migrations, RLS strategy, local RLS tests, server-only
  Supabase helper, public catalogue reads, and quote persistence exist.
- Disabled server-only chat and product/admin persistence scaffolds exist.

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
- Admin CSRF proof issuer route deferred because of missing safe server-side session/workspace binding is in progress.
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
trusted workspace dependency. Phase 2B-AD is docs/checklist/static-guard approval only for the future admin CSRF proof issuer route operation model, and it is not runtime implementation approval. Phase 2B-AE implements only the admin CSRF issue operation policy and preflight boundary. Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented. Phase 2B-AG implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. Phase 2B-AH is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries. These boundaries are not wired into pages, server actions,
protected admin runtime, login/logout, admin UI, or product writes.

Runtime session-bound read-client usage remains deferred.
Runtime adapter-set usage remains deferred.
Runtime decision-boundary usage remains deferred.
Runtime request-security preflight usage remains deferred.
Runtime CSRF proof verifier usage remains deferred.
Runtime CSRF proof issuer usage remains deferred.
Runtime admin authorization gate usage remains deferred.
Runtime request metadata adapter usage from routes, pages, or server actions
remains deferred (except the approved Phase 2B-AA route boundary).
Runtime admin gate invocation helper usage from routes, pages, or server
actions remains deferred (except the approved Phase 2B-AA route boundary).
Runtime admin route gate adapter usage from routes, pages, or server actions
remains deferred (except the approved Phase 2B-AA route boundary).

## Still blocked

- Real auth runtime wiring.
- Supabase Auth runtime wiring.
- Cookie reads outside the Phase 2B-K server-only identity boundary.
- Admin profile/membership Supabase table reads outside the Phase 2B-L
  server-only read boundary.
- Admin workspace resolution outside the Phase 2B-M server-only workspace
  boundary.
- Session-bound admin read-client factory usage from runtime routes, pages, or
  server actions.
- Admin authorization adapter-set usage from runtime routes, pages, or server
  actions.
- Admin authorization decision boundary usage from runtime routes, pages, or
  server actions.
- Admin request security preflight usage from runtime routes, pages, or server
  actions.
- Admin CSRF proof verifier usage from runtime routes, pages, or server
  actions.
- Admin CSRF proof issuer usage from runtime routes, pages, or server actions.
- Admin authorization gate usage from runtime routes, pages, or server actions.
- Admin runtime gate invocation usage from routes, pages, or server
  actions (except the approved Phase 2B-AA route boundary).
- Admin runtime route gate adapter usage from routes, pages, or server
  actions (except the approved Phase 2B-AA route boundary).
- Header reads outside the Phase 2B-V request metadata adapter.
- Login/logout routes.
- Protected admin pages.
- Admin UI.
- Resolver/adapter runtime wiring into routes, pages, or server actions.
- Product/category/product image writes.
- Product image uploads and Supabase Storage wiring.
- Conversation/message writes.
- Supabase Cloud connection.
- Deployment and Vercel project config.
- Production seed data.
- Browser Supabase.
- Service-role runtime paths unless separately approved.
- Pinecone runtime changes or migration.
- SaaS chatbot app work in this repo.
- n8n workflow import, export, activation, execution, or mutation.

Product writes remain blocked until real auth/membership resolution, RLS,
audit, and route/action boundaries are implemented and tested.

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

The next recommended PR should still avoid product writes. A safe next PR can
continue auth readiness by adding the next explicitly approved server-only
boundary, but real runtime route/page/server-action wiring, cookie reads
outside the reviewed identity boundary, headers outside the Phase 2B-V request
metadata adapter, admin route gate adapter usage from runtime routes/pages/actions,
login/logout routes, protected admin pages, admin UI, and
product/category/product image writes remain blocked until separately approved.
