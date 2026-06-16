# Protected Admin Enquiry Triage Status Update Foundation

## Purpose

This slice adds a protected admin-only foundation for updating an enquiry's
internal triage status from the existing protected admin enquiry inbox and
detail surfaces.

The status update is an internal SKR admin review tool only. It helps admins
track whether an enquiry is new, under review, needs follow-up, quoted, or
closed inside the protected workspace.

## Implemented

Admin users can now update internal enquiry triage status inside protected
admin surfaces.

- The protected admin inbox/detail status control posts only to the protected
  `/api/admin/quote-requests/[quoteRequestId]/status` route.
- The route requires the existing admin authorization, workspace binding, and
  CSRF proof checks for `quote.write`.
- The server-side helper accepts only `new`, `reviewing`,
  `follow_up_needed`, `quoted`, and `closed` as update values.
- The helper scopes the update to the trusted admin workspace and calls the
  existing transactional Supabase RPC boundary.
- Status updates send only the bounded status value. They do not send
  free-form notes or customer-submitted fields.
- The UI shows the current status, prevents double-submit while pending, and
  uses generic failure copy that does not expose SQL, provider, token, cookie,
  workspace, or stack details.
- Success copy is low-noise: `Status updated for admin review.`

## Boundaries

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

No HubSpot API calls, CRM sync trigger/job, n8n workflows, email sending,
Resend integration, Google Workspace integration, customer notifications,
customer accounts, public login, customer dashboard, custom CRM, sales
reminders, assignment workflow, provider credentials, `.env` changes, service
role browser exposure, or Docker guard changes are added.

## Data Safety

The status update cannot alter CRM provider, CRM sync status, CRM contact ID,
CRM deal ID, CRM sync error, customer-submitted contact details, customer
message, source path, source listing slug, requested item snapshots, or public
reference fields.

Public quote/enquiry submission still initializes the safe server-owned state.
Public customer paths cannot update internal triage status and cannot override
admin-only status beyond the initial safe `new` state.
