-- Make public quote persistence atomic, replay-safe, and durably handoff-aware.
-- Anonymous callers can write quote state only through the two narrow RPCs
-- defined here. RLS remains enabled as defense in depth.

create table public.quote_handoff_outbox (
  quote_request_id uuid primary key,
  workspace_id uuid not null,
  submission_request_id text not null,
  state text not null default 'pending',
  claim_token uuid,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  attempt_count integer not null default 0,
  completed_at timestamptz,
  last_failure_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_handoff_outbox_quote_workspace_fkey
    foreign key (quote_request_id, workspace_id)
    references public.quote_requests(id, workspace_id)
    on delete cascade,
  constraint quote_handoff_outbox_workspace_submission_unique
    unique (workspace_id, submission_request_id),
  constraint quote_handoff_outbox_state_check
    check (state in ('pending', 'claimed', 'completed', 'retryable_failed')),
  constraint quote_handoff_outbox_attempt_count_check
    check (attempt_count >= 0),
  constraint quote_handoff_outbox_claim_shape_check
    check (
      (state = 'claimed' and claim_token is not null and claimed_at is not null and claim_expires_at is not null)
      or
      (state <> 'claimed' and claim_token is null and claimed_at is null and claim_expires_at is null)
    ),
  constraint quote_handoff_outbox_completion_shape_check
    check ((state = 'completed') = (completed_at is not null)),
  constraint quote_handoff_outbox_error_code_check
    check (
      last_error_code is null
      or (
        char_length(last_error_code) between 1 and 80
        and last_error_code ~ '^[a-z0-9_:-]+$'
      )
    )
);

alter table public.quote_handoff_outbox enable row level security;

comment on table public.quote_handoff_outbox is
  'Private durable claim state for the first server-side n8n/email handoff of a public quote.';

-- Existing website quotes predate this outbox and must not be delivered again.
insert into public.quote_handoff_outbox (
  quote_request_id,
  workspace_id,
  submission_request_id,
  state,
  completed_at
)
select
  quote.id,
  quote.workspace_id,
  quote.submission_request_id,
  'completed',
  coalesce(quote.created_at, now())
from public.quote_requests quote
where quote.source = 'website'
  and quote.submission_request_id is not null
on conflict do nothing;

create or replace function public.submit_public_quote_request(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_public_reference text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_message text,
  p_event_date date,
  p_venue text,
  p_source_page_path text,
  p_source_listing_slug text,
  p_submission_request_id text,
  p_items jsonb,
  p_handoff_claim_token uuid
)
returns table (
  quote_request_id uuid,
  public_reference text,
  was_created boolean,
  handoff_claim_status text,
  handoff_claim_token uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_quote public.quote_requests%rowtype;
  normalized_items jsonb;
  persisted_items jsonb;
  created_quote boolean := false;
  handoff_row public.quote_handoff_outbox%rowtype;
begin
  if not exists (
    select 1
    from public.catalogue_public_workspace_config cfg
    join public.workspaces workspace on workspace.id = cfg.active_workspace_id
    where cfg.id = true
      and cfg.is_enabled = true
      and cfg.active_workspace_id = p_workspace_id
      and workspace.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'quote workspace is not available';
  end if;

  if p_quote_request_id is null
    or p_handoff_claim_token is null
    or p_public_reference is null
    or btrim(p_public_reference) = ''
    or p_customer_name is null
    or btrim(p_customer_name) = ''
    or char_length(p_customer_name) > 120
    or (p_customer_email is null and p_customer_phone is null)
    or (nullif(btrim(p_customer_email), '') is null and nullif(btrim(p_customer_phone), '') is null)
    or char_length(coalesce(p_customer_email, '')) > 254
    or char_length(coalesce(p_customer_phone, '')) > 40
    or char_length(coalesce(p_customer_message, '')) > 1200
    or char_length(coalesce(p_venue, '')) > 180
    or char_length(coalesce(p_source_page_path, '')) > 500
    or char_length(coalesce(p_source_listing_slug, '')) > 120
    or p_submission_request_id is null
    or btrim(p_submission_request_id) = ''
    or char_length(p_submission_request_id) > 128
    or p_submission_request_id !~ '^[A-Za-z0-9._:-]+$'
    or p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) > 20
  then
    raise exception using errcode = '22023', message = 'invalid public quote submission';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where jsonb_typeof(item) <> 'object'
      or item - array['product_name_snapshot', 'quantity', 'notes'] <> '{}'::jsonb
      or jsonb_typeof(item -> 'product_name_snapshot') <> 'string'
      or btrim(item ->> 'product_name_snapshot') = ''
      or char_length(item ->> 'product_name_snapshot') > 180
      or jsonb_typeof(item -> 'quantity') <> 'number'
      or (item ->> 'quantity') !~ '^[0-9]+$'
      or (item ->> 'quantity')::numeric < 1
      or (item ->> 'quantity')::numeric > 10000
      or (
        item ? 'notes'
        and item -> 'notes' <> 'null'::jsonb
        and (
          jsonb_typeof(item -> 'notes') <> 'string'
          or char_length(item ->> 'notes') > 500
        )
      )
  ) then
    raise exception using errcode = '22023', message = 'invalid public quote items';
  end if;

  select coalesce(jsonb_agg(item order by item::text), '[]'::jsonb)
  into normalized_items
  from (
    select jsonb_build_object(
      'product_name_snapshot', item ->> 'product_name_snapshot',
      'quantity', (item ->> 'quantity')::integer,
      'notes', nullif(item ->> 'notes', '')
    ) as item
    from jsonb_array_elements(p_items) item
  ) normalized;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_workspace_id::text),
    pg_catalog.hashtext(p_submission_request_id)
  );

  select quote.*
  into existing_quote
  from public.quote_requests quote
  where quote.workspace_id = p_workspace_id
    and quote.submission_request_id = p_submission_request_id;

  if found then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'product_name_snapshot', item.product_name_snapshot,
          'quantity', item.quantity,
          'notes', item.notes
        )
        order by jsonb_build_object(
          'product_name_snapshot', item.product_name_snapshot,
          'quantity', item.quantity,
          'notes', item.notes
        )::text
      ),
      '[]'::jsonb
    )
    into persisted_items
    from public.quote_request_items item
    where item.workspace_id = existing_quote.workspace_id
      and item.quote_request_id = existing_quote.id;

    if existing_quote.customer_name is distinct from p_customer_name
      or existing_quote.customer_email is distinct from p_customer_email
      or existing_quote.customer_phone is distinct from p_customer_phone
      or existing_quote.customer_message is distinct from p_customer_message
      or existing_quote.event_date is distinct from p_event_date
      or existing_quote.venue is distinct from p_venue
      or existing_quote.source_page_path is distinct from p_source_page_path
      or existing_quote.source_listing_slug is distinct from p_source_listing_slug
      or persisted_items is distinct from normalized_items
    then
      raise exception using errcode = '22023', message = 'submission identifier payload mismatch';
    end if;
  else
    insert into public.quote_requests (
      id, workspace_id, public_reference, customer_name, customer_email,
      customer_phone, customer_message, event_date, venue, source_page_path,
      source_listing_slug, submission_request_id, crm_provider, crm_sync_status,
      crm_contact_id, crm_deal_id, crm_last_sync_attempt_at, crm_sync_error,
      status, source
    ) values (
      p_quote_request_id, p_workspace_id, p_public_reference, p_customer_name,
      p_customer_email, p_customer_phone, p_customer_message, p_event_date,
      p_venue, p_source_page_path, p_source_listing_slug,
      p_submission_request_id, 'hubspot', 'not_queued', null, null, null, null,
      'new', 'website'
    );

    insert into public.quote_request_items (
      workspace_id, quote_request_id, product_name_snapshot, quantity, notes
    )
    select
      p_workspace_id,
      p_quote_request_id,
      item ->> 'product_name_snapshot',
      (item ->> 'quantity')::integer,
      nullif(item ->> 'notes', '')
    from jsonb_array_elements(p_items) item;

    insert into public.quote_handoff_outbox (
      quote_request_id, workspace_id, submission_request_id
    ) values (
      p_quote_request_id, p_workspace_id, p_submission_request_id
    );

    existing_quote.id := p_quote_request_id;
    existing_quote.public_reference := p_public_reference;
    created_quote := true;
  end if;

  select outbox.*
  into handoff_row
  from public.quote_handoff_outbox outbox
  where outbox.quote_request_id = existing_quote.id
    and outbox.workspace_id = p_workspace_id
    and outbox.submission_request_id = p_submission_request_id
  for update;

  if not found then
    raise exception using errcode = '55000', message = 'quote handoff state is unavailable';
  end if;

  if handoff_row.state = 'completed' then
    return query select
      existing_quote.id,
      existing_quote.public_reference,
      created_quote,
      'completed'::text,
      null::uuid;
    return;
  end if;

  if handoff_row.state = 'claimed' and handoff_row.claim_expires_at > now() then
    return query select
      existing_quote.id,
      existing_quote.public_reference,
      created_quote,
      'in_progress'::text,
      null::uuid;
    return;
  end if;

  update public.quote_handoff_outbox outbox
  set
    state = 'claimed',
    claim_token = p_handoff_claim_token,
    claimed_at = now(),
    claim_expires_at = now() + interval '5 minutes',
    attempt_count = outbox.attempt_count + 1,
    updated_at = now()
  where outbox.quote_request_id = existing_quote.id
  returning outbox.* into handoff_row;

  return query select
    existing_quote.id,
    existing_quote.public_reference,
    created_quote,
    'claimed'::text,
    handoff_row.claim_token;
end;
$$;

comment on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) is
  'Atomically persists a public quote and items and acquires its pending handoff lease, or safely replays a matching submission.';

create or replace function public.finalize_public_quote_handoff(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_submission_request_id text,
  p_claim_token uuid,
  p_outcome text,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_quote_request_id is null
    or p_workspace_id is null
    or p_submission_request_id is null
    or btrim(p_submission_request_id) = ''
    or char_length(p_submission_request_id) > 128
    or p_submission_request_id !~ '^[A-Za-z0-9._:-]+$'
    or p_claim_token is null
    or p_outcome is null
    or p_outcome not in ('completed', 'retryable_failed')
    or (
      p_error_code is not null
      and (
        char_length(p_error_code) not between 1 and 80
        or p_error_code !~ '^[a-z0-9_:-]+$'
      )
    )
    or (p_outcome = 'completed' and p_error_code is not null)
    or (p_outcome = 'retryable_failed' and p_error_code is null)
  then
    raise exception using errcode = '22023', message = 'invalid quote handoff finalization';
  end if;

  if not exists (
    select 1
    from public.catalogue_public_workspace_config cfg
    join public.workspaces workspace on workspace.id = cfg.active_workspace_id
    where cfg.id = true
      and cfg.is_enabled = true
      and cfg.active_workspace_id = p_workspace_id
      and workspace.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'quote workspace is not available';
  end if;

  update public.quote_handoff_outbox outbox
  set
    state = p_outcome,
    claim_token = null,
    claimed_at = null,
    claim_expires_at = null,
    completed_at = case when p_outcome = 'completed' then now() else null end,
    last_failure_at = case when p_outcome = 'retryable_failed' then now() else outbox.last_failure_at end,
    last_error_code = case when p_outcome = 'retryable_failed' then p_error_code else null end,
    updated_at = now()
  where outbox.quote_request_id = p_quote_request_id
    and outbox.workspace_id = p_workspace_id
    and outbox.submission_request_id = p_submission_request_id
    and outbox.state = 'claimed'
    and outbox.claim_token = p_claim_token;

  if not found then
    raise exception using errcode = '42501', message = 'quote handoff claim is unavailable';
  end if;

  return true;
end;
$$;

comment on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) is
  'Completes or releases one exact active-workspace public quote handoff claim.';

revoke all privileges on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) from public, anon, authenticated;
grant execute on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) to anon;

revoke all privileges on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) from public, anon, authenticated;
grant execute on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) to anon;

-- Historical migrations granted both table-level and column-level INSERT.
-- PostgreSQL stores those ACLs separately, so revoke both explicitly.
revoke all privileges on table public.quote_requests from anon;
revoke insert (
  id,
  workspace_id,
  public_reference,
  customer_name,
  customer_email,
  customer_phone,
  customer_message,
  event_date,
  venue,
  status,
  source,
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
) on public.quote_requests from anon;

revoke all privileges on table public.quote_request_items from anon;
revoke insert (
  workspace_id,
  quote_request_id,
  product_name_snapshot,
  quantity,
  notes
) on public.quote_request_items from anon;

revoke all privileges on table public.quote_handoff_outbox from public, anon, authenticated;
