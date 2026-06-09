# Phase 4A-A/B Local Release-Control Gate

This release-control gate is repo-local, template-only, non-live, and not evidence. It consolidates public route readiness, protected admin readiness, owner input requirements, local acceptance status, and deployment approval boundaries before any future deployment discussion.

It does not record real owner review, real acceptance, preview evidence, production evidence, owner feedback, owner sign-off, or deployment approval.

## Release-control states

- Local review ready
- Owner input required
- Local correction required
- Protected admin review required
- Blocked before public visibility
- Blocked before deployment planning
- Requires separate deployment approval

## Gate matrix

| Gate area | Required local check | Safe status | Blocked status | Owner input boundary | Public exposure boundary | Local acceptance placeholder | Deployment approval remains not granted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public route readiness | Review homepage, listings, catalogue/category, event-use, listing detail, quote/enquiry, and not-found routes locally for rental/enquiry wording only. | Local review ready | Local correction required; Blocked before public visibility | Missing owner facts stay absent and are marked Owner input required. | Public routes must not expose protected admin URLs, internal notes, release-control details, owner-review templates, or deployment firewall details. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Quote/enquiry expectation boundary | Confirm public copy presents enquiry intake and receipt-style confirmation only. | Local review ready | Blocked before public visibility | Owner must supply any final quote expectation wording before public use. | No guaranteed availability, confirmed scheduling, public quote tracking, customer accounts, uploads, CRM, notifications, payment, checkout, purchase, ecommerce, cart, order, booking, reservation, fulfilment, or stock-reservation flow is added. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Listing/category/media readiness | Review listing names, category labels, event furniture fit, images, and alt-text placeholders through local/protected admin surfaces. | Protected admin review required | Owner input required; Local correction required | Unsupported real-world listing facts, media choices, contact facts, service claims, and policy claims remain Owner input required. | Public routes may show only approved or placeholder-safe rental listing guidance and must not claim owner approval. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Protected admin write/destructive-action safeguards | Confirm admin-only write, archive, unpublish, image, quote status, and internal-note safeguards remain protected and locally testable. | Protected admin review required | Blocked before public visibility; Blocked before deployment planning | Owner decisions are placeholders until supplied in a future review. | Destructive-action safeguards, recovery lane statuses, status-transition matrix details, internal notes, and admin URLs stay off public routes. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Public leakage boundary | Inspect public source and rendered public routes for release-control, owner-review, admin, and deployment details. | Local review ready | Blocked before public visibility | Missing owner feedback is not inferred or filled. | Release-control gate details, owner-review rehearsal details, deployment approval firewall matrix details, protected admin URLs, recovery lanes, destructive-action safeguards, status transitions, and owner-review templates stay protected. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Fake-fact/business-claim boundary | Confirm no invented contact details, business hours, addresses, testimonials, certifications, awards, legal claims, guarantees, response times, service-area claims, or operational promises were added. | Local review ready | Owner input required; Blocked before public visibility | Owner must provide and approve any real business facts before use. | Public copy remains neutral rental/event furniture and quote/enquiry copy until facts are supplied. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Provider/runtime/deployment boundary | Confirm no Vercel config, Supabase Cloud config, browser Supabase, service-role runtime paths, n8n/Pinecone runtime, deployment command, live preview smoke, or provider runtime was added. | Blocked before deployment planning | Requires separate deployment approval | Owner input alone is not deployment approval. | Public routes must not imply preview, production, provider, or launch status. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Local acceptance command boundary | Run only repo-local validation commands and record results in PR text, not evidence files. | Local review ready | Local correction required | Owner review placeholders remain unfilled if not provided. | Public users see no validation logs, owner-review notes, preview evidence, production evidence, or sign-off records. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |

## Template-only placeholders

- [OWNER DECISION NEEDED: TBD]
- [MISSING OWNER INPUT: TBD]
- [LOCAL CORRECTION: TBD]
- [PROTECTED ADMIN REVIEW: NOT RUN / PASS / NEEDS FOLLOW-UP]
- [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP]
- [DEPLOYMENT APPROVAL: NOT GRANTED]

## Explicit non-evidence boundary

This document is not owner feedback, not owner sign-off, not filled acceptance, not preview evidence, not production evidence, and not permission to deploy.
