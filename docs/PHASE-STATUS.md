# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2B-L - server-only admin profile and membership read boundary.

This PR adds the smallest server-only Supabase-backed admin profile and
workspace membership read boundary needed for future admin auth. It reads
`admin_users` and `memberships` only inside the reviewed server-only
profile/membership adapter boundary behind the existing adapter contracts, but
requires an explicitly injected authenticated admin-read client and fails
closed without one. It does not default to the plain anon-key Supabase helper.
It does not add login/logout routes, protected admin pages, admin UI, runtime
route/page/server-action wiring, product writes, Storage, deployment, Supabase
Cloud connection, browser Supabase, service-role runtime paths, n8n changes,
Pinecone runtime code, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-K - server-only Supabase Auth identity boundary.

Last merged phase PR: #51

Merge commit: `19f385a20d82109fb73e77f9e5328cc91e16cffd`

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
- Server-only Supabase admin profile/membership read boundary is in progress.

Supabase Auth is approved as the future server-side admin auth provider. The
Phase 2B-K identity boundary remains the only approved place to read Supabase
Auth cookies or call Supabase Auth server APIs. The Phase 2B-L
profile/membership boundary is the only approved place in this phase to read
`admin_users` or `memberships` for admin authorization. Neither boundary is
wired into routes, pages, server actions, protected admin runtime,
login/logout, admin UI, or product writes.

Live authenticated read-client wiring remains deferred.

## Still blocked

- Real auth runtime wiring.
- Supabase Auth runtime wiring.
- Cookie reads outside the Phase 2B-K server-only identity boundary.
- Admin profile/membership Supabase table reads outside the Phase 2B-L
  server-only read boundary.
- Live authenticated read-client wiring for Phase 2B-L profile/membership
  reads.
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
workspace or resolver boundary, but real runtime route/page/server-action
wiring, cookie reads outside the reviewed identity boundary, headers,
login/logout routes, protected admin pages, admin UI, and
product/category/product image writes remain blocked until separately
approved.
