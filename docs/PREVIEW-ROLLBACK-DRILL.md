# Preview Smoke And Rollback Drill

No deployment is performed by this PR.

This runbook is for an operator-run preview smoke and rollback drill after a
separate preview deployment has already been explicitly approved and completed.
It adds local harness and evidence structure only; it does not connect Vercel,
Supabase Cloud, n8n, Pinecone, or any production provider.

Do not commit filled preview or production evidence. Keep screenshots, raw
preview URLs, deployment IDs, environment values, provider logs, webhook URLs,
tokens, and customer data out of git.

## Operator Inputs

| Field | Value |
| --- | --- |
| Preview base URL | `<redacted>` |
| Preview source | `<reviewed externally>` |
| Approval reference | `<reviewed externally>` |
| Operator | `<reviewed externally>` |

The preview smoke harness requires `SKR_PREVIEW_BASE_URL` and fails closed when
the value is missing, local, non-preview, or unsafe. The script redacts the
supplied URL in output and performs only public GET checks against the reviewed
preview target.

## Preview Smoke

Run from the repository root only after the external preview URL has been
reviewed:

```powershell
npm run smoke:preview
```

Record the result with
`docs/templates/preview-smoke-result-template.md` outside git.

## Rollback Drill

Rollback is performed only after explicit operator approval.

The rollback drill is a dry operator rehearsal unless a separately approved
live rollback action names the target, allowed operation, and approver. The
local package records what to verify, not how to mutate a live provider.

| Step | Expected Evidence |
| --- | --- |
| Identify approved rollback target | `<reviewed externally>` |
| Confirm exact previous stable target | `<reviewed externally>` |
| Confirm no secret or raw URL is recorded | `<redacted>` |
| Confirm post-rollback smoke checklist | `<reviewed externally>` |
| Confirm incident notes destination outside git | `<reviewed externally>` |

Use `docs/templates/rollback-drill-result-template.md` for the external drill
record.

## Abort Triggers

- Missing explicit operator approval for deployment, preview smoke, or rollback.
- Missing or unreviewed `SKR_PREVIEW_BASE_URL`.
- Preview target is local, production, non-preview, or otherwise unsafe.
- Any secret, env value, webhook URL, token, provider ID, customer data, or raw
  preview URL would be copied into git.
- Public smoke reveals internal config names, stack traces, transcript data,
  retrieval/RAG internals, admin-only details, customer-visible internal notes,
  public quote tracking, customer accounts, or ecommerce flow language.
- Rollback target or previous stable target cannot be verified externally.

## Static Validation

`npm run validate:preview-smoke-harness` checks this local package without
network access, deployment, provider APIs, real env values, or filled evidence.
