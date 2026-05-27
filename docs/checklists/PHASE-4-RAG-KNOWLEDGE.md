# Phase 4 Checklist: RAG, Knowledge, And Vector Work

This phase is not approved for implementation yet.

Current SKR keeps Pinecone/n8n as current RAG workflow context only. Do not
migrate away from Pinecone in this repo yet, and do not add Pinecone runtime
code or credentials in this checklist hygiene PR.

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
