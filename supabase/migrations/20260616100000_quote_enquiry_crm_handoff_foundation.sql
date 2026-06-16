-- Supabase enquiry persistence and CRM handoff foundation.
-- Extends existing quote/enquiry records with safe source metadata and
-- placeholder CRM handoff tracking. No provider calls or workflow execution.

alter table public.quote_requests
  add column if not exists source_page_path text,
  add column if not exists source_listing_slug text,
  add column if not exists source_listing_id uuid,
  add column if not exists submission_request_id text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_admin_user_id uuid,
  add column if not exists review_notes text,
  add column if not exists crm_provider text not null default 'hubspot',
  add column if not exists crm_sync_status text not null default 'not_queued',
  add column if not exists crm_contact_id text,
  add column if not exists crm_deal_id text,
  add column if not exists crm_last_sync_attempt_at timestamptz,
  add column if not exists crm_sync_error text;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_source_page_path_length_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_source_page_path_length_check
      check (
        source_page_path is null
        or (
          char_length(source_page_path) <= 500
          and source_page_path like '/%'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_source_listing_slug_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_source_listing_slug_check
      check (
        source_listing_slug is null
        or (
          char_length(source_listing_slug) <= 120
          and source_listing_slug ~ '^[a-z0-9][a-z0-9-]*$'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_submission_request_id_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_submission_request_id_check
      check (
        submission_request_id is null
        or (
          btrim(submission_request_id) <> ''
          and char_length(submission_request_id) <= 128
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_review_notes_length_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_review_notes_length_check
      check (review_notes is null or char_length(review_notes) <= 1200);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_review_shape_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_review_shape_check
      check (
        reviewed_by_admin_user_id is null
        or reviewed_at is not null
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_crm_provider_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_crm_provider_check
      check (crm_provider in ('hubspot'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_crm_sync_status_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_crm_sync_status_check
      check (crm_sync_status in ('not_queued', 'queued', 'synced', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_crm_external_ids_length_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_crm_external_ids_length_check
      check (
        (crm_contact_id is null or char_length(crm_contact_id) <= 120)
        and (crm_deal_id is null or char_length(crm_deal_id) <= 120)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_crm_sync_error_length_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_crm_sync_error_length_check
      check (crm_sync_error is null or char_length(crm_sync_error) <= 500);
  end if;

end
$constraints$;

do $foreign_keys$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_source_listing_workspace_id_fkey'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_source_listing_workspace_id_fkey
      foreign key (source_listing_id, workspace_id)
      references public.products (id, workspace_id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_reviewed_by_admin_user_id_fkey'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_reviewed_by_admin_user_id_fkey
      foreign key (reviewed_by_admin_user_id)
      references public.admin_users (id)
      on delete set null;
  end if;
end
$foreign_keys$;

create index if not exists quote_requests_workspace_crm_sync_status_idx
  on public.quote_requests (workspace_id, crm_sync_status, created_at desc);

create index if not exists quote_requests_workspace_source_listing_idx
  on public.quote_requests (workspace_id, source_listing_slug, created_at desc)
  where source_listing_slug is not null;

create unique index if not exists quote_requests_workspace_submission_request_id_key
  on public.quote_requests (workspace_id, submission_request_id)
  where submission_request_id is not null;

grant insert (
  source_page_path,
  source_listing_slug,
  source_listing_id,
  submission_request_id,
  crm_provider,
  crm_sync_status,
  crm_contact_id,
  crm_deal_id,
  crm_last_sync_attempt_at,
  crm_sync_error
) on public.quote_requests to anon;

alter policy quote_requests_public_insert_website
  on public.quote_requests
  with check (
    source = 'website'
    and status = 'new'
    and crm_provider = 'hubspot'
    and crm_sync_status = 'not_queued'
    and crm_contact_id is null
    and crm_deal_id is null
    and crm_last_sync_attempt_at is null
    and crm_sync_error is null
  );

comment on column public.quote_requests.source_page_path is
  'Site-relative page/path where the public quote/enquiry request started.';

comment on column public.quote_requests.source_listing_slug is
  'Optional listing slug context for the public quote/enquiry request.';

comment on column public.quote_requests.submission_request_id is
  'Optional first-party idempotency or duplicate-detection key. Do not store secrets or raw headers.';

comment on column public.quote_requests.crm_provider is
  'Future CRM handoff provider placeholder. HubSpot is planned; sync is not implemented here.';

comment on column public.quote_requests.crm_sync_status is
  'Future CRM handoff status placeholder only. No CRM sync job is implemented here.';

comment on column public.quote_requests.crm_sync_error is
  'Bounded sanitized future CRM sync diagnostic only. Do not store customer payloads, credentials, or raw provider responses.';
