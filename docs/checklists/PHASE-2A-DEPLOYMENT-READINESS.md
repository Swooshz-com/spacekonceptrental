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

## Phase 2D-B Post-readiness Reconciliation

- [x] Phase status records Phase 2D-A as the latest completed capability with PR #97 and merge commit `e04444a41a8993758bb00d6be234c255abb1ff9b`.
- [x] Remaining-work map separates completed phases, safe next phases, approval-blocked phases, and phases too broad or risky to bundle.
- [x] Deployment evidence template asks future PR authors to include the remaining-work map and largest-safe-bundle rationale.
- [x] Static guard coverage checks post-PR-97 status and stale storage/upload blocker wording.
- [x] No deployment, Vercel config, Supabase Cloud config, production env, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, or ecommerce flow is added.

## Still Deferred

- [ ] Actual deployment.
- [ ] Vercel project config.
- [ ] Vercel deployment.
- [ ] Supabase Cloud connection.
- [ ] Production seed data.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase client code.
- [ ] Product/category/product image writes outside approved admin route-gated boundaries.
- [ ] Conversation/message writes.
- [ ] Supabase Storage usage outside the approved admin-controlled `listing-media` workflow.
- [ ] Admin/auth UI outside approved protected admin boundaries.
- [ ] Customer uploads and arbitrary public upload routes.
- [ ] Public quote status tracking, customer-visible internal notes, notifications, or CRM integration.
- [ ] Internal SaaS chat/RAG implementation.
- [ ] n8n workflow import, export, activation, execution, or mutation.
