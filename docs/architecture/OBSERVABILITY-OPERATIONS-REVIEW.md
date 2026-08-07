# Protected Admin Operations Event Review (M2B)

Reference authority: `#326`, Design Lock `DL-326-OBS-003`, and controller
authority comment `5210362870`.

This document describes the M2B repository slice: an owner/admin-only,
read-only `/admin/operations` surface that displays the existing bounded
`public.app_operation_events` records and the existing M2A sink state. It is
an internal-alpha operational review surface, not a general observability
platform.

## Scope

- One protected server-rendered page `/admin/operations` inside the existing
  protected admin shell and navigation.
- One server-only read pipeline under `website/lib/application-events/`
  (query parser, typed Supabase read repository, strict row mapper, bounded
  summary, display adaptation for the existing sink-state accessor).
- No public or unauthenticated route, no API route, no write RPC, no retry,
  deletion, acknowledgement, export, alerting or background worker.

## Authentication and authorisation

- The page reuses the existing `resolveProtectedAdminShellState()` path, which
  invokes the existing `resolveServerAdminRuntimeRouteGateAdapter(...)` with a
  GET read operation (`admin.shell.access`, the locked GET shell operation).
  No new authentication, membership, workspace or role model was introduced
  and no policy file changed.
- All current shell outcomes are preserved: `unauthenticated`,
  `authenticated_not_authorised`, `authorised_admin`, `unavailable`.
- The trusted workspace comes only from `ADMIN_TRUSTED_WORKSPACE_ID`; the
  read uses the existing session-bound authenticated Supabase admin read
  client. No `service_role` path and no anonymous client exist.

## Database access

`public.app_operation_events` is read through:

- the existing authenticated `SELECT` grant;
- the existing RLS predicate
  `private.is_workspace_admin_access_member(workspace_id)` (authoritative
  backstop);
- a mandatory application-level equality filter on the server-owned trusted
  workspace ID (defence in depth).

The mapper additionally verifies every selected row's `workspace_id` equals
the trusted workspace ID before mapping; a mismatch fails the complete
result. No migration, RPC, RLS, grant or privilege change was made. No read
RPC was added because the existing direct RLS-protected read is sufficient.

## Query contract

- Default read: at most 200 rows, ordered `created_at DESC`, then
  `event_id DESC`, `.limit(200)`, no count/aggregate query and no unbounded
  pagination.
- Category and outcome filters are exact matches against the locked unions.
- Safe-reference search is an explicit pair (`reference_type`,
  `reference_value`) for `request_id` / `public_reference` only; `none` is not
  searchable. Search is exact equality only. Values are canonicalised (trim)
  and validated against the existing safe-reference contract
  (`^[A-Za-z0-9._:-]+$`, 1..128 characters). No `LIKE`, `ILIKE`, wildcard,
  fuzzy, prefix, free-text or multi-column OR search exists.
- Unknown, repeated, malformed or explicitly supplied empty/whitespace filter
  and search values return a bounded `invalid_filter` result and execute zero
  database queries. Invalid supplied values are never returned, logged or
  rendered.

## Read model and privacy

The read pipeline selects an explicit allowlisted column inventory
(`event_id, workspace_id, category, outcome, reference_type,
reference_value, error_code, route_key, http_status, actor_admin_user_id,
occurred_at, created_at, retention_eligible_at`). `select("*")` is never
used; any unknown extra database field is ignored by construction.

The application read model exposes only:

- `eventId`, `category`, `outcome`, `referenceType`, `referenceValue` (only
  when valid under the safe-reference contract), `errorCode`, `routeKey`,
  `httpStatus`, `occurredAt`, `createdAt`, `retentionEligibleAt`, and an
  `actorExists` boolean.

`actor_admin_user_id` is selected only to derive the in-memory boolean; the
raw value never leaves the server mapper, and `workspace_id` is selected only
for the equality backstop and is never exposed. Strict UUID/null validation
applies to both. Never exposed: actor identity detail, quote/enquiry content,
contact values, prompts/responses, provider bodies, headers, cookies,
credentials, HMAC material, internal notes, arbitrary JSON/metadata or
customer/private data.

Any malformed selected row fails the complete read result (`unavailable`);
rows are never silently dropped and corrupt results are never partially
accepted.

## Sink state

The page reads the existing internal M2A sink-state accessor
(`getAppOperationEventSinkStatus().state`) and displays exactly one bounded
label from `disabled | ready | unconfigured | temporarily_unavailable |
misconfigured`. Reading the accessor performs no event RPC, emits no event and
creates no recursive `SINK_UNAVAILABLE` event. No public sink-status route
and no unauthenticated route exist; configuration values and HMAC material
are never displayed.

## UI

- `/admin/operations` is added to the protected admin shell navigation and
  workspace recovery links.
- The page shows a clear heading, a bounded sink-state pill, accessible exact
  category/outcome filter links, accessible paired reference-type/reference
  value search controls, bounded summary metric cards derived only from the
  loaded maximum-200 rows, a compact responsive operations table with
  public-safe labels, and explicit empty, invalid-filter and unavailable
  states with recovery actions.
- No raw Supabase errors, exceptions, response bodies, SQL details or
  configuration values are rendered.

## Components

| Unit | Module |
| --- | --- |
| Query/input parser (server-only) | `app-operation-event-operations-query.ts` |
| Typed Supabase read repository (server-only) | `app-operation-event-operations-repository.ts` |
| Strict row mapper and validation | `app-operation-event-operations-mapper.ts` |
| Bounded derived summary | `app-operation-event-operations-summary.ts` |
| Read orchestrator (session-bound client, workspace config) | `app-operation-event-operations-read.ts` |
| Sink-state display adaptation | `app-operation-event-sink-display.ts` |
| Protected page/shell integration | `app/admin/operations/page.tsx`, `app/admin/protected-admin-shell.tsx` |

## Tests

Focused regressions prove access and workspace isolation, query bounds, exact
filters, paired safe-reference search with zero-query invalids, strict row
mapping with whole-result failure, actor identity minimisation, absence of
forbidden selected/rendered fields, all five sink states without emission,
page/shell rendering states, and static boundary contracts. Existing M1, M2A,
admin-gate, session-bound read, shell and website suites remain green.

## Hard boundaries

No live HMAC configuration, Supabase Cloud, Coolify, deployment, migration
application, schema/RLS/write-RPC/HMAC/category/outcome/M2A call-site change,
event write, public status endpoint, n8n, #301/#309/#310/#312/#315/#321 work,
or PR #318 thread mutation is authorised or performed. M2C and broader
observability work remain separate.
