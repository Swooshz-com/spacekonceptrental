# Rollback Drill Result Template

No rollback is approved or performed by this template. Complete it outside Git
only after a separately approved drill or live rollback. Record no secrets,
environment values, credentials, tokens, cookies, webhook URLs, provider
response bodies, workspace/admin identifiers, or customer data.

## Immutable Rollback Identity

| Field | Required non-secret evidence |
| --- | --- |
| Repository | `<owner/repository>` |
| Requested immutable rollback SHA | `<40-character-known-good-sha>` |
| Resolved checkout/build SHA after rollback | `<40-character-sha>` |
| Requested rollback SHA equals resolved SHA | `<PASS-or-FAIL>` |
| Rollback deployment UUID or equivalent immutable identifier | `<immutable-deployment-id>` |
| Previous known-good SHA | `<40-character-pre-rollback-sha>` |
| Previous known-good deployment identifier | `<immutable-deployment-id>` |
| Rollback target deployment identifier | `<immutable-deployment-id>` |
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

## Safety Invariants

- Quote remained disabled during and after rollback: `<PASS-or-FAIL>`
- n8n remained inactive during and after rollback: `<PASS-or-FAIL>`
- No customer quote submission occurred: `<PASS-or-FAIL>`
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
- Quote-disabled or n8n-inactive state cannot be confirmed.
- Any secret, environment value, credential, provider response body, private
  identifier, or customer data would enter the evidence.
