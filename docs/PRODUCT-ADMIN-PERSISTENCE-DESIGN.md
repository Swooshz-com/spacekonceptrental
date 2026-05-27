# Product/Admin Persistence Design

Phase 1J-A defines the future product-management persistence boundary and adds
only disabled server-only scaffolding. It does not persist categories,
products, or product images.

## Current Phase Boundary

- Product/admin writes are trusted-admin operations only.
- No browser-side Supabase writes are approved for product management.
- No anonymous category, product, or product image writes are approved.
- No public category, product, or product image mutation routes are approved.
- No Supabase service-role key may reach the browser.
- No service-role write path is approved in Phase 1J-A.
- Future product writes must go through first-party server routes or server
  actions only after auth, admin membership, and workspace boundaries exist.
- Workspace must be resolved from trusted server-side auth and membership
  context, not from anonymous browser input.
- The disabled scaffold under `website/lib/products/persistence/` imports
  `server-only`, does not import Supabase, and returns explicit skipped
  results.
- No Supabase migration, RLS policy, database read, database write,
  Supabase Cloud connection, Supabase CLI action, admin/auth UI, mutation
  route, storage wiring, or image upload flow is part of Phase 1J-A.

## Future Data Model

Future product-management persistence should write only after the admin boundary
is approved:

- `categories`: trusted workspace, slug, name, description, sort order, and
  published state.
- `products`: trusted workspace, category relationship, slug, name,
  descriptions, rental unit, status, and sort order.
- `product_images`: trusted workspace, product relationship, storage bucket,
  storage path, alt text, sort order, and primary-image flag.

Product image rows are metadata only. Binary media must not be stored in the
database.

## Workspace And Admin Resolution

The browser must not choose a workspace for product/admin writes. A future
server route or action must derive workspace access from trusted server-side
auth and membership state:

1. Supabase Auth identifies the signed-in admin user.
2. `admin_users.auth_user_id` maps the auth user to an app admin profile.
3. `memberships` grants active access to the target workspace.
4. The server passes a trusted workspace/admin context into the persistence
   layer.

Browser-provided workspace IDs, role names, membership IDs, or admin IDs must
not authorize product writes.

## Public Catalogue Read Boundary

Public catalogue reads remain read-only and workspace-scoped. Runtime catalogue
queries must continue to use the trusted server-only `CATALOGUE_WORKSPACE_ID`
filter and published-state filters.

Draft or unpublished categories, products, and product images must not leak
through public catalogue reads. Public catalogue pages must not call product
mutation code.

## Media Boundary

Product image and media persistence remains deferred until the Supabase Storage
strategy is approved. Git-tracked prepared images remain demo and public-shell
assets only; they are not the long-term product media store.

Future media work must separately approve storage buckets, storage policies,
upload flows, path validation, image replacement/removal behavior, and any
delivery helper that exposes public media URLs.

## Deferred Work

- Actual category persistence.
- Actual product persistence.
- Actual product image metadata persistence.
- Public or admin mutation routes.
- Admin/auth UI.
- Supabase Storage buckets, policies, or URL helpers.
- Product image upload, replace, or remove flows.
- Inventory, pricing, availability, variant, and bundle management.
- Audit logs for product-management changes.
- Publishing approval workflows.
- Service-role write paths.
- Supabase Cloud connection.
- Deployment configuration.
