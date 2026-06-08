# Owner-Review Correction PR Plan

This plan is repo-local and non-deployment. It does not implement actual owner
corrections. It defines how future owner-supplied corrections should be split
into safe PRs after the owner supplies approved content outside this phase.

## Future Safe PR Types

| PR type | Allowed changes | Forbidden changes | Required validation | Evidence handling |
| --- | --- | --- | --- | --- |
| Public copy correction PR | Update public-safe homepage, event, recovery, or shared copy using owner-supplied wording. | No invented facts, contact details, legal claims, provider config, deployment approval, or ecommerce wording. | Website tests, typecheck, build, diff check, and preview handoff validation when relevant. | Reference placeholder owner input only; do not commit filled owner-review evidence. |
| Listing/category content correction PR | Update listing summaries, listing detail copy, category names, category grouping, or event-use wording using approved owner content. | No public quote tracking, customer accounts, upload routes, provider changes, or invented service-area claims. | Website tests, typecheck, build, public route leakage checks, and preview handoff validation when relevant. | Keep source notes outside git unless the owner-approved content is intended as public copy. |
| Image/alt-text correction PR | Update image selection metadata, alt text, or public-safe image readiness wording when owner-approved. | No public/customer uploads, storage provider changes, production evidence, or real asset migration. | Website tests, typecheck, build, image/admin tests when touched, and diff check. | Do not commit preview proof or production proof. |
| Quote/enquiry wording correction PR | Update quote/enquiry labels, selected-listing context, receipt wording, or follow-up expectation wording. | No public quote tracking, confirmed booking, checkout, payment, account, notification, or CRM flow. | Website tests, typecheck, build, quote route tests, API contract tests when touched, and diff check. | Keep correction notes placeholder-only unless they become public-safe copy. |
| Protected admin workflow wording correction PR | Update protected admin labels, recovery text, readiness guidance, or operator wording. | No mutable correction database state, customer-visible internal notes, provider calls, notification, CRM, upload, or public route exposure. | Website tests, typecheck, build, protected admin tests, and preview handoff validation when relevant. | Keep admin review notes inside protected/admin-only docs or UI. |
| Legal/policy/contact content PR, only when owner supplies approved content | Add or update legal, policy, contact, or business-hour content only from owner-approved source material. | No invented legal claims, guarantees, business hours, physical addresses, phone numbers, email addresses, certifications, or awards. | Website tests, typecheck, build, public copy fact-safety checks, and explicit review of public route output. | Keep source approval outside git unless the approved text is meant to be public copy. |
| Deployment planning PR, only after separate explicit approval | Prepare deployment planning docs after the owner separately approves that planning scope. | No deployment command, live preview smoke, provider config, real env value, production evidence, or public traffic enablement inside a correction PR. | Validation must be named in that later approved deployment-planning scope. | Evidence handling must remain external or placeholder-only until explicitly approved. |

## Planning Rules

- Split future corrections by audience and risk rather than bundling unrelated
  public copy, protected admin wording, and deployment planning.
- Keep missing facts as `Owner input required`.
- Keep deployment planning separate from correction PRs unless a later explicit
  approval names that scope.
- Keep this plan as a planning surface only; it does not create owner sign-off,
  deployment approval, or filled evidence.
