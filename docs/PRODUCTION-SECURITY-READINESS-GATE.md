# Production Security Readiness Gate

This gate is a safe local and hosted-runtime validation for the SKR owner MVP
launch environment. It checks required production launch configuration by env
name only and never prints env values, API keys, secrets, provider response
bodies, connection strings, or full email values.

This gate does not deploy, connect Supabase Cloud, configure providers, send
email, call n8n or email-provider APIs, call Pinecone, call HubSpot, mutate
data, or approve public traffic.

## Command

Local/dev informational mode:

```powershell
npm run validate:production-security-readiness
```

Launch enforcement mode:

```powershell
npm run validate:production-security-readiness -- --launch
```

Normal CI and normal local release validation do not require real production
secrets. Run launch enforcement mode in the hosted/runtime environment after
server-side env has been configured there.

## Mode Behavior

| Mode | How to run | Missing/invalid launch env |
| --- | --- | --- |
| Local/dev | No mode env, or mode set to local | Reports warnings and exits success if static checks pass. |
| Launch | `npm run validate:production-security-readiness -- --launch` | Reports env names/reasons only and exits non-zero. |

Do not infer launch readiness from random hosting env. Use the explicit
launch mode flag, or set `SKR_PRODUCTION_READINESS_MODE` to launch only for the
readiness command.

## Required Env Names

Review and set these values only in the hosting provider's server-side runtime
environment. Do not commit `.env` files or real env values.

| Env name | Purpose | Launch requirement |
| --- | --- | --- |
| `SUPABASE_URL` | Server-side Supabase project URL for approved server access. | Must exist and be HTTPS. |
| `SUPABASE_ANON_KEY` | Server-side public/anon key used with RLS through first-party routes. | Must exist. |
| `CATALOGUE_WORKSPACE_ID` | Server-owned public catalogue workspace gate. | Must exist. |
| `QUOTE_WORKSPACE_ID` | Server-owned quote/enquiry persistence workspace gate. | Must exist. |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Server-owned protected admin workspace gate. | Must exist. |
| `ADMIN_EXPECTED_ORIGIN` | Trusted protected admin same-origin value. | Must exist and be an HTTPS origin. |
| `ADMIN_EXPECTED_HOST` | Trusted protected admin host value. | Must exist and be a host or HTTPS URL. |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only CSRF proof signing secret. | Must exist, be at least 32 characters, and not be a weak placeholder shape. |
| `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` | Server-only n8n endpoint for quote/enquiry handoff after SKR persistence succeeds. | Must exist and be HTTPS. |
| `N8N_ENQUIRY_HANDOFF_SHARED_SECRET` | Server-only HMAC signing secret shared with the reviewed n8n workflow. | Must exist, be high-entropy, and not be a weak placeholder shape. |
| `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS` | Optional timeout for the n8n handoff request. | Optional; when set, must be positive and no more than 30000ms. |

Safe placeholder examples for documentation or tests only:

| Env name | Safe placeholder |
| --- | --- |
| `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` | `<reviewed server-only n8n enquiry webhook endpoint>` |
| `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS` | `5000` |
| `ADMIN_EXPECTED_ORIGIN` | `<reviewed HTTPS admin origin>` |
| `ADMIN_EXPECTED_HOST` | `owner.example.invalid` |

Do not create placeholder examples for shared secrets, API keys, CSRF secrets,
Supabase keys, or workspace IDs in committed files. Generate real secret values
outside the repo and store them only in the hosting provider's secret/env UI.

## Not Required For Owner MVP Launch

The owner MVP launch requires only the server-side n8n enquiry handoff env
listed above. It does not require chat/RAG, Pinecone, or HubSpot runtime env.
Do not add launch requirements for:

- `N8N_CHAT_WEBHOOK_URL`
- `PINECONE_*`
- `HUBSPOT_*`
- `NEXT_PUBLIC_SUPABASE_*`
- `NEXT_PUBLIC_N8N*`
- `SUPABASE_SERVICE_ROLE_KEY`

n8n chat remains optional and separate from the quote/enquiry handoff. Pinecone
and HubSpot remain separate concerns. The owner MVP production-security
readiness gate must not require those env names.

## Static Security Checks

The command also checks tracked files for narrow launch blockers:

- committed `.env` files
- tracked `website/chat-config.js`
- runtime source importing or reading `website/chat-config.js`
- production source referencing the removed `NEXT_PUBLIC_SKR_DEMO_CONTENT`
  public demo-content env
- server-only env names in client components or public runtime files
- n8n webhook, n8n shared-secret, or Supabase service-role env names in
  client/public runtime files
- obvious committed secret token patterns
- Delivery Log documentation that stops describing technical metadata only

Docs, tests, and env contract files may mention env names for review and
validation purposes. The command reports only file paths, env names, and safe
reason labels.

## n8n Enquiry Handoff Review

Verify the n8n enquiry handoff outside the repo before live quote testing:

1. Open the n8n instance outside this repository.
2. Confirm the reviewed workflow accepts the expected SKR enquiry payload and
   idempotency key.
3. Confirm the workflow verifies the timestamped HMAC signature before sending
   email or internal handoff.
4. Confirm email provider credentials and recipients are configured only inside
   n8n or the approved provider, not in SKR admin UI or repo files.
5. Store `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` and
   `N8N_ENQUIRY_HANDOFF_SHARED_SECRET` only as server-side hosting secrets.
6. Run `npm run validate:production-security-readiness -- --launch`
   in the hosted/runtime environment.

Do not paste the n8n webhook URL, shared secret, email provider credentials, or
provider tokens into chat, docs, PR bodies, screenshots, logs, or `.env` files.

## Safe Live Quote Verification

After launch mode passes in the hosted/runtime environment:

1. Submit one clearly synthetic quote through the public `/quote` page.
2. Confirm the public success response is receipt-only and has no public quote
   tracking, customer account, booking, payment, or order language.
3. If n8n handoff is missing or fails after persistence, confirm the public
   response remains an honest receipt/processing state with a safe reference id
   and no provider internals.
4. Sign in as an approved owner/admin.
5. Open protected Enquiry Email and confirm it shows server-side n8n readiness
   and last handoff status only, without webhook URLs, secrets, recipients, or
   provider config.
6. Open protected Delivery Log and confirm it shows bounded technical metadata
   only: provider/channel, delivery status, safe message id or safe error code,
   request reference, and timestamp.

Delivery Log must not show customer messages, requested item detail, full email
bodies, raw provider payloads, headers, cookies, tokens, secrets, API keys, or
provider response bodies.

## Launch Hold Conditions

Hold launch if any of these are true:

- launch mode exits non-zero
- static security checks fail
- n8n enquiry handoff env is missing, invalid, or exposed outside the server
- n8n workflow signing/idempotency/email-provider setup is not verified outside
  the repo
- safe live quote verification has not been run after env readiness passes
- public failure responses expose provider internals, stack traces, SQL, env
  values, secrets, customer/private data, or workspace internals
- protected Enquiry Email or Delivery Log exposes more than status and
  technical metadata
- `NEXT_PUBLIC_SKR_DEMO_CONTENT` is configured in the hosted build or runtime
  environment

Public visuals remain frozen unless an explicitly scoped functional bug is
found.
