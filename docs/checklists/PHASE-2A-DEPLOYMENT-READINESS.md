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

## Phase 2D-A Deployment Readiness Refresh

- [ ] Environment contract reviewed for public-safe client env, server-only app env, Supabase/project env, n8n/server-only webhook env, admin/auth/workspace env, and forbidden env exposure.
- [ ] `CATALOGUE_WORKSPACE_ID` reviewed before public traffic.
- [ ] `QUOTE_WORKSPACE_ID` reviewed before public traffic.
- [ ] `ADMIN_TRUSTED_WORKSPACE_ID` reviewed before public traffic.
- [ ] Listing media public bucket serving model reviewed as public-by-unguessable-server-generated-URL with metadata-gated catalogue rendering.
- [ ] Admin listing image upload smoke test planned.
- [ ] Admin quote inbox/status/internal note workflow smoke test planned.
- [ ] Atomic quote workflow RPC behaviour smoke test planned.
- [ ] Quote handoff from catalogue/detail to quote page smoke test planned.
- [ ] Static/fallback homepage smoke test planned.
- [ ] 404/error states smoke test planned.
- [ ] No provider/SQL/secret leakage review planned.
- [ ] No browser console exposure of server-only env values review planned.
- [ ] Rollback/disable plan reviewed for disabling public traffic, rotating leaked env values, disabling n8n webhook env, reverting deployment, fallback catalogue behaviour, and quote unavailable-or-safe behaviour.
- [ ] Operator evidence template prepared for the expanded smoke-test sequence.

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
