# Phase 1 Checklist: Small MVP

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
- [x] Ensure no provider internals are exposed to the browser.
- [x] Ensure frontend calls `/api/chat` only.
- [x] Ensure browser output contains no n8n webhook URLs.
- [x] Ensure old static widget does not become a competing production path.
- [x] Keep MVP chat non-streaming.

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
- [ ] Add seed data.
- [x] Add server-side Supabase runtime wiring.
- [ ] Add public catalogue database reads.
- [ ] Add product persistence.
- [ ] Add quote persistence.
- [ ] Add conversation/message persistence.
- [ ] Add deployment.

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
- [x] Supabase RLS/tenant-isolation tests before runtime use.
- [x] Server-only Supabase runtime boundary tests.
- [x] Keep `npm run validate:n8n` while n8n workflows remain in repo.
- [x] Keep `npm run test:n8n-validation` while n8n workflows remain in repo.

## Explicit Non-goals

- [ ] No full SaaS multi-tenant admin platform.
- [ ] No full RAG/knowledge ingestion.
- [ ] No production `InternalSaasChatProvider`.
- [ ] No pgvector/Pinecone implementation.
- [ ] No full admin inbox/human takeover suite.
- [ ] No streaming/SSE.
- [ ] No large tool invocation dashboards.
- [ ] No large audit dashboards.
- [ ] No large usage dashboards.
- [ ] No billing.
- [ ] No public SaaS onboarding.
- [ ] No advanced embeddings/vector search.
