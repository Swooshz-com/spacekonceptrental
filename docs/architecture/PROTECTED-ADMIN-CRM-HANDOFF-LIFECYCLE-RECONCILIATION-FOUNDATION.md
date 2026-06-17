# Protected Admin CRM Handoff Lifecycle Reconciliation Foundation

## Purpose

This slice adds a protected admin-only CRM handoff lifecycle reconciliation
foundation for queued quote/enquiry records.

The report connects the local queue, CRM review packet manifests, HubSpot CSV
manifests, CSV preflight quality signals, and HubSpot manual import outcome
ledger rows. It is local visibility/readiness only. It helps an authorised
admin see what should happen next, while records remain queued and unchanged.

## Implemented

- A server-only reconciliation helper builds a bounded, allowlisted lifecycle
  report from existing local read models.
- A protected admin POST route returns no-store JSON after the existing admin
  session, trusted workspace binding, `quote.write` CSRF proof, and route gate.
- The route reads queued packet data, recent packet/CSV manifests, recent
  manual import outcome ledger rows, and generated CSV preflight quality
  metadata. It does not write.
- The protected admin quote inbox adds `Run CRM handoff reconciliation` beside
  the JSON packet, CSV preflight, CSV download, and manual outcome actions.
- The admin UI shows aggregate counts, a recommended next action, and bounded
  lifecycle rows containing only quote request ID, public reference, created
  timestamp, local CRM sync status, lifecycle state, related manifest ID,
  latest outcome status, safe issue count, and recommended next action.

## Lifecycle States

- `queued_never_exported`.
- `queued_preflight_needs_review`.
- `queued_csv_exported_no_outcome`.
- `queued_manual_import_reviewed`.
- `queued_manual_import_completed_outside_skr`.
- `queued_manual_import_rejected_needs_correction`.
- `queued_manual_import_partial_needs_follow_up`.
- `stale_manifest_record_missing`.
- `manifest_metadata_mismatch`.

## Recommended Actions

- `run_preflight`.
- `download_csv`.
- `record_manual_outcome`.
- `review_corrections`.
- `follow_up_partial_import`.
- `ready_for_future_sync_design`.
- `no_queued_records`.

## Boundaries

This is protected admin-only.

This is local visibility/readiness only.

Records remain queued.

No HubSpot sync occurs.

No HubSpot API, SDK, OAuth, callback, or webhook is called.

No n8n workflow/runtime is implemented.

No n8n webhook, import, export, workflow, or runtime is called.

No email sending is implemented.

No Google Workspace, Resend, SMTP, or provider email path is called.

No provider IDs are created.

No sync timestamp is set.

The reconciliation does not mutate quote/enquiry rows.

The reconciliation does not mark records synced.

The reconciliation does not create or update CRM contact IDs.

The reconciliation does not create or update CRM deal IDs.

No freeform notes are stored.

Report rows are bounded and allowlisted.

The manual outcome ledger remains metadata-only.

CSV formula-injection protected export behavior remains intact.

CSV export remains formula-injection protected.

The CSV formula-injection protected guard remains intact.

Preflight remains bounded and allowlisted.

The preflight report remains bounded and allowlisted.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

This does not introduce retail transaction, customer-flow expansion,
date-hold, inventory-hold, or completion-like flows.

The report does not include raw customer email, raw customer phone, customer
message details, company/event organisation text, source paths, internal
notes, auth/session/header/cookie data, service-role/private Supabase details,
provider tokens, CRM API responses, CRM contact/deal IDs, or sync attempt
timestamps.

## Validation

The foundation validator checks the server-only helper, protected route, UI
action, tests, docs, package script, release-candidate wiring, controlled
states/actions, no-store JSON route behavior, no provider calls, no writes,
bounded row output, and hard boundaries. It also checks that Docker-dependent
release checks and existing CRM handoff, CSV, preflight, manifest, and manual
outcome validators are not weakened.
