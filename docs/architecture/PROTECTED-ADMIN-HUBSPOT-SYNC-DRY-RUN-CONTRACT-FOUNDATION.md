# Protected Admin HubSpot Sync Dry-Run Contract Foundation

## Purpose

This slice adds a protected admin-only HubSpot sync dry-run contract foundation
for queued quote/enquiry records.

Admins can generate a bounded local dry-run report showing which records would
be eligible for future HubSpot sync design and what safe payload shape would be
prepared. This is local design/readiness only. It is not provider sync.

## Implemented

- A server-only dry-run helper builds a bounded, allowlisted report from the
  queued CRM handoff packet/read result, lifecycle reconciliation report, CSV
  preflight metadata, recent HubSpot CSV manifests, and recent manual import
  outcome ledger rows.
- A deterministic future idempotency key is generated only in the local
  report using `skr_quote_request:<workspace_id>:<quote_request_id>:hubspot`.
  It is not stored in the database.
- A protected admin POST route returns no-store JSON after the existing admin
  session, trusted workspace binding, `quote.write` CSRF proof, and route gate.
  The established protected admin action proof currently uses `quote.write`
  even for local readiness actions that do not write quote/enquiry rows.
- The protected admin quote inbox adds `Run HubSpot sync dry-run` beside the
  JSON packet, CSV preflight, lifecycle reconciliation, manual outcome, and
  HubSpot import CSV actions.
- The admin UI shows aggregate counts, a recommended next action, bounded
  dry-run rows, and safe payload-shape preview metadata for eligible rows.

## Dry-Run States

- `eligible_for_future_sync`.
- `blocked_preflight_needs_review`.
- `blocked_missing_required_contact_field`.
- `blocked_rejected_needs_correction`.
- `blocked_partial_needs_follow_up`.
- `blocked_no_manual_outcome`.
- `blocked_stale_manifest`.
- `blocked_manifest_metadata_mismatch`.

## Recommended Actions

- `fix_preflight_issues`.
- `record_manual_outcome`.
- `review_reconciliation`.
- `review_dry_run_payload`.
- `ready_for_provider_credentials_design`.
- `no_eligible_records`.

## Payload Preview

Eligible dry-run rows may include a `payloadPreview` object. It is clearly
local dry-run only and uses controlled safe shape metadata:

- `futureContactProperties`: field names and mapping/presence policy only.
- `futureDealProperties`: field names and mapping/presence policy only.
- `futureAssociations`: controlled values such as `contact_to_deal`.
- `futureIdempotencyKey`: deterministic local future contract key only.

Dry-run row summaries do not include raw customer name, raw customer email,
raw customer phone, full customer message, full CSV body, full packet JSON,
internal notes, freeform notes, provider responses, HubSpot contact IDs,
HubSpot deal IDs, sync attempt timestamps, auth/session/header/cookie data,
provider tokens, or secrets.

## Boundaries

Sync dry-run is protected admin-only.

Sync dry-run is local design/readiness only.

No HubSpot API sync is implemented.

No HubSpot API, SDK, OAuth, callback, or webhook is implemented.

No n8n workflow/runtime is implemented.

No n8n webhook, import, export, workflow, or runtime is called.

No email sending is implemented.

No Google Workspace, Resend, SMTP, or provider email path is called.

No provider credentials are introduced.

Records remain queued.

Dry-run does not mutate quote/enquiry rows.

Dry-run does not mark records synced.

Dry-run does not set sync attempt timestamps.

Dry-run does not create provider IDs.

Dry-run does not create or update CRM contact IDs.

Dry-run does not create or update CRM deal IDs.

Dry-run rows are bounded and allowlisted.

Raw customer data is not exposed in dry-run row summaries.

Manual outcome ledger remains metadata-only.

Lifecycle reconciliation remains local visibility only.

CSV export remains formula-injection protected.

Preflight remains bounded and allowlisted.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

This does not introduce retail transaction, ecommerce, cart, checkout,
payment, purchase, booking, reservation, stock-reservation, date-hold,
inventory-hold, or completion-like flows.

## Validation

The foundation validator checks the server-only helper, protected route, UI
action, tests, docs, package script, release-candidate wiring, controlled
dry-run states/actions, future idempotency key contract, no provider calls, no
n8n runtime, no email sending, no quote/enquiry mutation, no synced marking,
no sync timestamp updates, no CRM ID creation/update, bounded allowlisted rows,
no raw customer data in dry-run row summaries, no provider credentials or env
files, no `website/chat-config.js` changes, no Docker guard changes, and no
weakening of existing CRM handoff packet, CSV, preflight, manifest, manual
outcome, lifecycle, or public access validators.
