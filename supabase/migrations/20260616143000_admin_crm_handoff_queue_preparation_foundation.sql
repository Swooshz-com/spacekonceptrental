-- Protected admin CRM handoff queue preparation foundation.
-- Updates only local CRM handoff readiness fields for future HubSpot handoff.

create or replace function public.execute_admin_quote_crm_handoff_queue_update(
  p_quote_request_id uuid,
  p_workspace_id uuid,
  p_crm_provider text,
  p_crm_sync_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
begin
  if p_quote_request_id is null or p_workspace_id is null then
    raise exception 'quote_crm_handoff_target_required';
  end if;

  if p_crm_provider <> 'hubspot' then
    raise exception 'quote_crm_handoff_provider_invalid';
  end if;

  if p_crm_sync_status not in ('not_queued', 'queued', 'failed') then
    raise exception 'quote_crm_handoff_status_invalid';
  end if;

  v_actor_id := public.current_quote_admin_user_id(p_workspace_id);

  if v_actor_id is null then
    raise exception 'quote_crm_handoff_not_authorized';
  end if;

  update public.quote_requests
  set crm_provider = p_crm_provider,
    crm_sync_status = p_crm_sync_status,
    crm_sync_error = case
      when p_crm_sync_status = 'queued' then null
      else crm_sync_error
    end,
    updated_at = now()
  where id = p_quote_request_id
    and workspace_id = p_workspace_id;

  if not found then
    raise exception 'quote_crm_handoff_not_found';
  end if;

  return p_quote_request_id;
end;
$$;

revoke all on function public.execute_admin_quote_crm_handoff_queue_update(uuid, uuid, text, text) from public;
grant execute on function public.execute_admin_quote_crm_handoff_queue_update(uuid, uuid, text, text) to authenticated;
