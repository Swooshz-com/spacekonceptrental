-- Phase 2K-A/B admin write-boundary hardening.
-- Listing/category/image metadata writes now go through
-- execute_admin_product_write(...) only, preserving audit and local
-- search-index enqueue in one protected database transaction.

create or replace function public.execute_admin_product_write(
  p_action text,
  p_target_id uuid,
  p_workspace_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_category_id uuid;
  v_product_id uuid;
  v_returned_id uuid;
  v_search_content_hash text;
  v_search_metadata jsonb;
  v_search_operation text;
  v_search_payload jsonb;
  v_search_source_type text;
  v_search_visibility text;
  v_target_type text;
begin
  v_actor_id := public.current_product_admin_user_id(p_workspace_id);
  if v_actor_id is null then
    raise exception 'unauthorized_admin_action';
  end if;

  if p_action = 'category.create' then
    v_target_type := 'category';
    v_returned_id := coalesce(p_target_id, gen_random_uuid());
    insert into public.categories (
      id, workspace_id, slug, name, description, is_published, sort_order
    ) values (
      v_returned_id,
      p_workspace_id,
      p_payload->>'slug',
      p_payload->>'name',
      p_payload->>'description',
      coalesce((p_payload->>'is_published')::boolean, false),
      (p_payload->>'sort_order')::integer
    );

  elsif p_action = 'category.update' then
    v_target_type := 'category';
    v_returned_id := p_target_id;
    update public.categories
    set
      slug = case when p_payload ? 'slug' then p_payload->>'slug' else slug end,
      name = case when p_payload ? 'name' then p_payload->>'name' else name end,
      description = case when p_payload ? 'description' then p_payload->>'description' else description end,
      is_published = case when p_payload ? 'is_published' then (p_payload->>'is_published')::boolean else is_published end,
      sort_order = case when p_payload ? 'sort_order' then (p_payload->>'sort_order')::integer else sort_order end
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'category.archive' then
    v_target_type := 'category';
    v_returned_id := p_target_id;
    update public.categories
    set is_published = false
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'product.create' then
    v_target_type := 'product';
    v_returned_id := coalesce(p_target_id, gen_random_uuid());

    if p_payload ? 'category_id' then
      v_category_id := nullif(p_payload->>'category_id', '')::uuid;
      if v_category_id is null
        or not exists (
          select 1
          from public.categories c
          where c.id = v_category_id
            and c.workspace_id = p_workspace_id
        )
      then
        raise exception 'product_category_workspace_mismatch';
      end if;
    else
      v_category_id := null;
    end if;

    insert into public.products (
      id, workspace_id, category_id, slug, name, short_description, description, rental_unit, status, sort_order
    ) values (
      v_returned_id,
      p_workspace_id,
      v_category_id,
      p_payload->>'slug',
      p_payload->>'name',
      p_payload->>'short_description',
      p_payload->>'description',
      p_payload->>'rental_unit',
      coalesce(p_payload->>'status', 'draft'),
      (p_payload->>'sort_order')::integer
    );

  elsif p_action = 'product.update' then
    v_target_type := 'product';
    v_returned_id := p_target_id;

    if p_payload ? 'category_id' then
      v_category_id := nullif(p_payload->>'category_id', '')::uuid;
      if v_category_id is null
        or not exists (
          select 1
          from public.categories c
          where c.id = v_category_id
            and c.workspace_id = p_workspace_id
        )
      then
        raise exception 'product_category_workspace_mismatch';
      end if;
    end if;

    update public.products
    set
      category_id = case when p_payload ? 'category_id' then v_category_id else category_id end,
      slug = case when p_payload ? 'slug' then p_payload->>'slug' else slug end,
      name = case when p_payload ? 'name' then p_payload->>'name' else name end,
      short_description = case when p_payload ? 'short_description' then p_payload->>'short_description' else short_description end,
      description = case when p_payload ? 'description' then p_payload->>'description' else description end,
      rental_unit = case when p_payload ? 'rental_unit' then p_payload->>'rental_unit' else rental_unit end,
      status = case when p_payload ? 'status' then p_payload->>'status' else status end,
      sort_order = case when p_payload ? 'sort_order' then (p_payload->>'sort_order')::integer else sort_order end
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'product.publish' then
    v_target_type := 'product';
    v_returned_id := p_target_id;
    update public.products
    set status = 'published'
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'product.archive' then
    v_target_type := 'product';
    v_returned_id := p_target_id;
    update public.products
    set status = 'archived'
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'productImage.create' then
    v_target_type := 'product_image';
    v_returned_id := coalesce(p_target_id, gen_random_uuid());
    v_product_id := nullif(p_payload->>'product_id', '')::uuid;

    if v_product_id is null
      or not exists (
        select 1
        from public.products p
        where p.id = v_product_id
          and p.workspace_id = p_workspace_id
      )
    then
      raise exception 'product_image_workspace_mismatch';
    end if;

    insert into public.product_images (
      id, workspace_id, product_id, storage_bucket, storage_path, alt_text, sort_order, is_primary, status
    ) values (
      v_returned_id,
      p_workspace_id,
      v_product_id,
      p_payload->>'storage_bucket',
      p_payload->>'storage_path',
      p_payload->>'alt_text',
      (p_payload->>'sort_order')::integer,
      coalesce((p_payload->>'is_primary')::boolean, false),
      'active'
    );

  elsif p_action = 'productImage.update' then
    v_target_type := 'product_image';
    v_returned_id := p_target_id;
    update public.product_images
    set
      storage_bucket = case when p_payload ? 'storage_bucket' then p_payload->>'storage_bucket' else storage_bucket end,
      storage_path = case when p_payload ? 'storage_path' then p_payload->>'storage_path' else storage_path end,
      alt_text = case when p_payload ? 'alt_text' then p_payload->>'alt_text' else alt_text end,
      sort_order = case when p_payload ? 'sort_order' then (p_payload->>'sort_order')::integer else sort_order end,
      is_primary = case when p_payload ? 'is_primary' then (p_payload->>'is_primary')::boolean else is_primary end
    where id = v_returned_id and workspace_id = p_workspace_id;

  elsif p_action = 'productImage.archive' then
    v_target_type := 'product_image';
    v_returned_id := p_target_id;
    update public.product_images
    set status = 'archived', is_primary = false
    where id = v_returned_id and workspace_id = p_workspace_id;

  else
    raise exception 'unsupported_action';
  end if;

  if p_action not like '%.create' and not found then
     raise exception 'mutation_failed_or_denied';
  end if;

  if v_target_type = 'category' then
    select
      'category',
      case when c.is_published then 'public_chat' else 'blocked' end,
      case when c.is_published then 'upsert' else 'hide' end,
      jsonb_build_object(
        'entity', 'category',
        'id', c.id,
        'slug', c.slug,
        'name', c.name,
        'description', c.description,
        'is_published', c.is_published
      )
    into
      v_search_source_type,
      v_search_visibility,
      v_search_operation,
      v_search_payload
    from public.categories c
    where c.id = v_returned_id
      and c.workspace_id = p_workspace_id;

  elsif v_target_type = 'product' then
    select
      'listing',
      case
        when p.status = 'published' then 'public_chat'
        when p.status = 'archived' then 'blocked'
        else 'admin_only'
      end,
      case when p.status = 'archived' then 'hide' else 'upsert' end,
      jsonb_build_object(
        'entity', 'listing',
        'id', p.id,
        'category_id', p.category_id,
        'slug', p.slug,
        'name', p.name,
        'short_description', p.short_description,
        'description', p.description,
        'rental_unit', p.rental_unit,
        'status', p.status
      )
    into
      v_search_source_type,
      v_search_visibility,
      v_search_operation,
      v_search_payload
    from public.products p
    where p.id = v_returned_id
      and p.workspace_id = p_workspace_id;

  elsif v_target_type = 'product_image' then
    select
      'listing_image_alt_text',
      case
        when pi.status = 'archived' or p.status = 'archived' then 'blocked'
        when p.status = 'published' then 'public_chat'
        else 'admin_only'
      end,
      case when pi.status = 'archived' or p.status = 'archived' then 'hide' else 'upsert' end,
      jsonb_build_object(
        'entity', 'listing_image_alt_text',
        'id', pi.id,
        'listing_id', pi.product_id,
        'listing_status', p.status,
        'image_status', pi.status,
        'alt_text', pi.alt_text,
        'is_primary', pi.is_primary
      )
    into
      v_search_source_type,
      v_search_visibility,
      v_search_operation,
      v_search_payload
    from public.product_images pi
    join public.products p
      on p.id = pi.product_id
      and p.workspace_id = pi.workspace_id
    where pi.id = v_returned_id
      and pi.workspace_id = p_workspace_id;
  end if;

  if v_search_source_type is not null and v_search_payload is not null then
    v_search_content_hash := encode(digest(v_search_payload::text, 'sha256'), 'hex');
    v_search_metadata := jsonb_build_object(
      'source', 'admin_product_write',
      'action', p_action,
      'entity', v_search_source_type
    );

    perform public.enqueue_search_index_job(
      p_workspace_id,
      v_search_source_type,
      v_returned_id,
      v_search_visibility,
      v_search_operation,
      'admin-write-v1-' || left(v_search_content_hash, 16),
      v_search_content_hash,
      v_search_metadata
    );
  end if;

  insert into public.audit_logs (
    workspace_id,
    actor_admin_user_id,
    actor_type,
    action,
    target_type,
    target_id,
    metadata
  ) values (
    p_workspace_id,
    v_actor_id,
    'admin',
    p_action,
    v_target_type,
    v_returned_id,
    '{}'::jsonb
  );

  return v_returned_id;
end;
$$;

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
