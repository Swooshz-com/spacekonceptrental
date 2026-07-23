# Deployment Evidence

Use this template for a future approved deployment PR. Complete
it outside Git unless an explicit evidence-publication scope says otherwise.
Record reviewed non-secret identifiers, commands, safe status labels, route
results, timestamps, and approval references only. Never include environment
values, credentials, tokens, cookies, webhook URLs, provider response bodies,
private dashboard links, workspace/admin identifiers, or customer data.

## Deployment summary

- Environment: `<environment-name>`
- Deployment target: `<deployment-url>`
- Operator and approval reference: `<reviewed-non-secret-reference>`

## Remaining-work map

- Completed phases confirmed: `<summary>`
- Safe next phases not bundled into this PR: `<summary>`
- Blocked phases requiring explicit owner approval: `<summary>`
- Phases too broad or risky to bundle: `<summary>`
- Largest safe bundle rationale: `<summary>`
- Confirmation that unrelated runtime, privacy, CRM, notification, SaaS chatbot,
  or ecommerce work is not bundled: `<confirmed-by>`

## Environment reviewed

- Hosting/runtime environment class: `<review-summary>`
- Repository and immutable revision evidence: `<review-summary>`
- Provider configuration evidence remains external: `<review-summary>`

## Env placement confirmation

- Supabase, catalogue, admin, CSRF, quote, and n8n env names are server-only:
  `<confirmed-by-or-stage-A-not-required>`

## Forbidden public env confirmation

- No `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`, browser-visible n8n URL, or
  service-role runtime path: `<confirmed-by>`

## Supabase Cloud confirmation

- Provider configuration was reviewed only under separate approval and without
  exposing values: `<confirmed-by-or-not-performed>`

## Active catalogue workspace confirmation

- Public catalogue gate reviewed: `<confirmed-by>`
- Approved catalogue workspace reference: `<approved-catalogue-workspace-id>`

## Quote workspace confirmation

- Quote persistence/admission state: `<stage-A-disabled-or-stage-B-reviewed>`

## Admin trusted workspace confirmation

- Admin auth/workspace/CSRF presence and actor class reviewed without values:
  `<confirmed-by>`

## Provider signup admission confirmation - Stage A

- Admission mechanism (`new-user-signup-disabled` or
  `before-user-created-admission-hook`): `<exact-mechanism-identifier>`
- Verification status (`PASS | HOLD - NOT VERIFIED | FAIL`): `<status>`
- Verified at: `<ISO-8601-non-future-timestamp-or-not-verified>`
- Operator and approval reference: `<reviewed-non-secret-reference>`
- Existing-owner readiness: `<PASS-FAIL-or-HOLD>`
- No-public-signup result: `<PASS-FAIL-or-HOLD>`

`HOLD - NOT VERIFIED` blocks owner OAuth UAT and Stage A completion. A callback
or membership denial does not prove user creation was prevented. Repository
tests cannot prove live provider admission. Verify through the strongest
suitable official Supabase interface or API under separate authorisation, and
never record private emails, project references, provider values, or secrets.
Reference the secret-safe output of
`npm run validate:stage-a-oauth-deployment-readiness -- --provider-admission-evidence <temporary-secret-safe-evidence-path>`;
do not attach the temporary file to Git.

## Listing media confirmation

- Existing listing-media model and protected upload boundary reviewed:
  `<confirmed-by-or-not-in-scope>`

## n8n server-only webhook confirmation

- Stage A n8n inactive or Stage B reviewed enquiry handoff: `<confirmed-by>`
- No live n8n import, export, activation, or execution occurred unless separately
  approved: `<confirmed-by>`

## Smoke-test evidence

- Admin listing media upload smoke test: `<stage-B-result-or-not-run>`
- Atomic quote workflow RPC smoke test: `<stage-B-result-or-not-run>`
- Browser console server-only env exposure check: `<result-or-not-run>`
- Production read-only route smoke: `<stage-A-or-stage-B-result>`

## Rollback plan

- Rollback owner, trigger, immutable target, and evidence reference:
  `<reviewed-non-secret-summary>`

## Known limitations

- Provider-dependent, browser, customer-data, and launch checks not run in this
  repository-only lane remain unverified.

## Safety confirmations

- No real secrets or env values are included in this PR body.
- No deployment config is included unless this is the separately approved
  deployment PR.
- No customer quote is submitted and no n8n workflow is activated in Stage A.

## Immutable Revision And Deployment Identity

| Field | Required non-secret evidence |
| --- | --- |
| Repository | `<owner/repository>` |
| Requested immutable SHA | `<40-character-approved-sha>` |
| Resolved checkout/build SHA | `<40-character-sha-reported-by-build>` |
| Requested SHA equals resolved SHA | `<PASS-or-FAIL>` |
| Deployment UUID or equivalent immutable deployment identifier | `<immutable-deployment-id>` |
| Pre-deployment deployed SHA | `<40-character-sha>` |
| Pre-deployment deployment identifier | `<immutable-deployment-id>` |
| Environment class | `<controlled-oauth-or-full-enquiry-launch>` |
| Terminal deployment state | `<finished-success-or-failed-safe-state>` |
| Deployment started at | `<ISO-8601-timestamp>` |
| Deployment completed at | `<ISO-8601-timestamp>` |
| Operator | `<approved-operator-name-or-role>` |
| Approval reference | `<issue-comment-change-record-or-other-reference>` |
| Auto-deploy state before and after | `<OFF-confirmed-or-hold>` |

An unresolved, abbreviated, branch-only, tag-only, or unequal revision is a
deployment evidence failure. Do not infer the resolved build SHA from the
requested SHA; capture both independently.

## Build And Runtime Contract

| Field | Required evidence |
| --- | --- |
| Build context | `website/` |
| Node runtime | `24` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Lockfile used | `website/package-lock.json` |
| Pre-deployment command | `<none-or-reviewed-command>` |
| Post-deployment command | `<none-or-reviewed-command>` |
| Build/start command equality with approved contract | `<PASS-or-FAIL>` |

Do not substitute `npm install` for `npm ci`. If the hosting platform needs an
explicit Nixpacks/Coolify Node setting, record only that it resolved to Node 24;
do not record provider credentials or environment values.

## Stage Classification

### Stage A - Controlled OAuth Deployment

- Exact-SHA deployment: `<result-and-evidence-reference>`
- Public read routes only: `<result-and-evidence-reference>`
- Anonymous admin denial: `<result-and-evidence-reference>`
- Google OAuth owner UAT status (`PASS | HOLD - NOT RUN | FAIL`): `<status-and-evidence-reference>`
- Provider signup admission status (`PASS | HOLD - NOT VERIFIED | FAIL`): `<status-and-evidence-reference>`
- Existing-owner readiness: `<PASS-FAIL-or-HOLD>`
- No-public-signup result: `<PASS-FAIL-or-HOLD>`
- Admin mutations remained disabled: `<PASS-or-FAIL>`
- Quote remained disabled: `<PASS-or-FAIL>`
- n8n remained inactive: `<PASS-or-FAIL>`
- No customer quote submission occurred: `<PASS-or-FAIL>`

Stage A must not claim enquiry-launch readiness and must not require active n8n
configuration. Stage A remains incomplete and held until real-owner Google
OAuth UAT passes. A controlled exact-SHA deployment may exist temporarily for
UAT, but its Stage A record remains `HOLD - NOT RUN`, not `PASS`, until the UAT
passes.
Owner OAuth UAT must not start while provider signup admission is
`HOLD - NOT VERIFIED` or `FAIL`.

### Stage B - Full Enquiry Launch

- Reviewed n8n enquiry workflow: `<result-and-evidence-reference>`
- Timestamped HMAC verification and freshness: `<result-and-evidence-reference>`
- Durable idempotency: `<result-and-evidence-reference>`
- Delivery evidence: `<result-and-evidence-reference>`
- Quote deliberately enabled under approval: `<result-and-evidence-reference>`
- Full production-security launch validator: `<result-and-evidence-reference>`
- Quote-email runtime readiness: `<result-and-evidence-reference>`

## Server-only Configuration Presence

Record presence/validity results by name only. Never include a value.

- Public catalogue configuration: `<PASS-or-FAIL-by-env-name>`
- Quote persistence/admission configuration: `<PASS-or-FAIL-or-stage-A-not-required>`
- Admin authentication/workspace configuration: `<PASS-or-FAIL-by-env-name>`
- Admin CSRF protection configuration: `<PASS-or-FAIL-by-env-name>`
- Admin mutation capability (`ADMIN_MUTATIONS_ENABLED`): `<stage-A-explicitly-disabled-or-reviewed-later-state>`
- n8n enquiry handoff configuration: `<PASS-or-FAIL-or-stage-A-not-required>`
- No `NEXT_PUBLIC_SUPABASE_*`: `<PASS-or-FAIL>`
- No `NEXT_PUBLIC_N8N*`: `<PASS-or-FAIL>`
- No service-role runtime path: `<PASS-or-FAIL>`
- No `website/chat-config.js` runtime dependency: `<PASS-or-FAIL>`

## Post-deployment Route Evidence

| Route/check | Expected | Observed safe evidence |
| --- | --- | --- |
| `/` | `200` | `<status-and-timestamp>` |
| `/catalogue` | `200` | `<status-and-timestamp>` |
| `/setups` | `200` | `<status-and-timestamp>` |
| `/about` | `200` | `<status-and-timestamp>` |
| `/quote` read | `200`; no submission in Stage A | `<status-and-timestamp>` |
| `/contact` | intended `404` | `<status-and-timestamp>` |
| anonymous `/admin` | denied or canonical first-party login redirect | `<status-and-timestamp>` |
| approved `www` root | canonical redirect to apex | `<status-and-timestamp>` |
| redirect authority | no localhost/internal proxy authority | `<PASS-or-FAIL>` |
| public response leakage | no provider/SQL/stack/env/secret leakage in route bodies or bounded referenced first-party Next.js bundles | `<PASS-or-FAIL>` |

Attach or reference the secret-safe machine-readable output from
`npm run smoke:production-readonly`. Do not paste response bodies.

There is no direct provider API call by the smoke harness and no mutating
provider call. Route rendering may exercise configured read-only Supabase-backed
application paths through the deployed first-party application. The harness
also scans at most 32 deduplicated same-origin `/_next/static/*.js` assets with
the same 128 KiB response bound and never fetches third-party script origins.

## Enquiry Handoff Evidence - Stage B Only

- The customer submits only to first-party `POST /api/quote`.
- SKR persists the enquiry before attempting the n8n handoff.
- The reviewed n8n handoff verifies timestamped HMAC, freshness, event markers,
  and durable idempotency before delivery.
- Delivery evidence proves the persisted `/api/quote` event reached the intended
  internal delivery path.
- `/api/chat` belongs to the separate chatbot lane; chatbot smoke is not
  enquiry-delivery evidence, nor is a chat workflow or successful chat response.
- No browser-visible n8n URL, shared secret, credential, or provider payload is
  recorded.

## Rollback Evidence

| Field | Required evidence |
| --- | --- |
| Pre-rollback deployed SHA | `<40-character-sha>` |
| Pre-rollback deployment identifier | `<immutable-deployment-id>` |
| Rollback-target stage classification | `<Stage-A-or-Stage-B>` |
| Requested rollback target SHA | `<40-character-reviewed-known-good-sha>` |
| Requested rollback target deployment identifier | `<immutable-deployment-id>` |
| Rollback approval reference | `<approval-reference>` |
| Rollback outcome | `<not-required-success-failed-or-aborted>` |
| Rollback started/completed at | `<ISO-8601-timestamps-or-not-required>` |
| Resolved post-rollback SHA | `<40-character-sha-or-not-required>` |
| Resolved post-rollback deployment identifier | `<immutable-deployment-id-or-not-required>` |
| Exact target/resolved equality result | `<PASS-FAIL-or-not-required>` |
| Post-rollback terminal state | `<safe-terminal-state-or-not-required>` |

The requested rollback target is the reviewed known-good target. The
pre-rollback deployment may be suspect or failed and must not be labelled
known-good merely because it existed before rollback.

## Post-rollback Route Evidence

Record the same public and anonymous-admin route matrix used after deployment,
or state `not required` only when no rollback occurred.

### Stage A rollback target

- quote submission disabled during and after rollback: `<PASS-FAIL>`
- n8n inactive during and after rollback: `<PASS-FAIL>`
- no customer quote submission occurred: `<PASS-FAIL>`

### Stage B rollback target

- quote and n8n state matched the separately reviewed rollback-target contract:
  `<PASS-FAIL-and-evidence-reference>`
- exact intended target state and observed state: `<secret-safe-state-evidence>`
- Stage A invariants were not imposed merely because rollback occurred:
  `<confirmed-by>`

For either target stage, also record:

- no redirect exposed localhost/internal proxy authority: `<PASS-FAIL-or-not-required>`
- no provider/SQL/stack/env/secret leakage appeared: `<PASS-FAIL-or-not-required>`

## Final Safety Confirmation

- No secret-valued field is present in this evidence.
- Requested and resolved SHAs were captured independently and compared exactly.
- Deployment and rollback identifiers are immutable provider identifiers.
- Auto-deploy remained off unless a separate approved change says otherwise.
- Stage A did not submit a quote or activate n8n.
- Stage A kept admin mutations disabled and recorded provider signup admission
  as `PASS` before owner OAuth UAT.
- Stage B evidence, when claimed, is tied to persisted `/api/quote` processing,
  not `/api/chat`.
