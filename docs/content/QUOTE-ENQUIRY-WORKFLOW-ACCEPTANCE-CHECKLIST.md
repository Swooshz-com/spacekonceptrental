# Quote Enquiry Workflow Acceptance Checklist

This checklist is repo-local, template-only, non-live, and not evidence.

It defines local expectations for the public quote/enquiry path, public
listing/category/event handoff, and protected admin quote triage. It does not
record owner feedback, owner approval, filled acceptance results, preview
publication, production launch, provider configuration, or deployment approval.

## Checklist Template Fields

| Field | Placeholder |
| --- | --- |
| Route or area | `[ROUTE / AREA]` |
| Audience | `[PUBLIC / PROTECTED ADMIN]` |
| Quote or enquiry check | `[QUOTE / ENQUIRY CHECK]` |
| Local acceptance state | `[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]` |
| Owner input required | `[OWNER INPUT REQUIRED]` |
| Local follow-up | `[LOCAL FOLLOW-UP]` |
| Deployment approval | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

## Public quote/enquiry route expectations

- Public users can understand that the route is for a rental quote/enquiry
  request.
- Public guidance asks for event date, venue or location, requested listings or
  items, quantities, alternatives, setup/access/timing notes, and preferred
  contact method.
- Response copy stays receipt-like: request received, the team can follow up,
  and the user can share more details if needed.
- Validation errors keep entered rental details and selected listing context
  available for review.
- Failed submit recovery says the quote request was not sent, asks the visitor
  to review details and try again, and keeps entered details where browser
  state allows.
- Successful submit keeps receipt copy manual-follow-up focused and preserves
  requested listing/item context for protected admin triage.
- Invalid or missing listing handoff recovers to a general rental enquiry
  without exposing admin or internal listing details.

## Listing/category/event handoff expectations

- Listing detail routes offer Request this listing.
- Category routes offer Send category enquiry.
- Event routes offer Compare event setup guidance and Start quote request.
- Handoff copy asks users to bring event details, add quantities and
  alternatives, and share setup/access/timing notes.

## Protected admin quote triage expectations

- Protected admin quote surfaces group contact and follow-up, event and setup
  details, requested listings and items, and admin-only status and notes.
- Internal notes and status history stay inside protected admin surfaces.
- Empty and unavailable states keep admins oriented without adding public quote
  tracking, customer accounts, notifications, CRM, uploads, or outbound
  automation.

## Public copy allowed wording

- listing
- enquiry
- quote
- request
- rental
- event furniture
- request received
- the team can follow up
- share more details

## Public copy forbidden wording

Public routes must not use internal handoff, protected admin, local acceptance,
deployment, provider, evidence, customer account, public tracking,
transaction-like, retail-like, stock-hold-like, rental-completion-like, or
self-service account language.

## Admin-only internal note boundary

Internal notes, status history, protected workflow recovery, acceptance
placeholders, and local follow-up stay in protected admin or repo-local docs
only. They must not be rendered on public quote, listing, category, catalogue,
event, or recovery routes.

## Local acceptance placeholders

Use `[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]` only as a
placeholder. Do not fill it with a dated or real result in this phase. Use
`[QUOTE / ENQUIRY CHECK]`, `[OWNER INPUT REQUIRED]`, and `[LOCAL FOLLOW-UP]`
for placeholder review rows only.

## Deployment boundary

The deployment approval state is `[DEPLOYMENT APPROVAL: NOT GRANTED]`.
Completing this checklist does not approve deployment, provider configuration,
preview publication, production launch, live preview checks, or evidence
capture.
