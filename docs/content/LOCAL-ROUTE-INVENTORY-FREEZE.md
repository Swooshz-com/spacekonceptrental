# Local Route Inventory Freeze

This is a freeze of local expectations only.

It is not production route evidence.

It is not preview evidence.

This document records the expected route groups for local review of the current
furniture/event rental website candidate. It does not prove that a preview or
production environment has been reviewed.

## Route Groups

| Route group | Audience | Public/admin visibility | Allowed wording | Forbidden public leakage | Data boundary | Expected local test coverage | Deployment boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage | Public visitors | Public only | Listing, rental, event furniture, quote request | Owner-demo, protected admin, route inventory, release gate, deployment approval | Public catalogue and customer-facing guidance only | Homepage route copy and public leakage tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public listings/catalogue index | Public visitors | Public only | Listings, categories, quote enquiry, event setup guidance | Internal review, issue backlog, admin workspace details | Published public catalogue reads and fallback content only | Catalogue/listings route copy and empty-state tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public listing detail | Public visitors | Public only | Rental details, listing fit, enquiry handoff | Admin notes, protected management state, acceptance status | Published listing detail and public-safe image metadata only | Listing detail route copy and quote-link tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public categories | Public visitors | Public only | Category browsing, compare listings | Internal route decisions or protected admin labels | Published category and listing summaries only | Category route copy and category-to-listing tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public category-to-listing journey | Public visitors | Public only | Compare category listings | Owner review prompts or admin-only readiness language | Public category filter links only | Category link target tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public events/event-use guidance | Public visitors | Public only | Event setup, catalogue listings, quote request | Protected review materials or deployment status | Static public event-use guidance only | Events route copy and leakage tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public quote/enquiry request | Public visitors | Public only | Quote request, enquiry, event details, follow-up | Public quote tracking, customer accounts, internal notes | Public quote form and first-party quote request boundary only | Quote route copy, form, and recovery tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Public not-found/recovery | Public visitors | Public only | Browse listings, categories, quote request | Admin recovery or internal review language | Public recovery links only | Not-found route recovery tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Protected admin overview | Admin users | Protected admin only | Admin operations, listings, media, quote requests | Must not appear on public routes | Authorised admin shell state only | Protected admin render and blocked-state tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Protected admin listings/categories/media | Admin users | Protected admin only | Listing management, categories, listing media | Must not appear on public routes | Protected admin route-gated management surfaces only | Admin shell and management panel tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Protected admin quote inbox/detail | Admin users | Protected admin only | Quote workflow, enquiry detail, internal notes | Must not appear on public routes | Protected quote read/write boundaries only | Admin quote inbox/detail tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Protected content readiness workspace | Admin users | Protected admin only | Local release review, acceptance matrix, route inventory, owner input, deployment boundary | Must not appear on public routes | Template-only docs/admin snapshot references only | Protected content readiness snapshot tests | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

## Freeze Notes

- Audience, public/admin visibility, allowed wording, forbidden public leakage,
  data boundary, expected local test coverage, and deployment boundary are local
  expectations only.
- This route freeze does not approve provider configuration, deployment, live
  preview checks, preview evidence, production evidence, owner sign-off, or
  launch work.
