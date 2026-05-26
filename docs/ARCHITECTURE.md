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
- Chat provider selection.
- Request validation.
- Rate limiting.
- Safe error normalization.
- Server-side Supabase access.
- Server-only n8n webhook access.

The browser must receive only safe normalized responses. It must not receive
provider trace IDs, webhook URLs, n8n errors, n8n node names, or stack traces.

Chat rate limiting uses `clientSessionId` for every request and uses a client
IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER` names a forwarding header
that the deployment proxy overwrites. When that trusted header is not
configured or absent, the API must not trust spoofable forwarding headers and
must not place all callers into one shared fallback IP bucket.

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

## n8n Responsibilities

n8n remains temporary server-side integration only:

- `N8nChatProvider` backend for Phase 1 responses.
- Notifications.
- Gmail/Sheets sync.
- Escalations.
- Workflow automation.

n8n is not the browser-facing app boundary. The old static `@n8n/chat` demo may
remain only as temporary legacy reference until replaced.

Phase 1B adds server-only `N8nChatProvider` plumbing behind `POST /api/chat`.
Its tests use mocked fetch responses only. Real webhook configuration,
deployment, and live n8n testing remain deferred.

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
