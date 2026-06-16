# Protected Admin Enquiry Inbox Triage Foundation

## Purpose

This slice adds protected admin visibility for persisted public
quote/enquiry submissions. Admin users can view recent enquiries in the
existing protected quote request inbox and inspect a selected enquiry detail
view without adding provider sync, outbound messaging, public customer access,
or a custom CRM surface.

The implementation builds on
`docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md` and
`docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md`.

## Implemented

Admin users can now view persisted public enquiries in a protected admin inbox
foundation.

- The existing protected admin shell links to `/admin/quotes`.
- `/admin/quotes` shows recent workspace-scoped quote/enquiry requests.
- `/admin/quotes/[quoteRequestId]` shows a protected detail view for one
  selected enquiry.
- Admin reads stay server-side through the existing session-bound Supabase
  admin read client.
- Public users cannot list, read, update, or delete enquiries through this
  protected admin surface.
- The inbox uses the existing newest-first, bounded admin query pattern.
- Empty and unavailable states remain generic and do not expose SQL, provider,
  environment, workspace, token, or customer internals.

The inbox and detail view may show, when present:

- Enquiry/request ID through the protected detail link.
- Public reference.
- Submission timestamp.
- Current enquiry status.
- Customer name.
- Customer email.
- Phone.
- Requested listing slug or submitted listing/source context.
- Safe source path.
- Message/details preview or full submitted details.
- Requested listing/item snapshots.
- CRM provider placeholder, expected `hubspot`.
- CRM sync status placeholder, expected initial `not_queued`.
- CRM contact/deal IDs only if already present in future data.

CRM placeholder visibility is read-only. This PR does not create CRM contact
or deal IDs.

## Boundaries

This is not a CRM replacement.

HubSpot CRM sync is still not implemented.

n8n workflows are still not implemented.

Email sending is still not implemented.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

New status update, assignment, remediation, customer contact, CRM push,
automation handoff, sales notes, activity timeline, customer account linking,
and customer portal workflows remain future work unless explicitly implemented
in a later PR. Existing protected quote follow-up status controls remain
admin-only and are not public tracking.

## Security Notes

No provider credentials, provider tokens, env files, service-role browser
exposure, browser Supabase access to private enquiry data, runtime provider
calls, or deployment changes are added.

Supabase remains the SKR app database, auth, and backend foundation. HubSpot
remains the future CRM and sales workflow owner, not SKR's app database.
