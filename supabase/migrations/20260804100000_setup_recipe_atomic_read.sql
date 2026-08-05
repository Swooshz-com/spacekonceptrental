-- #319 additive atomic setup-recipe read authority.
--
-- The prior admin read path executed two separate PostgREST requests (header
-- then items), each taking its own statement snapshot under READ COMMITTED, so
-- a concurrent replace/remove could commit between them and return a revision
-- from one state with items from another. This additive function reads the
-- header and the complete ordered item set in ONE statement (a single
-- SELECT ... INTO with a scalar subquery), so both come from one snapshot.
--
-- The function is SECURITY INVOKER: RLS on setup_recipes and setup_recipe_items
-- still applies under the calling authenticated product-manager session, so
-- workspace isolation is preserved. Explicit not-found is raised only for the
-- reviewed no-recipe result; other database, permission, schema, timeout or
-- malformed-result failures surface as provider errors.

create function public.read_admin_setup_recipe(
  p_expected_workspace_id uuid,
  p_setup_product_id uuid
)
returns jsonb
language plpgsql
stable
set search_path = pg_catalog
as $$
declare
  recipe_revision bigint;
  recipe_items jsonb;
begin
  if p_expected_workspace_id is null then
    raise exception 'setup_recipe_workspace_required';
  end if;

  if p_setup_product_id is null then
    raise exception 'setup_recipe_parent_required';
  end if;

  select
    r.revision,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'workspace_id', i.workspace_id::text,
          'setup_product_id', i.setup_product_id::text,
          'included_product_id', i.included_product_id::text,
          'position', i.position,
          'base_quantity', i.base_quantity
        )
        order by i.position
      )
      from public.setup_recipe_items i
      where i.workspace_id = r.workspace_id
        and i.setup_product_id = r.setup_product_id
    ), '[]'::jsonb) as items
  into recipe_revision, recipe_items
  from public.setup_recipes r
  where r.workspace_id = p_expected_workspace_id
    and r.setup_product_id = p_setup_product_id;

  if not found then
    raise exception 'setup_recipe_not_found';
  end if;

  if pg_catalog.jsonb_array_length(recipe_items) < 1 then
    raise exception 'setup_recipe_read_failed';
  end if;

  return jsonb_build_object(
    'revision', recipe_revision,
    'items', recipe_items
  );
end;
$$;

revoke all privileges on function public.read_admin_setup_recipe(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_admin_setup_recipe(uuid, uuid) to authenticated;

comment on function public.read_admin_setup_recipe(uuid, uuid) is
  'Single-statement authenticated product-manager read returning the current revision and complete ordered item set from one snapshot.';
