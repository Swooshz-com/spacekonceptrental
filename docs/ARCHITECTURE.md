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
persistence, and product-management writes are deferred.

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

Quote abuse throttling is also route-level and best-effort in Phase 1K-A.
`POST /api/quote` validates bounded JSON first, then applies in-process
throttling before quote persistence writes. It uses a trusted client IP bucket
only when `QUOTE_TRUSTED_CLIENT_IP_HEADER` names a forwarding header that the
deployment proxy or CDN overwrites; otherwise it uses a fail-closed fallback
bucket. Validated lowercase email is used as an additional contact bucket when
present. Throttled responses return a safe generic `429` with `retry-after`.
This does not replace future distributed CDN/WAF/platform abuse controls.

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
configuration, missing server-only `CATALOGUE_WORKSPACE_ID` configuration, or
read errors fall back to the existing public catalogue shell data so local
builds and tests do not require Supabase Cloud. Phase 1M-A moves those reads
behind the trusted active-workspace `get_public_catalogue` RPC. Runtime reads
still require trusted server-only `CATALOGUE_WORKSPACE_ID`, but direct
anonymous base-table catalogue reads are denied. It does not add browser
Supabase code, service-role keys, writes, product management, quote
persistence, conversation/message persistence, Supabase Storage delivery, or
deployment configuration.

Phase 1H-A adds only first-party quote request persistence. The browser posts
quote form data to `POST /api/quote`; the route validates bounded JSON and uses
a server-only quote repository to insert `quote_requests` and optional freeform
`quote_request_items` through the existing anon-key Supabase runtime. Missing
Supabase or server-only `QUOTE_WORKSPACE_ID` configuration fails safely. This
phase treats the request as received once the quote request row is captured; a
later item insert failure is handled without reporting a failed quote to the
browser. It does not add browser Supabase code, service-role keys,
product/admin writes, conversation/message persistence, n8n workflow changes,
Supabase Storage, or deployment configuration.

Phase 1I-A adds the chat persistence privacy/security design and disabled
server-only scaffolding only. `conversations` and `messages` are
privacy-sensitive future records, so chat persistence must remain behind
first-party server routes, use trusted server-side workspace resolution, avoid
unnecessary PII, and treat browser-provided session IDs only as untrusted
correlation hints. `clientMessageId` may support idempotency and deduplication
only; it must not authenticate a caller or authorize access to a conversation.
The scaffold under `website/lib/chat/persistence/` imports `server-only`, does
not import Supabase, and returns explicit skipped results. This phase does not
add Supabase reads or writes, migrations, service-role keys, browser Supabase
code, Supabase Cloud connection, n8n workflow changes, admin chat history
tools, RAG/vector DB, streaming/SSE, or authenticated user-linked
conversations. See `docs/CHAT-PERSISTENCE-DESIGN.md`.

Phase 1J-A adds the product/admin persistence design and disabled server-only
scaffolding only. Future category, product, and product image writes are
trusted-admin operations that must go through first-party server routes or
server actions after auth/admin membership boundaries exist. The scaffold under
`website/lib/products/persistence/` imports `server-only`, does not import
Supabase, and returns explicit skipped results. Public catalogue reads remain
read-only, published-only, and scoped by trusted server-only workspace
configuration. This phase does not add product/category/product image writes,
public mutation routes, admin/auth UI, Supabase Storage, product image upload
flows, service-role write paths, Supabase Cloud connection, browser Supabase
code, deployment configuration, or n8n workflow changes. See
`docs/PRODUCT-ADMIN-PERSISTENCE-DESIGN.md`.

Phase 1K-A adds only route-level quote endpoint abuse throttling. The existing
quote persistence boundary remains unchanged: accepted requests still use the
server-only quote repository and approved quote insert path, while throttled
requests stop before persistence. This phase does not add new Supabase
migrations, service-role writes, browser Supabase code, external anti-abuse
services, deployment configuration, admin/auth UI, product persistence,
conversation/message persistence, Supabase Storage, public catalogue behavior
changes, direct anonymous catalogue RLS hardening, or n8n workflow changes.

Phase 1L-A adds the trusted active-workspace catalogue RLS hardening strategy
and proof scaffold only. At that point, public catalogue runtime reads remained
server-only, used the anon Supabase key, and filtered by trusted server-side
`CATALOGUE_WORKSPACE_ID`. Direct anonymous catalogue RLS hardening stayed
deferred because removing anonymous catalogue `select` policies before a
non-breaking trusted read surface existed would have made configured DB-backed
catalogue reads return empty rows. See
`docs/SUPABASE-CATALOGUE-RLS-HARDENING.md`.

Phase 1M-A implements the non-breaking trusted active-workspace catalogue read
surface. The migration adds the private
`catalogue_public_workspace_config` singleton and the fixed-search-path
`get_public_catalogue(expected_workspace_id, product_slug)` RPC. The server-only
catalogue repository calls that RPC after resolving trusted
`CATALOGUE_WORKSPACE_ID`; the database returns rows only when that value matches
the active workspace config. Direct anonymous base-table reads for
`categories`, `products`, and `product_images` are tightened with
`alter policy ... using (false)`, while authenticated member policies remain
membership-scoped. This phase does not add Supabase Cloud connection, Supabase
CLI usage, deployment, browser Supabase, service-role keys, catalogue writes,
quote throttling changes, or n8n workflow changes.

Phase 1N-A adds only the active catalogue workspace bootstrap plan and
local-only SQL example under `docs/examples/supabase/`. It documents how a
future approved operator can set `catalogue_public_workspace_config` after
Supabase Cloud and deployment work are approved, and it keeps the missing-config
fallback to shell catalogue data explicit. This phase does not change catalogue
RLS or runtime behaviour from Phase 1M-A, add production seed data, connect to
Supabase Cloud, use service-role runtime writes, add browser Supabase code,
change quote throttling, add catalogue writes, or change n8n workflows.

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

Future provider-adjacent chat persistence must also be server-only. It must not
allow the browser to write directly to Supabase or call n8n directly.

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

`clientSessionId` is not trusted identity. `clientMessageId` is for
idempotency/deduplication only and must not be used for authentication or
authorization.

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
