-- Phase 1F-C-A RLS policy SQL only.
-- Behavioural tenant-isolation tests and app runtime wiring are deferred.
-- Privileged database credentials must never reach browser code.

create or replace function public.is_workspace_member(target_workspace_id uuid)
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
        and au.status = 'active'
        and au.auth_user_id = auth.uid()
    ),
    false
  );
$$;

comment on function public.is_workspace_member(uuid) is
  'RLS helper for active workspace membership checks. Uses the current Supabase Auth user and stores no secrets.';

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.admin_users enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_request_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.integration_connections enable row level security;

create policy admin_users_self_read
  on public.admin_users
  for select
  to authenticated
  using (auth_user_id = auth.uid() and status = 'active');

create policy workspaces_member_read
  on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

create policy memberships_member_read
  on public.memberships
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy categories_public_read_published
  on public.categories
  for select
  to anon, authenticated
  using (is_published = true);

create policy categories_member_read
  on public.categories
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy products_public_read_published
  on public.products
  for select
  to anon, authenticated
  using (status = 'published');

create policy products_member_read
  on public.products
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy product_images_public_read_published_products
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.workspace_id = product_images.workspace_id
        and p.status = 'published'
    )
  );

create policy product_images_member_read
  on public.product_images
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy quote_requests_member_read
  on public.quote_requests
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy quote_request_items_member_read
  on public.quote_request_items
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy conversations_member_read
  on public.conversations
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy messages_member_read
  on public.messages
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy integration_connections_member_read
  on public.integration_connections
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));
