# Protected Admin CRM Handoff Export Review Packet Foundation Reference

Related implementation slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md`.
Admin users can review/export queued CRM handoff packets for manual
review/export preparation only. HubSpot is the future CRM/sales workflow owner.
HubSpot CRM sync is still not implemented. n8n workflows are still not
implemented. Email sending is still not implemented. Public customer accounts
remain deferred. Public customer login remains unimplemented. Customer
dashboard remains unimplemented. Custom CRM remains rejected/deferred.

Related audit/manifest slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Admin packet generation/export records safe audit/manifest metadata only.
HubSpot is the future CRM/sales workflow owner. This does not sync to HubSpot,
call or queue n8n, send email, contact the customer, create HubSpot
contact/deal IDs, mark records as synced, or set CRM sync attempt timestamps.
Public customer accounts remain deferred, public customer login remains
unimplemented, customer dashboard remains unimplemented, and custom CRM remains
rejected/deferred.

Related HubSpot import CSV slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
The protected CSV export is manual HubSpot import readiness only. It does not
call HubSpot APIs, n8n, or email providers; it does not mutate quote/enquiry
rows, mark records as synced, set sync attempt timestamps, or create/update CRM
contact/deal/provider IDs.

Related HubSpot import CSV preflight slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
The protected preflight report is manual HubSpot import readiness only. It is
bounded and allowlisted, creates no manifest by default, and leaves records
queued. Records remain queued. It does not call HubSpot, n8n, or email
providers, does not mutate quote/enquiry rows, does not mark records synced,
does not set sync attempt timestamps, and does not create/update CRM
contact/deal/provider IDs.

# External Services Auth CRM Email Enquiry Architecture

## Purpose

This architecture review cuts down the SKR implementation plan by assigning
common business capabilities to low-cost/free managed services where they are
stronger than custom code for MVP.

This is architecture and planning only. It does not implement provider
integration, credentials, runtime provider calls, CRM sync code, n8n workflows,
email sending code, public login, public customer accounts, or visitor-facing
runtime behaviour.

Protected admin enquiry inbox and triage foundation is documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md`.
Admin users can now view persisted public enquiries in a protected admin inbox
foundation with source metadata and CRM placeholder visibility only. This is
not a CRM replacement: HubSpot CRM sync is still not implemented, n8n workflows
are still not implemented, email sending is still not implemented, public
customer accounts remain deferred, public customer login remains unimplemented,
custom CRM remains rejected/deferred, Google Workspace/domain email remains
human/admin email first, and Resend remains optional future transactional email
only.

Protected admin enquiry triage status update foundation is documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md`.
Admin users can now update internal enquiry triage status inside protected
admin surfaces. This is not a CRM replacement. This does not contact the
customer. This does not send email. This does not sync to HubSpot. This does
not queue n8n. HubSpot CRM sync is still not implemented. n8n workflows are
still not implemented. Email sending is still not implemented. Public customer
accounts remain deferred. Public customer login remains unimplemented.
Customer dashboard remains unimplemented. Custom CRM remains rejected/deferred.
Google Workspace/domain email remains human/admin email first. Resend remains
optional future transactional email only.

## Recommended Ownership Split

### Supabase Owns

Supabase remains the app database, backend, and admin auth foundation.

- App database.
- Listings.
- Categories.
- Media references.
- Admin auth.
- Admin roles/permissions model.
- Enquiry submission record.
- CRM sync status.
- CRM contact/deal IDs.
- Internal audit/sync metadata.

Supabase is not the CRM replacement. It should keep the app-owned source data
and integration pointers, but it should not become the primary sales workflow,
follow-up, notes, or activity timeline system.

### HubSpot Owns

HubSpot becomes the preferred CRM and sales workflow system for MVP planning.

- Contacts.
- Companies if needed.
- Leads/deals.
- Pipeline stages.
- Sales follow-up tasks.
- Sales/admin notes.
- Activity timeline.
- Sales reporting/dashboard where available.
- Human follow-up workflow.

HubSpot is not the app database. SKR should sync or link enquiry records to
HubSpot only after a later approved integration step, while app listing data,
admin access, audit metadata, and app-local enquiry records stay in Supabase.

### n8n May Own Later

n8n may be used later as optional automation glue, not a required runtime
dependency for the first implementation.

- Low-cost automation glue.
- Supabase-to-HubSpot sync.
- HubSpot-to-Google Workspace notification.
- Retry workflows.
- Internal alerts.
- Non-critical background automations.

n8n should not be required for the public enquiry request path to accept and
record an enquiry in the app. If added later, it should run behind server-side
boundaries and never expose webhook URLs or provider details to the browser.

### Google Workspace/Domain Email Owns

Google Workspace/domain email is the first-line human/admin email channel.

- Normal human business email.
- Manual sales/admin replies.
- Internal team email.
- Basic business mailbox handling.

The MVP should use the existing mailbox workflow before adding app-generated
email. Human replies and team coordination do not need a custom email thread
system inside SKR.

### Resend Is Optional Later

Resend is an optional future transactional email provider only if app-email
delivery, logging, webhooks, bounce tracking, retries, or delivery observability
become necessary.

- Customer confirmation emails.
- App-generated transactional emails.
- Delivery logs.
- Bounce tracking.
- Webhooks.
- Retry/error observability.

Resend is not a mandatory MVP dependency. It should not be introduced before a
real app-email requirement exists.

## MVP Exclusions

SKR must not own at MVP:

- Full public customer accounts.
- Customer dashboard.
- Saved customer quotes.
- Customer profile CRUD.
- Custom CRM pipeline.
- Custom contact database as the primary sales source.
- Custom sales notes/activity timeline.
- Custom email thread tracking.
- Custom sales reminders.
- Custom marketing/email automation.
- Custom password/session/MFA internals beyond managed auth integration.

Public customer accounts are explicitly deferred from MVP unless a real
customer portal requirement is later proven. A public visitor can submit an
enquiry request without receiving an account, saved quote area, or profile
management surface.

Custom CRM build is explicitly rejected/deferred. SKR should not become a
custom CRM when HubSpot already supplies contacts, lead/deal tracking, sales
tasks, notes, activity history, and reporting surfaces.

## Security And Maintenance Risk Reduction

Using managed providers avoids or reduces these custom-build risks:

- Password, session, and MFA internals beyond managed auth integration.
- CRM data model drift between contacts, deals, notes, tasks, and timelines.
- Fragile custom sales reminders and follow-up queues.
- Custom mailbox parsing, thread reconstruction, delivery tracking, and bounce
  handling before there is a proven need.
- Browser exposure of provider secrets, webhook URLs, or service credentials.
- Admin workflow complexity that a mature CRM already covers.
- Support burden for sales dashboards and pipeline reporting.

## Planning Firewall

This review does not approve runtime integration work. Future implementation
steps must still be separately scoped, tested, and approved before adding:

- Supabase Auth runtime wiring.
- HubSpot sync.
- n8n workflows.
- Google Workspace SMTP or email sending.
- Resend email sending.
- Public customer login.
- Customer dashboard.
- Provider clients.
- Provider webhooks.
- Background jobs.
- Scheduler jobs.
- Runtime/API/provider/env/scheduler/chat/RAG/public behaviour changes.

## Supabase Enquiry Persistence And CRM Handoff Foundation

Supabase enquiry persistence and CRM handoff foundation is documented in
`docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md`.
Public enquiry persistence integration is documented in
`docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md`.

Supabase now owns the canonical SKR enquiry submission record in the existing
quote/enquiry tables with source metadata and CRM handoff placeholder fields.
HubSpot remains the future CRM and sales workflow owner.

Public enquiry submissions now use the Supabase persistence foundation through
the first-party quote route. Safe source metadata is captured when available,
and CRM placeholder defaults remain server-owned.

CRM sync is not implemented in this PR.

n8n workflows are not implemented in this PR.

Email sending is not implemented in this PR.

Public customer accounts remain deferred. Custom CRM remains
rejected/deferred.
# Protected Admin CRM Handoff Queue Preparation Reference

Protected admin local CRM handoff queue preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md`.

Supabase remains the SKR app database/auth/backend foundation. HubSpot is the
future CRM/sales workflow owner. Admin users can locally queue enquiries for
future CRM handoff, but HubSpot CRM sync is still not implemented. This does
not call or queue n8n. n8n workflows are still not implemented. Email sending
is still not implemented. Google Workspace/domain email remains human/admin
email first. Resend remains optional future transactional email only. Public
customer accounts remain deferred. Public customer login remains unimplemented.
Customer dashboard remains unimplemented. Custom CRM remains rejected/deferred.
