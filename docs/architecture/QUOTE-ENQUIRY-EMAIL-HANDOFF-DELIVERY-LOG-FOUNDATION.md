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
  Unsupported provider values are invalid.
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT` is required for delivery and must be a valid
  email address.
- `QUOTE_ENQUIRY_EMAIL_FROM` is required for Resend delivery and must be a
  valid email address from a verified Resend sender/domain.
- `RESEND_API_KEY` is required for Resend delivery and must stay server-only.

No real env values, provider secrets, API keys, `.env` files, deployment config,
or browser-visible provider variables are committed by this slice.

Runtime config validation lives in `website/lib/server-runtime-config.ts`.
The shared quote email handoff validator distinguishes configured, missing
recipient, missing from address, missing provider API key, and unsupported
provider states. It returns only status fields, env names, and safe reason
codes. It must not expose `RESEND_API_KEY` through public, admin, client, or
log output.

Operators can run the hosting readiness check after server-side env has been
set:

```powershell
npm run validate:quote-email-runtime-readiness
```

The command checks the live process env, prints only env names and labels, and
does not echo values. Normal local and CI release validation stays runnable
without real email secrets.

Safe placeholder examples for docs or screenshots:

- Provider env name: `QUOTE_ENQUIRY_EMAIL_PROVIDER`; safe placeholder value:
  `resend`.
- Recipient env name: `QUOTE_ENQUIRY_EMAIL_RECIPIENT`; safe placeholder
  address: `events@example.invalid`.
- From env name: `QUOTE_ENQUIRY_EMAIL_FROM`; safe placeholder address:
  `quotes@example.invalid`.
- Provider API key env name: `RESEND_API_KEY`; store the real value only in the
  hosting provider's server-side secret field.

Safe verification flow after env is configured:

1. Submit a normal public quote request.
2. Confirm quote persistence succeeds before email handoff is attempted.
3. Confirm the public response is success only when the email handoff succeeds.
4. Confirm unconfigured or failed email handoff returns the generic temporary
   unavailable response with a request/reference id.
5. Check protected admin Enquiry Email for status-only provider/recipient
   state and redacted recipient display.
6. Check protected admin Delivery Log for technical delivery metadata only.

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
