# Checklist Maintenance

This directory keeps phase status honest. Checklists are status surfaces, not
permission slips for implementation.

## Folder split

- Narrative plans, roadmaps, status summaries, and decision docs stay in `docs/`.
- Checkbox/status trackers stay in `docs/checklists/`.
- `docs/PHASE-2-READINESS-PLAN.md` is intentionally outside `docs/checklists/` because it is a sequencing/strategy plan, not a checklist.
- `docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md` is inside checklists because it is a checkbox readiness tracker.

## Checklist ownership

- `PHASE-0-PLANNING.md` is the historical planning checklist.
- `PHASE-1-MVP.md` is the historical Phase 1 closeout checklist.
- `PHASE-2-ADMIN-OPS.md` is the admin and product operations planning
  checklist.
- `PHASE-2A-DEPLOYMENT-READINESS.md` is the deployment readiness checklist.
- `PHASE-2B-ADMIN-AUTH.md` is the admin/auth readiness checklist.
- `PHASE-2B-AUTH-IMPLEMENTATION.md` is the future auth implementation checklist.
- `PHASE-2E-CONVERSATION-GOVERNANCE.md` is the privacy, identity, retention,
  deletion/export, transcript access, admin visibility, idempotency, redaction,
  and schema/RLS foundation checklist for future conversation/message
  persistence.
- `PHASE-3-INTERNAL-CHATBOT.md` is future chatbot direction only. Current SKR
  should keep the n8n/Pinecone workflow as a temporary bridge, and any future
  SaaS chatbot should be a separate project/app.
- `PHASE-4-RAG-KNOWLEDGE.md`, `PHASE-5-SAAS.md`, and
  `PHASE-6-BILLING-LAUNCH.md` are future guardrail checklists only.

## Maintenance rules

- Every phase PR that changes status must update exactly the relevant checklist(s).
- Do not duplicate the same item across checklists unless one entry is a cross-link or reference.
- Do not mark planned or scaffolded work complete as runtime complete.
- Completed design/scaffold/policy work must be named as design/scaffold/policy, not as implementation.
- Runtime blockers must remain unchecked until the runtime actually exists and tests prove it.
- Deployment, Supabase Cloud, production config, live n8n, Pinecone migration,
  SaaS chatbot, browser Supabase, service-role runtime paths, auth runtime,
  admin UI, protected admin pages, and product/category/product image writes
  must stay unchecked until explicitly implemented and validated in the
  approved phase.
