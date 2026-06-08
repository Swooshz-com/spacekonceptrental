# Owner-Demo Walkthrough

This walkthrough is repo-local, template-only, and non-live.

It prepares an owner/admin review of the current rental website candidate
without publishing preview evidence, approving deployment, changing provider
configuration, or filling real owner decisions.

Use this walkthrough with:

- `docs/OWNER-REVIEW-READINESS-PACKAGE.md`
- `docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md`
- `docs/content/OWNER-REVIEW-CLOSURE-PACKET.md`
- `docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md`
- `docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md`

## Walkthrough Placeholders

| Field | Placeholder |
| --- | --- |
| Owner reviewer | `[OWNER REVIEWER]` |
| Review date | `[REVIEW DATE]` |
| Route reviewed | `[ROUTE REVIEWED]` |
| Owner input required | `[OWNER INPUT REQUIRED]` |
| Local issue or follow-up | `[LOCAL ISSUE / FOLLOW-UP]` |
| Deployment approval state | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

## Public homepage review

- Confirm the homepage explains the event furniture rental journey.
- Confirm primary links move to listings, categories, event-use guidance, and
  quote request.
- Confirm copy stays focused on listing, enquiry, quote, request, rental, and
  event furniture wording.
- Record any missing owner-supplied wording as `[OWNER INPUT REQUIRED]`.

## Public catalogue/listing review

- Confirm catalogue and listing pages show public-safe listing names,
  descriptions, category labels, rental units, image alt text, and quote
  request handoff.
- Confirm unavailable listing recovery keeps visitors on public routes.
- Record unclear listing copy or image context as `[LOCAL ISSUE / FOLLOW-UP]`.

## Public category/event-use review

- Confirm categories help visitors browse rental groupings.
- Confirm event-use guidance helps visitors describe setup needs.
- Confirm missing category or event-use facts stay marked for later owner
  input.

## Public quote/enquiry request review

- Confirm the quote/enquiry request route asks for contact method, event date,
  venue, requested listings or items, quantities, and setup notes.
- Confirm the route explains that final rental follow-up happens directly with
  the team.
- Confirm no public status tracking or customer account surface is added.

## Protected admin overview review

- Confirm the protected admin overview stays behind the admin shell.
- Confirm listing, category, media, and quote workflow links stay internal to
  protected admin routes.
- Confirm unavailable admin states do not reveal provider details.

## Protected admin listing/category/media review

- Confirm listing and category controls remain protected admin actions.
- Confirm media readiness uses approved listing image metadata and alt text.
- Confirm public routes only show published listing and active media content.

## Protected admin quote workflow review

- Confirm quote inbox and quote detail surfaces stay protected.
- Confirm internal notes and status history are not shown to public users.
- Confirm follow-up controls remain admin-only.

## Protected content readiness / closure workspace review

- Confirm `/admin/content-readiness` references this walkthrough.
- Confirm closure readiness values remain `[TEMPLATE ONLY]`.
- Confirm deployment approval remains `Not approved / separate explicit
  approval required`.
- Confirm last local review packet update remains `[DATE PLACEHOLDER]`.

## What the owner should check

- Public route wording for listing, enquiry, quote, request, rental, and event
  furniture clarity.
- Listing/category/media content that still needs owner-supplied facts.
- Quote/enquiry expectations before any future launch decision.
- Protected admin workflow labels, recovery copy, and admin-only notes.

## What remains owner input required

- Any real contact, operating, legal, policy, service-area, proof, or
  named-client content not already supplied by the owner.
- Any final listing names, descriptions, image choices, and alt text that need
  owner confirmation.
- Any quote/enquiry expectation wording that needs owner confirmation before
  launch.

## What remains blocked until explicit later approval

- Deployment, public traffic enablement, provider configuration, cloud project
  connection, real environment values, filled preview evidence, and production
  evidence.
- Owner sign-off, owner-review closure, filled owner-review notes, preview
  proof, production proof, and post-launch monitoring.
- Browser Supabase, service-role runtime paths, public/customer uploads,
  customer accounts, public quote tracking, notifications, CRM integration,
  n8n/Pinecone runtime changes, and `/api/chat` retrieval/RAG wiring.
- Public self-service rental completion flows outside the current quote/enquiry
  request path.

## Deployment Approval Boundary

This must not be treated as deployment approval.

Keep this walkthrough placeholder-only until a later owner review happens
outside this PR.
