# Protected Admin CRM Handoff Export Review Packet Foundation Reference

Related implementation slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md`.
Admin users can review/export queued CRM handoff packets from protected admin
surfaces only. Public quote/enquiry paths cannot access the packet. HubSpot CRM
sync is still not implemented. n8n workflows are still not implemented. Email
sending is still not implemented. Public customer accounts remain deferred.
Public customer login remains unimplemented. Customer dashboard remains
unimplemented. Custom CRM remains rejected/deferred.

Related protected admin audit/manifest slice:
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md`.
Admin packet generation/export records safe audit/manifest metadata only. This
does not store full sensitive payload dumps, sync to HubSpot, call or queue
n8n, send email, contact the customer, create HubSpot contact/deal IDs, mark
records as synced, or set CRM sync attempt timestamps.

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

## Atomic Submission And Replay Contract

`requestId` is mandatory for public quote submissions. The browser uses a
cryptographic UUID when available and does not synthesize a time- or
`Math.random`-based fallback; the route rejects a missing or invalid identifier
before persistence.

The server-only repository calls `public.submit_public_quote_request` with the
parent record, all item snapshots, a fresh handoff claim token, and a
short-lived HMAC admission proof issued with the dedicated server-only
`QUOTE_SUBMISSION_ADMISSION_SECRET`. The proof is purpose-separated and bound
to the configured workspace, submission identity, canonical database payload
digest, and expiry. The durable RPC validates it against signing material held
in the private database schema before invoking the unchanged atomic persistence
implementation. A caller with only the browser-facing anon key can compute the
canonical digest but cannot forge admission. The migration gives `anon`
execute access only to the proof-gated `SECURITY DEFINER` submission RPC and
the claim-bound `public.finalize_public_quote_handoff` RPC. Both set
`search_path = ''`, fully qualify relations, validate the active workspace,
and return no private customer data on replay. `public` and `authenticated`
cannot execute either mutation function.

The trusted database source for quote capture is the private
`quote_public_workspace_config` singleton. Both submit and finalize validate
against it and require its referenced workspace to remain active. It is
independent from `catalogue_public_workspace_config`: catalogue workspace A
and quote workspace B are valid, as is an explicit configuration where both
use the same workspace. The server-only `QUOTE_WORKSPACE_ID` must match the
quote singleton; an anonymous caller cannot select an arbitrary workspace.

The migration explicitly revokes every historical anonymous table-level and
column-level INSERT grant on `quote_requests` and `quote_request_items`, plus
anonymous UPDATE and DELETE. RLS stays enabled as defense in depth. Anonymous
and authenticated callers have no direct access to the private
`quote_handoff_outbox` table.

Direct delivery-log INSERT is revoked from `PUBLIC`, `anon`, and
`authenticated`. The finalizer validates the exact current unexpired claim and
atomically creates the trusted delivery record with the outbox transition.
Exact completed retries are safely rejected by the no-longer-claimed outbox,
so conflicting status/provider metadata cannot overwrite trusted history.

Quote parent, items, and initial pending-handoff eligibility commit atomically.
A matching retry returns the original quote ID/reference and evaluates the
durable handoff state rather than using `wasCreated` as eligibility. The
outbox state is `pending`, `claimed`, `retryable_failed`, or `completed`:

- an eligible retry acquires one five-minute claim lease;
- concurrent retries observe a live claim as `in_progress` and do not send;
- outbound failure records `retryable_failed` and can be retried immediately;
- a process exit while claimed is recoverable after lease expiry;
- completed submissions replay without another outbound request; and
- a reused submission identifier with a changed payload fails without mutation.

The browser prevents that mismatch from becoming a retry loop by storing a
canonical snapshot alongside the attempted key. The identity includes trimmed
contact, event, message, and venue fields, normalized optional values, source
path/listing metadata, and normalized item names, quantities, and notes.
Unchanged payloads reuse the existing key, including after an uncertain
network response. Material edits receive a new key and become a distinct
enquiry. UI-only state does not rotate the key. The earlier pending handoff
remains intact and recoverable; starting an edited submission never cancels or
deletes it.

The route returns success only after a successful n8n acceptance and durable
completion record, or when replay finds an already completed handoff. Other
states return a generic retryable response, so the browser retains the same
submission key. A process exit after the database commit but before outbound
delivery therefore cannot permanently strand the enquiry.

The outbound contract carries the stable key `quote-enquiry:<quote-id>` in the
payload and `x-skr-idempotency-key` header. The checked-in n8n workflow remains
an inactive readiness template whose idempotency gate is a placeholder. It
does not currently prove external exactly-once delivery. Delivery is therefore
at-least-once: a crash after n8n accepts the request but before completion is
recorded can cause one later duplicate attempt. Durable n8n-side enforcement
of the stable key is required before activation. Public failures remain
generic and expose no database, provider, workflow, or customer details. The
migration is not applied in this repository slice, and no live Supabase or n8n
action is authorized.
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
# Protected Admin CRM Handoff Queue Preparation Reference

Protected admin local CRM handoff queue preparation is documented in
`docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md`.

Public quote/enquiry submission cannot override CRM handoff status, provider,
contact ID, deal ID, sync timestamp, or sync error fields. Admin users can
locally queue enquiries for future CRM handoff only inside protected admin
surfaces. This does not sync to HubSpot, call or queue n8n, send email, contact
the customer, make provider API calls, or create HubSpot contact/deal IDs.
Public customer accounts remain deferred. Public customer login remains
unimplemented. Customer dashboard remains unimplemented. Custom CRM remains
rejected/deferred.
