# SKR Production Dependency And Local Fallback Audit

Date: 2026-07-03

Branch: `codex/skr-production-dependency-audit`

Base inspected: `fd8680b442071d0f3144d0a34912b5565525963b`
(`main` after the first protected admin UI polish pass).

This is a docs-only production dependency and local-fallback audit for the SKR
owner MVP before hosted deployment. It does not change app runtime code, public
CSS, public layout, public copy, protected admin styling, quote API behaviour,
email handoff behaviour, Delivery Log behaviour, Supabase migrations,
auth/session behaviour, chat API, `website/chat-config.js`, catalogue/listing
detail implementation, product behaviour, or deployment/provider settings.

## Instruction Sources Used

- `AGENTS.md`
- `docs/agent-playbooks/INDEX.md`
- `docs/agent-playbooks/project-completion-audit.md`
- `docs/agent-playbooks/safety-gates.md`
- `docs/agent-playbooks/local-docs.md`
- `docs/agent-playbooks/git-completion.md`
- `docs/PHASE-STATUS.md`
- `docs/PHASE-ROADMAP.md`
- `docs/checklists/README.md`
- `docs/SAFETY-BOUNDARIES.md`
- `docs/DECISION-LOG.md`
- `docs/PROJECT-CONTEXT.md`
- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md`
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md`
- `docs/contracts/server-env-contract.json`
- Installed skill: `ai-agent-toolkit:self-hosted-service-safety`

`MEMORY.md` does not exist in this checkout.

## Audit Scope

The audited production target is Hostinger VPS plus Coolify for the
`website/` Next.js app, hosted Supabase for persisted app data and auth-bound
admin access, and Resend for owner quote enquiry email handoff. n8n remains
optional and integration-specific; it is not required for owner-MVP launch
unless separately approved.

The audit reviewed environment contracts, readiness validators, source paths
that can select local/demo/fallback content, hosted data dependencies, and
external-service boundaries. No live Hostinger, Coolify, Supabase Cloud, Resend,
n8n, DNS, SSH, Docker, deployment, or provider action was performed.

## Overall Finding

The required owner-MVP production dependency shape is mostly explicit and
server-side: hosted Supabase, hosted workspace records, protected owner/admin
membership records, reviewed public catalogue/setup/Hero content, quote
persistence and delivery-log tables, Resend sender/API setup, and Hostinger/
Coolify runtime env.

The key unresolved production fallback risk is the existing public demo-content
flag, `NEXT_PUBLIC_SKR_DEMO_CONTENT`. When set to `true`, it can enable demo
product/setup content in public catalogue/listing/quote surfaces. This is
acceptable for local or review-only exercises, but it must be absent or not
`true` in the hosted production environment. Treat it as a launch hold until a
manual env review confirms it is not enabled, and add validator coverage in a
later narrow PR if desired.

No local/demo/fallback dependency is approved for production by this audit.

## Production Dependency Matrix

| Dependency | Required before build | Required before deploy | Required before public traffic | Where configured | Validation command or evidence | Launch hold if missing | Local fallback allowed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `website/` Next.js app source and lockfile install | Yes | Yes | Yes | Repository checkout and Coolify app build settings | `cd website && npm run build`; Coolify build log | Yes | No |
| Hosted Supabase project endpoint | No | Yes | Yes | Coolify/server-side env: `SUPABASE_URL` | `npm run validate:production-security-readiness -- --launch` | Yes | No |
| Hosted Supabase anon key | No | Yes | Yes | Coolify/server-side env: `SUPABASE_ANON_KEY` | `npm run validate:production-security-readiness -- --launch` | Yes | No |
| Public catalogue workspace gate | No | Yes | Yes | `CATALOGUE_WORKSPACE_ID`; hosted `catalogue_public_workspace_config` row | Launch validator plus hosted Supabase row/content review | Yes | No |
| Quote workspace gate | No | Yes | Yes | `QUOTE_WORKSPACE_ID`; hosted quote workspace row | Launch validator plus safe live quote persistence test | Yes | No |
| Protected admin workspace gate | No | Yes | Yes | `ADMIN_TRUSTED_WORKSPACE_ID`; hosted owner/admin workspace membership rows | Launch validator plus protected admin sign-in/scope review | Yes | No |
| Admin origin/host/CSRF proof config | No | Yes | Yes | `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, `ADMIN_CSRF_PROOF_SECRET` | `npm run validate:production-security-readiness -- --launch`; protected admin smoke test | Yes | No |
| Quote email provider selector | No | Yes | Yes | `QUOTE_ENQUIRY_EMAIL_PROVIDER` in server-side env; set explicitly to `resend` for launch | `npm run validate:quote-email-runtime-readiness`; launch validator rejects unsupported values | Yes if unsupported; explicit missing value is a validator gap | No |
| Quote email recipient | No | Yes | Yes | `QUOTE_ENQUIRY_EMAIL_RECIPIENT` in server-side env | `npm run validate:production-security-readiness -- --launch`; `npm run validate:quote-email-runtime-readiness` | Yes | No |
| Quote email sender/from | No | Yes | Yes | `QUOTE_ENQUIRY_EMAIL_FROM` in server-side env and verified in Resend | Readiness commands plus Resend sender/domain review outside repo | Yes | No |
| Resend API key | No | Yes | Yes when provider is `resend` | `RESEND_API_KEY` as a server-side hosting secret only | Readiness commands; safe live quote verification | Yes | No |
| Approved Supabase migrations | No | Yes | Yes | Hosted Supabase deployment path outside repo | `npm run validate:supabase-migrations`; `npm run test:supabase-rls`; hosted migration-state review | Yes | No |
| Workspace records and memberships | No | Yes | Yes | Hosted Supabase `workspaces`, `admin_users`, and `memberships` data | Protected admin sign-in and workspace-scope review | Yes | No |
| Catalogue/listing/setup content | No | Yes | Yes | Hosted Supabase categories/products/product images and public catalogue config | Public `/catalogue`, `/listings`, and detail-route review | Yes if launch content is missing or unreviewed | No |
| Hero content | No | No | Yes | Hosted `homepage_hero_content` if managed Hero is expected | Public homepage review and protected Hero CMS review | Yes if the launch needs managed Hero content and it is missing/unreviewed | Static default visual fallback only |
| Listing media bucket and objects | No | Yes | Yes | Hosted Supabase Storage `listing-media` bucket and product image metadata | Public image review and protected media upload/metadata review | Yes if launch media is missing or broken | No local file storage fallback |
| Quote persistence | No | Yes | Yes | Hosted Supabase quote tables, policies, and `QUOTE_WORKSPACE_ID` | Safe live public `/quote` submission | Yes | No |
| Quote email Delivery Log | No | Yes | Yes | Hosted `quote_email_delivery_log` migration and policies | Safe live quote plus protected Delivery Log metadata review | Yes | No |
| Hostinger VPS and Coolify app | No | Yes | Yes | Hostinger/Coolify UI outside repo | Hosted runbook evidence; Coolify build/start/HTTPS review | Yes | No |
| Optional n8n chat integration | No | No | No for owner MVP | Server-side env only if separately approved | Optional integration-specific validation | No for owner MVP | No production fallback |
| Pinecone runtime | No | No | No | Not configured for owner MVP | Static readiness checks and source review | No for owner MVP; hold if treated as required | No |
| HubSpot runtime | No | No | No | Not configured for owner MVP | Static readiness checks and source review | No for owner MVP; hold if treated as required | No |
| `website/chat-config.js` | No | No | No | Must remain untracked and unused | `npm run validate:production-security-readiness`; source review | Yes if tracked or read by runtime source | No |
| `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, `SUPABASE_SERVICE_ROLE_KEY` | No | No | No | Must not be configured for owner MVP runtime/browser use | Production readiness and local release-candidate validators | Yes if introduced into launch path | No |
| `NEXT_PUBLIC_SKR_DEMO_CONTENT` | Must be absent or not `true` | Must be absent or not `true` | Must be absent or not `true` | Hosting build/runtime env review; local/review env only | Manual hosted env review today; missing static validator coverage | Yes if `true` in production | Local/review only |

## Required Production Envs

Set these only as server-side hosted runtime env values. Do not commit values or
include them in screenshots, logs, PR text, docs, chat, or public/client env.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CATALOGUE_WORKSPACE_ID`
- `QUOTE_WORKSPACE_ID`
- `ADMIN_TRUSTED_WORKSPACE_ID`
- `ADMIN_EXPECTED_ORIGIN`
- `ADMIN_EXPECTED_HOST`
- `ADMIN_CSRF_PROOF_SECRET`
- `QUOTE_ENQUIRY_EMAIL_PROVIDER`
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT`
- `QUOTE_ENQUIRY_EMAIL_FROM`
- `RESEND_API_KEY` when `QUOTE_ENQUIRY_EMAIL_PROVIDER` is `resend`

Current validator nuance: `QUOTE_ENQUIRY_EMAIL_PROVIDER` is validated when
present and defaults to `resend` when blank or missing. For hosted launch,
configure it explicitly as `resend` so the runtime state matches the deployment
record even though the current validator does not fail on a missing provider
value.

## Explicitly Not Required For Owner-MVP Launch

The owner-MVP launch must not depend on:

- `website/chat-config.js`
- `NEXT_PUBLIC_SUPABASE_*`
- `NEXT_PUBLIC_N8N*`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_CHAT_WEBHOOK_URL`
- `PINECONE_*`
- `HUBSPOT_*`

These names can appear in docs, tests, contracts, and validators as forbidden
or deferred references, but they must not become required hosted runtime
dependencies for owner-MVP launch.

## Local/Demo/Fallback Findings

### P0 Launch Holds

- Public demo-content flag: `website/components/PublicStitch.tsx` exposes
  `isDemoContentEnabled()` and demo products/setups when
  `NEXT_PUBLIC_SKR_DEMO_CONTENT` is set to `true`. Public
  catalogue/detail/listing/quote surfaces reference that flag in:
  - `website/app/catalogue/[slug]/page.tsx`
  - `website/app/listings/[slug]/page.tsx`
  - `website/app/quote/page.tsx`
  - `website/components/PublicStitch.tsx`
  Production must hold if the hosted env sets `NEXT_PUBLIC_SKR_DEMO_CONTENT`
  to `true`.
- Hosted Supabase data: public traffic must hold if approved migrations,
  workspace rows, public catalogue config, owner/admin membership records,
  launch catalogue/setup/Hero content, quote persistence tables, delivery-log
  tables, or listing media are missing or unreviewed.
- Quote email: public traffic must hold if Resend sender/domain verification,
  `QUOTE_ENQUIRY_EMAIL_RECIPIENT`, `QUOTE_ENQUIRY_EMAIL_FROM`, or
  `RESEND_API_KEY` are missing when provider is `resend`.
- Forbidden dependencies: public traffic must hold if `website/chat-config.js`,
  `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, `SUPABASE_SERVICE_ROLE_KEY`,
  `N8N_CHAT_WEBHOOK_URL`, `PINECONE_*`, or `HUBSPOT_*` is treated as required
  for owner-MVP launch.

### P1 Should Fix Before Launch

- Add narrow validator coverage for `NEXT_PUBLIC_SKR_DEMO_CONTENT` being set
  to `true` in production launch mode. Likely files:
  - `scripts/validate-production-security-readiness.cjs`
  - `scripts/validate-production-security-readiness.test.cjs`
  - `docs/PRODUCTION-SECURITY-READINESS-GATE.md`
- Decide whether `QUOTE_ENQUIRY_EMAIL_PROVIDER` should become launch-required
  instead of optional-with-default. Current behaviour is safe, but the hosted
  deployment record should be explicit. Likely files:
  - `scripts/validate-production-security-readiness.cjs`
  - `scripts/validate-production-security-readiness.test.cjs`
  - `docs/contracts/server-env-contract.json`
  - `docs/PRODUCTION-SECURITY-READINESS-GATE.md`
- Add a hosted data checklist command or evidence template if the owner wants a
  repeatable non-secret review for workspace rows, public catalogue config,
  admin memberships, Hero content, and storage bucket/object presence. This
  should stay outside live provider mutation unless separately approved.

### P2 Nice To Have After Launch

- Consider retiring the public demo-content flag after owner launch if it is no
  longer needed for review exercises.
- Consider adding a small deployment evidence template for Hostinger/Coolify
  env-name presence that records only safe status labels, never values.
- Consider documenting whether the static Hero fallback should remain as a
  long-term visual fallback or be replaced by a hard launch hold once managed
  Hero content is mandatory.

## Runtime Fallback Review

- Catalogue repository fallback is empty, not synthetic inventory. When
  Supabase/catalogue config is missing,
  `website/lib/catalogue/catalogue-repository.ts` returns safe unavailable or
  empty recovery states instead of fake listings.
- Hero has a static default public visual/copy fallback in
  `website/lib/hero/homepage-hero-content.ts`. This is not sample inventory,
  but launch should still review hosted Hero content if the owner expects Hero
  CMS control before traffic.
- Quote email handoff does not create a fake email-success path. If configured
  email handoff fails or is unavailable, public quote behaviour must remain a
  safe temporary-unavailable state with a request reference.
- Delivery Log write attempts are metadata-only and should remain best-effort
  evidence for delivery attempts. A delivery-log write failure must not be used
  to fake successful email handoff.
- Chat can fail safely when n8n is absent. `N8N_CHAT_WEBHOOK_URL` is not
  required for owner-MVP launch, and `website/chat-config.js` must remain
  unused.
- Localhost URLs found in scripts are local validation harnesses only, such as
  owner-flow smoke/UAT scripts. They are not production runtime dependencies.
- The `https://spacekoncept.local` URL used by quote email source-path handling
  is a safe URL parsing base, not a network dependency or production host.
- No production dependency on local file storage was found. Launch media
  depends on hosted Supabase Storage `listing-media` plus product image
  metadata.

## Production Readiness Validator Coverage

Covered today:

- `npm run validate:production-security-readiness` performs local/dev static
  checks and reports missing launch env as warnings.
- `npm run validate:production-security-readiness -- --launch` fails hard for
  missing or invalid required launch env names, invalid Supabase/admin origin
  shapes, weak admin CSRF secret shape, unsupported quote email provider, and
  missing `RESEND_API_KEY` for Resend.
- The production security readiness validator checks tracked files for
  committed `.env` files, tracked `website/chat-config.js`, runtime source that
  imports or reads `website/chat-config.js`, server-only env names in
  client/public runtime source, obvious secret token patterns, and Delivery Log
  documentation that stops being technical-metadata-only.
- `npm run test:production-security-readiness` covers local/dev mode, launch
  mode, provider validation, Resend key requirement, secret-redaction output,
  and static scan behaviour.
- `npm run validate:local-release-candidate` adds broader source/release
  candidate checks, including public-client Supabase/n8n exposure boundaries.

Missing or manual today:

- Launch mode does not currently fail when `NEXT_PUBLIC_SKR_DEMO_CONTENT` is
  set to `true` in the hosted environment. This audit treats that as a launch
  hold requiring manual env review until validator coverage exists.
- `QUOTE_ENQUIRY_EMAIL_PROVIDER` is not launch-required when absent because the
  runtime defaults to `resend`. This is acceptable but less explicit than the
  hosted deployment checklist; set it explicitly for launch.
- Validators do not prove hosted Supabase rows, memberships, storage objects,
  migration state, Resend DNS/sender verification, Coolify env placement, TLS,
  or safe live quote delivery. Those require hosted runbook evidence and owner
  review outside this repository.
- Local/dev warnings from the production security readiness command must not be
  treated as production readiness. Hosted public traffic requires explicit
  launch mode plus hosted evidence.

## Hosted Data Dependencies

Before public traffic, the hosted Supabase project must have:

- Approved migrations applied for base schema, catalogue public read surface,
  listing media storage, quote public insert, quote email delivery log, and
  homepage Hero content.
- Reviewed workspace rows for catalogue/setup, quote/enquiry persistence, and
  protected admin access.
- Active public catalogue configuration matching `CATALOGUE_WORKSPACE_ID`.
- Owner/admin auth users, `admin_users`, and active memberships scoped to
  `ADMIN_TRUSTED_WORKSPACE_ID`.
- Reviewed categories, products, setup/listing data, product images, sort
  order, visibility state, and listing media metadata for launch.
- Hosted Storage `listing-media` bucket and objects needed by visible launch
  listings.
- Homepage Hero content row if managed Hero CMS content is required before
  traffic.
- Quote request persistence tables and public insert policy for the
  `QUOTE_WORKSPACE_ID`.
- Quote email delivery log table and policies preserving technical metadata
  only.

Production seed data remains deferred unless separately approved. Do not
approve public traffic on local seed/sample/demo data.

## Required Hosted Services

- Hostinger VPS plus Coolify: required to build, run, terminate/route HTTPS,
  and hold server-side runtime env for the `website/` app.
- Hosted Supabase: required for public catalogue/setup/Hero reads, quote
  persistence, protected admin auth/workspace checks, owner CMS writes, listing
  media storage, and Delivery Log metadata.
- Resend: required for owner quote enquiry email handoff when provider is
  `resend`.
- n8n: optional only, integration-specific, and not required for owner-MVP
  launch unless a separate approved task scopes it.

## Launch Hold Conditions

Hold public traffic if any of these are true:

- Required hosted env is missing, invalid, placed in public/client env, or
  printed in logs/screenshots/docs/PR/chat.
- Production security readiness launch mode fails.
- Quote email readiness fails, Resend sender/domain is not verified, or safe
  live quote handoff fails after Resend is expected to be active.
- `NEXT_PUBLIC_SKR_DEMO_CONTENT` is set to `true` in hosted production env.
- Required hosted Supabase migrations, workspace rows, admin memberships,
  public catalogue config, content/media, quote persistence, or delivery-log
  metadata surfaces are missing or unreviewed.
- `website/chat-config.js`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`,
  `SUPABASE_SERVICE_ROLE_KEY`, `N8N_CHAT_WEBHOOK_URL`, `PINECONE_*`, or
  `HUBSPOT_*` is treated as a required owner-MVP dependency.
- Delivery Log or Enquiry Email exposes private customer content, provider
  payloads, secrets, env values, headers, cookies, tokens, API keys, or raw
  response bodies.
- Public route smoke tests or protected admin smoke tests fail in the hosted
  environment.

## Documentation Closure

This audit is retained under `docs/audits/` as the focused dependency and
fallback evidence record. Durable launch-hold guidance for the public
demo-content flag is linked back into:

- `docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md`
- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md`

No generated screenshots or local artifacts were created. No `MEMORY.md` was
created, and no repo map was created.
