# SpaceKonceptRental Architecture

## Overview

SpaceKonceptRental is moving from a capstone static/demo website toward a
Vercel-hosted Next.js app under `website/`, with Supabase as the system of
record and n8n hidden behind a server-side provider adapter during the MVP.

Long-term chat flow:

```text
Browser -> Custom ChatWidget -> POST /api/chat -> ChatProvider
                                             -> N8nChatProvider now
                                             -> InternalSaasChatProvider later
```

The browser must never call n8n directly in the long-term app.

## System Boundaries

- Next.js is the browser-facing app and first-party API boundary.
- Supabase stores business data, auth state, media, conversation data, and
  tenant-ready records.
- n8n is a temporary server-side integration and automation layer.
- The future internal SaaS chatbot service replaces n8n as the chat runtime
  through the same provider contract.

## Vercel / Next.js Responsibilities

The future `website/` Next.js app owns:

- Public site pages.
- Catalogue and product browsing.
- Quote cart and quote request UX.
- Admin UI later.
- Route handlers and server actions.
- `POST /api/chat`.
- Server-only chat provider selection.
- Request validation.
- Rate limiting.
- Safe error normalization.
- Server-side Supabase access.
- Server-only n8n webhook access.

Current Phase 1 public route shells are `/`, `/catalogue`,
`/catalogue/lounge-sofa-package`, `/events`, and `/quote`. They use static
placeholder content and prepared assets only; real product persistence, event
persistence, and Supabase-backed catalogue data are deferred.

The browser must receive only safe normalized responses. It must not receive
provider trace IDs, webhook URLs, n8n errors, n8n node names, or stack traces.

Chat rate limiting uses `clientSessionId` for every request and uses a trusted
client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER` names a forwarding
header that the deployment proxy or CDN overwrites. The API must not trust
user-supplied forwarding headers by default. When no trusted client IP source
is configured or present, the route uses a server-side fallback bucket as a
fail-closed public chat cap so rotating `clientSessionId` cannot bypass rate
limits. Deployments should configure a trusted client IP header to avoid
over-broad fallback throttling.

## Supabase Responsibilities

Supabase is the system of record for:

- Database records.
- Auth.
- Storage.
- Product data.
- Product media metadata.
- Quote requests and quote items.
- Conversations and messages.
- Usage events and audit logs.
- RLS and tenant isolation where schema is introduced.

Supabase service-role keys must never be exposed to the browser.

Phase 1E records the planned Supabase schema, RLS strategy, product/media seed
strategy, and migration sequencing in:

- `docs/SUPABASE-MVP-SCHEMA.md`.
- `docs/SUPABASE-RLS-STRATEGY.md`.
- `docs/PRODUCT-MEDIA-SEED-STRATEGY.md`.

Phase 1G-A adds only the server-side Supabase runtime foundation under
`website/lib/supabase/`. It reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` only
from server-side environment variables, returns an explicit disabled result
when those variables are missing, and keeps `@supabase/*` out of browser-facing
app code. It does not connect to Supabase Cloud, add a browser Supabase client,
use service-role keys, read catalogue data from the database, persist products,
quotes, conversations, or messages, or add deployment configuration.

Phase 1G-B adds only server-side public catalogue reads under
`website/lib/catalogue/` for published `categories`, published `products`, and
`product_images` metadata attached to published products. Missing Supabase env
or read errors fall back to the existing public catalogue shell data so local
builds and tests do not require Supabase Cloud. It does not add browser
Supabase code, service-role keys, writes, product management, quote
persistence, conversation/message persistence, Supabase Storage delivery, or
deployment configuration.

## n8n Responsibilities

n8n remains temporary server-side integration only:

- `N8nChatProvider` backend for Phase 1 responses.
- Notifications.
- Gmail/Sheets sync.
- Escalations.
- Workflow automation.

n8n is not the browser-facing app boundary. The old static `@n8n/chat` demo may
remain only as temporary legacy reference outside the production Next.js path.
Browser-facing app code must not import `@n8n/chat`, read n8n webhook env vars,
or reference n8n webhook URLs.

Phase 1B added server-only `N8nChatProvider` plumbing behind `POST /api/chat`.
Phase 1C selects the provider with server-only `CHAT_PROVIDER`. Unset, empty,
and `n8n` select `N8nChatProvider`; unknown values fail with the same safe
provider-unavailable response as other provider failures. Tests use mocked
fetch responses only. Real webhook configuration, deployment, and live n8n
testing remain deferred.

## Future Internal SaaS Chatbot Responsibilities

The future `InternalSaasChatProvider` should:

- Replace n8n as the chat runtime.
- Implement the same provider contract used by `N8nChatProvider`.
- Keep the frontend unchanged during provider swap.
- Use Supabase-backed products, conversations, messages, and future knowledge
  data when those phases are approved.
- Leave n8n as an optional notifications/integration layer.

## Provider Boundary Requirements

Every provider request must support:

- `requestId`.
- Timeout.
- Safe retry policy.
- Idempotency via `clientMessageId`.
- Safe error mapping.
- Normalized fallback message.
- No provider trace IDs exposed to browser.
- No webhook URLs exposed to browser.
- No n8n errors or internals exposed to browser.

Provider implementations are server-only.

Provider selection is also server-only. Phase 1 supports only
`CHAT_PROVIDER=n8n`; do not add `NEXT_PUBLIC_CHAT_PROVIDER`,
`NEXT_PUBLIC_N8N_*`, or any browser-visible n8n provider configuration.

## Chat API Contract

### Request Shape

```json
{
  "conversationId": "uuid-or-omitted-on-first-message",
  "clientSessionId": "anonymous-browser-uuid",
  "clientMessageId": "uuid-for-idempotency",
  "message": {
    "role": "user",
    "content": "I need 20 stools for an event"
  },
  "context": {
    "pagePath": "/catalogue/bar-stools",
    "pageType": "catalogue",
    "productId": "optional-product-id",
    "categorySlug": "optional-category",
    "quoteDraftItems": [
      { "productId": "uuid", "quantity": 20 }
    ]
  },
  "capabilities": {
    "stream": false
  },
  "locale": "en-SG",
  "timezone": "Asia/Singapore"
}
```

### Response Shape

```json
{
  "conversationId": "uuid",
  "assistantMessageId": "uuid",
  "status": "completed",
  "reply": {
    "role": "assistant",
    "content": "Thanks. Could you share the event date, venue, and rental duration?",
    "quickReplies": [],
    "actions": []
  },
  "rateLimit": {
    "remaining": 5,
    "resetAt": "2026-05-26T12:00:00.000Z"
  }
}
```

### Error Shape

```json
{
  "error": {
    "code": "PROVIDER_UNAVAILABLE",
    "message": "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up."
  },
  "requestId": "safe-request-id"
}
```

Expected error categories include `VALIDATION_FAILED`, `RATE_LIMITED`,
`PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, and `CHAT_ERROR`.

## Streaming

MVP chat is non-streaming. The provider interface may be streaming-capable later,
but streaming and SSE are not Phase 1 requirements and must not become frontend
dependencies in Phase 1.

## Local Config Rule

Never use `website/chat-config.js` as source for the new app. It is gitignored
and may contain a local real webhook URL.

The new app must read the n8n webhook URL only from server-side environment
variables such as `N8N_CHAT_WEBHOOK_URL`. The browser must never receive that
value.

## Security Posture

- No service-role keys in browser.
- RLS is assumed where Supabase schema is introduced.
- Browser never calls n8n directly.
- Secrets, webhook URLs, `.env`, `.n8n-local/`, `.tmp/`, credential bindings,
  runtime payloads, and local config files must not be committed or exposed.
