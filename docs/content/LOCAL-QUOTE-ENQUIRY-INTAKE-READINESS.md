# Local Quote/Enquiry Intake Readiness

This note is repo-local, template-only, non-live, and not evidence. It records
Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected
admin triage parity expectations only.

Evidence status: [NOT EVIDENCE / NOT RECORDED]
Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]
Owner approval status: not recorded; owner feedback, owner decisions, owner
corrections, preview evidence, production evidence, acceptance evidence, smoke
evidence, and sign-off are not recorded here.

## Public quote/enquiry form boundary

The public form remains enquiry/request intake only for a normal furniture and
event rental website. Public users can share:

- name and one reliable contact method;
- event date if known;
- venue or location if known;
- requested listings or items;
- quantities, alternates, setup, access, and timing notes;
- a preferred contact method or other customer message.

The form does not create customer accounts, uploads, notifications, CRM actions,
public status views, payment flows, or final rental outcomes.

## Selected context boundary

Listing, category, event-use, and search context may prefill editable request
text only. That context is a starting point for team review and can be changed
by the public user before submission. It is not a fit decision, public status,
availability statement, hold, booking, or rental-detail finalisation.

## Validation/error boundary

Validation remains local and generic for public users. Empty or unsafe public
input is rejected or normalised using the existing quote/enquiry validation path.
Public error copy should help the user check required enquiry details without
showing schema internals, provider details, database details, stack traces,
workspace values, secrets, or admin-only status information.

## Receipt/reference boundary

Receipt copy may say the enquiry was received and may show a public reference as
a receipt/reference only. The public reference is not a tracking portal, status
lookup, accepted outcome, rental availability statement, response promise,
hold, booking, reservation, finalised rental detail, payment, or order.

Required safe receipt concepts:

- received;
- receipt only;
- team can review;
- follow up directly;
- does not set aside furniture;
- does not finalise rental details.

## Protected admin triage parity helper

The protected admin quote triage helper summarises the public intake fields,
listing/category/event/search context handoff sources, receipt/reference
boundary, admin triage expectations, owner inputs still missing, claims still
blocked, and evidence/deployment boundaries.

Reference together with:

- `docs/OWNER-HANDOFF-BUNDLE.md`
- `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`
- `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`
- `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`

The helper must render only in authorised admin state and must not expose admin
internal notes, admin URLs, owner handoff internals, release-control internals,
recovery lanes, destructive-action safeguards, or status-transition matrix
details on public routes.

## Owner inputs still missing

Owner-supplied contact details, service-area wording, legal or policy language,
operating expectations, launch facts, listing/category/event final wording,
image choices, proof claims, client names, testimonials, certifications, awards,
and public response expectations are still missing unless supplied in a later
approved local PR.

## Public claims still blocked

Do not add invented contact details, phone numbers, addresses, business hours,
service-area claims, legal claims, guarantees, awards, testimonials,
certifications, client names, production policies, availability promises,
response-time promises, ecommerce/cart/checkout/order/payment/purchase wording,
booking/reservation/fulfilment wording, stock-reservation wording, provider
requirements, deployment evidence, preview evidence, production evidence, owner
approval, owner feedback, owner decisions, owner corrections, acceptance
evidence, smoke evidence, or sign-off.

## No-deploy/no-evidence status

Phase 5E-A/B is local product polish, validation, docs, and test coverage only.
No deployment is performed or approved by Phase 5E-A/B. No Vercel config,
Supabase Cloud config, provider runtime requirement, real secret, real env value,
production seed data, filled preview evidence, filled owner-review evidence, or
production evidence is added.
