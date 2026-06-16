-- Protected admin enquiry triage status update foundation.
-- Extends the internal quote/enquiry status contract with follow_up_needed.

alter table public.quote_requests
  drop constraint if exists quote_requests_status_check;

alter table public.quote_requests
  add constraint quote_requests_status_check
  check (status in ('new', 'reviewing', 'follow_up_needed', 'quoted', 'closed', 'archived'));

alter table public.quote_request_activity
  drop constraint if exists quote_request_activity_status_from_check;

alter table public.quote_request_activity
  add constraint quote_request_activity_status_from_check
  check (status_from is null or status_from in ('new', 'reviewing', 'follow_up_needed', 'quoted', 'closed', 'archived'));

alter table public.quote_request_activity
  drop constraint if exists quote_request_activity_status_to_check;

alter table public.quote_request_activity
  add constraint quote_request_activity_status_to_check
  check (status_to is null or status_to in ('new', 'reviewing', 'follow_up_needed', 'quoted', 'closed', 'archived'));

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
begin
  if p_quote_request_id is null or p_workspace_id is null then
    raise exception 'quote_workflow_target_required';
  end if;

  if p_status not in ('new', 'reviewing', 'follow_up_needed', 'quoted', 'closed') then
    raise exception 'quote_workflow_status_invalid';
  end if;

  if nullif(btrim(coalesce(p_internal_note, '')), '') is not null then
    raise exception 'quote_workflow_internal_note_not_supported';
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

  return p_quote_request_id;
end;
$$;

revoke all on function public.execute_admin_quote_workflow(uuid, uuid, text, text) from public;
grant execute on function public.execute_admin_quote_workflow(uuid, uuid, text, text) to authenticated;
