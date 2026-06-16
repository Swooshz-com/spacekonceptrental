# Implementation Plan Cut-Down External Services

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
