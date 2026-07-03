-- Protected homepage hero content foundation.
-- Stores one workspace-scoped owner-managed homepage hero record. This is
-- content/reference metadata only; raw uploads and storage policy changes stay
-- deferred.

create table if not exists public.homepage_hero_content (
  workspace_id uuid primary key,
  eyebrow text not null default '',
  headline text not null,
  body text not null,
  primary_cta_label text not null,
  primary_cta_href text not null,
  secondary_cta_label text not null,
  secondary_cta_href text not null,
  image_url text not null,
  image_alt text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint homepage_hero_content_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint homepage_hero_content_updated_by_fkey
    foreign key (updated_by)
    references public.admin_users (id)
    on delete set null,
  constraint homepage_hero_content_eyebrow_check
    check (char_length(eyebrow) <= 120),
  constraint homepage_hero_content_headline_check
    check (char_length(btrim(headline)) between 1 and 160),
  constraint homepage_hero_content_body_check
    check (char_length(btrim(body)) between 1 and 500),
  constraint homepage_hero_content_primary_cta_label_check
    check (char_length(btrim(primary_cta_label)) between 1 and 80),
  constraint homepage_hero_content_secondary_cta_label_check
    check (char_length(btrim(secondary_cta_label)) between 1 and 80),
  constraint homepage_hero_content_image_alt_check
    check (char_length(btrim(image_alt)) between 1 and 240),
  constraint homepage_hero_content_primary_cta_href_check
    check (
      char_length(primary_cta_href) <= 300
      and (
        (
          primary_cta_href like '/%'
          and primary_cta_href not like '//%'
          and primary_cta_href not like '%..%'
          and position(chr(92) in primary_cta_href) = 0
          and primary_cta_href !~ '[[:space:]]'
        )
        or primary_cta_href ~* '^https://[^[:space:]]+$'
      )
    ),
  constraint homepage_hero_content_secondary_cta_href_check
    check (
      char_length(secondary_cta_href) <= 300
      and (
        (
          secondary_cta_href like '/%'
          and secondary_cta_href not like '//%'
          and secondary_cta_href not like '%..%'
          and position(chr(92) in secondary_cta_href) = 0
          and secondary_cta_href !~ '[[:space:]]'
        )
        or secondary_cta_href ~* '^https://[^[:space:]]+$'
      )
    ),
  constraint homepage_hero_content_image_url_check
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

create index if not exists homepage_hero_content_enabled_workspace_idx
  on public.homepage_hero_content (workspace_id)
  where is_enabled = true;

alter table public.homepage_hero_content enable row level security;

revoke all on table public.homepage_hero_content from public;
revoke all on table public.homepage_hero_content from anon;
revoke all on table public.homepage_hero_content from authenticated;

grant select (
  workspace_id,
  eyebrow,
  headline,
  body,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  image_url,
  image_alt,
  is_enabled,
  updated_at,
  updated_by
) on public.homepage_hero_content to anon, authenticated;

create policy homepage_hero_content_public_enabled_select
  on public.homepage_hero_content
  for select
  to anon, authenticated
  using (is_enabled = true);

create policy homepage_hero_content_admin_select
  on public.homepage_hero_content
  for select
  to authenticated
  using (public.is_workspace_product_manager(workspace_id));

create or replace function public.get_public_homepage_hero(
  expected_workspace_id uuid
)
returns table (
  eyebrow text,
  headline text,
  body text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  image_url text,
  image_alt text,
  is_enabled boolean,
  updated_at timestamptz,
  updated_by uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    h.eyebrow,
    h.headline,
    h.body,
    h.primary_cta_label,
    h.primary_cta_href,
    h.secondary_cta_label,
    h.secondary_cta_href,
    h.image_url,
    h.image_alt,
    h.is_enabled,
    h.updated_at,
    h.updated_by
  from public.homepage_hero_content h
  where h.workspace_id = expected_workspace_id
    and h.is_enabled = true
  order by h.updated_at desc
  limit 1;
$$;

revoke all on function public.get_public_homepage_hero(uuid) from public;
grant execute on function public.get_public_homepage_hero(uuid) to anon, authenticated;

create or replace function public.execute_admin_homepage_hero_write(
  p_workspace_id uuid,
  p_payload jsonb
)
returns table (
  workspace_id uuid,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_updated_at timestamptz := now();
begin
  v_actor_id := public.current_product_admin_user_id(p_workspace_id);

  if v_actor_id is null then
    raise exception 'hero_admin_context_invalid' using errcode = '42501';
  end if;

  insert into public.homepage_hero_content (
    workspace_id,
    eyebrow,
    headline,
    body,
    primary_cta_label,
    primary_cta_href,
    secondary_cta_label,
    secondary_cta_href,
    image_url,
    image_alt,
    is_enabled,
    updated_at,
    updated_by
  )
  values (
    p_workspace_id,
    coalesce(btrim(p_payload->>'eyebrow'), ''),
    btrim(p_payload->>'headline'),
    btrim(p_payload->>'body'),
    btrim(p_payload->>'primary_cta_label'),
    btrim(p_payload->>'primary_cta_href'),
    btrim(p_payload->>'secondary_cta_label'),
    btrim(p_payload->>'secondary_cta_href'),
    btrim(p_payload->>'image_url'),
    btrim(p_payload->>'image_alt'),
    coalesce((p_payload->>'is_enabled')::boolean, false),
    v_updated_at,
    v_actor_id
  )
  on conflict on constraint homepage_hero_content_pkey do update
    set eyebrow = excluded.eyebrow,
        headline = excluded.headline,
        body = excluded.body,
        primary_cta_label = excluded.primary_cta_label,
        primary_cta_href = excluded.primary_cta_href,
        secondary_cta_label = excluded.secondary_cta_label,
        secondary_cta_href = excluded.secondary_cta_href,
        image_url = excluded.image_url,
        image_alt = excluded.image_alt,
        is_enabled = excluded.is_enabled,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
  returning homepage_hero_content.workspace_id,
            homepage_hero_content.updated_at
    into workspace_id,
         updated_at;

  return next;
end;
$$;

revoke all on function public.execute_admin_homepage_hero_write(uuid, jsonb) from public;
grant execute on function public.execute_admin_homepage_hero_write(uuid, jsonb) to authenticated;

comment on table public.homepage_hero_content is
  'Workspace-scoped owner-managed homepage hero content and media reference. Stores no file uploads, secrets, provider responses, or private runtime data.';

comment on function public.get_public_homepage_hero(uuid) is
  'Public read surface for enabled homepage hero content in the trusted workspace.';

comment on function public.execute_admin_homepage_hero_write(uuid, jsonb) is
  'Protected owner/admin homepage hero upsert boundary. Validates the authenticated workspace admin before writing.';
