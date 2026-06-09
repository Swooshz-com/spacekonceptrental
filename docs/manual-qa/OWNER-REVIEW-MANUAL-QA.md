# Owner Review Manual QA

## Phase 4D-A/B Local Release-Candidate Freeze References

Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure.

Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.

Last merged capability PR: #151

Merge commit: `9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336`

Phase 4D-A/B adds a repo-local local release-candidate freeze, full-suite reliability gate, deployment-planning firewall closure, validate:local-freeze validator, full website test-suite reliability hardening, and protected admin Phase 4D local-freeze snapshot. These controls are template-only, non-live, not evidence, and do not record owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4D-A/B references `docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md`, `docs/content/FULL-SUITE-RELIABILITY-GATE.md`, `docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md`, and `scripts/validate-local-freeze.cjs`.

No deployment is performed or approved by Phase 4D-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.


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
freeze. Use `docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md` for the
local release-candidate command centre and safe local suite sequence. Use
`docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md` for the final local owner
handoff pack, `docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md` for the local
acceptance triage board, and
`docs/content/DEPLOYMENT-DECISION-FIREWALL.md` for the deployment decision
firewall. Use
`docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md` for the
repo-local quote/enquiry workflow acceptance checklist.
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
Confirm the local release-candidate command centre snapshot references the
command centre, suite runner, safe command allowlist, forbidden command audit,
public leakage audit, provider/deployment boundary, and last local
command-centre update placeholders.
Confirm the final local owner handoff snapshot references the final local owner
handoff pack, acceptance triage board, deployment decision firewall, public
route handoff, protected admin handoff, owner input required, local follow-up,
deployment approval, and last local handoff update placeholders.
Confirm the quote/enquiry acceptance snapshot references the quote/enquiry
workflow checklist, public quote route, listing/category/event handoff,
protected admin triage, internal notes boundary, public tracking/accounts,
deployment approval, and last local quote workflow update placeholders.

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
npm run validate:release-candidate-suite
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
- Confirm the quote form asks for preferred contact method, quantities,
  alternatives, setup/access/timing notes, and receipt-like follow-up copy.
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
- Confirm the local release-candidate command centre snapshot stays
  template-only and points to the local command centre and local-only suite
  runner.
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

Phase 3W-A/B manual QA should include `docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md` as template-only local review support for public catalogue, listing detail, category, event-use handoff, protected admin content ops, and media/alt-text boundaries. Do not fill evidence or record owner sign-off.


Phase 3X-A/B manual QA should include `docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md` as template-only local review support for protected admin listing, category, media, and quote follow-up write-operation boundaries. Do not fill evidence, record owner feedback, record owner sign-off, or treat the checklist as deployment approval.


Phase 3Y-A/B protected admin destructive-action safeguard references: `docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md`, `docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md`, and `docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md`. These are repo-local, template-only, non-live, not evidence, and do not approve deployment. Last merged capability PR: #146. Merge commit: `50316a5c4052607487ba7409d5dc854889db6e24`. Current phase: Phase 3Y-A/B - protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage. Latest completed capability: Phase 3X-A/B protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage.

## Phase 3Z-A/B Public Route Readiness Closure References

- Current phase: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage.
- Latest completed capability: Phase 3Y-A/B protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage.
- Last merged capability PR: #147.
- Merge commit: `7f422fd47ffa75cf982bd4f9d859b530a96961ad`.
- Public journey readiness closure: `docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md`.
- Quote/enquiry public expectation boundary: `docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md`.
- Protected admin public-review bridge: `docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md`.
- Safety: repo-local, template-only, non-live, not evidence, no deployment approval, no provider setup, no ecommerce/payment/order/checkout flow, no fake facts, and no filled owner-review, preview, or production evidence.

## Phase 4A-A/B Local Release-Control References

- Current phase: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.
- Latest completed capability: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage.
- Last merged capability PR: #148.
- Merge commit: `26792f73f8e7943eac5e421c6d829bde7613b562`.
- Local release-control gate: `docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md`.
- Owner-review rehearsal runbook: `docs/content/OWNER-REVIEW-REHEARSAL-RUNBOOK.md`.
- Deployment approval firewall matrix: `docs/content/DEPLOYMENT-APPROVAL-FIREWALL-MATRIX.md`.
- Protected admin release-control workspace: `/admin/release-control`.

These references are repo-local, template-only, non-live, and not evidence. No owner feedback is recorded, no owner sign-off is recorded, no preview/production evidence is created, and no deployment approval is granted.

## Phase 4B-A/B Owner-Input Correction Queue References

- Current phase: Phase 4B-A/B - owner-input intake control, local correction queue, and review-ready handoff closure.
- Latest completed capability: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.
- Last merged capability PR: #149.
- Merge commit: `d825a112d017e95bd28ce030a5755ef78223e4c1`.
- Owner-input intake control: `docs/content/OWNER-INPUT-INTAKE-CONTROL.md`.
- Local correction queue: `docs/content/LOCAL-CORRECTION-QUEUE.md`.
- Review-ready handoff closure: `docs/content/REVIEW-READY-HANDOFF-CLOSURE.md`.
- Protected admin release-control workspace: `/admin/release-control`.

These references are repo-local, template-only, non-live, and not evidence. No owner feedback is recorded, no owner corrections are recorded, no owner sign-off is recorded, no preview evidence is created, no production evidence is created, and no deployment approval is granted.

## Phase 4C-A/B Local Owner-Review Rehearsal References

- Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.
- Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure.
- Last merged capability PR: #150.
- Merge commit: `baa076679756751a725ea65ac565545c6fe56d76`.
- Local owner-review rehearsal pack: `docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md`.
- Local blocker ledger template: `docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md`.
- Local acceptance drill: `docs/content/LOCAL-ACCEPTANCE-DRILL.md`.
- Owner-review rehearsal validator: `scripts/validate-owner-review-rehearsal.cjs` and `validate:owner-review-rehearsal`.
- Protected admin release-control workspace: `/admin/release-control`.
- Evidence boundary: `[NOT EVIDENCE / NOT RECORDED]`.
- Deployment approval boundary: `[DEPLOYMENT APPROVAL: NOT GRANTED]`.
- Safety: no deployment, provider configuration, fake facts, ecommerce/cart/checkout/order/payment/purchase flows, booking/reservation/fulfilment/stock-reservation flows, public uploads, customer accounts, public quote tracking, notifications, CRM, filled owner-review evidence, preview evidence, production evidence, or public admin internals are added.
