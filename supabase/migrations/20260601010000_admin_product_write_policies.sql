-- Phase 2B-AL authenticated admin product write policies.
-- Product/category/product image writes stay RLS-scoped to active owner/admin
-- memberships for the target workspace. No anonymous product writes are added.

alter table public.product_images
  add column if not exists status text not null default 'active';

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_images_status_check'
      and conrelid = 'public.product_images'::regclass
  ) then
    alter table public.product_images
      add constraint product_images_status_check
      check (status in ('active', 'archived'));
  end if;
end
$constraints$;

create or replace function public.is_workspace_product_manager(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and exists (
      select 1
      from public.memberships m
      join public.admin_users au on au.id = m.admin_user_id
      where m.workspace_id = target_workspace_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and au.status = 'active'
        and au.auth_user_id = (select auth.uid())
    ),
    false
  );
$$;

comment on function public.is_workspace_product_manager(uuid) is
  'RLS helper for owner/admin product-management writes in the current authenticated workspace.';

revoke all on function public.is_workspace_product_manager(uuid) from public;
grant execute on function public.is_workspace_product_manager(uuid) to authenticated;

create or replace function public.current_product_admin_user_id(
  target_workspace_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.id
  from public.memberships m
  join public.admin_users au on au.id = m.admin_user_id
  where m.workspace_id = target_workspace_id
    and m.status = 'active'
    and m.role in ('owner', 'admin')
    and au.status = 'active'
    and au.auth_user_id = (select auth.uid())
  limit 1;
$$;

comment on function public.current_product_admin_user_id(uuid) is
  'Returns the current active owner/admin profile for product-management audit inserts.';

revoke all on function public.current_product_admin_user_id(uuid) from public;
grant execute on function public.current_product_admin_user_id(uuid) to authenticated;

grant select on public.categories to authenticated;
grant insert (
  id,
  workspace_id,
  slug,
  name,
  description,
  sort_order,
  is_published
) on public.categories to authenticated;
grant update (
  slug,
  name,
  description,
  sort_order,
  is_published
) on public.categories to authenticated;

create policy categories_product_admin_insert
  on public.categories
  for insert
  to authenticated
  with check (public.is_workspace_product_manager(workspace_id));

create policy categories_product_admin_update
  on public.categories
  for update
  to authenticated
  using (public.is_workspace_product_manager(workspace_id))
  with check (public.is_workspace_product_manager(workspace_id));

grant select on public.products to authenticated;
grant insert (
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
) on public.products to authenticated;
grant update (
  category_id,
  slug,
  name,
  short_description,
  description,
  rental_unit,
  status,
  sort_order
) on public.products to authenticated;

create policy products_product_admin_insert
  on public.products
  for insert
  to authenticated
  with check (
    public.is_workspace_product_manager(workspace_id)
    and (
      category_id is null
      or category_id in (select id from public.categories where workspace_id = products.workspace_id)
    )
  );

create policy products_product_admin_update
  on public.products
  for update
  to authenticated
  using (public.is_workspace_product_manager(workspace_id))
  with check (
    public.is_workspace_product_manager(workspace_id)
    and (
      category_id is null
      or category_id in (select id from public.categories where workspace_id = products.workspace_id)
    )
  );

grant select on public.product_images to authenticated;
grant insert (
  id,
  workspace_id,
  product_id,
  storage_bucket,
  storage_path,
  alt_text,
  sort_order,
  is_primary,
  status
) on public.product_images to authenticated;
grant update (
  storage_bucket,
  storage_path,
  alt_text,
  sort_order,
  is_primary,
  status
) on public.product_images to authenticated;

create policy product_images_product_admin_insert
  on public.product_images
  for insert
  to authenticated
  with check (
    public.is_workspace_product_manager(workspace_id)
    and product_id in (select id from public.products where workspace_id = product_images.workspace_id)
  );

create policy product_images_product_admin_update
  on public.product_images
  for update
  to authenticated
  using (public.is_workspace_product_manager(workspace_id))
  with check (public.is_workspace_product_manager(workspace_id));

grant insert (
  workspace_id,
  actor_admin_user_id,
  actor_type,
  action,
  target_type,
  target_id,
  metadata
) on public.audit_logs to authenticated;

create policy audit_logs_product_admin_insert
  on public.audit_logs
  for insert
  to authenticated
  with check (
    public.is_workspace_product_manager(workspace_id)
    and actor_admin_user_id = public.current_product_admin_user_id(workspace_id)
    and actor_type = 'admin'
    and action in (
      'category.create',
      'category.update',
      'category.archive',
      'product.create',
      'product.update',
      'product.publish',
      'product.archive',
      'productImage.create',
      'productImage.update',
      'productImage.archive'
    )
    and target_type in ('category', 'product', 'product_image')
  );

create or replace function public.get_public_catalogue(
  expected_workspace_id uuid,
  product_slug text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with active_workspace as (
    select cfg.active_workspace_id as workspace_id
    from public.catalogue_public_workspace_config cfg
    join public.workspaces w on w.id = cfg.active_workspace_id
    where cfg.id = true
      and cfg.is_enabled = true
      and cfg.active_workspace_id = expected_workspace_id
      and w.status = 'active'
  ),
  public_categories as (
    select
      c.id,
      c.slug,
      c.name,
      c.description,
      c.sort_order,
      c.is_published
    from public.categories c
    join active_workspace aw on aw.workspace_id = c.workspace_id
    where c.is_published = true
  ),
  public_products as (
    select
      p.id,
      p.workspace_id,
      p.category_id,
      pc.name as category_name,
      p.slug,
      p.name,
      p.short_description,
      p.description,
      p.rental_unit,
      p.status,
      p.sort_order
    from public.products p
    join active_workspace aw on aw.workspace_id = p.workspace_id
    left join public_categories pc on pc.id = p.category_id
    where p.status = 'published'
      and (p.category_id is null or pc.id is not null)
      and (product_slug is null or p.slug = product_slug)
  )
  select jsonb_build_object(
    'categories',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id::text,
            'slug', c.slug,
            'name', c.name,
            'description', c.description,
            'sort_order', c.sort_order,
            'is_published', c.is_published
          )
          order by c.sort_order, c.name
        )
        from public_categories c
      ),
      '[]'::jsonb
    ),
    'products',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id::text,
            'category_id', p.category_id::text,
            'category_name', p.category_name,
            'slug', p.slug,
            'name', p.name,
            'short_description', p.short_description,
            'description', p.description,
            'rental_unit', p.rental_unit,
            'status', p.status,
            'sort_order', p.sort_order,
            'product_images',
            (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', pi.id::text,
                    'storage_bucket', pi.storage_bucket,
                    'storage_path', pi.storage_path,
                    'alt_text', pi.alt_text,
                    'sort_order', pi.sort_order,
                    'is_primary', pi.is_primary
                  )
                  order by pi.sort_order, pi.storage_path
                ),
                '[]'::jsonb
              )
              from public.product_images pi
              where pi.workspace_id = p.workspace_id
                and pi.product_id = p.id
                and pi.status = 'active'
            )
          )
          order by p.sort_order, p.name
        )
        from public_products p
      ),
      '[]'::jsonb
    )
  )
  from active_workspace;
$$;

comment on function public.get_public_catalogue(uuid, text) is
  'Public catalogue read surface for the database-owned active workspace. Returns only published public catalogue fields and active image metadata.';

revoke all on function public.get_public_catalogue(uuid, text) from public;
grant execute on function public.get_public_catalogue(uuid, text) to anon, authenticated;
