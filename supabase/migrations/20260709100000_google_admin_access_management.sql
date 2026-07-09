-- Google-only protected admin access management for launch.
-- This migration is reviewed repo-side only. Hosted Supabase application
-- still requires explicit owner approval through the approved migration path.

create or replace function public.normalize_admin_access_email(input_email text)
returns text
language sql
immutable
as $$
  select nullif(lower(btrim(input_email)), '');
$$;

comment on function public.normalize_admin_access_email(text) is
  'Normalizes protected admin access email addresses for exact Google sign-in matching.';

revoke all on function public.normalize_admin_access_email(text) from public;
grant execute on function public.normalize_admin_access_email(text) to authenticated;

create table if not exists public.admin_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  normalized_email text not null,
  role text not null default 'admin',
  status text not null default 'active',
  linked_admin_user_id uuid,
  created_by_admin_access_id uuid,
  updated_by_admin_access_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_access_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint admin_access_linked_admin_user_id_fkey
    foreign key (linked_admin_user_id)
    references public.admin_users (id)
    on delete set null,
  constraint admin_access_created_by_admin_access_id_fkey
    foreign key (created_by_admin_access_id)
    references public.admin_access (id)
    on delete set null,
  constraint admin_access_updated_by_admin_access_id_fkey
    foreign key (updated_by_admin_access_id)
    references public.admin_access (id)
    on delete set null,
  constraint admin_access_role_check
    check (role in ('owner', 'admin')),
  constraint admin_access_status_check
    check (status in ('active', 'disabled', 'removed')),
  constraint admin_access_normalized_email_check
    check (
      normalized_email = public.normalize_admin_access_email(normalized_email)
      and normalized_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  constraint admin_access_workspace_email_key
    unique (workspace_id, normalized_email)
);

create unique index if not exists admin_access_single_owner_per_workspace_idx
  on public.admin_access (workspace_id)
  where role = 'owner';

create index if not exists admin_access_workspace_status_idx
  on public.admin_access (workspace_id, status, role, normalized_email);

comment on table public.admin_access is
  'DB-backed Google admin access records. Owner rows are immutable; no customer accounts or public signup are represented here.';

alter table public.admin_access enable row level security;

revoke all on table public.admin_access from public;
revoke all on table public.admin_access from anon;
revoke all on table public.admin_access from authenticated;
grant select (
  normalized_email,
  role,
  status,
  created_at,
  updated_at
) on public.admin_access to authenticated;

create or replace function public.touch_admin_access_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_admin_access_updated_at() from public;

create trigger admin_access_touch_updated_at
before update on public.admin_access
for each row
execute function public.touch_admin_access_updated_at();

create or replace function public.prevent_admin_access_owner_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'admin_owner_immutable';
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' then
    if new.role <> old.role
      or new.status <> 'active'
      or new.normalized_email <> old.normalized_email
      or new.workspace_id <> old.workspace_id then
      raise exception 'admin_owner_immutable';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.prevent_admin_access_owner_mutation() from public;

create trigger admin_access_prevent_owner_mutation
before update or delete on public.admin_access
for each row
execute function public.prevent_admin_access_owner_mutation();

create or replace function public.current_admin_access_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.normalize_admin_access_email(
    nullif(current_setting('request.jwt.claim.email', true), '')
  );
$$;

revoke all on function public.current_admin_access_email() from public;
grant execute on function public.current_admin_access_email() to authenticated;

create or replace function public.current_admin_access_id(target_workspace_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select aa.id
  from public.admin_access aa
  where aa.workspace_id = target_workspace_id
    and aa.normalized_email = public.current_admin_access_email()
    and aa.status = 'active'
    and aa.role in ('owner', 'admin')
  limit 1;
$$;

revoke all on function public.current_admin_access_id(uuid) from public;
grant execute on function public.current_admin_access_id(uuid) to authenticated;

create or replace function public.is_workspace_admin_access_member(
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
      from public.admin_access aa
      where aa.workspace_id = target_workspace_id
        and aa.normalized_email = public.current_admin_access_email()
        and aa.status = 'active'
        and aa.role in ('owner', 'admin')
    ),
    false
  );
$$;

revoke all on function public.is_workspace_admin_access_member(uuid) from public;
grant execute on function public.is_workspace_admin_access_member(uuid) to authenticated;

create or replace function public.is_workspace_admin_access_owner(
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
      from public.admin_access aa
      where aa.workspace_id = target_workspace_id
        and aa.normalized_email = public.current_admin_access_email()
        and aa.status = 'active'
        and aa.role = 'owner'
    ),
    false
  );
$$;

revoke all on function public.is_workspace_admin_access_owner(uuid) from public;
grant execute on function public.is_workspace_admin_access_owner(uuid) to authenticated;

create policy admin_access_member_select
  on public.admin_access
  for select
  to authenticated
  using (public.is_workspace_admin_access_member(workspace_id));

create or replace function public.list_admin_access_records(
  p_workspace_id uuid
)
returns table (
  normalized_email text,
  role text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language sql
stable
security definer
set search_path = public
as $$
  select
    aa.normalized_email,
    aa.role,
    aa.status,
    aa.created_at,
    aa.updated_at
  from public.admin_access aa
  where aa.workspace_id = p_workspace_id
    and public.is_workspace_admin_access_member(p_workspace_id)
  order by
    case when aa.role = 'owner' then 0 else 1 end,
    case when aa.status = 'active' then 0 else 1 end,
    aa.normalized_email asc
  limit 200;
$$;

comment on function public.list_admin_access_records(uuid) is
  'Owner-safe admin access read helper for the protected dashboard. It filters by private workspace fields internally and returns only email, role, status, and timestamps.';

revoke all on function public.list_admin_access_records(uuid) from public;
grant execute on function public.list_admin_access_records(uuid) to authenticated;

create or replace function public.ensure_admin_access_membership(
  p_workspace_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_access public.admin_access%rowtype;
  v_admin_user_id uuid;
begin
  v_email := public.current_admin_access_email();

  if p_workspace_id is null or v_email is null or (select auth.uid()) is null then
    return null;
  end if;

  select *
  into v_access
  from public.admin_access
  where workspace_id = p_workspace_id
    and normalized_email = v_email
    and status = 'active'
    and role in ('owner', 'admin')
  limit 1;

  if not found then
    return null;
  end if;

  select id
  into v_admin_user_id
  from public.admin_users
  where auth_user_id = (select auth.uid())
  limit 1;

  if v_admin_user_id is null then
    select id
    into v_admin_user_id
    from public.admin_users
    where email = v_email
    limit 1;

    if v_admin_user_id is not null then
      update public.admin_users
      set auth_user_id = (select auth.uid()),
          status = 'active',
          updated_at = now()
      where id = v_admin_user_id
        and email = v_email;
    else
      insert into public.admin_users (
        auth_user_id,
        email,
        status
      )
      values (
        (select auth.uid()),
        v_email,
        'active'
      )
      returning id into v_admin_user_id;
    end if;
  else
    update public.admin_users
    set email = v_email,
        status = 'active',
        updated_at = now()
    where id = v_admin_user_id;
  end if;

  insert into public.memberships (
    workspace_id,
    admin_user_id,
    role,
    status
  )
  values (
    p_workspace_id,
    v_admin_user_id,
    v_access.role,
    'active'
  )
  on conflict (workspace_id, admin_user_id)
  do update set
    role = excluded.role,
    status = 'active',
    updated_at = now();

  update public.admin_access
  set linked_admin_user_id = v_admin_user_id,
      updated_at = now()
  where id = v_access.id;

  return v_admin_user_id;
end;
$$;

comment on function public.ensure_admin_access_membership(uuid) is
  'Links an active Google admin access email to the existing admin profile and membership tables after successful Supabase Auth.';

revoke all on function public.ensure_admin_access_membership(uuid) from public;
grant execute on function public.ensure_admin_access_membership(uuid) to authenticated;

create or replace function public.get_admin_access_membership(
  p_workspace_id uuid,
  p_admin_user_id uuid
)
returns table (
  normalized_email text,
  role text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    aa.normalized_email,
    aa.role,
    aa.status
  from public.admin_access aa
  join public.admin_users au
    on au.id = p_admin_user_id
   and au.id = aa.linked_admin_user_id
   and au.auth_user_id = (select auth.uid())
  where aa.workspace_id = p_workspace_id
  limit 2;
$$;

comment on function public.get_admin_access_membership(uuid, uuid) is
  'Self-scoped admin access membership read helper for the protected admin gate. It uses private linked-admin fields internally and returns only email, role, and status.';

revoke all on function public.get_admin_access_membership(uuid, uuid) from public;
grant execute on function public.get_admin_access_membership(uuid, uuid) to authenticated;

create or replace function public.execute_admin_access_write(
  p_workspace_id uuid,
  p_action text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_access_id uuid;
  v_email text;
  v_target public.admin_access%rowtype;
begin
  v_actor_access_id := public.current_admin_access_id(p_workspace_id);
  v_email := public.normalize_admin_access_email(p_email);

  if v_actor_access_id is null
    or not public.is_workspace_admin_access_owner(p_workspace_id) then
    return jsonb_build_object('ok', false, 'code', 'owner_required');
  end if;

  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'code', 'email_invalid');
  end if;

  select *
  into v_target
  from public.admin_access
  where workspace_id = p_workspace_id
    and normalized_email = v_email
  limit 1;

  if p_action = 'add_admin' then
    if found and v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    insert into public.admin_access (
      workspace_id,
      normalized_email,
      role,
      status,
      created_by_admin_access_id,
      updated_by_admin_access_id
    )
    values (
      p_workspace_id,
      v_email,
      'admin',
      'active',
      v_actor_access_id,
      v_actor_access_id
    )
    on conflict (workspace_id, normalized_email)
    do update set
      role = 'admin',
      status = 'active',
      updated_by_admin_access_id = v_actor_access_id,
      updated_at = now()
    where public.admin_access.role <> 'owner';
  elsif p_action = 'disable_admin' then
    if not found then
      return jsonb_build_object('ok', false, 'code', 'admin_not_found');
    end if;

    if v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    update public.admin_access
    set status = 'disabled',
        updated_by_admin_access_id = v_actor_access_id,
        updated_at = now()
    where id = v_target.id
      and role <> 'owner';
  elsif p_action = 'remove_admin' then
    if not found then
      return jsonb_build_object('ok', false, 'code', 'admin_not_found');
    end if;

    if v_target.role = 'owner' then
      return jsonb_build_object('ok', false, 'code', 'owner_immutable');
    end if;

    update public.admin_access
    set status = 'removed',
        updated_by_admin_access_id = v_actor_access_id,
        updated_at = now()
    where id = v_target.id
      and role <> 'owner';
  else
    return jsonb_build_object('ok', false, 'code', 'action_invalid');
  end if;

  if found and v_target.linked_admin_user_id is not null then
    if p_action = 'add_admin' then
      update public.admin_users
      set status = 'active',
          updated_at = now()
      where id = v_target.linked_admin_user_id;

      update public.memberships
      set role = 'admin',
          status = 'active',
          updated_at = now()
      where workspace_id = p_workspace_id
        and admin_user_id = v_target.linked_admin_user_id;
    else
      update public.admin_users
      set status = 'inactive',
          updated_at = now()
      where id = v_target.linked_admin_user_id;

      update public.memberships
      set status = 'suspended',
          updated_at = now()
      where workspace_id = p_workspace_id
        and admin_user_id = v_target.linked_admin_user_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'role', 'admin',
    'status',
    case
      when p_action = 'disable_admin' then 'disabled'
      when p_action = 'remove_admin' then 'removed'
      else 'active'
    end
  );
end;
$$;

comment on function public.execute_admin_access_write(uuid, text, text) is
  'Owner-only DB-backed admin email access mutation surface. It never sends invites and never exposes provider configuration.';

revoke all on function public.execute_admin_access_write(uuid, text, text) from public;
grant execute on function public.execute_admin_access_write(uuid, text, text) to authenticated;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and (
      public.is_workspace_admin_access_member(target_workspace_id)
      or exists (
        select 1
        from public.memberships m
        join public.admin_users au on au.id = m.admin_user_id
        join public.admin_access aa
          on aa.workspace_id = m.workspace_id
         and aa.linked_admin_user_id = au.id
        where m.workspace_id = target_workspace_id
          and m.status = 'active'
          and au.status = 'active'
          and au.auth_user_id = (select auth.uid())
          and aa.status = 'active'
          and aa.role in ('owner', 'admin')
      )
    ),
    false
  );
$$;

comment on function public.is_workspace_member(uuid) is
  'RLS helper requiring a Google-authenticated user to match an active DB-backed admin access record for the workspace.';

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

create or replace function public.is_workspace_product_manager(
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
      join public.admin_access aa
        on aa.workspace_id = m.workspace_id
       and aa.linked_admin_user_id = au.id
      where m.workspace_id = target_workspace_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and au.status = 'active'
        and au.auth_user_id = (select auth.uid())
        and aa.status = 'active'
        and aa.role in ('owner', 'admin')
    ),
    false
  );
$$;

comment on function public.is_workspace_product_manager(uuid) is
  'RLS helper for active owner/admin product-management writes backed by the launch admin access table.';

revoke all on function public.is_workspace_product_manager(uuid) from public;
grant execute on function public.is_workspace_product_manager(uuid) to authenticated;

create or replace function public.current_product_admin_user_id(
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
  join public.admin_access aa
    on aa.workspace_id = m.workspace_id
   and aa.linked_admin_user_id = au.id
  where m.workspace_id = target_workspace_id
    and m.status = 'active'
    and m.role in ('owner', 'admin')
    and au.status = 'active'
    and au.auth_user_id = (select auth.uid())
    and aa.status = 'active'
    and aa.role in ('owner', 'admin')
  limit 1;
$$;

comment on function public.current_product_admin_user_id(uuid) is
  'Returns the current active owner/admin profile only when backed by active launch admin access.';

revoke all on function public.current_product_admin_user_id(uuid) from public;
grant execute on function public.current_product_admin_user_id(uuid) to authenticated;

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
      join public.admin_access aa
        on aa.workspace_id = m.workspace_id
       and aa.linked_admin_user_id = au.id
      where m.workspace_id = target_workspace_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and au.status = 'active'
        and au.auth_user_id = (select auth.uid())
        and aa.status = 'active'
        and aa.role in ('owner', 'admin')
    ),
    false
  );
$$;

comment on function public.is_workspace_quote_manager(uuid) is
  'RLS helper for active owner/admin enquiry management backed by the launch admin access table.';

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
  join public.admin_access aa
    on aa.workspace_id = m.workspace_id
   and aa.linked_admin_user_id = au.id
  where m.workspace_id = target_workspace_id
    and m.status = 'active'
    and m.role in ('owner', 'admin')
    and au.status = 'active'
    and au.auth_user_id = (select auth.uid())
    and aa.status = 'active'
    and aa.role in ('owner', 'admin')
  limit 1;
$$;

comment on function public.current_quote_admin_user_id(uuid) is
  'Returns the current active owner/admin profile for enquiry audit writes only when backed by active launch admin access.';

revoke all on function public.current_quote_admin_user_id(uuid) from public;
grant execute on function public.current_quote_admin_user_id(uuid) to authenticated;
