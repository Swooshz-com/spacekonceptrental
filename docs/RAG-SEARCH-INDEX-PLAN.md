# RAG Search-Index Plan

Phase 2G-A defines architecture and governance only. It does not add runtime
Pinecone code, Pinecone packages, env reads, secrets, API keys, n8n workflow
changes, embedding runtime, search-index tables, sync workers, reranking
runtime, hybrid search runtime, or `/api/chat` retrieval wiring.

## Source Of Truth

Supabase/listing data remains canonical for website and admin business data.
The existing Supabase-backed listing/category/image model is the source of
truth for rental/event furniture listings, quote/enquiry request workflows,
workspace ownership, and admin audit trails.

Pinecone is a future derived search index only. It must not become canonical
business storage, must not be used as the source of record for listing state,
and must not block admin listing writes when Pinecone or a network dependency
is unavailable. Future admin listing writes must not be blocked by Pinecone
or network failures.

Future Pinecone upsert, delete, retrieval, reranking, and hybrid search work
requires explicit owner approval in a separate runtime phase. Future
implementation must be server-only, access-controlled, observable, and tested
before it is wired to any public or admin path.

## Document Model

Future search documents should use stable source records rendered from safe
Supabase data. Candidate source types are:

- `listing`
- `category`
- `policy`
- `faq`
- `document`
- `listing_image_alt_text`

Suggested logical fields:

- `workspace_id`
- `source_type`
- `source_id`
- `source_version` or `content_hash`
- `visibility`
- `status`
- `title`
- `text`
- `category`
- `source_url` only when safe
- `updated_at`

Suggested Pinecone metadata should stay flat and minimal:

- Workspace and environment namespace identifiers.
- Source type and source ID.
- Source version or `content_hash`.
- Public-safe `visibility`, such as `public_chat`.
- Publication status, category, and safe source URL when allowed.

Metadata and indexed text must contain no secrets, private keys, raw provider
payloads, webhooks, headers, cookies, tokens, credentials, admin-only notes,
internal notes, customer-visible internal notes, private quote workflow data,
or customer contact/payment identifiers. No transcript content may be indexed
unless a later approved transcript phase explicitly allows it with a reviewed
privacy, retention, redaction, and access-control model.

Public chatbot retrieval must only use public-safe visibility, such as
`public_chat`. Future admin-only retrieval, if ever added, must be separately
approved, access-controlled, audited, and isolated from public retrieval.

Pinecone namespaces must isolate environment/workspace. Stable IDs, also
described as stable IDs in sync checks, plus `content_hash` must prevent
duplicate vector junk when a source is re-rendered or retried.

## Sync Lifecycle

Search-index sync should use an outbox/worker pattern, not direct
admin-save-to-Pinecone calls.

Future lifecycle:

1. A listing, category, or listing image metadata change is committed in
   Supabase.
2. The write path enqueues a search-index job in a durable outbox.
3. A server-only worker loads the canonical Supabase source record.
4. The worker renders public-safe searchable text.
5. The worker computes a stable `content_hash`.
6. If the rendered content is unchanged, the worker skips upsert.
7. If the content changed, the worker embeds and upserts the derived document.
8. If the source is archived, unpublished, or deleted, the worker must delete
   or mark invisible the corresponding public retrieval record.
9. The worker records success, failure, retry count, timestamps, and the
   source/version processed.

Future sync must be idempotent, retryable, auditable, and replayable. Failed
sync jobs must not roll back or block admin listing writes. The retrieval
experience is eventually consistent, so admin UI copy must not promise instant
chatbot updates after a listing save.

Archived, unpublished, deleted, or otherwise non-public listings must be
deleted from, or hidden in, public retrieval.

## Retrieval And Reranking Lifecycle

Future retrieval should stay server-only and approval-gated.

Future lifecycle:

1. Classify whether the request has a search/retrieval intent.
2. Apply metadata filters for workspace, visibility, status, source type,
   category, and event/listing type where available.
3. Retrieve a broader candidate set, for example top 30-50.
4. Apply reranking as a future retrieval quality layer.
5. Select a smaller grounded context set, for example top 5-8.
6. Deduplicate and group results by source.
7. Generate an answer with citations or source references.
8. Refuse, ask a clarifying question, or fall back when retrieval confidence is
   weak.

Hybrid search is a later decision gate if exact term recall is weak. That gate
must evaluate whether lexical search, keyword filters, or a blended retrieval
strategy is needed before adding runtime implementation.

`/api/chat` remains unwired from retrieval/RAG in Phase 2G-A.

## Non-Goals

Phase 2G-A does not implement:

- Pinecone SDK usage.
- Pinecone executor code.
- Pinecone env vars or secret placeholders.
- Pinecone package dependencies.
- Embedding model runtime.
- Search-index tables.
- Sync worker jobs.
- n8n workflow edits.
- `/api/chat` retrieval wiring.
- Admin UI changes.
- Real data ingestion.
- Real vector upsert/delete.
- Runtime reranking.
- Hybrid search runtime.
- Ecommerce flows.
- Public/customer uploads.
- Customer accounts.
- Public quote tracking.
- Customer-visible internal notes.
- Notifications.
- CRM integration.
