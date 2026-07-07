-- Protected homepage hero media storage foundation.
-- Adds a dedicated public bucket for owner/admin uploaded homepage hero images.
-- The admin write RPC remains image-only for owner MVP; homepage copy and CTA
-- text are code-managed and are not accepted from the browser.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'hero-media',
  'hero-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $storage_rls$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and pg_has_role(c.relowner, 'member')
  ) then
    alter table storage.objects enable row level security;
  end if;
end
$storage_rls$;

grant select on storage.buckets to anon, authenticated;
grant insert (
  bucket_id,
  name,
  owner,
  metadata
) on storage.objects to authenticated;
grant update (
  name,
  metadata,
  updated_at
) on storage.objects to authenticated;
grant delete on storage.objects to authenticated;

create or replace function public.is_hero_media_object_path(
  object_name text
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(
    object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/homepage-hero/[0-9a-f]{13}-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$',
    false
  );
$$;

comment on function public.is_hero_media_object_path(text) is
  'Validates the server-generated workspace homepage hero media object path shape.';

revoke all on function public.is_hero_media_object_path(text) from public;
grant execute on function public.is_hero_media_object_path(text) to anon, authenticated;

create or replace function public.is_hero_media_admin_object(
  object_bucket text,
  object_name text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when object_bucket <> 'hero-media'
      or not public.is_hero_media_object_path(object_name)
    then false
    else public.is_workspace_product_manager(
      split_part(object_name, '/', 1)::uuid
    )
  end;
$$;

comment on function public.is_hero_media_admin_object(text, text) is
  'Verifies authenticated product managers can write only valid homepage hero media paths for their workspace.';

revoke all on function public.is_hero_media_admin_object(text, text) from public;
grant execute on function public.is_hero_media_admin_object(text, text)
  to authenticated;

do $policies$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'hero_media_admin_insert'
  ) then
    create policy hero_media_admin_insert
      on storage.objects
      for insert
      to authenticated
      with check (
        public.is_hero_media_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'hero_media_admin_update'
  ) then
    create policy hero_media_admin_update
      on storage.objects
      for update
      to authenticated
      using (
        public.is_hero_media_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      )
      with check (
        public.is_hero_media_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'hero_media_admin_delete'
  ) then
    create policy hero_media_admin_delete
      on storage.objects
      for delete
      to authenticated
      using (
        public.is_hero_media_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      );
  end if;
end
$policies$;

create or replace function public.execute_admin_homepage_hero_image_write(
  p_workspace_id uuid,
  p_payload jsonb
)
returns table (
  workspace_id uuid,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_updated_at timestamptz := now();
  v_image_url text := nullif(btrim(coalesce(p_payload->>'image_url', '')), '');
  v_default_image_url text := 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMIAb-s3hFM7-rX6NqHe8HjNDVJ-VnaBLOlppG1oQtolnRXq__CGiW5eTsqbMyrs8ZVHafSQazQ5CU1RkOP6nNPfgWFrcyJk2H9T4u4S-EWRUUIb6F0l1vSCMvF62-NnKWfJCkrUGT8FV19LAyjqfjRNO9JuxEOz1O9tHH4CltNllxzsgL6FPoXzet1gGu4OBt4B0R5N5rlRfckyw_7uYkQJRpxq0C6VgsDFaKgDqQ_B2F-LEbezRSgIVzDRwO9irCS47fQkgQqMsb';
begin
  v_actor_id := public.current_product_admin_user_id(p_workspace_id);

  if v_actor_id is null then
    raise exception 'hero_admin_context_invalid' using errcode = '42501';
  end if;

  insert into public.homepage_hero_content (
    workspace_id,
    eyebrow,
    headline,
    body,
    primary_cta_label,
    primary_cta_href,
    secondary_cta_label,
    secondary_cta_href,
    image_url,
    image_alt,
    is_enabled,
    updated_at,
    updated_by
  )
  values (
    p_workspace_id,
    'Furniture and event rentals',
    'Furnish Your Vision, Elevate Every Space',
    'Browse rental pieces, explore setup directions, and send an enquiry for manual team review.',
    'Request Quote',
    '/quote',
    'Browse Catalogue',
    '/catalogue',
    coalesce(v_image_url, v_default_image_url),
    btrim(p_payload->>'image_alt'),
    coalesce((p_payload->>'is_enabled')::boolean, false),
    v_updated_at,
    v_actor_id
  )
  on conflict on constraint homepage_hero_content_pkey do update
    set eyebrow = excluded.eyebrow,
        headline = excluded.headline,
        body = excluded.body,
        primary_cta_label = excluded.primary_cta_label,
        primary_cta_href = excluded.primary_cta_href,
        secondary_cta_label = excluded.secondary_cta_label,
        secondary_cta_href = excluded.secondary_cta_href,
        image_url = coalesce(
          v_image_url,
          homepage_hero_content.image_url,
          v_default_image_url
        ),
        image_alt = excluded.image_alt,
        is_enabled = excluded.is_enabled,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
  returning homepage_hero_content.workspace_id,
            homepage_hero_content.updated_at
    into workspace_id,
         updated_at;

  return next;
end;
$$;

revoke all on function public.execute_admin_homepage_hero_image_write(uuid, jsonb)
  from public;
grant execute on function public.execute_admin_homepage_hero_image_write(uuid, jsonb)
  to authenticated;

comment on function public.execute_admin_homepage_hero_image_write(uuid, jsonb) is
  'Protected owner/admin homepage hero image upsert boundary. Validates the authenticated workspace admin and accepts only image URL, image alt text, and publish state.';

create or replace function public.execute_admin_homepage_hero_write(
  p_workspace_id uuid,
  p_payload jsonb
)
returns table (
  workspace_id uuid,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select write_result.workspace_id,
         write_result.updated_at
  from public.execute_admin_homepage_hero_image_write(
    p_workspace_id,
    jsonb_build_object(
      'image_url',
      nullif(btrim(coalesce(p_payload->>'image_url', '')), ''),
      'image_alt',
      p_payload->>'image_alt',
      'is_enabled',
      p_payload->'is_enabled'
    )
  ) as write_result;
$$;

revoke all on function public.execute_admin_homepage_hero_write(uuid, jsonb)
  from public;
grant execute on function public.execute_admin_homepage_hero_write(uuid, jsonb)
  to authenticated;

comment on function public.execute_admin_homepage_hero_write(uuid, jsonb) is
  'Compatibility wrapper for existing admin hero write callers. Copy and CTA payload fields are ignored; owner/admin writes are limited to image URL, image alt text, and publish state.';
