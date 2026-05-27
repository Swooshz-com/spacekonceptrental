-- Phase 1H-A quote request persistence only.
-- Allows first-party server routes using the anon Supabase key to create
-- website quote requests without adding anonymous reads, updates, or deletes.

grant insert (
  id,
  workspace_id,
  public_reference,
  customer_name,
  customer_email,
  customer_phone,
  event_date,
  venue,
  status,
  source
) on public.quote_requests to anon;

grant insert (
  workspace_id,
  quote_request_id,
  product_name_snapshot,
  quantity,
  notes
) on public.quote_request_items to anon;

create or replace function public.is_public_website_quote_request(
  target_quote_request_id uuid,
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quote_requests qr
    where qr.id = target_quote_request_id
      and qr.workspace_id = target_workspace_id
      and qr.source = 'website'
      and qr.status = 'new'
  );
$$;

revoke all on function public.is_public_website_quote_request(uuid, uuid) from public;
grant execute on function public.is_public_website_quote_request(uuid, uuid) to anon;

create policy quote_requests_public_insert_website
  on public.quote_requests
  for insert
  to anon
  with check (source = 'website' and status = 'new');

create policy quote_request_items_public_insert_website_quote
  on public.quote_request_items
  for insert
  to anon
  with check (
    public.is_public_website_quote_request(quote_request_id, workspace_id)
  );
