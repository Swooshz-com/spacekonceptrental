-- Phase 1M-A trusted active-workspace catalogue read surface.
-- Keeps public catalogue reads on the anon-key runtime without service-role
-- keys while denying direct anonymous base-table catalogue reads.

create table if not exists public.catalogue_public_workspace_config (
  id boolean primary key default true,
  active_workspace_id uuid not null,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint catalogue_public_workspace_config_singleton_check
    check (id),
  constraint catalogue_public_workspace_config_active_workspace_id_fkey
    foreign key (active_workspace_id)
    references public.workspaces (id)
    on delete restrict
);

comment on table public.catalogue_public_workspace_config is
  'Database-owned singleton config for the active public catalogue workspace. No secrets or customer data.';

alter table public.catalogue_public_workspace_config enable row level security;

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
  'Public catalogue read surface for the database-owned active workspace. Returns only published public catalogue fields.';

revoke all on function public.get_public_catalogue(uuid, text) from public;
grant execute on function public.get_public_catalogue(uuid, text) to anon, authenticated;

alter policy categories_public_read_published
  on public.categories
  to anon, authenticated
  using (false);

alter policy products_public_read_published
  on public.products
  to anon, authenticated
  using (false);

alter policy product_images_public_read_published_products
  on public.product_images
  to anon, authenticated
  using (false);
