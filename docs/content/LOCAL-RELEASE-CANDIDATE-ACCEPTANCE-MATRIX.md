# Local Release-Candidate Acceptance Matrix

This matrix is repo-local, template-only, non-live, and not evidence.

It gives reviewers a deterministic local checklist for the current
furniture/event rental website candidate. It does not record manual QA, owner
review, preview evidence, production evidence, or deployment approval.

## Boundary

- Public pages must stay customer-facing and use listing, enquiry, quote,
  request, rental, and event furniture wording.
- Owner-demo, internal review, protected admin, route inventory, release gate,
  and deployment approval notes belong only in docs or protected admin
  surfaces.
- Missing real contact, legal, policy, business-hour, service-area, proof-like
  public claims, named-client, or assurance content remains owner input
  required and must not be invented.
- Provider configuration, live smoke checks, preview publication, and launch
  work require separate explicit future approval.

## Public route inventory

Use this section for public route groups only.

| Field | Placeholder |
| --- | --- |
| Route | `[ROUTE]` |
| Audience | `[PUBLIC / PROTECTED ADMIN]` |
| Route purpose | `[PURPOSE]` |
| Allowed public wording | Listing, enquiry, quote, request, rental, event furniture |
| Forbidden public wording | Owner-demo, internal review, protected admin, issue backlog, route inventory, release gate, deployment approval, status-tracking, account, reservation, fulfilment, or self-service completion wording |
| Data boundary | `[DATA BOUNDARY]` |
| Owner input status | `[OWNER INPUT REQUIRED]` |
| Deployment boundary | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Acceptance status placeholder | `[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]` |
| Follow-up placeholder | `[LOCAL FOLLOW-UP]` |

## Protected admin route inventory

Use this section for protected admin route groups only.

| Field | Placeholder |
| --- | --- |
| Route | `[ROUTE]` |
| Audience | `[PUBLIC / PROTECTED ADMIN]` |
| Route purpose | `[PURPOSE]` |
| Allowed admin wording | Protected listing management, quote workflow, content readiness, owner input, local release review, route inventory, acceptance matrix |
| Forbidden public wording | Admin-only details must not move into public pages |
| Data boundary | `[DATA BOUNDARY]` |
| Owner input status | `[OWNER INPUT REQUIRED]` |
| Deployment boundary | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Acceptance status placeholder | `[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]` |
| Follow-up placeholder | `[LOCAL FOLLOW-UP]` |

## Route Purpose

- `[ROUTE]`
- `[PURPOSE]`
- `[PUBLIC / PROTECTED ADMIN]`
- `[DATA BOUNDARY]`
- `[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]`
- `[OWNER INPUT REQUIRED]`
- `[LOCAL FOLLOW-UP]`
- `[DEPLOYMENT APPROVAL: NOT GRANTED]`

Do not replace these placeholders with real acceptance evidence in this phase.
