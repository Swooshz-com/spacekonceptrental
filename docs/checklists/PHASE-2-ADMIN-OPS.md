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

## Phase 2M-A/B Preview/Deployment Review Preflight And CI Parity Hardening

- [x] Pull-request CI includes the full release-gate command set where practical, including website tests, typecheck, build, Supabase migration validation, Supabase migration tests, Docker-backed Supabase RLS/schema tests, and `git diff --check`.
- [x] `npm run validate:release-candidate` provides a local convenience gate for the same release-candidate commands, including n8n workflow export validation and n8n validation-rule tests.
- [x] The local release-candidate gate fails loudly when Docker is unavailable for `npm run test:supabase-rls`.
- [x] Preview/deployment preflight docs cover future review checklist, environment variable inventory, workspace ID review, Supabase Cloud review, admin access review, public quote/listing smoke checks, and rollback/abort checks.
- [x] Preflight docs state that Phase 2M-A/B performs no deployment and does not approve deployment by itself.
- [x] No deployment, Vercel config, Supabase Cloud config, secrets/env values, production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2N-A/B Server Runtime Configuration Hardening And Deploy Dry-Run Harness

- [x] Existing server-only runtime settings are enumerated in one typed server-only config contract.
- [x] Supabase, catalogue, quote, admin, chat, n8n, and trusted-header config parsing normalizes missing or invalid values into safe unavailable/fallback behavior.
- [x] Public-safe config summaries report only env names, issue kinds, and safe reasons without raw values.
- [x] `npm run validate:deploy-dry-run` runs the release-candidate gate plus server-runtime config and static scope checks locally.
- [x] Deploy dry-run docs state that no deployment is performed and no live service config is added.
- [x] No deployment, Vercel config, Supabase Cloud config, secrets/env values, production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2O-A/B Preview Deployment Approval Package And Operator Evidence Templates

- [x] Preview deployment approval package docs cover purpose, scope, non-approval, reviewer checks, validation, dry-runs, Supabase Cloud review, Vercel review, server-only env setup, admin access, public listing/quote smoke, rollback/abort, and go/no-go decisions.
- [x] Redacted operator evidence templates exist for preview evidence, env inventory, and go/no-go decision capture.
- [x] Templates state that filled production evidence, screenshots containing secrets, and real env values must not be committed.
- [x] `npm run validate:preview-approval-package` validates the approval package and static scope without deployment, Docker, real env values, or live provider connections.
- [x] Pull-request CI runs the deterministic approval-package validator.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2P-A/B External Preview Smoke Harness And Rollback Drill Package

- [x] `npm run smoke:preview` exists as an operator-run external preview smoke command only.
- [x] The preview smoke command requires `SKR_PREVIEW_BASE_URL`, rejects missing/local/non-preview/unsafe values, and redacts the supplied URL in output.
- [x] `npm run validate:preview-smoke-harness` validates the local package without network access, provider APIs, deployment, real env values, or filled evidence.
- [x] Pull-request CI runs only the deterministic preview smoke harness validator and does not run the live smoke command.
- [x] Rollback drill docs and result templates are redacted-only and state that filled preview or production evidence must not be committed.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 2Q-A/B Preview Deployment Handoff And Branch-Freeze Package

- [x] Preview deployment handoff docs record the verified PR #117 through PR #121 capability chain.
- [x] Branch-freeze docs state that generic deployment-prep PRs should stop unless a verified blocker is discovered.
- [x] Handoff docs include the next-step decision table for approve preview deployment, hold deployment, or pivot to product polish.
- [x] Handoff docs define blocker and non-blocker work before any separately approved preview deployment PR.
- [x] `npm run validate:preview-handoff` validates the handoff package without network access, provider APIs, deployment, real env values, or filled evidence.
- [x] Pull-request CI runs the deterministic preview handoff validator and does not run the live smoke command.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 3A-A/B Product Polish Content And Rental UI Iteration

- [x] Public rental catalogue/listing cards include clearer quote-planning cues and rental/enquiry CTAs.
- [x] Public quote/enquiry form copy, helper text, safe validation copy, and receipt messaging are clearer without adding public tracking.
- [x] Protected admin listing, category, media, and quote surfaces include clearer empty states and archive/follow-up guidance.
- [x] User-facing copy stays aligned with rental/listing/enquiry/quote/request wording.
- [x] Static and render tests cover the polished public/admin states and forbidden runtime/scope boundaries.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 3B-A/B Admin Operations Readiness And Quote Triage Polish

- [x] Protected admin listing surfaces show publication readiness cues from existing listing metadata, category, description, rental unit, and image metadata.
- [x] Protected admin category and media surfaces show grouping/media readiness guidance, primary image effects, alt text guidance, and archive meaning without adding hard-delete flows.
- [x] Protected admin quote surfaces show triage summaries and missing-data/follow-up cues from existing quote request, requested item, message, and internal activity data.
- [x] Public quote success remains receipt-only with no public tracking/status route or customer account surface.
- [x] Static and render tests cover admin readiness/triage states and forbidden runtime/scope boundaries.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 3C-A/B Public Catalogue Discovery And Quote Funnel Polish

- [x] Public catalogue/listing surfaces show category discovery affordances, active category state, and event setup guidance from existing public-safe catalogue data.
- [x] Filtered and empty catalogue/category states include clear recovery links back to listings and quote/enquiry actions.
- [x] Public quote handoff shows selected-listing and requested-item context while preserving receipt-only success and the existing public quote API contract.
- [x] Quote form helper copy clarifies event date, venue/location, quantities, setup notes, and contact method needs.
- [x] Static and render tests cover discovery, empty states, quote handoff, and forbidden runtime/scope boundaries.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, or ecommerce flow is added.

## Phase 3D-A/B Sitewide Public Journey Trust Content And Route Polish

- [x] Homepage journey content explains browsing listings/categories/events, preparing event details, team review, and direct quote follow-up.
- [x] Event setup/use-case content sets public-safe expectations and links back to listings and quote/enquiry actions.
- [x] Public catalogue, category, listing detail, and quote routes include safe recovery links and quote-request preparation guidance.
- [x] Route metadata and copy stay consistent around rental/listing/enquiry/quote/request wording.
- [x] Static and render tests cover sitewide journey content, route recovery paths, quote expectations, metadata, and forbidden runtime/scope boundaries.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, legal claims, production policies, or ecommerce flow is added.

## Phase 3E-A/B Product Readiness Navigation QA And Public Admin Dead-End Polish

- [x] Deterministic route/navigation QA covers key public routes, listing/category detail links, and protected admin operations routes without adding browser/e2e dependencies.
- [x] Public empty, filtered, missing, and quote-start states include semantic recovery paths to listings, categories, events, or quote enquiry.
- [x] Protected admin blocked, unavailable, empty, and missing states include admin-only recovery paths to overview, listing, category, media, or quote management surfaces.
- [x] Public and admin route links stay separated so public surfaces do not link into admin and admin recovery does not point to public quote/catalogue paths.
- [x] Static and render tests enforce rental/listing/enquiry/quote/request wording and block ecommerce wording or invented proof/contact claims on production surfaces touched by this phase.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3F-A/B Catalogue Content Quality Media Readiness And Admin Publication Polish

- [x] Public catalogue/listing/category rendering stays readable when optional descriptions, categories, rental units, image alt text, or filtered counts are incomplete.
- [x] Public quote handoff copy stays coherent when selected listing context is missing, invalid, unpublished, or unavailable, while success remains receipt-only.
- [x] Public rendering keeps fallback imagery and honest listing alt text without exposing admin readiness hints.
- [x] Protected admin listing and category surfaces summarize draft/published/archived state, categories without published listings, and published listings missing category/media/alt/quote-planning readiness details.
- [x] Protected admin media surfaces show missing alt text, missing or duplicate active primary image state, inactive metadata, and listings with no active public image metadata.
- [x] Static and render tests cover content completeness, admin-only readiness cues, public/admin boundary separation, and forbidden ecommerce/provider/deployment/runtime scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3G-A/B Quote Intake Quality Admin Triage Depth And Enquiry Workflow Polish

- [x] Public quote/enquiry form copy, field labels, helper text, validation copy, and receipt-only success message are clearer without adding public tracking.
- [x] Selected-listing quote handoff keeps valid listing context useful while making clear it is not a reservation, booking, order, or availability confirmation.
- [x] Invalid, missing, unpublished, or unavailable selected-listing context falls back to a safe general rental enquiry without exposing admin readiness or internal notes.
- [x] Protected admin quote inbox surfaces status buckets, missing-info summaries, customer-message/activity cues, and admin-only next actions from existing quote request data.
- [x] Protected admin quote detail view gives readable customer/enquiry, requested item snapshot, customer message, internal activity, current status, and admin-only follow-up context with safe recovery copy.
- [x] Static and render tests cover public quote intake, selected-listing fallback, admin triage/detail states, public/admin boundary separation, and forbidden ecommerce/provider/deployment/runtime scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3H-A/B Admin Operator QA Dashboard Consistency And Non-Deployment Release Readiness Polish

- [x] Protected admin overview, listings, categories, media, quote inbox, and quote detail surfaces show consistent operator QA guidance.
- [x] Admin surfaces distinguish read-only summaries, write-enabled protected actions, public-facing content effects, and admin-only readiness or internal follow-up context.
- [x] Admin next safe actions and recovery links stay inside protected admin routes.
- [x] Public pages do not expose admin readiness cues, internal quote notes, admin quote triage details, or admin management URLs.
- [x] Static and render tests cover admin dashboard consistency, public/admin boundary separation, non-deployment readiness guardrails, and forbidden ecommerce/provider/runtime scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3I-A/B Full-Site Acceptance QA Public SEO Accessibility Polish And Non-Deployment Release Hardening

- [x] Public route metadata is descriptive, rental-oriented, and claim-safe across homepage, catalogue, listings, categories, events, quote, and listing detail surfaces.
- [x] Public route headings, primary navigation, selected-listing quote context, and recovery states remain clear for full-site acceptance QA.
- [x] Public internal links stay on public routes and do not point into protected admin management or quote triage surfaces.
- [x] Quote expectations remain receipt-only and do not imply reservations, customer tracking, ecommerce, or confirmed booking.
- [x] Static and render tests cover full-site public route acceptance, SEO/accessibility copy, public/admin boundary separation, non-deployment release hardening, and forbidden ecommerce/provider/runtime scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3J-A/B Owner Review Readiness Package Manual QA Runbook And Release-Decision Preparation

- [x] Owner review readiness package summarizes ready surfaces, intentionally not implemented scope, owner-supplied content needs, deferred capabilities, and non-deployment decision status.
- [x] Manual QA runbook covers public homepage, catalogue, listings, listing detail, categories, catalogue detail, events, quote, not-found/recovery states, and protected admin overview/listings/categories/media/quotes/quote detail.
- [x] Owner decision checklist separates Ready for owner review, Needs owner-supplied content, Needs deployment approval later, and Explicitly deferred features.
- [x] Release decision language includes Hold deployment and Approve future deployment separately while making clear this phase does not approve deployment.
- [x] Static tests cover owner review docs, manual QA runbook, preview handoff decision inputs, non-live/no-deploy instructions, and forbidden provider/runtime/ecommerce scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, testimonials, client names, awards, certifications, legal claims, production policies, or ecommerce flow is added.

## Phase 3K-A/B Owner Content Intake Content Gap Register And Launch-Blocker Governance

- [x] Owner content intake collects owner-required brand spelling, public display name, listing/product names, listing/category/event descriptions, image selection, alt text, service-area wording, public contact, business-hour, operating, legal/policy, and admin ownership inputs without inventing facts.
- [x] Content gap register tracks Brand and naming, Public route copy, Listings/categories/events, Images and alt text, Quote/enquiry expectations, Admin access and operator ownership, and Launch/legal/policy/contact content.
- [x] Launch-blocker governance separates Blocks owner review, Blocks launch/deployment, Deferred after launch, and Not in scope by owner direction.
- [x] Owner review package, manual QA runbook, and preview deployment handoff cross-link content intake, the gap register, and owner content blockers without turning content review into deployment approval.
- [x] Static tests cover Phase 3K docs/status roll-forward, owner-required unknowns, launch-blocker governance, cross-links, no-deploy instructions, and forbidden provider/runtime/ecommerce scope.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, business hours, addresses, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or ecommerce flow is added.

## Phase 3L-A/B Protected Content Readiness Workspace Owner-Review Issue Ledger And Public Copy Fact-Safety Audit

- [x] Protected admin content readiness workspace summarizes owner-required content gaps from the owner content intake and content gap register.
- [x] Content readiness workspace stays reachable only through protected admin routes and does not create public customer-facing issue tracking.
- [x] Owner-review issue ledger defines safe issue categories for public copy, listing/category/event content, images and alt text, quote/enquiry expectations, admin operator ownership, legal/policy/contact gaps, and launch/deployment blockers.
- [x] Owner-review issue ledger defines safe statuses for Owner input required, Ready for owner review, Blocks owner review, Blocks launch/deployment, Deferred after launch, and Not in scope by owner direction.
- [x] Public copy fact-safety tests cover forbidden fake business facts, ecommerce wording, admin/internal readiness leakage, protected admin URLs, and owner-only readiness statuses.
- [x] Preview handoff validation checks Phase 3L docs/status roll-forward, PR #133 merge commit, owner-review issue ledger tracking, protected content readiness workspace, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or ecommerce flow is added.

## Phase 3M-A/B Owner-Review Execution Checklist Route-By-Route Decision Matrix And Admin Review Snapshot

- [x] Owner-review execution checklist covers public homepage, catalogue/listings, listing detail, categories, events/event-use guidance, quote/enquiry request flow, recovery/not-found states, protected admin overview, protected admin listings/categories/media, protected admin quote inbox/detail, and protected admin content readiness workspace.
- [x] Route-by-route decision matrix maps public and protected route families to audience, review category, current readiness status, owner decision needed, owner review blockers, launch/deployment blockers, public-safe notes, and admin-only notes.
- [x] Protected content readiness workspace includes an owner-review execution snapshot with review surface groups, route families covered, owner decision categories, owner-input-required categories, and launch-blocker categories.
- [x] Static tests cover Phase 3M docs/status roll-forward, execution checklist, route decision matrix, protected admin-only snapshot rendering, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3M docs/status roll-forward, PR #134 merge commit, execution checklist tracking, route decision matrix tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or ecommerce flow is added.

## Phase 3N-A/B Owner-Review Dry-Run Packet Findings Disposition Workflow And Launch Hold/Approve Rehearsal

- [x] Owner-review dry-run packet covers the required public and protected review areas with review objectives, owner questions, safe outcome statuses, owner-input-required placeholders, launch-blocker classification, deferred/not-in-scope notes, and public/admin visibility boundaries.
- [x] Findings disposition workflow defines safe placeholder-only statuses for no issue found, owner input required, change requested before owner review closes, blocks owner review, blocks launch/deployment, deferred after launch, not in scope by owner direction, and requires separate deployment approval.
- [x] Launch hold/approve rehearsal separates continuing owner review, holding launch, preparing for later deployment planning, and separately approving future deployment without recording real owner decisions.
- [x] Protected content readiness workspace includes a dry-run review snapshot with dry-run review areas, findings disposition statuses, launch decision rehearsal states, owner input required categories, and an explicit deployment approval boundary.
- [x] Static tests cover Phase 3N docs/status roll-forward, dry-run packet, findings disposition workflow, launch decision rehearsal, protected admin-only snapshot rendering, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3N docs/status roll-forward, PR #135 merge commit, dry-run packet tracking, findings disposition tracking, launch decision rehearsal tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled preview or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or ecommerce flow is added.

## Phase 3O-A/B Owner-Review Correction Intake Launch-Blocker Freeze Gate And Admin Triage Snapshot

- [x] Owner-review correction intake defines template-only correction categories and safe correction statuses without recording actual owner corrections, owner sign-off, deployment approval, or filled evidence.
- [x] Launch-blocker freeze gate separates owner-review blockers, launch/deployment blockers, deferred items, not-in-scope items, and separate deployment approval boundaries with placeholder-only freeze states.
- [x] Correction PR plan defines future safe PR types for public copy, listing/category content, image/alt text, quote/enquiry wording, protected admin wording, legal/policy/contact content, and later deployment planning after separate approval.
- [x] Protected content readiness workspace includes a correction/freeze snapshot with correction categories, correction statuses, freeze states, future correction PR types, and a correction freeze boundary.
- [x] Static tests cover Phase 3O docs/status roll-forward, correction intake, launch-blocker freeze gate, correction PR plan, protected admin-only snapshot rendering, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3O docs/status roll-forward, PR #136 merge commit, correction intake tracking, launch-blocker freeze gate tracking, correction PR plan tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime/ecommerce scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled owner-review, preview, or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or ecommerce flow is added.

## Phase 3V-A/B Quote Enquiry Workflow Hardening Protected Admin Triage Polish And Local Acceptance Coverage

- [x] Public quote/enquiry route guidance asks for event date, venue or location, requested listings or items, quantities, alternatives, setup/access/timing notes, and preferred contact method.
- [x] Public listing, category, and event handoff copy stays customer-facing with Request this listing, Send category enquiry, Compare event setup guidance, Start quote request, Bring event details, Add quantities and alternatives, and Share setup/access/timing notes.
- [x] Protected admin quote triage groups contact and follow-up, event and setup details, requested listings and items, and admin-only status and notes.
- [x] `docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md` records a repo-local, template-only, non-live checklist with placeholders only.
- [x] Protected content readiness includes an admin-only quote/enquiry acceptance snapshot for the checklist, public quote route, listing/category/event handoff, protected admin triage, internal notes boundary, public tracking/accounts, deployment approval, and local update placeholder.
- [x] Static tests and validators cover Phase 3V docs/status roll-forward, quote workflow checklist tracking, public quote guidance, listing/category/event handoff links, protected admin snapshot rendering, protected admin quote triage grouping, public leakage boundaries, forbidden tracked config/runtime/evidence paths, and no fake business facts.
- [x] Phase 3V remains repo-local only and does not add deployment approval, provider config, secrets/env values, filled evidence, owner sign-off, real business facts, public quote tracking, customer accounts, notifications, CRM, uploads, transaction-like, retail-like, stock-hold-like, rental-completion-like, browser Supabase, service-role runtime paths, n8n/Pinecone/RAG runtime changes, live preview smoke, network checks, evidence-writing commands, or self-service completion-like flows.

## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall

- [x] `docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md` records a repo-local, template-only, non-live final handoff pack with placeholders only.
- [x] `docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md` records template-only triage lanes for public route polish, listing/category/media content, quote/enquiry flow, protected admin workflow, owner input required, local suite failure, future deployment blocker, deferred after launch, and not-in-current-scope follow-up.
- [x] `docs/content/DEPLOYMENT-DECISION-FIREWALL.md` separates local acceptance readiness, owner review readiness, owner sign-off, deployment approval, provider configuration, preview publication, production launch, and post-launch monitoring.
- [x] Protected content readiness includes an admin-only final handoff snapshot for the handoff pack, triage board, deployment decision firewall, public route handoff, protected admin handoff, owner input required, local follow-up, deployment approval, and local update placeholder.
- [x] Static tests cover Phase 3U docs/status roll-forward, final owner handoff pack tracking, acceptance triage board tracking, deployment decision firewall tracking, protected admin-only snapshot rendering, public leakage boundaries, forbidden tracked config/runtime/evidence paths, and no fake business facts.
- [x] Phase 3U remains repo-local only and does not add deployment approval, provider config, secrets/env values, filled evidence, owner sign-off, real business facts, browser Supabase, service-role runtime paths, n8n/Pinecone/RAG runtime changes, public uploads, customer accounts, public quote tracking, notifications, CRM, live preview smoke, network checks, evidence-writing commands, or self-service completion-like flows.

## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist

- [x] `docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md` records a repo-local, template-only, non-live command centre with placeholders only.
- [x] `scripts/validate-release-candidate-suite.cjs` and `validate:release-candidate-suite` orchestrate existing safe local validators, Supabase checks, n8n validators, website tests, website typecheck, and website build in a fail-fast sequence.
- [x] Local validators check the suite runner command allowlist, forbidden-command audit, no evidence writes, no environment-file access, no provider/deploy/live preview commands, and no legacy local chat configuration reference.
- [x] Protected content readiness includes an admin-only command centre snapshot for command centre, suite runner, safe command allowlist, forbidden command audit, public leakage audit, provider/deployment boundary, and local update placeholder.
- [x] Static tests cover Phase 3T docs/status roll-forward, command centre tracking, suite runner tracking, package script wiring, protected admin-only snapshot rendering, public leakage boundaries, forbidden tracked config/runtime/evidence paths, and no fake business facts.
- [x] Phase 3T remains repo-local only and does not add deployment approval, provider config, secrets/env values, filled evidence, owner sign-off, real business facts, browser Supabase, service-role runtime paths, n8n/Pinecone/RAG runtime changes, public uploads, customer accounts, public quote tracking, notifications, CRM, live preview smoke, network checks, evidence-writing commands, or self-service completion-like flows.

## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness

- [x] `docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md` records a repo-local, template-only, non-live local acceptance matrix with placeholders only.
- [x] `docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md` freezes local public/protected route group expectations without recording preview or production evidence.
- [x] `scripts/validate-local-release-candidate.cjs`, `validate:local-release-candidate`, and CI repo validation cover the local release-candidate gate without deployment/provider/live preview commands.
- [x] Protected content readiness includes an admin-only local acceptance snapshot for the acceptance matrix, route inventory freeze, public route acceptance, protected admin acceptance, public leakage audit, provider/deployment boundary, and local update placeholder.
- [x] Static tests cover Phase 3S docs/status roll-forward, template-only matrix/freeze tracking, public route customer-facing copy, public leakage boundaries, protected admin-only snapshot rendering, forbidden tracked config/runtime/evidence paths, and no fake business facts.
- [x] Phase 3S remains repo-local only and does not add deployment approval, provider config, secrets/env values, filled evidence, owner sign-off, real business facts, browser Supabase, service-role runtime paths, n8n/Pinecone/RAG runtime changes, public uploads, customer accounts, public quote tracking, notifications, CRM, or self-service completion-like flows.

## Phase 3R-A/B Product Acceptance Hardening Public-Admin Route Polish And Owner-Demo Issue Backlog Readiness

- [x] Public route polish hardens homepage acceptance guidance, listing/category/event setup cross-links, catalogue empty-state recovery, listing fit-check copy, quote/enquiry handoff wording, and not-found recovery while keeping public copy customer-facing.
- [x] Owner-demo issue backlog defines template-only public route, listing/category/media, quote/enquiry workflow, protected admin workflow, and content readiness / closure workspace issue templates without recording owner corrections or approval.
- [x] Protected content readiness workspace includes an owner-demo issue backlog snapshot with template-only public route issue, admin workflow issue, owner input, locally resolved, future launch/deployment blocker, deployment approval, and last local backlog update values.
- [x] Static tests cover Phase 3R docs/status roll-forward, owner-demo issue backlog tracking, public route product acceptance polish, protected admin-only backlog snapshot rendering, public-route leakage, no deployment/provider/runtime self-service scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3R docs/status roll-forward, PR #139 merge commit, owner-demo issue backlog tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime self-service scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled owner-review, preview, or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, self-service completion-like flows, stock-reservation-like flows, fulfilment-like flows, or customer account flows are added.

## Phase 3Q-A/B Repo-Local Owner-Demo Polish Public Journey QA Hardening And Protected Admin Closure Workspace Polish

- [x] Owner-demo walkthrough defines a template-only, non-live route/admin review path for homepage, catalogue/listing, category/event-use, quote/enquiry request, protected admin overview, listing/category/media, quote workflow, and protected content readiness review.
- [x] Public route polish keeps listing, enquiry, quote, request, rental, and event furniture wording connected across homepage, listing detail, quote request, and not-found recovery states.
- [x] Protected content readiness workspace includes an owner-demo walkthrough snapshot with template-only public journey review, admin workflow review, closure readiness, deployment approval, and last local review packet update values.
- [x] Static tests cover Phase 3Q docs/status roll-forward, owner-demo walkthrough tracking, public journey polish, protected admin-only owner-demo snapshot rendering, public-route leakage, no deployment/provider/runtime scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3Q docs/status roll-forward, PR #138 merge commit, owner-demo walkthrough tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled owner-review, preview, or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or public self-service rental completion flow is added.

## Phase 3P-A/B Owner-Review Closure Packet Readiness Sign-Off Template And Deployment Approval Separation

- [x] Owner-review closure packet defines template-only states for owner review continuing, owner review blocked, and owner review locally ready to close without recording owner sign-off, deployment approval, preview evidence, or production launch.
- [x] Readiness sign-off template includes owner-review closure decision, blockers, reviewed routes/areas, pending corrections, locally resolved corrections, deferred items, required follow-up, and the explicit no-deployment warning.
- [x] Deployment approval separation material distinguishes owner review continues, owner review blocked, owner review ready to close, and deployment approved as a future explicit owner approval only.
- [x] Protected content readiness workspace includes a closure readiness snapshot with template-only closure state, blockers, correction intake status, closure readiness notes, deployment approval status, and last local packet update placeholder.
- [x] Static tests cover Phase 3P docs/status roll-forward, closure packet, sign-off template, deployment approval separation, protected admin-only snapshot rendering, public-route leakage, no deployment/provider/runtime/transaction-flow scope creep, and no fake business facts.
- [x] Preview handoff validation checks Phase 3P docs/status roll-forward, PR #137 merge commit, closure packet tracking, sign-off template tracking, deployment approval separation tracking, protected content readiness workspace references, public-route leakage, no deployment/provider/runtime/transaction-flow scope creep, and no fake business facts.
- [x] No deployment, deployment approval, Vercel config, Supabase Cloud config, secrets/env values, filled owner-review, preview, or production evidence, browser Supabase, service-role runtime path, customer uploads, public quote tracking, customer accounts, customer-visible internal notes, notifications, CRM, n8n/Pinecone runtime change, invented real contact details, phone numbers, email addresses, physical addresses, business hours, testimonials, client names, awards, certifications, legal claims, guarantees, production policies, or public/customer transaction flow is added.

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

## Phase 3W-A/B Catalogue Listing Media Hardening Protected Admin Content-Ops Polish And Local Acceptance Coverage

- [x] Harden public catalogue/listing/category/event-use media discovery with customer-facing rental wording.
- [x] Add protected admin catalogue/listing/media acceptance snapshot as template-only protected content.
- [x] Add repo-local catalogue/listing/media acceptance checklist without filled evidence or deployment approval.
