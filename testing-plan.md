# SpaceKonceptRental n8n Testing Plan

Use this plan to validate the SpaceKonceptRental capstone workflows from a clean
Codex session on another PC.

Date context: this plan was written on 2026-05-18 SGT for testing on
2026-05-19 SGT. For final post-security runtime smoke testing, also use
`docs/security-smoke-test-runbook.md`.

## Goals

- Confirm the repo workflow JSON still validates.
- Confirm owner-run live n8n import/export prep keeps the repo and local n8n in
  sync when the owner chooses to run it.
- Confirm KB/RAG answers are natural customer replies, not JSON.
- Confirm rapid chat messages are debounced and merged instead of answered too
  early.
- Confirm leads, tickets, unanswered items, escalation emails, and conversation
  logs are written correctly.
- Confirm Google Sheets logs use SGT timestamps in this exact format:
  `YYYY-MM-DD HH:mm:ss SGT`.

## Safety Rules

- Do not delete or clear Google Sheets rows unless the user explicitly confirms.
- Keep sheet headers. If clearing test data, clear data rows only.
- Do not commit `.n8n-local/` or `.tmp/`.
- Do not commit live exports/imports, credential bindings, webhook IDs, runtime
  payloads, private keys, `.env` files, or local security CSVs.
- Do not expose secrets, tokens, cookies, OAuth values, or API keys in chat or
  repo files.
- Before activating, deactivating, publishing, importing, exporting, or testing
  live n8n, state the target and confirm it is the user's local/staging n8n
  instance.
- Live n8n, Docker, import/export, and credential actions are owner-only manual
  steps. Do not run them from automated cleanup or validation.

## Repo Baseline

Run from repo root:

```powershell
git status --short
git branch --show-current
npm.cmd run validate:n8n
```

Expected:

- Branch should be the intended test branch.
- `npm.cmd run validate:n8n` should finish with `errors 0`.
- Warnings about configured emails, Google Sheets URLs, Drive IDs, Pinecone URLs,
  and production-looking URLs are expected for this capstone repo.

If validation fails, stop and fix the repo workflow JSON or validator before live
testing.

## Owner-Only Live Import And Export Check

Target: local n8n Docker container named `n8n`.

Do not run these commands automatically. The owner may run them manually only
after confirming the target is the intended local or staging n8n instance.

Run:

```powershell
.\scripts\import-n8n-workflows-live.ps1 -DryRun
.\scripts\import-n8n-workflows-live.ps1
.\scripts\export-n8n-workflows-live.ps1 -DryRun
.\scripts\export-n8n-workflows-live.ps1
npm.cmd run validate:n8n
git status --short
```

Expected:

- Customer support workflow imports when repo differs from live.
- Unchanged workflows may be skipped.
- Export refreshes `.n8n-local\n8n-credential-bindings.json`.
- `.n8n-local/` and `.tmp/` stay untracked.
- Validation still passes after export.

Important live-state note:

- Import/export may leave workflows inactive. Before testing chat, open n8n and
  intentionally activate or execute the customer support workflow.
- If import warns about previously active or scheduled workflows, the owner
  should restart the intended local n8n runtime before trusting activation state.

## Required Sheets

Main logs workbook:

- `conversations`
- `leads`
- `tickets`
- `unanswered_questions`
- `kb_ingestion`

Error logs workbook:

- `failures`

For clean support-agent testing, clear only data rows in:

- `conversations`
- `leads`
- `tickets`
- `unanswered_questions`

Keep `kb_ingestion` unless rerunning ingestion. Keep all headers.

Extra headers required by the follow-up tracing layer:

- `conversations`: `conversation_ref`
- `leads`: `conversation_ref`, `conversation_transcript`
- `tickets`: `conversation_ref`, `conversation_transcript`
- `unanswered_questions`: `conversation_ref`, `conversation_transcript`

Expected conversation statuses after debounce change:

- `queued`
- `merged`
- `processing`
- `completed`
- `failed`

If the sheet has dropdown validation or conditional formatting on `status`, add
`queued` and `merged`.

## Workflow Health Checks

Open the customer support workflow in n8n and verify:

- `Debounce Chat Batch` is a Wait node with:
  - `resume`: `timeInterval`
  - `amount`: `5`
  - `unit`: `seconds`
- Public chat remains stateless: `SpaceKonceptRental AI Agent` has no AI memory
  connection. `session_id` is still used for logging, debounce, dedupe, and
  operator transcript context.
- Chat Trigger response mode uses response nodes.
- Chat Trigger remains public for the temporary demo flow. This is an accepted
  temporary demo risk until a future authenticated or backend-mediated UI exists.
- `SpaceKonceptRental AI Agent` has streaming off.
- `Agent Structured Output Parser` is connected.
- Google Sheets, Gmail, OpenAI/Gemini, Pinecone, and Drive credentials are
  selected.
- Gmail notification bodies use escaped `safe_*` fields from notification context
  nodes, not raw chat, transcript, or error fields.
- Conversation transcripts in notification emails are bounded to the newest 12
  rows and about 6000 characters, with `[Transcript truncated]` shown when
  context is shortened.
- `website/index.html` pins `@n8n/chat` and sets `loadPreviousSession: false`.
- Real chat webhook URLs are provided only through ignored local or deploy-time
  config, not committed files.

## Test Matrix

Use a fresh chat session unless a test says to continue the same session.

### Test 1 - FAQ Reply

Message:

```text
What is the rental process?
```

Expected:

- Customer sees natural text, not JSON.
- `conversations` gets one completed row.
- `intent` should be FAQ-like.
- No lead row.
- No ticket row.
- `source_file_ids` should be useful Drive file URLs when sources are present.
- `created_at` and `completed_at` use `YYYY-MM-DD HH:mm:ss SGT`.

### Test 2 - Rapid Message Debounce

Send these messages quickly in the same chat, ideally within 5 seconds:

```text
Hi
I need furniture for an event.
20 cocktail tables and 40 stools at Marina Bay Sands.
20 June 2026 for 3 days.
My name is Jamie Lee from Orchard Events, email jamie.multiturn@example.com and phone +65 8123 4567.
```

Expected:

- Older rapid-fire rows are marked `merged`.
- Older rapid-fire rows do not produce their own visible bot reply.
- Newest row becomes `completed`.
- The AI reply understands the full combined request.
- At most one lead row is created for Jamie Lee.
- The lead row includes `conversation_ref` and `conversation_transcript`.
- Lead phone stays as literal text, not `#ERROR!`.
- Phone keeps the leading `+65`.
- Lead details include item count, venue, date, duration, name, email, and phone.
- Email notification, if sent, has a readable subject/body and includes bounded
  conversation transcript context.

### Test 3 - Normal Multi-Turn Lead

Use one chat session, but wait for the bot to reply between turns:

```text
I want to rent furniture for a company event.
```

Then answer missing details naturally when the bot asks. Include:

```text
I need 30 stools and 10 cocktail tables at Suntec on 25 June 2026 for 2 days. My name is Priya Lim, email priya.test@example.com and phone +65 9000 1122.
```

Expected:

- Public chat does not rely on persisted AI memory, so the follow-up message
  includes enough details for the bot to handle it statelessly.
- Lead row is created only once after enough details are available in the
  current customer turn.
- Conversation rows share the same `session_id`.
- Lead row has the same `conversation_ref` as the conversation rows.
- Sorting by `session_id`, then `created_at`, reconstructs the chat.

### Test 4 - Incomplete Complaint

Message:

```text
I had an issue with my previous rental order.
```

Expected:

- Bot asks for missing support-ticket details.
- No lead row.
- No ticket row yet.
- Conversation row is completed.
- Important incomplete support cases still reach an escalation or unanswered
  notification path.
- Escalation/unanswered routing must not create an empty ticket.

### Test 5 - Actionable Complaint Ticket

Continue the same complaint session or start a fresh one:

```text
The delivery arrived late and 4 stools were missing. My name is Alex Tan, email alex.ticket@example.com and phone +65 8123 9999. This is urgent because our event starts tomorrow.
```

Expected:

- Ticket row is created.
- Ticket row includes `conversation_ref` and `conversation_transcript`.
- Lead row is not created unless the customer also asks for a new rental quote.
- Ticket has name, email, phone, category, summary, details, urgency, status, and
  ticket ID.
- Ticket email notification is readable and includes bounded conversation
  transcript context.

### Test 6 - Unknown Or Unsupported Question

Message:

```text
Do you rent transparent levitating chairs with built-in holograms?
```

Expected:

- Bot does not invent facts.
- Bot says it does not have that detail yet and offers escalation/follow-up.
- `unanswered_questions` row is written when confidence is low or answer is not
  in KB.
- Unanswered row includes `conversation_ref` and `conversation_transcript`.
- Unanswered notification email is readable and includes transcript context.

### Test 7 - Source And Link Check

Ask a question that should retrieve KB content:

```text
What are your cancellation terms?
```

Expected:

- Reply is grounded in KB.
- `source_titles` is readable.
- `source_file_ids` contains Drive file URLs, not raw useless file ID strings.
- No invalid `http://filename.md/` style links appear in customer-facing logs.

### Test 8 - Timestamp And Stuck Row Sweep

After all chat tests, wait at least 2 minutes. Then inspect `conversations`.

Expected:

- No rows remain stuck at `queued` or `processing`.
- Older rapid-fire rows may be `merged`.
- Finished rows are `completed` or `failed`.
- All displayed timestamps use `YYYY-MM-DD HH:mm:ss SGT`.

## Email Checks

For lead, ticket, escalation, and unanswered notifications:

- Subject is concise and human-readable.
- Body is not a raw JSON dump.
- Body includes useful contact details.
- Body includes full transcript context where relevant.
- Body does not rely only on first or last message.
- No secrets or credential values appear.

## Ingestion Spot Check

If testing KB ingestion:

1. Confirm the watched Google Drive folder contains only:
   - `kb/01-service-faq.md`
   - `kb/02-rental-terms.md`
   - `kb/03-product-catalogue-summary.md`
   - `kb/04-privacy-policy.md`
2. Trigger the ingestion workflow by uploading or updating a KB file.
3. Check `kb_ingestion`.

Expected:

- One log row per source file event.
- `file_name` is plain text.
- `file_url` is the clickable Drive URL.
- `chunks_count` is numeric.
- `event_type` is `created` or `updated`.
- `ingested_at` uses `YYYY-MM-DD HH:mm:ss SGT`.
- `modified_time` is populated from the Drive file metadata.
- `ingestion_key` combines the stable Drive file ID, modified time, and
  `SpaceKonceptRental_kb` namespace for replay dedupe.
- Re-ingesting a file should not endlessly grow stale Pinecone chunks for that
  file, and an unchanged replay should not append another `kb_ingestion` row.

## Pass Criteria

Testing passes when:

- Repo validation passes, and still passes after owner-run import/export if that
  check is performed.
- Chat replies are natural text, never JSON.
- Rapid messages are merged into one effective AI turn.
- No normal test leaves rows stuck at `queued` or `processing`.
- Leads and tickets are routed correctly.
- Ticket-only complaints do not create lead rows.
- Phone numbers beginning with `+` stay as literal text.
- Email notifications are readable and include useful transcript context.
- Logs use SGT timestamps everywhere.

## If Something Fails

Capture:

- exact message sent;
- execution ID;
- node where it failed;
- row written in Google Sheets;
- screenshot if the issue is visible in n8n or Sheets;
- whether the workflow was active or being manually executed;
- whether the issue happened before or after import/export.

Then run:

```powershell
npm.cmd run validate:n8n
git status --short
```

Do not patch live-only changes without owner-approved export back into the repo
and validation.
