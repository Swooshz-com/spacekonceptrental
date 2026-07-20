# Hosted Deployment Execution Runbook

Date: 2026-07-03

Scope: final hosted deployment execution checklist for the SKR owner MVP on a
Hostinger/Coolify/VPS stack with hosted Supabase and server-side n8n enquiry
handoff. This runbook is documentation only. It does not approve deployment,
mutate provider settings, change DNS, configure secrets, connect to production
services, or enable public traffic.

Current source status: source implementation has no known P0/P1 launch blocker.
Public traffic remains blocked until hosted/runtime readiness, Supabase,
server-side n8n enquiry handoff, safe live quote, protected admin inspection,
and UAT gates pass.

## Instruction Sources Used

- `AGENTS.md`
- `docs/agent-playbooks/INDEX.md`
- `docs/agent-playbooks/local-docs.md`
- `docs/agent-playbooks/safety-gates.md`
- `docs/agent-playbooks/git-completion.md`
- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md`
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md`
- `docs/SKR-LAUNCH-READINESS-FINAL-GAP-AUDIT.md`
- Installed skill:
  `ai-agent-toolkit:codex-ssh-hostinger-coolify-setup-maintainer`
- Installed skill: `ai-agent-toolkit:self-hosted-service-safety`

`MEMORY.md` does not exist in this checkout and is not required for this
runbook. No repo map is required by current repo convention for this change.

## Safety Position

- Do not paste, print, screenshot, commit, or chat real `.env` values, API keys,
  private keys, webhook URLs, provider response bodies, connection strings, or
  secrets.
- Do not run SSH, Docker, firewall, DNS, Coolify, Supabase, n8n, email
  provider, deployment, restart, rollback, or public-traffic actions without
  explicit current-turn owner approval naming the target and allowed operation.
- Keep any deployment notes, screenshots, and incident notes redacted. Record
  env names and safe status labels only.
- Do not add broad fallbacks. A failed readiness or smoke gate is a launch hold
  until corrected and rerun.

## Hostinger/Coolify Prerequisites

Before deployment execution is approved, confirm the hosting surface is ready:

- Hostinger VPS is owner-controlled and has documented recovery access outside
  this repository.
- Coolify is installed, reachable by approved operators only, and has its
  project/app configured without storing secrets in repo files.
- The app base directory is `website/`, or the Coolify build/start commands
  explicitly run from `website/`.
- Use the repo package manager lockfile policy for installation. For the current
  app, `website/package.json` exposes:
  - build command: `npm run build`
  - start command: `npm run start`
- The public domain points at the intended VPS/reverse proxy only after owner
  approval.
- TLS is terminated by the approved Coolify/reverse-proxy path, HTTP redirects
  to HTTPS, and the final HTTPS origin matches the admin env values below.
- Only intended web ports are public. Do not expose database, SSH, Coolify admin,
  or internal service ports beyond the approved operator access model.
- Logs and screenshots are reviewed for accidental secret/env leakage before
  they are shared or attached to a PR.

## Required Server-Side Env Names

Set these only in the hosted server-side runtime environment. Never commit
values or place them in public/client env.

| Env name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Hosted Supabase project URL used by server-side app paths. |
| `SUPABASE_ANON_KEY` | Server-side anon/public key used with RLS through first-party app paths. |
| `CATALOGUE_WORKSPACE_ID` | Workspace gate for public catalogue/setup reads. |
| `QUOTE_WORKSPACE_ID` | Workspace gate for quote/enquiry persistence. |
| `QUOTE_SUBMISSION_ADMISSION_SECRET` | Dedicated server-only quote admission HMAC secret; must match the private database configuration provisioned after migration approval. |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Workspace gate for protected owner/admin access. |
| `ADMIN_EXPECTED_ORIGIN` | HTTPS origin expected for protected admin same-origin checks. |
| `ADMIN_EXPECTED_HOST` | Expected protected admin host. |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only secret for admin CSRF proof material. |
| `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` | Server-only n8n endpoint for quote/enquiry handoff after SKR persistence. |
| `N8N_ENQUIRY_HANDOFF_SHARED_SECRET` | Server-only HMAC signing secret shared with the reviewed n8n workflow. |
| `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS` | Optional bounded timeout for the n8n handoff request. |

## Explicitly Not Required

The owner MVP launch does not require these runtime dependencies:

- `website/chat-config.js`
- `NEXT_PUBLIC_SUPABASE_*`
- `NEXT_PUBLIC_N8N*`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_CHAT_WEBHOOK_URL`
- `PINECONE_*`
- `HUBSPOT_*`

Do not add them to the launch gate, screenshots, logs, or owner MVP deployment
checklist.

## Supabase Hosted Checklist

Complete these checks against the intended hosted Supabase project before public
traffic:

- Review the n8n delivery-log migration runbook before applying
  `supabase/migrations/20260708100000_n8n_enquiry_handoff_delivery_log_contract.sql`:
  `docs/N8N-ENQUIRY-HANDOFF-HOSTED-MIGRATION-RUNBOOK.md`.
- Select or create the hosted Supabase project outside this repository.
- Apply the approved migrations through the approved deployment path.
- Verify migration state matches the commit being deployed.
- Verify RLS is enabled and expected Docker-backed RLS behaviours are preserved
  in the hosted project.
- Verify `CATALOGUE_WORKSPACE_ID` points at the reviewed public catalogue/setup
  workspace.
- Verify `QUOTE_WORKSPACE_ID` points at the reviewed quote/enquiry workspace.
- Verify `ADMIN_TRUSTED_WORKSPACE_ID` points at the reviewed owner/admin
  workspace.
- Verify protected admin users have only the intended workspace memberships and
  product-manager/admin trust needed for the owner CMS.
- Verify the public Hero read path remains RPC-only and does not expose
  workspace/admin metadata.
- Verify no service-role key is required in browser, public client code, or the
  hosted app runtime for owner MVP launch.

## n8n Enquiry Handoff Checklist

Complete n8n and email-provider setup outside this repository:

- Review the inactive repo-side workflow skeleton before importing or
  recreating it in n8n:
  `n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json`.
- Confirm the reviewed n8n workflow accepts the expected SKR enquiry payload
  only after verifying the timestamped HMAC signature.
- Confirm the workflow uses the SKR idempotency key before sending duplicate
  email/internal handoff.
- Configure email provider credentials and recipients only in n8n or the
  approved provider, never in SKR admin UI or repo files.
- Store `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` and
  `N8N_ENQUIRY_HANDOFF_SHARED_SECRET` only as server-side hosting secrets.
- Never print, screenshot, paste, or commit the n8n webhook URL, shared secret,
  provider credentials, or provider tokens.
- Run the quote handoff readiness command in the same hosted runtime
  environment:

```powershell
npm run validate:quote-email-runtime-readiness
```

Use the hosted enquiry handoff smoke checklist after the hosted migration,
server-only env, and n8n workflow setup are reviewed:
`docs/N8N-ENQUIRY-HANDOFF-HOSTED-SMOKE-CHECKLIST.md`.

## Hosted Validation Commands

Run these from the deployed checkout or an equivalent hosted/runtime environment
with the same server-side env. Do not use fake placeholder values to approve
public traffic.

```powershell
npm run validate:production-security-readiness -- --launch
npm run validate:quote-email-runtime-readiness
npm run validate:local-release-candidate
```

`npm run validate:local-release-candidate` is a source/release-candidate gate.
If it cannot run inside the final hosted container because only `website/` is
available there, run it from the same commit before cutover and record that
result separately from the hosted env checks.

## Safe Live Quote Verification

Run this only after hosted launch-mode readiness and quote handoff readiness
pass:

1. Use one clearly synthetic customer name, email, phone, event description, and
   item request.
2. Submit the quote once through the hosted public `/quote` flow.
3. Inspect the public success or failure state. It must remain receipt/error
   behaviour only and must not add tracking, account, booking, payment, order,
   or reservation language.
4. Confirm SKR stored the enquiry before the server-side n8n handoff attempt.
5. Confirm the n8n workflow completed the email/internal handoff only after
   signature and idempotency checks.
6. Sign in as an approved owner/admin.
7. Inspect protected Enquiry Email for server-side n8n readiness/status only.
8. Inspect protected Delivery Log for technical metadata only: provider/channel,
   status, request reference, timestamp, and safe message id or safe error code.
9. Hold launch if Delivery Log exposes customer messages, requested item detail,
   full email bodies, raw provider payloads, headers, cookies, tokens, secrets,
   API keys, or provider response bodies.

Expected public behaviour when handoff is not configured or fails after
persistence is an honest receipt/processing state with no provider internals,
env values, secrets, SQL, stack traces, workspace internals, or private
customer data.

## Launch Hold Conditions

Do not enable public traffic if any condition below is true:

- `npm run validate:production-security-readiness -- --launch` fails.
- `npm run validate:quote-email-runtime-readiness` fails.
- Quote handoff fails after n8n is expected to be active.
- Delivery Log leaks private data, customer message content, provider payloads,
  secrets, env values, or raw response bodies.
- Public `/`, `/catalogue`, `/listings`, detail routes, `/quote`, or
  confirmation/error behaviour fails in the hosted environment.
- Protected admin authentication or workspace binding fails.
- Workspace IDs are missing, wrong, or point at unreviewed hosted records.
- Catalogue, setup, Hero, or listing content/media needed for launch is missing
  or unreviewed.
- `NEXT_PUBLIC_SKR_DEMO_CONTENT` is configured in the hosted build or runtime
  environment.
- n8n workflow signing/idempotency/email-provider verification is incomplete.
- Any secret/env value appears in docs, logs, screenshots, PR text, or chat.

## Rollback Or Disable Plan

If launch must be stopped or reversed:

- Remove public traffic at the approved proxy/Coolify/domain control point.
- Keep env secrets private; do not paste them into incident notes.
- Preserve the deployed commit, logs, and redacted evidence needed to diagnose
  the failure.
- Do not mutate external services, DNS, firewall, Supabase, n8n, email
  provider, or Coolify state without explicit owner approval naming the target
  and operation.
- Record incident notes with safe status labels, timestamps, request references,
  commit SHA, and affected route names only.
- After correction, rerun the readiness and smoke gates before restoring public
  traffic.

## Fable Visual QA Position

Fable or design-model review is screenshot QA only and happens after hosted
screenshots exist.

- Compare public and protected admin quality, responsive layout, and obvious
  mobile rendering issues from screenshots.
- Do not ask Fable to redesign the public site or protected admin styling.
- Do not make repo edits from Fable feedback without explicit owner approval.
- Public visual redesign remains frozen unless a concrete launch-blocking visual
  defect is approved and scoped.
- PR #257-style public visual polish is not reused.

## Documentation Closure

This runbook owns the hosted Hostinger/Coolify/VPS execution sequence. Existing
docs are retained as the canonical supporting references:

- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md` remains the env contract and links
  to this hosted execution runbook. Stale deployment-target wording is updated
  there rather than duplicated here.
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md` remains the readiness validator
  contract and states that only the server-side n8n enquiry handoff env is
  required; n8n chat, Pinecone, and HubSpot runtime env remain out of scope for
  owner-MVP launch.
- `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md` remains the broader smoke evidence
  runbook, with n8n chat checks treated as optional and integration-specific.
- `docs/SKR-LAUNCH-READINESS-FINAL-GAP-AUDIT.md` remains the final source gap
  audit.
- `docs/audits/SKR-PRODUCTION-DEPENDENCY-LOCAL-FALLBACK-AUDIT.md` records the
  focused production dependency matrix and has been updated after removal of
  the public demo-content runtime path.

No duplicate deployment instructions were intentionally scattered, no broad
repo docs cleanup was performed, no `MEMORY.md` was created, and no repo map
was created.
