# Owner Review Manual QA

This manual QA runbook is non-live and does not approve deployment.

Use it for repo-local owner review of the current rental website candidate.
Do not use this runbook to connect providers, enable public traffic, capture
filled preview evidence, or perform a deployment.

Record content gaps in `docs/content/CONTENT-GAP-REGISTER.md` and collect
owner-supplied content requirements in `docs/content/OWNER-CONTENT-INTAKE.md`.
Use `docs/content/OWNER-REVIEW-ISSUE-LEDGER.md` for owner-review issue
categories and safe status values. Use
`docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md` for the Owner-review
execution checklist and
`docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md` for the Route-by-route
decision matrix. Use `docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md` for the
Owner-review dry-run packet,
`docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md` for the findings
disposition workflow, and
`docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md` for the launch
hold/approve rehearsal. Use
`docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md` for the Owner-review
correction intake,
`docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md` for the
launch-blocker freeze gate, and
`docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md` for the correction PR plan.
Use `docs/content/OWNER-REVIEW-CLOSURE-PACKET.md` for the Owner-review
closure packet,
`docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md` for the readiness
sign-off template, and
`docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md` for deployment
approval separation. Use `docs/content/OWNER-DEMO-WALKTHROUGH.md` for the
Owner-demo walkthrough, public journey review, and protected admin closure
workspace review. Use `docs/content/OWNER-DEMO-ISSUE-BACKLOG.md` for the
Owner-demo issue backlog and product acceptance hardening follow-up template.
Use `docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md` for the local
release-candidate acceptance gate and
`docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md` for the local route inventory
freeze.
Owner content blockers are governance notes only. Missing real
contact/legal/business-hour content does not get invented. Owner review can
continue without deployment.

During protected admin review, use `/admin/content-readiness` to confirm the
admin review snapshot covers review surface groups, route families covered,
owner decision categories, owner-input-required categories, and launch-blocker
categories. Also confirm the dry-run review snapshot references dry-run review
areas, findings disposition statuses, launch decision rehearsal states,
owner-input-required categories, and the explicit deployment approval boundary.
Confirm the correction/freeze snapshot references correction categories,
correction statuses, freeze states, future correction PR types, and the
correction freeze boundary.
Confirm the closure readiness snapshot references current owner-review closure
state, open blockers, correction intake status, closure readiness notes,
deployment approval status, and last local packet update placeholders.
Confirm the owner-demo walkthrough snapshot references public journey review,
admin workflow review, closure readiness, deployment approval, and last local
review packet update placeholders.
Confirm the owner-demo issue backlog snapshot references public route issues,
admin workflow issues, owner input required, locally resolved items, future
launch/deployment blockers, deployment approval, and last local backlog update
placeholders.
Confirm the local release-candidate acceptance snapshot references the local
acceptance matrix, route inventory freeze, public route acceptance, protected
admin acceptance, public leakage audit, provider/deployment boundary, and last
local acceptance update placeholders.

## Local validation commands

Run these commands from the repo root unless noted:

```powershell
cd website && npm test
cd website && npm run typecheck
cd website && npm run build
cd ..
git diff --check
npm run validate:preview-handoff
npm run validate:local-release-candidate
```

`npm run validate:release-candidate` may also be run when local Docker access
is available. If Docker access is unavailable, record that as a local blocker
for the release-candidate gate and keep the review non-live.

## Public route checks

### `/`

- Confirm the page presents the event furniture rental journey.
- Confirm links route to `/listings`, `/categories`, `/events`, and `/quote`.
- Confirm copy uses rental, listing, enquiry, quote, and request wording.
- Confirm there are no admin URLs, internal quote notes, provider errors,
  secrets, stack traces, or public self-service rental completion wording.

### `/catalogue`

- Confirm public catalogue cards render public-safe listing names,
  descriptions, category labels, rental units, image alt text, and quote
  planning copy.
- Confirm listing links route to `/catalogue/[slug]` and quote links route to
  `/quote?listing=...`.
- Confirm empty catalogue recovery routes remain public-only.

### `/listings`

- Confirm public listing cards render public-safe data.
- Confirm category filters keep users on `/listings`.
- Confirm selected listing quote links route to `/quote?listing=...`.
- Confirm filtered-empty states route to public recovery paths only.

### `/listings/[slug]`

- Confirm listing detail pages show one public heading, image/fallback image,
  rental details, quote checklist, and a quote request link.
- Confirm selected listing copy does not imply reservation, confirmed booking,
  or availability confirmation.
- Confirm unavailable listings render safe public recovery.

### `/categories`

- Confirm published categories show public listing counts and public listing
  links.
- Confirm categories without public listings route to all listings or quote
  enquiry.
- Confirm category copy does not expose admin readiness details.

### `/catalogue/[slug]`

- Confirm compatibility listing detail pages show the same public-safe listing
  detail content as the listing route.
- Confirm back links point to public catalogue/category/quote routes.
- Confirm unavailable catalogue detail routes render safe public recovery.

### `/events`

- Confirm event guidance is presented as planning support, not a fixed package
  or booking promise.
- Confirm event setup links route to catalogue, listings, and quote enquiry.
- Confirm event copy avoids invented claims, contact details, or policies.

### `/quote`

- Confirm the quote form asks for contact, event, venue, requested items, and
  setup notes.
- Confirm selected listing context is prefilled only when a valid listing is
  supplied.
- Confirm invalid or missing selected listing context falls back to a general
  rental enquiry.
- Confirm success is receipt-only and does not expose public tracking or
  status links.

### Not-found/recovery states

- Confirm global not-found pages route to public listings and quote enquiry.
- Confirm listing not-found pages route to public listings, categories, and
  quote enquiry.
- Confirm catalogue listing not-found pages route to public catalogue,
  categories, and quote enquiry.
- Confirm recovery copy is generic and does not expose provider errors,
  internals, stack traces, admin routes, or secrets.

## Protected admin checks

### Protected admin overview

- Confirm the overview shows operator QA summary and next safe action copy.
- Confirm the surface remains protected and admin-only.
- Confirm no public quote/customer tracking link is introduced.

### Protected admin listings

- Confirm listing readiness cues distinguish public-facing metadata from
  admin-only readiness.
- Confirm write-enabled listing actions remain inside protected admin routes.
- Confirm missing category, description, rental unit, and media readiness cues
  remain admin-only.

### Protected admin categories

- Confirm category readiness cues distinguish public category grouping from
  admin-only management.
- Confirm empty published category guidance remains admin-only.
- Confirm recovery links stay inside protected admin routes.

### Protected admin media

- Confirm image readiness cues include missing alt text, missing primary image,
  duplicate active primary image, inactive metadata, and no active public image
  cases when applicable.
- Confirm media guidance remains protected admin guidance only.
- Confirm no public/customer upload route is introduced.

### Protected admin quotes

- Confirm quote inbox shows status buckets, missing-info summaries, customer
  message/activity cues, and admin-only next actions.
- Confirm internal notes and activity remain admin-only.
- Confirm public users cannot see admin triage details.

### Protected admin quote detail

- Confirm customer/enquiry details, requested item snapshots, customer message,
  internal activity, current status, and protected follow-up controls are
  readable for authorized admin review.
- Confirm missing quote detail recovery routes back to protected quote
  management.
- Confirm unavailable states do not expose provider errors, SQL, stack traces,
  workspace identifiers, tokens, or raw environment values.

### Protected content readiness workspace

- Confirm `/admin/content-readiness` stays inside the protected admin shell.
- Confirm the workspace links the owner content intake, content gap register,
  and owner-review issue ledger.
- Confirm the workspace separates Blocks owner review, Blocks
  launch/deployment, Deferred after launch, and Not in scope by owner
  direction.
- Confirm the workspace references the Owner-review dry-run packet, findings
  disposition workflow, and launch hold/approve rehearsal without exposing
  them to public routes.
- Confirm the workspace references the Owner-review correction intake,
  launch-blocker freeze gate, and correction PR plan without exposing them to
  public routes.
- Confirm the workspace references the Owner-review closure packet, readiness
  sign-off template, and deployment approval separation without exposing them
  to public routes.
- Confirm the closure readiness snapshot stays template-only and shows
  deployment approval status as not approved / separate explicit approval
  required.
- Confirm the local release-candidate acceptance snapshot stays template-only
  and points to the local acceptance matrix and route inventory freeze.
- Confirm missing facts remain Owner input required.
- Confirm public routes do not expose content readiness statuses, owner-review
  issue ledger details, protected admin URLs, or admin-only readiness notes.

## Owner decision notes

- Ready for owner review means local/manual review can continue.
- Needs owner-supplied content means a later content PR should be opened before
  launch decisions.
- Owner content blockers should be recorded in the content gap register, not
  invented in public copy.
- Owner review ready to close means template-only closure readiness can be
  prepared for later owner confirmation.
- Owner-review closure readiness does not approve deployment, preview
  publication, production launch, provider configuration, or live smoke
  testing.
- Needs deployment approval later means deployment remains blocked until a
  separate explicit owner approval.
- Hold deployment means no provider or public traffic step is allowed.
- Approve future deployment separately means a later deployment PR may be
  prepared, but this runbook still remains non-live.
