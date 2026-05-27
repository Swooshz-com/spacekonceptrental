# Phase 2 Readiness Plan

Phase 2 is not approved by this document. This plan ranks the safest next
tracks, names their prerequisites, and keeps the remaining forbidden work
visible before anyone adds new runtime features.

## Recommendation

Do not start product writes before admin/auth boundaries.

Do not start message persistence before privacy/identity/retention decisions.

Do not deploy before env, active workspace config, quote workspace, n8n
server-only webhook, and smoke tests are reviewed.

Do not add Storage before media ownership/path/policy design is approved.

Browser Supabase remains forbidden unless separately approved.

Service-role runtime paths remain forbidden unless separately approved.

## Safety-ranked tracks

### A. Deployment/Supabase Cloud path

Rank: first only when the goal is to make the existing Phase 1 foundation real
in a reviewed environment.

What it unlocks:

- Real DB-backed public catalogue reads for the active workspace.
- Real first-party quote capture into Supabase.
- Server-side n8n provider calls from the deployed app without browser webhook
  exposure.

Required prerequisites:

- Approved Supabase Cloud project and reviewed server-only env placement.
- Reviewed `catalogue_public_workspace_config` row matching
  `CATALOGUE_WORKSPACE_ID`.
- Reviewed `QUOTE_WORKSPACE_ID`.
- Reviewed server-only n8n webhook configuration.
- Reviewed trusted proxy or CDN client IP headers for chat and quote
  throttling.
- Approved smoke-test checklist and rollback plan.

Main risks:

- Public env leaks.
- Wrong active catalogue workspace or quote workspace.
- n8n webhook exposure.
- Treating in-process rate limits as full production abuse protection.
- Enabling public traffic before smoke tests prove fallback and DB-backed
  paths.

Required tests/guards:

- Website tests, typecheck, and build.
- Supabase migration validation and local RLS tests.
- Static guards for forbidden public env names and service-role runtime paths.
- Post-deployment smoke tests for catalogue fallback, DB-backed catalogue
  reads, quote submission, chat safe fallback, and server-only n8n calls.

What should still be forbidden:

- Browser Supabase.
- Service-role runtime paths.
- Product/category/product image writes.
- Conversation/message writes.
- Production seed data unless separately approved.
- Vercel or Supabase changes outside the reviewed deployment lane.

Suggested first PR:

- Phase 2A-A adds the deployment smoke-test runbook, unchecked operator
  checklist, and deployment evidence template without deploying. The next PR in
  this track should still be reviewed separately and must obtain explicit
  approval before any real deployment, Supabase Cloud connection, Vercel config,
  or runtime change.

### B. Admin/auth/product management path

Rank: required before any product, category, or product image mutation work.

What it unlocks:

- Authenticated admin identity.
- Membership-scoped workspace resolution.
- Future category/product/product image mutation routes or server actions.
- Product audit and publishing controls.

Required prerequisites:

- Admin/auth architecture decision.
- Membership and role model approval.
- Workspace resolution rules for trusted admin requests.
- Mutation API or server-action design.
- Audit log expectations for product changes.

Main risks:

- Workspace confusion across tenants.
- Public mutation routes.
- Missing role checks.
- Unreviewed publishing flows.
- Service-role shortcuts that bypass RLS without a policy decision.

Required tests/guards:

- Auth and membership unit tests.
- RLS behavioural tests for admin member access.
- Static guards proving no public product mutation routes.
- Tests proving anon cannot write categories, products, or product images.
- Audit-log expectations for mutations once writes are approved.

What should still be forbidden:

- Product writes before admin/auth boundaries.
- Browser Supabase.
- Public category/product/product image mutation routes.
- Service-role runtime writes unless separately designed and approved.
- Product image upload flows until Storage policy is approved.

Suggested first PR:

- Phase 2B-A documents the admin/auth and membership authorization design with
  guard tests only. The next PR in this track should still avoid product
  writes and should implement only the reviewed server-only auth/membership
  boundary with anonymous, non-member, cross-workspace, and allowed-member
  tests.

### C. Conversation/message persistence path

Rank: after privacy, identity, retention, and transcript-access decisions.

What it unlocks:

- Durable conversation records.
- Durable user and assistant messages.
- Future admin inbox, transcript review, and support handoff workflows.
- Better analytics and support continuity.

Required prerequisites:

- Privacy and PII minimization model.
- Identity model for anonymous, authenticated, and admin-linked sessions.
- Retention and deletion rules.
- Transcript access and export rules.
- Idempotent write design across provider calls and retries.

Main risks:

- Storing sensitive chat content before governance exists.
- Linking anonymous visitors too strongly.
- Retaining transcripts longer than expected.
- Creating admin access before permissions are clear.
- Duplicating or reordering messages around provider failures.

Required tests/guards:

- Validation tests for allowed message fields and size limits.
- Persistence idempotency tests.
- RLS behavioural tests for conversation/message access.
- Privacy guards for redaction or minimization decisions.
- Static tests proving browser code cannot choose workspace or persistence
  scope.

What should still be forbidden:

- Message writes before privacy/identity/retention decisions.
- Admin transcript UI before access controls.
- Browser Supabase.
- Direct browser n8n calls.
- Service-role runtime writes unless separately approved.

Suggested first PR:

- Add the privacy, identity, retention, and transcript-access decision doc with
  non-failing static guards, without enabling writes.

### D. Supabase Storage/product media path

Rank: after admin/auth product management design, before real product image
upload work.

What it unlocks:

- Durable product image storage.
- Workspace-scoped media ownership.
- Future admin upload, replace, archive, and publish workflows.
- Cleaner separation between Git-tracked shell assets and business media.

Required prerequisites:

- Media ownership and workspace path design.
- Bucket naming and visibility decision.
- Storage RLS policy design.
- Image metadata write policy tied to product/admin authorization.
- Upload validation, size, type, and moderation decisions.

Main risks:

- Cross-workspace media exposure.
- Public uploads without admin checks.
- Broken links between Storage objects and product metadata.
- Treating Git-tracked design assets as the production media store.

Required tests/guards:

- Storage policy tests once local tooling is approved.
- Static guards proving no public upload routes.
- Product image metadata RLS and admin authorization tests.
- Tests for safe fallback when images are missing.

What should still be forbidden:

- Storage before media ownership/path/policy design.
- Public upload routes.
- Product image writes before admin/auth boundaries.
- Production media seed data unless separately approved.
- Browser Supabase unless separately approved.

Suggested first PR:

- Document bucket, path, ownership, and policy design for product media before
  adding Storage runtime code.

### E. Internal SaaS chat/RAG path

Rank: later, after the first-party app data boundaries and privacy model are
stable.

What it unlocks:

- Replacement of temporary n8n chat runtime behind the same `ChatProvider`
  contract.
- First-party retrieval, tool, and knowledge-source decisions.
- Future streaming and richer support workflows if approved.

Required prerequisites:

- Provider selection policy.
- Conversation/message privacy and retention decisions.
- Knowledge source, ingestion, chunking, embedding, and vector-store design.
- Evaluation and hallucination-control plan.
- Cost, abuse, and observability plan.

Main risks:

- Rebuilding RAG before basic deployment/admin/data boundaries are ready.
- Storing or retrieving private content without retention and access controls.
- Tight-coupling the frontend to one provider.
- Introducing external services without review.

Required tests/guards:

- Provider contract tests.
- Retrieval safety and grounding tests.
- No-direct-browser-provider tests.
- Evaluation fixtures for known product and policy answers.
- Cost and abuse guard tests once the runtime is concrete.

What should still be forbidden:

- Production `InternalSaasChatProvider` before approval.
- Vector DB or embedding service wiring before design approval.
- Browser-visible provider secrets or URLs.
- Conversation/message writes before privacy/identity/retention decisions.
- Live n8n replacement work in the same PR as unrelated deployment or admin
  work.

Suggested first PR:

- Write the internal provider and RAG architecture decision with evaluation
  requirements, without adding runtime provider code.
