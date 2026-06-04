-- Phase 2E-H transcript audit/evidence local schema foundation only.
-- These tables are local-only placeholders for future reviewed audit evidence.
-- Browser roles receive no grants or policies, and runtime writers remain blocked.

create or replace function public.is_safe_transcript_metadata(
  p_metadata jsonb,
  p_max_bytes integer
)
returns boolean
language sql
stable
set search_path = public
as $$
  with recursive metadata_walk(key_name, value) as (
    select null::text, p_metadata
    union all
    select child.key_name, child.value
    from metadata_walk
    cross join lateral (
      select object_child.key as key_name, object_child.value
      from jsonb_each(
        case
          when jsonb_typeof(metadata_walk.value) = 'object'
            then metadata_walk.value
          else '{}'::jsonb
        end
      ) as object_child(key, value)
      union all
      select null::text as key_name, array_child.value
      from jsonb_array_elements(
        case
          when jsonb_typeof(metadata_walk.value) = 'array'
            then metadata_walk.value
          else '[]'::jsonb
        end
      ) as array_child(value)
    ) as child
  )
  select coalesce(
    p_metadata is not null
    and p_max_bytes > 0
    and jsonb_typeof(p_metadata) = 'object'
    and octet_length(p_metadata::text) <= p_max_bytes
    and not exists (
      select 1
      from metadata_walk
      where key_name ~* 'full[_-]?transcript|transcript[_-]?content|raw[_-]?provider[_-]?payload|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhook|headers?|raw[_-]?headers?|tokens?|authorization|cookie|credentials?|private[_-]?key|secret|password|api[_-]?key|service[_-]?role|customer[_-]?visible[_-]?internal[_-]?notes'
    ),
    false
  );
$$;

comment on function public.is_safe_transcript_metadata(jsonb, integer) is
  'Shared recursive metadata safety helper. Phase 2E-H tightens audit/evidence forbidden key classes and also hardens transcript persistence metadata checks.';

revoke all on function public.is_safe_transcript_metadata(jsonb, integer) from public;

create table if not exists public.transcript_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid,
  quote_request_id uuid,
  actor_admin_user_id uuid,
  event_type text not null,
  actor_type text not null,
  request_id text,
  approval_reference text,
  reason_code text,
  result_status text not null,
  affected_record_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transcript_audit_events_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete restrict,
  constraint transcript_audit_events_conversation_workspace_id_fkey
    foreign key (conversation_id, workspace_id)
    references public.conversations (id, workspace_id)
    on delete restrict,
  constraint transcript_audit_events_quote_request_workspace_id_fkey
    foreign key (quote_request_id, workspace_id)
    references public.quote_requests (id, workspace_id)
    on delete restrict,
  constraint transcript_audit_events_actor_admin_user_id_fkey
    foreign key (actor_admin_user_id)
    references public.admin_users (id)
    on delete set null,
  constraint transcript_audit_events_id_workspace_id_key
    unique (id, workspace_id),
  constraint transcript_audit_events_event_type_check
    check (
      event_type in (
        'transcript_persistence_attempt',
        'transcript_access_read',
        'transcript_export_request',
        'transcript_deletion_request',
        'retention_expiry_processing',
        'retention_cleanup_failure',
        'admin_override',
        'lifecycle_disable_rollback',
        'operator_approval',
        'evidence_capture'
      )
    ),
  constraint transcript_audit_events_actor_type_check
    check (actor_type in ('system', 'admin', 'operator')),
  constraint transcript_audit_events_result_status_check
    check (
      result_status in (
        'requested',
        'approved',
        'rejected',
        'succeeded',
        'failed',
        'blocked',
        'skipped'
      )
    ),
  constraint transcript_audit_events_request_id_check
    check (
      request_id is null
      or (btrim(request_id) <> '' and char_length(request_id) <= 128)
    ),
  constraint transcript_audit_events_approval_reference_check
    check (
      approval_reference is null
      or (
        btrim(approval_reference) <> ''
        and char_length(approval_reference) <= 128
      )
    ),
  constraint transcript_audit_events_reason_code_check
    check (
      reason_code is null
      or (btrim(reason_code) <> '' and char_length(reason_code) <= 128)
    ),
  constraint transcript_audit_events_affected_record_count_check
    check (affected_record_count is null or affected_record_count >= 0),
  constraint transcript_audit_events_metadata_safe_check
    check (public.is_safe_transcript_metadata(metadata, 4096))
);

create table if not exists public.transcript_evidence_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  audit_event_id uuid,
  evidence_type text not null,
  environment_label text,
  commit_sha text,
  validation_summary text,
  dry_run_summary text,
  rollback_summary text,
  operator_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transcript_evidence_records_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete restrict,
  constraint transcript_evidence_records_audit_event_workspace_id_fkey
    foreign key (audit_event_id, workspace_id)
    references public.transcript_audit_events (id, workspace_id)
    on delete restrict,
  constraint transcript_evidence_records_evidence_type_check
    check (
      evidence_type in (
        'approval_record',
        'dry_run_proof',
        'local_sql_rls_proof',
        'static_guard_proof',
        'rollback_disable_plan',
        'post_action_verification',
        'operator_approval',
        'redaction_review'
      )
    ),
  constraint transcript_evidence_records_environment_label_check
    check (
      environment_label is null
      or (
        btrim(environment_label) <> ''
        and char_length(environment_label) <= 64
        and environment_label !~ '[[:space:]]'
      )
    ),
  constraint transcript_evidence_records_commit_sha_check
    check (
      commit_sha is null
      or commit_sha ~ '^[0-9a-f]{7,64}$'
    ),
  constraint transcript_evidence_records_summary_length_check
    check (
      (validation_summary is null or char_length(validation_summary) <= 2000)
      and (dry_run_summary is null or char_length(dry_run_summary) <= 2000)
      and (rollback_summary is null or char_length(rollback_summary) <= 2000)
      and (operator_notes is null or char_length(operator_notes) <= 2000)
    ),
  constraint transcript_evidence_records_safe_text_check
    check (
      coalesce(validation_summary, '') !~* 'full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role'
      and coalesce(dry_run_summary, '') !~* 'full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role'
      and coalesce(rollback_summary, '') !~* 'full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role'
      and coalesce(operator_notes, '') !~* 'full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role'
    ),
  constraint transcript_evidence_records_metadata_safe_check
    check (public.is_safe_transcript_metadata(metadata, 4096))
);

create index if not exists transcript_audit_events_workspace_created_idx
  on public.transcript_audit_events (workspace_id, created_at desc);

create index if not exists transcript_audit_events_conversation_created_idx
  on public.transcript_audit_events (conversation_id, created_at desc)
  where conversation_id is not null;

create index if not exists transcript_audit_events_quote_request_created_idx
  on public.transcript_audit_events (quote_request_id, created_at desc)
  where quote_request_id is not null;

create index if not exists transcript_audit_events_type_status_created_idx
  on public.transcript_audit_events (
    workspace_id,
    event_type,
    result_status,
    created_at desc
  );

create index if not exists transcript_evidence_records_workspace_created_idx
  on public.transcript_evidence_records (workspace_id, created_at desc);

create index if not exists transcript_evidence_records_audit_event_idx
  on public.transcript_evidence_records (audit_event_id, created_at desc)
  where audit_event_id is not null;

create index if not exists transcript_evidence_records_type_created_idx
  on public.transcript_evidence_records (
    workspace_id,
    evidence_type,
    created_at desc
  );

comment on table public.transcript_audit_events is
  'Local-only Phase 2E-H transcript audit event foundation. Stores workspace-scoped event facts and redacted metadata only; no runtime writer is approved.';

comment on column public.transcript_audit_events.metadata is
  'Minimal redacted metadata only. Do not store transcript text, provider payloads, forwarding headers, credentials, or privileged key material.';

comment on table public.transcript_evidence_records is
  'Local-only Phase 2E-H transcript evidence placeholder foundation. Stores proof references and summaries only; production evidence capture remains blocked.';

comment on column public.transcript_evidence_records.metadata is
  'Minimal redacted proof metadata only. Do not store transcript text, provider payloads, forwarding headers, credentials, or privileged key material.';

alter table public.transcript_audit_events enable row level security;
alter table public.transcript_evidence_records enable row level security;

revoke all on table public.transcript_audit_events from public;
revoke all on table public.transcript_evidence_records from public;
revoke all on table public.transcript_audit_events from anon, authenticated;
revoke all on table public.transcript_evidence_records from anon, authenticated;
