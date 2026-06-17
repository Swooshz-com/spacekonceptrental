# Protected Admin CRM Handoff Queue Preparation Foundation

Related next slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md`.
Admin users can review/export queued CRM handoff packets for manual
review/export preparation only. This does not sync to HubSpot, call or queue
n8n, send email, contact the customer, create HubSpot contact/deal IDs, mark
records as synced, or set CRM sync attempt timestamps.

Related audit/manifest slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Admin packet generation/export records safe audit/manifest metadata only. This
does not store full sensitive payload dumps, sync to HubSpot, call or queue
n8n, send email, contact the customer, create HubSpot contact/deal IDs, mark
records as synced, or set CRM sync attempt timestamps.

Related HubSpot import CSV slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
Queued records can be exported as a protected admin HubSpot import CSV for
manual import/export readiness only. Export does not change queue state, mark
records as synced, set sync attempt timestamps, or create/update CRM
contact/deal/provider IDs.

Related HubSpot import CSV preflight slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
Queued records can be checked through a protected, bounded, allowlisted manual
import readiness report before CSV download. The preflight report is bounded
and allowlisted. Records remain queued. Preflight does not mutate quote/enquiry
rows, does not mark records synced, does not set sync attempt timestamps, does
not create/update CRM contact/deal/provider IDs, and creates no manifest by
default.

Related HubSpot manual import outcome ledger slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
Admins can append controlled local outcome metadata for a HubSpot import CSV
manifest after manual handling outside SKR. This is protected admin-only and
local audit/readiness only. No freeform notes are stored. Records remain
queued, and outcome logging does not mutate quote/enquiry rows, mark records
synced, set sync attempt timestamps, or create provider IDs.

## Purpose

This slice adds a protected admin-only local queue preparation layer for future
CRM handoff of persisted quote/enquiry requests.

Admin users can locally queue enquiries for future CRM handoff. This is a
preparation foundation only. It does not contact HubSpot, n8n, Google
Workspace, Resend, or customers.

## Implemented

- Protected admin surfaces show the current local CRM handoff state.
- Authorised admins can mark an enquiry `queued` for future CRM handoff.
- Authorised admins can return a queued enquiry to `not_queued`.
- Authorised admins can prepare retry later by moving a `failed` local CRM
  handoff state back to `queued`.
- The protected route accepts only `not_queued`, `queued`, and `failed`.
- The route requires the existing admin authorization, workspace binding, and
  CSRF proof checks for `quote.write`.
- The server-only helper calls only
  `execute_admin_quote_crm_handoff_queue_update` and scopes the update to the
  trusted admin workspace.
- The local CRM handoff payload preview is read-only, bounded, and derived only
  from persisted enquiry fields and safe source metadata.
- CRM contact ID and CRM deal ID placeholders remain read-only and unchanged.
- CRM last sync attempt timestamp remains unchanged because no sync attempt
  happens in this slice.
- Moving from `failed` to `queued` may clear the local CRM sync error so the
  future retry preparation state is clean. It still performs no retry.
- Failure copy is generic and does not expose SQL, provider, token, cookie,
  workspace, or stack details.

## Boundaries

This is not a CRM replacement.

This does not contact the customer.

This does not send email.

This does not sync to HubSpot.

This does not call or queue n8n.

This does not make provider API calls.

This does not create HubSpot contact/deal IDs.

HubSpot CRM sync is still not implemented.

n8n workflows are still not implemented.

Email sending is still not implemented.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

Actual provider sync, n8n webhook trigger, retry worker, provider
callback/reconciliation, assignment, reminders, sales notes/activity timeline,
and outbound contact workflows remain future work unless explicitly implemented
in a later PR.

## Security Notes

No HubSpot API calls, HubSpot SDK, OAuth, token, webhook runtime, n8n workflow,
n8n webhook call, Resend integration, Google Workspace SMTP/API integration,
provider credentials, `.env` changes, service-role browser exposure, public
customer account/login implementation, customer dashboard, custom CRM, sales
activity timeline, reminder engine, assignment workflow, outbound customer
notification, retail transaction flow, date-hold flow, inventory-hold flow, or
Docker guard weakening is added.

Public quote submission remains unable to override CRM provider, CRM sync
status, CRM contact ID, CRM deal ID, CRM last sync attempt timestamp, or CRM
sync error fields.

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
adds a protected admin-only local sync dry-run contract for records already
queued for CRM handoff. The dry-run is local design/readiness only. No HubSpot
API sync, SDK, OAuth, webhook, n8n workflow/runtime, or email sending is
implemented. Records remain queued. The dry-run does not mutate quote/enquiry
rows, mark records synced, set sync attempt timestamps, create provider IDs,
or create/update CRM contact/deal IDs. Dry-run rows are bounded and
allowlisted, and raw customer data is not exposed in row summaries.
