# Public Enquiry Persistence Integration

## Purpose

This slice wires the public quote/enquiry submission path into the existing
Supabase enquiry persistence and CRM handoff foundation.

Public visitors still use the first-party `/api/quote` route from the existing
quote request form. The route validates the public payload, persists through
the existing quote repository, and returns user-safe success or failure
responses.

## Implemented

Public enquiry submissions now use the Supabase persistence foundation.

- The browser form posts only to `/api/quote`.
- The route uses the merged quote validation contract.
- The route persists through `createQuoteRequest`.
- Safe source metadata is captured when available:
  - `sourcePath`
  - `listingSlug`
  - `requestId`
- Public validation failures return field-level guidance without echoing
  submitted values.
- Repository failures return a generic unavailable response without database,
  provider, stack, environment, or customer details.
- The submit button remains disabled during submission to reduce accidental
  duplicate submits.
- Success copy confirms that the enquiry was received for team review and does
  not promise rental fit or final details.

The repository still owns the safe initial CRM placeholder state:

- `crm_provider = "hubspot"`
- `crm_sync_status = "not_queued"`
- No CRM contact ID.
- No CRM deal ID.
- No sync attempt timestamp.
- No sync error.

Public input cannot override CRM provider, CRM status, CRM IDs, sync timestamp,
or sync error fields because the public validation contract rejects unknown
top-level fields before persistence.

## Not Implemented

HubSpot CRM sync is still not implemented.

HubSpot CRM sync is not implemented.

n8n workflows are still not implemented.

n8n workflows are not implemented.

Email sending is still not implemented.

Email sending is not implemented.

Public customer accounts remain deferred.

Public customer login remains unimplemented.

Customer dashboard remains unimplemented.

Custom CRM remains rejected/deferred.

Google Workspace/domain email remains human/admin email first.

Resend remains optional future transactional email only.

No provider credentials, provider tokens, env files, browser Supabase client,
service-role browser exposure, runtime provider calls, public login, customer
dashboard, or custom sales workflow surface is added.

## Related Foundation

This integration builds on
`docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md`.
Supabase remains the SKR app database, auth, and backend foundation. HubSpot
remains the future CRM and sales workflow owner, not the app database.

Protected admin visibility is documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md`.
Admin users can now view persisted public enquiries in a protected admin inbox
foundation with safe source metadata and CRM placeholder visibility only.
This is not a CRM replacement. HubSpot CRM sync is still not implemented, n8n
workflows are still not implemented, email sending is still not implemented,
public customer accounts remain deferred, public customer login remains
unimplemented, and custom CRM remains rejected/deferred.

Protected admin internal triage status updates are documented in
`docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md`.
Admin users can now update internal enquiry triage status inside protected
admin surfaces. Public quote/enquiry submission cannot override admin triage
status beyond the initial safe `new` state and cannot update CRM handoff
fields. This does not contact the customer, does not send email, does not sync
to HubSpot, and does not queue n8n.
