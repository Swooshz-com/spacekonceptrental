-- Phase 2C-A listing media storage.
-- Adds one public bucket for admin-controlled listing images. Object serving
-- is public for anyone with the server-generated URL; catalogue rendering is
-- gated by active published product image metadata. Customer uploads and
-- arbitrary public uploads remain out of scope.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'listing-media',
  'listing-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

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

create or replace function public.is_listing_media_object_path(
  object_name text
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(
    object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{13}-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$',
    false
  );
$$;

comment on function public.is_listing_media_object_path(text) is
  'Validates the server-generated workspace/product listing media object path shape.';

revoke all on function public.is_listing_media_object_path(text) from public;
grant execute on function public.is_listing_media_object_path(text) to anon, authenticated;

create or replace function public.is_listing_media_product_admin_object(
  object_bucket text,
  object_name text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when object_bucket <> 'listing-media'
      or not public.is_listing_media_object_path(object_name)
    then false
    else public.is_workspace_product_manager(
      split_part(object_name, '/', 1)::uuid
    )
    and exists (
      select 1
      from public.products p
      where p.id = split_part(object_name, '/', 2)::uuid
        and p.workspace_id = split_part(object_name, '/', 1)::uuid
    )
  end;
$$;

comment on function public.is_listing_media_product_admin_object(text, text) is
  'Verifies authenticated product managers can write only valid listing media paths for their workspace products.';

revoke all on function public.is_listing_media_product_admin_object(text, text)
  from public;
grant execute on function public.is_listing_media_product_admin_object(text, text)
  to authenticated;

do $policies$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'listing_media_product_admin_insert'
  ) then
    create policy listing_media_product_admin_insert
      on storage.objects
      for insert
      to authenticated
      with check (
        public.is_listing_media_product_admin_object(
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
      and policyname = 'listing_media_product_admin_update'
  ) then
    create policy listing_media_product_admin_update
      on storage.objects
      for update
      to authenticated
      using (
        public.is_listing_media_product_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      )
      with check (
        public.is_listing_media_product_admin_object(
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
      and policyname = 'listing_media_product_admin_delete'
  ) then
    create policy listing_media_product_admin_delete
      on storage.objects
      for delete
      to authenticated
      using (
        public.is_listing_media_product_admin_object(
          storage.objects.bucket_id,
          storage.objects.name
        )
      );
  end if;
end
$policies$;
