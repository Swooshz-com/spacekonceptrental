# Protected Admin HubSpot Import CSV Handoff Foundation

Related preflight quality slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
Admins can run protected manual import readiness preflight before downloading
the CSV. Preflight is bounded and allowlisted, does not create manifests,
does not mutate quote/enquiry rows, does not mark records synced, does not set
sync attempt timestamps, and does not create/update CRM contact/deal/provider
IDs. Records remain queued and CSV export remains formula-injection protected.

## Purpose

This slice adds a protected admin-only HubSpot import CSV handoff export
foundation for queued quote/enquiry records.

The CSV export is manual HubSpot import readiness only. It helps authorised
admins download a bounded, allowlisted CSV for manual review before any future
HubSpot import. It does not implement live sync or provider automation.

## Implemented

- A protected admin POST route returns a no-store `text/csv` response for
  queued CRM handoff records only.
- The route uses the existing server-only admin session, trusted workspace
  binding, `quote.write` CSRF proof, and admin route gate before reading data.
- The CSV helper reuses the existing queued CRM handoff packet/read foundation
  and emits only allowlisted manual import review columns.
- CSV fields are escaped for commas, quotes, and newlines.
- CSV cells that begin with `=`, `+`, `-`, `@`, tab, or carriage return are
  prefixed to defend against spreadsheet formula injection.
- A follow-up Supabase migration extends the manifest `packet_kind` constraint
  to allow `hubspot_import_csv`.
- Manifest rows for CSV export store metadata only: workspace, provider,
  packet kind, queued status filter, limit, record count, bounded request IDs,
  generated admin user, generated timestamp, and protected-admin source.
- The protected admin quote inbox keeps the JSON review packet action and adds
  a separate `Download HubSpot import CSV` action.

## CSV Columns

The CSV export includes only these allowlisted columns:

- `Quote Request ID`.
- `Public Reference`.
- `Created At`.
- `Status`.
- `Customer Name`.
- `Customer Email`.
- `Customer Phone`.
- `Company Or Event Organisation`.
- `Message Details`.
- `Source Page Path`.
- `Source Listing Slug`.
- `CRM Provider`.
- `Local CRM Sync Status`.

The CSV output is allowed to contain the bounded customer/enquiry fields above
because it is the protected admin export artifact. The manifest remains
metadata only.

## Boundaries

This is protected admin-only.

This is manual HubSpot import CSV readiness only.

This does not call the HubSpot API, SDK, OAuth, callbacks, or webhooks.

This does not call n8n webhooks, workflows, imports, exports, or runtime.

This does not send email through Google Workspace, Resend, SMTP, or any
provider.

This does not contact customers.

Records remain queued.

This does not mutate quote/enquiry rows.

This does not mark records as synced.

This does not set CRM sync attempt timestamps.

This does not create or update CRM contact IDs.

This does not create or update CRM deal IDs.

This does not create provider IDs.

This does not introduce public customer accounts, public customer login,
customer dashboard, custom CRM features, sales notes, reminders, assignment, or
outbound workflows.

This does not introduce retail transaction, self-service completion,
date-hold, inventory-hold, or completion-like flows.

The manifest does not store full CSV content, full packet JSON, full customer
messages, raw payload dumps, secrets, headers, cookies, sessions, provider
tokens, CRM API responses, or private Supabase details.

HubSpot CRM sync is still not implemented.

n8n workflows are still not implemented.

Email sending is still not implemented.

Supabase remains the SKR app database/auth/backend foundation. HubSpot remains
the future CRM/sales workflow owner, not the SKR app database.

## Validation

The foundation validator checks that the protected route, server-only CSV
helper, admin UI action, tests, docs, package script, release-candidate wiring,
CSV formula-injection protection, and metadata-only manifest extension are
present without provider calls, n8n runtime/webhook use, email sending,
customer account/dashboard/login scope, retail transaction or date-hold creep,
`.env` changes, `website/chat-config.js` changes, Docker guard weakening, or
weakening existing CRM handoff validators.
