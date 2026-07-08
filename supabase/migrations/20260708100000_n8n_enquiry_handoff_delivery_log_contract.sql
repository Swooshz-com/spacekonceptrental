-- Launch n8n enquiry handoff delivery-log contract.
-- Reviewed migration only. Do not apply to hosted Supabase from this PR.
-- Keeps delivery metadata technical-only and does not store webhook URLs,
-- shared secrets, email bodies, customer messages, item details, headers,
-- cookies, raw n8n payloads, workflow execution data, tokens, or secrets.

alter table public.quote_email_delivery_log
  drop constraint if exists quote_email_delivery_log_provider_check,
  drop constraint if exists quote_email_delivery_log_delivery_status_check,
  drop constraint if exists quote_email_delivery_log_status_shape_check;

alter table public.quote_email_delivery_log
  add constraint quote_email_delivery_log_provider_check
    check (provider in ('resend', 'n8n')),
  add constraint quote_email_delivery_log_delivery_status_check
    check (delivery_status in (
      'sent',
      'pending',
      'delivered',
      'failed',
      'not_configured'
    )),
  add constraint quote_email_delivery_log_status_shape_check
    check (
      (delivery_status in ('sent', 'pending', 'delivered') and error_code is null)
      or (delivery_status in ('failed', 'not_configured') and error_code is not null)
    );

alter policy quote_email_delivery_log_public_insert_website_quote
  on public.quote_email_delivery_log
  with check (
    public.is_public_website_quote_request(quote_request_id, workspace_id)
    and provider in ('resend', 'n8n')
    and delivery_status in (
      'sent',
      'pending',
      'delivered',
      'failed',
      'not_configured'
    )
  );

comment on table public.quote_email_delivery_log is
  'Append-only quote enquiry handoff delivery metadata. Stores safe provider/channel state only, never customer messages, item details, email bodies, webhook URLs, raw n8n payloads, workflow execution data, headers, cookies, tokens, or secrets.';
