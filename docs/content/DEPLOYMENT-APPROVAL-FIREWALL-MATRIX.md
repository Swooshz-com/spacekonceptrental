# Deployment Approval Firewall Matrix

This matrix strengthens the existing deployment decision firewall docs without replacing them. It is repo-local, template-only, non-live, and not evidence.

It does not add Vercel config, Supabase Cloud config, provider runtime, live preview smoke, production launch steps, filled owner-review evidence, preview evidence, production evidence, or deployment approval.

## Firewall matrix

| Item | Allowed in this repo-local phase? | Requires owner input? | Requires separate explicit deployment approval? | Evidence allowed? | Forbidden actions |
| --- | --- | --- | --- | --- | --- |
| Local review | Yes, protected and local only. | Yes, when owner facts or decisions are missing. | No deployment approval is granted by local review. | PR summary only; no filled evidence files. | Do not record owner feedback, sign-off, preview evidence, production evidence, or live claims. |
| Local tests | Yes, repo-local commands only. | No, unless failures identify missing owner decisions. | No deployment approval is granted by tests. | Command results in PR summary only. | Do not run deployment commands, live preview smoke, provider commands, or write evidence directories. |
| Local build | Yes, local build only. | No. | No deployment approval is granted by build success. | Command result in PR summary only. | Do not publish build output, deploy artifacts, or configure providers. |
| Local seed/sandbox checks | Yes, only safe local seed/sandbox validation when available. | No, unless sample content needs owner facts. | No deployment approval is granted by sandbox checks. | Command result or environment limitation in PR summary only. | Do not connect Supabase Cloud, mutate production data, use real secrets, or fill production evidence. |
| Owner review rehearsal | Yes, template-only walkthrough preparation. | Yes. | No deployment approval is granted by rehearsal. | Placeholders only. | Do not record owner feedback, owner corrections, owner sign-off, filled review evidence, or preview/production evidence. |
| Owner feedback intake | Template lane only; no feedback is recorded in this phase. | Yes. | No deployment approval is granted by feedback intake. | Empty placeholders only. | Do not invent owner feedback, sign-off, contact facts, business claims, policies, testimonials, awards, guarantees, or operational promises. |
| Preview deployment planning | Blocked before deployment planning. | Yes, if future planning is requested. | Yes, separate explicit deployment approval is required before planning changes become actionable. | Template-only planning placeholders. | Do not add Vercel config, deployment config, provider runtime, live preview smoke, filled preview evidence, or provider credentials. |
| Actual deployment | No. | Yes, but owner input is not enough. | Yes, separate explicit deployment approval is required. | No evidence allowed in this repo-local phase. | Do not deploy, publish, promote, run live preview smoke, change provider config, add secrets, or create filled evidence. |
| Production launch | No. | Yes, but owner input is not enough. | Yes, separate explicit deployment approval is required. | No production evidence allowed. | Do not launch production, claim production readiness, add production policies, run production smoke, mutate live systems, or create production evidence. |
| Provider config | No. | Yes, if future provider details are requested. | Yes, separate explicit deployment approval is required. | No provider evidence allowed. | Do not add or change Vercel config, Supabase Cloud config, environment values, secrets, service-role runtime paths, browser Supabase, n8n runtime, Pinecone runtime, or deployment scripts. |
| Live preview smoke | No. | Yes, if future preview is approved. | Yes, separate explicit deployment approval is required. | No live preview evidence allowed. | Do not run live smoke commands, curl preview URLs, fetch live routes, record preview screenshots, or create filled preview evidence. |
| Filled evidence | No. | Yes, but only in a future approved review/deployment phase. | Yes, separate explicit deployment approval is required for deployment evidence. | Not allowed. | Do not create filled owner-review evidence, preview evidence, production evidence, sign-off, acceptance records, or production claims. |

## Firewall placeholders

- [OWNER INPUT: TBD]
- [OWNER FEEDBACK INTAKE: TEMPLATE ONLY]
- [PREVIEW DEPLOYMENT PLANNING: BLOCKED]
- [ACTUAL DEPLOYMENT: BLOCKED]
- [PRODUCTION LAUNCH: BLOCKED]
- [DEPLOYMENT APPROVAL: NOT GRANTED]
