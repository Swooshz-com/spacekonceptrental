# Final Security Smoke-Test Runbook

Use this runbook after the post-security cleanup checks pass and before treating
the current SpaceKonceptRental demo state as ready for final runtime smoke
testing.

This is a manual owner-run checklist. Do not run live n8n, Docker, import,
export, workflow execution, or credential operations from automation.

## Scope

- Original security findings are closed, except the unauthenticated public Chat
  Trigger, which is accepted as temporary demo risk until a future authenticated
  or backend-mediated UI exists.
- Keep the public demo chat stateless. The workflow may use `session_id` for
  logging, debounce, dedupe, and operator transcript context, but must not
  connect the public AI Agent to persisted AI memory.
- Keep `.env`, `.n8n-local/`, `.tmp/`, credential bindings, live exports,
  prepared imports, webhook IDs, runtime payloads, private keys, and local
  security CSVs uncommitted.

## Pre-Flight

Run from the repo root:

```powershell
git status --short
npm run validate:n8n
npm run test:n8n-validation
git diff --check
git status --short
```

| Check | Expected Result |
| --- | --- |
| Local security CSVs | `codex-security-findings-*.csv` files are not staged or committed |
| Runtime files | `.env`, `.n8n-local/`, `.tmp/`, live exports/imports, credential bindings, webhook IDs, runtime payloads, and private keys are absent from tracked changes |
| `npm run validate:n8n` | Passes with `errors 0` |
| `npm run test:n8n-validation` | Passes |
| `git diff --check` | No whitespace errors |
| Final `git status --short` | Only intentional repo files are changed |

## Owner-Only Import And Deployment Prep

Do not run these automatically. The owner may run them only after confirming the
target is the intended local or staging n8n instance and that live credentials
are safe to use:

```powershell
.\scripts\import-n8n-workflows-live.ps1 -DryRun
.\scripts\import-n8n-workflows-live.ps1
.\scripts\export-n8n-workflows-live.ps1 -DryRun
.\scripts\export-n8n-workflows-live.ps1
node .\scripts\validate-n8n-workflows.cjs --mode prepared-import .tmp\n8n-live-import
git status --short
```

Prepared import payloads should appear under `.tmp/n8n-live-import/`. Live export
payloads should appear under `.tmp/n8n-live-exports/`, and credential refresh
payloads may appear under `.tmp/n8n-live-credential-exports/`. These files can
contain live workflow IDs, webhook IDs, and credential binding metadata needed
for local import safety, so they must remain uncommitted.

## Customer Support Workflow

| Smoke Test | Expected Result |
| --- | --- |
| FAQ reply | Natural answer, no JSON, conversation row completed, no lead or ticket |
| Lead capture | One lead row with contact details, `conversation_ref`, safe phone text, and bounded transcript context |
| Ticket capture | Ticket row for actionable complaint; no lead unless the customer also asks for a new rental quote |
| Incomplete ticket | Bot asks for missing details; escalation or unanswered notification can fire; no empty ticket row |
| Low-confidence question | No invented facts; unanswered route logs and alerts for follow-up |
| Rapid-message debounce | Older same-session rows become `merged`; one effective answer is sent from the newest row |
| Public chat statelessness | Fresh browser sessions do not load previous chat history or AI memory |
| Gmail readability | Lead, ticket, escalation, unanswered, and failure alerts are readable escaped HTML, not raw JSON |
| Sheets formula safety | Inputs starting with `=`, `+`, `-`, or `@` are stored as literal safe text |
| Transcript truncation | Long transcript context is bounded and indicates truncation when shortened |

## Error Handler

| Smoke Test | Expected Result |
| --- | --- |
| Simulated workflow failure | Failure is visible in n8n execution history and routed to the error workflow |
| Gmail alert | HTML uses escaped safe fields and contains no secrets |
| Sheets failure log | Failure fields are formula-hardened before writing |
| Runtime field precedence | Trusted runtime fields are preferred before passthrough metadata |

## RAG And Pinecone

| Smoke Test | Expected Result |
| --- | --- |
| New KB file ingestion | New chunks are upserted and one `kb_ingestion` row is appended |
| Unchanged re-ingestion | Delete/upsert is skipped for unchanged file state |
| Updated file | Existing vectors are deleted by `source_file_id`, then fresh chunks are upserted |
| Namespace | Pinecone namespace remains exactly `SpaceKonceptRental_kb` |
| Delete retry/error handling | Retryable delete errors do not bypass retry; first-run empty namespace handling does not hide unexpected failures |

## Website

| Smoke Test | Expected Result |
| --- | --- |
| Chat package | `@n8n/chat` remains pinned in `website/index.html` |
| Session loading | `loadPreviousSession: false` remains set |
| Webhook config | No real webhook URL is committed; only placeholders are tracked |
| Config source | Real chat config comes from ignored local or deploy-time config |
| Demo chat | Chat works after local config is supplied and remains stateless across reloads |

## Rollback And Recovery

- If live alerts spam, stop testing and have the owner deactivate the tested
  workflow or pause the alert path in the n8n UI.
- Identify failed workflow executions by workflow name, execution ID, failed
  node, and timestamp before changing anything else.
- Do not commit generated `.tmp/`, `.n8n-local/`, runtime, prepared import,
  credential binding, or security CSV files.
- If a bug appears, save the exact test input, execution ID, failed node, relevant
  Google Sheets row, sanitized email sample or screenshot, workflow activation
  state, and the latest validation output.
