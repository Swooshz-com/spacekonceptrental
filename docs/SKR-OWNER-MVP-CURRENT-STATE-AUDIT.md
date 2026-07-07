# SKR Owner MVP Current-State Audit

Date: 2026-07-03

Branch: `codex/skr-owner-mvp-current-state-audit`

Base inspected: `eb3529b92cf8f55a0fa7dbb1d1a1a1b3d7afe133`
(`eb3529b9`, PR #256 merge, Next dev-lock diagnostics)

Production/security readiness addendum base: `538f93cae34011bbd09fb2e21a9588b14eb5d40f`
(`538f93ca`, current `origin/main` after PR #258).

Protected Hero content/storage foundation addendum base:
`d57d9e4eaadff2142b11f9621a5b90fa5de2330e`
(`d57d9e4`, current `origin/main` after PR #259).

## Scope

This is an audit/report-only pass over current `origin/main` after PR #256.
It does not continue PR #257, does not reuse the public visual polish branch,
and does not add another public visual, copy, CSS, or layout polish layer.

Inspected surfaces:

- Public visitor path: `/`, `/catalogue`, `/listings`, listing/detail routes,
  `/quote`, quote success/error UI, header, footer, and navigation.
- Quote backend path: quote form submission, `/api/quote`, Supabase
  persistence, server-side enquiry email handoff, delivery log write, and
  runtime readiness contract.
- Protected owner admin path: six owner CMS pages only: Dashboard, Hero,
  Catalogue, Setups, Enquiry Email, and Delivery Log.
- Local UAT/tooling path: owner-flow smoke, owner-flow local UAT,
  Docker-aware Supabase RLS readiness, quote email runtime readiness, and
  Next dev-lock diagnostics.

## Instruction Sources Used

- `AGENTS.md`
- `docs/agent-playbooks/INDEX.md`
- `docs/agent-playbooks/project-completion-audit.md`
- `docs/agent-playbooks/safety-gates.md`
- `docs/agent-playbooks/local-docs.md`
- `docs/agent-playbooks/git-completion.md`
- `docs/PHASE-STATUS.md`
- `docs/PHASE-ROADMAP.md`
- `docs/checklists/README.md`
- `docs/SAFETY-BOUNDARIES.md`
- `docs/DECISION-LOG.md`
- `docs/PROJECT-CONTEXT.md`
- `docs/architecture/QUOTE-ENQUIRY-EMAIL-HANDOFF-DELIVERY-LOG-FOUNDATION.md`
- `docs/contracts/server-env-contract.json`
- `docs/SKR-OWNER-FLOW-LOCAL-UAT-SMOKE.md`

`MEMORY.md` does not exist in this checkout.

## Current Owner MVP Status

The current source state appears to be an owner-MVP candidate for the scoped
furniture/event rental website:

- Public visitors can understand the site as `SpaceKonceptRental`, an event
  furniture rental catalogue with catalogue browsing, setup browsing, listing
  detail pages, and a quote/enquiry request path.
- The public flow remains enquiry-led rather than ecommerce-led. Inspected
  public source and tests preserve the no-cart, no-checkout, no-payment,
  no-order, no-booking, no-reservation, no-stock-reservation, no-fulfilment,
  and no-customer-account boundary.
- `/quote` remains intake-only. It gathers contact, event, venue, requested
  listing, quantity, alternate, setup, access, and timing context for manual
  team follow-up.
- `/api/quote` validates and bounds JSON, rate-limits safely, persists the
  quote request through the first-party Supabase quote repository, then runs a
  server-side enquiry email handoff.
- Email handoff and delivery logging are server-only. Public failures remain
  generic and include a safe reference id rather than provider internals.
- Protected owner admin is reset to the six-page workspace: Dashboard, Hero,
  Catalogue, Setups, Enquiry Email, and Delivery Log.
- Enquiry Email and Delivery Log are status/technical visibility surfaces, not
  a quote inbox, not a CRM workflow, and not a customer-facing status system.
- Local owner-flow smoke and UAT tooling exist with route checks, removed-route
  checks, quote email readiness checks, intentional live quote submission skip,
  alternate-port fallback, and Next dev-lock diagnostics.

## Confirmed Working In Source

Public visitor path:

- `/` uses `SpaceKonceptRental | Event furniture rental` metadata and renders
  catalogue-derived homepage sections.
- `/catalogue` reads public catalogue data and supports category/style filters.
- `/listings` renders setup-oriented public browsing from catalogue data.
- `/catalogue/[slug]` and `/listings/[slug]` both have detail routes and safe
  unavailable states.
- `/quote` resolves safe listing context from the query string before passing
  context into the form.
- Header/footer/navigation use `SpaceKonceptRental` and expose catalogue,
  setups, quote, company, and legal routes.

Quote backend path:

- Browser form submission posts only to `/api/quote`.
- The route accepts only bounded `application/json`.
- Public validation rejects unknown top-level and item fields.
- Public input cannot set CRM handoff fields; persistence prepares safe
  server-owned CRM placeholders.
- Persistence uses server-side Supabase helpers and trusted
  `QUOTE_WORKSPACE_ID`.
- Email handoff uses server-side `QUOTE_ENQUIRY_EMAIL_*` and `RESEND_API_KEY`
  env, and does not expose the provider API key.
- Delivery log writes only technical metadata with a redacted recipient and
  bounded provider message/error fields.
- Route tests cover generic public failures for persistence and email handoff
  and assert that raw provider details, secrets, and customer details are not
  exposed in public error bodies.

Protected owner admin path:

- The only protected owner CMS page directories under `website/app/admin` are
  `catalogue`, `delivery-log`, `enquiry-email`, `hero`, and `setups`, plus the
  `/admin` dashboard page and login/logout support routes.
- Removed admin page directories are absent: `/admin/quotes`,
  `/admin/content-readiness`, `/admin/public-parity`, `/admin/release-control`,
  `/admin/listings`, `/admin/categories`, and `/admin/media`.
- Protected admin shell tests assert the six-page navigation and reject Quote
  Inbox, old readiness/release-control pages, CRM-style controls, and ecommerce
  wording from the owner workspace.
- Hero is no longer a disabled future-control placeholder. Approved
  owner/admin users can preview the current workspace-scoped homepage hero
  image, upload a replacement image, edit image alt text, and publish or
  unpublish the hero image through the protected Hero page.
- Hero text and CTA copy are code-owned for owner MVP and are not editable in
  admin. Hero media now uses the dedicated protected `hero-media` Storage
  boundary; image transformation and media-provider integration remain
  deferred.
- Catalogue remains the only owner workspace with listing/category/media
  management controls.
- Setups remain derived from published catalogue records.
- Enquiry Email displays environment-managed recipient/provider status without
  editable settings or send controls.
- Delivery Log reads bounded technical email delivery rows for the trusted
  admin workspace.

Local UAT/tooling path:

- `npm run smoke:owner-flow-local` checks public route availability, protected
  admin response boundaries, removed admin routes, quote email readiness, and
  intentionally skips live quote submission to avoid sending real email.
- `npm run local-uat:owner-flow` starts or reuses a local Next dev server,
  uses bounded startup/smoke timeouts, can select a small alternate local port
  when the default origin is unhealthy and no explicit base URL is configured,
  and shuts down only the child process it started.
- Existing Next dev-lock diagnostics report suspected lock, checked URL,
  selected fallback port, candidate ports, safe PID/URL when available, and
  manual recovery steps without killing external processes.
- `npm run test:supabase-rls` is wired through Docker readiness. If Docker CLI
  exists but the daemon is unavailable, the helper makes one bounded startup
  attempt and reports the attempted command and manual next step.

## What Remains Genuinely Incomplete

No source implementation blocker was found in this audit scope.

No unresolved P0 or P1 source implementation blocker is known from the checked
owner MVP source scope as of the production/security readiness addendum.

The remaining work is operational or deliberately deferred:

- Configure reviewed server-only environment values and pass
  `npm run validate:production-security-readiness -- --launch`
  in the hosted/runtime environment before real hosting or public traffic:
  Supabase URL/anon key, catalogue/quote/admin workspace ids, admin expected
  origin/host, admin CSRF proof secret, quote email recipient, quote email
  sender, and Resend API key.
- Run live/manual quote email verification only after server-side email env
  passes the production-security readiness gate and
  `npm run validate:quote-email-runtime-readiness`.
- Confirm protected Enquiry Email and Delivery Log after the safe quote. The
  Delivery Log remains technical metadata only and must not expose customer
  messages, requested item detail, raw provider payloads, secrets, tokens, or
  provider response bodies.
- Complete owner review of real catalogue items, setup presentation, image
  choices, alt text, and any future raw hero media upload/storage decisions.
- Deployment, Supabase Cloud connection, Vercel config, production evidence,
  monitoring, provider setup, and live traffic approval remain separate future
  approvals.
- Customer confirmation email, public quote tracking, quote inbox, CRM sync,
  HubSpot automation, customer accounts, cart, checkout, payment, order,
  booking, reservation, stock/inventory reservation, and fulfilment remain out
  of current owner-MVP scope and should not be added next without a separate
  explicit approval.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| P0 | None found in the checked source scope. | Closed |
| P1 | None found in the checked source scope. | Closed |
| Launch gate | Production launch is not cleared until `npm run validate:production-security-readiness -- --launch` passes in the hosted/runtime environment. | Required before launch |
| P2 | Live quote submission is intentionally not exercised by local smoke because there is no safe mocked email handoff mode for the real `/api/quote` route. | Expected manual verification after env configuration |
| P3 | Raw Hero media upload/storage remains deferred; protected admin Hero content and URL/reference management are implemented. | Deliberately deferred |

## What Should Not Be Changed Next

- Do not merge or reuse PR #257 public visual polish.
- Do not change public visuals, public CSS, public copy, or layout unless a
  concrete functional bug is found.
- Treat public visuals as frozen unless explicitly requested.
- Do not add another visual-polish layer.
- Do not add quote inbox, CRM workflow, customer confirmation email, public
  quote tracking, customer accounts, cart, checkout, payment, order, booking,
  reservation, stock/inventory reservation, or fulfilment.
- Do not expose provider secrets, raw provider responses, Supabase service-role
  material, n8n webhook URLs, `NEXT_PUBLIC_SUPABASE_*`, or `NEXT_PUBLIC_N8N*`.
- Do not read or use `website/chat-config.js`.
- Do not mutate live external services without a separate current-turn approval
  naming the exact target and action.

## Validation Results

Sandbox note: several commands initially failed with sandbox `spawn EPERM`
before executing their real checks. Each affected command was rerun unchanged
outside the sandbox and the rerun result is recorded below.

| Command | Result |
| --- | --- |
| `cd website && npm run typecheck` | PASS |
| `cd website && npm run test` | PASS after sandbox escalation: 178 test files, 1259 tests. Vitest printed jsdom `window.scrollTo()` notices, but no failures. |
| `cd website && npm run build` | PASS after sandbox escalation. Next build completed and listed expected public, quote, API, and protected admin routes. |
| `npm run test:owner-flow-smoke` | PASS after sandbox escalation: 10 tests. |
| `npm run test:local-uat-owner-flow` | PASS after sandbox escalation: 19 tests. |
| `npm run test:docker-readiness` | PASS after sandbox escalation: 7 tests. |
| `npm run test:quote-email-runtime-readiness` | PASS after sandbox escalation: 4 tests. |
| `npm run validate:local-release-candidate` | PASS after sandbox escalation. Reported no deployment was performed and no deployment approval is implied. |
| `npm run test:supabase-migrations` | PASS after sandbox escalation: 41 tests. |
| `npm run validate:supabase-migrations` | PASS: checked 25 migration SQL files, errors 0. |
| `npm run test:supabase-rls` | PASS. Docker CLI and daemon were ready; the local Postgres RLS harness passed all checks, including quote creation, quote email delivery log RLS, admin workflow RPCs, catalogue write boundaries, and server-only runtime code. |
| `npm run validate:quote-email-runtime-readiness` | EXPECTED LOCAL ENV FAIL: provider `resend`; missing `QUOTE_ENQUIRY_EMAIL_RECIPIENT`, `QUOTE_ENQUIRY_EMAIL_FROM`, and `RESEND_API_KEY`. No env values were printed. |
| `git diff --check` | PASS. |
| `npm run local-uat:owner-flow` | BLOCKED BY EXISTING LOCAL NEXT DEV LOCK after sandbox escalation. The helper selected alternate port `3001`, detected an existing same-project Next dev server at `http://localhost:3000`, reported PID `16840`, did not kill or modify any external process, and printed manual recovery steps. |

Manual recovery for the local UAT lock:

1. Inspect the existing Windows process:

   ```powershell
   tasklist /FI "PID eq 16840"
   ```

2. Stop the existing Next dev server manually, or restart the terminal/editor
   session if the process is stale.
3. Rerun:

   ```powershell
   npm run local-uat:owner-flow
   ```

## Audit Confirmation

- No public visual, public CSS, public copy, or public layout files were
  intentionally changed by this audit.
- PR #257-style public visual polish was not reused.
- This PR is intended to contain this markdown audit report only unless
  validation exposes a small broken validation/docs issue.
