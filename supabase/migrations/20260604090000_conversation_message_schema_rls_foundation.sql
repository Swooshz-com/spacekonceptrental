-- Phase 2E-B conversation/message schema and RLS foundation only.
-- Completes durable transcript table constraints while direct client access
-- remains denied until a later reviewed runtime access path exists.

alter table public.conversations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.conversations
  add column if not exists retention_expires_at timestamptz;

alter table public.conversations
  add column if not exists deleted_at timestamptz;

alter table public.conversations
  add column if not exists last_message_at timestamptz;

alter table public.messages
  add column if not exists message_type text not null default 'chat';

alter table public.messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.messages
  add column if not exists retention_expires_at timestamptz;

alter table public.messages
  add column if not exists deleted_at timestamptz;

alter table public.messages
  add column if not exists sequence_number integer;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_client_session_hash_format_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_client_session_hash_format_check
      check (
        client_session_hash is null
        or (
          char_length(client_session_hash) between 32 and 128
          and client_session_hash !~ '[[:space:]]'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_metadata_object_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_metadata_object_check
      check (jsonb_typeof(metadata) = 'object');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_metadata_size_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_metadata_size_check
      check (octet_length(metadata::text) <= 2048);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_metadata_safe_keys_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_metadata_safe_keys_check
      check (
        not (
          metadata ?| array[
            'provider_debug',
            'provider_payload',
            'workflow_payload',
            'webhook_url',
            'headers',
            'tokens',
            'trace_dump',
            'credential',
            'private_key'
          ]
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_retention_deleted_at_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_retention_deleted_at_check
      check (deleted_at is null or deleted_at >= created_at);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_message_type_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_message_type_check
      check (message_type in ('chat', 'system_notice'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_role_type_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_role_type_check
      check (
        (
          message_type = 'chat'
          and role in ('user', 'assistant', 'system')
        )
        or (
          message_type = 'system_notice'
          and role = 'system'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_content_length_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_content_length_check
      check (char_length(content) <= 8000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_provider_format_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_provider_format_check
      check (
        provider is null
        or (
          btrim(provider) <> ''
          and char_length(provider) <= 64
          and provider !~ '[[:space:]]'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_client_message_id_format_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_client_message_id_format_check
      check (
        client_message_id is null
        or (
          btrim(client_message_id) <> ''
          and char_length(client_message_id) <= 128
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_request_id_format_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_request_id_format_check
      check (
        request_id is null
        or (
          btrim(request_id) <> ''
          and char_length(request_id) <= 128
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_metadata_object_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_metadata_object_check
      check (jsonb_typeof(metadata) = 'object');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_metadata_size_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_metadata_size_check
      check (octet_length(metadata::text) <= 4096);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_metadata_safe_keys_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_metadata_safe_keys_check
      check (
        not (
          metadata ?| array[
            'provider_debug',
            'provider_payload',
            'workflow_payload',
            'webhook_url',
            'headers',
            'tokens',
            'trace_dump',
            'credential',
            'private_key'
          ]
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_sequence_number_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_sequence_number_check
      check (sequence_number is null or sequence_number >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_retention_deleted_at_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_retention_deleted_at_check
      check (deleted_at is null or deleted_at >= created_at);
  end if;
end
$constraints$;

create index if not exists conversations_workspace_retention_idx
  on public.conversations (workspace_id, retention_expires_at)
  where retention_expires_at is not null and deleted_at is null;

create index if not exists messages_workspace_retention_idx
  on public.messages (workspace_id, retention_expires_at)
  where retention_expires_at is not null and deleted_at is null;

create index if not exists messages_conversation_sequence_idx
  on public.messages (conversation_id, sequence_number)
  where sequence_number is not null;

comment on table public.conversations is
  'Privacy-sensitive conversation metadata. Phase 2E-B adds schema/RLS foundation only; direct client transcript access remains denied.';

comment on column public.conversations.client_session_hash is
  'Optional server-created non-reversible anonymous session correlation hash. This is not identity or ownership proof.';

comment on column public.conversations.metadata is
  'Minimal safe metadata only. Provider diagnostics, forwarding headers, secrets, and credential material are not allowed.';

comment on table public.messages is
  'Privacy-sensitive normalized conversation messages. Phase 2E-B adds schema/RLS foundation only; runtime writes and reads remain blocked.';

comment on column public.messages.metadata is
  'Minimal safe metadata only. Provider diagnostics, forwarding headers, secrets, and credential material are not allowed.';

alter policy conversations_member_read
  on public.conversations
  using (false);

alter policy messages_member_read
  on public.messages
  using (false);

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;

create policy conversations_no_direct_insert
  on public.conversations
  for insert
  to anon, authenticated
  with check (false);

create policy conversations_no_direct_update
  on public.conversations
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy conversations_no_direct_delete
  on public.conversations
  for delete
  to anon, authenticated
  using (false);

create policy messages_no_direct_insert
  on public.messages
  for insert
  to anon, authenticated
  with check (false);

create policy messages_no_direct_update
  on public.messages
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy messages_no_direct_delete
  on public.messages
  for delete
  to anon, authenticated
  using (false);
