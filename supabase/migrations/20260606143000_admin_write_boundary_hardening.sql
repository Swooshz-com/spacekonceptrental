-- Phase 2K-A/B admin write-boundary hardening.
-- Listing/category/image metadata writes now go through
-- execute_admin_product_write(...) only, preserving audit and local
-- search-index enqueue in one protected database transaction.

alter function public.execute_admin_product_write(text, uuid, uuid, jsonb)
  security definer;

alter function public.execute_admin_product_write(text, uuid, uuid, jsonb)
  set search_path = public;

revoke all on function public.execute_admin_product_write(text, uuid, uuid, jsonb) from public;
grant execute on function public.execute_admin_product_write(text, uuid, uuid, jsonb) to authenticated;

revoke insert (
  id,
  workspace_id,
  slug,
  name,
  description,
  sort_order,
  is_published
) on public.categories from authenticated;

revoke update (
  slug,
  name,
  description,
  sort_order,
  is_published
) on public.categories from authenticated;

alter policy categories_product_admin_insert
  on public.categories
  with check (false);

alter policy categories_product_admin_update
  on public.categories
  using (false)
  with check (false);

revoke insert (
  id,
  workspace_id,
  category_id,
  slug,
  name,
  short_description,
  description,
  rental_unit,
  status,
  sort_order
) on public.products from authenticated;

revoke update (
  category_id,
  slug,
  name,
  short_description,
  description,
  rental_unit,
  status,
  sort_order
) on public.products from authenticated;

alter policy products_product_admin_insert
  on public.products
  with check (false);

alter policy products_product_admin_update
  on public.products
  using (false)
  with check (false);

revoke insert (
  id,
  workspace_id,
  product_id,
  storage_bucket,
  storage_path,
  alt_text,
  sort_order,
  is_primary,
  status
) on public.product_images from authenticated;

revoke update (
  storage_bucket,
  storage_path,
  alt_text,
  sort_order,
  is_primary,
  status
) on public.product_images from authenticated;

alter policy product_images_product_admin_insert
  on public.product_images
  with check (false);

alter policy product_images_product_admin_update
  on public.product_images
  using (false)
  with check (false);

revoke insert (
  workspace_id,
  actor_admin_user_id,
  actor_type,
  action,
  target_type,
  target_id,
  metadata
) on public.audit_logs from authenticated;

alter policy audit_logs_product_admin_insert
  on public.audit_logs
  with check (false);

comment on function public.execute_admin_product_write(text, uuid, uuid, jsonb) is
  'Protected admin listing metadata write boundary. Direct browser-role table writes are revoked; this RPC performs authorized metadata mutation, product audit insertion, and local search-index enqueue only.';
