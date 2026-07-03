# SKR Launch Readiness Final Gap Audit

Date: 2026-07-03

Branch: `codex/skr-launch-readiness-final-gap-audit`

Base inspected: `0ec45cef6204efaa690b9eb4a83ec6b586939cf4`
(`origin/main` after PR #260).

This is an audit/report-only pass after the protected Hero content foundation
and public Hero RPC-only boundary landed. It does not implement a product
feature, does not continue PR #257, and does not reuse PR #257-style public
visual polish.

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
- `docs/SKR-OWNER-MVP-CURRENT-STATE-AUDIT.md`
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md`
- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/SKR-OWNER-FLOW-LOCAL-UAT-SMOKE.md`
- Installed skill: `ai-agent-toolkit:project-completion-audit`
- Installed skill: `supabase:supabase`
- Installed skill: `superpowers:verification-before-completion`
- Installed skill: `superpowers:finishing-a-development-branch`

`MEMORY.md` does not exist in this checkout.

## Audit Scope

- Public visitor flow: `/`, `/catalogue`, `/listings`, detail routes, `/quote`,
  confirmation/error behavior, and managed Hero default behavior.
- Protected owner admin flow: Dashboard, Hero, Catalogue, Setups, Enquiry
  Email, and Delivery Log.
- Backend/security: quote persistence, email handoff, Delivery Log privacy,
  Hero public RPC-only boundary, Admin Hero write gate, CSRF/session/workspace
  binding, Supabase RLS, and production/security readiness validation.
- Launch operations: hosted env names, Resend sender/domain verification,
  Supabase hosted connection, safe live quote verification, owner
  content/media review, and local or hosted UAT.

## Complete Now

- The public visitor flow remains enquiry-led: catalogue and setup browsing,
  detail pages, `/quote`, and first-party `/api/quote` submission are present.
- Public quote failures remain generic and request-referenced rather than
  exposing provider internals, SQL, secrets, or private runtime values.
- Managed homepage Hero content is wired through a public RPC-only read path.
  If enabled managed content is unavailable, the homepage keeps the existing
  static Hero default behavior.
- Protected owner admin is the six-page CMS: Dashboard, Hero, Catalogue,
  Setups, Enquiry Email, and Delivery Log.
- Protected Hero is no longer a dead placeholder. Approved owner/admin users
  can manage workspace-scoped Hero text, CTA hrefs, image URL/reference, alt
  text, and enabled state through the existing protected admin gate.
- Hero public reads use `get_public_homepage_hero(expected_workspace_id)`;
  anonymous direct reads of `homepage_hero_content` are denied by migration and
  Docker-backed RLS coverage.
- Admin Hero writes use the protected route/action boundary and
  `execute_admin_homepage_hero_write(...)`; anonymous callers and workspace
  viewers cannot write.
- Quote persistence, server-side email handoff, quote email runtime readiness,
  and bounded Delivery Log technical metadata are implemented.
- Production/security readiness validation exists in local/dev and explicit
  launch modes without requiring real production secrets in normal CI.
- Owner-flow smoke, local UAT tooling, Docker readiness, Supabase migration
  tests, and Docker-backed RLS tests are present.

## Launch-Blocking Gaps

No P0/P1 source implementation blocker was found in this audit scope.

Public traffic is still blocked until these operational launch gates are
completed in the hosted/runtime environment:

- `npm run validate:production-security-readiness -- --launch` passes with the
  real hosted server-side env values.
- `npm run validate:quote-email-runtime-readiness` passes in the same hosted
  runtime after quote email env is configured.
- Resend sender/domain verification is confirmed outside the repo.
- Supabase hosted project connection, migration state, workspace IDs, and RLS
  behavior are verified against the intended hosted project.
- A safe live quote test is submitted after readiness passes, and protected
  Enquiry Email plus Delivery Log are inspected.
- Owner/admin content review is complete for Hero text, Hero media reference,
  Hero alt text, catalogue records, setup presentation, and listing images.
- Local or hosted UAT is completed without relying on public visual changes.

If any required validation command fails, that failure becomes a launch blocker
until corrected and rerun.

## Deferred But Acceptable

- Raw Hero upload/storage policy, image transformation, and media-provider
  integration remain deferred. Hero media management is URL/reference-based.
- Customer confirmation email, quote tracking, quote inbox, CRM workflow,
  HubSpot sync, n8n automation, Pinecone migration, customer accounts, cart,
  checkout, payment, order, booking, reservation, stock/inventory reservation,
  fulfilment, and custom CRM remain outside the owner MVP launch scope.
- Live quote/email handoff verification remains manual because local smoke/UAT
  must not risk sending real email.
- Monitoring, production evidence capture, traffic cutover, and external
  provider operations remain separate launch activities.

## Manual Launch Checklist

1. Confirm the deployed commit includes PR #260 and this final gap audit.
2. Configure only server-side hosted env values. Do not commit `.env` files or
   paste real values into docs, PR bodies, screenshots, logs, or chat.
3. Review these required launch env names in the hosting/runtime environment:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CATALOGUE_WORKSPACE_ID`,
   `QUOTE_WORKSPACE_ID`, `ADMIN_TRUSTED_WORKSPACE_ID`,
   `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`,
   `ADMIN_CSRF_PROOF_SECRET`, `QUOTE_ENQUIRY_EMAIL_PROVIDER`,
   `QUOTE_ENQUIRY_EMAIL_RECIPIENT`, `QUOTE_ENQUIRY_EMAIL_FROM`, and
   `RESEND_API_KEY` when the provider is `resend`.
4. Confirm no owner MVP launch requirement was added for
   `website/chat-config.js`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`,
   `SUPABASE_SERVICE_ROLE_KEY`, `N8N_CHAT_WEBHOOK_URL`, `PINECONE_*`, or
   `HUBSPOT_*`.
5. Verify the Resend sender/domain outside the repo and confirm the hosted
   sender matches `QUOTE_ENQUIRY_EMAIL_FROM`.
6. Verify the hosted Supabase project has the expected migrations applied and
   that catalogue, quote, and admin workspace IDs point at the intended
   reviewed workspace rows.
7. Run the hosted launch readiness commands listed below from the deployed
   runtime or an equivalent environment with the same server-side env.
8. Sign in as an approved owner/admin and review Dashboard, Hero, Catalogue,
   Setups, Enquiry Email, and Delivery Log.
9. Review Hero managed content. If Hero is disabled or missing, confirm the
   existing static public Hero default is the intended temporary behavior.
10. Review public `/`, `/catalogue`, `/listings`, detail routes, and `/quote`
    in the hosted environment.
11. Submit one clearly synthetic quote request only after readiness commands
    pass.
12. Confirm public success/error behavior remains receipt-only and does not
    introduce quote tracking, account, booking, payment, order, or reservation
    language.
13. Inspect protected Enquiry Email for provider/recipient status only.
14. Inspect protected Delivery Log for bounded technical metadata only:
    provider, status, redacted recipient, request reference, timestamp, and
    safe message id or safe error code.
15. Hold launch if Delivery Log exposes customer messages, requested item
    detail, full email bodies, raw provider payloads, headers, cookies, tokens,
    secrets, API keys, or provider response bodies.

## Commands Before Public Traffic

Local source validation from the repo root:

```powershell
cd website
npm run typecheck
npm run test
npm run build
cd ..
npm run test:production-security-readiness
npm run validate:production-security-readiness
npm run validate:production-security-readiness -- --launch
npm run test:quote-email-runtime-readiness
npm run test:docker-readiness
npm run test:owner-flow-smoke
npm run test:local-uat-owner-flow
npm run validate:local-release-candidate
npm run test:supabase-migrations
npm run validate:supabase-migrations
npm run test:supabase-rls
git diff --check
```

Use safe placeholder env values only for local launch-mode validation. Do not
use fake placeholders to approve hosted public traffic.

Hosted/runtime launch gates:

```powershell
npm run validate:production-security-readiness -- --launch
npm run validate:quote-email-runtime-readiness
```

Optional local UAT after clearing any existing Next dev lock:

```powershell
npm run local-uat:owner-flow
```

## Frozen Visual Boundary

Public visuals, public CSS, public copy, public layout, and public design are
frozen unless a concrete functional bug is found and explicitly scoped. This
audit does not change public visual files, protected admin visual styling, or
Stitch/public component styling.

PR #257-style visual polish is not reused. No new public redesign, product
feature, checkout, booking, reservation, CRM, quote inbox, or external provider
integration is added by this audit.
