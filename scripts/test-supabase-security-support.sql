-- Ephemeral local RLS harness support. This file is not a production migration.

insert into private.quote_submission_admission_config (hmac_secret)
values ('local-rls-quote-admission-secret-for-tests-only');

create schema test_support;
grant usage on schema test_support to anon, authenticated;

create function test_support.submit_public_quote_request(
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
as $support$
declare
  v_digest text;
  v_expires_at bigint := floor(extract(epoch from clock_timestamp()))::bigint + 60;
  v_message text;
  v_signature text;
begin
  v_digest := public.get_public_quote_submission_digest(
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
    p_items,
    p_handoff_claim_token
  );
  v_message := concat_ws(
    E'\n',
    'skr.quote.submit.v1',
    p_workspace_id::text,
    p_submission_request_id,
    v_digest,
    v_expires_at::text
  );
  v_signature := encode(
    public.hmac(
      convert_to(v_message, 'UTF8'),
      convert_to('local-rls-quote-admission-secret-for-tests-only', 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  return query select * from public.submit_public_quote_request(
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
    p_items,
    p_handoff_claim_token,
    v_digest,
    v_expires_at,
    v_signature
  );
end;
$support$;

revoke all on function test_support.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) from public, authenticated;
grant execute on function test_support.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) to anon;

create function test_support.finalize_public_quote_handoff(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_submission_request_id text,
  p_claim_token uuid,
  p_outcome text,
  p_error_code text
)
returns boolean
language sql
security definer
set search_path = ''
as $support$
  select public.finalize_public_quote_handoff(
    p_quote_request_id,
    p_workspace_id,
    p_submission_request_id,
    p_claim_token,
    p_outcome,
    case when p_outcome = 'completed' then 'delivered' else 'failed' end,
    case when p_outcome = 'completed' then 'test-provider-message' else null end,
    case when p_outcome = 'completed' then null else coalesce(p_error_code, 'test_failure') end,
    'rls-finalize-' || p_claim_token::text
  );
$support$;

revoke all on function test_support.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) from public, authenticated;
grant execute on function test_support.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) to anon;
