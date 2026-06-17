# Protected Admin CRM Handoff Export Review Packet Foundation Reference

Related implementation slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md`.
Admin users can review/export queued CRM handoff packets for manual
review/export preparation only. HubSpot CRM sync is still not implemented. n8n
workflows are still not implemented. Email sending is still not implemented.
Public customer accounts remain deferred. Public customer login remains
unimplemented. Customer dashboard remains unimplemented. Custom CRM remains
rejected/deferred.

Related audit/manifest slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Admin packet generation/export records safe audit/manifest metadata only. This
does not store full sensitive payload dumps, sync to HubSpot, call or queue
n8n, send email, contact the customer, create HubSpot contact/deal IDs, mark
records as synced, or set CRM sync attempt timestamps. HubSpot is the future
CRM/sales workflow owner. HubSpot CRM sync, n8n workflows, email sending,
public customer accounts, public customer login, customer dashboard, and custom
CRM remain unimplemented or deferred.

Related HubSpot import CSV slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md`.
CSV export is a protected admin-only manual import/export readiness step. It
does not implement HubSpot sync, n8n runtime, email sending, customer accounts,
custom CRM, retail transaction, date-hold, inventory-hold, or completion-like
flows.

Related HubSpot import CSV preflight slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md`.
Preflight is a protected admin-only manual import readiness report. It is
bounded and allowlisted, creates no manifest by default, and leaves records
queued. Records remain queued. It does not implement HubSpot sync, n8n runtime,
email sending, customer accounts, custom CRM, retail transaction, date-hold,
inventory-hold, or completion-like flows, and does not mutate quote/enquiry
rows or create/update CRM IDs.

Related HubSpot manual import outcome ledger slice:
`docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md`.
The outcome ledger is a protected admin-only local audit/readiness step after
manual HubSpot CSV handling outside SKR. It stores controlled, metadata-only
and bounded outcomes. No freeform notes are stored. Records remain queued.
Outcome logging does not implement HubSpot sync, n8n runtime, email sending,
customer accounts, custom CRM, retail transaction, date-hold, inventory-hold,
or completion-like flows, and does not mutate quote/enquiry rows, mark records
synced, set sync attempt timestamps, or create provider IDs.

# Implementation Plan Cut-Down External Services

## Public Enquiry Persistence Integration

Public enquiry persistence integration is documented in
`docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md`.

Public enquiry submissions now use the Supabase persistence foundation through
the first-party quote route and existing quote repository. Safe source metadata
is captured when available, CRM placeholder defaults remain server-owned, and
public input cannot override CRM handoff fields.

HubSpot CRM sync is not implemented.

n8n workflows are not implemented.

Email sending is not implemented.

Public customer accounts remain deferred.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

## Protected Admin Enquiry Inbox Triage Foundation

Protected admin enquiry inbox and triage foundation is documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md`.

Admin users can now view persisted public enquiries in a protected admin inbox
foundation, inspect safe source metadata, and see CRM handoff placeholder
fields for future HubSpot review.

This is not a CRM replacement.

HubSpot CRM sync is still not implemented.

n8n workflows are still not implemented.

Email sending is still not implemented.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

Status update/assignment/remediation/contact workflows remain future work
unless explicitly implemented in a later PR.

## Protected Admin Enquiry Triage Status Update Foundation

Protected admin enquiry triage status update foundation is documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md`.

Admin users can now update internal enquiry triage status inside protected
admin surfaces.

This is not a CRM replacement.

This does not contact the customer.

This does not send email.

This does not sync to HubSpot.

This does not queue n8n.

HubSpot CRM sync is still not implemented.

n8n workflows are still not implemented.

Email sending is still not implemented.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

Assignment, reminders, sales notes/activity timeline, and outbound contact
workflows remain future work unless explicitly implemented in a later PR.

## Purpose

The Phase 6 readiness ladder is paused after Phase 6P-A/B so SKR can reduce
the implementation plan before adding more readiness-only work. The MVP should
use existing low-cost/free services where they remove custom build work,
security risk, maintenance load, and admin workflow complexity.

This is an architecture/planning package only. It does not implement provider
integration, provider credentials, runtime provider calls, CRM sync code, n8n
workflows, email sending code, public customer accounts, public login, or
visitor-facing runtime behaviour.

## Features To Keep In SKR

- Public furniture/event rental listing browsing.
- Listing, category, and media-reference management.
- Enquiry submission UX.
- First-party enquiry submission record in Supabase.
- Admin auth and admin roles/permissions model through managed auth.
- Admin review of listing and enquiry data.
- CRM sync status and external IDs after a later approved sync step.
- Internal audit/sync metadata for app-owned state.
- Server-side provider boundaries when later integrations are approved.

## Features To Outsource

| Area | Provider | Reason |
| --- | --- | --- |
| App database/backend/admin auth foundation | Supabase | Keeps app-owned records, RLS, managed auth, and backend data access in one low-cost foundation. |
| Contacts, leads/deals, sales stages, tasks, notes, activity timeline, and sales reporting | HubSpot | Avoids rebuilding CRM and sales workflow capabilities that already exist on a mature low-cost/free tier. |
| Human business email and internal team email | Google Workspace/domain email | Uses the existing mailbox and admin reply process before adding app-email complexity. |
| Optional automation glue | n8n | Can later connect Supabase, HubSpot, Google Workspace, and alerts without making automation a required first runtime dependency. |
| Optional transactional email | Resend | Can later handle app-generated confirmations, logs, bounces, webhooks, and delivery observability only if needed. |

## Features To Defer

- Public customer accounts.
- Customer dashboard.
- Saved customer quotes.
- Customer profile CRUD.
- HubSpot sync implementation.
- n8n automation workflows.
- App-generated customer confirmation email.
- Resend delivery logs, bounce tracking, and webhooks.
- Custom retry/error observability for outbound email.
- Background/scheduler jobs.
- Any customer portal requirement until proven by owner review.

## Features To Explicitly Not Build

- Custom CRM pipeline.
- Custom contact database as the primary sales source.
- Custom sales notes/activity timeline.
- Custom sales reminders.
- Custom marketing/email automation.
- Custom email thread tracking.
- Custom password/session/MFA internals beyond managed auth integration.
- Public login without a proven customer portal requirement.
- Provider-specific browser calls or browser-exposed provider details.

## Security Risks Avoided

- Storing or exposing provider secrets in browser code.
- Building custom password/session/MFA internals.
- Authorizing public users to manage profiles or saved quote state before a
  portal need exists.
- Maintaining a custom CRM permission model.
- Recreating sales tasks, notes, timeline, and reporting in app tables.
- Handling app-generated email delivery, bounces, and retry visibility before
  there is a clear operational need.
- Making n8n a required dependency for basic enquiry intake.

## Low-Cost/Free Justification

- Supabase remains the app database/auth/backend foundation already selected
  for this repo.
- HubSpot provides CRM contact, lead/deal, pipeline, task, notes, timeline, and
  reporting surfaces on a low-cost/free path that is safer than a custom CRM.
- Existing Google Workspace/domain email already handles human replies and team
  coordination.
- n8n can provide low-cost glue later, only for non-critical background
  automations.
- Resend can remain unused until app-generated transactional email creates a
  real delivery/logging/webhook requirement.

## MVP Decisions

| Decision | MVP Direction |
| --- | --- |
| Supabase | MVP decision: Supabase remains app DB/auth/backend foundation. |
| HubSpot | MVP decision: HubSpot is preferred CRM. |
| n8n | MVP decision: n8n is optional glue, not required for first implementation. |
| Google Workspace/domain email | MVP decision: Google Workspace email first; use normal business/admin email before app-generated email. |
| Resend | MVP decision: Resend optional later as transactional email only. |
| Public customer accounts | MVP decision: no public customer accounts yet. |
| Custom CRM | MVP decision: no custom CRM. |

## Implementation Impact

The next implementation plan should cut down custom SKR scope to app-owned
listings, admin access, enquiry records, and safe provider boundaries. It
should not add customer portal work, custom CRM screens, custom sales timeline
storage, app-email delivery, or automation runtime dependencies until a later
approved phase proves the need.

Phase 6P-A/B remains the latest completed readiness ladder phase. The current
planning focus is external-services architecture and implementation-plan
reduction for auth, CRM, email, and enquiry persistence.

## First Foundation Slice

Supabase enquiry persistence and CRM handoff foundation is the first
implementation-foundation slice after the external-services architecture
pivot. It is documented in
`docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md`.

Supabase owns the canonical SKR enquiry submission record and now stores safe
source metadata plus CRM handoff placeholders on the existing quote/enquiry
record. HubSpot remains the future CRM and sales workflow owner.

CRM sync is not implemented in this PR.

n8n workflows are not implemented in this PR.

Email sending is not implemented in this PR.

Public customer accounts remain deferred. Custom CRM remains
rejected/deferred.
# Protected Admin CRM Handoff Queue Preparation Reference

Protected admin local CRM handoff queue preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md`.

Admin users can locally queue enquiries for future CRM handoff. This is not a
CRM replacement and does not change the cut-down external-services plan:
HubSpot remains the future CRM/sales workflow owner, n8n remains optional
future automation glue, Google Workspace/domain email remains human/admin email
first, and Resend remains optional future transactional email only. HubSpot CRM
sync is still not implemented. n8n workflows are still not implemented. Email
sending is still not implemented. Public customer accounts remain deferred.
Public customer login remains unimplemented. Customer dashboard remains
unimplemented. Custom CRM remains rejected/deferred.
