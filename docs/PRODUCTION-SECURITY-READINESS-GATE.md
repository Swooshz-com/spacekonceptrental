# Production Security Readiness Gate

This document defines two separate production-security stages. Stage A is a
repository-safe static gate for controlled Google OAuth deployment while quote
submission stays disabled and n8n stays inactive. Stage B is the existing full
hosted launch gate and checks required production launch configuration by env
name only. Neither command prints env values, API keys, secrets, provider
response bodies, connection strings, or full email values.

This gate does not deploy, connect Supabase Cloud, configure providers, send
email, call n8n or email-provider APIs, call Pinecone, call HubSpot, mutate
data, or approve public traffic.

Database function execution is deny-by-default after
`20260721183000_public_security_definer_privilege_hardening.sql`. The complete
exact-signature inventory, anonymous allowlist, authenticated RPC set, private
policy-helper moves, and regression sources are maintained in
`docs/SUPABASE-SECURITY-DEFINER-PRIVILEGE-INVENTORY.md`.

`20260721190000_platform_rls_auto_enable_privilege_hardening.sql` separately
removes API/client execution from the optional Supabase-managed
`public.rls_auto_enable()` event-trigger helper without changing its operation.

## Required Read-Only Pre-Migration Checks

Before applying the privilege-hardening migration to production, verify
read-only in the deployed PostgREST/Supabase API configuration that `private`
is not an exposed schema. The schema must remain unexposed. Explicitly
schema-qualified `private.*` helpers used by RLS and Storage policies do not
require `private` to be exposed or placed on PostgREST's extra search path.

Record the redacted verification result in the deployment evidence before the
migration is applied. Do not change PostgREST configuration as part of this
check. If `private` is exposed or the setting cannot be verified read-only,
hold the migration and production launch.

Also generate a fresh, read-only live function catalog with
`scripts/production-security-definer-catalog.sql`. The query enumerates every
live public `SECURITY DEFINER` function from `pg_catalog`; it does not filter to
the repository inventory and does not read application or customer data. Save
its JSON output to a temporary location outside the repository, then pass that
file to the launch gate:

```powershell
$catalogPath = Join-Path $env:TEMP 'skr-public-security-definer-catalog.json'
psql "<approved read-only production connection>" -X -q -t -A -f scripts/production-security-definer-catalog.sql | Set-Content -LiteralPath $catalogPath -Encoding utf8
npm run validate:production-security-readiness -- --launch --public-security-definer-catalog $catalogPath
```

The catalog contains function identity/shape, event-trigger metadata, and
execution booleans only. Do not commit it. The gate fails when the catalog is
missing in launch mode, when reviewed functions are missing or have changed
privileges, or when any unreviewed live function is executable by `PUBLIC`,
`anon`, `authenticated`, or `service_role`. An unreviewed deny-only function is
reported as a warning for follow-up inventory review.

## Command

Stage A repository-safe mode:

```powershell
npm run validate:stage-a-oauth-readiness
```

This command validates tracked-file security, the Node 24 contract, and the
staged environment contract without reading provider configuration or requiring
any `QUOTE_*` or `N8N_*` value. It does not prove a deployment or real-owner
OAuth UAT. Repository-only mode validates the contract but cannot complete the
provider signup-admission gate. The production smoke makes no direct provider API call by the smoke
harness and no mutating provider call. Route rendering may exercise configured
read-only Supabase-backed application paths through the deployed first-party
application.

Stage B local/dev informational mode:

```powershell
npm run validate:production-security-readiness
```

Stage B launch enforcement mode:

```powershell
npm run validate:production-security-readiness -- --launch --public-security-definer-catalog $catalogPath
```

Normal CI and normal local release validation do not require real production
secrets. Run launch enforcement mode in the hosted/runtime environment after
server-side env has been configured there.

## Mode Behavior

| Mode | How to run | Missing/invalid launch env |
| --- | --- | --- |
| Stage A repository-safe | `npm run validate:stage-a-oauth-readiness` | Requires no provider env, quote configuration, active n8n configuration, or live catalog; does not satisfy provider admission evidence. |
| Stage A completion | `npm run validate:stage-a-oauth-deployment-readiness -- --provider-admission-evidence <temporary-secret-safe-evidence-path>` | Validates every Stage A runtime env name/safe shape, exact unpadded disabled admin-mutation state, and direct provider-admission `PASS` evidence; holds when any cannot be proven. |
| Stage B local/dev | No mode env, or mode set to local | Reports missing full-launch env and missing live catalog as warnings; exits success if static checks pass. |
| Stage B launch | `npm run validate:production-security-readiness -- --launch --public-security-definer-catalog $catalogPath` | Enforces full env, static checks, complete live function catalog, and exact reviewed privilege contracts. |

Do not infer launch readiness from random hosting env. Use the explicit
launch mode flag, or set `SKR_PRODUCTION_READINESS_MODE` to launch only for the
readiness command.

## Required Env Names

Review and set these values only in the hosting provider's server-side runtime
environment. Do not commit `.env` files or real env values.

For Stage A, only `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`CATALOGUE_WORKSPACE_ID`, `ADMIN_TRUSTED_WORKSPACE_ID`,
`ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, and
`ADMIN_CSRF_PROOF_SECRET`, plus `ADMIN_MUTATIONS_ENABLED` in its explicit
disabled state, are required
by the deployment contract. Stage A
requires no active n8n configuration, no quote-persistence/admission
configuration, and no quote enablement.

The table below is the full Stage B launch set enforced by
`validate:production-security-readiness -- --launch`:

| Env name | Purpose | Launch requirement |
| --- | --- | --- |
| `SUPABASE_URL` | Server-side Supabase project URL for approved server access. | Must exist and be HTTPS. |
| `SUPABASE_ANON_KEY` | Server-side public/anon key used with RLS through first-party routes. | Must exist. |
| `CATALOGUE_WORKSPACE_ID` | Server-owned public catalogue workspace gate; must match `catalogue_public_workspace_config`. | Must exist. |
| `QUOTE_WORKSPACE_ID` | Server-owned quote/enquiry persistence workspace gate; must independently match `quote_public_workspace_config`. | Must exist. |
| `QUOTE_SUBMISSION_ADMISSION_SECRET` | Dedicated server-only HMAC secret for quote admission proofs validated by the durable RPC. | Must exist, be at least 32 characters, and match the separately provisioned private database configuration. |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Server-owned protected admin workspace gate. | Must exist. |
| `ADMIN_EXPECTED_ORIGIN` | Trusted protected admin same-origin value. | Must exist and be an HTTPS origin. |
| `ADMIN_EXPECTED_HOST` | Trusted protected admin host value. | Must exist and be a host or HTTPS URL. |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only CSRF proof signing secret. | Must exist, be at least 32 characters, and not be a weak placeholder shape. |
| `ADMIN_MUTATIONS_ENABLED` | Fail-closed server-only admin-write capability. | Only exact lowercase `true` enables writes; Stage A requires explicit `false`. |
| `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL` | Server-only n8n endpoint for quote/enquiry handoff after SKR persistence succeeds. | Must exist and be HTTPS. |
| `N8N_ENQUIRY_HANDOFF_SHARED_SECRET` | Server-only HMAC signing secret shared with the reviewed n8n workflow. | Must exist, be high-entropy, and not be a weak placeholder shape. |
| `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS` | Optional timeout for the n8n handoff request. | Optional; when set, must be positive and no more than 30000ms. |

`QUOTE_SUBMISSION_ADMISSION_SECRET` is purpose-specific and must not reuse the
admin CSRF or n8n secrets. Its value is provisioned outside Git in Coolify and,
after the forward migration is approved, in the private database configuration;
browser roles cannot read that configuration.

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
- any public/client exposure of `ADMIN_MUTATIONS_ENABLED`
- obvious committed secret token patterns
- legacy compact JWTs whose decoded payload identifies the
  `service_role` role, without printing the token
- Delivery Log documentation that stops describing technical metadata only

The launch command also validates the full read-only live public `SECURITY
DEFINER` catalog. It preserves the six intentional anonymous application RPCs
and ten intentional authenticated application RPCs while rejecting any other
API/client execution, including all execution of `public.rls_auto_enable()` by
`PUBLIC`, `anon`, `authenticated`, or `service_role`.

Docs, tests, and env contract files may mention env names for review and
validation purposes. The command reports only file paths, env names, and safe
reason labels.

## Stage B n8n Enquiry Handoff Review

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

## Stage B Safe Live Quote Verification

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

## Stage B Launch Hold Conditions

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

## Stage A Hold Conditions

Hold controlled OAuth deployment if any of these are true:

- `npm run validate:stage-a-oauth-readiness` fails, or the completion validator
  fails/holds after provider evidence is supplied;
- the requested immutable SHA and resolved checkout/build SHA are not proven
  exactly equal;
- the immutable deployment identifier, pre-deployment identity, or reviewed
  rollback-target evidence is unavailable;
- quote submission is not proven disabled;
- n8n is not proven inactive;
- admin mutations are enabled or cannot be proven disabled;
- provider signup admission is not directly verified as `PASS` through either
  disabled new-user signup with existing-owner readiness, or a reviewed
  before-user-created/pre-user-creation admission hook;
- the read-only production smoke fails or issues a non-GET/HEAD request;
- anonymous `/admin` does not deny or redirect to the first-party login surface;
- a redirect exposes localhost, internal proxy authority, or an arbitrary host;
- any customer quote is submitted; or
- any provider, SQL, stack, secret, or environment detail leaks publicly.

Record Google OAuth owner UAT as `PASS | HOLD - NOT RUN | FAIL`. Stage A
remains incomplete and held until real-owner Google OAuth UAT passes. A
controlled exact-SHA deployment may exist temporarily for UAT, but the Stage A
record remains `HOLD - NOT RUN`, not `PASS`, until the UAT passes.

Record provider signup admission as `PASS | HOLD - NOT VERIFIED | FAIL`.
`HOLD - NOT VERIFIED` blocks UAT and completion. Authentication denied after
callback does not prove user creation prevention, and repository tests cannot
prove provider state. A future authorised verification must use the strongest
suitable official Supabase interface or API, record only a timestamp,
mechanism class, operator/approval reference, existing-owner readiness, and
  no-public-signup result, and expose no secrets or private/provider identifiers.
Evidence must use exact admission mechanism `new-user-signup-disabled` or
`before-user-created-admission-hook`, and its parsed verification timestamp
must not be in the future.

Do not weaken the Stage B launch validator to clear Stage A. Stage A does not
authorise public enquiry launch.
