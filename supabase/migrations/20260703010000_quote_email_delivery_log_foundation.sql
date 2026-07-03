-- Phase 2B-Z quote enquiry email delivery log foundation.
-- Stores append-only technical delivery metadata only. Do not store full quote
-- messages, item details, email body content, raw provider payloads, headers,
-- cookies, tokens, or secrets in this table.

create table if not exists public.quote_email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  quote_request_id uuid not null,
  public_reference text not null,
  attempted_at timestamptz not null default now(),
  recipient_email_redacted text,
  provider text not null,
  delivery_status text not null,
  provider_message_id text,
  error_code text,
  request_id text not null,
  created_at timestamptz not null default now(),
  constraint quote_email_delivery_log_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_email_delivery_log_quote_request_workspace_id_fkey
    foreign key (quote_request_id, workspace_id)
    references public.quote_requests (id, workspace_id)
    on delete cascade,
  constraint quote_email_delivery_log_public_reference_check
    check (char_length(btrim(public_reference)) between 1 and 80),
  constraint quote_email_delivery_log_recipient_redacted_check
    check (
      recipient_email_redacted is null
      or char_length(recipient_email_redacted) <= 320
    ),
  constraint quote_email_delivery_log_provider_check
    check (provider = 'resend'),
  constraint quote_email_delivery_log_delivery_status_check
    check (delivery_status in ('sent', 'failed', 'not_configured')),
  constraint quote_email_delivery_log_provider_message_id_check
    check (provider_message_id is null or char_length(provider_message_id) <= 120),
  constraint quote_email_delivery_log_error_code_check
    check (error_code is null or char_length(error_code) <= 80),
  constraint quote_email_delivery_log_request_id_check
    check (char_length(btrim(request_id)) between 1 and 128),
  constraint quote_email_delivery_log_status_shape_check
    check (
      (delivery_status = 'sent' and error_code is null)
      or (delivery_status in ('failed', 'not_configured') and error_code is not null)
    )
);

create index if not exists quote_email_delivery_log_workspace_attempted_idx
  on public.quote_email_delivery_log (workspace_id, attempted_at desc);

create index if not exists quote_email_delivery_log_quote_request_attempted_idx
  on public.quote_email_delivery_log (quote_request_id, attempted_at desc);

create index if not exists quote_email_delivery_log_public_reference_idx
  on public.quote_email_delivery_log (workspace_id, public_reference, attempted_at desc);

alter table public.quote_email_delivery_log enable row level security;

revoke all on table public.quote_email_delivery_log from public;
revoke all on table public.quote_email_delivery_log from anon;
revoke all on table public.quote_email_delivery_log from authenticated;

grant insert (
  workspace_id,
  quote_request_id,
  public_reference,
  recipient_email_redacted,
  provider,
  delivery_status,
  provider_message_id,
  error_code,
  request_id
) on public.quote_email_delivery_log to anon;

grant select (
  id,
  workspace_id,
  quote_request_id,
  public_reference,
  attempted_at,
  recipient_email_redacted,
  provider,
  delivery_status,
  provider_message_id,
  error_code,
  request_id
) on public.quote_email_delivery_log to authenticated;

create policy quote_email_delivery_log_public_insert_website_quote
  on public.quote_email_delivery_log
  for insert
  to anon
  with check (
    public.is_public_website_quote_request(quote_request_id, workspace_id)
    and provider = 'resend'
    and delivery_status in ('sent', 'failed', 'not_configured')
  );

create policy quote_email_delivery_log_member_read
  on public.quote_email_delivery_log
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

comment on table public.quote_email_delivery_log is
  'Append-only quote enquiry email delivery metadata. Stores redacted recipient and provider status only, never message text, item detail, raw provider payloads, headers, cookies, tokens, or secrets.';

comment on column public.quote_email_delivery_log.recipient_email_redacted is
  'Redacted recipient email for protected admin delivery visibility; never store full recipient email here.';
