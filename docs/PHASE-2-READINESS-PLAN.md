# Phase 2 Readiness Plan

Phase 2 is not approved by this document. This plan ranks the safest next
tracks, names their prerequisites, and keeps the remaining forbidden work
visible before anyone adds new runtime features.

Current quick status lives in `docs/PHASE-STATUS.md`. Checklist ownership and
maintenance rules live in `docs/checklists/README.md`.

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
- Actor-to-membership binding rules proving the role belongs to the active
  admin profile.
- Mutation API or server-action design.
- Audit log expectations for product changes.

Main risks:

- Workspace confusion across tenants.
- Public mutation routes.
- Missing role checks.
- Accepting a role from a membership that does not belong to the active admin
  user.
- Unreviewed publishing flows.
- Service-role shortcuts that bypass RLS without a policy decision.

Required tests/guards:

- Auth and membership unit tests.
- RLS behavioural tests for admin member access.
- Unit tests proving same-workspace memberships owned by another admin are
  denied.
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
  guard tests only. Phase 2B-B adds a pure server-only authorization policy
  module and tests from explicit inputs, without real auth, routes, server
  actions, or product writes. Phase 2B-C adds the server-only auth/membership
  resolver contract and disabled scaffold, still without runtime wiring.
  Phase 2B-D adds server-only adapter contracts and dependency-injected
  resolver tests with fake adapters only, without cookies, headers, real auth,
  routes, server actions, or product writes. Phase 2B-E documents the preferred
  future Supabase Auth provider, server-only session/cookie expectations, CSRF
  expectations, login/logout route gates, protected admin page gates, and auth
  implementation checklist without runtime wiring. Phase 2B-F reconciles
  checklist ownership/status and adds a quick phase status page without runtime
  wiring. The next PR in this track should still avoid product writes and should implement only the reviewed
  server-side auth/membership resolution boundary with anonymous, non-member,
  wrong-actor membership, cross-workspace, and allowed-member tests.

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

- Phase 2E-A adds the privacy, identity, retention, deletion/export,
  transcript-access, admin-visibility, idempotency, and redaction governance
  doc with static guards, without enabling writes.
- Phase 2E-B follows with the local conversation/message schema and RLS
  foundation only, without runtime transcript writes, transcript reads, admin
  transcript UI, customer accounts, public quote tracking, notifications, CRM,
  n8n/Pinecone runtime changes, SaaS chatbot runtime work, deployment,
  browser Supabase, service-role runtime paths, or `website/chat-config.js`
  access.
- Phase 2E-C follows with the server-only TypeScript persistence contract,
  validation/minimisation helpers, safe command shaping, and fake/injected
  adapter tests only, without wiring runtime transcript writes or reads.
- Phase 2E-D follows with the server-only transcript persistence RPC/adapter
  boundary, including a local ungranted SQL/RPC contract and an injected
  TypeScript executor adapter only, without wiring runtime transcript writes or
  reads.
- Phase 2E-E follows with transcript persistence activation governance and
  executor approval gates only, after the Phase 2E-D hotfix rejects conflicting
  `clientMessageId` reuse and hardens malformed runtime input validation,
  without adding a live executor or wiring `/api/chat`.
- Phase 2E-F follows with transcript lifecycle governance and
  retention/deletion/export readiness only, after PR #103 records the
  activation governance baseline, without adding deletion/export runtime paths,
  retention cleanup jobs, transcript reads, admin transcript UI, customer
  accounts, or public transcript/quote access.
- Phase 2E-G follows with transcript audit/evidence model and operator runbook
  readiness only, after PR #104 records the lifecycle governance baseline,
  without adding audit/evidence storage, runtime writers, production evidence,
  deletion/export runtime paths, retention cleanup jobs, transcript reads,
  admin transcript UI, customer accounts, or public transcript/quote access.
- Phase 2E-H follows with transcript audit/evidence local schema, RLS, and
  server-only contract foundation only, after PR #105 records the
  audit/evidence readiness baseline, without wiring `/api/chat`, runtime
  transcript writes or reads, audit/evidence runtime writers, deletion/export
  runtime paths, retention cleanup jobs, a live Supabase RPC executor,
  service-role runtime paths, browser Supabase, admin transcript UI,
  production evidence, customer accounts, or public transcript/quote access.
- Phase 2E-I follows with transcript audit/evidence server-only insert
  boundary only, after PR #106 records the local schema/RLS and contract
  foundation, without wiring `/api/chat`, admin UI, deletion/export/retention
  runtime paths, live Supabase service-role execution, browser grants, browser
  Supabase, production evidence, or ecommerce flows. Product language remains
  enquiry/quote/request.

Current Phase 2O-A/B status:

- PR #119 merged Phase 2N-A/B server runtime configuration hardening and
  deploy dry-run harness at merge commit
  `ad97aace9c2145af139a45f3e0f2d0b6d09a24a9`.
- Latest completed capability is Phase 2N-A/B server runtime configuration
  hardening and deploy dry-run harness.
- Phase 2O-A/B is current as preview deployment approval package and operator
  evidence template work.
- `docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md` records the future approval
  packet for reviewer checks, validation, dry-run commands, Supabase Cloud
  review, Vercel review, server-only env setup by variable name, admin access,
  public listing/quote smoke checks, rollback/abort checks, and final
  go/no-go decision capture.
- Redacted templates under `docs/templates/` are template-only and state that
  filled production evidence, screenshots containing secrets, and real env
  values must not be committed.
- `npm run validate:preview-approval-package` validates the approval packet
  and static scope without deployment, Docker, real env values, or live
  provider connections.
- No deployment, deployment approval, Vercel config, Supabase Cloud config,
  real env values, production evidence, browser Supabase, service-role runtime
  paths, n8n/Pinecone/RAG runtime work, public quote tracking, customer
  accounts, customer-visible internal notes, notifications, CRM integration,
  public/customer upload routes, transcript runtime paths, or ecommerce flow
  is added.

Previous Current Phase 2N-A/B status:

- PR #118 merged Phase 2M-A/B preview/deployment review preflight and CI
  parity hardening at merge commit
  `a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489`.
- Latest completed capability is Phase 2M-A/B preview/deployment review
  preflight and CI parity hardening.
- Phase 2N-A/B is current as server runtime configuration hardening and deploy
  dry-run harness work.
- Existing server-only runtime settings now have a typed parser and safe
  public summary that reports only names/reasons, not values.
- `npm run validate:deploy-dry-run` runs the release-candidate gate plus local
  server-runtime config and static scope checks without deployment.
- The repo is better prepared for a future preview/deployment review, but no
  deployment is performed in this PR.
- No n8n/Pinecone/RAG runtime work, public quote tracking, customer accounts,
  customer-visible internal notes, notifications, CRM integration,
  public/customer upload routes, browser Supabase, service-role runtime paths,
  deployment config, Supabase Cloud config, real env values, production
  evidence, or ecommerce flow is added.

Previous Current Phase 2M-A/B status:

- PR #117 merged Phase 2L-A/B release-candidate acceptance suite and final
  MVP polish at merge commit
  `aceee2ded00aee41b4e20197091f8527d9e8f8b7`.
- Latest completed capability is Phase 2L-A/B release-candidate acceptance
  suite and final MVP polish.
- Phase 2M-A/B is current as preview/deployment review preflight and CI parity
  hardening.
- Pull-request CI now includes the full release-gate command set where
  practical: website tests, typecheck, build, Supabase migration validation,
  Supabase migration tests, Docker-backed Supabase RLS/schema tests, and
  `git diff --check`.
- `npm run validate:release-candidate` is the local convenience gate for the
  same release-candidate command set and fails loudly when Docker is not
  available for the RLS/schema suite.
- `docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md` records the future
  preview/deployment review checklist, environment inventory, workspace ID
  review, Supabase Cloud review, admin access review, public quote/listing
  smoke checklist, and rollback/abort checklist.
- The repo is better prepared for a future preview/deployment review, but no
  deployment is performed in this PR.
- No n8n/Pinecone/RAG runtime work, public quote tracking, customer accounts,
  customer-visible internal notes, notifications, CRM integration,
  public/customer upload routes, browser Supabase, service-role runtime paths,
  deployment config, Supabase Cloud config, real env values, production
  evidence, or ecommerce flow is added.

Previous Current Phase 2L-A/B status:

- PR #116 merged Phase 2K-A/B admin write-boundary hardening and deployment
  readiness at merge commit
  `0bf12dad7255ce667cdbfbdc86c27b59abaac4bc`.
- Latest completed capability is Phase 2K-A/B admin write-boundary hardening
  and deployment readiness.
- Phase 2L-A/B is current as release-candidate acceptance suite and final MVP
  polish.
- Release-candidate acceptance coverage now ties together public homepage,
  listings, listing detail, categories, catalogue compatibility, quote/enquiry
  submission, safe not-found states, protected admin operations, admin quote
  detail separation, admin write-boundary preservation, quote workflow
  preservation, and final static/security boundary checks.
- Public catalogue/quote UX, admin operations, quote workflow, and admin write
  boundary are covered by local deterministic checks.
- The repo is ready for a future preview/deployment review, but no deployment
  is performed in this PR.
- Supabase remains canonical for website/admin listing and quote data.
  Pinecone remains a future derived index only.
- No n8n/Pinecone/RAG runtime work, public quote tracking, customer accounts,
  customer-visible internal notes, notifications, CRM integration,
  public/customer upload routes, browser Supabase, service-role runtime paths,
  deployment config, Supabase Cloud config, or ecommerce flow is added.

Previous Current Phase 2K-A/B status:

- PR #115 merged Phase 2J-A/B MVP hardening, quote intake correctness, and
  demo readiness at merge commit
  `611ef1eafee5971b1d60929d17ab41a94a357522`.
- Latest completed capability is Phase 2J-A/B MVP hardening, quote intake
  correctness, and demo readiness.
- Phase 2K-A/B is current as admin write-boundary hardening and deployment
  readiness.
- Direct authenticated browser-role writes to `categories`, `products`,
  `product_images`, and product audit inserts are blocked.
- Admin listing/category/image writes remain on the protected
  `execute_admin_product_write(...)` RPC path and still preserve product audit
  plus local search-index enqueue invariants.
- Quote workflow writes remain on `execute_admin_quote_workflow(...)`; public
  quote creation remains on the first-party public quote boundary.
- Public catalogue reads remain on the public-safe `get_public_catalogue(...)`
  boundary and display only published listing/category/image data.
- Deployment/demo readiness docs and smoke-test runbooks are refreshed without
  deployment, production secrets, real evidence artifacts, Vercel config,
  Supabase Cloud config, browser Supabase, service-role runtime paths,
  Pinecone/n8n/RAG runtime work, public quote tracking, customer accounts,
  notifications, CRM, uploads, or ecommerce flows.

Previous Current Phase 2J-A/B status:

- PR #114 merged Phase 2I-A/B public rental catalogue and quote request UX MVP
  at merge commit `6bf9202df80fbfac995ee168dceea0ef7c26edfa`.
- Latest completed capability is Phase 2I-A/B public rental catalogue and
  quote request UX MVP.
- Phase 2J-A/B is current as MVP hardening, quote intake correctness, and demo
  readiness.
- Public quote/enquiry customer messages are preserved safely as customer
  submitted message data, separate from item notes and admin-only internal
  notes.
- Admin quote detail uses a protected dedicated server-only read path for one
  quote request, requested items, customer message, and internal activity.
- Public users still cannot track quotes or view internal quote workflow state.
- Supabase remains canonical for website/admin listing and quote data, while
  Pinecone remains a future derived index only.
- No Pinecone runtime, n8n runtime, `/api/chat` retrieval/RAG wiring,
  public/customer upload route, browser Supabase, service-role runtime path,
  notification/CRM integration, customer account, public quote tracking, or
  ecommerce flow is added.

Previous Current Phase 2I-A/B status:

- PR #113 merged Phase 2H-A/B protected admin operations UI MVP at merge
  commit `dbf59c1250e22956162475284dcbe94899f50c4b`.
- Latest completed capability is Phase 2H-A/B protected admin operations UI
  MVP.
- Phase 2I-A/B is current as the public rental catalogue and quote request UX
  MVP.
- Public homepage, listing browse/detail, category browsing, and quote/enquiry
  handoff are improved using existing public-safe catalogue reads and public
  quote request submission boundaries.
- Public users only see published public-safe listing/category/image data.
- Public quote/enquiry submission does not expose internal quote workflow
  state, public quote tracking, customer accounts, or admin internal notes.
- Supabase remains canonical for website/admin listing and quote data, while
  Pinecone remains a future derived index only.
- No Pinecone runtime, n8n runtime, `/api/chat` retrieval/RAG wiring,
  public/customer upload route, browser Supabase, service-role runtime path,
  notification/CRM integration, customer account, or ecommerce flow is added.

Previous Current Phase 2H-A/B status:

- PR #112 merged Phase 2G-C/D server-only local search-index enqueue
  integration at merge commit
  `116f3761032b2af23e2bc240a77b6e810f45e918`.
- Latest completed capability is Phase 2G-C/D server-only local search-index
  enqueue integration.
- Phase 2H-A/B is current as the protected admin operations UI MVP.
- The MVP splits the protected admin shell into focused listing, category,
  media, quote request, and quote detail surfaces without adding new auth,
  browser Supabase, service-role, deployment, Pinecone, or n8n runtime paths.
- Listing/category/listing-image writes keep using the existing first-party
  admin routes and `execute_admin_product_write` boundary, which preserves the
  Phase 2G-C/D local search-index enqueue behavior.
- Quote workflow review, status changes, and internal notes keep using the
  existing protected admin quote route and `execute_admin_quote_workflow` RPC.
- Public quote tracking, customer-visible internal notes, notifications, CRM,
  customer accounts, customer/public upload routes, and ecommerce flows remain
  blocked.

Previous Current Phase 2G-C/D status:

- PR #111 merged Phase 2G-B local search-index outbox foundation at merge
  commit `f73c7c5515d3e5242975280b25edf28cbc25f96b`.
- Latest completed capability is the Phase 2G-B local search-index outbox
  foundation.
- Phase 2G-C/D is current as server-only local search-index enqueue
  integration only.
- The current local integration adds a narrow authenticated
  `enqueue_search_index_job` RPC and keeps direct `search_index_jobs` and
  `search_index_documents` table access fail-closed for browser roles.
- Existing admin listing, category, and listing-image metadata writes enqueue
  local outbox jobs after successful database writes. Supabase/listing data
  remains canonical, and Pinecone remains a future derived search index only.
- The server-only TypeScript boundary adds a Supabase enqueue adapter and pure
  safe job builders, but no search-index document writer or live external
  executor.
- No Pinecone runtime code, Pinecone package, Pinecone env read, Pinecone
  executor, API key, n8n workflow/runtime change, `/api/chat` retrieval wiring,
  embedding runtime, sync worker, runtime reranking, hybrid search runtime,
  public/customer upload route, customer account, public quote tracking,
  customer-visible internal note, notification, CRM integration, or ecommerce
  flow is added.
- Future sync worker/retrieval/reranking/hybrid runtime requires explicit
  owner approval.

Previous metadata diagnostic denylist hotfix status:

- PR #109 merged Phase 2G-A RAG search-index architecture and sync governance
  at merge commit `02a16bdfd938841ddeac408f4d204d455050f714`.
- The metadata diagnostic denylist hotfix restores provider debug and trace dump
  key rejection in the shared SQL transcript metadata helper and TypeScript
  audit/evidence contract only.
- It preserves Phase 2E-H and Phase 2E-I metadata hardening.
- It adds no transcript runtime writes or reads, no live Supabase executor, no
  admin transcript UI, no Pinecone/n8n runtime changes, no customer/public
  quote tracking functionality, and no ecommerce functionality.

Previous Current Phase 2G-A status:

- PR #108 merged Phase 2F-A admin rental listing/media foundation at merge
  commit `8385ac2d925b5edd44cdf016707bb2cd00d67264`.
- Phase 2F-A is complete as a server-only listing-facing domain contract and
  injected adapter foundation only.
- Phase 2G-A is current as RAG/search-index architecture and sync governance
  docs/static-guard work only.
- Supabase/listing data remains canonical for website/admin listing data,
  quote/enquiry request workflows, workspace ownership, and admin audit trails.
- Pinecone is a future derived search index only and must not become
  canonical business storage.
- Future listing/category/image changes can later enqueue search-index sync
  jobs through an outbox/worker pattern, not direct admin-save-to-Pinecone
  calls.
- Future sync must be idempotent, retryable, auditable, replayable, and safe
  for admin listing writes when Pinecone or network dependencies fail.
- Future retrieval/reranking must be server-only, apply workspace/visibility/
  status/source metadata filters, and require explicit owner approval before
  any runtime wiring.
- No Pinecone runtime code, Pinecone package, Pinecone env read, API key,
  n8n workflow/runtime change, `/api/chat` retrieval wiring, embedding
  runtime, search-index table, sync worker, runtime reranking, or hybrid
  search runtime is added.
- Existing `categories`, `products`, and `product_images` tables remain the
  technical persistence internals. New TypeScript/domain names use listing
  wording where practical and map into the existing product persistence
  boundary.
- No new Supabase migration, public upload route, customer upload route, live
  Supabase executor, browser Supabase, service-role runtime path, deployment
  config, customer account, public quote tracking, customer-visible internal
  notes, notification, CRM integration, or ecommerce/cart/checkout/order flow
  is added.
- `/api/chat` remains unwired to transcript audit/evidence writes or reads.
- Product wording remains listing/enquiry/quote/request in new user-facing and
  domain surfaces.

Previous Current Phase 2F-A status:

- PR #107 merged Phase 2E-I transcript audit/evidence server-only insert
  boundary at merge commit `0f114c3085917f80afab2a5a2b8d30d90596b66f`.
- Phase 2E-I is complete as local ungranted RPC and server-only injected
  adapter work only.
- Phase 2F-A was current as a server-only listing-facing admin domain
  foundation for rental/event furniture listing metadata and listing image
  metadata.
- Existing `categories`, `products`, and `product_images` tables remain the
  technical persistence internals. New TypeScript/domain names use listing
  wording where practical and map into the existing product persistence
  boundary.
- No new Supabase migration, public upload route, customer upload route, live
  Supabase executor, browser Supabase, service-role runtime path, deployment
  config, customer account, public quote tracking, customer-visible internal
  notes, notification, CRM integration, or ecommerce/cart/checkout/order flow
  is added.
- `/api/chat` remains unwired to transcript audit/evidence writes or reads.
- Product wording remains listing/enquiry/quote/request in new user-facing and
  domain surfaces.

Previous Current Phase 2E-I status:

- PR #106 merged Phase 2E-H transcript audit/evidence local schema, RLS, and
  server-only contract foundation at merge commit
  `8607e16d3c405df0797ec08536cce79f1b4f68d2`.
- Phase 2E-H is complete as local schema/RLS and server-only contract
  foundation only.
- Phase 2E-I was current as a server-only local/test-only insert boundary only.
- Local `insert_transcript_audit_event` and
  `insert_transcript_evidence_record` RPCs are defined for validated
  audit/evidence rows and explicitly ungranted to browser roles.
- The TypeScript audit/evidence RPC adapter maps validated commands into an
  injected executor only. It does not instantiate Supabase, read env, read
  cookies or headers, call `.rpc`, use browser Supabase, or read
  `website/chat-config.js`.
- `/api/chat` remains unwired to transcript audit/evidence writes or reads.
- Admin transcript UI remains blocked.
- Transcript deletion/export runtime paths remain blocked.
- Retention cleanup jobs remain blocked.
- Live Supabase service-role execution remains blocked.
- Browser grants and browser Supabase remain forbidden.
- Production evidence files remain blocked.
- Runtime transcript writes remain blocked.
- Runtime transcript reads remain blocked.
- Product wording remains enquiry/quote/request, not ecommerce/cart/checkout.

Previous Current Phase 2E-H status:

- PR #105 merged Phase 2E-G transcript audit/evidence model and operator
  runbook readiness at merge commit
  `a59547130c33ec56e275dfdee48ceac9a1f8587f`.
- Phase 2E-G is complete as audit/evidence model and operator runbook
  readiness only.
- Phase 2E-H is current as local schema/RLS and server-only contract
  foundation only.
- The new local `transcript_audit_events` and `transcript_evidence_records`
  tables are workspace-scoped, RLS-enabled, ungranted to browser roles, and
  policy-free until a future reviewed server-side access path exists.
- The new `website/lib/chat/audit/` contract is server-only, dependency
  injected, disabled by default, and contains no Supabase client, env, cookie,
  header, RPC, service-role, browser Supabase, or `website/chat-config.js`
  path.
- `/api/chat` remains unwired to transcript audit/evidence.
- Audit/evidence runtime writers remain blocked.
- Production evidence files remain blocked.
- Runtime transcript writes remain blocked.
- Runtime transcript reads remain blocked.
- Admin transcript UI remains blocked.
- Customer accounts remain blocked.
- Public quote tracking remains blocked.
- Notifications remain blocked.
- CRM integration remains blocked.
- n8n/Pinecone runtime changes remain blocked.
- SaaS chatbot runtime work remains blocked.
- Deployment remains blocked.
- Browser Supabase remains forbidden.
- Service-role runtime paths remain forbidden.
- `website/chat-config.js` access remains forbidden.

Previous Current Phase 2E-G status:

- PR #104 merged Phase 2E-F transcript lifecycle governance and
  retention/deletion/export readiness at merge commit
  `49bb60131af99a0a3829a536eb5d29575218a442`.
- Phase 2E-F is complete as lifecycle governance/readiness only.
- Phase 2E-G is current as audit/evidence model and operator runbook readiness
  only.
- Future audit/evidence implementation must define owner-approved event types,
  safe field categories, forbidden evidence content, redaction policy,
  operator approval capture, local SQL/RLS proof, static guard proof,
  rollback/disable controls, evidence template completion, failure triage, and
  post-action verification before runtime writers or production evidence exist.
- Future audit/evidence rows must never copy full transcript content, raw
  provider payloads, n8n workflow payloads, webhook URLs, raw headers, cookies,
  tokens, API keys, private keys, secrets, service-role material, or
  customer-visible internal notes.
- Audit/evidence runtime writers remain blocked.
- Production evidence files remain blocked.
- Runtime transcript writes remain blocked.
- Runtime transcript reads remain blocked.
- Admin transcript UI remains blocked.
- Customer accounts remain blocked.
- Public quote tracking remains blocked.
- Notifications remain blocked.
- CRM integration remains blocked.
- n8n/Pinecone runtime changes remain blocked.
- SaaS chatbot runtime work remains blocked.
- Deployment remains blocked.
- Browser Supabase remains forbidden.
- Service-role runtime paths remain forbidden.
- `website/chat-config.js` access remains forbidden.

Previous Current Phase 2E-F status:

- PR #103 merged the Phase 2E-D hotfix and Phase 2E-E transcript persistence
  activation governance at merge commit
  `72a85eedfcd30da26e716f95973785cb1408760b`.
- Phase 2E-E is complete as activation governance and executor approval gates
  only.
- Phase 2E-F is current as lifecycle governance/readiness only.
- Future lifecycle implementation must define retention/deletion/export owner
  approval, data classification, admin access approval, audit event model
  approval, evidence template approval, rollback/disable controls, local
  SQL/RLS proof, and static guard proof before runtime implementation.
- The existing `conversations` and `messages` tables now have the local schema
  and RLS foundation needed for a future reviewed persistence path.
- Direct anonymous/public and authenticated client reads and writes are denied
  by RLS.
- The server-only transcript persistence contract and validation boundary are
  now defined behind injected adapter dependencies only.
- The local transcript persistence RPC boundary is defined for validated
  trusted-workspace conversation/message batches and remains ungranted to
  anonymous/public and authenticated browser roles.
- Phase 2E-D hotfix coverage now proves exact duplicate
  `clientMessageId` retries return the original message ID, while changed
  content, changed request ID, or changed metadata rejects with
  `transcript_client_message_id_conflict`.
- Phase 2E-D hotfix coverage now proves malformed JSON-like transcript command
  inputs return safe rejected results instead of throwing validation
  exceptions.
- The server-only RPC adapter maps the validated command into an injected
  executor payload only; it does not instantiate Supabase, read env, read
  cookies/headers, or use `website/chat-config.js`.
- The default persistence adapter remains unavailable.
- No live Supabase RPC executor exists yet.
- Future live executor work requires explicit owner approval, a reviewed
  privilege model, service-role/browser separation, failure redaction,
  idempotency proof, audit/evidence requirements, rollback/disable controls,
  and tests before `/api/chat` can use it.
- Trusted workspace IDs are server-owned inputs; anonymous session hashes are
  correlation only; `clientMessageId` is idempotency/deduplication only.
- Validation rejects invalid workspace IDs, unsafe server-generated IDs,
  invalid message role/type pairs, oversized content, oversized metadata, and
  unsafe metadata keys before any adapter can run.
- Runtime transcript writes remain blocked.
- Runtime transcript reads remain blocked.
- Admin transcript UI remains blocked.
- Customer accounts remain blocked.
- Public quote tracking remains blocked.
- Notifications remain blocked.
- CRM integration remains blocked.
- n8n/Pinecone runtime changes remain blocked.
- SaaS chatbot runtime work remains blocked.
- Deployment remains blocked.
- Browser Supabase remains forbidden.
- Service-role runtime paths remain forbidden.
- `website/chat-config.js` access remains forbidden.

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

Current direction: this track now means a separate SaaS chatbot/RAG
project/app boundary, not SaaS chatbot app code inside the SKR repo.

Rank: later, after the first-party app data boundaries and privacy model are
stable.

What it unlocks:

- A separate SaaS chatbot project/app that SKR can later use as its first
  client/tenant.
- Replacement of the temporary SKR n8n/Pinecone bridge through a reviewed
  server-side boundary.
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
- Forcing the current n8n/Pinecone workflow into the future SaaS architecture.
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

- SaaS chatbot app code inside this repo.
- Pinecone migration inside this repo.
- Production `InternalSaasChatProvider` before approval.
- Vector DB or embedding service wiring before design approval.
- Browser-visible provider secrets or URLs.
- Conversation/message writes before privacy/identity/retention decisions.
- Live n8n replacement work in the same PR as unrelated deployment or admin
  work.

Suggested first PR:

- Write the separate SaaS chatbot boundary and RAG architecture decision with
  evaluation requirements, without adding runtime provider code.
