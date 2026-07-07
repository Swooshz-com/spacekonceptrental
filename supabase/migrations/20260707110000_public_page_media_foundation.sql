-- Protected public page media foundation.
-- Stores workspace-scoped owner-managed image references for named public
-- page slots. This is content/reference metadata only; raw uploads and
-- storage policy changes stay deferred.

create table if not exists public.public_page_media (
  workspace_id uuid not null,
  slot text not null,
  image_url text not null,
  image_alt text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint public_page_media_pkey
    primary key (workspace_id, slot),
  constraint public_page_media_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint public_page_media_updated_by_fkey
    foreign key (updated_by)
    references public.admin_users (id)
    on delete set null,
  constraint public_page_media_slot_check
    check (slot in ('about.story')),
  constraint public_page_media_image_alt_check
    check (char_length(btrim(image_alt)) between 1 and 240),
  constraint public_page_media_image_url_check
    check (
      char_length(image_url) <= 1000
      and (
        (
          image_url like '/%'
          and image_url not like '//%'
          and image_url not like '%..%'
          and position(chr(92) in image_url) = 0
          and image_url !~ '[[:space:]]'
        )
        or image_url ~* '^https://[^[:space:]]+$'
      )
    )
);

create index if not exists public_page_media_enabled_workspace_slot_idx
  on public.public_page_media (workspace_id, slot)
  where is_enabled = true;

alter table public.public_page_media enable row level security;

revoke all on table public.public_page_media from public;
revoke all on table public.public_page_media from anon;
revoke all on table public.public_page_media from authenticated;

grant select (
  workspace_id,
  slot,
  image_url,
  image_alt,
  is_enabled,
  updated_at,
  updated_by
) on public.public_page_media to authenticated;

create policy public_page_media_admin_select
  on public.public_page_media
  for select
  to authenticated
  using (public.is_workspace_product_manager(workspace_id));

create or replace function public.get_public_page_media(
  expected_workspace_id uuid,
  media_slot text
)
returns table (
  slot text,
  image_url text,
  image_alt text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.slot,
    m.image_url,
    m.image_alt
  from public.public_page_media m
  where m.workspace_id = expected_workspace_id
    and m.slot = btrim(media_slot)
    and m.slot in ('about.story')
    and m.is_enabled = true
  order by m.updated_at desc
  limit 1;
$$;

revoke all on function public.get_public_page_media(uuid, text) from public;
grant execute on function public.get_public_page_media(uuid, text) to anon, authenticated;

create or replace function public.execute_admin_public_page_media_write(
  p_workspace_id uuid,
  p_slot text,
  p_payload jsonb
)
returns table (
  workspace_id uuid,
  slot text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_slot text := btrim(p_slot);
  v_updated_at timestamptz := now();
begin
  if v_slot not in ('about.story') then
    raise exception 'public_page_media_slot_invalid' using errcode = '22023';
  end if;

  v_actor_id := public.current_product_admin_user_id(p_workspace_id);

  if v_actor_id is null then
    raise exception 'public_page_media_admin_context_invalid' using errcode = '42501';
  end if;

  insert into public.public_page_media (
    workspace_id,
    slot,
    image_url,
    image_alt,
    is_enabled,
    updated_at,
    updated_by
  )
  values (
    p_workspace_id,
    v_slot,
    btrim(p_payload->>'image_url'),
    btrim(p_payload->>'image_alt'),
    coalesce((p_payload->>'is_enabled')::boolean, false),
    v_updated_at,
    v_actor_id
  )
  on conflict on constraint public_page_media_pkey do update
    set image_url = excluded.image_url,
        image_alt = excluded.image_alt,
        is_enabled = excluded.is_enabled,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
  returning public_page_media.workspace_id,
            public_page_media.slot,
            public_page_media.updated_at
    into workspace_id,
         slot,
         updated_at;

  return next;
end;
$$;

revoke all on function public.execute_admin_public_page_media_write(uuid, text, jsonb) from public;
grant execute on function public.execute_admin_public_page_media_write(uuid, text, jsonb) to authenticated;

comment on table public.public_page_media is
  'Workspace-scoped owner-managed public page media references. Stores no file uploads, secrets, provider responses, or private runtime data.';

comment on function public.get_public_page_media(uuid, text) is
  'Public read surface for enabled public page media in the trusted workspace and requested slot.';

comment on function public.execute_admin_public_page_media_write(uuid, text, jsonb) is
  'Protected owner/admin public page media upsert boundary. Validates the authenticated workspace admin before writing.';
