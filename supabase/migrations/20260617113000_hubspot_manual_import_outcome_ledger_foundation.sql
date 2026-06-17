-- Protected admin HubSpot manual import outcome ledger foundation.
-- Stores controlled, metadata-only local audit outcomes after admins review
-- HubSpot import CSV manifests and manually handle import outside SKR.
-- No CSV content, full packet JSON, customer payloads, freeform notes,
-- provider IDs, provider responses, sync attempts, email state,
-- auth/session/header/cookie data, or customer-contact workflow state.

create table if not exists public.quote_crm_handoff_manual_import_outcomes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  manifest_id uuid not null,
  provider text not null default 'hubspot',
  packet_kind text not null default 'hubspot_import_csv',
  outcome_status text not null,
  record_count integer not null,
  request_ids uuid[] not null default '{}'::uuid[],
  recorded_by_admin_user_id uuid not null,
  recorded_at timestamptz not null default now(),
  source text not null default 'protected_admin',
  created_at timestamptz not null default now(),
  constraint quote_crm_handoff_manual_import_outcomes_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_crm_handoff_manual_import_outcomes_manifest_workspace_fkey
    foreign key (manifest_id, workspace_id)
    references public.quote_crm_handoff_packet_manifests (id, workspace_id)
    on delete cascade,
  constraint quote_crm_handoff_manual_import_outcomes_recorded_by_admin_user_id_fkey
    foreign key (recorded_by_admin_user_id)
    references public.admin_users (id)
    on delete restrict,
  constraint quote_crm_handoff_manual_import_outcomes_provider_check
    check (provider = 'hubspot'),
  constraint quote_crm_handoff_manual_import_outcomes_packet_kind_check
    check (packet_kind = 'hubspot_import_csv'),
  constraint quote_crm_handoff_manual_import_outcomes_status_check
    check (
      outcome_status in (
        'manual_import_reviewed',
        'manual_import_completed_outside_skr',
        'manual_import_rejected_needs_correction',
        'manual_import_partial_needs_follow_up'
      )
    ),
  constraint quote_crm_handoff_manual_import_outcomes_record_count_check
    check (record_count between 0 and 100),
  constraint quote_crm_handoff_manual_import_outcomes_request_ids_check
    check (
      cardinality(request_ids) <= 100
      and cardinality(request_ids) = record_count
    ),
  constraint quote_crm_handoff_manual_import_outcomes_source_check
    check (source = 'protected_admin')
);

create index if not exists quote_crm_handoff_manual_import_outcomes_workspace_recorded_idx
  on public.quote_crm_handoff_manual_import_outcomes (workspace_id, recorded_at desc);

create index if not exists quote_crm_handoff_manual_import_outcomes_manifest_idx
  on public.quote_crm_handoff_manual_import_outcomes (manifest_id, recorded_at desc);

comment on table public.quote_crm_handoff_manual_import_outcomes is
  'Protected admin-only local outcome ledger for manual HubSpot import CSV handling. Stores controlled outcome metadata only; no customer details, CSV body, provider IDs, sync timestamps, freeform notes, provider responses, or auth/session/header/cookie data.';

comment on column public.quote_crm_handoff_manual_import_outcomes.outcome_status is
  'Controlled local manual import outcome status only. Freeform operator notes are intentionally not stored.';

comment on column public.quote_crm_handoff_manual_import_outcomes.request_ids is
  'Bounded UUID list copied from the metadata-only HubSpot import CSV manifest. Do not store customer payload details here.';

alter table public.quote_crm_handoff_manual_import_outcomes enable row level security;

revoke all on table public.quote_crm_handoff_manual_import_outcomes from public;
revoke all on table public.quote_crm_handoff_manual_import_outcomes from anon;
revoke update, delete on table public.quote_crm_handoff_manual_import_outcomes from authenticated;
grant select, insert on public.quote_crm_handoff_manual_import_outcomes to authenticated;

create policy quote_crm_handoff_manual_import_outcomes_quote_admin_select
  on public.quote_crm_handoff_manual_import_outcomes
  for select
  to authenticated
  using (public.is_workspace_quote_manager(workspace_id));

create policy quote_crm_handoff_manual_import_outcomes_quote_admin_insert
  on public.quote_crm_handoff_manual_import_outcomes
  for insert
  to authenticated
  with check (
    public.is_workspace_quote_manager(workspace_id)
    and recorded_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)
    and provider = 'hubspot'
    and packet_kind = 'hubspot_import_csv'
    and source = 'protected_admin'
    and exists (
      select 1
      from public.quote_crm_handoff_packet_manifests manifest
      where manifest.id = manifest_id
        and manifest.workspace_id = workspace_id
        and manifest.provider = 'hubspot'
        and manifest.packet_kind = 'hubspot_import_csv'
        and manifest.status_filter = 'queued'
        and manifest.record_count = record_count
        and manifest.request_ids = request_ids
    )
  );
