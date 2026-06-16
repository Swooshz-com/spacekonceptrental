# Supabase Enquiry Persistence CRM Handoff Foundation

## Purpose

This slice makes the existing SKR quote/enquiry persistence model ready for a
later CRM handoff without adding any provider integration. Public visitors can
continue to submit furniture/event rental enquiries through the existing quote
request path; this PR only extends the local data foundation and contracts.

The public submission integration is documented in
`docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md`.

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

## Provider Ownership

HubSpot remains the future CRM and sales workflow owner.

Supabase stores the app-owned enquiry record and future handoff pointers.
HubSpot should own contacts, sales workflow, follow-up tasks, notes, activity
history, and sales reporting only after a separately approved integration
slice.

CRM sync is not implemented in this PR.

n8n workflows are not implemented in this PR.

Email sending is not implemented in this PR.

Public customer accounts remain deferred.

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

## Next Step

A later approved slice can add a protected server-side CRM handoff worker or
automation boundary that reads eligible Supabase enquiry records, creates or
links HubSpot records, and updates only the bounded CRM handoff columns with
sanitized status.
