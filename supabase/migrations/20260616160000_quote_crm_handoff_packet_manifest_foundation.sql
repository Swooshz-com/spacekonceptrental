-- Protected admin CRM handoff packet audit/manifest foundation.
-- Stores metadata-only packet generation/export manifests for manual admin
-- review. No full packet payloads, provider IDs, sync attempts, provider calls,
-- n8n workflow state, email state, or customer-contact workflow state.

create table if not exists public.quote_crm_handoff_packet_manifests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  provider text not null default 'hubspot',
  packet_kind text not null default 'json_review_packet',
  status_filter text not null default 'queued',
  limit_requested integer not null,
  record_count integer not null,
  request_ids uuid[] not null default '{}'::uuid[],
  generated_by_admin_user_id uuid,
  generated_at timestamptz not null default now(),
  source text not null default 'protected_admin',
  created_at timestamptz not null default now(),
  constraint quote_crm_handoff_packet_manifests_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_crm_handoff_packet_manifests_generated_by_admin_user_id_fkey
    foreign key (generated_by_admin_user_id)
    references public.admin_users (id)
    on delete set null,
  constraint quote_crm_handoff_packet_manifests_id_workspace_id_key
    unique (id, workspace_id),
  constraint quote_crm_handoff_packet_manifests_provider_check
    check (provider = 'hubspot'),
  constraint quote_crm_handoff_packet_manifests_packet_kind_check
    check (packet_kind = 'json_review_packet'),
  constraint quote_crm_handoff_packet_manifests_status_filter_check
    check (status_filter = 'queued'),
  constraint quote_crm_handoff_packet_manifests_limit_requested_check
    check (limit_requested between 1 and 100),
  constraint quote_crm_handoff_packet_manifests_record_count_check
    check (record_count between 0 and 100),
  constraint quote_crm_handoff_packet_manifests_request_ids_check
    check (
      cardinality(request_ids) <= 100
      and cardinality(request_ids) = record_count
    ),
  constraint quote_crm_handoff_packet_manifests_source_check
    check (source = 'protected_admin')
);

create index if not exists quote_crm_handoff_packet_manifests_workspace_generated_idx
  on public.quote_crm_handoff_packet_manifests (workspace_id, generated_at desc);

create index if not exists quote_crm_handoff_packet_manifests_workspace_provider_status_idx
  on public.quote_crm_handoff_packet_manifests (
    workspace_id,
    provider,
    status_filter,
    generated_at desc
  );

comment on table public.quote_crm_handoff_packet_manifests is
  'Protected admin-only CRM handoff packet manifest metadata. Stores bounded packet generation/export facts only; no customer message payload dumps, provider credentials, HubSpot contact/deal IDs, n8n state, email state, or sync attempt timestamps.';

comment on column public.quote_crm_handoff_packet_manifests.request_ids is
  'Bounded quote_request UUID list included in the generated manual review packet. Do not store full packet JSON or customer message payloads here.';

comment on column public.quote_crm_handoff_packet_manifests.generated_by_admin_user_id is
  'Admin user that prepared the protected packet manifest through the server-side admin route.';

alter table public.quote_crm_handoff_packet_manifests enable row level security;

revoke all on table public.quote_crm_handoff_packet_manifests from public;
revoke all on table public.quote_crm_handoff_packet_manifests from anon;
revoke update, delete on table public.quote_crm_handoff_packet_manifests from authenticated;
grant select, insert on public.quote_crm_handoff_packet_manifests to authenticated;

create policy quote_crm_handoff_packet_manifests_quote_admin_select
  on public.quote_crm_handoff_packet_manifests
  for select
  to authenticated
  using (public.is_workspace_quote_manager(workspace_id));

create policy quote_crm_handoff_packet_manifests_quote_admin_insert
  on public.quote_crm_handoff_packet_manifests
  for insert
  to authenticated
  with check (
    public.is_workspace_quote_manager(workspace_id)
    and generated_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)
    and provider = 'hubspot'
    and packet_kind = 'json_review_packet'
    and status_filter = 'queued'
    and source = 'protected_admin'
  );
