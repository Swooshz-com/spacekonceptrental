# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2B-H - reviewed server-side admin auth/membership resolution boundary.

This PR strengthens the dependency-injected server-side admin authorization
resolver/adapter boundary and adds fake-adapter decision coverage only. It
does not implement runtime auth or runtime admin features.

Latest completed phase: Phase 2B-G - refresh repo agent instructions.

Last merged phase PR: #46

Merge commit: `2d0c97ec08ece3606e0e70017c74a9b09679c274`

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

Supabase Auth is documented as the preferred future server-side admin auth
provider, but no Supabase Auth runtime wiring exists yet.

## Still blocked

- Real auth runtime wiring.
- Supabase Auth runtime wiring.
- Cookie reads.
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
continue auth readiness with reviewed server-side design or test-only boundary
work, but real auth runtime wiring, cookies, headers, login/logout routes,
protected admin pages, admin UI, and product/category/product image writes
remain blocked until separately approved.
