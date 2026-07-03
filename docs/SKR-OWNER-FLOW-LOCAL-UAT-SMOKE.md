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

## One-Command Local UAT

From the repo root, run:

```powershell
npm run local-uat:owner-flow
```

This command checks the local server first. If it is already reachable, it does
not start another server and it does not stop the existing one. If it is not
reachable, it starts the website dev server with the equivalent of:

```powershell
cd website
npm run dev
```

The helper then polls the local base URL with a bounded startup timeout, runs
`npm run smoke:owner-flow-local` once the server responds, and shuts down only
the child process tree it started. It will not kill an already-running external
server.

By default, the helper checks `http://localhost:3000`. If that default origin is
unreachable or unhealthy, port 3000 appears occupied, and no base URL was
explicitly configured, the helper may try a small bounded set of alternate
local ports and start the dev server with that selected port. The nested smoke
command receives
`SKR_OWNER_FLOW_LOCAL_BASE_URL` for the selected local origin.

If `SKR_OWNER_FLOW_LOCAL_BASE_URL` or `SKR_LOCAL_BASE_URL` is explicitly set,
the helper respects that origin and does not switch ports silently. Fix the
configured server or update the local env value, then rerun the command.

## Existing Next Dev Server Lock

Next.js may refuse to start when another same-project dev server lock already
exists. This can happen even after the helper selects an alternate local port,
because the lock belongs to the `website` project directory rather than only
to port 3000.

When this happens, the helper prints
`FAIL suspected existing Next dev server lock`, the checked URL, selected port,
candidate ports tried, and any safely parsed local URL or PID from the bounded
startup logs. It does not kill or modify the existing process automatically.
That no-kill behaviour is intentional: the helper cannot know whether the
process belongs to another terminal, editor task, or operator workflow.

If a PID is shown, inspect it manually before stopping anything:

```powershell
tasklist /FI "PID eq <pid>"
```

On macOS or Linux:

```sh
ps -p <pid> -o pid,comm,args
```

Then stop the existing Next dev server manually, or restart the terminal/editor
session if the process is stale. After the existing lock is cleared, rerun:

```powershell
npm run local-uat:owner-flow
```

If startup times out, run the dev server directly:

```powershell
cd website
npm run dev
```

Resolve the startup error shown there, then rerun:

```powershell
npm run local-uat:owner-flow
```

## Smoke-Only Run

From the repo root, start the website in one terminal:

```powershell
cd website
npm run dev
```

In another terminal, run:

```powershell
npm run smoke:owner-flow-local
```

`npm run smoke:owner-flow-local` assumes the local server is already running.
Use it when you want only the route smoke and do not want the helper to start a
dev server.

Both local UAT commands default to the normal local Next.js dev origin. If the
local server uses a different origin, set `SKR_OWNER_FLOW_LOCAL_BASE_URL` or
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

The one-command local UAT helper also bounds server startup and smoke command
execution. It prints PASS/SKIP/FAIL/INFO labels, the safe local base URL being
checked, whether alternate-port fallback was attempted, the attempted
`npm run dev` command, waited time on timeout, and the manual next step.

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
