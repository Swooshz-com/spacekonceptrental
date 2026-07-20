-- Make public quote persistence atomic and replay-safe at one narrow RPC.
-- The function is the only anonymous quote-table write surface after this
-- migration; RLS remains enabled on both tables as defense in depth.

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
  p_items jsonb
)
returns table (
  quote_request_id uuid,
  public_reference text,
  was_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_quote public.quote_requests%rowtype;
  normalized_items jsonb;
  persisted_items jsonb;
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

  select qr.*
  into existing_quote
  from public.quote_requests qr
  where qr.workspace_id = p_workspace_id
    and qr.submission_request_id = p_submission_request_id;

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

    return query
    select existing_quote.id, existing_quote.public_reference, false;
    return;
  end if;

  insert into public.quote_requests (
    id,
    workspace_id,
    public_reference,
    customer_name,
    customer_email,
    customer_phone,
    customer_message,
    event_date,
    venue,
    source_page_path,
    source_listing_slug,
    submission_request_id,
    crm_provider,
    crm_sync_status,
    crm_contact_id,
    crm_deal_id,
    crm_last_sync_attempt_at,
    crm_sync_error,
    status,
    source
  ) values (
    p_quote_request_id,
    p_workspace_id,
    p_public_reference,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_message,
    p_event_date,
    p_venue,
    p_source_page_path,
    p_source_listing_slug,
    p_submission_request_id,
    'hubspot',
    'not_queued',
    null,
    null,
    null,
    null,
    'new',
    'website'
  );

  insert into public.quote_request_items (
    workspace_id,
    quote_request_id,
    product_name_snapshot,
    quantity,
    notes
  )
  select
    p_workspace_id,
    p_quote_request_id,
    item ->> 'product_name_snapshot',
    (item ->> 'quantity')::integer,
    nullif(item ->> 'notes', '')
  from jsonb_array_elements(p_items) item;

  return query select p_quote_request_id, p_public_reference, true;
end;
$$;

comment on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb
) is
  'Atomically creates one active-workspace website quote and its item snapshots, or safely replays a matching submission identifier.';

revoke all privileges on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb
) to anon;

revoke all privileges on table public.quote_requests from anon;
revoke all privileges on table public.quote_request_items from anon;
