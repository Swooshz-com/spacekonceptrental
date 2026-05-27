-- EXAMPLE ONLY: reviewed operator template for a future approved environment.
-- This file is docs-only. It is not a migration, not seed data, and is not
-- automatically executed by the app.
--
-- Replace the placeholder workspace ID only after the target workspace is
-- reviewed and approved for the public catalogue in that environment.

begin;

-- Placeholder active workspace. Keep this fake UUID in the committed example.
-- Future operators must replace it during an approved database change.
select
  id,
  slug,
  name,
  status
from public.workspaces
where id = '00000000-0000-4000-8000-000000000000'::uuid
  and status = 'active';

-- Set the database-owned active public catalogue workspace config.
insert into public.catalogue_public_workspace_config (
  id,
  active_workspace_id,
  is_enabled
)
values (
  true,
  '00000000-0000-4000-8000-000000000000'::uuid,
  true
)
on conflict (id) do update
set
  active_workspace_id = excluded.active_workspace_id,
  is_enabled = excluded.is_enabled,
  updated_at = now();

-- Verify the trusted public read surface returns only reviewed public rows.
select public.get_public_catalogue(
  '00000000-0000-4000-8000-000000000000'::uuid,
  null
);

-- Review the result before changing this to commit in an approved environment.
rollback;
