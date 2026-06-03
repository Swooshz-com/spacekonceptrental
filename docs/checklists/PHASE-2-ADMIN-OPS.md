# Phase 2 Checklist: Admin, Furniture Listing, And Quote Operations

This phase is not approved for implementation yet.

This is the admin/product/quote operations planning checklist. It should not
imply product CRUD is ready.

Phase 2B-A admin/auth membership design checklist:
`docs/checklists/PHASE-2B-ADMIN-AUTH.md`

The Phase 2B-A checklist is design/readiness only. It is not approval to add
real auth, admin UI, product writes, browser Supabase, service-role runtime
paths, deployment, or Supabase Cloud connection.

Furniture listing/category/listing image writes remain constrained to approved admin route-gated boundaries until auth/membership/RLS/audit gates pass for each new surface.

Product writes remain blocked until real auth/membership resolution, RLS, audit,
and route/action boundaries are implemented and tested.

## Directional Scope

- [ ] Expand admin furniture listing management.
- [ ] Add listing image upload, replace, and remove flows.
- [ ] Add listing display/detail editing if approved.
- [ ] Add publish/unpublish/archive listing management.
- [ ] Add listing variants or attributes if required.
- [ ] Add quote request management.
- [ ] Add quote status workflow.
- [ ] Add internal notes.
- [ ] Add assignment.
- [ ] Add basic human follow-up.
- [ ] Add optional email or WhatsApp handoff.
- [ ] Improve audit logs.
- [ ] Improve permissions.

## Phase 2B-AT Public UX Polish

- [x] Public catalogue and listing detail pages use listing-oriented, non-shell copy.
- [x] Public catalogue no-listings empty state is defined and rendered.
- [x] Listing detail CTA copy is enquiry/quote oriented.
- [x] Existing public catalogue read paths and fallback behavior are preserved.

## Phase 2B-AU Public Events And Quote Copy Polish

- [x] Public events page uses event-rental and furniture-rental language.
- [x] Public events page no longer exposes shell or MVP wording.
- [x] Public events CTA copy is enquiry/quote-request oriented.
- [x] Public quote page and metadata do not imply ecommerce or online ordering.
- [x] Existing quote request form behavior is preserved.

## Phase 2B-AV Admin Anti-framing Header Hardening

- [x] Protected admin UI routes receive `frame-ancestors 'none'`.
- [x] Protected admin UI routes receive `X-Frame-Options: DENY`.
- [x] Anti-framing headers are scoped to `/admin` and nested admin UI routes.
- [x] No broad public-site CSP is introduced.
- [x] Admin auth, CSRF, Origin/Host checks, and admin UI behavior are preserved.

## Phase 2B-AW Admin Quote Request Inbox Boundary

- [x] Server-only admin quote request read boundary is added.
- [x] Quote request reads are scoped to the trusted admin workspace.
- [x] Recent quote requests render inside the protected admin shell only.
- [x] Requested item snapshots render when available.
- [x] Empty and unavailable quote request states use generic admin-safe copy.
- [x] Quote status writes, notifications, CRM integration, and ecommerce flows remain out of scope.

## Phase 2B-AX Admin Quote Request Status Update Boundary

- [x] `quote.write` is a dedicated admin operation for quote status updates.
- [x] Owner/admin memberships can use `quote.write`; viewer memberships cannot.
- [x] CSRF proof issuance supports `quote.write` as a state-changing target.
- [x] Protected admin route updates only existing quote request status.
- [x] Admin quote inbox renders internal status controls with generic success and failure states.
- [x] Public quote tracking, notifications, CRM, customer accounts, and ecommerce flows remain out of scope.

## Phase 2B-AY Admin Listing Image Metadata UI Boundary

- [x] Protected admin shell renders listing image metadata controls only for loaded authorised admins.
- [x] Listing image metadata create, update, and archive actions request `productImage.write` CSRF proofs.
- [x] Listing image metadata actions call only the existing protected product-image metadata routes.
- [x] Image metadata UI sends only approved JSON metadata fields.
- [x] Binary image upload, Supabase Storage, public image routes, and ecommerce flows remain out of scope.

## Phase 2C-A Storage-backed Listing Media Upload And Public Rendering

- [x] Admin-controlled listing media upload stores approved image files in the `listing-media` bucket.
- [x] Uploads require `productImage.write`, same-origin Origin/Host validation, CSRF proof, and trusted workspace scope.
- [x] Upload paths are generated server-side under workspace/listing scoped paths.
- [x] Uploaded image metadata is created through the existing product-image metadata persistence contract.
- [x] The public bucket serving model is documented as public-by-unguessable-server-generated-URL, with catalogue rendering gated by metadata.
- [x] Public catalogue cards render listing images when available.
- [x] Public listing detail pages render primary and additional listing images when available.
- [x] Public catalogue/detail fallback images remain available when listing media is missing.
- [x] Customer uploads, ecommerce flows, notifications, CRM, browser Supabase, and service-role runtime paths remain out of scope.

## Phase 2C-B Public Catalogue Polish And Enquiry Handoff

- [x] Public catalogue and listing detail pages render uploaded listing images with stable fallbacks.
- [x] Catalogue cards use clearer listing, category, and rental-unit hierarchy.
- [x] Listing detail pages render primary and additional gallery images when available.
- [x] Quote enquiry handoff uses optional validated public listing context without changing the quote backend contract.
- [x] Catalogue and listing detail metadata uses only safe public listing data.
- [x] Customer uploads, public quote tracking, ecommerce flows, notifications, CRM, browser Supabase, and service-role runtime paths remain out of scope.

## Ecommerce Non-goals

- [ ] Do not add carts.
- [ ] Do not add checkout.
- [ ] Do not add payments.
- [ ] Do not add customer accounts.
- [ ] Do not add stock reservation.
- [ ] Do not add order fulfilment.
- [ ] Do not add online ordering.

## Guardrails

- [ ] Do not implement full SaaS unless separately approved.
- [ ] Do not mark furniture listing/category/listing image writes complete until real
      auth, membership resolution, RLS, audit, and route/action boundaries
      exist and tests prove them.
- [ ] Do not expand beyond the approved Phase 2 scope without updating the
      roadmap, decision log, and safety docs.
- [ ] Keep n8n as optional automation/integration, not the browser-facing app
      boundary.
