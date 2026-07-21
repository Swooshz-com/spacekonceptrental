-- Restrict direct API/client execution of Supabase's optional public
-- auto-RLS event-trigger helper without changing its definition or binding.
-- Environments where the platform-managed helper is absent safely no-op.

do $migration$
begin
  if pg_catalog.to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';
  end if;
end
$migration$;
