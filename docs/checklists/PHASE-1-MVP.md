# Phase 1 Checklist: Small MVP

Phase 1 is intentionally small. It is not approval to build the full SaaS
platform.

## Scope

- [ ] Start from a clean branch or explicitly separate unrelated local changes.
- [x] Scaffold Next.js under `website/`.
- [x] Make the app Vercel-ready.
- [x] Build public homepage shell using prepared assets.
- [x] Build catalogue shell using prepared assets.
- [ ] Build product shell using prepared assets.
- [ ] Build event shell using prepared assets.
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
- [x] Document trusted client IP header behavior for chat rate limiting.
- [x] Ensure no provider internals are exposed to the browser.
- [x] Ensure frontend calls `/api/chat` only.
- [x] Ensure browser output contains no n8n webhook URLs.
- [x] Ensure old static widget does not become a competing production path.
- [x] Keep MVP chat non-streaming.

## Basic Supabase Schema Only

Introduce only the tables needed for the MVP:

- [ ] `tenants` or `workspaces`.
- [ ] `admin_users`.
- [ ] `memberships`.
- [ ] `categories`.
- [ ] `products`.
- [ ] `product_images`.
- [ ] `quote_requests`.
- [ ] `quote_request_items`.
- [ ] `conversations`.
- [ ] `messages`.
- [ ] `usage_events`.
- [ ] `audit_logs`.
- [ ] Optional `integration_connections` for non-secret integration metadata
      only.

## Product And Media Seed Strategy

- [ ] Use current prepared assets for the initial public-page visual shell.
- [ ] Do not treat Git-tracked images as the long-term admin media store.
- [ ] Plan Supabase Storage as the long-term product/media store.
- [ ] Do not introduce broad product admin workflows in Phase 1.

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
- [x] Rate-limit tests for missing trusted IP config and session-bucket churn.
- [ ] Supabase RLS/tenant-isolation tests when schema is introduced.
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
