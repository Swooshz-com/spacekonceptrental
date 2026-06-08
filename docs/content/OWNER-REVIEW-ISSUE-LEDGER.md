# Owner-Review Issue Ledger

This ledger is a repo-local owner-review control. It does not approve
deployment, does not deploy anything, does not connect providers, and does not
create public customer-facing issue tracking.

Use this ledger with `docs/content/OWNER-CONTENT-INTAKE.md` and
`docs/content/CONTENT-GAP-REGISTER.md`. Unknown real-world business facts stay
marked as `Owner input required` until the owner supplies and approves them.

## Safe Status Values

| Status | Meaning |
| --- | --- |
| Owner input required | The project cannot invent the missing fact, wording, asset, owner, or policy. |
| Ready for owner review | The issue can be reviewed locally without deployment or provider changes. |
| Blocks owner review | The owner cannot close review for the affected area until this is resolved. |
| Blocks launch/deployment | Public launch cannot proceed until this owner input and explicit deployment approval are both supplied. |
| Deferred after launch | The issue is useful later but not required for the current owner review. |
| Not in scope by owner direction | The issue remains intentionally excluded unless the owner separately approves it. |

## Issue Categories

| Category | What belongs here | Safe handling |
| --- | --- | --- |
| Public copy | Homepage, catalogue, listing, category, event, quote, metadata, and recovery copy. | Keep unsupported facts as `Owner input required`; do not add fake proof, contact, legal, or policy claims. |
| Listing/category/event content | Listing names, category grouping, rental descriptions, event-use wording, setup expectations, and selected-listing quote context. | Keep launch-sensitive content in the gap register until approved by the owner. |
| Images and alt text | Image selection, primary image choices, gallery readiness, fallback image notes, and alt-text wording. | Use only approved images and honest alt text; keep missing final assets as owner input. |
| Quote/enquiry expectations | Receipt-only submission copy, follow-up expectations, availability wording, setup notes, requested item context, and general rental enquiry handling. | Do not imply reservations, confirmed bookings, public tracking, or ecommerce flows. |
| Admin operator ownership | Protected admin review ownership, workspace/operator responsibility, listing/media/quote review ownership, and admin-only next actions. | Keep this information inside protected admin routes and repo-local docs. |
| Legal/policy/contact gaps | Public contact wording, business-hour wording, policy wording, legal review needs, proof claims, and public assurance wording. | Treat every missing real-world fact as owner input; do not invent public facts or claims. |
| Launch/deployment blockers | Owner content required before public launch, explicit deployment approval, provider review, public traffic readiness, and evidence boundaries. | Keep launch blocked until owner input and separate deployment approval exist. |

## Ledger Use

- Record only issue categories, safe statuses, affected surfaces, and required
  owner input.
- Keep public copy changes in separate implementation PRs when the owner
  supplies approved content.
- Keep deployment/provider work out of this ledger unless it is recorded as
  blocked pending separate approval.
- Do not add real contact details or unsupported public proof, assurance,
  legal, guarantee, or operations claims.
- Do not turn owner review issues into public route issue tracking, customer
  accounts, public quote tracking, notifications, CRM, or ecommerce flows.
