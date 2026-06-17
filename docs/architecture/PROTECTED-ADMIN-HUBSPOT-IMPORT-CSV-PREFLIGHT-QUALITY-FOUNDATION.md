# Protected Admin HubSpot Import CSV Preflight Quality Foundation

## Purpose

This slice adds a protected admin-only HubSpot import CSV preflight quality
foundation for queued quote/enquiry records.

The preflight report helps authorised admins review whether queued CRM handoff
records look ready for manual HubSpot import CSV export and manual import
review. This is local admin review/readiness only.

Related manual import outcome ledger:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
Admins can record controlled local outcomes after manually handling HubSpot CSV
outside SKR. The ledger is protected admin-only, local audit/readiness only,
metadata-only and bounded. No freeform notes are stored. Records remain
queued, and outcome logging does not mutate quote/enquiry rows, mark records
synced, set sync attempt timestamps, or create provider IDs.

## Implemented

- A server-only preflight helper reads the existing queued CRM handoff packet
  shape and returns a bounded, allowlisted quality report.
- A protected admin POST route returns no-store JSON for queued handoff records
  only.
- The route uses the existing server-only admin session, trusted workspace
  binding, `quote.write` CSRF proof, and admin route gate pattern before
  reading packet data. The route performs no local write.
- The route does not create CRM handoff packet manifests by default.
- The protected admin quote inbox keeps the JSON review packet action and
  `Download HubSpot import CSV` action, and adds `Run CSV import preflight`.
- The admin panel shows a compact summary, bounded row-level issue list, and
  safe generic failure state.
- The CSV export remains formula-injection protected. Cells that begin with
  `=`, `+`, `-`, `@`, tab, or carriage return are detected by preflight and
  sanitised during export.

## Report Shape

The preflight report includes only allowlisted aggregate and row issue summary
fields:

- `generatedAt`.
- `provider = hubspot`.
- `localCrmSyncStatus = queued`.
- `limit`.
- `totalRecordCount`.
- `exportableRecordCount`.
- `needsReviewRecordCount`.
- `duplicateEmailCount`.
- `duplicatePhoneCount`.
- `formulaRiskCellCount`.
- `issueCountsByType`.
- Bounded `rowIssues` with quote request ID, optional public reference, issue
  types, issue count, exportability, and formula-risk cell count.

The report does not include raw customer email, raw customer phone, message
details, company/event organisation text, source paths, internal notes,
auth/session/header/cookie data, service-role/private Supabase details,
provider tokens, CRM API responses, CRM contact/deal IDs, or sync attempt
timestamps.

## Issue Types

The allowlisted issue types are:

- `missing_customer_name`.
- `missing_customer_email`.
- `invalid_customer_email`.
- `missing_customer_phone`.
- `duplicate_customer_email_in_batch`.
- `duplicate_customer_phone_in_batch`.
- `missing_message_details`.
- `message_details_too_long`.
- `missing_public_reference`.
- `missing_created_at`.
- `csv_formula_risk_sanitised`.
- `missing_source_context`.

## Boundaries

Preflight is protected admin-only.

Preflight is manual HubSpot import readiness only.

No HubSpot API sync is implemented.

No HubSpot API, SDK, OAuth, callback, or webhook is called.

No n8n workflow/runtime is implemented.

No n8n webhook, import, export, workflow, or runtime is called.

No email sending is implemented.

No Google Workspace, Resend, SMTP, or provider email path is called.

Records remain queued.

Preflight does not mutate quote/enquiry rows.

Preflight does not mark records synced.

Preflight does not set sync attempt timestamps.

Preflight does not create provider IDs.

Preflight does not create or update CRM contact IDs.

Preflight does not create or update CRM deal IDs.

Preflight does not create audit/manifest rows by default.

Preflight report is bounded and allowlisted.

CSV export remains formula-injection protected.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

This does not introduce retail transaction, date-hold, inventory-hold, or
completion-like flows.

## Validation

The foundation validator checks that the preflight helper, protected route, UI
action, tests, docs, package script, release-candidate wiring, issue types, and
CSV formula-risk alignment are present without provider calls, n8n runtime or
webhook use, email sending, public customer accounts/login/dashboard, custom
CRM scope, env changes, `website/chat-config.js` changes, Docker guard
weakening, or weakening existing CRM handoff packet, CSV, manifest, queue,
persistence, or public access validators.

## Related Lifecycle Reconciliation Foundation

`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-LIFECYCLE-RECONCILIATION-FOUNDATION.md`
connects queued records, metadata-only packet and CSV manifests, CSV preflight
quality metadata, and manual outcome ledger rows for protected admin-only local
visibility/readiness only. Records remain queued. No HubSpot sync occurs. No
n8n workflow/runtime or email sending is implemented. The reconciliation does
not mutate quote/enquiry rows, mark records synced, set sync attempt
timestamps, create provider IDs, or store freeform notes. Report rows are
bounded and allowlisted. The manual outcome ledger remains metadata-only. CSV
export remains formula-injection protected, and preflight remains bounded and
allowlisted.

## Related HubSpot Sync Dry-Run Contract Foundation

`docs/architecture/PROTECTED-ADMIN-HUBSPOT-SYNC-DRY-RUN-CONTRACT-FOUNDATION.md`
uses bounded CSV preflight metadata as one local input to a protected
admin-only sync dry-run contract. The dry-run is local design/readiness only.
No HubSpot API sync, SDK, OAuth, webhook, n8n workflow/runtime, or email
sending is implemented. Records remain queued. The dry-run does not mutate
quote/enquiry rows, mark records synced, set sync attempt timestamps, create
provider IDs, or create/update CRM contact/deal IDs. Dry-run rows are bounded
and allowlisted, and raw customer data is not exposed in row summaries.
