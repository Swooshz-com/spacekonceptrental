# Quote Enquiry Email Handoff Delivery Log Foundation

## Purpose

This slice adds the first app-generated quote enquiry email handoff for the
existing public `/api/quote` submission path. After a quote request is
persisted, the server sends a plain-text internal email to the configured
business recipient and records a small protected delivery log row.

This is not a customer notification system, marketing email system, CRM,
booking flow, order flow, public quote tracker, or customer account feature.

## Runtime Boundary

The quote route remains the only public runtime entry point:

```text
Public quote form -> POST /api/quote -> Supabase quote persistence -> server email handoff
```

Email delivery is server-only. The browser receives only the existing receipt
response when persistence and email handoff succeed. If email delivery is not
configured or fails, `/api/quote` returns a generic temporary unavailable
response with the request reference and does not expose provider internals.

## Environment Contract

The handoff is environment-driven:

- `QUOTE_ENQUIRY_EMAIL_PROVIDER` defaults to `resend` when blank or missing.
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT` is required for delivery.
- `QUOTE_ENQUIRY_EMAIL_FROM` is required for Resend delivery.
- `RESEND_API_KEY` is required for Resend delivery.

No real env values, provider secrets, API keys, `.env` files, deployment config,
or browser-visible provider variables are committed by this slice.

## Delivery Log

`public.quote_email_delivery_log` stores append-only technical metadata only:

- workspace id
- quote request id
- public reference
- attempted timestamp
- redacted recipient
- provider
- delivery status
- provider message id when available
- safe error code when delivery is not sent
- request id

It must not store customer message text, item details, full recipient email,
email bodies, raw provider payloads, headers, cookies, tokens, secrets, or
provider API responses.

Anonymous clients can insert delivery metadata only for an existing website
quote request through RLS. Anonymous clients cannot read the table. Authenticated
workspace members can read rows for their workspace, and the protected admin
Delivery Log page shows the latest bounded rows without quote detail or inbox
actions.

## Scope Boundaries

This slice does not add:

- customer confirmation emails
- public delivery status or public quote tracking
- custom mailbox/thread tracking
- HubSpot sync, HubSpot contact/deal creation, or CRM workflow ownership
- n8n workflow/runtime changes
- Google Workspace SMTP integration
- retries, bounces, webhooks, schedulers, or background jobs
- ecommerce, checkout, payment, order, booking, reservation, fulfilment, or
  stock-reservation flows
- browser Supabase, service-role browser exposure, or deployment config

Future changes that add customer-facing notifications, retry/bounce handling,
CRM sync, or provider webhooks must be separately scoped and tested.
