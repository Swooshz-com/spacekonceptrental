# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2B-R - server-only CSRF proof verifier boundary.

This PR adds the smallest server-only CSRF proof verifier boundary for future
state-changing admin routes and server actions. The verifier accepts only
explicitly injected proof material, expected session/nonce/timestamp values,
and dependency-injected signature or replay checks. It validates a structured
CSRF proof shape for future injection into the Phase 2B-Q preflight boundary
and fails closed with Phase 2B-Q-compatible safe reasons. It does not read real
request headers, cookies, env, routes, pages, server actions, Supabase, or
runtime state, does not wire itself into runtime routes/pages/actions, and does
not make runtime admin auth complete.

Latest completed phase: Phase 2B-Q - server-only admin request security preflight boundary.

Last merged phase PR: #57

Merge commit: `1151aa5546aa6f2e30537e03da9e7a77fbb13e74`

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
- Server-only CSRF proof verifier boundary is in progress.

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
cookie-read, or CSRF issuance approval. These boundaries are not wired into
routes, pages, server actions, protected admin runtime, login/logout, admin UI,
or product writes.

Runtime session-bound read-client usage remains deferred.
Runtime adapter-set usage remains deferred.
Runtime decision-boundary usage remains deferred.
Runtime request-security preflight usage remains deferred.
Runtime CSRF proof verifier usage remains deferred.

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
- Header reads.
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
outside the reviewed identity boundary, headers, login/logout routes,
protected admin pages, admin UI, and product/category/product image writes
remain blocked until separately approved.
