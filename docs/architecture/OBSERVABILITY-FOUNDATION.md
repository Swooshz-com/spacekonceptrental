# Application Operation Event Observability Foundation

Reference authority: `#307`, Design Lock `DL-307-OBS-001`, and controller
authority comment `5188272062`.

This document describes the internal-alpha M1 foundation for durable
application operation events in SpaceKonceptRental. It is the schema, RLS,
admission, validator, and documentation foundation only. It does not wire a
runtime sink, add an admin read module, retry a quote handoff, add chat events,
activate alerts, delete rows, back up or restore data, change n8n, or touch
live configuration.

## Problem

Application failures are currently console-only and ephemeral. Durable quote
handoff failures have no supported owner recovery surface, and content/audit
coverage is incomplete. `quote_requests`, the handoff outbox, and the delivery
log already hold the successful quote truth; this foundation records only the
edge outcomes that are otherwise lost.

## Scope (M1)

- One canonical append-only table: `public.app_operation_events`.
- Private singleton HMAC admission configuration
  (`private.app_operation_event_admission_config`) with no seeded secret and
  no browser privilege.
- One fixed-search-path SECURITY DEFINER write RPC
  (`public.record_app_operation_event(...)`).
- RLS and privilege contracts, migration/RLS/SECURITY DEFINER validators,
  exact tests, and the schema/architecture documentation in this repository.

Initial categories: `quote.submission`, `quote.handoff`, `admin.auth`,
`rate.limit`. Initial outcomes: `failed`, `denied`, `disabled`, `pending`.
Typed references: `none`, `request_id`, `public_reference`.

## Explicitly out of scope

- `logApplicationError` runtime sink integration.
- Protected `/admin/operations` read module and read RPCs.
- Quote-handoff read/retry.
- Chat outcome events (deferred to `#315`).
- Alerting, deletion/cleanup jobs, backup/restore.
- n8n, deployment, or live configuration changes.

## Table contract

Each row contains only:

- caller-generated UUID `event_id` used as the primary idempotency key;
- `workspace_id` foreign key to `public.workspaces(id)`;
- bounded `category` and `outcome`;
- one typed safe reference (`reference_type` in `none`, `request_id`,
  `public_reference`) with a bounded `reference_value` constrained to match its
  type;
- bounded public-safe `error_code` using the existing safe-code character
  style (`^[a-z0-9_:-]+$`, at most 80 characters);
- bounded `route_key` (`^[A-Za-z0-9_./-]+$`, at most 160 characters, never an
  arbitrary URL);
- nullable `http_status` constrained to `100..599`;
- nullable database-derived `actor_admin_user_id`; the caller cannot nominate
  an actor;
- bounded `occurred_at`, `created_at`, and `retention_eligible_at`, the latter
  defaulting to 90 days after creation.

No payload JSON, raw quote/enquiry content, contact values, prompts/responses,
provider bodies, headers, cookies, tokens, credentials, internal notes, or
arbitrary metadata may be stored.

`retention_eligible_at` is eligibility metadata only. It is not a claim that
deletion is implemented; no cleanup job is part of the internal-alpha slice.

## RLS and privilege posture

- RLS is enabled. Direct `insert`, `update`, and `delete` are revoked from
  `PUBLIC`, `anon`, `authenticated`, and `service_role`. Only `authenticated`
  retains a reviewed `SELECT` grant.
- Direct `SELECT` is restricted to the narrowest existing owner/admin workspace
  predicate: `private.is_workspace_admin_access_member(workspace_id)`. This
  requires an active `admin_access` row with role `owner` or `admin` for the
  current authenticated identity. Anonymous, unauthorised members, and
  cross-workspace identities are denied. No new role model is introduced.
- The private admission configuration table is RLS-enabled, has no client
  policy, receives no browser or `service_role` table privilege, and is created
  with zero rows.

## HMAC admission proof

Every write through `public.record_app_operation_event(...)` requires a
short-lived server-issued HMAC admission proof:

- The proof binds every canonical caller-controlled event field through a
  deterministic digest (`private.app_operation_event_payload_digest(...)`).
- The proof expires within at most 120 seconds of issuance.
- The signature is an HMAC-SHA256 over a canonical message that includes the
  version, workspace, event id, digest, and expiry, verified against the secret
  stored only in `private.app_operation_event_admission_config`.
- Unconfigured, malformed, stale, future-invalid, mismatched, and forged proofs
  fail closed with distinct controlled errors.
- The proof remains mandatory for every role, so browser possession of an
  `anon` or `authenticated` token cannot forge an event.

The database derives any actor identity from the authenticated database
identity (`private.current_quote_admin_user_id(workspace_id)`); the caller
cannot nominate it.

## Idempotency and append-only posture

Repeating the same `event_id` with a fresh valid proof is handled by
`insert ... on conflict (event_id) do nothing` and returns `false` without
updating the existing row. A different occurrence uses a new UUID. Direct
`update` and `delete` are denied at both the privilege and RLS level.

## Validators and tests

- `scripts/validate-supabase-migrations.cjs` and
  `scripts/validate-supabase-migrations.test.cjs`: exact migration structure,
  column/constraint/index counts, forbidden-column checks, append-only posture,
  RLS and policy shape, private-config isolation, RPC signature and grants, and
  the updated exact migration count.
- `scripts/test-supabase-rls.cjs`: disposable local PostgreSQL/RLS behavioural
  harness covering exact columns/constraints/indexes, direct DML denial,
  owner/admin same-workspace read, anonymous/unauthorised/cross-workspace
  denial, private-config isolation, RPC owner/SECURITY DEFINER/search path/
  grants, unconfigured admission failure, malformed/stale/overlong/mismatched/
  forged proof failure, valid insertion, duplicate `event_id` idempotency,
  database-derived actor, category/outcome/reference boundaries, route/status/
  code/timestamp bounds, and the 90-day retention default.
- `scripts/security-definer-privilege-contract.cjs` and
  `scripts/security-remediation-rls-checks.cjs`: exact public SECURITY DEFINER
  and private-function catalogs and the updated policy-dependency count.
- `docs/SUPABASE-SECURITY-DEFINER-PRIVILEGE-INVENTORY.md` documents the exact
  privilege and SECURITY DEFINER inventory.

## M2A runtime sink (implemented)

The M2A runtime sink and HMAC signing path is implemented under Design Lock
`DL-324-OBS-002` (see `docs/architecture/OBSERVABILITY-RUNTIME-SINK.md`). It
adds exactly `APP_OPERATION_EVENTS_ENABLED` and
`APP_OPERATION_EVENT_ADMISSION_SECRET`, the typed modules in
`website/lib/application-events/`, the eleven locked call sites, the 750 ms
budget/two-attempt/60-second-circuit sink, the canonical PostgreSQL-17 digest
serializer with fixed fixture vectors, and the repository readiness validator.
No migration, RPC signature, grant, policy or index changed; `website/lib/
application-error-logging.ts` remains byte-identical; no generic success
events, `quote.submission.created`, chat events, setup-recipe events or
repository/RPC-side duplicate emission exist. Emission is disabled by default
and no live secret was configured.

## Later internal-alpha work (separately authorised)

- Protected `/admin/operations` read surface: bounded last-200 workspace rows,
  strict allowlisted mapping, and safe-reference search (M2B).
- Sink health shown by a bounded live read/probe state; do not create recursive
  `SINK_UNAVAILABLE` event rows.
- Quote handoff read/retry before public quote submission is enabled, using its
  own server-side capability, the existing admin gate, operation-bound CSRF,
  and the existing claim/finalisation contract.

## Production-only additions (not in this run)

Chat outcome events (`#315`), auth-rate limiting, hero/page-media audit rows and
audit view, alert summaries, retention/deletion execution, backup/restore
drill, media orphan operations, permanent dead-letter correction, and audited
protected-evidence reads remain production acceptance work.

## Hard boundaries

No Supabase Cloud, provider, Coolify, Google, n8n, email, DNS, production
database, credential, customer-data, content, deployment, or browser-login
access. No admission secret is configured or displayed. The M2A runtime sink
releases no retry, deployment, live-secret configuration, operations read
surface (M2B) or activation authority.
