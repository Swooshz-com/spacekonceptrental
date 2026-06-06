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

## Phase 2F-A Admin Rental Listing/Media Foundation

- [x] Server-only listing-facing admin domain contracts are added under `website/lib/listings/admin/`.
- [x] Listing create/update/archive commands use listing wording and map into the existing product persistence boundary.
- [x] Listing image metadata commands use listing wording and map into the existing product image metadata boundary.
- [x] The foundation validates listing titles, slugs, descriptions/details, rental units, status, sort order, storage paths, alt text, and primary image flags.
- [x] Existing `products`, `categories`, and `product_images` names remain technical internals only; no risky DB/API/table/RPC/RLS rename is attempted.
- [x] No ecommerce/cart/checkout/order flow, public/customer upload route, browser Supabase, service-role runtime path, or `/api/chat` transcript wiring is added.

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

## Phase 2C-C Admin Quote Operations And Enquiry Workflow Closeout

- [x] Protected admin quote inbox can save bounded internal follow-up notes with status changes.
- [x] Server-only admin quote read boundary returns recent admin-only quote activity for the trusted workspace.
- [x] Quote workflow writes require `quote.write`, same-origin checks, CSRF proof, trusted workspace scope, and owner/admin RLS.
- [x] Internal quote activity is not exposed on public quote pages or public quote APIs.
- [x] Public quote tracking, customer-visible internal notes, notifications, CRM, ecommerce flows, browser Supabase, and service-role runtime paths remain out of scope.

## Phase 2C-D Quote Workflow Atomicity And Admin Operations Hardening

- [x] Admin quote status and internal activity writes use one atomic DB-side RPC boundary.
- [x] Status changes and internal activity inserts succeed or fail together.
- [x] Status-change activity is inserted only when status changes.
- [x] Internal-note activity is inserted only for non-blank bounded notes.
- [x] Direct authenticated quote status update and quote activity insert grants are revoked or narrowed.
- [x] Public quote tracking, customer-visible internal notes, notifications, CRM, ecommerce flows, browser Supabase, and service-role runtime paths remain out of scope.

## Phase 2H-A/B Admin Operations UI MVP

- [x] Protected admin operations dashboard links to listing, category, media, and quote workflow surfaces.
- [x] Listing management UI stays behind the protected admin shell and existing product write boundary.
- [x] Category management UI stays behind the protected admin shell and existing category write boundary.
- [x] Listing media upload and metadata management stay behind the protected admin shell and existing listing image boundaries.
- [x] Quote request workflow review, status changes, and internal notes stay behind the protected admin shell and existing quote workflow RPC boundary.
- [x] Public quote tracking, customer-visible internal notes, notifications, CRM, customer accounts, customer/public uploads, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, and ecommerce flows remain out of scope.

## Phase 2I-A/B Public Rental Catalogue And Quote Request UX MVP

- [x] Public rental catalogue browsing, listing detail, category browsing, and quote request handoff are improved.
- [x] Public listing and category routes use the existing public-safe catalogue read boundary.
- [x] Public quote/enquiry submission uses the existing first-party quote request boundary.
- [x] Public users only see published public-safe listing/category/image data.
- [x] Public quote/enquiry submission does not expose internal quote workflow state, public quote tracking, customer accounts, or admin internal notes.
- [x] No ecommerce/cart/checkout/payment/order, customer upload, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, `/api/chat` retrieval/RAG wiring, notification, or CRM surface is added.

## Phase 2J-A/B MVP Hardening, Quote Intake Correctness, And Demo Readiness

- [x] Public quote/enquiry customer messages are preserved safely.
- [x] Item-specific quote request notes remain supported separately from the customer message.
- [x] Admin quote detail uses a protected dedicated server-only read path.
- [x] Public users cannot track quotes or view internal quote workflow state.
- [x] Admin internal notes remain admin-only.
- [x] No ecommerce/cart/checkout/payment/order, customer upload, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, `/api/chat` retrieval/RAG wiring, notification, CRM, customer account, or public quote tracking surface is added.

## Phase 2K-A/B Admin Write-Boundary Hardening And Deployment Readiness

- [x] Direct authenticated browser-role writes to listing metadata tables are blocked.
- [x] Admin listing/category/image writes remain on `execute_admin_product_write(...)`.
- [x] Product audit insertion and local search-index enqueue remain inside the approved admin write RPC transaction.
- [x] Admin quote workflow writes remain on `execute_admin_quote_workflow(...)`.
- [x] Public catalogue reads remain on the public-safe `get_public_catalogue(...)` boundary.
- [x] Deployment/demo readiness docs and smoke-test runbooks are refreshed without deploying or adding production evidence.
- [x] No ecommerce/cart/checkout/payment/order, customer upload, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, `/api/chat` retrieval/RAG wiring, notification, CRM, customer account, or public quote tracking surface is added.

## Phase 2L-A/B Release-Candidate Acceptance Suite And Final MVP Polish

- [x] Release-candidate acceptance coverage proves public catalogue/quote UX, admin operations, quote workflow, and admin write boundaries locally.
- [x] Public homepage, listings, listing detail, categories, catalogue compatibility, quote, events, and not-found states use consistent listing/enquiry/quote wording.
- [x] Quote/enquiry form coverage includes customer message with no items, item-specific notes, safe success receipt, and safe generic error state without public tracking/status links.
- [x] Protected admin overview/listing/category/media/quote/detail surfaces remain behind the protected admin shell.
- [x] Admin quote detail separates customer message, requested items, and admin-only internal activity.
- [x] Admin listing/category/image writes remain first-party, CSRF-protected, and `execute_admin_product_write(...)` backed.
- [x] Admin quote workflow writes remain `execute_admin_quote_workflow(...)` backed.
- [x] Search-index enqueue remains local and unwired to Pinecone, n8n, `/api/chat` retrieval/RAG, sync workers, or search-index document writers.
- [x] No deployment, Vercel config, Supabase Cloud config, secrets/env values, production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2D-A Deployment Readiness And Smoke-Test Runbook

- [x] Deployment readiness docs are refreshed for catalogue media, admin listing media upload, public quote handoff, and atomic admin quote workflow surfaces.
- [x] Environment contract classifies public-safe client, server-only app, Supabase/project, n8n/server-only webhook, admin/auth/workspace, and forbidden env exposure categories.
- [x] Smoke-test runbook covers public catalogue/detail, listing media, quote, admin shell, admin listing management, admin image upload, admin quote workflow, chat fallback, server-only n8n, and leakage checks.
- [x] Rollback/disable plan is documented without adding runtime kill switches.
- [x] No deployment, Vercel config, Supabase Cloud config, production env, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2D-B Post-readiness Status And Evidence Guard Reconciliation

- [x] Phase status records Phase 2D-A as the latest completed capability after PR #97.
- [x] Remaining-work map names completed phases, safe next phases, approval-blocked phases, and too-broad phases.
- [x] Deployment evidence expectations include remaining-work map and largest-safe-bundle rationale fields for future PRs.
- [x] Stale blocker wording no longer treats the approved Phase 2C-A admin-controlled listing media upload boundary as wholly future or blocked.
- [x] No deployment, Vercel config, Supabase Cloud config, production env, browser Supabase, service-role runtime path, n8n/Pinecone runtime change, SaaS chatbot runtime work, or ecommerce flow is added.

## Phase 2E-A Conversation Privacy And Retention Governance

- [x] Privacy and PII minimisation model is documented before transcript persistence.
- [x] Anonymous visitor identity model is documented.
- [x] Future authenticated/admin-linked identity considerations are documented without approving customer accounts.
- [x] Retention, deletion/export, transcript access, and admin visibility rules are documented.
- [x] Future persistence idempotency and redaction guidance are documented.
- [x] Conversation/message persistence is not implemented.
- [x] Transcript storage is not implemented.
- [x] Admin transcript UI, customer accounts, public quote tracking, notifications, CRM, n8n/Pinecone runtime changes, SaaS chatbot runtime work, deployment, browser Supabase, service-role runtime paths, and `website/chat-config.js` access remain blocked.

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
- [ ] Do not mark new or expanded furniture listing/category/listing image
      writes complete until real auth, membership resolution, RLS, audit, and
      route/action boundaries exist and tests prove the new surface.
- [ ] Do not expand beyond the approved Phase 2 scope without updating the
      roadmap, decision log, and safety docs.
- [ ] Keep n8n as optional automation/integration, not the browser-facing app
      boundary.
