# Local Content Readiness Cleanup

Status: repo-local, template-only, non-live cleanup note.
Evidence status: [NOT EVIDENCE / NOT RECORDED].
Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].

This document is not evidence. It records no owner approval, owner feedback,
owner corrections, owner decisions, owner acceptance, preview evidence,
production evidence, owner sign-off, provider approval, or deployment approval.

## Phase 5A-A/B scope

Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup,
and protected admin review UX closure keeps the site in a local review state.
It improves review readability only. It does not publish, deploy, connect a
provider, configure Supabase Cloud, change Vercel configuration, or record a
live review outcome.

## Public copy made safer

Evidence status: [NOT EVIDENCE / NOT RECORDED].

- Public entry points use listing, rental, event furniture, quote, enquiry,
  and request language.
- Quote/enquiry guidance states that the form starts enquiry intake only.
- Selected listing copy says the selected listing is a starting point, not a
  hold, availability confirmation, or completed rental plan.
- Public fallback and not-found copy points visitors back to rental listings,
  categories, event guidance, or a general rental enquiry.
- Public copy avoids ecommerce, cart, checkout, payment, purchase, booking,
  reservation, fulfilment, and stock-reservation language.

## Owner inputs still missing

Evidence status: [NOT EVIDENCE / NOT RECORDED].

The following remain placeholders for a future owner review and must not be
filled in this repo-local cleanup:

- Owner-approved contact details.
- Owner-approved business hours.
- Owner-approved service-area wording.
- Owner-approved legal, policy, guarantee, certification, award, testimonial,
  client-name, and operational claim wording.
- Owner-approved listing, category, image, and event-use wording corrections.
- Owner-approved quote/enquiry expectation wording.
- Owner decision on whether any later preview or deployment work may begin.

## Public claims still blocked

Evidence status: [NOT EVIDENCE / NOT RECORDED].

Do not add or imply:

- Availability guarantees, delivery guarantees, response-time promises, or
  completed rental plans.
- Specific contact details, addresses, phone numbers, business hours, service
  areas, testimonials, client names, awards, certifications, legal claims, or
  production policies.
- Customer accounts, public quote tracking, uploads, notifications, CRM, cart,
  checkout, order, payment, purchase, booking, reservation, fulfilment, or
  stock-reservation flows.
- Admin internal notes, owner handoff internals, approval issue internals,
  no-deploy preflight details, release-control internals, recovery-lane details,
  destructive-action safeguards, or status-transition matrix details on public
  routes.

## Admin-only review helpers

Evidence status: [NOT EVIDENCE / NOT RECORDED].

Protected admin review helpers now include a Phase 5A owner review checklist
summary that points authorised admins to:

- `docs/OWNER-HANDOFF-BUNDLE.md`
- `docs/content/OWNER-FACING-REVIEW-BRIEF.md`
- `.github/ISSUE_TEMPLATE/owner-approval-request.md`
- `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`
- `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`

These helpers are protected admin-only, template-only, and non-live. They do
not record owner answers or evidence.

## Must still not be deployed

Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].

Do not deploy this phase. Do not run live preview smoke commands. Do not add or
change Vercel configuration, Supabase Cloud configuration, real secrets, real
environment values, production seed data, provider runtime wiring, browser
Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat`
retrieval/RAG wiring, public uploads, customer accounts, public quote tracking,
notifications, CRM, or ecommerce-style flows.
