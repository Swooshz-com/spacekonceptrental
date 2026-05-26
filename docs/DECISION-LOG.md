# Decision Log

## 2026-05-26: Vercel/Next.js Direction

Decision: `website/` becomes the future Next.js app root deployed by Vercel.

Reason: the public site needs a first-party app and API boundary instead of a
static direct-n8n demo architecture.

## 2026-05-26: Supabase System Of Record

Decision: Supabase becomes the system of record for products, quote requests,
conversations, messages, auth, storage, RLS, and tenant-ready boundaries.

Reason: the future site and SaaS chatbot need durable business data outside
n8n and Google Sheets.

## 2026-05-26: n8n Temporary Provider

Decision: n8n remains a temporary server-side chat provider and automation
integration layer.

Reason: the existing workflow can support Phase 1 while the app owns the public
API boundary.

## 2026-05-26: Custom Chat UI And `/api/chat`

Decision: long-term production chat uses custom UI that calls first-party
`POST /api/chat`.

Reason: the browser must not depend on n8n webhooks or the n8n chat widget.

## 2026-05-26: Provider Adapter Pattern

Decision: use a server-only `ChatProvider` interface with `N8nChatProvider` now
and `InternalSaasChatProvider` later.

Reason: provider swap should not require a frontend rewrite.

## 2026-05-26: Phase 1 Narrowed Deliberately

Decision: Phase 1 is limited to Next.js scaffold, public page/catalogue shell,
custom chat UI, `/api/chat`, server-only provider boundary, `N8nChatProvider`,
safe errors, basic Supabase schema, and tests.

Reason: Phase 1 must not become a full SaaS/RAG/admin rebuild.

## 2026-05-26: No Direct Browser-to-n8n

Decision: browser-to-n8n direct calls are not part of the long-term app.

Reason: direct calls expose n8n as the runtime boundary and make future
migration harder.

## 2026-05-26: MVP Non-streaming

Decision: MVP chat is non-streaming.

Reason: the current workflow is non-streaming and streaming/SSE should not
become a Phase 1 frontend dependency.

## 2026-05-26: Deferred Work

Decision: full SaaS admin, RAG, internal chatbot runtime, vector DB,
streaming/SSE, billing, and public SaaS onboarding are deferred.

Reason: these belong to later phases and require separate approval.

## 2026-05-26: Local Chat Config Must Not Be Reused

Decision: `website/chat-config.js` must never be read, printed, copied,
migrated, committed, or used as source for the new app.

Reason: it is gitignored and may contain a local real webhook URL.

## 2026-05-26: Server-only Provider Selection

Decision: Phase 1 chat provider selection reads server-only `CHAT_PROVIDER`.
Unset, empty, and `n8n` use `N8nChatProvider`; unknown values fail through the
safe provider-unavailable `/api/chat` response.

Reason: provider selection must not create browser-visible n8n configuration or
revive the old static n8n chat path as a production route.

## 2026-05-27: Fail-closed Chat Rate-limit Fallback

Decision: public chat rate limiting uses `clientSessionId` for per-session
limits, a trusted client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER`
names a proxy/CDN-overwritten header, and a server-side fallback bucket when no
trusted client IP source is available.

Reason: user-supplied forwarding headers are spoofable, but relying only on
attacker-controlled `clientSessionId` lets callers bypass the public chat cap
by rotating sessions. The fallback bucket fails closed until deployment
configures a trusted client IP header.

## 2026-05-27: Local-only Supabase RLS Behaviour Tests

Decision: behavioural RLS and tenant-isolation coverage runs against a
throwaway local Docker database with fake fixtures and a minimal
Supabase-compatible auth role surface.

Reason: the project needs executable proof for the committed RLS policies
before runtime Supabase use, without linking to Supabase Cloud, adding
credentials, deploying, or introducing app-side Supabase wiring.
