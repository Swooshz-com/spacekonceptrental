-- Transcript metadata diagnostic denylist hotfix.
-- Restores provider debug and trace dump key rejection dropped by the Phase 2E-H
-- shared helper rewrite while preserving recursive traversal and current
-- audit/evidence hardening.

create or replace function public.is_safe_transcript_metadata(
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
      where key_name ~* 'provider[_-]?debug|trace[_-]?dump|full[_-]?transcript|transcript[_-]?content|raw[_-]?provider[_-]?payload|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhook|headers?|raw[_-]?headers?|tokens?|authorization|cookie|credentials?|private[_-]?key|secret|password|api[_-]?key|service[_-]?role|customer[_-]?visible[_-]?internal[_-]?notes'
    ),
    false
  );
$$;

comment on function public.is_safe_transcript_metadata(jsonb, integer) is
  'Shared recursive metadata safety helper. Restores provider debug and trace dump diagnostic key rejection while preserving Phase 2E-H/2E-I hardening.';

revoke all on function public.is_safe_transcript_metadata(jsonb, integer) from public;
