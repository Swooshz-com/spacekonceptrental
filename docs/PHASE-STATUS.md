# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2B-AP - admin category management UI boundary.

This phase adds category-only create, update, and archive controls inside the protected admin shell for authorised owner/admin users. Browser code only calls first-party admin HTTP APIs, requests a CSRF proof for `category.write`, and sends category writes only to the existing protected category endpoints. Product/product-image UI, uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.

Latest completed phase: Phase 2B-AO - admin read-only product dashboard boundary.

Last merged phase PR: #82

Merge commit: `faff042ac1e9e0b0d2cc6b4740fac0e237141e21`

## Previous merged status snapshot

Current phase: Phase 2B-AN - admin auth login logout protected shell.

This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AM - admin product write audit atomicity boundary.

Last merged phase PR: #80

Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`
## Completed foundation

- Next.js app root exists under `website/`.
- Public homepage, catalogue, product detail, events, quote, and chat shells
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
- Read-only admin product dashboard boundary is in progress.
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
Phase 2B-AO adds only a read-only product dashboard inside that protected
shell. It keeps the existing `admin.shell.access` gate as the page boundary,
uses a session-bound authenticated read client for select-only catalogue table
reads, and renders only safe catalogue management summaries. It does not add
write forms, mutation controls, server actions, Storage/uploads, browser
Supabase, service-role paths, deployment config, Supabase Cloud, n8n changes,
Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Runtime session-bound read-client usage remains deferred outside the approved
Phase 2B-AL/AM backend routes, Phase 2B-AN protected admin shell path, and
Phase 2B-AO read-only admin dashboard path.
Runtime adapter-set usage remains deferred outside the approved Phase 2B-AL/AM
backend routes and Phase 2B-AN protected admin shell path.
Runtime decision-boundary usage remains deferred outside the approved Phase
2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime request-security preflight usage remains deferred outside the approved
Phase 2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime CSRF proof verifier usage remains deferred.
Runtime CSRF proof issuer usage remains deferred except the approved
Phase 2B-AK `POST /api/admin/csrf-proof` route.
Runtime CSRF proof session/workspace binding usage from routes, pages, or
server actions remains deferred except the approved Phase 2B-AK route.
Runtime admin authorization gate usage remains deferred outside the approved
Phase 2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime request metadata adapter usage from routes, pages, or server actions
remains deferred except the approved Phase 2B-AA route boundary, Phase 2B-AK
route boundary, Phase 2B-AL/AM backend route boundaries, and Phase 2B-AN
protected admin shell boundary.
Runtime admin gate invocation helper usage from routes, pages, or server
actions remains deferred except the approved Phase 2B-AA route boundary, Phase
2B-AK route boundary, Phase 2B-AL/AM backend route boundaries, and Phase 2B-AN
protected admin shell boundary.
Runtime admin route gate adapter usage from routes, pages, or server actions
remains deferred except the approved Phase 2B-AA, Phase 2B-AK, Phase 2B-AL/AM,
Phase 2B-AN, and Phase 2B-AO boundaries.

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
- Admin CSRF proof issuer usage from other runtime routes, pages, or server
  actions.
- Admin CSRF proof session/workspace binding usage from other runtime routes,
  pages, or server actions.
- Admin authorization gate usage from runtime routes, pages, or server actions.
- Admin runtime gate invocation usage from routes, pages, or server
  actions (except the approved Phase 2B-AA route boundary).
- Admin runtime route gate adapter usage from routes, pages, or server
  actions except the approved Phase 2B-AA, Phase 2B-AK, and Phase 2B-AL route
  boundaries.
- Header reads outside the Phase 2B-V request metadata adapter.
- Login/logout routes outside the Phase 2B-AN first-party admin auth boundary.
- Protected admin pages outside the Phase 2B-AN minimal protected shell and
  Phase 2B-AO read-only dashboard boundary.
- Product-management write UI.
- Resolver/adapter runtime wiring into routes, pages, or server actions.
- Product writes outside the Phase 2B-AL backend API route boundary.
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

Product writes are approved only through the Phase 2B-AL/AM backend API route.
Product-management write UI, server actions, binary image upload, Supabase
Storage, service-role shortcuts, and browser Supabase product writes remain
blocked.

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

The next recommended PR should keep product-management write UI separate and
narrow. Safe follow-up work can harden the Phase 2B-AO read-only dashboard or
prepare a separate product-management UI plan. Product write forms, binary
image uploads, Supabase Storage, deployment config, browser Supabase,
service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot
work, and `website/chat-config.js` access remain blocked.

## Phase 2B-AP Current Boundary

Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell for authorised owner/admin users. The browser requests a CSRF proof for `category.write` from the first-party `/api/admin/csrf-proof` route and then calls only the existing first-party category write endpoints with `x-csrf-proof`.

Product create/edit/archive/publish UI, product image write UI, binary uploads, Supabase Storage, server actions, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.


## Previous merged status snapshot: Phase 2B-AO

Current phase: Phase 2B-AO - admin read-only product dashboard boundary.
Latest completed phase: Phase 2B-AN - admin auth login logout protected shell.
Last merged phase PR: #81
Merge commit: `f66a37644c51123780fee0944e584ab5e00d6f3e`