# Preview Deployment Handoff

No deployment is performed by this PR.

This does not approve deployment.

Future preview deployment requires explicit later approval. This handoff closes
the generic pre-deployment prep lane and gives the operator one place to review
the deploy-candidate state before a separate preview deployment PR.

## Verified Capability Chain

PR #121 merged the latest completed capability, Phase 2P-A/B external preview
smoke harness and rollback drill package, at
`15a5d23941ac7fbe3297792311f50e414d622f5f`.

| PR | Capability | Merge commit |
| --- | --- | --- |
| #117 | Phase 2L-A/B release-candidate acceptance suite and final MVP polish | `aceee2ded00aee41b4e20197091f8527d9e8f8b7` |
| #118 | Phase 2M-A/B preview/deployment review preflight and CI parity hardening | `a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489` |
| #119 | Phase 2N-A/B server runtime configuration hardening and deploy dry-run harness | `ad97aace9c2145af139a45f3e0f2d0b6d09a24a9` |
| #120 | Phase 2O-A/B preview deployment approval package and operator evidence templates | `81431f13836e0b9b182aaca9638ae2e07abd7571` |
| #121 | Phase 2P-A/B external preview smoke harness and rollback drill package | `15a5d23941ac7fbe3297792311f50e414d622f5f` |

## Next-Step Decision Table

| Decision | Meaning | Allowed next action |
| --- | --- | --- |
| Approve preview deployment | Owner explicitly approves a separate preview deployment PR. | Open a deployment PR using the approval packet, handoff, branch-freeze checklist, and operator evidence templates. |
| Hold deployment | Owner decides not to deploy yet. | Keep the branch frozen and wait for a new owner decision. |
| Pivot to product polish | Owner wants content, public UI, or admin workflow polish instead of deployment. | Open a product/content/UI iteration PR that does not bundle generic deployment-prep work. |

## Owner Review Decision Inputs

Before any future launch decision, review `docs/OWNER-REVIEW-READINESS-PACKAGE.md`
and review `docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md`. Use
`docs/content/OWNER-CONTENT-INTAKE.md` for owner-supplied content requirements
and `docs/content/CONTENT-GAP-REGISTER.md` for content gap status. Use
`docs/content/OWNER-REVIEW-ISSUE-LEDGER.md` for owner-review issue categories
and safe status values. Use
`docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md` for the Owner-review
execution checklist and
`docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md` for the Route-by-route
decision matrix. Use `docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md` for the
Owner-review dry-run packet,
`docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md` for the findings
disposition workflow, and
`docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md` for the launch
hold/approve rehearsal. Use
`docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md` for the Owner-review
correction intake,
`docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md` for the
launch-blocker freeze gate, and
`docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md` for the correction PR plan.
Use `docs/content/OWNER-REVIEW-CLOSURE-PACKET.md` for the Owner-review
closure packet,
`docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md` for the readiness
sign-off template, and
`docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md` for deployment
approval separation. Use `docs/content/OWNER-DEMO-WALKTHROUGH.md` for the
Owner-demo walkthrough, public journey review, and protected admin closure
workspace review. Use `docs/content/OWNER-DEMO-ISSUE-BACKLOG.md` for the
Owner-demo issue backlog and product acceptance hardening follow-up template.
Use `docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md` for the local
release-candidate acceptance gate and
`docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md` for the local route inventory
freeze. Local release-candidate acceptance matrix and Local route inventory
freeze materials remain repo-local and template-only. Use
`docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md` for the local
release-candidate command centre and safe local suite sequence. Use
`docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md` for the final local owner
handoff pack, `docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md` for the local
acceptance triage board, and
`docs/content/DEPLOYMENT-DECISION-FIREWALL.md` for the deployment decision
firewall. Use
`docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md` for the
repo-local quote/enquiry workflow acceptance checklist.

What the owner should review:

- Public website journey readiness for homepage, catalogue, listings,
  categories, events, quote/enquiry, detail, and recovery routes.
- Protected admin listing, category, media, quote inbox, and quote detail
  readiness.
- Quote/enquiry intake and admin triage readiness.
- Protected content readiness workspace at `/admin/content-readiness` for
  owner-required content gaps, status separation, launch-blocker review, and
  the admin review snapshot.
- Owner-review execution checklist and Route-by-route decision matrix for
  non-live route-by-route owner/admin decisions.
- Owner-review dry-run packet, findings disposition workflow, and launch
  hold/approve rehearsal for placeholder-only owner/admin review preparation.
- Owner-review correction intake, launch-blocker freeze gate, and correction
  PR plan for placeholder-only future correction routing.
- Owner-review closure packet, readiness sign-off template, and deployment
  approval separation for placeholder-only closure readiness.
- Owner-demo walkthrough for public journey review and protected admin closure
  workspace review.
- Owner-demo issue backlog for product acceptance hardening follow-up.
- Local release-candidate acceptance matrix and local route inventory freeze
  for repo-local public/admin boundary review.
- Local release-candidate command centre for local-only safe command
  orchestration and forbidden-command boundaries.
- Final local owner handoff pack, local acceptance triage board, and deployment
  decision firewall for repo-local owner/operator handoff without deployment
  approval or filled evidence.
- Quote/enquiry workflow acceptance checklist for public quote route,
  listing/category/event handoff, protected admin triage, and internal note
  boundary review without public quote tracking or customer account flows.
- Known deferred capabilities and intentionally not implemented scope.
- Local validation results and any local-only manual QA notes.

What the owner should supply before launch:

- Approved public listing/category content, images, and alt text.
- Approved public-facing contact, availability, operating, legal, and policy
  content if those items are required for launch.
- Reviewed admin access and workspace ownership expectations.
- External provider, environment placement, and public traffic review outcomes
  outside the repo.

What remains blocked until explicit approval:

- Deployment, public traffic enablement, provider configuration, cloud project
  connection, real environment values, filled preview evidence, and production
  evidence.
- Owner-review closure readiness does not approve deployment, preview
  publication, production launch, provider configuration, or live smoke
  testing.
- Browser Supabase, service-role runtime paths, public/customer uploads,
  customer accounts, public quote tracking, notifications, CRM integration,
  n8n/Pinecone runtime changes, `/api/chat` retrieval/RAG wiring, transcript
  runtime paths, and public self-service rental completion flows outside the
  current quote request path.

Owner decision language remains:

- Hold deployment.
- Approve future deployment separately.

Owner content blockers:

- Missing real contact/legal/business-hour content does not get invented.
- Protected content readiness workspace details stay admin-only and do not
  become public route copy or customer-facing issue tracking.
- Public launch cannot proceed until required owner content and explicit
  deployment approval are both supplied.
- Owner review can continue without deployment.

This handoff does not approve deployment and does not perform deployment.

## Required Commands Before Deployment Approval

Run these locally or in CI for the candidate branch before asking for preview
deployment approval:

```powershell
npm run validate:release-candidate
npm run validate:deploy-dry-run
npm run validate:preview-approval-package
npm run validate:preview-smoke-harness
npm run validate:preview-handoff
npm run validate:local-release-candidate
npm run validate:release-candidate-suite
```

## Operator-Only Commands After A Preview Exists

After a separate preview deployment exists and a reviewed external preview URL
has been supplied outside git, the operator may run:

```powershell
npm run smoke:preview
```

`npm run smoke:preview` is operator-only. `SKR_PREVIEW_BASE_URL` must be set
outside git to `<redacted>` from a `<reviewed externally>` preview source. Do
not run live preview smoke in CI.

## External Checks That Stay Outside Git

Record these externally and do not commit filled evidence:

- Preview URL and deployment target review: `<reviewed externally>`.
- Supabase Cloud project/config review: `<reviewed externally>`.
- Vercel project/config review: `<reviewed externally>`.
- Server-only environment value placement: `<redacted>`.
- Admin access and workspace review: `<reviewed externally>`.
- Public listing/category/quote/enquiry smoke evidence: `<reviewed externally>`.
- Rollback drill or rollback target evidence: `<reviewed externally>`.

Do not commit raw URLs, dashboard links, provider IDs, deployment IDs, env
values, secrets, tokens, screenshots containing secret material, customer data,
filled preview evidence, or filled production evidence.

## Stop Doing Generic Deployment-Prep PRs

Stop doing generic deployment-prep PRs after this handoff unless a verified
blocker is discovered. The next useful step should be either explicit preview
deployment approval or a product polish/content/UI iteration.

## What counts as a blocker

- A required validation command fails for a reproducible repo-owned reason.
- A reviewed operator check finds a missing or unsafe deployment approval
  requirement.
- A release-blocking public listing/category/quote/enquiry flow is broken.
- A release-blocking admin listing/image/quote workflow is broken.
- A security boundary is violated, weakened, or missing.
- A required handoff, freeze, approval, or rollback instruction is inaccurate.

## What does not count as a blocker

- A preference for more generic deployment-prep documentation.
- Desire to add new features before preview deployment.
- Product polish that can be handled in a separate product/content/UI PR.
- Optional UI expansion that is not release-blocking.
- Future n8n, Pinecone, RAG, transcript, CRM, notification, customer account,
  public quote tracking, upload, or public self-service rental completion
  ideas.
- Missing live preview evidence before a preview deployment exists.

## Scope Boundaries

This handoff does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add filled evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, change n8n workflows, add Pinecone runtime work, wire
`/api/chat` to retrieval/RAG, add transcript runtime paths, add public uploads,
add customer accounts, add public quote tracking, add notifications, add CRM,
or add public self-service rental completion flows outside the current quote
request path.

Phase 3W-A/B roll-forward: include `docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md` in repo-local acceptance materials for catalogue/listing/media readiness. This does not approve deployment, does not add provider config, does not create evidence, and keeps public catalogue/listing/category/event copy separate from protected admin content-ops readiness wording.


Phase 3X-A/B roll-forward: include `docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md` in repo-local acceptance materials for protected admin write-operation readiness. This does not approve deployment, does not add provider config, does not create evidence, and keeps protected admin write-ops/internal wording out of public routes.
