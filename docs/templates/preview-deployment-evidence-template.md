# Preview Deployment Evidence Template

Do not commit filled production evidence.
Do not commit screenshots containing secrets.
Do not commit real env values.
Store filled evidence outside the repo unless a later approved policy says otherwise.

## Candidate

| Field | Redacted value |
| --- | --- |
| Branch | `<redacted>` |
| Commit | `<redacted>` |
| Reviewer | `<redacted>` |
| Review date | `<reviewed externally>` |

## Validation Results

| Command | Result | Evidence note |
| --- | --- | --- |
| `npm run validate:release-candidate` | `<redacted>` | `<reviewed externally>` |
| `npm run validate:deploy-dry-run` | `<redacted>` | `<reviewed externally>` |
| `npm run validate:preview-approval-package` | `<redacted>` | `<reviewed externally>` |
| `cd website && npm test` | `<redacted>` | `<reviewed externally>` |
| `cd website && npm run typecheck` | `<redacted>` | `<reviewed externally>` |
| `cd website && npm run build` | `<redacted>` | `<reviewed externally>` |
| `npm run validate:supabase-migrations` | `<redacted>` | `<reviewed externally>` |
| `npm run test:supabase-migrations` | `<redacted>` | `<reviewed externally>` |
| `npm run test:supabase-rls` | `<redacted>` | `<reviewed externally>` |
| `git diff --check` | `<redacted>` | `<reviewed externally>` |

## External Review Notes

| Area | Redacted evidence note |
| --- | --- |
| Supabase Cloud review | `<reviewed externally>` |
| Vercel project review | `<reviewed externally>` |
| Server-only env placement | `<reviewed externally>` |
| Admin access smoke | `<reviewed externally>` |
| Public listing smoke | `<reviewed externally>` |
| Public quote smoke | `<reviewed externally>` |
| Rollback/abort controls | `<reviewed externally>` |

## Safety Confirmation

| Check | Result |
| --- | --- |
| No real env values committed | `<redacted>` |
| No screenshots containing secrets committed | `<redacted>` |
| No dashboard links committed | `<redacted>` |
| No production evidence committed | `<redacted>` |
| No deployment performed by this evidence capture | `<redacted>` |
