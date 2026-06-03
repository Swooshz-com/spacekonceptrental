-- Phase 2C-D quote workflow atomicity hardening.
-- Replaces direct admin table writes with one narrow transactional RPC.

create or replace function public.execute_admin_quote_workflow(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_status text,
  p_internal_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_current_status text;
  v_note text;
begin
  if p_quote_request_id is null or p_workspace_id is null then
    raise exception 'quote_workflow_target_required';
  end if;

  if p_status not in ('new', 'reviewing', 'quoted', 'closed', 'archived') then
    raise exception 'quote_workflow_status_invalid';
  end if;

  v_note := nullif(btrim(coalesce(p_internal_note, '')), '');

  if v_note is not null and char_length(v_note) > 1200 then
    raise exception 'quote_workflow_note_too_long';
  end if;

  v_actor_id := public.current_quote_admin_user_id(p_workspace_id);

  if v_actor_id is null then
    raise exception 'quote_workflow_not_authorized';
  end if;

  select qr.status
  into v_current_status
  from public.quote_requests qr
  where qr.id = p_quote_request_id
    and qr.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'quote_workflow_not_found';
  end if;

  update public.quote_requests
  set status = p_status,
    updated_at = now()
  where id = p_quote_request_id
    and workspace_id = p_workspace_id;

  if v_current_status <> p_status then
    insert into public.quote_request_activity (
      workspace_id,
      quote_request_id,
      actor_admin_user_id,
      activity_type,
      status_from,
      status_to,
      note
    )
    values (
      p_workspace_id,
      p_quote_request_id,
      v_actor_id,
      'status_change',
      v_current_status,
      p_status,
      null
    );
  end if;

  if v_note is not null then
    insert into public.quote_request_activity (
      workspace_id,
      quote_request_id,
      actor_admin_user_id,
      activity_type,
      status_from,
      status_to,
      note
    )
    values (
      p_workspace_id,
      p_quote_request_id,
      v_actor_id,
      'internal_note',
      null,
      null,
      v_note
    );
  end if;

  return p_quote_request_id;
end;
$$;

revoke all on function public.execute_admin_quote_workflow(uuid, uuid, text, text) from public;
grant execute on function public.execute_admin_quote_workflow(uuid, uuid, text, text) to authenticated;

revoke update (
  status,
  updated_at
) on public.quote_requests from authenticated;

revoke insert on public.quote_request_activity from authenticated;

alter policy quote_requests_quote_admin_update
  on public.quote_requests
  using (false)
  with check (false);

alter policy quote_request_activity_quote_admin_insert
  on public.quote_request_activity
  with check (false);
