-- Phase 2E-I server-only transcript audit/evidence insert boundary only.
-- These local/test-only functions are ungranted to browser roles and are
-- intended for future separately approved injected server-side executors.
-- They are not wired into /api/chat or any runtime route.

create or replace function public.insert_transcript_audit_event(
  p_workspace_id uuid,
  p_event jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_event_workspace_id uuid;
  v_conversation_id uuid;
  v_quote_request_id uuid;
  v_actor_admin_user_id uuid;
  v_metadata jsonb;
begin
  if p_workspace_id is null then
    raise exception 'transcript_audit_workspace_required';
  end if;

  if p_event is null or jsonb_typeof(p_event) <> 'object' then
    raise exception 'transcript_audit_event_invalid';
  end if;

  v_event_id := coalesce(nullif(p_event->>'id', '')::uuid, gen_random_uuid());
  v_event_workspace_id := nullif(p_event->>'workspace_id', '')::uuid;

  if v_event_workspace_id is distinct from p_workspace_id then
    raise exception 'transcript_audit_workspace_mismatch';
  end if;

  if nullif(p_event->>'conversation_id', '') is not null then
    v_conversation_id := nullif(p_event->>'conversation_id', '')::uuid;

    if not exists (
      select 1
      from public.conversations
      where id = v_conversation_id
        and workspace_id = p_workspace_id
    ) then
      raise exception 'transcript_audit_conversation_workspace_mismatch';
    end if;
  end if;

  if nullif(p_event->>'quote_request_id', '') is not null then
    v_quote_request_id := nullif(p_event->>'quote_request_id', '')::uuid;

    if not exists (
      select 1
      from public.quote_requests
      where id = v_quote_request_id
        and workspace_id = p_workspace_id
    ) then
      raise exception 'transcript_audit_quote_request_workspace_mismatch';
    end if;
  end if;

  if nullif(p_event->>'actor_admin_user_id', '') is not null then
    v_actor_admin_user_id := nullif(p_event->>'actor_admin_user_id', '')::uuid;

    if not exists (
      select 1
      from public.admin_users au
      inner join public.memberships m on m.admin_user_id = au.id
      where au.id = v_actor_admin_user_id
        and m.workspace_id = p_workspace_id
        and m.status = 'active'
    ) then
      raise exception 'transcript_audit_actor_workspace_mismatch';
    end if;
  end if;

  v_metadata := coalesce(p_event->'metadata', '{}'::jsonb);

  if not public.is_safe_transcript_metadata(v_metadata, 4096) then
    raise exception 'transcript_audit_metadata_unsafe';
  end if;

  insert into public.transcript_audit_events (
    id,
    workspace_id,
    conversation_id,
    quote_request_id,
    actor_admin_user_id,
    event_type,
    actor_type,
    request_id,
    approval_reference,
    reason_code,
    result_status,
    affected_record_count,
    metadata
  )
  values (
    v_event_id,
    p_workspace_id,
    v_conversation_id,
    v_quote_request_id,
    v_actor_admin_user_id,
    nullif(p_event->>'event_type', ''),
    nullif(p_event->>'actor_type', ''),
    nullif(p_event->>'request_id', ''),
    nullif(p_event->>'approval_reference', ''),
    nullif(p_event->>'reason_code', ''),
    nullif(p_event->>'result_status', ''),
    case
      when nullif(p_event->>'affected_record_count', '') is null
        then null
      else (p_event->>'affected_record_count')::integer
    end,
    v_metadata
  )
  returning id into v_event_id;

  return jsonb_build_object('auditEventId', v_event_id::text);
end;
$$;

create or replace function public.insert_transcript_evidence_record(
  p_workspace_id uuid,
  p_evidence jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evidence_record_id uuid;
  v_evidence_workspace_id uuid;
  v_audit_event_id uuid;
  v_metadata jsonb;
  v_unsafe_evidence_text_pattern text :=
    'full[_ -]?transcript|transcript[_ -]?content|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role|customer[_ -]?visible[_ -]?internal[_ -]?notes';
begin
  if p_workspace_id is null then
    raise exception 'transcript_evidence_workspace_required';
  end if;

  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' then
    raise exception 'transcript_evidence_record_invalid';
  end if;

  v_evidence_record_id :=
    coalesce(nullif(p_evidence->>'id', '')::uuid, gen_random_uuid());
  v_evidence_workspace_id := nullif(p_evidence->>'workspace_id', '')::uuid;

  if v_evidence_workspace_id is distinct from p_workspace_id then
    raise exception 'transcript_evidence_workspace_mismatch';
  end if;

  if nullif(p_evidence->>'audit_event_id', '') is not null then
    v_audit_event_id := nullif(p_evidence->>'audit_event_id', '')::uuid;

    if not exists (
      select 1
      from public.transcript_audit_events
      where id = v_audit_event_id
        and workspace_id = p_workspace_id
    ) then
      raise exception 'transcript_evidence_audit_event_workspace_mismatch';
    end if;
  end if;

  v_metadata := coalesce(p_evidence->'metadata', '{}'::jsonb);

  if not public.is_safe_transcript_metadata(v_metadata, 4096) then
    raise exception 'transcript_evidence_metadata_unsafe';
  end if;

  if coalesce(p_evidence->>'validation_summary', '') ~* v_unsafe_evidence_text_pattern
    or coalesce(p_evidence->>'dry_run_summary', '') ~* v_unsafe_evidence_text_pattern
    or coalesce(p_evidence->>'rollback_summary', '') ~* v_unsafe_evidence_text_pattern
    or coalesce(p_evidence->>'operator_notes', '') ~* v_unsafe_evidence_text_pattern then
    raise exception 'transcript_evidence_text_unsafe';
  end if;

  insert into public.transcript_evidence_records (
    id,
    workspace_id,
    audit_event_id,
    evidence_type,
    environment_label,
    commit_sha,
    validation_summary,
    dry_run_summary,
    rollback_summary,
    operator_notes,
    metadata
  )
  values (
    v_evidence_record_id,
    p_workspace_id,
    v_audit_event_id,
    nullif(p_evidence->>'evidence_type', ''),
    nullif(p_evidence->>'environment_label', ''),
    nullif(p_evidence->>'commit_sha', ''),
    nullif(p_evidence->>'validation_summary', ''),
    nullif(p_evidence->>'dry_run_summary', ''),
    nullif(p_evidence->>'rollback_summary', ''),
    nullif(p_evidence->>'operator_notes', ''),
    v_metadata
  )
  returning id into v_evidence_record_id;

  return jsonb_build_object('evidenceRecordId', v_evidence_record_id::text);
end;
$$;

comment on function public.insert_transcript_audit_event(uuid, jsonb) is
  'Server-only Phase 2E-I local/test-only RPC boundary for validated transcript audit event inserts. Browser roles are not granted execute.';

comment on function public.insert_transcript_evidence_record(uuid, jsonb) is
  'Server-only Phase 2E-I local/test-only RPC boundary for validated transcript evidence placeholder inserts. Browser roles are not granted execute.';

revoke all on function public.insert_transcript_audit_event(uuid, jsonb) from public;
revoke all on function public.insert_transcript_audit_event(uuid, jsonb) from anon, authenticated;
revoke all on function public.insert_transcript_evidence_record(uuid, jsonb) from public;
revoke all on function public.insert_transcript_evidence_record(uuid, jsonb) from anon, authenticated;
