-- Phase 1H-A hardening: direct anonymous catalogue reads remain disabled until
-- public reads can be scoped to a trusted active workspace.

alter policy categories_public_read_published
  on public.categories
  to authenticated
  using (false);

alter policy products_public_read_published
  on public.products
  to authenticated
  using (false);

alter policy product_images_public_read_published_products
  on public.product_images
  to authenticated
  using (false);
