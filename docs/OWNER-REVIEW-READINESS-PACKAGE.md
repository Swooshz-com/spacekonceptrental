# Owner Review Readiness Package

This package does not approve deployment and does not deploy anything.

Phase 3J-A/B prepares the current repo-local rental website candidate for
owner review. It summarizes what can be reviewed now, what still needs owner
input, what remains blocked until a later explicit approval, and what is
deferred by design.

## Content Governance Links

Review `docs/content/OWNER-CONTENT-INTAKE.md` for owner-supplied content
requirements and review `docs/content/CONTENT-GAP-REGISTER.md` for content gap
status before any future launch decision. Review
`docs/content/OWNER-REVIEW-ISSUE-LEDGER.md` for owner-review issue categories
and safe status values. Review
`docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md` for the Owner-review
execution checklist and
`docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md` for the Route-by-route
decision matrix.

Owner content blockers must remain separate from deployment approval. Missing
real contact/legal/business-hour content does not get invented. Public launch
cannot proceed until required owner content and explicit deployment approval
are both supplied. Owner review can continue without deployment.

The Protected content readiness workspace at `/admin/content-readiness` is an
admin-only review surface. It summarizes content gaps for authorised admin
review and must not be exposed to public routes or customer-facing issue
tracking.

The protected workspace also includes an admin review snapshot for review
surface groups, route families covered, owner decision categories,
owner-input-required categories, and launch-blocker categories. The snapshot is
for owner/admin review only and does not approve deployment.

## Ready for owner review

- Public website journey from homepage to catalogue, listings, categories,
  events, listing detail pages, and quote/enquiry request.
- Public recovery paths for missing pages and unavailable listing detail
  routes.
- Public copy centered on rental, listing, enquiry, quote, and request
  language.
- Receipt-only quote/enquiry expectations with no public quote tracking or
  customer account surface.
- Protected admin overview, listings, categories, media, quote inbox, and quote
  detail surfaces.
- Protected content readiness workspace for owner-required content gaps and
  owner-review status separation.
- Owner-review execution checklist and Route-by-route decision matrix for
  non-live route-by-route owner/admin decisions.
- Admin-only readiness cues, internal quote follow-up context, and recovery
  links that stay inside protected admin routes.
- Local validation commands and deterministic docs/tests for the owner review
  package.

## Intentionally not implemented

- Deployment, deployment approval, provider connection, and public traffic
  enablement.
- Vercel project configuration, Supabase Cloud configuration, real environment
  values, production seed data, filled preview evidence, and production
  evidence.
- Browser Supabase, service-role runtime paths, public/customer uploads,
  customer accounts, public quote tracking, notifications, CRM integration,
  n8n/Pinecone runtime changes, Pinecone SDK/env/runtime, and `/api/chat`
  retrieval/RAG wiring.
- Ecommerce flows such as carts, checkout, payments, stock reservation,
  confirmed booking, order fulfilment, or online ordering.
- Real business contact details, opening hours, client names, testimonials,
  certifications, awards, legal claims, or production policies that have not
  already been supplied by the owner.
- Public route exposure of the owner-review issue ledger, content readiness
  statuses, protected admin URLs, or admin-only readiness details.

## Public website journey readiness

- `/` introduces the event furniture rental journey and routes visitors to
  listings, categories, events, and quote enquiry.
- `/catalogue` and `/listings` expose public-safe rental listings and quote
  handoff paths.
- `/listings/[slug]` and `/catalogue/[slug]` show listing details, fallback
  images, quote planning copy, and safe recovery when a listing is unavailable.
- `/categories` groups public rental listings and routes to filtered listing
  views or quote enquiry.
- `/events` gives event setup guidance without fixed package, booking, or
  availability promises.
- `/quote` keeps selected-listing context useful while stating that submission
  is not a reservation or availability confirmation.
- Not-found and recovery states point back to public catalogue, listing,
  category, event, or quote enquiry routes.

## Admin listing/category/media readiness

- Protected admin overview summarizes operator QA status and next safe actions.
- Protected listing and category surfaces distinguish public-facing data from
  admin-only readiness cues.
- Protected media surfaces keep image metadata and alt-text readiness inside
  the admin workspace.
- Admin recovery links remain protected admin links and do not route operators
  into public quote or catalogue paths.

## Quote/enquiry intake and admin triage readiness

- Public quote/enquiry submission uses the first-party quote request path.
- Public success copy is receipt-only and does not expose public status or
  tracking links.
- Selected listing context is a planning aid only and does not reserve
  furniture, dates, or delivery capacity.
- Protected admin quote inbox and quote detail surfaces show missing-info
  summaries, requested item snapshots, customer message context, internal
  activity, and admin-only follow-up controls.

## Needs owner-supplied content

- Final public-facing brand spelling and any approved display naming.
- Approved product/listing names, descriptions, images, and alt text.
- Approved event-use wording and any public service-area language.
- Approved contact, availability, operating, legal, and policy content if the
  owner wants those items public later.
- Reviewed admin user access and workspace ownership expectations before any
  future public launch.

## Needs deployment approval later

- Explicit current approval from the owner to open a separate deployment PR.
- External review of hosting target, Supabase project, server-only environment
  placement, admin access, rollback controls, and preview visibility.
- Passing local and CI release gates on the later deployment candidate.
- External decision capture for public traffic enablement and rollback/abort
  readiness.

## Known deferred capabilities

- Customer accounts and public quote status pages.
- Public/customer uploads.
- Notifications and CRM integration.
- SaaS chatbot product work.
- Pinecone/RAG runtime wiring for `/api/chat`.
- Transcript runtime reads/writes, transcript admin UI, retention jobs, and
  deletion/export paths.
- Ecommerce carts, checkout, payments, stock reservation, confirmed booking,
  order fulfilment, and online ordering.

## Non-deployment decision status

This phase is a review-readiness package only. It does not change provider
configuration, connect cloud services, add runtime provider paths, add secrets,
record filled evidence, run external smoke checks, or enable public traffic.

Deployment cannot proceed from this PR. Deployment requires a later explicit
owner decision and a separate implementation/release step.

## Owner go/no-go decision points

| Decision | Meaning | Allowed next action |
| --- | --- | --- |
| Ready for owner review | Owner can review the repo-local website, admin, quote, docs, and validation package. | Continue local/manual review using the manual QA runbook. |
| Needs owner-supplied content | Owner wants content changes before any launch decision. | Open a content/public/admin polish PR that remains non-deployment. |
| Hold deployment | Owner decides public launch is not approved yet. | Keep deployment blocked and continue only approved local polish. |
| Approve future deployment separately | Owner explicitly approves a later deployment lane. | Open a separate deployment PR with provider and evidence review outside this Phase 3J package. |

## Explicitly deferred features

The deferred capabilities above are not blockers for owner review unless the
owner decides one of them must be completed before a later launch decision.
They are not approved by this package.
