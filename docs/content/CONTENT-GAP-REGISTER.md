# Content Gap Register

This register is a repo-local documentation/control register only. It does not
approve deployment, does not deploy anything, does not connect providers, and
does not wire content gaps into runtime or public UI.

Unknown real-world business facts must stay marked as `Owner input required`.
Missing real contact/legal/business-hour content does not get invented. Public
launch cannot proceed until required owner content and explicit deployment
approval are both supplied. Owner review can continue without deployment.

## Launch-Blocker Governance

| Governance class | Meaning | Current action |
| --- | --- | --- |
| Blocks owner review | The owner cannot make a meaningful repo-local review decision until this is resolved. | Resolve before asking the owner to review the affected area. |
| Blocks launch/deployment | Public launch cannot proceed until this owner input and explicit deployment approval are both supplied. | Keep deployment blocked and collect owner input first. |
| Deferred after launch | Useful future improvement that is not required for current owner review or a later approved launch. | Keep out of the launch lane unless owner direction changes. |
| Not in scope by owner direction | Capability or content type that remains intentionally excluded. | Do not implement without separate owner approval. |

## Brand and naming

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Approved brand spelling and public display name | Public headings and metadata may need owner confirmation. | Owner input required. | Blocks launch/deployment if unresolved for public launch copy. | Owner review can continue with the gap recorded. |
| Listing/product naming convention | Public listing labels may need approved naming before launch. | Owner input required. | Blocks launch/deployment for affected launch listings. | Not required for current owner review unless owner wants naming finalized now. |

## Public route copy

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Homepage/category/listing/event copy approval | Public copy may remain draft-like until owner-approved. | Owner input required for launch-ready copy. | Blocks launch/deployment if owner requires final public copy before launch. | Owner review can continue with draft copy and this register. |
| Public service-area wording | Public route claims should not be invented. | Owner input required if service-area wording is needed later. | Blocks launch/deployment only if service-area claims are required for launch. | Deferred / not required for current owner review. |

## Listings/categories/events

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Approved listing/category/event descriptions | Launch pages may need owner-approved rental descriptions. | Owner input required for affected launch pages. | Blocks launch/deployment for affected public pages. | Owner review can continue by reviewing structure and noting content gaps. |
| Event-use wording | Event setup copy must avoid unsupported promises. | Owner input required for owner-approved event guidance. | Blocks launch/deployment if event guidance is required for launch. | Deferred / not required for current owner review. |

## Images and alt text

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Approved image selection | Public pages may show only repo-safe available images until owner approves final selection. | Owner input required for final public images. | Blocks launch/deployment for affected image-backed pages. | Owner review can continue with placeholder-safe image review. |
| Approved alt text | Accessibility and public image context need owner-approved descriptions. | Owner input required for final alt text. | Blocks launch/deployment for affected launch images. | Not required for current owner review unless owner wants alt text finalized now. |

## Quote/enquiry expectations

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Quote follow-up expectation wording | Public users need clear receipt-only expectations without promises. | Owner input required if wording should change before launch. | Blocks launch/deployment only if owner requires revised quote expectations. | Owner review can continue with current receipt-only framing. |
| Availability and setup expectation wording | Public copy must not imply confirmed availability. | Owner input required for any owner-approved expectation changes. | Blocks launch/deployment if required for launch. | Deferred / not required for current owner review. |

## Admin access and operator ownership

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Admin access/workspace ownership | Launch readiness depends on known operator ownership. | Owner input required for owner/admin responsibility and workspace ownership. | Blocks launch/deployment if unresolved before public traffic. | Owner review can continue if admin ownership is being reviewed. |
| Operator content governance owner | Listing/media/quote review may lack a named owner. | Owner input required. | Blocks launch/deployment if owner requires named accountability. | Deferred / not required for current owner review. |

## Launch/legal/policy/contact content

| Gap | Impact | Required owner input | Launch blocker status | Deferred / not required for current owner review |
| --- | --- | --- | --- | --- |
| Public contact details | Contact content cannot be invented. | Owner input required if contact details are needed later. | Blocks launch/deployment only if owner requires public contact details for launch. | Owner review can continue without invented contact details. |
| Business hours | Hours cannot be invented. | Owner input required if hours are needed later. | Blocks launch/deployment only if owner requires hours for launch. | Deferred / not required for current owner review. |
| Legal/policy wording | Policies and claims must be owner-approved. | Owner input required if legal/policy content is needed later. | Blocks launch/deployment if owner or legal review requires this content. | Deferred / not required for current owner review. |
| Proof, testimonial, award, or certification claims | Unsupported proof claims would be unsafe. | Owner input required before any such content can be used. | Blocks launch/deployment only if owner requires this proof content for launch. | Not in scope by owner direction until supplied and approved. |

## Explicitly Not Runtime Scope

- This register does not create public route content, admin forms, uploads,
  customer accounts, public quote tracking, notifications, CRM integrations,
  n8n/Pinecone runtime paths, Pinecone SDK/env/runtime, `/api/chat`
  retrieval/RAG wiring, browser Supabase, service-role runtime paths, provider
  config, deployment evidence, or filled preview evidence.
