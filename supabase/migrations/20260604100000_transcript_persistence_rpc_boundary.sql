-- Phase 2E-D server-only transcript persistence RPC boundary only.
-- This local function contract is ungranted to browser roles and is intended
-- for a future separately approved injected server-side executor.

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
      where key_name ~* 'provider[_-]?debug|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhook|headers?|raw[_-]?headers?|tokens?|authorization|cookie|trace[_-]?dump|credentials?|private[_-]?key|secret|password|api[_-]?key'
    ),
    false
  );
$$;

create or replace function public.persist_transcript_batch(
  p_workspace_id uuid,
  p_conversation jsonb,
  p_messages jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_conversation_workspace_id uuid;
  v_quote_request_id uuid;
  v_conversation_metadata jsonb;
  v_message jsonb;
  v_message_id uuid;
  v_message_workspace_id uuid;
  v_message_conversation_id uuid;
  v_message_metadata jsonb;
  v_client_message_id text;
  v_persisted_message_id uuid;
  v_message_ids uuid[] := array[]::uuid[];
begin
  if p_workspace_id is null then
    raise exception 'transcript_workspace_required';
  end if;

  if p_conversation is null or jsonb_typeof(p_conversation) <> 'object' then
    raise exception 'transcript_conversation_invalid';
  end if;

  if p_messages is null
    or jsonb_typeof(p_messages) <> 'array'
    or jsonb_array_length(p_messages) = 0 then
    raise exception 'transcript_messages_required';
  end if;

  v_conversation_id := nullif(p_conversation->>'id', '')::uuid;
  v_conversation_workspace_id := nullif(p_conversation->>'workspace_id', '')::uuid;

  if v_conversation_workspace_id is distinct from p_workspace_id then
    raise exception 'transcript_workspace_mismatch';
  end if;

  if p_conversation ? 'quote_request_id'
    and nullif(p_conversation->>'quote_request_id', '') is not null then
    v_quote_request_id := nullif(p_conversation->>'quote_request_id', '')::uuid;
  end if;

  v_conversation_metadata := coalesce(p_conversation->'metadata', '{}'::jsonb);

  if not public.is_safe_transcript_metadata(v_conversation_metadata, 2048) then
    raise exception 'transcript_metadata_unsafe';
  end if;

  insert into public.conversations (
    id,
    workspace_id,
    public_reference,
    client_session_hash,
    quote_request_id,
    status,
    retention_expires_at,
    metadata,
    updated_at
  )
  values (
    v_conversation_id,
    p_workspace_id,
    nullif(p_conversation->>'public_reference', ''),
    nullif(p_conversation->>'client_session_hash', ''),
    v_quote_request_id,
    coalesce(nullif(p_conversation->>'status', ''), 'open'),
    case
      when nullif(p_conversation->>'retention_expires_at', '') is null
        then null
      else (p_conversation->>'retention_expires_at')::timestamptz
    end,
    v_conversation_metadata,
    now()
  )
  on conflict (id) do update
    set public_reference = excluded.public_reference,
        client_session_hash = excluded.client_session_hash,
        quote_request_id = excluded.quote_request_id,
        status = excluded.status,
        retention_expires_at = excluded.retention_expires_at,
        metadata = excluded.metadata,
        updated_at = now()
    where public.conversations.workspace_id = excluded.workspace_id
  returning id into v_conversation_id;

  if v_conversation_id is null then
    raise exception 'transcript_workspace_mismatch';
  end if;

  for v_message in
    select value
    from jsonb_array_elements(p_messages)
  loop
    if jsonb_typeof(v_message) <> 'object' then
      raise exception 'transcript_message_invalid';
    end if;

    v_message_id := nullif(v_message->>'id', '')::uuid;
    v_message_workspace_id := nullif(v_message->>'workspace_id', '')::uuid;
    v_message_conversation_id := nullif(v_message->>'conversation_id', '')::uuid;

    if v_message_workspace_id is distinct from p_workspace_id
      or v_message_conversation_id is distinct from v_conversation_id then
      raise exception 'transcript_workspace_mismatch';
    end if;

    v_message_metadata := coalesce(v_message->'metadata', '{}'::jsonb);

    if not public.is_safe_transcript_metadata(v_message_metadata, 4096) then
      raise exception 'transcript_metadata_unsafe';
    end if;

    v_client_message_id := nullif(v_message->>'client_message_id', '');
    v_persisted_message_id := null;

    if v_client_message_id is not null then
      -- The base schema unique constraint is the concurrency arbiter for
      -- non-null client_message_id retries.
      -- exact duplicate retries are accepted while conflicting client_message_id reuse is rejected.
      -- The idempotency fingerprint excludes id because a future server-side
      -- executor may generate message ids while replaying the same client key.
      insert into public.messages (
        id,
        workspace_id,
        conversation_id,
        role,
        message_type,
        content,
        provider,
        client_message_id,
        request_id,
        sequence_number,
        retention_expires_at,
        metadata
      )
      values (
        v_message_id,
        p_workspace_id,
        v_conversation_id,
        nullif(v_message->>'role', ''),
        coalesce(nullif(v_message->>'message_type', ''), 'chat'),
        nullif(v_message->>'content', ''),
        nullif(v_message->>'provider', ''),
        v_client_message_id,
        nullif(v_message->>'request_id', ''),
        case
          when nullif(v_message->>'sequence_number', '') is null
            then null
          else (v_message->>'sequence_number')::integer
        end,
        case
          when nullif(v_message->>'retention_expires_at', '') is null
            then null
          else (v_message->>'retention_expires_at')::timestamptz
        end,
        v_message_metadata
      )
      on conflict on constraint messages_workspace_conversation_client_message_key do update
        set client_message_id = excluded.client_message_id
        where public.messages.workspace_id = excluded.workspace_id
          and public.messages.conversation_id = excluded.conversation_id
          and public.messages.client_message_id = excluded.client_message_id
          and public.messages.role is not distinct from excluded.role
          and public.messages.message_type is not distinct from excluded.message_type
          and public.messages.content is not distinct from excluded.content
          and public.messages.provider is not distinct from excluded.provider
          and public.messages.request_id is not distinct from excluded.request_id
          and public.messages.sequence_number is not distinct from excluded.sequence_number
          and public.messages.retention_expires_at is not distinct from excluded.retention_expires_at
          and public.messages.metadata is not distinct from excluded.metadata
      returning id into v_persisted_message_id;

      if v_persisted_message_id is null then
        raise exception 'transcript_client_message_id_conflict';
      end if;
    else
      insert into public.messages (
        id,
        workspace_id,
        conversation_id,
        role,
        message_type,
        content,
        provider,
        client_message_id,
        request_id,
        sequence_number,
        retention_expires_at,
        metadata
      )
      values (
        v_message_id,
        p_workspace_id,
        v_conversation_id,
        nullif(v_message->>'role', ''),
        coalesce(nullif(v_message->>'message_type', ''), 'chat'),
        nullif(v_message->>'content', ''),
        nullif(v_message->>'provider', ''),
        null,
        nullif(v_message->>'request_id', ''),
        case
          when nullif(v_message->>'sequence_number', '') is null
            then null
          else (v_message->>'sequence_number')::integer
        end,
        case
          when nullif(v_message->>'retention_expires_at', '') is null
            then null
          else (v_message->>'retention_expires_at')::timestamptz
        end,
        v_message_metadata
      )
      on conflict (id) do update
        set role = excluded.role,
            message_type = excluded.message_type,
            content = excluded.content,
            provider = excluded.provider,
            client_message_id = excluded.client_message_id,
            request_id = excluded.request_id,
            sequence_number = excluded.sequence_number,
            retention_expires_at = excluded.retention_expires_at,
            metadata = excluded.metadata
        where public.messages.workspace_id = excluded.workspace_id
          and public.messages.conversation_id = excluded.conversation_id
      returning id into v_persisted_message_id;
    end if;

    if v_persisted_message_id is null then
      raise exception 'transcript_workspace_mismatch';
    end if;

    v_message_ids := v_message_ids || v_persisted_message_id;
  end loop;

  update public.conversations
  set last_message_at = now(),
      updated_at = now()
  where id = v_conversation_id
    and workspace_id = p_workspace_id;

  return jsonb_build_object(
    'conversationId', v_conversation_id::text,
    'messageIds', to_jsonb(v_message_ids)
  );
end;
$$;

comment on function public.persist_transcript_batch(uuid, jsonb, jsonb) is
  'Server-only Phase 2E-D local RPC boundary for validated transcript batches. Browser roles are not granted execute.';

revoke all on function public.is_safe_transcript_metadata(jsonb, integer) from public;
revoke all on function public.persist_transcript_batch(uuid, jsonb, jsonb) from public;
