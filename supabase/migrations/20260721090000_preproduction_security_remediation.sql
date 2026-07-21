-- Close the pre-production quote admission, handoff provenance, and
-- workspace-local admin isolation findings without rewriting applied history.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.quote_submission_admission_config (
  id boolean primary key default true,
  hmac_secret text not null,
  configured_at timestamptz not null default now(),
  constraint quote_submission_admission_config_singleton_check check (id),
  constraint quote_submission_admission_config_secret_check
    check (octet_length(hmac_secret) >= 32)
);

revoke all privileges on table private.quote_submission_admission_config
  from public, anon, authenticated;

comment on table private.quote_submission_admission_config is
  'Private deployment-owned HMAC material for purpose-separated public quote admission proofs.';

create or replace function private.quote_submission_payload_digest(
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
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.encode(
    public.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'quote_request_id', p_quote_request_id,
          'workspace_id', p_workspace_id,
          'public_reference', p_public_reference,
          'customer_name', p_customer_name,
          'customer_email', p_customer_email,
          'customer_phone', p_customer_phone,
          'customer_message', p_customer_message,
          'event_date', p_event_date,
          'venue', p_venue,
          'source_page_path', p_source_page_path,
          'source_listing_slug', p_source_listing_slug,
          'submission_request_id', p_submission_request_id,
          'items', p_items,
          'handoff_claim_token', p_handoff_claim_token
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all privileges on function private.quote_submission_payload_digest(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) from public, anon, authenticated;

create or replace function public.get_public_quote_submission_digest(
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
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select private.quote_submission_payload_digest(
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
$$;

revoke all privileges on function public.get_public_quote_submission_digest(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) from public, anon, authenticated;
grant execute on function public.get_public_quote_submission_digest(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) to anon;

alter function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) rename to submit_public_quote_request_unadmitted;
alter function public.submit_public_quote_request_unadmitted(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) set schema private;
revoke all privileges on function private.submit_public_quote_request_unadmitted(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid
) from public, anon, authenticated;

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
  p_handoff_claim_token uuid,
  p_admission_payload_digest text,
  p_admission_expires_at bigint,
  p_admission_signature text
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
  v_actual_digest text;
  v_expected_signature text;
  v_message text;
  v_now_epoch bigint := pg_catalog.floor(extract(epoch from pg_catalog.clock_timestamp()))::bigint;
  v_secret text;
begin
  if p_admission_payload_digest is null
    or p_admission_payload_digest !~ '^[a-f0-9]{64}$'
    or p_admission_signature is null
    or p_admission_signature !~ '^[a-f0-9]{64}$'
    or p_admission_expires_at is null
    or p_admission_expires_at < v_now_epoch
    or p_admission_expires_at > v_now_epoch + 120
  then
    raise exception using errcode = '42501', message = 'quote admission proof is invalid';
  end if;

  select cfg.hmac_secret
  into v_secret
  from private.quote_submission_admission_config cfg
  where cfg.id = true;

  if v_secret is null then
    raise exception using errcode = '55000', message = 'quote admission is not configured';
  end if;

  v_actual_digest := private.quote_submission_payload_digest(
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

  if v_actual_digest is distinct from p_admission_payload_digest then
    raise exception using errcode = '42501', message = 'quote admission proof is invalid';
  end if;

  v_message := pg_catalog.concat_ws(
    E'\n',
    'skr.quote.submit.v1',
    p_workspace_id::text,
    p_submission_request_id,
    p_admission_payload_digest,
    p_admission_expires_at::text
  );
  v_expected_signature := pg_catalog.encode(
    public.hmac(
      pg_catalog.convert_to(v_message, 'UTF8'),
      pg_catalog.convert_to(v_secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  if v_expected_signature is distinct from p_admission_signature then
    raise exception using errcode = '42501', message = 'quote admission proof is invalid';
  end if;

  return query
  select *
  from private.submit_public_quote_request_unadmitted(
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
end;
$$;

comment on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid, text, bigint, text
) is
  'Validates a short-lived server-issued admission proof before atomically persisting a public quote, items, and handoff state.';

revoke all privileges on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.submit_public_quote_request(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, jsonb, uuid, text, bigint, text
) to anon;

alter policy quote_email_delivery_log_public_insert_website_quote
  on public.quote_email_delivery_log with check (false);
revoke all privileges on table public.quote_email_delivery_log from public, anon;
revoke insert (
  workspace_id,
  quote_request_id,
  public_reference,
  recipient_email_redacted,
  provider,
  delivery_status,
  provider_message_id,
  error_code,
  request_id
) on public.quote_email_delivery_log from public, anon, authenticated;

alter table public.quote_email_delivery_log
  add column handoff_claim_token uuid;

create unique index quote_email_delivery_log_handoff_claim_unique
  on public.quote_email_delivery_log (quote_request_id, handoff_claim_token)
  where handoff_claim_token is not null;

revoke all privileges on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text
) from public, anon, authenticated;

create or replace function public.finalize_public_quote_handoff(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_submission_request_id text,
  p_claim_token uuid,
  p_outcome text,
  p_delivery_status text,
  p_provider_message_id text,
  p_error_code text,
  p_request_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_outbox public.quote_handoff_outbox%rowtype;
  v_public_reference text;
begin
  if p_quote_request_id is null
    or p_workspace_id is null
    or p_submission_request_id is null
    or btrim(p_submission_request_id) = ''
    or char_length(p_submission_request_id) > 128
    or p_submission_request_id !~ '^[A-Za-z0-9._:-]+$'
    or p_claim_token is null
    or p_outcome not in ('completed', 'retryable_failed')
    or p_delivery_status not in ('pending', 'delivered', 'failed', 'not_configured')
    or p_request_id is null
    or char_length(btrim(p_request_id)) not between 1 and 128
    or (p_provider_message_id is not null and char_length(p_provider_message_id) > 120)
    or (p_error_code is not null and (
      char_length(p_error_code) not between 1 and 80
      or p_error_code !~ '^[a-z0-9_.:-]+$'
    ))
    or (p_outcome = 'completed' and (
      p_delivery_status not in ('pending', 'delivered') or p_error_code is not null
    ))
    or (p_outcome = 'retryable_failed' and (
      p_delivery_status not in ('failed', 'not_configured') or p_error_code is null
    ))
  then
    raise exception using errcode = '22023', message = 'invalid quote handoff finalization';
  end if;

  if not exists (
    select 1
    from public.quote_public_workspace_config cfg
    join public.workspaces workspace on workspace.id = cfg.active_workspace_id
    where cfg.id = true
      and cfg.is_enabled = true
      and cfg.active_workspace_id = p_workspace_id
      and workspace.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'quote workspace is not available';
  end if;

  select outbox.*
  into v_outbox
  from public.quote_handoff_outbox outbox
  where outbox.quote_request_id = p_quote_request_id
    and outbox.workspace_id = p_workspace_id
    and outbox.submission_request_id = p_submission_request_id
  for update;

  if not found
    or v_outbox.state <> 'claimed'
    or v_outbox.claim_token is distinct from p_claim_token
    or v_outbox.claim_expires_at <= now()
  then
    raise exception using errcode = '42501', message = 'quote handoff claim is unavailable';
  end if;

  select quote.public_reference
  into v_public_reference
  from public.quote_requests quote
  where quote.id = p_quote_request_id
    and quote.workspace_id = p_workspace_id;

  if not found then
    raise exception using errcode = '42501', message = 'quote handoff claim is unavailable';
  end if;

  insert into public.quote_email_delivery_log (
    workspace_id,
    quote_request_id,
    public_reference,
    recipient_email_redacted,
    provider,
    delivery_status,
    provider_message_id,
    error_code,
    request_id,
    handoff_claim_token
  ) values (
    p_workspace_id,
    p_quote_request_id,
    v_public_reference,
    null,
    'n8n',
    p_delivery_status,
    p_provider_message_id,
    p_error_code,
    p_request_id,
    p_claim_token
  );

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
  where outbox.quote_request_id = p_quote_request_id;

  return true;
end;
$$;

comment on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text, text, text, text
) is
  'Atomically validates one unexpired exact handoff claim, records trusted delivery evidence once, and finalizes its outbox state.';

revoke all privileges on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.finalize_public_quote_handoff(
  uuid, uuid, text, uuid, text, text, text, text, text
) to anon;

create or replace function public.execute_admin_access_write(
  p_workspace_id uuid,
  p_action text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_access_id uuid;
  v_email text;
  v_target public.admin_access%rowtype;
begin
  v_actor_access_id := public.current_admin_access_id(p_workspace_id);
  v_email := public.normalize_admin_access_email(p_email);

  if v_actor_access_id is null
    or not public.is_workspace_admin_access_owner(p_workspace_id) then
    return jsonb_build_object('ok', false, 'code', 'owner_required');
  end if;

  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'code', 'email_invalid');
  end if;

  select * into v_target
  from public.admin_access
  where workspace_id = p_workspace_id
    and normalized_email = v_email
  limit 1;

  if p_action = 'add_admin' then
    if found and v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    insert into public.admin_access (
      workspace_id,
      normalized_email,
      role,
      status,
      created_by_admin_access_id,
      updated_by_admin_access_id
    ) values (
      p_workspace_id,
      v_email,
      'admin',
      'active',
      v_actor_access_id,
      v_actor_access_id
    )
    on conflict (workspace_id, normalized_email)
    do update set
      role = 'admin',
      status = 'active',
      updated_by_admin_access_id = v_actor_access_id,
      updated_at = now()
    where public.admin_access.role <> 'owner';
  elsif p_action = 'disable_admin' then
    if not found then
      return jsonb_build_object('ok', false, 'code', 'admin_not_found');
    end if;
    if v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    update public.admin_access
    set status = 'disabled',
        updated_by_admin_access_id = v_actor_access_id,
        updated_at = now()
    where id = v_target.id
      and role <> 'owner';
  elsif p_action = 'remove_admin' then
    if not found then
      return jsonb_build_object('ok', false, 'code', 'admin_not_found');
    end if;
    if v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    update public.admin_access
    set status = 'removed',
        updated_by_admin_access_id = v_actor_access_id,
        updated_at = now()
    where id = v_target.id
      and role <> 'owner';
  else
    return jsonb_build_object('ok', false, 'code', 'action_invalid');
  end if;

  if found and v_target.linked_admin_user_id is not null then
    if p_action = 'add_admin' then
      update public.memberships
      set role = 'admin', status = 'active', updated_at = now()
      where workspace_id = p_workspace_id
        and admin_user_id = v_target.linked_admin_user_id;
    else
      update public.memberships
      set status = 'suspended', updated_at = now()
      where workspace_id = p_workspace_id
        and admin_user_id = v_target.linked_admin_user_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'role', 'admin',
    'status',
    case
      when p_action = 'disable_admin' then 'disabled'
      when p_action = 'remove_admin' then 'removed'
      else 'active'
    end
  );
end;
$$;

comment on function public.execute_admin_access_write(uuid, text, text) is
  'Owner-only workspace-local admin access and membership mutation; add/disable/remove never changes the shared global admin identity status.';

revoke all on function public.execute_admin_access_write(uuid, text, text) from public;
grant execute on function public.execute_admin_access_write(uuid, text, text) to authenticated;
