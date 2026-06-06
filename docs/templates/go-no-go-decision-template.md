# Go/No-Go Decision Template

Do not commit filled production evidence.
Do not commit screenshots containing secrets.
Do not commit real env values.
Store filled evidence outside the repo unless a later approved policy says otherwise.

This template records the decision shape only. Filled decisions for real
preview/deployment operations must stay outside the repo unless a later
approved policy says otherwise.

| Decision area | Required result | Evidence reference | Decision |
| --- | --- | --- | --- |
| Explicit deployment approval | Current-turn approval exists outside repo | `<reviewed externally>` | `<redacted>` |
| Local validation | All required commands pass | `<reviewed externally>` | `<redacted>` |
| Dry-run validation | No deployment performed | `<reviewed externally>` | `<redacted>` |
| Supabase Cloud review | Project and RLS posture reviewed externally | `<reviewed externally>` | `<redacted>` |
| Vercel project review | Project and rollback controls reviewed externally | `<reviewed externally>` | `<redacted>` |
| Server-only env placement | Names reviewed; values not committed | `<reviewed externally>` | `<redacted>` |
| Admin access smoke | Owner/admin allowed; unsafe roles denied | `<reviewed externally>` | `<redacted>` |
| Public listing smoke | Public-safe listing data only | `<reviewed externally>` | `<redacted>` |
| Public quote smoke | Receipt-only quote/enquiry success | `<reviewed externally>` | `<redacted>` |
| Scope guard | No forbidden runtime expansion | `<reviewed externally>` | `<redacted>` |

## Decision

- Go/no-go: `<redacted>`
- Decision owner: `<redacted>`
- Decision time: `<reviewed externally>`
- Abort condition notes: `<redacted>`
