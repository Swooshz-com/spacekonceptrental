-- Phase 2J-A/B quote intake hardening.
-- Preserves public customer quote/enquiry messages without adding public reads,
-- tracking, accounts, notifications, CRM, or ecommerce flows.

alter table public.quote_requests
  add column if not exists customer_message text;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_requests_customer_message_length_check'
      and conrelid = 'public.quote_requests'::regclass
  ) then
    alter table public.quote_requests
      add constraint quote_requests_customer_message_length_check
      check (customer_message is null or char_length(customer_message) <= 1200);
  end if;
end
$constraints$;

grant insert (
  customer_message
) on public.quote_requests to anon;

comment on column public.quote_requests.customer_message is
  'Customer-submitted public quote/enquiry message for protected admin review only.';
