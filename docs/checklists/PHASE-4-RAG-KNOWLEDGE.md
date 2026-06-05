# Phase 4 Checklist: RAG, Knowledge, And Vector Work

Runtime vector/retrieval work is not approved for implementation yet. Phase
2G-B approves only the local search-index outbox table and disabled
server-only contract foundation.

Current SKR keeps Pinecone/n8n as current RAG workflow context only. Do not
migrate away from Pinecone in this repo yet, and do not add Pinecone runtime
code or credentials in this Phase 2G-B PR.

## Phase 2G-A RAG Search-Index Governance

- [x] Dedicated RAG/search-index architecture plan records Supabase/listing data as canonical and Pinecone as a future derived search index only.
- [x] Future sync is documented as an outbox/worker pattern, not a direct admin-save-to-Pinecone call.
- [x] Future sync governance requires stable IDs, `content_hash`, idempotency, retries, auditability, replayability, and delete-or-hide handling for archived/unpublished sources.
- [x] Future public retrieval governance requires workspace, visibility, status, source type, and category metadata filters.
- [x] Reranking is documented as a future retrieval quality layer.
- [x] Hybrid search is documented as a later decision gate if exact term recall is weak.
- [x] Search-index records must exclude admin-only notes, internal notes, customer-visible internal notes, transcript content, raw provider payloads, webhooks, headers, cookies, tokens, credentials, and secrets unless a later approved phase explicitly allows a safe subset.
- [x] No Pinecone runtime code, package dependency, env read, n8n workflow/runtime change, or `/api/chat` retrieval wiring is added.

## Phase 2G-B Local Search-Index Outbox Foundation

- [x] Implement local `search_index_jobs` and `search_index_documents` tables as queue/document tracking foundations only.
- [x] Enable fail-closed RLS and revoke browser-role table access without public policies.
- [x] Reject unsafe search-index metadata keys for provider debug, trace dumps, secrets, service-role material, webhooks/headers, transcript content, internal notes, and customer contact/payment identifiers.
- [x] Add idempotency/source lookup constraints and indexes for future queue processing without blocking failed-job retries.
- [x] Add a server-only disabled/injected TypeScript contract boundary with no live executor.
- [x] Confirm no Pinecone runtime code, package dependency, env read, executor, n8n workflow/runtime change, or `/api/chat` retrieval wiring is added.

## Future Runtime Work

- [ ] Implement sync workers.
- [ ] Implement Pinecone upsert/delete/retrieval/reranking runtime.

## Directional Scope

- [ ] Define knowledge source model.
- [ ] Add document upload/import.
- [ ] Add document parsing.
- [ ] Add chunking.
- [ ] Add embeddings.
- [ ] Decide vector DB.
- [ ] Default to Supabase pgvector first.
- [ ] Add Pinecone adapter only if scale or retrieval quality requires.
- [ ] Add retrieval evaluation.
- [ ] Add citation/source tracking.
- [ ] Add knowledge sync jobs.
- [ ] Add tenant isolation for knowledge sources.

## Guardrails

- [ ] Not part of Phase 1.
- [ ] Do not add vector DB infrastructure without a phase approval.
- [ ] Do not migrate Pinecone in this repo yet.
- [ ] Do not add Pinecone credentials.
- [ ] Do not expose private documents across tenants.
