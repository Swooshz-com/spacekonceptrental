# Hosted Deployment Execution Runbook

Date: 2026-07-03

Scope: staged hosted deployment execution checklist for the SKR owner MVP on a
Hostinger/Coolify/VPS stack. Stage A covers controlled Google OAuth deployment
with quote disabled and n8n inactive. Stage B covers the later full enquiry
launch with the server-side n8n handoff. This runbook is documentation only. It does not approve deployment,
mutate provider settings, change DNS, configure secrets, connect to production
services, or enable public traffic.

Current source status: repository preparation does not prove provider or launch
readiness. Stage A and Stage B have separate gates below. Public customer quote
traffic remains blocked until every Stage B gate passes.

Repository-tested application boundaries include Supabase admin auth runtime
wiring, server auth-cookie reads and writes, first-party login, callback, and
logout routes, protected admin pages, and approved admin product, category, and
listing writes. Production deployment and provider configuration remain
separately gated; repository implementation is not evidence of either.

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

## Staged Deployment Contract

### Stage A - Controlled OAuth Deployment

Stage A permits only a separately approved exact-SHA deployment for controlled
Google OAuth owner UAT:

- deploy the requested immutable SHA and independently prove the resolved build
  SHA is exactly equal;
- keep quote submission disabled;
- keep every n8n workflow inactive and require no n8n configuration;
- keep protected admin mutations technically disabled with server-only
  `ADMIN_MUTATIONS_ENABLED` set to the explicit disabled state; missing,
  blank, whitespace-padded, malformed, and false values
  fail closed;
- independently verify, before owner OAuth UAT, that the hosted Supabase Auth
  project prevents public user creation while the approved existing owner can
  still sign in;
- validate public read routes and anonymous `/admin` denial with
  `npm run smoke:production-readonly`;
- run the Google OAuth owner/admin UAT through the first-party login route and
  exact application callback;
- do not submit a customer quote or claim full enquiry launch readiness.

Record Google OAuth owner UAT as `PASS | HOLD - NOT RUN | FAIL`. Stage A
remains incomplete and held until real-owner Google OAuth UAT passes. An
exact-SHA deployment may exist temporarily for controlled UAT, but its Stage A
record remains `HOLD - NOT RUN`, not `PASS`, until the UAT passes.

Record provider signup admission as `PASS | HOLD - NOT VERIFIED | FAIL`.
`HOLD - NOT VERIFIED` blocks UAT and Stage A completion. The accepted provider
mechanism is either disabled new-user signup with the pre-provisioned owner
remaining usable, or an equivalently reviewed before-user-created /
pre-user-creation admission hook that admits only approved owner/admin
  identities before account creation. A denial after the application callback
  does not prove that user creation was prevented. Repository tests cannot prove
  live provider admission state.

The secret-safe evidence JSON uses only the exact mechanism identifiers
`new-user-signup-disabled` or `before-user-created-admission-hook`. Its
verification timestamp must parse successfully and must not be later than the
validator's current time. It must be canonical UTC ISO-8601 with milliseconds,
no more than 24 hours old, and bound to the requested immutable SHA. The
approval reference must be a canonical comment URL on issue #291 or #301.
Free-form mechanism labels, callback membership denial, stale or future-dated
evidence, and evidence for another revision do not satisfy this gate.

### Stage B - Full Enquiry Launch

Stage B is a later, separately approved launch. It additionally requires:

- a reviewed n8n enquiry workflow receiving only persisted `/api/quote` events;
- timestamped HMAC verification and timestamp freshness enforcement;
- durable idempotency before delivery;
- delivery evidence;
- deliberate quote enablement;
- the unchanged full launch production-security validator; and
- quote-email runtime readiness and safe live quote verification.

Chatbot `/api/chat` evidence belongs to the separate chatbot lane and cannot
prove enquiry delivery.

## Hostinger/Coolify Prerequisites

Before deployment execution is approved, confirm the hosting surface is ready:

- Hostinger VPS is owner-controlled and has documented recovery access outside
  this repository.
- Coolify is installed, reachable by approved operators only, and has its
  project/app configured without storing secrets in repo files.
- The exact build context/base directory is `website/`.
- The runtime is Node 24, aligned with `.nvmrc`, package engines, and CI. When
  Nixpacks/Coolify needs an explicit runtime selection, select Node 24.
- The deterministic install command is `npm ci` using
  `website/package-lock.json`.
- The build command is `npm run build`.
- The start command is `npm run start`.
- Do not substitute repository-root context, `npm install`, a floating Node
  major, or a provider-specific deployment client for this contract.
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

The table is the complete server-only deployment inventory across both stages.
Stage A requires only `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`CATALOGUE_WORKSPACE_ID`, `ADMIN_TRUSTED_WORKSPACE_ID`,
`ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, and
`ADMIN_CSRF_PROOF_SECRET`, plus `ADMIN_MUTATIONS_ENABLED` set explicitly to
the disabled state. Stage A must not require a `QUOTE_*` or `N8N_*`
value because quote remains disabled and n8n remains inactive. Stage B requires
the full launch set enforced by the existing launch validator.

| Env name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Hosted Supabase project origin root used by server-side app paths. Stage A accepts only the canonical HTTPS project origin with a 20-character project-ref subdomain and optional trailing root slash; credentials, explicit ports, non-root paths, queries, and fragments are invalid. |

Validate the supplied raw `SUPABASE_URL`; do not repair, strip, or normalise
non-root or ambiguous path material into an otherwise acceptable origin.
| `SUPABASE_ANON_KEY` | Server-side anon/public key used with RLS through first-party app paths. |
| `CATALOGUE_WORKSPACE_ID` | Workspace gate for public catalogue/setup reads. |
| `QUOTE_WORKSPACE_ID` | Workspace gate for quote/enquiry persistence. |
| `QUOTE_SUBMISSION_ADMISSION_SECRET` | Dedicated server-only quote admission HMAC secret; must match the private database configuration provisioned after migration approval. |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Workspace gate for protected owner/admin access. |
| `ADMIN_EXPECTED_ORIGIN` | Canonical HTTPS authority for protected admin same-origin checks and every admin-auth redirect. |
| `ADMIN_EXPECTED_HOST` | Expected protected admin host. |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only secret for admin CSRF proof material. |
| `ADMIN_MUTATIONS_ENABLED` | Fail-closed server-only admin-write capability. Only exact lowercase, unpadded `true` permits the request to continue into existing controls; every other state denies before session, identity, workspace, profile, membership, repository, audit, database, or other provider access. Stage A requires explicit `false`. |
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

## Admin OAuth Deployment Contract

- Set `ADMIN_EXPECTED_ORIGIN` to exactly
  `https://spacekonceptrental.com` and `ADMIN_EXPECTED_HOST` to exactly
  `spacekonceptrental.com` in the production server environment.
- Treat `ADMIN_EXPECTED_ORIGIN` as the only admin-auth redirect authority. A
  reverse proxy may expose an internal localhost request URL, but that URL and
  all forwarded host/protocol headers must not determine redirects.
- Allow the exact application callback
  `https://spacekonceptrental.com/api/admin/login/callback` in Supabase Auth.
- Configure the Google web client with the exact Supabase provider callback
  `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`; do not substitute
  the application callback for this provider hop.
- Before owner OAuth UAT, verify through the strongest suitable official
  Supabase interface or API that new-user signup is disabled while the
  pre-provisioned owner remains usable, or that an equivalently reviewed
  before-user-created admission hook prevents all unapproved account creation.
  Record only safe status, timestamp, mechanism class, operator/approval
  reference, existing-owner readiness, and no-public-signup result. Never
  record private emails, project references, provider values, or secrets.
- Keep the provider prerequisite `HOLD - NOT VERIFIED` until that direct check
  passes. Do not infer it from callback denial, repository tests, builds, or
  application membership checks.
- After deployment, verify PKCE, session, refreshed, chunked, and deletion
  cookie writes use `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and no
  `Domain` attribute.
- Supabase Google-provider configuration, Google OAuth metadata, deployment,
  and a real owner login/logout UAT are separate approved operations. Do not
infer their completion from repository tests or builds.

## Stage A Protected Admin Mutation Contract

- Configure `ADMIN_MUTATIONS_ENABLED` as explicitly disabled in the Stage A
  server runtime and
  record only an equality/status result, never the value source or surrounding
  environment.
- Missing, blank, whitespace-padded, malformed, or false values deny every protected admin write
  before repository or provider mutation with a stable privacy-safe response.
- Login, callback, logout, session reads, protected admin-page reads, and owner
  OAuth UAT remain available while mutations are disabled.
- Do not treat hidden UI controls as enforcement. The server route gate is the
  authoritative boundary and remains additional to authentication, role,
  workspace, CSRF, Origin/Referer, and input-validation controls.
- A later Stage B or separately reviewed admin-write activation must explicitly
  set the gate to exact lowercase `true` and re-prove all existing controls.

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

Run the repository-safe Stage A checks before any provider operation:

```powershell
npm run test:deployment-contract-follow-up
npm run validate:stage-a-oauth-readiness
```

The repository-only command validates the static contract and deliberately
does not claim provider admission completion. After the separately authorised
provider check, run the completion validator in the hosted runtime with
ADMIN_MUTATIONS_ENABLED explicitly disabled and a temporary, secret-safe
provider-admission evidence JSON file stored outside the repository:

~~~powershell
npm run validate:stage-a-oauth-deployment-readiness -- --provider-admission-evidence <temporary-secret-safe-evidence-path>
~~~

The completion validator checks every declared Stage A runtime env name and
safe shape without printing values. It must remain on hold when a required
Supabase, catalogue, admin workspace, canonical origin/host, CSRF, or mutation
capability setting is absent/invalid; when the evidence file is absent,
invalid, future-dated, or not `PASS`; or when the admin-mutation state is not
the exact unpadded value `false`. A legacy compact `SUPABASE_ANON_KEY` is
accepted only when its decoded Supabase role is exactly `anon`; a legacy
`service_role` JWT is rejected. Completion must run from a clean tracked
checkout, and provider-admission evidence cannot bind to a dirty or unresolved
repository revision.

After a separately approved Stage A deployment, provide the canonical base only
through the dedicated input and run the read-only smoke. The command performs
manual-redirect GET requests only; it does not authenticate, initiate OAuth,
submit a quote, call n8n, or mutate external state. There is no direct provider
API call by the smoke harness and no mutating provider call. Route rendering
may exercise configured read-only Supabase-backed application paths through the
deployed first-party application. The command also extracts, deduplicates, and
scans at most 32 referenced same-origin `/_next/static/*.js` bundles, with the
same leakage rules. Route HTML retains its 128 KiB response bound. Each client
asset is scanned incrementally with only a 4,096-character overlap window and
a separate 512 KiB total response ceiling, so current production bundles are
covered without accumulating an entire bundle. It never fetches third-party
script origins.

```powershell
$env:SKR_PRODUCTION_BASE_URL = 'https://spacekonceptrental.com'
npm run smoke:production-readonly
Remove-Item Env:SKR_PRODUCTION_BASE_URL -ErrorAction SilentlyContinue
```

For Stage B only, run these from the deployed checkout or an equivalent
hosted/runtime environment with the same server-side env. Do not use fake
placeholder values to approve public traffic.

```powershell
npm run validate:production-security-readiness -- --launch --public-security-definer-catalog <approved-read-only-catalog-path>
npm run validate:quote-email-runtime-readiness
npm run validate:local-release-candidate
```

`npm run validate:local-release-candidate` is a source/release-candidate gate.
If it cannot run inside the final hosted container because only `website/` is
available there, run it from the same commit before cutover and record that
result separately from the hosted env checks.

## Safe Live Quote Verification

This is Stage B only. Run it only after hosted launch-mode readiness, reviewed
n8n handoff readiness, and deliberate quote enablement pass. Never run it in
Stage A.

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

## Stage B Launch Hold Conditions

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

Stage A is also held if exact requested/resolved SHA equality or an immutable
deployment identifier is missing, quote is not proven disabled, n8n is not
proven inactive, admin mutations are enabled or not proven disabled, provider
signup admission is not directly verified, the production read-only smoke does
not pass, or real-owner Google OAuth UAT has not passed. Use
`HOLD - NOT VERIFIED` for the provider prerequisite and `HOLD - NOT RUN`, never
a bare `NOT-RUN`, when UAT has not occurred.

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
- Record the pre-rollback deployed SHA and deployment identifier separately
  from the requested reviewed rollback-target SHA and identifier. Capture the
  resolved post-rollback SHA and identifier and their exact equality result.
- Classify the rollback target as Stage A or Stage B. A Stage A rollback target
  requires quote submission disabled, n8n inactive, and no customer quote
  submission. A Stage B rollback target requires exact evidence that quote and
  n8n state match the separately reviewed rollback-target contract and intended
  target state; a rollback alone does not impose Stage A state.
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
- `docs/PRODUCTION-SECURITY-READINESS-GATE.md` owns both the repository-safe
  Stage A static gate and the unchanged provider-dependent Stage B launch gate.
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
