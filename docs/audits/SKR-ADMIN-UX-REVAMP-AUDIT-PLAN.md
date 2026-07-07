# SKR Protected Admin UX Revamp Audit Plan

Date: 2026-07-07

Branch: `codex/admin-ux-revamp-audit-plan`

Base inspected: `bd2b345da8ae936979830678be85d011ba7d6f34`.

This note records the focused protected admin Hero, Catalogue, and Setups audit
for the post-authorised-admin-UAT owner CMS revamp. It does not change runtime
behavior, Supabase schema, storage policy, auth/session behavior, public routes,
public rendering, quote/email behavior, or the six-page protected admin scope.

## Scope

Protected owner CMS scope remains exactly:

1. Dashboard - `/admin`
2. Hero - `/admin/hero`
3. Catalogue - `/admin/catalogue`
4. Setups - `/admin/setups`
5. Enquiry Email - `/admin/enquiry-email`
6. Delivery Log - `/admin/delivery-log`

Support routes such as `/admin/login` and `/admin/logout` remain support
surfaces only, not primary CMS pages.

## Current Audit Findings

### Hero

Inspected files:

- `website/components/admin/hero-content-management-panel.tsx`
- `website/app/api/admin/hero/route.ts`
- `website/lib/hero/homepage-hero-content.ts`
- `website/lib/hero/admin-homepage-hero-write-route.ts`
- `website/lib/hero/admin-homepage-hero-write.ts`
- `supabase/migrations/20260703100000_homepage_hero_content_foundation.sql`

Current behavior:

- `/admin/hero` exposes editable hero eyebrow, headline, body, primary CTA,
  secondary CTA, raw image URL, image alt text, and publish state.
- The client requests a `hero.write` CSRF proof and posts JSON to
  `/api/admin/hero`.
- The server validates the full content payload and writes through
  `execute_admin_homepage_hero_write`.
- The schema stores hero content/reference metadata only. The migration comment
  explicitly leaves raw uploads and storage policy changes deferred.

Revamp decision:

- Hero copy should become code-owned again for owner-MVP launch.
- The owner should not edit hero text or CTA fields in admin.
- Hero image replacement must be upload-first only, with no raw URL entry as
  the owner flow.

Blocker for an image-upload-only Hero PR:

- There is no hero-specific upload route, storage object path contract, or
  persistence boundary today.
- The existing upload pipeline is product-bound:
  `POST /api/admin/product-images` requires a product/listing UUID, verifies
  that product belongs to the admin workspace, uploads to
  `listing-media/{workspaceId}/{productId}/...`, and creates product image
  metadata.
- The `listing-media` storage RLS helper validates workspace/product path shape
  and product ownership. A homepage hero image has no product UUID and cannot
  safely reuse that route without changing the storage contract.

First implementation consequence:

- Do not ship a fake Hero upload control.
- Do not keep or replace raw URL entry as a fallback owner flow.
- The next Hero implementation PR must add a real, protected, tested hero media
  upload boundary before the admin UI offers image replacement.

### Catalogue

Inspected files:

- `website/app/admin/protected-admin-shell.tsx`
- `website/components/admin/listing-management-panel.tsx`
- `website/components/admin/category-management-panel.tsx`
- `website/components/admin/listing-image-upload-panel.tsx`
- `website/components/admin/listing-image-metadata-management-panel.tsx`
- `website/lib/products/admin-read/admin-product-dashboard-read.ts`
- `website/lib/products/persistence/admin-product-write-route.ts`
- `website/lib/products/media/admin-product-image-upload-route.ts`

Current behavior:

- `/admin/catalogue` combines listing metadata, category metadata, listing image
  upload, and listing image metadata management on one primary admin page.
- Listing create/update forms expose manual slug fields.
- Category management is a separate owner UI with manual slug, name,
  description, sort order, visibility, and archive controls.
- Listing image upload is a real multipart protected admin flow for product
  images only.

Revamp decision:

- Catalogue categories and style context should be derived from item fields or
  tags and sorted alphabetically.
- Manual category/style management should be removed from owner-facing admin.
- Owner item editing should feel like a simple CMS form: name, description,
  category, style where applicable, image uploads, and publish state.
- Slugs should be auto-generated and auto-managed. If shown at all, they should
  be read-only.
- The existing product image upload route can inform catalogue/setup media work,
  but the listing form and taxonomy model need a separate narrow PR.

### Setups

Inspected files:

- `website/app/admin/setups/page.tsx`
- `website/app/admin/protected-admin-shell.tsx`

Current behavior:

- `/admin/setups` is currently derived/read-only from published catalogue
  records.
- It does not add a separate setup editor or separate setup taxonomy manager.

Revamp decision:

- Keep Setups inside the six-page admin scope.
- Setup taxonomy/context should remain derived from setup items and sorted
  alphabetically.
- Do not add manual setup category/style management.
- Do not add setup-specific storage or editor behavior in the Hero PR.

## Implementation Plan

### PR 1 - This PR

- Record the focused audit and implementation plan.
- Stop before Hero UI changes because the current upload pipeline is not ready
  for a real image-upload-only Hero owner flow.
- No schema migration.
- No live Supabase action.
- No public route or public layout change.

### PR 2 - Hero Image Upload Foundation

Goal: make `/admin/hero` upload-first without raw URL entry.

Implementation status: implemented by the hero media upload foundation branch.

Implemented scope:

- Add a dedicated protected admin multipart route for hero image upload.
- Keep the same server-side origin/host, session workspace binding, role, and
  CSRF proof checks already used by protected admin writes.
- Add a storage object path contract that is not product-bound:
  bucket `hero-media`, object path
  `{workspaceId}/homepage-hero/{timestamp}-{uuid}.{ext}`.
- Add the minimum storage/RLS policy needed for authenticated product managers
  to write only valid hero media paths in their workspace.
- Persist only the resulting server-generated safe image reference and alt text.
- Update `/admin/hero` so copy and CTA fields are absent from owner editing.
- Remove raw image URL entry from the owner UI.
- Keep public Hero rendering code-owned for copy.
- Add route/component tests covering successful upload, unsupported file type,
  oversized file, auth/CSRF denial, generic failures, and absence of text-edit
  fields.

### PR 3 - Catalogue Owner Form Simplification

Goal: simplify catalogue editing without changing the six-page route scope.

Implementation outline:

- Remove owner-facing manual category management from `/admin/catalogue`.
- Derive category/style option context from listing item fields or tags.
- Sort derived lists alphabetically.
- Hide manual slug inputs from create/update forms and generate slugs
  server-side.
- Keep upload-first listing images using the existing protected product image
  route where applicable.
- Keep all catalogue work on `/admin/catalogue`; do not reintroduce
  `/admin/listings`, `/admin/media`, or other primary admin pages.

### PR 4 - Setups Derived Taxonomy And Gallery Readiness

Goal: keep setups simple and derived.

Implementation outline:

- Preserve `/admin/setups` as the setup owner surface.
- Derive setup category/context from setup records and sort alphabetically.
- Do not add manual setup category/style management.
- Prepare public setup/detail rendering for multiple uploaded images only after
  the listing/setup media model is ready.

## Boundaries

- No seed data.
- No `supabase db push --include-seed`.
- No fake auth, fallback auth, env-only admin login, bypass auth, or browser
  storage auth.
- No local dev artifacts, screenshots, logs, or `.tmp/` content committed.
- No cart, checkout, payment, order, booking, reservation, stock, customer
  account, or custom CRM scope.
- No hosted staging readiness claim until the owner accepts admin UI launch
  quality.

## Validation Plan

Required validation for this PR:

```powershell
git diff --check
git diff --cached --check
npm run validate:production-security-readiness
npm run test:production-security-readiness
npm run validate:local-release-candidate
npm run validate:supabase-migrations
npm run test:supabase-migrations
cd website
npm run typecheck
npm run build
```

Relevant component/admin tests: no runtime components changed in this PR, so no
component test is required beyond the required validation set.

Relevant Playwright/admin smoke: no runtime UI changed in this PR, so the
previous six-page authorised admin UAT evidence remains the latest browser
evidence and is not re-claimed as rerun by this PR.

## Current Gate Status

- Six-page authorised admin UAT baseline: previously passed before this plan.
- Six-page authorised admin UAT rerun required by the hero media upload PR:
  Yes before claiming the updated UI baseline, because protected admin runtime
  files changed.
- Schema migration required: Yes, `hero-media` Storage/RLS and image-only hero
  write RPC migration.
- Live Supabase action required after merge: Yes, apply the new migration to
  hosted Supabase without seed data.
- Hero upload implementation status: Dedicated hero media upload boundary and
  storage/RLS contract implemented for owner/admin image upload.
- Deferred to next admin UX PR: Hero media upload foundation and `/admin/hero`
  removal of owner text/raw URL controls is no longer deferred; Catalogue owner
  form simplification, Setups owner form simplification, derived category/style
  cleanup, and multi-image carousel/gallery polish remain deferred.
