# Local Acceptance Triage Board

This board is repo-local, template-only, non-live, and not evidence.

It defines placeholder lanes for local owner handoff follow-up. It does not
record real issues, owner feedback, owner approval, filled evidence, preview
publication, production launch, provider configuration, or deployment approval.

## Triage Template Fields

| Field | Placeholder |
| --- | --- |
| Triage id | `[TRIAGE ID]` |
| Lane | `[LANE]` |
| Route or area | `[ROUTE / AREA]` |
| Observed item | `[OBSERVED ITEM]` |
| Owner input required | `[OWNER INPUT REQUIRED]` |
| Local follow-up | `[LOCAL FOLLOW-UP]` |
| Status | `[STATUS: OPEN / OWNER INPUT REQUIRED / LOCALLY RESOLVED / DEFERRED / OUT OF SCOPE]` |
| Deployment approval | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

## Triage Lanes

| Lane | Meaning | Allowed local action | Disallowed action | Owner input requirement | Deployment boundary |
| --- | --- | --- | --- | --- | --- |
| Public route polish | Public copy, navigation, recovery, listing, rental, event furniture, quote, enquiry, or request polish. | Record `[LOCAL FOLLOW-UP]` and keep public wording customer-facing. | Do not add internal handoff, release-candidate, firewall, or admin-only wording to public pages. | `[OWNER INPUT REQUIRED]` when facts or claims are missing. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Listing/category/media content | Listing, category, image, and alt-text content readiness. | Record placeholder content gaps and safe local follow-up. | Do not invent real listing facts, images, assurance language, or policies. | `[OWNER INPUT REQUIRED]` for missing content. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Quote/enquiry flow | Public quote/enquiry request expectations and protected admin quote workflow. | Keep receipt-only public expectations and admin-only follow-up notes. | Do not add public quote tracking, customer accounts, notifications, CRM, or self-service completion flows. | `[OWNER INPUT REQUIRED]` if public wording needs owner confirmation. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Protected admin workflow | Protected admin overview, listing/category/media management, quote inbox/detail, and content readiness. | Record protected admin follow-up only. | Do not expose internal notes or handoff details to public users. | `[OWNER INPUT REQUIRED]` if operator ownership or workflow wording is missing. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Owner input required | Missing owner facts, content, policies, contact details, operating expectations, or sign-off. | Keep placeholders and route/area references. | Do not fill with invented facts or claim owner feedback. | `[OWNER INPUT REQUIRED]` | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Local suite failure | A local validator, test, typecheck, build, Supabase check, or n8n validation failure. | Record command-level `[LOCAL FOLLOW-UP]` without evidence files. | Do not claim the suite passed or create filled evidence. | `[OWNER INPUT REQUIRED]` only if the fix needs owner facts. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Future deployment blocker | A blocker that belongs to a later explicitly approved deployment lane. | Keep it separated as `[BLOCKER TYPE]` in local docs/admin only. | Do not run provider, cloud, deployment, live preview smoke, or environment commands. | `[OWNER INPUT REQUIRED]` if the owner must decide scope. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Deferred after launch | Useful future work that does not block current local handoff. | Mark as deferred placeholder only. | Do not implement as part of this phase. | `[OWNER INPUT REQUIRED]` only if future priority is unclear. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |
| Not in current scope | Work excluded by current phase boundaries. | Mark as out of scope. | Do not add public uploads, customer accounts, public tracking, notifications, CRM, n8n/Pinecone/RAG runtime, browser Supabase, service-role runtime paths, or provider config. | `[OWNER INPUT REQUIRED]` only for a future scope change. | `[DEPLOYMENT APPROVAL: NOT GRANTED]` |

## Board Rules

- Keep every row placeholder-only.
- Do not record real issues, owner feedback, owner approval, owner sign-off, or
  deployment approval.
- Do not create evidence files.
- Keep deployment approval as `[DEPLOYMENT APPROVAL: NOT GRANTED]`.
