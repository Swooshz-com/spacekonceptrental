-- Make public SECURITY DEFINER execution opt-in without rewriting applied
-- production history. Policy-only helpers move to the non-exposed private
-- schema while their dependent policies retain the same function OIDs.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon, authenticated, service_role;

alter function public.normalize_admin_access_email(text)
  set search_path = pg_catalog;
revoke execute on function public.normalize_admin_access_email(text)
  from public, anon, authenticated, service_role;

revoke execute on function public.current_admin_access_email()
  from public, anon, authenticated, service_role;
revoke execute on function public.current_admin_access_id(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.current_product_admin_user_id(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.current_quote_admin_user_id(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.enqueue_search_index_job(uuid,text,uuid,text,text,text,text,jsonb,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.ensure_admin_access_membership(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_access_write(uuid,text,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_homepage_hero_image_write(uuid,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_homepage_hero_write(uuid,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_product_write(text,uuid,uuid,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_public_page_media_write(uuid,text,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_quote_crm_handoff_queue_update(uuid,uuid,text,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.execute_admin_quote_workflow(uuid,uuid,text,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.get_admin_access_membership(uuid,uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.get_public_catalogue(uuid,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.get_public_homepage_hero(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.get_public_page_media(uuid,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.insert_transcript_audit_event(uuid,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.insert_transcript_evidence_record(uuid,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_public_website_quote_request(uuid,uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_workspace_admin_access_member(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_workspace_admin_access_owner(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_workspace_member(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_workspace_product_manager(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.is_workspace_quote_manager(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.list_admin_access_records(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.persist_transcript_batch(uuid,jsonb,jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function public.prevent_admin_access_owner_mutation()
  from public, anon, authenticated, service_role;
revoke execute on function public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)
  from public, anon, authenticated, service_role;
revoke execute on function public.touch_admin_access_updated_at()
  from public, anon, authenticated, service_role;

-- Preserve policy dependencies by moving the existing function OIDs. Public
-- compatibility wrappers remain only where SECURITY DEFINER callers still
-- reference the historical public-qualified helper name.
alter function public.is_workspace_admin_access_member(uuid) set schema private;
alter function private.is_workspace_admin_access_member(uuid) set search_path = '';
revoke execute on function private.is_workspace_admin_access_member(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.is_workspace_admin_access_member(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_workspace_admin_access_member(target_workspace_id);
$$;
revoke execute on function public.is_workspace_admin_access_member(uuid)
  from public, anon, authenticated, service_role;

alter function public.is_workspace_member(uuid) set schema private;
alter function private.is_workspace_member(uuid) set search_path = '';
revoke execute on function private.is_workspace_member(uuid)
  from public, anon, authenticated, service_role;

alter function public.is_workspace_product_manager(uuid) set schema private;
alter function private.is_workspace_product_manager(uuid) set search_path = '';
revoke execute on function private.is_workspace_product_manager(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.is_workspace_product_manager(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_workspace_product_manager(target_workspace_id);
$$;
revoke execute on function public.is_workspace_product_manager(uuid)
  from public, anon, authenticated, service_role;

alter function public.is_workspace_quote_manager(uuid) set schema private;
alter function private.is_workspace_quote_manager(uuid) set search_path = '';
revoke execute on function private.is_workspace_quote_manager(uuid)
  from public, anon, authenticated, service_role;

alter function public.current_quote_admin_user_id(uuid) set schema private;
alter function private.current_quote_admin_user_id(uuid) set search_path = '';
revoke execute on function private.current_quote_admin_user_id(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.current_quote_admin_user_id(
  target_workspace_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_quote_admin_user_id(target_workspace_id);
$$;
revoke execute on function public.current_quote_admin_user_id(uuid)
  from public, anon, authenticated, service_role;

alter function public.is_public_website_quote_request(uuid,uuid) set schema private;
alter function private.is_public_website_quote_request(uuid,uuid) set search_path = '';
revoke execute on function private.is_public_website_quote_request(uuid,uuid)
  from public, anon, authenticated, service_role;

alter function public.is_listing_media_product_admin_object(text,text)
  set schema private;
create or replace function private.is_listing_media_product_admin_object(
  object_bucket text,
  object_name text
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when object_bucket <> 'listing-media'
      or not public.is_listing_media_object_path(object_name)
    then false
    else private.is_workspace_product_manager(
      pg_catalog.split_part(object_name, '/', 1)::uuid
    )
    and exists (
      select 1
      from public.products product
      where product.id = pg_catalog.split_part(object_name, '/', 2)::uuid
        and product.workspace_id = pg_catalog.split_part(object_name, '/', 1)::uuid
    )
  end;
$$;
revoke execute on function private.is_listing_media_product_admin_object(text,text)
  from public, anon, authenticated, service_role;

alter function public.is_hero_media_admin_object(text,text) set schema private;
create or replace function private.is_hero_media_admin_object(
  object_bucket text,
  object_name text
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when object_bucket <> 'hero-media'
      or not public.is_hero_media_object_path(object_name)
    then false
    else private.is_workspace_product_manager(
      pg_catalog.split_part(object_name, '/', 1)::uuid
    )
  end;
$$;
revoke execute on function private.is_hero_media_admin_object(text,text)
  from public, anon, authenticated, service_role;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_public_website_quote_request(uuid,uuid)
  to anon;
grant execute on function private.current_quote_admin_user_id(uuid)
  to authenticated;
grant execute on function private.is_hero_media_admin_object(text,text)
  to authenticated;
grant execute on function private.is_listing_media_product_admin_object(text,text)
  to authenticated;
grant execute on function private.is_workspace_admin_access_member(uuid)
  to authenticated;
grant execute on function private.is_workspace_member(uuid)
  to authenticated;
grant execute on function private.is_workspace_product_manager(uuid)
  to authenticated;
grant execute on function private.is_workspace_quote_manager(uuid)
  to authenticated;

grant execute on function public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)
  to anon;
grant execute on function public.get_public_catalogue(uuid,text)
  to anon;
grant execute on function public.get_public_homepage_hero(uuid)
  to anon;
grant execute on function public.get_public_page_media(uuid,text)
  to anon;
grant execute on function public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)
  to anon;
grant execute on function public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)
  to anon;

grant execute on function public.enqueue_search_index_job(uuid,text,uuid,text,text,text,text,jsonb,text)
  to authenticated;
grant execute on function public.ensure_admin_access_membership(uuid)
  to authenticated;
grant execute on function public.execute_admin_access_write(uuid,text,text)
  to authenticated;
grant execute on function public.execute_admin_homepage_hero_image_write(uuid,jsonb)
  to authenticated;
grant execute on function public.execute_admin_product_write(text,uuid,uuid,jsonb)
  to authenticated;
grant execute on function public.execute_admin_public_page_media_write(uuid,text,jsonb)
  to authenticated;
grant execute on function public.execute_admin_quote_crm_handoff_queue_update(uuid,uuid,text,text)
  to authenticated;
grant execute on function public.execute_admin_quote_workflow(uuid,uuid,text,text)
  to authenticated;
grant execute on function public.get_admin_access_membership(uuid,uuid)
  to authenticated;
grant execute on function public.list_admin_access_records(uuid)
  to authenticated;

comment on schema private is
  'Non-exposed database implementation schema. Exact helper EXECUTE grants support RLS without creating public PostgREST RPCs.';
