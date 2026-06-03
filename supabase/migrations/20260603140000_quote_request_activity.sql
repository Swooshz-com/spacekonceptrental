-- Phase 2C-C admin quote operations activity.
-- Adds internal-only quote workflow activity for owner/admin follow-up notes
-- and status changes. No public quote tracking or customer-visible notes.

create table if not exists public.quote_request_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  quote_request_id uuid not null,
  actor_admin_user_id uuid not null,
  activity_type text not null,
  status_from text,
  status_to text,
  note text,
  created_at timestamptz not null default now(),
  constraint quote_request_activity_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_request_activity_quote_request_workspace_id_fkey
    foreign key (quote_request_id, workspace_id)
    references public.quote_requests (id, workspace_id)
    on delete cascade,
  constraint quote_request_activity_actor_admin_user_id_fkey
    foreign key (actor_admin_user_id)
    references public.admin_users (id)
    on delete restrict,
  constraint quote_request_activity_type_check
    check (activity_type in ('status_change', 'internal_note')),
  constraint quote_request_activity_status_from_check
    check (status_from is null or status_from in ('new', 'reviewing', 'quoted', 'closed', 'archived')),
  constraint quote_request_activity_status_to_check
    check (status_to is null or status_to in ('new', 'reviewing', 'quoted', 'closed', 'archived')),
  constraint quote_request_activity_note_length_check
    check (note is null or char_length(note) <= 1200),
  constraint quote_request_activity_shape_check
    check (
      (
        activity_type = 'status_change'
        and status_from is not null
        and status_to is not null
        and note is null
      )
      or (
        activity_type = 'internal_note'
        and status_from is null
        and status_to is null
        and note is not null
        and btrim(note) <> ''
      )
    )
);

create index if not exists quote_request_activity_workspace_quote_created_idx
  on public.quote_request_activity (workspace_id, quote_request_id, created_at desc);

alter table public.quote_request_activity enable row level security;

create or replace function public.is_workspace_quote_manager(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and exists (
      select 1
      from public.memberships m
      join public.admin_users au on au.id = m.admin_user_id
      where m.workspace_id = target_workspace_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and au.status = 'active'
        and au.auth_user_id = (select auth.uid())
    ),
    false
  );
$$;

comment on function public.is_workspace_quote_manager(uuid) is
  'RLS helper for owner/admin quote workflow writes in the current authenticated workspace.';

revoke all on function public.is_workspace_quote_manager(uuid) from public;
grant execute on function public.is_workspace_quote_manager(uuid) to authenticated;

create or replace function public.current_quote_admin_user_id(
  target_workspace_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.id
  from public.memberships m
  join public.admin_users au on au.id = m.admin_user_id
  where m.workspace_id = target_workspace_id
    and m.status = 'active'
    and m.role in ('owner', 'admin')
    and au.status = 'active'
    and au.auth_user_id = (select auth.uid())
  limit 1;
$$;

comment on function public.current_quote_admin_user_id(uuid) is
  'Returns the active owner/admin user id for quote workflow writes in the current authenticated workspace.';

revoke all on function public.current_quote_admin_user_id(uuid) from public;
grant execute on function public.current_quote_admin_user_id(uuid) to authenticated;

grant update (
  status,
  updated_at
) on public.quote_requests to authenticated;

create policy quote_requests_quote_admin_update
  on public.quote_requests
  for update
  to authenticated
  using (public.is_workspace_quote_manager(workspace_id))
  with check (public.is_workspace_quote_manager(workspace_id));

grant select, insert on public.quote_request_activity to authenticated;

create policy quote_request_activity_quote_admin_select
  on public.quote_request_activity
  for select
  to authenticated
  using (public.is_workspace_quote_manager(workspace_id));

create policy quote_request_activity_quote_admin_insert
  on public.quote_request_activity
  for insert
  to authenticated
  with check (
    public.is_workspace_quote_manager(workspace_id)
    and actor_admin_user_id = public.current_quote_admin_user_id(workspace_id)
    and exists (
      select 1
      from public.quote_requests qr
      where qr.id = quote_request_activity.quote_request_id
        and qr.workspace_id = quote_request_activity.workspace_id
    )
  );
