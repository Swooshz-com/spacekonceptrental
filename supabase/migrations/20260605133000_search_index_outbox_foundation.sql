-- Phase 2G-B local search-index outbox foundation only.
-- These tables track future search-index queue/document state locally.
-- No runtime sync worker, browser access policy, or external index executor is added.

create or replace function public.is_safe_search_index_metadata(
  p_metadata jsonb,
  p_max_bytes integer
)
returns boolean
language sql
stable
set search_path = public
as $$
  with recursive metadata_walk(key_name, value) as (
    select null::text, p_metadata
    union all
    select child.key_name, child.value
    from metadata_walk
    cross join lateral (
      select object_child.key as key_name, object_child.value
      from jsonb_each(
        case
          when jsonb_typeof(metadata_walk.value) = 'object'
            then metadata_walk.value
          else '{}'::jsonb
        end
      ) as object_child(key, value)
      union all
      select null::text as key_name, array_child.value
      from jsonb_array_elements(
        case
          when jsonb_typeof(metadata_walk.value) = 'array'
            then metadata_walk.value
          else '[]'::jsonb
        end
      ) as array_child(value)
    ) as child
  )
  select coalesce(
    p_metadata is not null
    and p_max_bytes > 0
    and jsonb_typeof(p_metadata) = 'object'
    and octet_length(p_metadata::text) <= p_max_bytes
    and not exists (
      select 1
      from metadata_walk
      where key_name ~* 'provider[_-]?debug|trace[_-]?dump|full[_-]?transcript|transcript[_-]?content|raw[_-]?provider[_-]?payload|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhooks?|webhook[_-]?headers?|headers?|raw[_-]?headers?|tokens?|authorization|cookie|credentials?|private[_-]?key|secret|password|api[_-]?key|service[_-]?role|customer[_-]?visible[_-]?internal[_-]?notes|internal[_-]?notes|payment|customer[_-]?contact|contact[_-]?email|contact[_-]?phone|email|phone'
    ),
    false
  );
$$;

comment on function public.is_safe_search_index_metadata(jsonb, integer) is
  'Shared recursive Phase 2G-B metadata safety helper for local search-index queue/document tracking.';

revoke all on function public.is_safe_search_index_metadata(jsonb, integer) from public;
revoke all on function public.is_safe_search_index_metadata(jsonb, integer) from anon, authenticated;

create table if not exists public.search_index_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  source_version text,
  visibility text not null,
  operation text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error_code text,
  last_error_message text,
  content_hash text,
  scheduled_at timestamptz not null default now(),
  locked_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint search_index_jobs_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete restrict,
  constraint search_index_jobs_id_workspace_id_key
    unique (id, workspace_id),
  constraint search_index_jobs_source_type_check
    check (
      source_type in (
        'listing',
        'category',
        'policy',
        'faq',
        'document',
        'listing_image_alt_text'
      )
    ),
  constraint search_index_jobs_visibility_check
    check (visibility in ('public_chat', 'admin_only', 'blocked')),
  constraint search_index_jobs_operation_check
    check (operation in ('upsert', 'delete', 'hide', 'rebuild')),
  constraint search_index_jobs_status_check
    check (
      status in (
        'queued',
        'processing',
        'succeeded',
        'failed',
        'skipped',
        'cancelled'
      )
    ),
  constraint search_index_jobs_source_version_check
    check (
      source_version is null
      or (
        btrim(source_version) <> ''
        and char_length(source_version) <= 128
        and source_version !~ '[[:space:]]'
      )
    ),
  constraint search_index_jobs_attempt_count_check
    check (attempt_count >= 0),
  constraint search_index_jobs_error_code_check
    check (
      last_error_code is null
      or (
        btrim(last_error_code) <> ''
        and char_length(last_error_code) <= 128
        and last_error_code !~ '[[:space:]]'
      )
    ),
  constraint search_index_jobs_error_message_check
    check (
      last_error_message is null
      or char_length(last_error_message) <= 2000
    ),
  constraint search_index_jobs_content_hash_check
    check (
      content_hash is null
      or (
        btrim(content_hash) <> ''
        and char_length(content_hash) <= 128
        and content_hash !~ '[[:space:]]'
      )
    ),
  constraint search_index_jobs_metadata_safe_check
    check (public.is_safe_search_index_metadata(metadata, 4096))
);

create table if not exists public.search_index_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  source_version text,
  visibility text not null,
  status text not null,
  title text,
  content_hash text not null,
  chunk_count integer not null default 0,
  last_index_job_id uuid,
  indexed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint search_index_documents_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete restrict,
  constraint search_index_documents_last_index_job_workspace_id_fkey
    foreign key (last_index_job_id, workspace_id)
    references public.search_index_jobs (id, workspace_id)
    on delete restrict,
  constraint search_index_documents_source_visibility_key
    unique (workspace_id, source_type, source_id, visibility),
  constraint search_index_documents_source_type_check
    check (
      source_type in (
        'listing',
        'category',
        'policy',
        'faq',
        'document',
        'listing_image_alt_text'
      )
    ),
  constraint search_index_documents_visibility_check
    check (visibility in ('public_chat', 'admin_only', 'blocked')),
  constraint search_index_documents_status_check
    check (
      status in (
        'queued',
        'processing',
        'succeeded',
        'failed',
        'skipped',
        'cancelled'
      )
    ),
  constraint search_index_documents_source_version_check
    check (
      source_version is null
      or (
        btrim(source_version) <> ''
        and char_length(source_version) <= 128
        and source_version !~ '[[:space:]]'
      )
    ),
  constraint search_index_documents_title_check
    check (
      title is null
      or (btrim(title) <> '' and char_length(title) <= 200)
    ),
  constraint search_index_documents_content_hash_check
    check (
      btrim(content_hash) <> ''
      and char_length(content_hash) <= 128
      and content_hash !~ '[[:space:]]'
    ),
  constraint search_index_documents_chunk_count_check
    check (chunk_count >= 0),
  constraint search_index_documents_metadata_safe_check
    check (public.is_safe_search_index_metadata(metadata, 4096))
);

create unique index if not exists search_index_jobs_active_idempotency_key
  on public.search_index_jobs (
    workspace_id,
    source_type,
    source_id,
    visibility,
    operation,
    content_hash
  )
  where content_hash is not null and status in ('queued', 'processing');

create index if not exists search_index_jobs_queued_idx
  on public.search_index_jobs (scheduled_at, created_at)
  where status = 'queued';

create index if not exists search_index_jobs_source_lookup_idx
  on public.search_index_jobs (
    workspace_id,
    source_type,
    source_id,
    visibility,
    created_at desc
  );

create index if not exists search_index_documents_source_lookup_idx
  on public.search_index_documents (
    workspace_id,
    source_type,
    source_id,
    visibility
  );

create index if not exists search_index_documents_last_job_idx
  on public.search_index_documents (last_index_job_id)
  where last_index_job_id is not null;

comment on table public.search_index_jobs is
  'Local-only Phase 2G-B search-index outbox foundation. Tracks future workspace-scoped sync work only; no runtime worker is approved.';

comment on table public.search_index_documents is
  'Local-only Phase 2G-B search-index document tracking foundation. Supabase/listing data remains canonical; this table is not an external index.';

comment on column public.search_index_jobs.metadata is
  'Minimal redacted metadata only. Do not store secrets, provider payloads, headers, transcript content, internal notes, or customer contact/payment identifiers.';

comment on column public.search_index_documents.metadata is
  'Minimal redacted metadata only. Do not store secrets, provider payloads, headers, transcript content, internal notes, or customer contact/payment identifiers.';

alter table public.search_index_jobs enable row level security;
alter table public.search_index_documents enable row level security;

revoke all on table public.search_index_jobs from public;
revoke all on table public.search_index_documents from public;
revoke all on table public.search_index_jobs from anon, authenticated;
revoke all on table public.search_index_documents from anon, authenticated;
