# Owner-Review Execution Checklist

This checklist is a repo-local owner/admin review control. It does not approve
deployment, does not deploy anything, does not connect providers, and does not
create public customer-facing route tracking.

Use this checklist with:

- `docs/content/OWNER-CONTENT-INTAKE.md`
- `docs/content/CONTENT-GAP-REGISTER.md`
- `docs/content/OWNER-REVIEW-ISSUE-LEDGER.md`
- `docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md`

Unknown real-world business facts stay marked as `Owner input required` until
the owner supplies and approves them.

## Review Process

1. Review each public surface for public-safe wording, listing usefulness, and
   quote/enquiry clarity.
2. Review each protected admin surface for operator usefulness and visibility
   boundaries.
3. Record the owner decision as one of the safe ledger statuses.
4. Keep launch blocked where owner-required facts are missing.
5. Keep deferred or excluded capabilities out of public copy and protected
   workflow scope until separately approved.

## Execution Checklist

| Surface | What to review | Required owner decision | Owner input required fields | Launch/deployment blocker status | Deferred/not-in-scope notes | Public/admin visibility boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Public homepage | Brand wording, rental/event positioning, route entry points, and quote request path. | Approve current public-safe overview or supply replacement wording. | Approved brand spelling and public display name. | Blocks launch/deployment if owner requires brand or homepage wording changes before launch. | Extra proof or assurance content stays excluded until owner-supplied. | Public route only; no admin issue details. |
| Public catalogue/listings | Listing index usefulness, category filters, listing summaries, and quote-start cues. | Approve listing browse flow or identify missing owner-approved listing copy. | Approved listing names, short descriptions, category grouping, image choices, and alt text. | Blocks launch/deployment for any launch listing with missing owner-approved content. | Advanced filtering or self-service status features remain deferred. | Public route only; no protected workflow notes. |
| Public listing detail | Listing detail copy, selected-listing quote context, image readiness, and recovery copy. | Approve detail wording or mark affected listing as owner input required. | Listing descriptions, rental unit wording, image selection, and alt text. | Blocks launch/deployment for affected launch listing pages. | Optional content depth can wait until after owner review. | Public route only; internal readiness stays protected. |
| Public categories | Category grouping, category labels, empty-state copy, and links back to listings. | Approve category structure or request category name/grouping changes. | Category names, display order, and owner-approved category descriptions if required. | Blocks launch/deployment only for launch categories the owner requires. | Per-category detail routes remain out of current route scope. | Public route only; admin category controls stay protected. |
| Public events/event-use guidance | Event-use wording, planning cues, and quote request handoff. | Approve public-safe event guidance or supply owner-approved event-use copy. | Event-use wording and setup expectation wording if required. | Blocks launch/deployment only if owner requires event-use detail for launch. | Additional venue or service-area detail stays owner input required. | Public route only; no admin review ledger details. |
| Public quote/enquiry request flow | Form labels, selected-listing context, receipt-only expectations, and fallback copy. | Approve quote/enquiry wording or supply owner-approved expectation text. | Quote follow-up wording, operating expectation wording, and approved public contact wording if required. | Blocks launch/deployment if owner requires expectation wording before launch. | Public status tracking and self-service account capabilities remain excluded. | Public route only; internal notes and workflow status stay protected. |
| Public recovery/not-found states | Missing listing/category recovery, public-safe fallback guidance, and quote path recovery. | Approve recovery copy or supply safer owner-approved wording. | Recovery wording for missing public listings or catalogue pages if required. | Does not block owner review unless owner requires changed recovery copy. | Rich diagnostic or issue-tracking views remain excluded. | Public route only; no admin-only diagnosis. |
| Protected admin overview | Admin operations entry points, summary counts, and protected route navigation. | Confirm whether the overview supports owner/admin review. | Admin operator ownership and workspace review responsibility. | Blocks launch/deployment if admin ownership must be resolved before public traffic. | Extra operational reporting remains deferred. | Protected admin route only. |
| Protected admin listings/categories/media | Listing, category, image metadata, upload readiness, and publication workflow review. | Confirm owner/admin responsibilities for listing and media review. | Listing owner, category owner, image owner, alt-text owner, and review cadence. | Blocks launch/deployment for launch listings without owner-approved content or media readiness. | Storage/provider changes stay out of this phase. | Protected admin route only; public sees only published safe content. |
| Protected admin quote inbox/detail | Quote inbox usefulness, detail view, status workflow, and admin-only follow-up context. | Confirm admin operator responsibility for quote triage and follow-up. | Quote owner, follow-up responsibility, and internal note handling expectations. | Blocks launch/deployment if owner requires admin workflow ownership before public traffic. | External sales-system or outbound automation capabilities remain excluded. | Protected admin route only; internal notes stay protected. |
| Protected admin content readiness workspace | Owner input gaps, launch blockers, route decision matrix, and execution checklist cross-links. | Confirm the owner-review package is ready for non-live review. | Any remaining owner-required content, operator ownership, and launch-blocker decisions. | Blocks launch/deployment until required owner input and separate deployment approval exist. | Provider, deployment, and future search-assistant work remain out of current scope. | Protected admin route only; public routes do not expose readiness status. |

## Safe Closure Rules

- `Owner input required` means the project must not invent the missing fact,
  claim, asset, operator, or policy.
- `Ready for owner review` means local owner/admin review can proceed without
  deployment or provider work.
- `Blocks owner review` means the owner cannot close that review surface until
  the missing input is resolved.
- `Blocks launch/deployment` means public launch stays blocked until owner
  input and explicit later deployment approval both exist.
- `Deferred after launch` and `Not in scope by owner direction` stay out of the
  current implementation unless the owner separately approves them.
