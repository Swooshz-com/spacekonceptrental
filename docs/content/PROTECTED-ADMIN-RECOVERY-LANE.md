# Protected Admin Recovery Lane

This recovery lane is repo-local, template-only, non-live, and not evidence. It describes admin-only recovery behaviour for protected operations that fail or remain incomplete. It must not be exposed to public routes, public source surfaces, public quote/enquiry pages, or customer-facing copy.

Deployment approval remains not granted. Recovery statuses are local admin workflow labels only.

## Safe recovery statuses

- Admin review required
- Owner input required
- Retry protected write
- Keep draft/protected
- Safe to retry locally
- Blocked before public visibility
- Requires separate deployment approval

## Recovery behaviours

| Scenario | Admin-only recovery behaviour | Safe recovery status | Public exposure boundary | Local acceptance placeholder | Deployment approval remains not granted |
| --- | --- | --- | --- | --- | --- |
| Failed listing save | Keep the prior listing state, check protected write error copy, validate public fields, and retry through the protected listing route only. | Retry protected write | Do not show failed-save details, admin URLs, or recovery state publicly. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Missing category | Keep the listing draft/protected until a safe category is selected or owner input confirms grouping. | Keep draft/protected | Public routes must not expose missing grouping notes. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Listing missing public-safe description | Keep draft/protected and request owner-safe rental/event furniture wording. | Owner input required | Public routes must not expose admin description warnings. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Missing rental unit | Keep draft/protected until the unit label supports quote/request wording without availability claims. | Blocked before public visibility | Public routes must not infer stock, reservation, or fulfilment meaning. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Listing missing media | Keep published readiness under admin review or keep the listing draft if public browsing would be incomplete. | Admin review required | Public routes may use existing safe fallbacks only; admin media warnings stay protected. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Media missing alt text | Keep media inactive or fix alt text before selecting it as public-ready or primary. | Blocked before public visibility | Public routes must not expose admin alt-text recovery notes. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Category published but empty | Keep the category unpublished/protected or add reviewed published listings before public use. | Admin review required | Public routes must not expose empty-category admin warnings. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Quote status update failure | Keep the prior internal status, retry protected write locally, and avoid customer-facing status promises. | Safe to retry locally | Public quote/enquiry surfaces must not show internal status or tracking. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Quote internal note update failure | Keep the note unsaved, review wording for privacy and unsupported claims, then retry protected write locally. | Retry protected write | Internal notes must not render publicly. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| Any launch or deployment step | Stop local recovery and request separate explicit approval naming the target operation. | Requires separate deployment approval | Public users must not receive deployment or provider-status claims. | [LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP] | [DEPLOYMENT APPROVAL: NOT GRANTED] |

## Admin-only boundary

Recovery lane details stay inside protected admin documentation and the protected content readiness workspace. They are not public help text, public route content, customer account features, public quote tracking, notifications, CRM, deployment evidence, preview evidence, or production evidence.
