# Product And Media Seed Strategy

This is a planning document only. It does not add real product persistence,
Supabase Storage buckets, production seed files, upload workflows, admin tools,
or customer/private media.

## Current Assets

The current Git-tracked images under `website/assets/images/` are prepared
public-shell assets. They support route layout, visual review, and MVP page
shells.

They are not the long-term product media store.

## Long-Term Media Store

Supabase Storage is the intended long-term store for product and event media
when Supabase work is separately approved.

Product media should be represented by `product_images` metadata records that
point to safe storage bucket/path values. The metadata table should own:

- Product relationship.
- Public alt text.
- Sort order.
- Primary image flag.
- Storage bucket and path.
- Workspace boundary.

The database should not store binary image content.

## Initial MVP Seed Direction

Phase 1F-D adds a small reviewed fake/sample catalogue seed fixture under
`supabase/seeds/sample_catalogue.sql`. It is intentionally small enough to
support:

- Homepage category previews.
- Catalogue list and detail route validation.
- Quote planning examples.
- Chat context experiments after persistence is approved.

Seed content avoids live customer data, private files, real quotes, real
inventory commitments, private supplier data, and copied production assets.
Product image rows are metadata only and use sample bucket/path values; no
media upload or Supabase Storage bucket is added.

## Git Repository Rules

Do not copy live customer files, private business files, private event photos,
credential-bearing exports, or local runtime payloads into the repository.

Do not treat Git as the ongoing media library. Git may keep a few prepared
public-shell assets, but product media should move to Supabase Storage when
real catalogue persistence begins.

## Phase 1 Boundaries

Phase 1 may document the seed strategy, keep static prepared assets for page
shells, use fake/sample seed fixtures, and read published catalogue rows
through the server-only public catalogue repository. It should not introduce
real product media persistence or broad product admin workflows.

Deferred until separately approved:

- Category, product, or product image metadata writes.
- Product create/edit/delete admin UI.
- Media upload UI.
- Supabase Storage buckets or policies.
- Inventory, pricing, availability, variants, bundles, and billing.

## Future Safe Sequence

1. Confirm schema and RLS tests.
2. Add fake/sample seed fixtures only.
3. Add Supabase Storage bucket planning and policies.
4. Add server-only media URL helpers.
5. Add public catalogue reads for published products.
6. Add admin media workflows only after admin auth and membership scoping exist.
