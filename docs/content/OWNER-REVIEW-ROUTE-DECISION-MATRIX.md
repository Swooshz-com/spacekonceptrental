# Owner-Review Route Decision Matrix

This matrix is a repo-local owner-review control. It maps public and protected
route families to the owner decision needed for non-live review. It does not
create public customer-facing route tracking, does not approve deployment, and
does not expose admin internal notes to public route docs.

Unknown real-world business facts stay marked as `Owner input required`.

## Decision Matrix

| Route | Audience | Review category | Current readiness status | Owner decision needed | Blocks owner review? | Blocks launch/deployment? | Public-safe notes | Admin-only notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Public | Public homepage | Ready for owner review | Approve public-safe homepage positioning or supply owner wording. | No, unless owner rejects public positioning. | Yes, if owner requires brand or homepage wording changes before launch. | Keep copy general and quote/enquiry-led. | None exposed publicly. |
| `/catalogue` | Public | Public catalogue/listings | Ready for owner review | Approve listing browse structure and catalogue wording. | No, unless missing launch listing content blocks review. | Yes for launch listings with missing owner-approved content. | Public browse route only. | No protected readiness status exposed. |
| `/listings` | Public | Public catalogue/listings | Ready for owner review | Approve listing index flow, filters, and quote-start cues. | No, unless owner requires listing changes first. | Yes for affected launch listing gaps. | Public listing summaries only. | No admin workflow notes exposed. |
| `/listings/[slug]` | Public | Public listing detail | Owner input required | Approve each launch listing detail or mark unresolved listing fields. | Yes for affected owner-reviewed listing pages. | Yes for launch listing detail gaps. | Public-safe detail page and selected-listing quote context. | Internal readiness stays protected. |
| `/catalogue/[slug]` | Public | Public listing detail | Owner input required | Approve equivalent catalogue detail wording for launch listings. | Yes for affected owner-reviewed catalogue pages. | Yes for launch listing detail gaps. | Public-safe detail page only. | Internal readiness stays protected. |
| `/categories` | Public | Public categories | Ready for owner review | Approve category grouping, labels, and category descriptions if needed. | No, unless owner requires category changes before review closes. | Yes only for owner-required launch category gaps. | Category index and links back to listings. | Protected category controls stay admin-only. |
| `/categories/[slug]` | Public | Public categories | Not in scope by owner direction | No dynamic category detail route is currently present; review occurs through `/categories` and listing filters. | No. | No, unless owner separately requires this route for launch. | Do not imply a public category detail route exists. | Admin category management remains protected. |
| `/events` | Public | Public events/event-use guidance | Owner input required | Approve event-use wording or supply owner-approved event guidance. | No, unless owner requires event-use wording before review closes. | Yes if owner requires event-use detail for launch. | General public-safe event planning copy. | No admin review details exposed. |
| `/quote` | Public | Public quote/enquiry request flow | Owner input required | Approve quote/enquiry expectations, selected-listing context, and receipt wording. | No, unless owner requires wording changes before review closes. | Yes if owner requires quote expectation wording for launch. | Receipt-only quote request flow. | Internal follow-up stays protected. |
| Public recovery/not-found | Public | Public recovery/not-found | Ready for owner review | Approve missing listing/catalogue recovery copy or provide replacement wording. | No, unless owner requires recovery changes. | No, unless owner marks recovery copy as launch-critical. | Public-safe recovery and return links. | No issue ledger details exposed. |
| `/admin` | Protected admin | Protected admin overview | Ready for owner review | Confirm overview supports owner/admin review. | No, unless admin ownership is unresolved. | Yes if owner requires admin ownership before public traffic. | Not public. | Protected overview only. |
| `/admin/listings` | Protected admin | Protected admin listings/categories/media | Owner input required | Confirm listing operator ownership and launch listing review responsibility. | Yes if ownership is unresolved. | Yes for launch listings without owner-approved content. | Not public. | Protected listing controls and readiness cues. |
| `/admin/categories` | Protected admin | Protected admin listings/categories/media | Owner input required | Confirm category owner and grouping review responsibility. | Yes if ownership is unresolved. | Yes for launch categories the owner requires. | Not public. | Protected category controls and readiness cues. |
| `/admin/media` | Protected admin | Protected admin listings/categories/media | Owner input required | Confirm image owner, alt-text owner, and media review responsibility. | Yes if ownership is unresolved. | Yes for launch listings missing approved media or alt text. | Not public. | Protected media controls and readiness cues. |
| `/admin/quotes` | Protected admin | Protected admin quote inbox/detail | Ready for owner review | Confirm quote triage owner and follow-up responsibility. | No, unless owner requires workflow ownership first. | Yes if admin workflow ownership must be resolved before public traffic. | Not public. | Protected quote inbox only. |
| `/admin/quotes/[quoteRequestId]` | Protected admin | Protected admin quote inbox/detail | Ready for owner review | Confirm detail view and internal follow-up handling expectations. | No, unless owner requires workflow changes first. | Yes if admin follow-up ownership must be resolved before public traffic. | Not public. | Internal notes and status history stay protected. |
| `/admin/content-readiness` | Protected admin | Protected admin content readiness workspace | Ready for owner review | Confirm the owner-review package is ready for non-live owner/admin review. | No, unless owner requires additional route decisions first. | Yes until required owner input and separate deployment approval exist. | Not public. | Protected owner-review execution snapshot, issue ledger, and route matrix references. |

## Matrix Rules

- Public-safe notes must stay suitable for public routes and must not reveal
  protected admin details.
- Admin-only notes stay in repo-local docs or protected admin routes.
- `Owner input required` remains the default for missing real-world facts.
- `Blocks launch/deployment` does not approve deployment; it records that a
  later launch cannot proceed until required owner input and separate approval
  both exist.
- `Deferred after launch` and `Not in scope by owner direction` remain excluded
  from implementation unless separately approved by the owner.
