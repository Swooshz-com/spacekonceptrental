# App Operation Event Runtime Sink (M2A)

Reference authority: `#324`, Design Lock `DL-324-OBS-002`, controller authority
comments `5194894808` and `5198607796`.

This document describes the M2A server-only runtime sink and HMAC signing path
for durable application operation events. It writes the already-reviewed
bounded events through the existing `public.record_app_operation_event(...)`
RPC. It does not implement the protected operations read surface (M2B remains
separately blocked).

## Runtime configuration

Exactly two server-only variables were added:

- `APP_OPERATION_EVENTS_ENABLED` — enabled only when the raw value is exactly
  `true`; absent or any other value means disabled (fail-closed).
- `APP_OPERATION_EVENT_ADMISSION_SECRET` — the server-side HMAC material. It is
  validated by untrimmed UTF-8 byte length (`Buffer.byteLength(value, "utf8")`)
  with a minimum of 32 bytes, matching PostgreSQL `octet_length` semantics. The
  identical value must later be installed privately into
  `private.app_operation_event_admission_config.hmac_secret` through an
  approved channel before live activation. No value is ever displayed, hashed
  into logs, or exposed to browser code.

## Typed modules (`website/lib/application-events/`)

- `app-operation-event-types.ts` — locked category, outcome, reference-type
  and sink-state unions plus the bounded field and result types.
- `app-operation-event-signer.ts` — canonical digest, HMAC admission message
  and proof issuance (TTL 60 seconds).
- `app-operation-event-sink.ts` — state machine, 750 ms budget, two-attempt
  retry, 60-second open circuit, internal typed status accessor.
- `app-operation-event-call-sites.ts` — the eleven typed logical emissions.

## Canonical digest contract

The payload digest is SHA-256 hexadecimal over the exact UTF-8 bytes produced
by PostgreSQL 17 for the M1 helper's `jsonb_build_object(...)::text` value.
PostgreSQL 17 emits the object keys in the internal jsonb storage order of the
helper call, not sorted order; the Node serializer replicates that exact order
(`outcome, category, event_id, route_key, error_code, http_status,
workspace_id, occurred_at_ms, reference_type, reference_value`). The exact byte
representation is locked through fixed fixture vectors in
`scripts/test-supabase-rls.cjs` against the real disposable PostgreSQL 17
helper, and the same vectors are embedded in
`website/lib/application-events/app-operation-event-signer.test.ts`.

HMAC message:

```
skr.app_operation_event.v1
<workspace_uuid_lower>
<event_uuid_lower>
<payload_digest_lower_hex>
<expires_at_epoch_seconds>
```

Signature: HMAC-SHA256 hexadecimal with the server admission material. Proof
lifetime: 60 seconds, inside the existing 120-second database cap.

## Sink state machine

Closed states: `disabled`, `ready`, `unconfigured`,
`temporarily_unavailable`, `misconfigured`.

- Disabled, unconfigured, misconfigured and open-circuit states perform zero
  RPC calls.
- Duplicate RPC return `false` means idempotent success.
- Transient network/timeout/unavailable failures open a 60-second in-process
  circuit.
- Admission, permission, canonicalisation or configuration failures become
  `misconfigured` and do not repeatedly retry.
- Sink failure never calls `logApplicationError`, an admin gate, a route
  handler or the sink again. The legacy console logger remains byte-identical
  and uncoupled.
- Console fallback is one fixed public-safe prefix
  (`app_operation_event_sink`) with a bounded state/error code only. No raw
  exception, payload, field value, response body or credential is printed.
- No HTTP sink-status route exists in M2A; only an internal typed status
  accessor is exported for tests and future M2B.

## Timeout and retry

- Hard wall-clock budget: 750 ms maximum for the complete logical emission.
- At most two RPC attempts total; both attempts plus any single 100 ms backoff
  remain inside the deadline.
- The same event ID and event fields are reused on retry.
- A second attempt starts only when the remaining deadline can safely
  accommodate it.
- No durable queue, outbox, worker, background continuation, shutdown flush or
  cross-process retry.

## Locked call sites

| Call site | Category | Outcome | Error code | Route key | HTTP |
| --- | --- | --- | --- | --- | --- |
| `/api/quote` submission disabled | `quote.submission` | `disabled` | `quote_submission_disabled` | `/api/quote` | 503 |
| `/api/quote` validation denial | `quote.submission` | `denied` | `validation_failed` | `/api/quote` | 400 |
| `/api/quote` persistence failure | `quote.submission` | `failed` | `quote_persistence_unavailable` | `/api/quote` | 503 |
| `/api/quote` handoff pending | `quote.handoff` | `pending` | `handoff_pending` | `/api/quote` | 503 |
| `/api/quote` handoff exception | `quote.handoff` | `failed` | `handoff_exception` | `/api/quote` | 503 |
| `/api/quote` handoff finalisation failure | `quote.handoff` | `failed` | `handoff_finalization_failed` | `/api/quote` | 503 |
| `/api/quote` handoff disabled | `quote.handoff` | `disabled` | `handoff_not_configured` | `/api/quote` | 503 |
| `/api/quote` rate-limit denial | `rate.limit` | `denied` | `rate_limited` | `/api/quote` | 429 |
| Admin gate denial (invocation choke point) | `admin.auth` | `denied` | stable mapped reason | `admin.gate` | 400/401/403/503 |
| `/api/admin/login` failure | `admin.auth` | `denied` | `login_unauthenticated`/`login_unavailable` | `/api/admin/login` | 303 |
| `/api/admin/login/callback` failure | `admin.auth` | `denied` | `callback_unauthenticated`/`callback_unavailable` | `/api/admin/login/callback` | 303 |

Reference rules: quote/rate-limit events use the server-generated route request
ID as `request_id`; admin events always use reference type `none`. The
workspace is server-owned (`QUOTE_WORKSPACE_ID` or `ADMIN_TRUSTED_WORKSPACE_ID`);
no client IP, browser fingerprint or client header value is ever stored.
Emission happens only after the product response decision is fixed and never
alters that response. No generic success events, `quote.submission.created`,
chat events, setup-recipe events or repository/RPC-side duplicate emission
exist.

## Deployment readiness

`scripts/validate-app-operation-event-runtime-readiness.cjs` (wired into CI and
root `package.json`):

- disabled and secret absent: pass;
- disabled and secret present: pass with the fixed warning code
  `APP_OPERATION_EVENT_ADMISSION_SECRET_PRESENT_WHILE_DISABLED`;
- enabled and secret absent: fail;
- enabled and secret shorter than 32 UTF-8 bytes: fail;
- enabled and missing Supabase/workspace configuration: fail;
- enabled with the complete presence contract: pass;
- no output contains any supplied value.

Live activation still requires: reviewed merged implementation, exact database
migration state, the same key installed privately in server and database,
verified permissions, an independent live preflight, and separately issued
deployment authority. Nothing was configured during M2A.
