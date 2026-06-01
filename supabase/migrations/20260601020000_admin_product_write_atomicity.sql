-- Migration: Admin product write atomicity

create or replace function public.execute_admin_product_write(
  p_action text,
  p_target_id uuid,
  p_workspace_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_returned_id uuid;
  v_target_type text;
begin
  -- 1. Derive and verify actor securely using existing function
  v_actor_id := public.current_product_admin_user_id(p_workspace_id);
  if v_actor_id is null then
    raise exception 'unauthorized_admin_action';
  end if;

  -- 2. Dispatch mapped actions
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
    insert into public.products (
      id, workspace_id, category_id, slug, name, short_description, description, rental_unit, status, sort_order
    ) values (
      v_returned_id,
      p_workspace_id,
      (p_payload->>'category_id')::uuid,
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
    update public.products
    set
      category_id = case when p_payload ? 'category_id' then (p_payload->>'category_id')::uuid else category_id end,
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
    insert into public.product_images (
      id, workspace_id, product_id, storage_bucket, storage_path, alt_text, sort_order, is_primary, status
    ) values (
      v_returned_id,
      p_workspace_id,
      (p_payload->>'product_id')::uuid,
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

  -- 3. Verify update found a row (implicit verification of RLS and existence)
  if p_action not like '%.create' and not found then
     raise exception 'mutation_failed_or_denied';
  end if;

  -- 4. Insert Audit Log
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
