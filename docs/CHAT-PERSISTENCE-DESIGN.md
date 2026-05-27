# Chat Persistence Design

Phase 1I-A defines the future chat persistence boundary and adds only disabled
server-only scaffolding. It does not persist conversations or messages.

## Current Phase Boundary

- `conversations` and `messages` are privacy-sensitive records.
- No browser-side Supabase writes are approved for chat.
- No browser-side n8n calls are approved for chat.
- Chat persistence must go through first-party server routes only.
- `POST /api/chat` remains the browser-facing boundary.
- n8n remains a temporary provider behind the server-side `ChatProvider`
  interface.
- The disabled scaffold under `website/lib/chat/persistence/` imports
  `server-only`, does not import Supabase, and returns explicit skipped results.
- No Supabase migration, RLS policy, database read, database write,
  service-role write, Supabase Cloud connection, or Supabase CLI action is part
  of Phase 1I-A.

## Future Data Model

`conversations` should store only metadata needed to continue or review a chat:

- trusted `workspace_id`
- generated conversation identifier and public reference
- a non-reversible client session hash if session correlation is needed
- optional future quote request link
- status and timestamps

`messages` should store normalized chat messages:

- trusted `workspace_id`
- trusted `conversation_id`
- role
- content
- provider name
- `client_message_id`
- server `request_id`
- timestamp

Future persistence must avoid storing unnecessary PII. Do not store raw provider
debug payloads, n8n internals, webhook URLs, trace IDs, user agent strings,
forwarding headers, IP addresses, or tool traces unless a later privacy review
approves a specific field and retention rule.

## Identity And Idempotency

Client-provided session IDs are untrusted correlation hints. They must not be
treated as user identity, workspace identity, admin identity, or authorization.

`clientMessageId` may be used only for idempotency and deduplication. It must
not authenticate the browser, authorize access to a conversation, or prove that
the caller owns a prior message.

Authenticated user-linked conversations remain deferred until auth and admin
workflows are approved.

## Workspace Resolution

Workspace must be resolved from trusted server-side configuration or a future
trusted host/workspace mapping. Browser-provided workspace identifiers must not
be accepted for anonymous chat writes.

The current scaffold models a trusted workspace input for future repository
work, but Phase 1I-A does not resolve workspaces for chat persistence and does
not write chat records.

## Server Route And Provider Flow

The long-term production path remains:

```text
Custom ChatWidget -> POST /api/chat -> ChatProvider
                                -> N8nChatProvider now
                                -> InternalSaasChatProvider later
```

Future chat persistence must sit behind the first-party server boundary. The
browser should continue to call only `/api/chat`, and provider selection must
remain server-only. No `NEXT_PUBLIC_` n8n variables, browser-visible n8n URLs,
browser Supabase client code, or `NEXT_PUBLIC_SUPABASE_*` variables are part of
the chat path.

## Deferred Work

- Actual conversation persistence.
- Actual message persistence.
- Retention, deletion, and audit policy.
- Admin review, search, and export of chat history.
- RAG/vector DB.
- Streaming/SSE.
- Authenticated user-linked conversations.
- Internal SaaS chatbot runtime storage.
- Supabase Storage wiring.
