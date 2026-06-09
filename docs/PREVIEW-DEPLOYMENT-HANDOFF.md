## Phase 4F-A/B Owner Handoff Bundle References

Current phase: Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center.

Latest completed capability: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate.

Last merged capability PR: #153.

Last merged capability merge commit: 0e5379d21edd9ee67b9f929a3ba8e217d51ed17f.

Phase 4F-A/B adds a repo-local owner-facing review brief, blank owner approval issue template, no-deploy preflight command center, owner handoff bundle index, validate:owner-handoff-bundle validator, and protected admin Phase 4F handoff-bundle snapshot. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4F-A/B references `docs/content/OWNER-FACING-REVIEW-BRIEF.md`, `.github/ISSUE_TEMPLATE/owner-approval-request.md`, `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, and `scripts/validate-owner-handoff-bundle.cjs`.

No deployment is performed or approved by Phase 4F-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

# Preview Deployment Handoff

## Phase 4E-A/B Owner Approval Request Gate References

Current phase: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate.

Latest completed capability: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure.

Last merged capability PR: #152

Merge commit: `10950d11ca6c40580982f35e615b3cf063f58a49`

Phase 4E-A/B adds a repo-local owner approval request packet, preview-planning handoff template, final no-deploy decision gate, validate:owner-approval-request validator, and protected admin Phase 4E approval-request snapshot. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4E-A/B references `docs/content/OWNER-APPROVAL-REQUEST-PACKET.md`, `docs/content/PREVIEW-PLANNING-HANDOFF-TEMPLATE.md`, `docs/content/FINAL-NO-DEPLOY-DECISION-GATE.md`, and `scripts/validate-owner-approval-request.cjs`.

No deployment is performed or approved by Phase 4E-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Previous Current Phase 4D-A/B status:


## Phase 4D-A/B Local Release-Candidate Freeze References

Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure.

Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.

Last merged capability PR: #151

Merge commit: `9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336`

Phase 4D-A/B adds a repo-local local release-candidate freeze, full-suite reliability gate, deployment-planning firewall closure, validate:local-freeze validator, full website test-suite reliability hardening, and protected admin Phase 4D local-freeze snapshot. These controls are template-only, non-live, not evidence, and do not record owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4D-A/B references `docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md`, `docs/content/FULL-SUITE-RELIABILITY-GATE.md`, `docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md`, and `scripts/validate-local-freeze.cjs`.

No deployment is performed or approved by Phase 4D-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.


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


Phase 3Y-A/B protected admin destructive-action safeguard references: `docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md`, `docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md`, and `docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md`. These are repo-local, template-only, non-live, not evidence, and do not approve deployment. Last merged capability PR: #146. Merge commit: `50316a5c4052607487ba7409d5dc854889db6e24`. Current phase: Phase 3Y-A/B - protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage. Latest completed capability: Phase 3X-A/B protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage.

## Phase 3Z-A/B Public Route Readiness Closure References

- Current phase: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage.
- Latest completed capability: Phase 3Y-A/B protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage.
- Last merged capability PR: #147.
- Merge commit: `7f422fd47ffa75cf982bd4f9d859b530a96961ad`.
- Public journey readiness closure: `docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md`.
- Quote/enquiry public expectation boundary: `docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md`.
- Protected admin public-review bridge: `docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md`.
- Safety: repo-local, template-only, non-live, not evidence, no deployment approval, no provider setup, no ecommerce/payment/order/checkout flow, no fake facts, and no filled owner-review, preview, or production evidence.

## Phase 4A-A/B Local Release-Control References

- Current phase: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.
- Latest completed capability: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage.
- Last merged capability PR: #148.
- Merge commit: `26792f73f8e7943eac5e421c6d829bde7613b562`.
- Local release-control gate: `docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md`.
- Owner-review rehearsal runbook: `docs/content/OWNER-REVIEW-REHEARSAL-RUNBOOK.md`.
- Deployment approval firewall matrix: `docs/content/DEPLOYMENT-APPROVAL-FIREWALL-MATRIX.md`.
- Protected admin release-control workspace: `/admin/release-control`.

These references are repo-local, template-only, non-live, and not evidence. No owner feedback is recorded, no owner sign-off is recorded, no preview/production evidence is created, and no deployment approval is granted.

## Phase 4B-A/B Owner-Input Correction Queue References

- Current phase: Phase 4B-A/B - owner-input intake control, local correction queue, and review-ready handoff closure.
- Latest completed capability: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.
- Last merged capability PR: #149.
- Merge commit: `d825a112d017e95bd28ce030a5755ef78223e4c1`.
- Owner-input intake control: `docs/content/OWNER-INPUT-INTAKE-CONTROL.md`.
- Local correction queue: `docs/content/LOCAL-CORRECTION-QUEUE.md`.
- Review-ready handoff closure: `docs/content/REVIEW-READY-HANDOFF-CLOSURE.md`.
- Protected admin release-control workspace: `/admin/release-control`.

These references are repo-local, template-only, non-live, and not evidence. No owner feedback is recorded, no owner corrections are recorded, no owner sign-off is recorded, no preview evidence is created, no production evidence is created, and no deployment approval is granted.

## Phase 4C-A/B Local Owner-Review Rehearsal References

- Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.
- Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure.
- Last merged capability PR: #150.
- Merge commit: `baa076679756751a725ea65ac565545c6fe56d76`.
- Local owner-review rehearsal pack: `docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md`.
- Local blocker ledger template: `docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md`.
- Local acceptance drill: `docs/content/LOCAL-ACCEPTANCE-DRILL.md`.
- Owner-review rehearsal validator: `scripts/validate-owner-review-rehearsal.cjs` and `validate:owner-review-rehearsal`.
- Protected admin release-control workspace: `/admin/release-control`.
- Evidence boundary: `[NOT EVIDENCE / NOT RECORDED]`.
- Deployment approval boundary: `[DEPLOYMENT APPROVAL: NOT GRANTED]`.
- Safety: no deployment, provider configuration, fake facts, ecommerce/cart/checkout/order/payment/purchase flows, booking/reservation/fulfilment/stock-reservation flows, public uploads, customer accounts, public quote tracking, notifications, CRM, filled owner-review evidence, preview evidence, production evidence, or public admin internals are added.
