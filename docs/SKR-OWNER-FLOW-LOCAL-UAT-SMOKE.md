# SKR Owner Flow Local UAT Smoke

This local smoke check helps an operator walk the current SKR MVP owner path
before hosting:

```text
Public catalogue/listings -> item/detail selection -> quote request path ->
quote persistence/email readiness -> protected admin Enquiry Email status ->
protected admin Delivery Log
```

It is local validation only. It does not deploy, publish, configure providers,
write evidence, approve launch, send customer email, add a quote inbox, or add
CRM/ecommerce flows.

## Start Local SKR

From the repo root, start the website in one terminal:

```powershell
cd website
npm run dev
```

In another terminal, run:

```powershell
npm run smoke:owner-flow-local
```

The smoke script defaults to the normal local Next.js dev origin. If the local
server uses a different origin, set `SKR_OWNER_FLOW_LOCAL_BASE_URL` or
`SKR_LOCAL_BASE_URL` in the shell before running the command. Do not commit
local environment files or values.

## What It Checks

- Public homepage responds.
- Public catalogue and listings routes respond.
- Public quote route responds.
- Quote email runtime readiness command exists and can run.
- Live quote submission is skipped unless a safe mocked email handoff mode
  exists; no such mocked mode is currently part of the real `/api/quote` path.
- Protected admin, Enquiry Email, and Delivery Log routes exist and respond
  with protected or unauthenticated behaviour when not logged in.
- Removed admin routes remain non-success:
  `/admin/quotes`, `/admin/quotes/[id]`, `/admin/content-readiness`,
  `/admin/public-parity`, `/admin/release-control`, `/admin/listings`,
  `/admin/categories`, and `/admin/media`.

## PASS, SKIP, And FAIL

- `PASS` means the local route or command behaved as expected.
- `SKIP` means a live action was intentionally not run. The expected skip today
  is quote API live submission, because the smoke script must not risk sending
  real enquiry email.
- `FAIL` means an unexpected local route/runtime condition occurred. The script
  exits non-zero on failures.

The script uses bounded HTTP timeouts and does not print secrets, raw env
values, raw provider errors, or full customer message text.

## Quote Email Handoff Verification

The smoke script runs the quote email runtime readiness command and reports
whether it is configured. It does not print env values.

To manually verify live quote email handoff later, configure server-side:

- `QUOTE_ENQUIRY_EMAIL_PROVIDER`
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT`
- `QUOTE_ENQUIRY_EMAIL_FROM`
- `RESEND_API_KEY`

Then run:

```powershell
npm run validate:quote-email-runtime-readiness
```

Only after that passes should an operator manually submit a safe quote request
against the local server and inspect protected admin Enquiry Email plus
Delivery Log.

## Docker And RLS Validation

Run the Docker-backed RLS validation separately when checking database policy
behaviour:

```powershell
npm run test:supabase-rls
```

That command checks Docker readiness first. If Docker CLI exists but the daemon
is off, it makes one bounded startup attempt. If Docker still cannot start, it
prints the attempted platform command, waited time, and exact manual next step.

## Local Server Missing

If the smoke script cannot reach the local server, start it with:

```powershell
cd website
npm run dev
```

Then rerun:

```powershell
npm run smoke:owner-flow-local
```
