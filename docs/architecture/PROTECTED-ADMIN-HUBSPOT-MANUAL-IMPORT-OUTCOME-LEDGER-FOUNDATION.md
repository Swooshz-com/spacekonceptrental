# Protected Admin HubSpot Manual Import Outcome Ledger Foundation

## Purpose

This slice adds a protected admin-only local HubSpot manual import outcome
ledger for queued quote/enquiry records after admins handle the HubSpot import
CSV outside SKR.

The ledger is local audit/readiness only. It records that an admin reviewed,
completed, rejected, or partially handled a previously generated HubSpot import
CSV manifest. It does not implement HubSpot sync or provider automation.

## Implemented

- A Supabase migration creates
  `public.quote_crm_handoff_manual_import_outcomes` as append-only,
  metadata-only local audit storage.
- The ledger references existing metadata-only `hubspot_import_csv` manifests
  for queued records and stores only workspace, manifest, provider, packet
  kind, controlled outcome status, bounded request ID metadata, recording
  admin user, recording timestamp, and protected-admin source.
- RLS allows authenticated workspace quote managers/admins to select and
  insert ledger rows only when
  `recorded_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)`.
- A server-only helper records controlled outcomes and reads a bounded recent
  outcome list.
- A protected admin POST route uses the existing server-only admin session,
  trusted workspace binding, `quote.write` CSRF proof, and admin route gate
  before appending a local ledger row.
- The protected admin quote inbox shows four controlled actions for CSV
  manifests only and displays a recent local outcome ledger.

## Controlled Outcomes

The only allowed statuses are:

- `manual_import_reviewed`.
- `manual_import_completed_outside_skr`.
- `manual_import_rejected_needs_correction`.
- `manual_import_partial_needs_follow_up`.

No freeform notes are stored.

## Boundaries

This is protected admin-only.

This is local audit/readiness only.

This records controlled outcome status only.

No HubSpot API sync is implemented.

No HubSpot API, SDK, OAuth, callback, or webhook is called.

No n8n workflow/runtime is implemented.

No n8n webhook, import, export, workflow, or runtime is called.

No email sending is implemented.

No Google Workspace, Resend, SMTP, or provider email path is called.

Records remain queued.

Outcome logging does not mutate quote/enquiry rows.

Outcome logging does not mark records synced.

Outcome logging does not set sync attempt timestamps.

Outcome logging does not create provider IDs.

Outcome logging does not create or update CRM contact IDs.

Outcome logging does not create or update CRM deal IDs.

The ledger is metadata-only and bounded.

CSV export remains formula-injection protected.

Preflight remains bounded and allowlisted.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

This does not introduce retail transaction, ecommerce, cart, checkout,
payment, purchase, booking, reservation, stock-reservation, date-hold,
inventory-hold, or completion-like flows.

The ledger does not store CSV contents, full packet JSON, raw customer payload
dumps, customer account data, customer auth data, full customer messages,
freeform notes, provider tokens, HubSpot contact IDs, HubSpot deal IDs,
HubSpot import job IDs, provider responses, sync attempt timestamps,
auth/session/header/cookie data, secrets, webhook URLs, or private Supabase
details.

## Validation

The foundation validator checks the migration, server-only helper, protected
route, admin UI actions, tests, docs, package script, release-candidate wiring,
controlled statuses, append-only RLS shape, metadata-only storage, route-gate
usage, and hard boundaries. It also checks that this slice does not weaken the
existing CRM handoff queue, packet manifest, CSV export, preflight, Supabase
migration, Docker-dependent, public access, or release validators.
