# Rollback Drill Result Template

No deployment is performed by this PR.

Do not commit filled preview or production evidence. Complete this template
outside git after a separately approved rollback drill or rollback action.

Rollback is performed only after explicit operator approval.

| Field | Value |
| --- | --- |
| Rollback target | `<redacted>` |
| Previous stable target | `<reviewed externally>` |
| Approval reference | `<reviewed externally>` |
| Operator | `<reviewed externally>` |
| Drill or live action | `<reviewed externally>` |
| Started at | `<reviewed externally>` |
| Finished at | `<reviewed externally>` |

## Rollback Checks

| Check | Result | Notes |
| --- | --- | --- |
| Target identity reviewed externally | `<reviewed externally>` | `<redacted>` |
| Previous stable target reviewed externally | `<reviewed externally>` | `<redacted>` |
| No secrets or raw URLs recorded | `<reviewed externally>` | `<redacted>` |
| Post-rollback public smoke plan ready | `<reviewed externally>` | `<redacted>` |
| Incident notes destination is outside git | `<reviewed externally>` | `<redacted>` |

## Abort Triggers

- Explicit rollback approval is missing.
- Rollback target or previous stable target cannot be verified externally.
- Any raw provider value, env value, secret, webhook URL, token, customer data,
  or filled production evidence would be committed.
- The operator cannot confirm the post-rollback smoke checklist.
