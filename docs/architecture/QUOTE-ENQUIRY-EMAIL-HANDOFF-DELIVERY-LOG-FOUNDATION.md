# Quote Enquiry n8n Handoff Delivery Log Foundation

## Purpose

This slice moves the public quote/enquiry handoff toward the launch contract:
SKR persists the enquiry first, then triggers n8n from a server-side boundary,
and records a technical delivery-log attempt/result.

This is not a customer notification system, marketing email system, CRM,
booking flow, order flow, public quote tracker, or customer account feature.

## Runtime Boundary

The public quote route remains the only public runtime entry point:

```text
Public quote form -> POST /api/quote -> SKR Supabase persistence -> server-side n8n handoff -> Delivery Log
```

The browser posts only to `/api/quote`. Browser code must never call n8n or
receive the n8n webhook URL, shared secret, workflow details, provider payloads,
headers, cookies, service keys, or email credentials.

The public response is based on SKR persistence:

- If validation or persistence fails, the route returns a generic safe failure.
- If persistence succeeds, the route returns an honest received response with
  the public reference.
- n8n handoff failures are recorded for protected admin review and do not
  expose provider or workflow errors to the visitor.
- The public response does not claim email delivery, final quote details, or
  confirmed rental fit.

## Environment Contract

The handoff is server-side and environment-driven:

- `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`: server-only n8n webhook endpoint.
- `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`: server-only HMAC signing secret.
- `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`: optional bounded timeout override.

No real env values, webhook URLs, shared secrets, provider tokens, `.env`
files, deployment config, or browser-visible variables are committed by this
slice.

Operators can run the readiness check after server-side env has been set:

```powershell
npm run validate:quote-email-runtime-readiness
```

The command prints only env names and labels, never values.

Before production launch, operators must also run the broader launch gate in
the hosted/runtime environment:

```powershell
npm run validate:production-security-readiness -- --launch
```

## n8n Webhook Contract

No quote-enquiry n8n workflow export is added in this PR. The committed n8n
exports remain the existing chat/RAG/support workflows. The expected quote
handoff workflow should be created or reviewed separately in n8n, with
credentials stored in n8n credentials and no secrets in workflow text fields.

SKR sends a `POST` request with JSON body:

```json
{
  "schemaVersion": 1,
  "event": "skr.enquiry.submitted",
  "idempotencyKey": "quote-enquiry:<quote-request-id>",
  "submittedAt": "<ISO timestamp>",
  "enquiry": {
    "id": "<quote-request-id>",
    "publicReference": "<public-reference>",
    "source": "website",
    "sourcePath": "<safe path when available>",
    "listingSlug": "<listing slug when available>"
  },
  "contact": {
    "name": "<customer name>",
    "email": "<customer email when supplied>",
    "phone": "<customer phone when supplied>"
  },
  "eventContext": {
    "date": "<event date when supplied>",
    "venue": "<venue when supplied>",
    "message": "<customer message when supplied>"
  },
  "requestedItems": [
    {
      "name": "<catalogue item or free-text item name>",
      "quantity": 1,
      "notes": "<item notes when supplied>"
    }
  ],
  "request": {
    "requestId": "<route request id>",
    "visitorSubmissionRequestId": "<visitor request id when supplied>"
  }
}
```

SKR sends these headers:

- `x-skr-event`: `skr.enquiry.submitted`
- `x-skr-enquiry-reference`: public reference
- `x-skr-idempotency-key`: stable idempotency key
- `x-skr-timestamp`: ISO timestamp
- `x-skr-signature`: HMAC SHA-256 signature of `<timestamp>.<body>`

n8n should verify the signature, use the idempotency key to avoid duplicate
email/internal handoff work, send the internal email, and return a 2xx response
only after accepting the handoff. If the workflow needs asynchronous email
delivery, it should still return a clear accepted response only after n8n has
captured enough context to continue safely.

## Delivery Log

`public.quote_email_delivery_log` stores append-only technical metadata only:

- workspace id
- quote request id
- public reference
- attempted timestamp
- provider/channel label
- delivery status
- optional safe handoff id when explicitly returned as safe
- safe error code when handoff is not configured or fails
- request id

Launch n8n states are:

- `not_configured`
- `pending` when a later retry or async model records it
- `delivered`
- `failed`

Legacy `resend`/`sent` rows remain readable for compatibility, but the target
launch path is `n8n`.

The delivery log must not store customer message text, item details, full
recipient email, email bodies, raw n8n/provider payloads, webhook URLs, workflow
execution data, headers, cookies, tokens, secrets, or provider API responses.

Protected admin Delivery Log shows bounded technical rows only. It does not add
customer detail review, follow-up controls, CRM workflow controls, retry
buttons, or public delivery tracking.

## Scope Boundaries

This slice does not add:

- a live n8n workflow import, export, activation, execution, or mutation
- customer confirmation emails
- public delivery status or public quote tracking
- custom mailbox/thread tracking
- HubSpot sync or HubSpot contact/deal creation
- retries, bounces, provider webhooks, schedulers, or background jobs
- ecommerce, checkout, payment, order, booking, reservation, fulfilment, or
  stock-reservation flows
- browser Supabase, service-role browser exposure, or deployment config

Hosted validation is still required before launch. This document does not claim
hosted staging readiness or UAT completion.
