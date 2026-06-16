-- Protected admin HubSpot import CSV handoff manifest kind.
-- Extends metadata-only CRM handoff packet manifests for manual CSV export
-- audits. No CSV body, full packet JSON, customer payload dump, provider IDs,
-- sync attempts, n8n state, email state, or provider response data is stored.

alter table public.quote_crm_handoff_packet_manifests
  drop constraint if exists quote_crm_handoff_packet_manifests_packet_kind_check;

alter table public.quote_crm_handoff_packet_manifests
  add constraint quote_crm_handoff_packet_manifests_packet_kind_check
  check (packet_kind in ('json_review_packet', 'hubspot_import_csv'));

create policy quote_crm_handoff_packet_manifests_quote_admin_csv_insert
  on public.quote_crm_handoff_packet_manifests
  for insert
  to authenticated
  with check (
    public.is_workspace_quote_manager(workspace_id)
    and generated_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)
    and provider = 'hubspot'
    and packet_kind = 'hubspot_import_csv'
    and status_filter = 'queued'
    and source = 'protected_admin'
  );

comment on constraint quote_crm_handoff_packet_manifests_packet_kind_check
  on public.quote_crm_handoff_packet_manifests is
  'Allowed protected admin manual handoff artifact kinds. CSV export manifests remain metadata-only and do not store CSV content.';
