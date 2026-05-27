# Phase 2A Checklist: Deployment Readiness

Phase 2A-A is deployment-prep only. Keep every real deployment, Supabase Cloud,
and Vercel item unchecked until a future deployment PR has explicit current
approval and real operator evidence.

Auth implementation details belong in `PHASE-2B-AUTH-IMPLEMENTATION.md`.
This checklist may cross-link auth/admin blockers, but it must not duplicate
auth implementation steps.

## Operator Review

- [ ] Supabase Cloud project selected and reviewed.
- [ ] Server-only Supabase env placement reviewed.
- [ ] No `NEXT_PUBLIC_SUPABASE_*` variables added.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` runtime path added.
- [ ] Active catalogue workspace selected.
- [ ] `catalogue_public_workspace_config` row reviewed.
- [ ] Quote workspace selected.
- [ ] Server-only n8n webhook reviewed.
- [ ] Trusted proxy/client IP header strategy reviewed.
- [ ] Catalogue fallback smoke test planned.
- [ ] DB-backed catalogue smoke test planned.
- [ ] Quote submission smoke test planned.
- [ ] Chat fallback smoke test planned.
- [ ] Server-only n8n smoke test planned.
- [ ] Rollback plan reviewed.
- [ ] Deployment evidence template prepared.
- [ ] Explicit approval obtained before real deployment.

## Still Deferred

- [ ] Actual deployment.
- [ ] Vercel project config.
- [ ] Vercel deployment.
- [ ] Supabase Cloud connection.
- [ ] Production seed data.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase client code.
- [ ] Product/category/product image writes.
- [ ] Conversation/message writes.
- [ ] Supabase Storage wiring.
- [ ] Admin/auth UI.
- [ ] Internal SaaS chat/RAG implementation.
- [ ] n8n workflow import, export, activation, execution, or mutation.
