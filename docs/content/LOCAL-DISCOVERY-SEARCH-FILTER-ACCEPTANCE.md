# Local Discovery Search Filter Acceptance

Status: repo-local, template-only, non-live discovery search/filter acceptance note.
Evidence status: [NOT EVIDENCE / NOT RECORDED].
Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].

This document is not preview evidence, production evidence, smoke evidence, acceptance evidence, owner approval, owner feedback, owner sign-off, provider approval, or deployment approval. It is a local review template for Phase 5C-A/B only.

## Public search/filter path

Public visitors can browse rental listings, search listings by public-safe listing/category/event-use text, use category filter links, use event-use helper links, review an active-filter summary, clear filters back to all rental listings, and send an enquiry when they need team review.

## Category/event-use discovery coverage

- Category discovery remains public-safe and local-only. Category links shape the listing view without creating provider search, RAG, Pinecone, browser Supabase, customer accounts, uploads, notifications, CRM, quote tracking, or transaction flows.
- Event-use discovery remains generic planning guidance. Event-use links and helper copy describe request context only and do not imply availability, hold, completion, fixed packages, response time, or final rental details.
- Public discovery wording stays within rental listing, event furniture, quote, enquiry, request, category, search, and filter language.

## Active filter/search state

Active category, event-use, and search context can be shown as a browsing summary. That summary is editable context only. It can link to clear filters or send an enquiry, but it must not present the context as owner approval, team approval, a confirmed rental, availability, or a completed rental plan.

## Empty-result recovery

Empty search/filter states and public not-found states should guide visitors to browse all listings, browse categories, explore event-use guidance, or send an enquiry. Public recovery must not expose admin URLs, owner handoff internals, owner approval templates, no-deploy command details, release-control internals, internal notes, recovery lanes, destructive-action safeguards, status-transition matrix details, preview evidence, production evidence, or deployment status.

## Quote-intent context boundary

Listing, category, event-use, and search context may prefill or display quote/enquiry request text only when it remains editable and clearly non-promissory. The public quote/enquiry flow starts a request for team review only. It does not create quote tracking, customer accounts, uploads, notifications, CRM work, reservations, holds, bookings, orders, payments, purchases, availability promises, response-time promises, fulfilment promises, or final rental details.

## Protected admin discovery parity helper

The protected admin discovery parity helper summarises public search/filter controls, category/event-use discovery coverage, listing-to-enquiry handoff coverage, quote-intent context safety, empty-result/not-found recovery, owner inputs still missing, claims still blocked, and evidence/deployment boundaries. It references:

- `docs/OWNER-HANDOFF-BUNDLE.md`
- `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`
- `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`
- `docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md`

This helper is authorised-admin-only and must not render on public routes.

## Owner inputs still missing

Owner-supplied facts remain missing for real contact details, business hours, addresses, service-area claims, legal or policy wording, guarantees, certifications, awards, testimonials, client names, operating promises, response-time claims, availability claims, and approval/sign-off decisions.

## Public claims still blocked

Do not publish invented contact details, phone numbers, addresses, business hours, client names, testimonials, certifications, legal claims, guarantees, awards, production policies, response-time claims, service-area claims, availability promises, final rental commitments, ecommerce wording, checkout/payment wording, booking wording, reservation wording, fulfilment wording, or stock-reservation wording.

## No-deploy and no-evidence status

- Evidence status remains [NOT EVIDENCE / NOT RECORDED].
- Deployment status remains [DEPLOYMENT APPROVAL: NOT GRANTED].
- No deployment, provider setup, Supabase Cloud setup, Vercel config, production seed data, real secrets, filled preview evidence, filled production evidence, filled acceptance evidence, smoke evidence, owner feedback, owner approval, owner corrections, owner decisions, or owner sign-off is recorded here.
