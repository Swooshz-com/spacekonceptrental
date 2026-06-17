# Protected Admin CRM Handoff Packet Audit Manifest Foundation

Related next slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
The HubSpot import CSV export uses this manifest table with
`packet_kind = hubspot_import_csv` and still stores metadata only. It does not
store full CSV contents, full packet JSON, full customer messages, raw payload
dumps, secrets, headers, cookies, sessions, provider tokens, CRM API responses,
or private Supabase details.

Related preflight quality slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
The HubSpot import CSV preflight report is protected admin-only manual import
readiness. It is bounded and allowlisted, creates no audit/manifest row by
default, and leaves records queued. Records remain queued. It does not mutate
quote/enquiry rows, does not mark records synced, does not set sync attempt
timestamps, and does not create/update CRM contact/deal/provider IDs.

Related manual import outcome ledger slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
The ledger stores protected admin-only controlled outcome metadata for existing
HubSpot import CSV manifests after manual handling outside SKR. No freeform
notes are stored. It is local audit/readiness only, records remain queued, and
outcome logging does not mutate quote/enquiry rows, mark records synced, set
sync attempt timestamps, or create provider IDs.

## Purpose

This slice adds protected admin-only audit/manifest metadata for queued CRM
handoff packet generation/export events.

Admin packet generation/export records safe audit/manifest metadata so admins
can see what was prepared for manual review, when it was prepared, and which
bounded filters were used. Manifests are metadata only and do not store full
sensitive payload dumps.

This is audit/manifest preparation only. This is not a CRM replacement.

## Implemented

- A local Supabase table,
  `public.quote_crm_handoff_packet_manifests`, stores bounded manifest
  metadata for protected admin packet preparation.
- The manifest table stores only workspace, provider, packet kind, queued
  status filter, limit, record count, bounded request IDs, generated timestamp,
  protected-admin source, and safe admin identifier metadata.
- Row level security is enabled. Anonymous/public users receive no manifest
  access, and authenticated access is limited by the existing workspace quote
  manager policy.
- The protected admin packet action uses the existing server-only admin session,
  workspace binding, CSRF proof, and route gate path before preparing a packet
  and creating a manifest.
- Manifest creation happens only after successful packet generation/export.
- Recent manifests are read in a bounded list for protected admin visibility in
  the existing quote request inbox packet card.
- Failure copy remains generic and does not expose SQL, provider, token,
  cookie, workspace, request header, raw database object, or stack details.

## Stored Manifest Metadata

The manifest table stores:

- `workspace_id`.
- `provider = hubspot`.
- `packet_kind = json_review_packet`.
- `status_filter = queued`.
- `limit_requested`.
- `record_count`.
- Bounded quote/enquiry request UUIDs in `request_ids`.
- `generated_by_admin_user_id` when available from the protected admin session.
- `generated_at`.
- `source = protected_admin`.

It does not store full packet JSON, full customer messages, full customer
payload dumps, provider credentials, service-role keys, provider tokens, raw
auth/session data, raw request headers/cookies, raw SQL errors, HubSpot
contact/deal IDs as writable export data, sync attempt timestamps as if a sync
occurred, n8n state, email state, or customer-contact workflow state.

## Boundaries

This does not contact the customer.

This does not send email.

This does not sync to HubSpot.

This does not call or queue n8n.

This does not make provider API calls.

This does not create HubSpot contact/deal IDs.

This does not mark records as synced.

This does not set CRM sync attempt timestamps.

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

Supabase remains the SKR app database/auth/backend foundation. HubSpot remains
the future CRM/sales workflow owner, not the SKR app database.

No HubSpot API client, HubSpot contact/deal creation, CRM sync trigger/job,
n8n workflow file, n8n webhook call, Resend integration, Google Workspace
SMTP/API integration, customer account, public login, customer dashboard,
custom CRM, sales notes/activity timeline, sales reminder engine, assignment
workflow, customer notification, credentials, `.env` modification,
service-role browser exposure, provider token, runtime provider call, public
manifest access, synced marking, sync timestamp update, full payload/customer
message dump, or Docker guard weakening is added.
