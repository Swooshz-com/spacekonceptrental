# Phase 1 Closeout Audit

Phase 1 is now a production-shaped local foundation, not a production launch.
No runtime feature is added by this closeout. The purpose of this document is
to separate what is complete from what remains intentionally blocked before
Phase 2 work begins.

## Completed foundation

- The future app root lives under `website/` as a Next.js app.
- Public homepage, catalogue, product detail, event, quote, and chat surfaces
  exist as the current MVP shell.
- The browser calls first-party routes for chat and quote flows.
- CI validates repository guards and website tests, typecheck, and build.
- Deployment readiness is documented, but no deployment is configured or run.

## Completed Supabase/database work

- The MVP schema defines workspace, admin, membership, catalogue, quote,
  conversation, message, usage, audit, and integration metadata tables.
- RLS is enabled and covered by local-only behavioural tests using disposable
  Docker Postgres.
- Supabase server runtime helpers exist under `website/lib/supabase/` and read
  only server-side env names.
- Public catalogue reads use the trusted active-workspace
  `get_public_catalogue` read surface and `catalogue_public_workspace_config`.
- Direct anonymous base-table catalogue reads are denied by policy after the
  trusted read surface is proven.
- Quote persistence is approved only for first-party public quote inserts.
- Fake/sample catalogue seed fixtures exist for local checks only.

## Completed catalogue/quote work

- Catalogue list and detail pages can return DB-backed rows when server
  Supabase env, `CATALOGUE_WORKSPACE_ID`, and matching active workspace
  database config are present.
- Catalogue pages safely fall back to shell catalogue data when Supabase env or
  active workspace config is missing.
- Product image metadata can be returned by the public catalogue read surface
  only for published products in the active workspace.
- `POST /api/quote` validates bounded public quote payloads before
  persistence.
- Quote route abuse throttling uses trusted proxy header configuration only
  when that header is deployment-controlled, otherwise it falls back closed.

## Completed chat boundary work

- The custom chat UI posts to first-party `POST /api/chat` only.
- `ChatProvider` is server-only and allows n8n to remain an internal provider
  behind the app route.
- `N8nChatProvider` reads webhook configuration only on the server and returns
  safe placeholder or normalized errors when unavailable.
- Chat request validation, idempotency, request IDs, body limits, and rate
  limiting are tested.
- Conversation and message persistence are documented and scaffolded only as a
  disabled server-only boundary.

## Completed safety/guard work

- Static guards keep Supabase imports out of browser-facing production code.
- Static guards forbid `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, and
  service-role runtime paths.
- Static guards keep `website/chat-config.js` out of the new app path.
- n8n workflow validation remains static and local. No live workflow
  import, export, activation, or execution is part of Phase 1.
- Deployment env readiness, active catalogue workspace bootstrap, migration
  conventions, RLS strategy, and safety boundaries are documented.

## Deferred work

- Product persistence.
- Category, product, and product image mutation routes.
- Product image uploads.
- Supabase Storage wiring.
- Conversation persistence.
- Message persistence.
- Admin/auth UI.
- Supabase Cloud connection.
- Vercel deployment and deployment config.
- Production seed data.
- Service-role runtime reads or writes.
- Browser Supabase client code.
- Internal SaaS chat runtime, RAG/vector work, streaming, billing, and public
  SaaS onboarding.

## Non-goals still active

- Do not treat the disabled chat/product scaffolds as implemented persistence.
- Do not treat fake/sample seed fixtures as production seed data.
- Do not treat docs-only SQL examples as migrations or executed deployment
  changes.
- Do not use browser input to choose the catalogue workspace.
- Do not expose n8n URLs or Supabase env values to browser-facing code.
- Do not add service-role runtime paths without a separate approved design.

## What must not be mistaken as complete

- Deployment is not complete.
- Supabase Cloud connection is not complete.
- Production data bootstrap is not complete.
- Admin identity, membership resolution, and product write authorization are
  not complete.
- Chat privacy, retention, identity, and transcript access decisions are not
  complete.
- Supabase Storage ownership, path, bucket, and RLS policy decisions are not
  complete.
- The current in-process throttles are not a distributed abuse-control system.

## Risks if someone jumps to deployment too early

- Missing `catalogue_public_workspace_config` would intentionally make the
  catalogue fall back to shell data instead of DB-backed public rows.
- A mismatched catalogue workspace or quote workspace could expose the wrong
  business boundary to the public site.
- A browser-visible n8n webhook or public Supabase variable would bypass the
  first-party server boundary.
- Trusted client IP headers can be spoofed unless the deployment edge
  overwrites them.
- Quote throttling is in-process and should not be treated as final
  production abuse protection.
- Product writes without admin/auth boundaries would create an unreviewed
  mutation surface.
- Message persistence without privacy, identity, and retention decisions would
  store sensitive conversation data prematurely.

## Validation commands that define green

The current green contract for Phase 1 closeout is:

```bash
cd website && npm test
cd website && npm run typecheck
cd website && npm run build
npm run validate:supabase-migrations
npm run test:supabase-migrations
npm run test:supabase-rls
npm run validate:n8n
npm run test:n8n-validation
git diff --check
```

`npm run test:supabase-rls` is local-only and Docker-only. It must remain a
disposable database check, not a Supabase Cloud operation.

## Exact next decision points for Phase 2

- Decide whether Phase 2 begins with operational deployment/Supabase Cloud
  preparation or with admin/auth design.
- Approve the real active catalogue workspace and quote workspace before any
  DB-backed public environment is enabled.
- Approve admin identity, membership, route/action boundaries, and audit
  expectations before product writes.
- Approve privacy, identity, retention, and admin transcript access before
  conversation/message writes.
- Approve media ownership, bucket/path conventions, and Storage RLS before
  product image uploads.

## Recommended Phase 2 sequencing

1. Start with the deployment/Supabase Cloud path only if the operator review
   can complete env placement, active workspace config, quote workspace, n8n
   server-only webhook, trusted proxy headers, and smoke-test checks.
2. Start admin/auth/product management before any category, product, or product
   image writes.
3. Start Storage/product media only after media ownership and policy design is
   approved.
4. Start conversation/message persistence only after privacy, identity, and
   retention decisions are approved.
5. Start internal SaaS chat/RAG only after the data and privacy boundaries it
   depends on are stable.
