# Protected Admin CRM Handoff Export Review Packet Foundation

Related CSV handoff slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
The CSV export is protected admin-only manual HubSpot import readiness. Records
remain queued; it does not call HubSpot, call or queue n8n, send email, mutate
quote/enquiry rows, mark records as synced, set sync attempt timestamps, or
create/update CRM contact/deal/provider IDs.

Related CSV preflight quality slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
Admins can run a protected, bounded, allowlisted manual import readiness
preflight before downloading CSV. The preflight report is bounded and
allowlisted. It creates no manifest by default, leaves records queued, does not
mutate quote/enquiry rows, does not mark records synced, does not set sync
attempt timestamps, and does not create/update CRM contact/deal/provider IDs.

Related manual import outcome ledger slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
Admins can record controlled local outcomes for HubSpot import CSV manifests
after manual import handling outside SKR. The ledger is protected admin-only,
local audit/readiness only, metadata-only and bounded. No freeform notes are
stored. Records remain queued, and outcome logging does not mutate
quote/enquiry rows, mark records synced, set sync attempt timestamps, or create
provider IDs.

## Purpose

This slice adds a protected admin-only CRM handoff packet preview/export
foundation for persisted quote/enquiry requests that are already locally
queued for future CRM handoff.

Admin users can review/export queued CRM handoff packets. This is manual
review/export preparation only. It does not contact HubSpot, n8n, Google
Workspace, Resend, or customers.

Related audit/manifest slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Admin packet generation/export records safe audit/manifest metadata. Manifests
are metadata only and do not store full sensitive payload dumps.

## Implemented

- Protected admin surfaces show an eligible queued-record count.
- Authorised admins can prepare a bounded JSON packet preview from the
  protected admin quote request inbox through the existing `quote.write`
  CSRF/session-bound admin action because manifest creation is a local audit
  write.
- The server-only packet helper reads only `crm_provider = "hubspot"` and
  `crm_sync_status = "queued"` records by default.
- The protected packet route requires the existing admin authorization, trusted
  workspace gate, and CSRF proof checks for `quote.write`.
- After successful packet generation/export, the protected route records a
  metadata-only audit/manifest row and returns a bounded recent manifest list
  for admin visibility.
- The packet is newest-first, workspace-scoped, and limited to a safe default
  and maximum.
- The packet uses an explicit allowlist of enquiry/request ID, public
  reference, created timestamp, internal enquiry status, customer contact
  fields, company/event organisation when present, bounded message/details,
  safe source metadata, future provider, and local CRM handoff status.
- Failure copy is generic and does not expose SQL, provider, token, cookie,
  workspace, request header, raw database object, or stack details.

## Boundaries

This is not a CRM replacement.

This does not contact the customer.

This does not send email.

This does not sync to HubSpot.

This does not call or queue n8n.

This does not make provider API calls.

This does not create HubSpot contact/deal IDs.

This does not mark records as synced.

This does not set CRM sync attempt timestamps.

This does not store full sensitive payload dumps in manifest storage.

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
notification, retail transaction flow, self-service completion flow,
date-hold flow, inventory-hold flow, completion-like flow, or Docker guard
weakening is added.

Public quote submission remains unable to override CRM provider, CRM sync
status, CRM contact ID, CRM deal ID, CRM last sync attempt timestamp, or CRM
sync error fields.
