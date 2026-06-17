# Supabase Enquiry Persistence CRM Handoff Foundation

## Purpose

This slice makes the existing SKR quote/enquiry persistence model ready for a
later CRM handoff without adding any provider integration. Public visitors can
continue to submit furniture/event rental enquiries through the existing quote
request path; this PR only extends the local data foundation and contracts.

The public submission integration is documented in
`docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md`.

Protected admin visibility and read-only triage foundation are documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md`.

Protected admin internal triage status updates are documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md`.

Protected admin local CRM handoff queue preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md`.

Protected admin HubSpot import CSV handoff readiness is documented in
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
Supabase stores only metadata-only CSV manifest rows for that export; the
manifest does not store full CSV contents, full packet JSON, full customer
messages, raw payload dumps, secrets, headers, cookies, sessions, provider
tokens, CRM API responses, or private Supabase details.

Protected admin HubSpot import CSV preflight quality readiness is documented in
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
The preflight report is bounded and allowlisted. It is manual import readiness
only, creates no manifest by default, and leaves records queued. Records remain
queued. It does not mutate quote/enquiry rows, does not mark records synced,
does not set sync attempt timestamps, and does not create/update CRM
contact/deal/provider IDs.

Protected admin HubSpot manual import outcome ledger readiness is documented in
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
The outcome ledger is protected admin-only, local audit/readiness only,
metadata-only and bounded. No freeform notes are stored. Records remain
queued, and outcome logging does not mutate quote/enquiry rows, mark records
synced, set sync attempt timestamps, or create provider IDs.

Protected admin CRM handoff packet/export preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md`.
Admin users can review/export queued CRM handoff packets for manual
review/export preparation only. Supabase remains the SKR app
database/auth/backend foundation. HubSpot remains the future CRM/sales workflow
owner. HubSpot CRM sync is still not implemented. n8n workflows are still not
implemented. Email sending is still not implemented. Public customer accounts
remain deferred. Public customer login remains unimplemented. Customer
dashboard remains unimplemented. Custom CRM remains rejected/deferred.

Protected admin CRM handoff packet audit/manifest preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Supabase stores local packet manifest/audit metadata for protected admin packet
generation/export. Manifests are metadata only and do not store full sensitive
payload dumps. This does not sync to HubSpot, call or queue n8n, send email,
contact the customer, create HubSpot contact/deal IDs, mark records as synced,
or set CRM sync attempt timestamps.

## Implemented Foundation

Supabase owns the canonical SKR enquiry submission record.

The existing `quote_requests` and `quote_request_items` tables remain the
app-owned record for public enquiry and quote request submissions. The new
foundation adds source metadata and future CRM handoff tracking fields to
`quote_requests`:

- Source page/path.
- Listing slug or listing id when available.
- Optional submission request id for safe duplicate handling.
- Review/triage metadata for protected admin review.
- CRM provider placeholder.
- CRM sync status placeholder.
- CRM contact/deal id placeholders.
- Last CRM sync attempt timestamp placeholder.
- Bounded CRM sync error placeholder.

CRM fields are placeholders for later handoff tracking.

The TypeScript quote validation and repository contracts now normalize safe
source metadata and default CRM handoff status to `hubspot` /
`not_queued`. The repository still writes only to the approved quote tables and
does not call any external provider.

Public enquiry submissions now use the Supabase persistence foundation through
the existing `/api/quote` route and `createQuoteRequest` repository path. The
public form supplies safe source metadata when available, while public input
cannot override CRM placeholder fields.

Admin users can locally queue enquiries for future CRM handoff. This local
preparation updates only server-owned CRM
handoff readiness fields and does not sync to HubSpot, call or queue n8n, send
email, contact the customer, make provider API calls, or create HubSpot
contact/deal IDs.

## Provider Ownership

HubSpot remains the future CRM and sales workflow owner.

Supabase stores the app-owned enquiry record and future handoff pointers.
HubSpot should own contacts, sales workflow, follow-up tasks, notes, activity
history, and sales reporting only after a separately approved integration
slice.

HubSpot CRM sync is still not implemented.

CRM sync is not implemented in this PR.

n8n workflows are still not implemented.

n8n workflows are not implemented in this PR.

Email sending is still not implemented.

Email sending is not implemented in this PR.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

## Security Boundary

The migration keeps RLS enabled on `quote_requests` through the existing table
policy surface. Anonymous users receive only insert grants for the initial
website enquiry row and the public insert policy requires the initial CRM
state to remain `hubspot` / `not_queued` with no external CRM ids, timestamps,
or error text.

Public users still cannot list, read, update, or remove enquiry records.
Protected admin review remains behind the existing admin authorization
boundaries. No provider credentials, provider URLs, provider tokens, env files,
browser provider calls, or service-role browser exposure are added.

Admin users can now view persisted public enquiries in a protected admin inbox
foundation and inspect source metadata plus CRM placeholder fields for future
triage. This is admin visibility only: HubSpot CRM sync is still not
implemented, n8n workflows are still not implemented, email sending is still
not implemented, public customer accounts remain deferred, public customer
login remains unimplemented, and custom CRM remains rejected/deferred.

Admin users can now update internal enquiry triage status inside protected
admin surfaces. This status update foundation is status-only and cannot alter
CRM provider/status/contact/deal/sync error fields, customer-submitted contact
details, customer message, source metadata, requested item snapshots, or public
reference fields. This does not contact the customer, does not send email, does
not sync to HubSpot, and does not queue n8n. Customer dashboard remains
unimplemented. Google Workspace/domain email remains human/admin email first.
Resend remains optional future transactional email only. Assignment, reminders,
sales notes/activity timeline, and outbound contact workflows remain future
work unless explicitly implemented in a later PR.

## Next Step

A later approved slice can add a protected server-side CRM handoff worker or
automation boundary that reads eligible Supabase enquiry records, creates or
links HubSpot records, and updates only the bounded CRM handoff columns with
sanitized status.
