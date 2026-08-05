-- Add the internal-alpha durable application operation event foundation (M1).
-- Scope is strictly schema/RLS/admission: one append-only table, one private
-- singleton HMAC admission configuration, one SECURITY DEFINER write RPC, and
-- exact privilege contracts. No runtime sink, admin read module, quote-handoff
-- retry, chat event, alerting, deletion, backup/restore, n8n, or deployment
-- work is included.

create table public.app_operation_events (
  event_id uuid primary key,
  workspace_id uuid not null,
  category text not null,
  outcome text not null,
  reference_type text not null,
  reference_value text,
  error_code text,
  route_key text not null,
  http_status integer,
  actor_admin_user_id uuid,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  retention_eligible_at timestamptz not null default now() + interval '90 days',
  constraint app_operation_events_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete restrict,
  constraint app_operation_events_actor_admin_user_id_fkey
    foreign key (actor_admin_user_id)
    references public.admin_users (id)
    on delete restrict,
  constraint app_operation_events_category_check
    check (
      category in ('quote.submission', 'quote.handoff', 'admin.auth', 'rate.limit')
    ),
  constraint app_operation_events_outcome_check
    check (outcome in ('failed', 'denied', 'disabled', 'pending')),
  constraint app_operation_events_reference_type_check
    check (reference_type in ('none', 'request_id', 'public_reference')),
  constraint app_operation_events_reference_value_check
    check (
      (reference_type = 'none' and reference_value is null)
      or (
        reference_type <> 'none'
        and reference_value is not null
        and char_length(reference_value) between 1 and 128
        and reference_value ~ '^[A-Za-z0-9._:-]+$'
      )
    ),
  constraint app_operation_events_error_code_check
    check (
      error_code is null
      or (
        char_length(error_code) between 1 and 80
        and error_code ~ '^[a-z0-9_:-]+$'
      )
    ),
  constraint app_operation_events_route_key_check
    check (
      char_length(route_key) between 1 and 160
      and route_key ~ '^[A-Za-z0-9_./-]+$'
      and route_key !~ 'https?://'
    ),
  constraint app_operation_events_http_status_check
    check (http_status is null or http_status between 100 and 599),
  constraint app_operation_events_retention_eligible_check
    check (retention_eligible_at >= created_at)
);

alter table public.app_operation_events enable row level security;

create index app_operation_events_workspace_occurred_idx
  on public.app_operation_events (workspace_id, occurred_at);

comment on table public.app_operation_events is
  'Append-only workspace-scoped application operation events for failure, denial, disabled and pending edge outcomes only. No payload, message, contact, prompt, provider, credential or arbitrary metadata is stored.';

comment on column public.app_operation_events.retention_eligible_at is
  'Retention eligibility metadata only; no deletion or cleanup job is implemented by this foundation.';

revoke all privileges on table public.app_operation_events
  from public, anon, authenticated, service_role;
grant select on table public.app_operation_events to authenticated;

create policy app_operation_events_admin_read
  on public.app_operation_events
  for select
  to authenticated
  using (private.is_workspace_admin_access_member(workspace_id));

create table private.app_operation_event_admission_config (
  id boolean primary key default true,
  hmac_secret text not null,
  configured_at timestamptz not null default now(),
  constraint app_operation_event_admission_config_singleton_check check (id),
  constraint app_operation_event_admission_config_secret_check
    check (octet_length(hmac_secret) >= 32)
);

alter table private.app_operation_event_admission_config enable row level security;

revoke all privileges on table private.app_operation_event_admission_config
  from public, anon, authenticated, service_role;

comment on table private.app_operation_event_admission_config is
  'Private singleton deployment-owned HMAC material for app operation event admission proofs. No row is seeded; the database is unconfigured until an operator inserts the secret through an approved channel.';

create or replace function private.app_operation_event_payload_digest(
  p_event_id uuid,
  p_workspace_id uuid,
  p_category text,
  p_outcome text,
  p_reference_type text,
  p_reference_value text,
  p_error_code text,
  p_route_key text,
  p_http_status integer,
  p_occurred_at_ms bigint
)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'event_id', p_event_id,
          'workspace_id', p_workspace_id,
          'category', p_category,
          'outcome', p_outcome,
          'reference_type', p_reference_type,
          'reference_value', p_reference_value,
          'error_code', p_error_code,
          'route_key', p_route_key,
          'http_status', p_http_status,
          'occurred_at_ms', p_occurred_at_ms
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all privileges on function private.app_operation_event_payload_digest(
  uuid, uuid, text, text, text, text, text, text, integer, bigint
) from public, anon, authenticated, service_role;

comment on function private.app_operation_event_payload_digest(
  uuid, uuid, text, text, text, text, text, text, integer, bigint
) is
  'Deterministic canonical digest over every caller-controlled app operation event field for admission proof binding.';

create or replace function public.record_app_operation_event(
  p_event_id uuid,
  p_workspace_id uuid,
  p_category text,
  p_outcome text,
  p_reference_type text,
  p_reference_value text,
  p_error_code text,
  p_route_key text,
  p_http_status integer,
  p_occurred_at_ms bigint,
  p_admission_payload_digest text,
  p_admission_expires_at bigint,
  p_admission_signature text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_epoch bigint := pg_catalog.floor(extract(epoch from pg_catalog.clock_timestamp()))::bigint;
  v_secret text;
  v_actual_digest text;
  v_message text;
  v_expected_signature text;
  v_actor_admin_user_id uuid;
  v_occurred_at timestamptz;
begin
  if p_event_id is null
    or p_workspace_id is null
    or p_category is null
    or p_category not in ('quote.submission', 'quote.handoff', 'admin.auth', 'rate.limit')
    or p_outcome is null
    or p_outcome not in ('failed', 'denied', 'disabled', 'pending')
    or p_reference_type is null
    or p_reference_type not in ('none', 'request_id', 'public_reference')
    or p_route_key is null
    or btrim(p_route_key) = ''
    or char_length(p_route_key) > 160
    or p_route_key !~ '^[A-Za-z0-9_./-]+$'
    or p_route_key ~ 'https?://'
    or (p_reference_type = 'none' and p_reference_value is not null)
    or (
      p_reference_type <> 'none'
      and (
        p_reference_value is null
        or btrim(p_reference_value) = ''
        or char_length(p_reference_value) > 128
        or p_reference_value !~ '^[A-Za-z0-9._:-]+$'
      )
    )
    or (
      p_error_code is not null
      and (
        char_length(p_error_code) not between 1 and 80
        or p_error_code !~ '^[a-z0-9_:-]+$'
      )
    )
    or (p_http_status is not null and (p_http_status < 100 or p_http_status > 599))
    or p_occurred_at_ms is null
    or p_occurred_at_ms <= 0
    or p_occurred_at_ms > 9007199254740991
  then
    raise exception using errcode = '22023', message = 'invalid app operation event';
  end if;

  if not exists (
    select 1
    from public.workspaces workspace
    where workspace.id = p_workspace_id
  ) then
    raise exception using errcode = '42501', message = 'app operation event workspace is not available';
  end if;

  v_occurred_at := pg_catalog.to_timestamp(
    (p_occurred_at_ms / 1000.0)::double precision
  );

  if v_occurred_at > pg_catalog.clock_timestamp() + interval '5 minutes'
    or v_occurred_at < pg_catalog.clock_timestamp() - interval '30 days'
  then
    raise exception using errcode = '22023', message = 'invalid app operation event occurrence';
  end if;

  if p_admission_payload_digest is null
    or p_admission_payload_digest !~ '^[a-f0-9]{64}$'
    or p_admission_signature is null
    or p_admission_signature !~ '^[a-f0-9]{64}$'
    or p_admission_expires_at is null
    or p_admission_expires_at < v_now_epoch
    or p_admission_expires_at > v_now_epoch + 120
  then
    raise exception using errcode = '42501', message = 'app operation event admission proof is invalid';
  end if;

  select cfg.hmac_secret
  into v_secret
  from private.app_operation_event_admission_config cfg
  where cfg.id = true;

  if v_secret is null then
    raise exception using errcode = '55000', message = 'app operation event admission is not configured';
  end if;

  v_actual_digest := private.app_operation_event_payload_digest(
    p_event_id,
    p_workspace_id,
    p_category,
    p_outcome,
    p_reference_type,
    p_reference_value,
    p_error_code,
    p_route_key,
    p_http_status,
    p_occurred_at_ms
  );

  if v_actual_digest is distinct from p_admission_payload_digest then
    raise exception using errcode = '42501', message = 'app operation event admission proof is invalid';
  end if;

  v_message := pg_catalog.concat_ws(
    E'\n',
    'skr.app_operation_event.v1',
    p_workspace_id::text,
    p_event_id::text,
    p_admission_payload_digest,
    p_admission_expires_at::text
  );
  v_expected_signature := pg_catalog.encode(
    extensions.hmac(
      pg_catalog.convert_to(v_message, 'UTF8'),
      pg_catalog.convert_to(v_secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  if v_expected_signature is distinct from p_admission_signature then
    raise exception using errcode = '42501', message = 'app operation event admission proof is invalid';
  end if;

  v_actor_admin_user_id := private.current_quote_admin_user_id(p_workspace_id);

  insert into public.app_operation_events (
    event_id,
    workspace_id,
    category,
    outcome,
    reference_type,
    reference_value,
    error_code,
    route_key,
    http_status,
    actor_admin_user_id,
    occurred_at
  ) values (
    p_event_id,
    p_workspace_id,
    p_category,
    p_outcome,
    p_reference_type,
    p_reference_value,
    p_error_code,
    p_route_key,
    p_http_status,
    v_actor_admin_user_id,
    v_occurred_at
  )
  on conflict (event_id) do nothing;

  return found;
end;
$$;

comment on function public.record_app_operation_event(
  uuid, uuid, text, text, text, text, text, text, integer, bigint, text, bigint, text
) is
  'Validates a short-lived server-issued HMAC admission proof bound to every caller-controlled event field, then appends one idempotent app operation event with a database-derived actor.';

revoke all privileges on function public.record_app_operation_event(
  uuid, uuid, text, text, text, text, text, text, integer, bigint, text, bigint, text
) from public, anon, authenticated, service_role;
grant execute on function public.record_app_operation_event(
  uuid, uuid, text, text, text, text, text, text, integer, bigint, text, bigint, text
) to anon, authenticated;
