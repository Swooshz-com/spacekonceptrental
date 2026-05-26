# Phase 4 Checklist: RAG, Knowledge, And Vector Work

This phase is not approved for implementation yet.

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
- [ ] Do not expose private documents across tenants.
