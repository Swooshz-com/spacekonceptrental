# Rollback Drill Result Template

No rollback is approved or performed by this template. Complete it outside Git
only after a separately approved drill or live rollback. Record no secrets,
environment values, credentials, tokens, cookies, webhook URLs, provider
response bodies, workspace/admin identifiers, or customer data.

## Immutable Rollback Identity

| Field | Required non-secret evidence |
| --- | --- |
| Repository | `<owner/repository>` |
| Pre-rollback deployed SHA | `<40-character-sha>` |
| Pre-rollback deployment identifier | `<immutable-deployment-id>` |
| Rollback-target stage classification | `<Stage-A-or-Stage-B>` |
| Requested rollback target SHA | `<40-character-reviewed-known-good-sha>` |
| Requested rollback target deployment identifier | `<immutable-deployment-id>` |
| Resolved post-rollback SHA | `<40-character-sha>` |
| Resolved post-rollback deployment identifier | `<immutable-deployment-id>` |
| Exact target/resolved equality result | `<PASS-or-FAIL>` |
| Deployment UUID or equivalent immutable deployment identifier | `<immutable-deployment-id>` |
| Build context | `website/` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Terminal rollback/deployment state | `<safe-terminal-state>` |
| Rollback started at | `<ISO-8601-timestamp>` |
| Rollback completed at | `<ISO-8601-timestamp>` |
| Operator | `<approved-operator-name-or-role>` |
| Approval reference | `<issue-comment-change-record-or-other-reference>` |
| Auto-deploy state before and after | `<OFF-confirmed-or-hold>` |
| Rollback outcome | `<success-failed-or-aborted>` |

Stop when the requested and resolved SHAs are not exact equals or when either
deployment identifier cannot be captured without exposing a secret.

The requested rollback target is the reviewed known-good target. The
pre-rollback deployment may be suspect or failed and must not be labelled
known-good merely because it existed before rollback.

## Post-rollback Route Evidence

| Route/check | Expected | Observed safe evidence |
| --- | --- | --- |
| `/` | `200` | `<status-and-timestamp>` |
| `/catalogue` | `200` | `<status-and-timestamp>` |
| `/setups` | `200` | `<status-and-timestamp>` |
| `/about` | `200` | `<status-and-timestamp>` |
| `/quote` read | `200`; submission remains separately gated | `<status-and-timestamp>` |
| `/contact` | intended `404` | `<status-and-timestamp>` |
| anonymous `/admin` | denied or canonical first-party login redirect | `<status-and-timestamp>` |
| approved `www` root | canonical redirect to apex | `<status-and-timestamp>` |
| redirect authority | no localhost/internal proxy authority | `<PASS-or-FAIL>` |
| public response leakage | no provider/SQL/stack/env/secret leakage | `<PASS-or-FAIL>` |

## Stage-aware Safety Invariants

### Stage A rollback target

- Quote submission disabled during and after rollback: `<PASS-or-FAIL>`
- n8n inactive during and after rollback: `<PASS-or-FAIL>`
- No customer quote submission occurred: `<PASS-or-FAIL>`

### Stage B rollback target

- Quote and n8n state matched the separately reviewed rollback-target contract:
  `<PASS-or-FAIL-and-evidence-reference>`
- Exact intended target state and observed state: `<secret-safe-state-evidence>`
- Stage A invariants were not imposed merely because rollback occurred:
  `<confirmed-by>`

### All rollback targets

- No provider or production configuration was changed outside the approved
  rollback target: `<PASS-or-FAIL>`
- Post-deployment and post-rollback route evidence references are retained:
  `<approved-evidence-references>`

## Abort Triggers

- Explicit rollback approval is missing.
- Repository, requested SHA, resolved SHA, or immutable deployment identifier
  cannot be proven.
- The requested and resolved SHAs differ.
- Auto-deploy is not in the approved state.
- The operator cannot capture terminal state and timestamps safely.
- The rollback-target stage cannot be classified or its intended quote and n8n
  state cannot be confirmed.
- Any secret, environment value, credential, provider response body, private
  identifier, or customer data would enter the evidence.
