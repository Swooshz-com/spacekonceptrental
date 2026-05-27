# Phase 1 Checklist: Small MVP

Historical/closeout checklist. This records what Phase 1 completed and what it
intentionally deferred.

Deferred runtime work below points to the current Phase 2 checklists and remains unchecked.

Phase 1 is intentionally small. It is not approval to build the full SaaS
platform.

## Scope

- [ ] Start from a clean branch or explicitly separate unrelated local changes.
- [x] Scaffold Next.js under `website/`.
- [x] Make the app Vercel-ready.
- [x] Build public homepage shell using prepared assets.
- [x] Build catalogue shell using prepared assets.
- [x] Build product shell using prepared assets.
- [x] Build event shell using prepared assets.
- [x] Build quote shell using prepared assets.
- [x] Build custom `ChatWidget`.
- [x] Add `POST /api/chat` route contract.
- [x] Add server-only `ChatProvider` interface.
- [x] Add server-only `N8nChatProvider`.
- [x] Read `N8N_CHAT_WEBHOOK_URL` only from server-side env.
- [x] Read `N8N_CHAT_WEBHOOK_TIMEOUT_MS` only from server-side env.
- [x] Read `CHAT_PROVIDER=n8n` only from server-side env.
- [x] Add safe timeout and error normalization.
- [ ] Add retry policy if approved for live provider use.
- [x] Add idempotency via `clientMessageId`.
- [x] Add request ID for every chat request.
- [x] Document chat rate limiting with trusted client IP headers,
      per-session limiting, and fail-closed fallback bucket.
- [x] Add quote endpoint abuse throttling with trusted client IP headers,
      normalized-email throttling, and fail-closed fallback bucket.
- [x] Ensure no provider internals are exposed to the browser.
- [x] Ensure frontend calls `/api/chat` only.
- [x] Ensure browser output contains no n8n webhook URLs.
- [x] Ensure old static widget does not become a competing production path.
- [x] Keep MVP chat non-streaming.
- [x] Document chat persistence privacy/security design.
- [x] Add disabled server-only chat persistence scaffold.
- [x] Document product/admin persistence design.
- [x] Add disabled server-only product/admin persistence scaffold.
- [x] Add deployment/environment readiness contract without deployment.
- [x] Add Phase 1 closeout audit and Phase 2 readiness plan.
- [x] Reconcile checklist history/status without marking deferred runtime work
      complete.

## Basic Supabase Schema Only

Introduce only the tables needed for the MVP:

These table checks mean the base migration defines the table with
workspace-safe relationships where needed. They do not approve runtime use;
RLS policies, RLS/tenant tests, and server-only Supabase wiring are still
required first.

- [x] Document Supabase MVP schema plan.
- [x] Document RLS and tenant-isolation strategy.
- [x] Document safe future migration sequencing.
- [x] Document Supabase migration conventions.
- [x] Add static Supabase migration validation.
- [x] Add static tests for the real base schema migration.
- [x] `workspaces`.
- [x] `admin_users`.
- [x] `memberships`.
- [x] `categories`.
- [x] `products`.
- [x] `product_images`.
- [x] `quote_requests`.
- [x] `quote_request_items`.
- [x] `conversations`.
- [x] `messages`.
- [x] `usage_events`.
- [x] `audit_logs`.
- [x] Optional `integration_connections` for non-secret integration metadata
      only.
- [x] Add RLS policies.
- [x] Add static RLS policy migration coverage.
- [x] Add local-only behavioural RLS and tenant-isolation tests.
- [x] Add fake/sample catalogue seed fixtures only.
- [x] Add server-side Supabase runtime wiring.
- [x] Add public catalogue database reads.
- [x] Add trusted active-workspace catalogue RLS hardening strategy and proof
      scaffold.
- [x] Add quote persistence.
- [x] Add chat persistence design and server-only disabled scaffolding.
- [x] Add product/admin persistence design and server-only disabled
      scaffolding.
- [x] Harden direct anonymous catalogue RLS without breaking DB-backed
      catalogue reads.
- [x] Add active catalogue workspace bootstrap plan and local-only scaffold.
- [x] Add server-only deployment env readiness contract and docs-only env
      manifest.
- [ ] Add product persistence.
- [ ] Add category/product/product image mutation routes.
- [ ] Add product image uploads.
- [ ] Add Supabase Storage wiring.
- [ ] Add conversation persistence.
- [ ] Add message persistence.
- [ ] Connect to Supabase Cloud.
- [ ] Add deployment.

Future ownership:

- Deployment readiness now belongs to `PHASE-2A-DEPLOYMENT-READINESS.md`.
- Admin/auth readiness now belongs to `PHASE-2B-ADMIN-AUTH.md`.
- Runtime auth implementation now belongs to
  `PHASE-2B-AUTH-IMPLEMENTATION.md`.
- Product/category/product image writes remain blocked by the Phase 2 admin
  auth, RLS, audit, and route/action gates.

## Product And Media Seed Strategy

- [x] Document product/media seed strategy.
- [x] Use current prepared assets for the initial public-page visual shell.
- [x] Do not treat Git-tracked images as the long-term admin media store.
- [x] Plan Supabase Storage as the long-term product/media store.
- [x] Do not introduce broad product admin workflows in Phase 1.

## Tests

- [x] `/api/chat` validation tests.
- [x] `clientMessageId` idempotency tests.
- [x] Mocked n8n provider timeout/fallback tests.
- [x] Provider safe error mapping tests.
- [x] Frontend test proving chat UI posts only to `/api/chat`.
- [x] Test proving no n8n webhook URL appears client-side.
- [x] Provider selection tests for server-only `CHAT_PROVIDER`.
- [x] Browser-facing guard test against `@n8n/chat` and direct n8n webhook paths.
- [x] Rate-limit tests.
- [x] Rate-limit tests for trusted client IP buckets, per-session limiting, and
      fail-closed fallback bucket.
- [x] Quote endpoint abuse-throttling tests for trusted client IP buckets,
      normalized-email buckets, safe `429`, and fail-closed fallback bucket.
- [x] Supabase RLS/tenant-isolation tests before runtime use.
- [x] Supabase fake/sample seed fixture validation.
- [x] Server-only Supabase runtime boundary tests.
- [x] Server-only published catalogue read tests.
- [x] Trusted active-workspace catalogue RLS hardening strategy/proof guard
      tests.
- [x] Behavioural direct anonymous catalogue RLS hardening tests proving
      cross-workspace denial and configured active-workspace DB-backed reads.
- [x] Static guard tests for the active catalogue workspace bootstrap
      documentation and local-only SQL example.
- [x] Static guard tests for deployment/server env readiness and forbidden
      public env variables.
- [x] Static guard tests for Phase 1 closeout and Phase 2 readiness.
- [x] Server-only chat persistence scaffold guard tests.
- [x] Tests proving no chat Supabase writes are added in Phase 1I-A.
- [x] Server-only product/admin persistence scaffold guard tests.
- [x] Tests proving no product/category/product image Supabase writes are added
      in Phase 1J-A.
- [x] Keep `npm run validate:n8n` while n8n workflows remain in repo.
- [x] Keep `npm run test:n8n-validation` while n8n workflows remain in repo.

## Explicit Non-goals

- [ ] No full SaaS multi-tenant admin platform.
- [ ] No full RAG/knowledge ingestion.
- [ ] No production `InternalSaasChatProvider`.
- [ ] No pgvector/Pinecone implementation.
- [ ] No RAG/vector DB.
- [ ] No full admin inbox/human takeover suite.
- [ ] No admin/auth UI.
- [ ] No product/category/product image mutation routes.
- [ ] No product image upload flows.
- [ ] No inventory/pricing management.
- [ ] No product publishing approval workflows.
- [ ] No product audit log workflow.
- [ ] No service-role product write paths.
- [ ] No service-role runtime write paths.
- [ ] No production seed data.
- [ ] No authenticated user-linked conversations.
- [ ] No chat history review/search/export.
- [ ] No streaming/SSE.
- [ ] No Supabase Cloud connection.
- [ ] No Vercel deployment configuration.
- [ ] No browser Supabase client.
- [ ] No Supabase Storage wiring.
- [ ] No external anti-abuse service.
- [ ] No direct anonymous catalogue RLS hardening in Phase 1L-A.
- [ ] No large tool invocation dashboards.
- [ ] No large audit dashboards.
- [ ] No large usage dashboards.
- [ ] No billing.
- [ ] No public SaaS onboarding.
- [ ] No advanced embeddings/vector search.
