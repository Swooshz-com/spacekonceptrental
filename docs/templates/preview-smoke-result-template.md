# Preview Smoke Result Template

No deployment is performed by this PR.

Do not commit filled preview or production evidence. Complete this template
outside git after a separately approved preview deployment and reviewed
operator-run smoke.

| Field | Value |
| --- | --- |
| Preview base URL | `<redacted>` |
| Preview source | `<reviewed externally>` |
| Approval reference | `<reviewed externally>` |
| Operator | `<reviewed externally>` |
| Started at | `<reviewed externally>` |
| Finished at | `<reviewed externally>` |

## Smoke Checks

| Check | Result | Notes |
| --- | --- | --- |
| Public home | `<reviewed externally>` | `<redacted>` |
| Listings | `<reviewed externally>` | `<redacted>` |
| Categories | `<reviewed externally>` | `<redacted>` |
| Quote enquiry | `<reviewed externally>` | `<redacted>` |
| Chat endpoint safety | `<reviewed externally>` | `<redacted>` |
| Anonymous admin boundary | `<reviewed externally>` | `<redacted>` |

## Abort Triggers

- Raw preview URL, provider ID, deployment ID, env value, secret, webhook URL,
  token, screenshot with secret material, or customer data would be committed.
- Public output exposes internal config, stack traces, transcript data,
  retrieval/RAG internals, admin-only details, public quote tracking, customer
  accounts, or ecommerce flow language.

Rollback is performed only after explicit operator approval.
