# Local Catalogue Content-Ops Readiness

Status: repo-local, template-only, non-live catalogue content-ops readiness note.
Evidence status: [NOT EVIDENCE / NOT RECORDED].
Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].

This document supports Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary. It is not evidence, does not record owner approval, and does not approve preview or production deployment.

## Protected admin catalogue content-ops workflow

- Review listing title/name, category, rental unit, short description, long description, event-use context, public visibility/status, and quote/enquiry handoff from protected admin-only listing surfaces.
- Review category grouping, empty published category cues, and public-safe category wording from protected admin-only category surfaces.
- Review media metadata, active/archived state, primary image state, fallback expectation, and alt text from protected admin-only media surfaces.
- Keep all readiness notes admin-only; public routes must not expose admin catalogue readiness helper content, media checklist detail, owner handoff internals, release-control internals, internal notes, admin URLs, destructive-action safeguards, recovery lanes, or status-transition matrix details.

## Listing/category/media readiness checklist

Admin reviewers should check existing local data only:

- Listing has a title/name.
- Category is present or intentionally kept missing while draft/protected.
- Rental unit is present and supports quote/request wording.
- Public-safe short and long descriptions are present.
- Event-use context remains generic and non-promissory.
- Public visibility/status matches the intended protected/public boundary.
- Image/media metadata is present or a safe fallback expectation is required.
- Alt text is present for active public-facing media metadata.
- Quote/enquiry CTA continuity remains editable request intake only.
- Owner facts still missing are captured as placeholders, not approvals.

## Media, fallback, and alt-text boundary

- Media review is metadata/readiness review only.
- Fallback copy may explain that media is unavailable or represented generically, but must not claim owner-approved media, final styling, final availability, or real inventory confirmation.
- Alt text must be public-safe, factual, and non-promissory.
- This phase adds no public/customer uploads, no new storage provider setup, and no provider runtime requirements.

## Public catalogue parity boundary

Public catalogue, listing, category, event-use, quote, and enquiry routes must remain rental/enquiry-only and non-promissory. They must not expose protected admin readiness helpers, media checklists, owner handoff internals, release-control internals, internal notes, admin URLs, destructive-action safeguards, recovery lanes, public admin status, or status-transition matrix details.

## Admin write and operation boundary

- Protected admin write labels must stay honest and admin-local.
- A protected save does not imply deployment, production publication, owner approval, launch readiness, or provider action.
- No new destructive actions are added by this readiness note.
- Admin auth/workspace protections, browser Supabase boundaries, service-role browser boundaries, provider runtime boundaries, and no-deploy safety boundaries remain unchanged.

## Owner inputs still missing

Owner-supplied facts are still required before any future public launch decision for contact details, service area, legal/policy wording, operational claims, proof claims, image selections, alt text, final listing/category copy, public response expectations, and any business-specific promises.

## Public claims still blocked

The repo must not invent contact details, business hours, addresses, service-area claims, unsupported proof claims, client names, legal claims, response-time claims, availability claims, final styling claims, final inventory confirmation, or owner approval.

## No-upload/no-provider/no-deploy/no-evidence status

- Public/customer uploads: not added.
- Provider storage setup: not added.
- Browser Supabase: not added.
- Service-role browser paths: not added.
- Pinecone/RAG runtime: not added.
- Outbound email/SMS/WhatsApp, notifications, CRM: not added.
- Ecommerce/cart/checkout/payment/order/purchase flows: not added.
- Booking/reservation/fulfilment/stock-reservation flows: not added.
- Evidence status: [NOT EVIDENCE / NOT RECORDED].
- Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].
