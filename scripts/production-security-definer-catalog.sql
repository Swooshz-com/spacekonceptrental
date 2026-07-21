-- Read-only production preflight. The output contains function metadata and
-- effective execution booleans only; it does not read application data.
select coalesce(
  pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'signature', catalog.signature,
      'owner', catalog.owner,
      'return_type', catalog.return_type,
      'language', catalog.language,
      'security_definer', catalog.security_definer,
      'search_path', catalog.search_path,
      'event_trigger_name', catalog.event_trigger_name,
      'event', catalog.event,
      'enabled', catalog.enabled,
      'tags', catalog.tags,
      'public_execute', catalog.public_execute,
      'anon_execute', catalog.anon_execute,
      'authenticated_execute', catalog.authenticated_execute,
      'service_role_execute', catalog.service_role_execute,
      'postgres_execute', catalog.postgres_execute
    )
    order by catalog.signature
  ),
  '[]'::pg_catalog.jsonb
)::text
from (
  select
    pg_catalog.format(
      '%I.%I(%s)',
      namespace.nspname,
      proc.proname,
      pg_catalog.replace(
        pg_catalog.oidvectortypes(proc.proargtypes),
        ', ',
        ','
      )
    ) as signature,
    pg_catalog.pg_get_userbyid(proc.proowner) as owner,
    pg_catalog.pg_get_function_result(proc.oid) as return_type,
    language.lanname as language,
    proc.prosecdef as security_definer,
    pg_catalog.array_to_string(proc.proconfig, ',') as search_path,
    event_trigger.evtname as event_trigger_name,
    event_trigger.evtevent as event,
    event_trigger.evtenabled as enabled,
    coalesce(event_trigger.evttags, array[]::text[]) as tags,
    exists (
      select 1
      from pg_catalog.aclexplode(
        coalesce(proc.proacl, pg_catalog.acldefault('f', proc.proowner))
      ) acl
      where acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    ) as public_execute,
    pg_catalog.has_function_privilege('anon', proc.oid, 'EXECUTE')
      as anon_execute,
    pg_catalog.has_function_privilege('authenticated', proc.oid, 'EXECUTE')
      as authenticated_execute,
    pg_catalog.has_function_privilege('service_role', proc.oid, 'EXECUTE')
      as service_role_execute,
    pg_catalog.has_function_privilege('postgres', proc.oid, 'EXECUTE')
      as postgres_execute
  from pg_catalog.pg_proc proc
  join pg_catalog.pg_namespace namespace
    on namespace.oid = proc.pronamespace
  join pg_catalog.pg_language language
    on language.oid = proc.prolang
  left join pg_catalog.pg_event_trigger event_trigger
    on event_trigger.evtfoid = proc.oid
  where namespace.nspname = 'public'
    and proc.prosecdef
) catalog;
