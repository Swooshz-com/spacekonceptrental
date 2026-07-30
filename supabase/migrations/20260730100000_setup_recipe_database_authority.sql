-- #319 database-authority boundary.
--
-- The recipe header is the only setup identity authority. Constraints enforce
-- shape and workspace ownership; deferred triggers enforce aggregate,
-- non-nesting, and publication invariants at transaction end; the admin RPC
-- is the only reviewed browser-role write path; and the public projection
-- independently fails closed if authority is inconsistent.

create table public.setup_recipes (
  workspace_id uuid not null,
  setup_product_id uuid not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint setup_recipes_pkey
    primary key (workspace_id, setup_product_id),
  constraint setup_recipes_setup_product_workspace_id_fkey
    foreign key (setup_product_id, workspace_id)
    references public.products (id, workspace_id)
    on delete cascade
    on update restrict,
  constraint setup_recipes_revision_check
    check (revision > 0)
);

create table public.setup_recipe_items (
  workspace_id uuid not null,
  setup_product_id uuid not null,
  included_product_id uuid not null,
  position integer not null,
  base_quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint setup_recipe_items_pkey
    primary key (workspace_id, setup_product_id, included_product_id),
  constraint setup_recipe_items_setup_recipe_workspace_id_fkey
    foreign key (workspace_id, setup_product_id)
    references public.setup_recipes (workspace_id, setup_product_id)
    on delete cascade
    on update restrict,
  constraint setup_recipe_items_included_product_workspace_id_fkey
    foreign key (included_product_id, workspace_id)
    references public.products (id, workspace_id)
    on delete restrict
    on update restrict,
  constraint setup_recipe_items_not_self_check
    check (included_product_id <> setup_product_id),
  constraint setup_recipe_items_position_check
    check (position between 0 and 19),
  constraint setup_recipe_items_base_quantity_check
    check (base_quantity between 1 and 99),
  constraint setup_recipe_items_setup_position_key
    unique (workspace_id, setup_product_id, position)
);

create index setup_recipe_items_workspace_included_product_idx
  on public.setup_recipe_items (workspace_id, included_product_id);

comment on table public.setup_recipes is
  'Authoritative unversioned setup declaration. A row exists only for a product that is a setup.';

comment on table public.setup_recipe_items is
  'Authoritative ordered setup composition. Repetition is represented by base_quantity, not duplicate child rows.';

comment on column public.setup_recipes.revision is
  'Optimistic-concurrency revision incremented exactly once by the transactional admin recipe RPC.';

-- A single transaction-level advisory lock serializes recipe and product
-- publication operations. This is intentionally coarse because recipe writes
-- are low-volume administrative operations and a global lock closes the race
-- where two concurrent transactions could create opposite nested references.
create function public.lock_setup_recipe_authority()
returns void
language sql
volatile
set search_path = pg_catalog
as $$
  select pg_catalog.pg_advisory_xact_lock(70418722991319731::bigint);
$$;

-- This assertion is shared by deferred constraint triggers and the admin RPC.
-- Aggregate count/order rules belong here because row constraints cannot see
-- the complete recipe. Publication rules belong here because a published
-- parent must be valid at the transaction boundary, including replacement.
create function public.assert_setup_recipe_valid(
  target_workspace_id uuid,
  target_setup_product_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $$
declare
  parent_status text;
  item_count bigint;
  distinct_children bigint;
  min_position integer;
  max_position integer;
  distinct_positions bigint;
begin
  perform public.lock_setup_recipe_authority();

  if not exists (
    select 1
    from public.setup_recipes r
    where r.workspace_id = target_workspace_id
      and r.setup_product_id = target_setup_product_id
  ) then
    return;
  end if;

  select p.status
  into parent_status
  from public.products p
  where p.workspace_id = target_workspace_id
    and p.id = target_setup_product_id;

  if not found then
    raise exception 'setup_recipe_parent_missing';
  end if;

  select
    count(*)::bigint,
    count(distinct i.included_product_id)::bigint,
    min(i.position),
    max(i.position),
    count(distinct i.position)::bigint
  into
    item_count,
    distinct_children,
    min_position,
    max_position,
    distinct_positions
  from public.setup_recipe_items i
  where i.workspace_id = target_workspace_id
    and i.setup_product_id = target_setup_product_id;

  if item_count < 1 or item_count > 20 then
    raise exception 'setup_recipe_item_count_invalid';
  end if;

  if distinct_children <> item_count then
    raise exception 'setup_recipe_duplicate_child';
  end if;

  if min_position <> 0
    or max_position <> item_count - 1
    or distinct_positions <> item_count then
    raise exception 'setup_recipe_positions_not_contiguous';
  end if;

  if exists (
    select 1
    from public.setup_recipe_items i
    left join public.products child
      on child.id = i.included_product_id
      and child.workspace_id = i.workspace_id
    where i.workspace_id = target_workspace_id
      and i.setup_product_id = target_setup_product_id
      and child.id is null
  ) then
    raise exception 'setup_recipe_child_workspace_mismatch';
  end if;

  if exists (
    select 1
    from public.setup_recipe_items i
    join public.setup_recipes nested
      on nested.workspace_id = i.workspace_id
      and nested.setup_product_id = i.included_product_id
    where i.workspace_id = target_workspace_id
      and i.setup_product_id = target_setup_product_id
  ) then
    raise exception 'setup_recipe_nested_setup';
  end if;

  if parent_status = 'published' and exists (
    select 1
    from public.setup_recipe_items i
    left join public.products child
      on child.id = i.included_product_id
      and child.workspace_id = i.workspace_id
    where i.workspace_id = target_workspace_id
      and i.setup_product_id = target_setup_product_id
      and (child.id is null or child.status <> 'published')
  ) then
    raise exception 'setup_recipe_published_child_invalid';
  end if;
end;
$$;

-- First-time headers may only be created for unpublished parents. The RPC
-- repeats this check so callers receive a bounded error before any mutation;
-- this trigger also protects direct owner-side SQL and future writers.
create function public.setup_recipe_parent_write_guard()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
declare
  parent_status text;
begin
  perform public.lock_setup_recipe_authority();

  if tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and (
      old.workspace_id is distinct from new.workspace_id
      or old.setup_product_id is distinct from new.setup_product_id
    )) then
    select p.status
    into parent_status
    from public.products p
    where p.workspace_id = new.workspace_id
      and p.id = new.setup_product_id;

    if not found then
      raise exception 'setup_recipe_parent_missing';
    end if;

    if parent_status = 'published' then
      raise exception 'setup_recipe_parent_published';
    end if;
  end if;

  if exists (
    select 1
    from public.setup_recipe_items i
    where i.workspace_id = new.workspace_id
      and i.included_product_id = new.setup_product_id
  ) then
    raise exception 'setup_recipe_nested_setup';
  end if;

  return new;
end;
$$;

-- Deferred item validation catches a child that receives a recipe later in the
-- same transaction and therefore closes both directions of non-nesting.
create function public.setup_recipe_item_nesting_guard()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.lock_setup_recipe_authority();

    if exists (
      select 1
      from public.setup_recipes r
      where r.workspace_id = new.workspace_id
        and r.setup_product_id = new.included_product_id
    ) then
      raise exception 'setup_recipe_nested_setup';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- Deferred aggregate validation permits a published recipe replacement to
-- delete its old items and insert its new items within one transaction while
-- still rejecting every incomplete final state at commit.
create function public.setup_recipe_aggregate_guard()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
declare
  parent_status text;
begin
  if tg_op = 'DELETE' and tg_table_name = 'setup_recipes' then
    select p.status
    into parent_status
    from public.products p
    where p.workspace_id = old.workspace_id
      and p.id = old.setup_product_id;

    if found and parent_status = 'published' then
      raise exception 'setup_recipe_published_parent_remove';
    end if;

    return old;
  end if;

  if tg_op in ('DELETE', 'UPDATE') then
    perform public.assert_setup_recipe_valid(old.workspace_id, old.setup_product_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.assert_setup_recipe_valid(new.workspace_id, new.setup_product_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- Published setups are the dependency owner for their included products. A
-- child cannot be unpublished, archived, or deleted until the dependent setup
-- is unpublished; the product trigger is immediate so the required order is
-- explicit even if both changes are attempted in one transaction.
create function public.setup_recipe_product_dependency_guard()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
begin
  perform public.lock_setup_recipe_authority();

  if tg_op = 'DELETE'
    or (tg_op = 'UPDATE'
      and new.status is distinct from old.status
      and new.status <> 'published') then
    if exists (
      select 1
      from public.setup_recipe_items i
      join public.setup_recipes r
        on r.workspace_id = i.workspace_id
        and r.setup_product_id = i.setup_product_id
      join public.products parent
        on parent.workspace_id = r.workspace_id
        and parent.id = r.setup_product_id
      where i.workspace_id = old.workspace_id
        and i.included_product_id = old.id
        and parent.status = 'published'
    ) then
      raise exception 'setup_recipe_published_child_protected';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- Any product status change affecting a recipe parent is checked at commit,
-- so a publication transaction sees the final parent status and final item
-- set rather than an intermediate row state.
create function public.setup_recipe_product_publication_guard()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE' and exists (
    select 1
    from public.setup_recipes r
    where r.workspace_id = new.workspace_id
      and r.setup_product_id = new.id
  ) then
    perform public.assert_setup_recipe_valid(new.workspace_id, new.id);
  end if;

  return new;
end;
$$;

create function public.touch_setup_recipe_updated_at()
returns trigger
language plpgsql
volatile
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger setup_recipes_parent_write_guard
before insert or update on public.setup_recipes
for each row execute function public.setup_recipe_parent_write_guard();

create constraint trigger setup_recipes_aggregate_guard
after insert or update or delete on public.setup_recipes
deferrable initially deferred
for each row execute function public.setup_recipe_aggregate_guard();

create trigger setup_recipes_touch_updated_at
before update on public.setup_recipes
for each row execute function public.touch_setup_recipe_updated_at();

create constraint trigger setup_recipe_items_nesting_guard
after insert or update on public.setup_recipe_items
deferrable initially deferred
for each row execute function public.setup_recipe_item_nesting_guard();

create constraint trigger setup_recipe_items_aggregate_guard
after insert or update or delete on public.setup_recipe_items
deferrable initially deferred
for each row execute function public.setup_recipe_aggregate_guard();

create trigger setup_recipe_items_touch_updated_at
before update on public.setup_recipe_items
for each row execute function public.touch_setup_recipe_updated_at();

create trigger products_setup_recipe_dependency_guard
before update of status or delete on public.products
for each row execute function public.setup_recipe_product_dependency_guard();

create constraint trigger products_setup_recipe_publication_guard
after update of status on public.products
deferrable initially deferred
for each row execute function public.setup_recipe_product_publication_guard();

-- Trigger/helper functions are database-owned implementation details. They
-- receive no client execution grants; only the reviewed admin RPC below is a
-- browser-callable mutation surface.
revoke all privileges on function public.lock_setup_recipe_authority() from public, anon, authenticated, service_role;
revoke all privileges on function public.assert_setup_recipe_valid(uuid, uuid) from public, anon, authenticated, service_role;
revoke all privileges on function public.setup_recipe_parent_write_guard() from public, anon, authenticated, service_role;
revoke all privileges on function public.setup_recipe_item_nesting_guard() from public, anon, authenticated, service_role;
revoke all privileges on function public.setup_recipe_aggregate_guard() from public, anon, authenticated, service_role;
revoke all privileges on function public.setup_recipe_product_dependency_guard() from public, anon, authenticated, service_role;
revoke all privileges on function public.setup_recipe_product_publication_guard() from public, anon, authenticated, service_role;
revoke all privileges on function public.touch_setup_recipe_updated_at() from public, anon, authenticated, service_role;

-- Bounded transactional admin write boundary. Validation occurs before the
-- first mutation; the advisory lock and row lock make revision checks and
-- replacement atomic; deferred triggers re-check the final database state.
create function public.execute_admin_setup_recipe_write(
  p_operation text,
  p_expected_workspace_id uuid,
  p_setup_product_id uuid,
  p_expected_revision bigint,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_admin_user_id uuid;
  parent_status text;
  current_revision bigint;
  new_revision bigint;
  current_item_count integer;
  item_count integer := 0;
  expected_position integer;
  item jsonb;
  included_product_id uuid;
  position integer;
  base_quantity integer;
  child_count bigint;
  has_existing_recipe boolean;
  child_ids uuid[] := '{}'::uuid[];
  positions integer[] := '{}'::integer[];
  quantities integer[] := '{}'::integer[];
begin
  if p_expected_workspace_id is null then
    raise exception 'setup_recipe_workspace_required';
  end if;

  actor_admin_user_id := public.current_product_admin_user_id(p_expected_workspace_id);
  if actor_admin_user_id is null then
    raise exception 'unauthorized_admin_action';
  end if;

  if p_operation is null or p_operation not in ('replace', 'remove') then
    raise exception 'unsupported_setup_recipe_operation';
  end if;

  if p_setup_product_id is null then
    raise exception 'setup_recipe_parent_required';
  end if;

  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'setup_recipe_items_array_required';
  end if;

  perform public.lock_setup_recipe_authority();

  select p.status
  into parent_status
  from public.products p
  where p.workspace_id = p_expected_workspace_id
    and p.id = p_setup_product_id
  for update;

  if not found then
    raise exception 'setup_recipe_parent_missing';
  end if;

  select r.revision
  into current_revision
  from public.setup_recipes r
  where r.workspace_id = p_expected_workspace_id
    and r.setup_product_id = p_setup_product_id
  for update;
  has_existing_recipe := found;

  if p_operation = 'remove' then
    if p_items <> '[]'::jsonb then
      raise exception 'setup_recipe_remove_items_must_be_empty';
    end if;

    if not has_existing_recipe then
      raise exception 'setup_recipe_not_found';
    end if;

    if p_expected_revision is null or p_expected_revision <> current_revision then
      raise exception 'setup_recipe_revision_conflict';
    end if;

    if parent_status = 'published' then
      raise exception 'setup_recipe_published_parent_remove';
    end if;

    select count(*)::integer
    into current_item_count
    from public.setup_recipe_items i
    where i.workspace_id = p_expected_workspace_id
      and i.setup_product_id = p_setup_product_id;

    delete from public.setup_recipes r
    where r.workspace_id = p_expected_workspace_id
      and r.setup_product_id = p_setup_product_id;

    insert into public.audit_logs (
      workspace_id,
      actor_admin_user_id,
      actor_type,
      action,
      target_type,
      target_id,
      metadata
    ) values (
      p_expected_workspace_id,
      actor_admin_user_id,
      'admin',
      'setupRecipe.remove',
      'setup_recipe',
      p_setup_product_id,
      pg_catalog.jsonb_build_object(
        'revision', current_revision,
        'item_count', current_item_count
      )
    );

    return pg_catalog.jsonb_build_object(
      'operation', 'remove',
      'setup_product_id', p_setup_product_id::text,
      'revision', current_revision,
      'item_count', current_item_count
    );
  end if;

  if p_items = '[]'::jsonb then
    raise exception 'setup_recipe_empty_replacement';
  end if;

  for item in
    select value
    from pg_catalog.jsonb_array_elements(p_items)
  loop
    item_count := item_count + 1;

    if item_count > 20 then
      raise exception 'setup_recipe_item_count_invalid';
    end if;

    begin
      if pg_catalog.jsonb_typeof(item) <> 'object'
        or (
          select count(*)
          from pg_catalog.jsonb_object_keys(item)
        ) <> 3
        or pg_catalog.jsonb_typeof(item->'included_product_id') <> 'string'
        or pg_catalog.jsonb_typeof(item->'position') <> 'number'
        or pg_catalog.jsonb_typeof(item->'base_quantity') <> 'number'
        or (item->>'position') !~ '^-?[0-9]+$'
        or (item->>'base_quantity') !~ '^-?[0-9]+$' then
        raise exception 'setup_recipe_invalid_item';
      end if;

      included_product_id := (item->>'included_product_id')::uuid;
      position := (item->>'position')::integer;
      base_quantity := (item->>'base_quantity')::integer;
    exception when others then
      raise exception 'setup_recipe_invalid_item';
    end;

    if included_product_id = p_setup_product_id then
      raise exception 'setup_recipe_self_reference';
    end if;

    if position < 0 or position > 19 then
      raise exception 'setup_recipe_position_invalid';
    end if;

    if base_quantity < 1 or base_quantity > 99 then
      raise exception 'setup_recipe_quantity_invalid';
    end if;

    if included_product_id = any(child_ids) then
      raise exception 'setup_recipe_duplicate_child';
    end if;

    if position = any(positions) then
      raise exception 'setup_recipe_duplicate_position';
    end if;

    child_ids := child_ids || included_product_id;
    positions := positions || position;
    quantities := quantities || base_quantity;
  end loop;

  if item_count < 1 or item_count > 20 then
    raise exception 'setup_recipe_item_count_invalid';
  end if;

  for expected_position in 0..(item_count - 1)
  loop
    if not (expected_position = any(positions)) then
      raise exception 'setup_recipe_positions_not_contiguous';
    end if;
  end loop;

  select count(*)
  into child_count
  from public.products p
  where p.workspace_id = p_expected_workspace_id
    and p.id = any(child_ids);

  if child_count <> item_count then
    raise exception 'setup_recipe_child_workspace_mismatch';
  end if;

  if exists (
    select 1
    from public.setup_recipes r
    where r.workspace_id = p_expected_workspace_id
      and r.setup_product_id = any(child_ids)
  ) then
    raise exception 'setup_recipe_nested_setup';
  end if;

  if exists (
    select 1
    from public.setup_recipe_items i
    where i.workspace_id = p_expected_workspace_id
      and i.included_product_id = p_setup_product_id
  ) then
    raise exception 'setup_recipe_nested_setup';
  end if;

  if parent_status = 'published' and exists (
    select 1
    from public.products p
    where p.workspace_id = p_expected_workspace_id
      and p.id = any(child_ids)
      and p.status <> 'published'
  ) then
    raise exception 'setup_recipe_published_child_invalid';
  end if;

  if has_existing_recipe then
    if p_expected_revision is null or p_expected_revision <> current_revision then
      raise exception 'setup_recipe_revision_conflict';
    end if;

    if current_revision = 9223372036854775807 then
      raise exception 'setup_recipe_revision_exhausted';
    end if;

    new_revision := current_revision + 1;

    update public.setup_recipes
    set revision = new_revision,
        updated_at = pg_catalog.now()
    where workspace_id = p_expected_workspace_id
      and setup_product_id = p_setup_product_id;

    delete from public.setup_recipe_items i
    where i.workspace_id = p_expected_workspace_id
      and i.setup_product_id = p_setup_product_id;
  else
    if p_expected_revision is distinct from 0 then
      raise exception 'setup_recipe_creation_revision_required';
    end if;

    if parent_status = 'published' then
      raise exception 'setup_recipe_parent_published';
    end if;

    new_revision := 1;

    insert into public.setup_recipes (
      workspace_id,
      setup_product_id,
      revision
    ) values (
      p_expected_workspace_id,
      p_setup_product_id,
      new_revision
    );
  end if;

  insert into public.setup_recipe_items (
    workspace_id,
    setup_product_id,
    included_product_id,
    position,
    base_quantity
  )
  select
    p_expected_workspace_id,
    p_setup_product_id,
    child_ids[index_value],
    positions[index_value],
    quantities[index_value]
  from pg_catalog.generate_subscripts(child_ids, 1) as indexes(index_value);

  insert into public.audit_logs (
    workspace_id,
    actor_admin_user_id,
    actor_type,
    action,
    target_type,
    target_id,
    metadata
  ) values (
    p_expected_workspace_id,
    actor_admin_user_id,
    'admin',
    'setupRecipe.replace',
    'setup_recipe',
    p_setup_product_id,
    pg_catalog.jsonb_build_object(
      'revision', new_revision,
      'item_count', item_count
    )
  );

  return pg_catalog.jsonb_build_object(
    'operation', 'replace',
    'setup_product_id', p_setup_product_id::text,
    'revision', new_revision,
    'item_count', item_count
  );
end;
$$;

revoke all privileges on function public.execute_admin_setup_recipe_write(text, uuid, uuid, bigint, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.execute_admin_setup_recipe_write(text, uuid, uuid, bigint, jsonb) to authenticated;

comment on function public.execute_admin_setup_recipe_write(text, uuid, uuid, bigint, jsonb) is
  'Bounded transactional owner/admin product-manager setup recipe replacement/removal boundary. Returns metadata only and records setupRecipe.replace or setupRecipe.remove audit actions.';

-- Recipe metadata is readable only by workspace-scoped owner/admin product
-- managers. Browser roles receive no direct write privilege; all writes use
-- the exact authenticated RPC grant above. Public reads use the catalogue RPC.
alter table public.setup_recipes enable row level security;
alter table public.setup_recipe_items enable row level security;

revoke all privileges on table public.setup_recipes from public, anon, authenticated, service_role;
revoke all privileges on table public.setup_recipe_items from public, anon, authenticated, service_role;

grant select on table public.setup_recipes to authenticated;
grant select on table public.setup_recipe_items to authenticated;

create policy setup_recipes_product_manager_select
  on public.setup_recipes
  for select
  to authenticated
  using (private.is_workspace_product_manager(workspace_id));

create policy setup_recipe_items_product_manager_select
  on public.setup_recipe_items
  for select
  to authenticated
  using (private.is_workspace_product_manager(workspace_id));

-- The existing public catalogue RPC remains the sole public read surface. A
-- valid setup requires a non-empty contiguous recipe, published children, and
-- no nested authority. Any header that fails these predicates omits its parent
-- entirely; rentals are products with no recipe header, never inferred kinds.
create or replace function public.get_public_catalogue(
  expected_workspace_id uuid,
  product_slug text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with active_workspace as (
    select cfg.active_workspace_id as workspace_id
    from public.catalogue_public_workspace_config cfg
    join public.workspaces w on w.id = cfg.active_workspace_id
    where cfg.id = true
      and cfg.is_enabled = true
      and cfg.active_workspace_id = expected_workspace_id
      and w.status = 'active'
  ),
  public_categories as (
    select
      c.id,
      c.slug,
      c.name,
      c.description,
      c.sort_order,
      c.is_published
    from public.categories c
    join active_workspace aw on aw.workspace_id = c.workspace_id
    where c.is_published = true
  ),
  recipe_shapes as (
    select
      r.workspace_id,
      r.setup_product_id,
      count(i.included_product_id)::bigint as item_count,
      count(distinct i.included_product_id)::bigint as distinct_children,
      min(i.position) as min_position,
      max(i.position) as max_position,
      count(distinct i.position)::bigint as distinct_positions,
      count(child.id)::bigint as joined_children,
      count(child.id) filter (where child.status = 'published')::bigint as published_children,
      count(nested.setup_product_id)::bigint as nested_children
    from public.setup_recipes r
    left join public.setup_recipe_items i
      on i.workspace_id = r.workspace_id
      and i.setup_product_id = r.setup_product_id
    left join public.products child
      on child.id = i.included_product_id
      and child.workspace_id = i.workspace_id
    left join public.setup_recipes nested
      on nested.workspace_id = i.workspace_id
      and nested.setup_product_id = i.included_product_id
    group by r.workspace_id, r.setup_product_id
  ),
  valid_setup_recipes as (
    select rs.workspace_id, rs.setup_product_id
    from recipe_shapes rs
    join public.products parent
      on parent.workspace_id = rs.workspace_id
      and parent.id = rs.setup_product_id
    where rs.item_count between 1 and 20
      and rs.distinct_children = rs.item_count
      and rs.min_position = 0
      and rs.max_position = rs.item_count - 1
      and rs.distinct_positions = rs.item_count
      and rs.joined_children = rs.item_count
      and rs.published_children = rs.item_count
      and rs.nested_children = 0
      and parent.status = 'published'
  ),
  public_products as (
    select
      p.id,
      p.workspace_id,
      p.category_id,
      pc.name as category_name,
      p.slug,
      p.name,
      p.short_description,
      p.description,
      p.rental_unit,
      p.status,
      p.sort_order,
      r.setup_product_id as recipe_setup_product_id,
      vsr.setup_product_id as valid_setup_product_id
    from public.products p
    join active_workspace aw on aw.workspace_id = p.workspace_id
    left join public_categories pc on pc.id = p.category_id
    left join public.setup_recipes r
      on r.workspace_id = p.workspace_id
      and r.setup_product_id = p.id
    left join valid_setup_recipes vsr
      on vsr.workspace_id = r.workspace_id
      and vsr.setup_product_id = r.setup_product_id
    where p.status = 'published'
      and (p.category_id is null or pc.id is not null)
      and (r.setup_product_id is null or vsr.setup_product_id is not null)
      and (product_slug is null or p.slug = product_slug)
  )
  select jsonb_build_object(
    'categories',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id::text,
            'slug', c.slug,
            'name', c.name,
            'description', c.description,
            'sort_order', c.sort_order,
            'is_published', c.is_published
          )
          order by c.sort_order, c.name
        )
        from public_categories c
      ),
      '[]'::jsonb
    ),
    'products',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id::text,
            'category_id', p.category_id::text,
            'category_name', p.category_name,
            'slug', p.slug,
            'name', p.name,
            'short_description', p.short_description,
            'description', p.description,
            'rental_unit', p.rental_unit,
            'status', p.status,
            'sort_order', p.sort_order,
            'product_kind', case
              when p.valid_setup_product_id is not null then 'setup'
              else 'rental'
            end,
            'setup_composition', case
              when p.valid_setup_product_id is null then null
              else (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', child.id::text,
                    'slug', child.slug,
                    'name', child.name,
                    'short_description', child.short_description,
                    'rental_unit', child.rental_unit,
                    'product_images',
                    (
                      select coalesce(
                        jsonb_agg(
                          jsonb_build_object(
                            'id', pi.id::text,
                            'storage_bucket', pi.storage_bucket,
                            'storage_path', pi.storage_path,
                            'alt_text', pi.alt_text,
                            'sort_order', pi.sort_order,
                            'is_primary', pi.is_primary
                          )
                          order by pi.sort_order, pi.storage_path
                        ),
                        '[]'::jsonb
                      )
                      from public.product_images pi
                      where pi.workspace_id = child.workspace_id
                        and pi.product_id = child.id
                        and pi.status = 'active'
                    ),
                    'position', item.position,
                    'base_quantity', item.base_quantity
                  )
                  order by item.position
                )
                from public.setup_recipe_items item
                join public.products child
                  on child.workspace_id = item.workspace_id
                  and child.id = item.included_product_id
                  and child.status = 'published'
                where item.workspace_id = p.workspace_id
                  and item.setup_product_id = p.id
              )
            end,
            'product_images',
            (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', pi.id::text,
                    'storage_bucket', pi.storage_bucket,
                    'storage_path', pi.storage_path,
                    'alt_text', pi.alt_text,
                    'sort_order', pi.sort_order,
                    'is_primary', pi.is_primary
                  )
                  order by pi.sort_order, pi.storage_path
                ),
                '[]'::jsonb
              )
              from public.product_images pi
              where pi.workspace_id = p.workspace_id
                and pi.product_id = p.id
                and pi.status = 'active'
            )
          )
          order by p.sort_order, p.name
        )
        from public_products p
      ),
      '[]'::jsonb
    )
  )
  from active_workspace;
$$;

comment on function public.get_public_catalogue(uuid, text) is
  'Public catalogue read surface with additive setup recipe projection. Valid setup authority is emitted atomically; invalid setup parents are omitted.';

revoke all privileges on function public.get_public_catalogue(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.get_public_catalogue(uuid, text) to anon;
