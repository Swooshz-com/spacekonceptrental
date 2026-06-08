# Local Release-Candidate Command Centre

This command centre is repo-local, template-only, non-live, and not evidence.

It defines the safe local command suite for the current furniture/event rental
website candidate. It does not record acceptance results, owner review,
preview evidence, production evidence, or deployment approval.

## Safe Local Command Groups

| Field | Placeholder |
| --- | --- |
| Command group | `[COMMAND GROUP]` |
| Command | `[COMMAND]` |
| Local purpose | `[LOCAL PURPOSE]` |
| Local status | `[PASS / FAIL / NOT RUN]` |
| Local follow-up | `[LOCAL FOLLOW-UP]` |
| Deployment approval | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

Safe local command groups are limited to repo validators, Supabase migration
and RLS checks, n8n export validators, website tests, website typecheck, and
website build checks that run from local files.

## Forbidden commands

Do not run deployment commands, provider-linking commands, provider secret
commands, live preview smoke commands, network URL calls, evidence writers, or
environment-file commands as part of this local suite.

Forbidden command categories include:

- Vercel deployment, linking, environment, pull, or promotion commands.
- Supabase Cloud linking, login, project, secret, function, remote database,
  push, pull, or reset commands.
- Live preview smoke commands.
- Network URL calls.
- Evidence directory writes.
- Environment-file reads or writes.
- Legacy local chat configuration reads or writes.

## Local acceptance-suite sequence

| Sequence | Command group | Command | Local purpose | What the command proves | What the command does not prove |
| --- | --- | --- | --- | --- | --- |
| 1 | `[COMMAND GROUP]` | `[COMMAND]` | `[LOCAL PURPOSE]` | Local repo package validation is internally coherent. | Does not prove deployment readiness or provider configuration. |
| 2 | `[COMMAND GROUP]` | `[COMMAND]` | `[LOCAL PURPOSE]` | Local preview handoff and release-candidate docs remain guarded. | Does not create preview evidence. |
| 3 | `[COMMAND GROUP]` | `[COMMAND]` | `[LOCAL PURPOSE]` | Local database migration and RLS checks remain deterministic. | Does not connect Supabase Cloud. |
| 4 | `[COMMAND GROUP]` | `[COMMAND]` | `[LOCAL PURPOSE]` | Local n8n workflow exports remain valid. | Does not run live n8n workflows. |
| 5 | `[COMMAND GROUP]` | `[COMMAND]` | `[LOCAL PURPOSE]` | Website tests, typecheck, and build remain coherent. | Does not publish a preview or production site. |

## What each command proves

Each `[COMMAND]` proves only the local purpose named in `[LOCAL PURPOSE]`.

## What each command does not prove

No `[COMMAND]` proves deployment approval, provider configuration, preview
publication, production launch, owner sign-off, or filled evidence.

## What remains blocked until explicit future approval

- Deployment, public traffic enablement, provider configuration, cloud project
  connection, real environment values, filled preview evidence, filled
  production evidence, and owner approval remain blocked.
- Browser Supabase, service-role runtime paths, public/customer uploads,
  customer accounts, public quote tracking, notifications, CRM integration,
  n8n/Pinecone runtime changes, and `/api/chat` retrieval wiring remain
  blocked.
- Missing real contact, legal, policy, business-hour, service-area, proof-like
  public claims, named-client, or assurance content remains owner input
  required and must not be invented.

## How to report failures without creating filled evidence

- Report the failed `[COMMAND]`.
- Report the local failure summary as `[LOCAL FOLLOW-UP]`.
- Keep status as `[PASS / FAIL / NOT RUN]`.
- Keep deployment approval as `[DEPLOYMENT APPROVAL: NOT GRANTED]`.
- Do not create evidence files, screenshots, provider records, owner-review
  evidence, preview evidence, production evidence, or launch approval records.
