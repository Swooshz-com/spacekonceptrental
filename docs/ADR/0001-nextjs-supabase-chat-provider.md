# ADR 0001: Next.js, Supabase, And Chat Provider Boundary

## Status

Accepted.

## Context

The existing website plan assumed static HTML, direct n8n/widget usage, direct
n8n form submission, and custom chat only in a later phase. That plan is stale.

Browser-to-n8n direct chat would make the future SaaS chatbot migration harder
because the frontend would depend on n8n as the runtime boundary. The project
needs a first-party API boundary so n8n can be removed or reduced later without
a frontend rewrite.

## Decision

- Use Vercel and Next.js for the future `website/` app.
- Use Supabase as the system of record.
- Use first-party `POST /api/chat`.
- Use a provider adapter pattern.
- Use n8n only as a temporary server-side provider/integration.
- Keep MVP chat non-streaming.
- Keep Phase 1 deliberately small.

## Rejected Alternatives

- Static HTML as the final architecture.
- Browser-to-n8n direct chat as the final architecture.
- n8n widget as the long-term production UI.
- Building the full SaaS/RAG/admin platform in Phase 1.
- Implementing `InternalSaasChatProvider` in Phase 1.
- Implementing pgvector, Pinecone, or vector search in Phase 1.
- Implementing streaming/SSE in Phase 1.

## Consequences

- More planning is required before implementation.
- The migration path is cleaner.
- n8n can be removed or reduced later without a frontend rewrite.
- Supabase schema must be introduced carefully with RLS and tenant boundaries.
- Phase 1 work must stay narrow and should not become the full SaaS platform.
