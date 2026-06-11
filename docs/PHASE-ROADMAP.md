## Phase 5N-A/B Deployment Approval Request Readiness References

Current phase: Phase 5N-A/B deployment approval request readiness, pre-launch blocker ledger, and no-provider/no-deploy approval firewall.
Latest completed capability: Phase 5M-A/B owner decision intake readiness, sign-off criteria ledger, and no-launch/no-deploy decision guard.
Last merged capability PR: #168.
Last merged capability merge commit: 4def227c0da884391a1d1789ed8386b84211c0e8.

Phase 5N-A/B adds repo-local deployment approval request readiness, a local pre-launch blocker ledger template, protected admin deployment approval request readiness helper coverage, no-provider/no-deploy approval firewall coverage, release-candidate suite integration, validate:deployment-approval-request-readiness validator coverage, and deterministic Phase 5N deployment approval request readiness tests. These controls are template-only, non-live, not evidence, and do not record deployment approval, launch clearance, production readiness, provider setup, preview evidence, production evidence, owner approval, owner sign-off, owner decision evidence, smoke evidence, deployment permission, or filled owner-review evidence.

Phase 5N-A/B references `docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md`, `docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md`, `docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md`, `scripts/validate-deployment-approval-request-readiness.cjs`, `scripts/validate-owner-decision-intake-readiness.cjs`, and protected admin deployment approval request readiness helper coverage.

No deployment is performed or approved by Phase 5N-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, launch clearance, provider readiness, production readiness, deployment permission, or public admin internals.

## Phase 5M-A/B Owner Decision Intake Readiness References

Current phase: Phase 5M-A/B owner decision intake readiness, sign-off criteria ledger, and no-launch/no-deploy decision guard.
Latest completed capability: Phase 5L-A/B owner re-review request readiness, correction delta packet, and no-signoff/no-response guard.
Last merged capability PR: #167.
Last merged capability merge commit: 4fe4b56cf2853517b9998d1d23237b6e1a37d8f4.

Phase 5M-A/B adds repo-local owner decision intake readiness, a local sign-off criteria ledger template, protected admin owner decision intake readiness helper coverage, no-launch/no-deploy decision guard coverage, release-candidate suite integration, validate:owner-decision-intake-readiness validator coverage, and deterministic Phase 5M owner decision intake readiness tests. These controls are template-only, non-live, not evidence, and do not record actual owner decisions, owner approval, owner acceptance, owner rejection, owner sign-off, launch clearance, deployment approval, production evidence, response-sent evidence, correction-completed evidence, or filled owner-review evidence.

Phase 5M-A/B references `docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md`, `docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md`, `docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md`, `scripts/validate-owner-decision-intake-readiness.cjs`, `scripts/validate-owner-re-review-request-readiness.cjs`, and protected admin owner decision intake readiness helper coverage.

No deployment is performed or approved by Phase 5M-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner decisions, filled sign-off criteria, filled owner approval, filled launch facts, filled business facts, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner response, owner sign-off, or public admin internals.

## Phase 5L-A/B Owner Re-Review Request Readiness References

Current phase: Phase 5L-A/B owner re-review request readiness, correction delta packet, and no-signoff/no-response guard.

Latest completed capability: Phase 5K-A/B owner correction workflow readiness, public content-gap guard, and no-response/no-deploy correction handoff.

Last merged capability PR: #166.

Last merged capability merge commit: fc9eb856143be259e63a31fa8cc9c54426741a97.

Phase 5L-A/B adds repo-local owner re-review request readiness, a local correction delta packet template, protected admin owner re-review request readiness helper coverage, no-response/no-signoff guard coverage, release-candidate suite integration, validate:owner-re-review-request-readiness validator coverage, and deterministic Phase 5L owner re-review request readiness tests. These controls are template-only, non-live, not evidence, and do not record actual owner feedback, owner re-review, owner responses, owner decisions, owner acceptance, owner rejection, owner approval, owner sign-off, owner corrections completed, correction-completed evidence, response-sent evidence, preview evidence, production evidence, route-walkthrough evidence, smoke evidence, acceptance evidence, launch clearance, public launch evidence, or deployment approval.

Phase 5L-A/B references `docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md`, `docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md`, `docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md`, `docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md`, `scripts/validate-owner-re-review-request-readiness.cjs`, `scripts/validate-owner-correction-workflow-readiness.cjs`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner re-review request readiness helper coverage.

No deployment is performed or approved by Phase 5L-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled owner re-review records, filled correction delta packets, filled public content gaps, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner approval, owner response, owner sign-off, or public admin internals.

## Phase 5K-A/B Owner Correction Workflow Readiness References

Current phase: Phase 5K-A/B owner correction workflow readiness, public content-gap guard, and no-response/no-deploy correction handoff.

Latest completed capability: Phase 5J-A/B owner-review feedback intake readiness, correction queue reconciliation, and no-approval update guard.

Last merged capability PR: #164.

Last merged capability merge commit: 68d4a20ac46c2a37abca3a253e0ae11ed713e2e1.

Phase 5K-A/B adds a repo-local owner correction workflow readiness template, local public content-gap register template, protected admin owner correction workflow helper, public/private route safety guard coverage, no-response/no-evidence/no-deploy correction handoff coverage, validate:owner-correction-workflow-readiness validator coverage, and deterministic Phase 5K owner correction workflow readiness tests. These controls are template-only, non-live, not evidence, and do not record filled owner feedback, owner approval, owner decisions, owner corrections, owner responses, owner answers, owner sign-off, preview evidence, production evidence, provider approval, correction-completed evidence, response-sent evidence, route-walkthrough evidence, acceptance evidence, launch clearance, public launch evidence, or deployment approval.

Phase 5K-A/B references `docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md`, `docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md`, `docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md`, `docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md`, `scripts/validate-owner-correction-workflow-readiness.cjs`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner correction workflow readiness helper coverage.

No deployment is performed or approved by Phase 5K-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled public content gaps, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner approval, owner response, or public admin internals.

## Phase 5J-A/B Owner Feedback Intake Readiness References

Current phase: Phase 5J-A/B owner-review feedback intake readiness, correction queue reconciliation, and no-approval update guard.

Latest completed capability: Phase 5I-A/B owner-review walkthrough readiness, full-route acceptance matrix, and no-deploy handoff refresh.

Last merged capability PR: #163.

Last merged capability merge commit: 62c8a9aefb15e2bbc420507a1b52bc716f49b670.

Phase 5J-A/B adds a repo-local owner feedback intake readiness package, local correction queue reconciliation template, protected admin owner-feedback readiness helper, public/private route parity guard coverage, no-approval/no-evidence update guard coverage, validate:owner-feedback-intake-readiness validator coverage, and deterministic Phase 5J owner-feedback intake readiness tests. These controls are template-only, non-live, not evidence, and do not record filled owner feedback, owner approval, owner decisions, owner corrections, owner answers, owner sign-off, preview evidence, production evidence, provider approval, correction-completed evidence, response-sent evidence, route-walkthrough evidence, acceptance evidence, public launch evidence, or deployment approval.

Phase 5J-A/B references `docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md`, `docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md`, `docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md`, `docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner-feedback readiness helper coverage.

No deployment is performed or approved by Phase 5J-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, owner approval, or public admin internals.

## Phase 5I-A/B Owner-Review Walkthrough Readiness References

Current phase: Phase 5I-A/B owner-review walkthrough readiness, full-route acceptance matrix, and no-deploy handoff refresh.

Latest completed capability: Phase 5H-A/B protected admin catalogue write workflow polish, validation/error UX, and public parity guard.

Last merged capability PR: #162.

Last merged capability merge commit: fddfce84daa93141a7b353179f906c8827a9d6e7.

Phase 5I-A/B adds a repo-local owner-review walkthrough readiness package, local full-route acceptance matrix, protected admin owner-review walkthrough helper, public/private route parity guard coverage, owner input question inventory, validate:owner-review-walkthrough-readiness validator coverage, and deterministic Phase 5I owner-review walkthrough tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, route-walkthrough evidence, response-sent evidence, write-success evidence, acceptance evidence, public launch evidence, or deployment approval.

Phase 5I-A/B references `docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md`, `docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md`, `docs/content/LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS.md`, `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner-review walkthrough helper coverage.

No deployment is performed or approved by Phase 5I-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route-walkthrough evidence, write-success evidence, response-sent evidence, public launch evidence, or public admin internals.

## Phase 5H-A/B Catalogue Write Workflow Readiness References

Current phase: Phase 5H-A/B protected admin catalogue write workflow polish, validation/error UX, and public parity guard.

Latest completed capability: Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary.

Last merged capability PR: #161.

Last merged capability merge commit: e051d98ee50501fccca8e9b55411dee6a6d7cc95.

Phase 5H-A/B adds repo-local protected admin listing, category, and media write workflow polish, validation/error/success boundary hardening, public parity guard coverage, local catalogue write workflow readiness documentation, validate:catalogue-write-workflow-readiness validator coverage, and deterministic Phase 5H catalogue write workflow tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, write-success evidence, or deployment approval.

Phase 5H-A/B references `docs/content/LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS.md`, `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin listing/category/media write workflow helpers.

No deployment is performed or approved by Phase 5H-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, write-success evidence, or public admin internals.

## Phase 5G-A/B Catalogue Content-Ops Readiness References

Current phase: Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary.

Latest completed capability: Phase 5F-A/B protected admin quote triage workflow, response-readiness checklist, and public/private boundary hardening.

Last merged capability PR: #160.

Last merged capability merge commit: faa06b3598317699c06ab55a1f987dac831306b6.

Phase 5G-A/B adds repo-local protected admin catalogue content-ops UX polish, listing/category/media readiness checklist coverage, media/fallback/alt-text boundary hardening, public catalogue parity checks, local catalogue content-ops readiness documentation, validate:catalogue-content-ops-readiness validator coverage, and deterministic Phase 5G catalogue content-ops tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, or deployment approval.

Phase 5G-A/B references `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin catalogue/listing/media readiness helpers.

No deployment is performed or approved by Phase 5G-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, or public admin internals.

## Phase 5F-A/B Quote Triage Readiness References

Current phase: Phase 5F-A/B protected admin quote triage workflow, response-readiness checklist, and public/private boundary hardening.

Latest completed capability: Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected admin triage parity.

Last merged capability PR: #159.

Last merged capability merge commit: aec1d7e781f3db463aac3079a00ddb7a25564a0c.

Phase 5F-A/B adds repo-local protected admin quote triage workflow polish, admin status/lifecycle display clarity, a response-readiness checklist derived from existing request fields, public/private quote boundary hardening, local quote triage readiness documentation, validate:quote-triage-readiness validator coverage, and deterministic Phase 5F quote triage tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, or deployment approval.

Phase 5F-A/B references `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin quote triage helpers.

No deployment is performed or approved by Phase 5F-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5E-A/B Quote/Enquiry Intake Readiness References

Current phase: Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected admin triage parity.

Latest completed capability: Phase 5D-A/B public listing-detail readiness, media/context polish, and quote-intent review closure.

Last merged capability PR: #158.

Last merged capability merge commit: f5f3b23426df052568158ba3cf1c898deb617a93.

Phase 5E-A/B adds repo-local quote/enquiry intake reliability polish, public validation/error boundary hardening, receipt/reference boundary hardening, selected listing/category/event/search context preservation as editable request text, a protected admin quote triage parity helper, local quote/enquiry intake readiness documentation, validate:quote-intake-readiness validator coverage, and deterministic Phase 5E quote intake tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5E-A/B references `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin quote triage parity helpers.

No deployment is performed or approved by Phase 5E-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5D-A/B Listing Detail Readiness References

Current phase: Phase 5D-A/B public listing-detail readiness, media/context polish, and quote-intent review closure.

Latest completed capability: Phase 5C-A/B public discovery search/filter polish, quote-intent context, and admin discovery parity closure.

Last merged capability PR: #157.

Last merged capability merge commit: 1f471213c71aa1d3ff979a267ffd1c8b2a39fe6f.

Phase 5D-A/B adds repo-local public listing detail readiness polish, media/fallback copy hardening, related browsing continuity, quote-intent handoff closure, a protected admin listing-detail parity helper, local listing detail readiness documentation, validate:listing-detail-readiness validator coverage, and deterministic Phase 5D listing detail tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5D-A/B references `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin listing-detail parity helpers.

No deployment is performed or approved by Phase 5D-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5C-A/B Public Discovery Acceptance References

Current phase: Phase 5C-A/B public discovery search/filter polish, quote-intent context, and admin discovery parity closure.

Latest completed capability: Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks.

Last merged capability PR: #156.

Last merged capability merge commit: adca108ef0b5577fea0078b69f3ad524d9406e77.

Phase 5C-A/B adds repo-local public discovery search/filter polish, category/event-use discovery cleanup, quote-intent context hardening, public empty/fallback UX hardening, a protected admin discovery parity helper, local discovery acceptance documentation, validate:public-discovery-acceptance validator coverage, and deterministic Phase 5C public discovery tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5C-A/B references `docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin discovery parity helpers.

No deployment is performed or approved by Phase 5C-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5B-A/B Public Journey Acceptance References

Current phase: Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks.

Latest completed capability: Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure.

Last merged capability PR: #155.

Last merged capability merge commit: 00b750ab34f433f1d4ca5567828b73e8ddeb3d05.

Phase 5B-A/B adds repo-local public catalogue-to-enquiry journey hardening, listing continuity, quote/enquiry request UX hardening, a protected admin public-parity review helper, local public journey acceptance documentation, validate:public-journey-acceptance validator coverage, and deterministic Phase 5B public journey tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5B-A/B references `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin public-parity review helpers.

No deployment is performed or approved by Phase 5B-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5A-A/B Public Review Polish References

Current phase: Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure.

Latest completed capability: Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center.

Last merged capability PR: #154.

Last merged capability merge commit: 85bfc8fb459cfc74db3ff80634ff35302691cb7f.

Phase 5A-A/B adds a repo-local public owner-review polish sweep, quote/enquiry intake copy cleanup, protected admin owner review checklist summary, local content-readiness cleanup note, validate:public-review-polish validator, and deterministic Phase 5A public review polish tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5A-A/B references `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `scripts/validate-public-review-polish.cjs`, `docs/OWNER-HANDOFF-BUNDLE.md`, `docs/content/OWNER-FACING-REVIEW-BRIEF.md`, `.github/ISSUE_TEMPLATE/owner-approval-request.md`, and `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`.

No deployment is performed or approved by Phase 5A-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 4F-A/B Owner Handoff Bundle References

Current phase: Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center.

Latest completed capability: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate.

Last merged capability PR: #153.

Last merged capability merge commit: 0e5379d21edd9ee67b9f929a3ba8e217d51ed17f.

Phase 4F-A/B adds a repo-local owner-facing review brief, blank owner approval issue template, no-deploy preflight command center, owner handoff bundle index, validate:owner-handoff-bundle validator, and protected admin Phase 4F handoff-bundle snapshot. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4F-A/B references `docs/content/OWNER-FACING-REVIEW-BRIEF.md`, `.github/ISSUE_TEMPLATE/owner-approval-request.md`, `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, and `scripts/validate-owner-handoff-bundle.cjs`.

No deployment is performed or approved by Phase 4F-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

# Phase Roadmap

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


## Phase 4C-A/B Local Owner-Review Rehearsal Pack Blocker Ledger And Acceptance Drill Validator

Phase 4C-A/B turns the Phase 4B-A/B owner-input intake and local correction queue into a deterministic local rehearsal workflow. It adds a template-only local owner-review rehearsal pack, blocker ledger template, local acceptance drill, owner-review rehearsal validator, and protected admin Phase 4C rehearsal snapshot for local review readiness only.

Deployment remains unapproved. Provider setup, Vercel config, Supabase Cloud config, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, public tracking, customer accounts, uploads, ecommerce/payment/order/checkout flows, booking/reservation/fulfilment/stock-reservation flows, filled evidence, owner sign-off, owner feedback, owner decisions, and invented business facts remain out of scope.

Last merged capability PR: #150. Merge commit: `baa076679756751a725ea65ac565545c6fe56d76`. Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure. Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.

## Phase 4B-A/B Owner-Input Intake Control Local Correction Queue And Review-Ready Handoff Closure

Phase 4B-A/B turns the Phase 4A-A/B release-control gate into a deterministic owner-input and local-correction control layer. It adds owner-input intake control, a local correction queue, review-ready handoff closure templates, and a protected admin owner-input/correction snapshot for local review readiness only.

Deployment remains unapproved. Provider setup, Vercel config, Supabase Cloud config, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, public tracking, customer accounts, uploads, ecommerce/payment/order/checkout flows, booking/reservation/fulfilment/stock-reservation flows, filled evidence, owner sign-off, owner feedback, and invented business facts remain out of scope.

Last merged capability PR: #149. Merge commit: `d825a112d017e95bd28ce030a5755ef78223e4c1`. Latest completed capability: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.

## Phase 4A-A/B Local Release-Control Gate Owner-Review Rehearsal And Deployment Approval Firewall

Phase 4A-A/B moves from Phase 3Z-A/B public/admin readiness hardening into a protected repo-local release-control layer. It adds a local release-control gate, owner-review rehearsal runbook, deployment approval firewall matrix, and protected admin release-control workspace for local review readiness only.

Deployment remains unapproved. Provider setup, Vercel config, Supabase Cloud config, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, public tracking, customer accounts, uploads, ecommerce/payment/order/checkout flows, filled evidence, owner sign-off, and invented business facts remain out of scope.

Last merged capability PR: #148. Merge commit: `26792f73f8e7943eac5e421c6d829bde7613b562`. Latest completed capability: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage.

## Phase 3Z-A/B Public Route Readiness Closure Protected Admin Review Bridge And Local Acceptance Coverage

Phase 3Z-A/B closes the repo-local public journey/readiness gap before future owner review or deployment discussion. It keeps the website a furniture/event rental enquiry site, adds template-only public journey and quote/enquiry expectation boundaries, adds a protected admin public-review bridge, hardens existing public copy without new routes or providers, and extends deterministic local tests and validators.

Deployment remains unapproved. Provider setup, Vercel config, Supabase Cloud config, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, public tracking, customer accounts, uploads, ecommerce/payment/order/checkout flows, filled evidence, and invented business facts remain out of scope.

## Roadmap Rules

Phase 0 and Phase 1 are active or near-term. Phase 2 and later are future
guardrails only and are not approval to implement those phases now.

Any phase change must update this roadmap, the relevant checklist, the ADR or
decision log, and safety docs in the same PR.

For the current quick status, see `docs/PHASE-STATUS.md`. For checklist
ownership and maintenance rules, see `docs/checklists/README.md`.

Before any implementation work, start from a clean branch or explicitly separate
unrelated local changes.

## Phase 0: Planning, Docs, And Context Only

Goal: record the approved architecture and safety boundaries before app
development starts.

Checklist: `docs/checklists/PHASE-0-PLANNING.md`

No app development, Next.js scaffold, Supabase migrations, workflow JSON
changes, or live/runtime actions belong in Phase 0.

## Phase 1: Small MVP

Goal: build the smallest production-shaped Next.js foundation under `website/`
with custom chat UI, first-party `/api/chat`, server-only `N8nChatProvider`,
server-only quote capture with route-level abuse throttling, chat persistence
design/scaffolding, furniture listing/admin persistence design/scaffolding, trusted
active-workspace catalogue RLS hardening proof, deployment environment
readiness, Phase 1 closeout audit, Phase 2 readiness plan, and a basic
Supabase core schema.

Checklist: `docs/checklists/PHASE-1-MVP.md`

Phase 1 is not the full SaaS platform, full RAG system, full admin inbox, vector
stack, billing system, or streaming implementation.

## Phase 2: Deployment, Admin, Furniture Listing, And Quote Operations

Goal: prepare reviewed deployment operations and expand operational admin tools for furniture listings and enquiries
after the MVP foundation exists.

Checklist: `docs/checklists/PHASE-2-ADMIN-OPS.md`

Readiness plan: `docs/PHASE-2-READINESS-PLAN.md`

Deployment readiness checklist:
`docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md`

Admin/auth readiness checklist:
`docs/checklists/PHASE-2B-ADMIN-AUTH.md`

Future auth implementation checklist:
`docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md`

Phase 2A-A adds deployment smoke-test runbook and operator evidence templates
only. It is not approval to deploy, connect Supabase Cloud, add Vercel config,
or add runtime features.


Phase 3Y-A/B hardens protected admin destructive-action safeguards, recovery lanes, status-transition guidance, existing admin helper copy, and deterministic local acceptance coverage for listing, category, media, and quote operations. It adds only repo-local protected-admin documentation and UI copy; it is not deployment approval and does not add provider, runtime, public self-service, or ecommerce scope.

Phase 2B-A adds admin/auth and workspace membership authorization design only.
It is not approval to implement real auth, add admin UI, add product, category,
or product image writes, add browser Supabase, add service-role runtime paths,
or deploy.

Phase 2B-B adds a pure server-only admin authorization policy module and tests
only. It is not approval to add Supabase Auth runtime wiring, login/logout
routes, protected admin pages, admin UI, product writes, service-role runtime
paths, browser Supabase, deployment, or Supabase Cloud connection.

Phase 2B-C adds a server-only admin auth/membership resolver contract and
disabled scaffold only. It is not approval to implement real auth, add Supabase
Auth runtime wiring, add login/logout routes, add protected admin pages, add
admin UI, wire runtime routes/pages/server actions, add product writes, add
service-role runtime paths, add browser Supabase, deploy, or connect Supabase
Cloud.

Phase 2B-D adds server-only admin auth/membership adapter contracts and
dependency-injected resolver tests with fake adapters only. It is not approval
to implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, wire
runtime routes/pages/server actions, add product writes, add service-role
runtime paths, add browser Supabase, deploy, or connect Supabase Cloud.

Phase 2B-E adds admin auth provider/session/security design and an unchecked
auth implementation checklist only. It is not approval to implement real auth,
add Supabase Auth runtime wiring, read cookies, read headers, add login/logout
routes, add protected admin pages, add admin UI, wire runtime routes/pages/server
actions, add product writes, add service-role runtime paths, add browser
Supabase, deploy, or connect Supabase Cloud.

Phase 2B-F adds checklist hygiene and phase status reconciliation only. It is
not approval to implement real auth, add Supabase Auth runtime wiring, read
cookies, read headers, add login/logout routes, add protected admin pages, add
admin UI, wire runtime routes/pages/server actions, add product/category/product
image writes, add service-role runtime paths, add browser Supabase, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code, or add
SaaS chatbot app code.

Phase 2B-G refreshes repo agent instructions and static guard coverage only.
It is not approval to implement real auth, add Supabase Auth runtime wiring,
read cookies, read headers, add login/logout routes, add protected admin
pages, add admin UI, wire runtime routes/pages/server actions, add
product/category/product image writes, add service-role runtime paths, add
browser Supabase, deploy, connect Supabase Cloud, change n8n workflows, add
Pinecone runtime code, or add SaaS chatbot app code.

Phase 2B-H strengthens the reviewed server-side admin auth/membership
resolution boundary with dependency-injected fake adapters and safe
allow/deny tests only. It is not approval to implement real auth, add Supabase
Auth runtime wiring, read cookies, read headers, add login/logout routes, add
protected admin pages, add admin UI, wire runtime routes/pages/server actions,
add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone, or
add SaaS chatbot app code.

Phase 2B-I cleans admin auth implementation gate wording and refines
runtime-readiness checklist/static guard wording only. It is not approval to
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI,
wire runtime routes/pages/server actions, add product/category/product image
writes, add Supabase Storage, add service-role runtime paths, add browser
Supabase, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, migrate Pinecone, or add SaaS chatbot app code.

Phase 2B-J approves the future server-only Supabase Auth runtime lane and
auth implementation approval/test gates only. It is not approval to implement
real auth, add Supabase Auth runtime wiring, read cookies, read headers, add
login/logout routes, add protected admin pages, add admin UI, wire runtime
routes/pages/server actions, add product/category/product image writes, add
Supabase Storage, add service-role runtime paths, add browser Supabase,
deploy, connect Supabase Cloud, change n8n workflows, add Pinecone runtime
code, migrate Pinecone, or add SaaS chatbot app code.

Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary
needed for future admin auth. Cookie reads, `@supabase/ssr`, and Supabase Auth
server calls are allowed only inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`.
It is not approval to wire the resolver or adapters into runtime routes, pages,
or server actions, read headers, add login/logout routes, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, add service-role runtime paths, add browser Supabase, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
Pinecone, or add SaaS chatbot app code.

Phase 2B-L adds only the server-only Supabase-backed admin profile and membership read boundary
needed for future admin auth. `admin_users` and `memberships` reads are allowed only inside
`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`.
It requires an explicitly injected authenticated admin-read client and does not
default to the plain anon-key Supabase helper. Live authenticated read-client
wiring remains deferred. It is not approval to wire the resolver or adapters
into runtime routes, pages, or server actions, read cookies outside the Phase
2B-K identity boundary, call Supabase Auth outside the Phase 2B-K identity
boundary, read headers, add login/logout routes, add protected admin pages,
add admin UI, add product/category/product image writes, add Supabase Storage,
add service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-M adds only the server-only admin workspace resolution boundary
needed for future admin auth. Admin workspace resolution is allowed only inside
`website/lib/admin/authorization/server-admin-workspace-resolver.ts`. It
implements the existing `AdminWorkspaceResolver` contract, requires an
explicitly injected trusted server-side workspace ID, treats
browser/request workspace IDs as validation-only, fails closed for missing,
empty, whitespace-only, or mismatched values, and does not use public catalogue
workspace config as an admin authorization shortcut. It is not approval to wire
the resolver or adapters into runtime routes, pages, or server actions, read
cookies outside the Phase 2B-K identity boundary, call Supabase Auth outside
the Phase 2B-K identity boundary, read `admin_users` or `memberships` outside
the Phase 2B-L profile/membership boundary, read headers, add login/logout
routes, add protected admin pages, add admin UI, add product/category/product
image writes, add Supabase Storage, add service-role runtime paths, add
browser Supabase, deploy, connect Supabase Cloud, change n8n workflows, add
Pinecone runtime code, migrate Pinecone, access `website/chat-config.js`, or
add SaaS chatbot app code.

Phase 2B-N adds only the server-only session-bound admin read-client factory
needed for future Phase 2B-L profile/membership reads. The factory is allowed
only inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
because that module remains the reviewed Phase 2B-K server-only cookie and
Supabase Auth boundary. It reuses the reviewed server-only Supabase URL, anon
key, and request-cookie path to create a session-bound Supabase SSR client and
returns the Phase 2B-L `SupabaseAdminReadClientResult` dependency shape. It
fails closed when server env is missing, cookie reads fail, client creation
fails, or no explicit session-bound client can be created. It is not approval
to query `admin_users` or `memberships` outside the Phase 2B-L boundary, wire
the client into runtime routes, pages, or server actions, add login/logout
routes, add protected admin pages, add admin UI, add product/category/product
image writes, add Supabase Storage, add service-role runtime paths, add
browser Supabase, read headers, deploy, connect Supabase Cloud, change n8n
workflows, add Pinecone runtime code, migrate Pinecone, access
`website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-O adds only the server-only admin authorization adapter-set composition boundary
needed for future admin auth runtime wiring. The
composition boundary is allowed only inside
`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
It assembles the existing `AdminAuthAdapter`, `AdminProfileAdapter`,
`AdminMembershipAdapter`, and `AdminWorkspaceResolver` contracts by composing
the reviewed Phase 2B-K/N identity/read-client boundary, Phase 2B-L
profile/membership boundary, and Phase 2B-M trusted workspace resolver. It
fails closed when the session-bound admin read client or trusted server-side
workspace input cannot be assembled. It is not approval to use the adapter set
from runtime routes, pages, or server actions, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, read cookies or call Supabase
Auth outside the Phase 2B-K boundary, resolve workspace scope outside the Phase
2B-M boundary, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, read headers, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code,
migrate Pinecone, access `website/chat-config.js`, or add SaaS chatbot app
code.

Phase 2B-P adds only the server-only composed admin authorization decision boundary
needed for future admin auth runtime wiring. The decision boundary is allowed
only inside
`website/lib/admin/authorization/server-admin-authorization-decision.ts`. It
creates the Phase 2B-O adapter set and calls the existing
`resolveAdminAuthorizationWithAdapters()` decision function without
duplicating policy logic. It fails closed when adapter-set composition,
session-bound admin read-client creation, trusted workspace input, or provider
dependencies are unavailable. It is not approval to use the decision boundary
from runtime routes, pages, or server actions, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, read cookies or call Supabase
Auth outside the Phase 2B-K boundary, resolve workspace scope outside the Phase
2B-M boundary, compose adapter sets outside the Phase 2B-O boundary, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, read headers, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-Q adds only the server-only admin request security preflight boundary
needed for future state-changing admin routes and server actions. The
preflight boundary is allowed only inside
`website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
It validates only explicitly injected request metadata and optional injected
CSRF verifier results; it does not read real request headers. It treats
request/browser supplied fields as untrusted validation inputs, requires
same-origin Origin/Host metadata, requires POST and a valid injected CSRF
proof for state-changing admin operations, permits safe read-only
`catalogue.read` requests without CSRF proof, and fails closed for missing,
invalid, stale, replayed, mismatched, or unsupported inputs. It is not
approval to use the preflight boundary from runtime routes, pages, or server
actions, read headers, read cookies outside the Phase 2B-K boundary, call
Supabase Auth outside the Phase 2B-K boundary, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, resolve workspace scope outside
the Phase 2B-M boundary, compose adapter sets outside the Phase 2B-O boundary,
call the composed decision boundary outside the Phase 2B-P boundary, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, deploy, connect Supabase Cloud, change
n8n workflows, add Pinecone runtime code, migrate Pinecone, access
`website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-R adds only the server-only CSRF proof verifier boundary needed for
future injection into the Phase 2B-Q request security preflight validator. The
CSRF verifier boundary is allowed only inside
`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
validates only explicitly injected proof material, expected session binding,
expected nonce, timestamps, and dependency-injected signature or replay checks.
It may parse a simple structured `base64url(JSON payload).base64url(signature)`
proof and return only Phase 2B-Q-compatible safe verifier results. It does not
issue CSRF tokens, read headers, read cookies, read env, call Supabase, store
replay state except through an injected dependency, or wire itself into the
Phase 2B-Q preflight boundary outside isolated unit tests. It is not approval
to use the verifier from runtime routes, pages, or server actions, read
headers, read cookies outside the Phase 2B-K boundary, call Supabase Auth
outside the Phase 2B-K boundary, query `admin_users` or `memberships` outside
the Phase 2B-L boundary, resolve workspace scope outside the Phase 2B-M
boundary, compose adapter sets outside the Phase 2B-O boundary, call the
composed decision boundary outside the Phase 2B-P boundary, use the preflight
boundary from runtime routes/pages/actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image
writes, add Supabase Storage, add service-role runtime paths, add browser
Supabase, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, migrate Pinecone, access `website/chat-config.js`, or add SaaS
chatbot app code.

Phase 2B-S adds only the server-only CSRF proof issuer boundary needed for
future state-changing admin routes and server actions. The CSRF issuer
boundary is allowed only inside
`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It
issues verifier-compatible structured
`base64url(JSON payload).base64url(signature)` proofs only from explicitly
injected operation, session binding, nonce or nonce generator, issued-at and
expiry timestamps, and a dependency-injected signature signer. It supports only
state-changing admin operations, fails closed for read-only or unsupported
operations, missing session binding, missing nonce, invalid timestamps,
missing signer, signer failure, or dependency failure, and returns only safe
issue results. It does not verify CSRF proofs, read headers, read cookies,
read env, call Supabase, store replay state, or wire itself into the Phase
2B-Q preflight boundary or Phase 2B-R verifier outside isolated unit tests. It
is not approval to use the issuer from runtime routes, pages, or server
actions, read headers, read cookies outside the Phase 2B-K boundary, call
Supabase Auth outside the Phase 2B-K boundary, query `admin_users` or
`memberships` outside the Phase 2B-L boundary, resolve workspace scope outside
the Phase 2B-M boundary, compose adapter sets outside the Phase 2B-O boundary,
call the composed decision boundary outside the Phase 2B-P boundary, use the
preflight boundary from runtime routes/pages/actions, use the verifier from
runtime routes/pages/actions, add login/logout routes, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, add service-role runtime paths, add browser Supabase, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, migrate
Pinecone, access `website/chat-config.js`, or add SaaS chatbot app code.

Phase 2B-T adds only the server-only admin authorization gate composition boundary
needed for future admin routes and server actions. The gate boundary is
allowed only inside
`website/lib/admin/authorization/server-admin-authorization-gate.ts`. It runs
the Phase 2B-Q request security preflight before the Phase 2B-P composed
admin authorization decision, may inject the Phase 2B-R CSRF proof verifier
into preflight when verifier dependencies are supplied, and returns safe
allow, deny, or unavailable shapes. It does not issue CSRF proofs, read real
headers, read cookies, read env, call Supabase, query `admin_users` or
`memberships`, create a session-bound admin read client, compose adapter sets
directly, duplicate admin role/membership policy logic, add route/page/server
action wiring, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, migrate Pinecone,
access `website/chat-config.js`, or add SaaS chatbot app code.
Phase 2B-U adds only the admin runtime wiring approval lane for future use of
the Phase 2B-T server-only admin authorization gate. This phase is docs and
checklists only. It approves a future first runtime integration boundary
limited to first-party server-only route handlers or server actions, with real
request header reads allowed only inside a future reviewed server-only request
metadata adapter. That future adapter must pass explicit request metadata into
`resolveServerAdminAuthorizationGate()`, preserve preflight-before-decision
ordering, keep Supabase Auth cookie reads only inside the Phase 2B-K identity
boundary, keep `admin_users` and `memberships` reads only inside the Phase
2B-L profile/membership boundary, keep workspace resolution only inside the
Phase 2B-M workspace resolver, keep CSRF proof issuance and verification
inside the Phase 2B-S and Phase 2B-R boundaries, and return generic errors
without provider internals. It is not approval to add runtime route handlers,
pages, server actions, header reads, login/logout routes, protected admin
pages, admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, Supabase Cloud, deployment,
real env values, n8n workflow changes, Pinecone runtime code, or
`website/chat-config.js` access.

Phase 2B-V adds only the server-only admin request metadata adapter boundary
for future admin gate usage. The adapter is allowed only inside
`website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.
It may import `next/headers` and call `headers()` only there, reads only
minimal untrusted request metadata, requires trusted expected origin and host
inputs through dependency injection, and returns safe explicit metadata for a
future call to `resolveServerAdminAuthorizationGate()`. It does not call the
gate, preflight, decision boundary, CSRF verifier, CSRF issuer, adapter-set
composition, Supabase, or product write logic. Creating this adapter is not
approval to add runtime route handlers, pages, server actions, login/logout
routes, protected admin pages, admin UI, product/category/product image writes,
Supabase Storage, service-role runtime paths, browser Supabase, Supabase Cloud,
deployment, real env values, n8n workflow changes, Pinecone runtime code, or
`website/chat-config.js` access.

Phase 2B-W adds only the server-only admin runtime gate invocation boundary
for future admin routes, pages, or server actions. The invocation boundary is
allowed only inside
`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.
It composes the Phase 2B-V request metadata adapter and the Phase 2B-T admin
authorization gate, accepts trusted expected origin and host inputs through
explicit dependency/config injection, and returns the existing safe gate result
shape. It does not import `next/headers`, read headers directly, read cookies,
read env, call Supabase, query `admin_users` or `memberships`, duplicate
preflight/CSRF/policy logic, issue CSRF proofs, add runtime route/page/server
action usage, add login/logout routes, add protected admin pages, add admin UI,
add product/category/product image writes, add Supabase Storage, add
service-role runtime paths, add browser Supabase, deploy, connect Supabase
Cloud, change n8n workflows, add Pinecone runtime code, or access
`website/chat-config.js`.

Phase 2B-X adds only the admin runtime gate invocation usage approval lane.
It approves a future first-party server-only route handler or server action
lane for calling `resolveServerAdminRuntimeGateInvocation()` through the Phase
2B-W helper only. Header reads must remain inside Phase 2B-V, cookie reads and
Supabase Auth calls inside Phase 2B-K/N, `admin_users` and `memberships` reads
inside Phase 2B-L, workspace resolution inside Phase 2B-M, adapter-set
composition inside Phase 2B-O, decision logic inside Phase 2B-P,
request-security preflight inside Phase 2B-Q / Phase 2B-T, CSRF verification
inside Phase 2B-R / Phase 2B-T, and CSRF issuance inside Phase 2B-S. It is
not approval to add runtime route handlers, pages, server actions, helper
usage, login/logout routes, protected admin pages, admin UI,
product/category/product image writes, Supabase Storage, service-role runtime
paths, browser Supabase, Supabase Cloud, deployment, real env values, n8n
workflow changes, Pinecone runtime code, SaaS chatbot app code, or
`website/chat-config.js` access.
Phase 2B-Y adds only the server-only admin runtime route gate adapter boundary.
The adapter is allowed only inside
`website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`.
It accepts explicit requested operation/workspace inputs, trusted expected
origin and host dependencies, gate dependencies, and an explicit or minimal
request-like method, then calls only the Phase 2B-W
`resolveServerAdminRuntimeGateInvocation()` helper. It does not read headers,
read cookies, read env, call lower-level auth/security boundaries directly,
add route handlers, pages, server actions, login/logout routes, protected admin
pages, admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, Supabase Cloud, deployment, real
env values, n8n workflow changes, Pinecone runtime code, SaaS chatbot app code,
or `website/chat-config.js` access.
Phase 2B-Z adds only the admin runtime route gate adapter usage approval lane.
It approves future first-party server-only route handlers or server actions to
call `resolveServerAdminRuntimeRouteGateAdapter()` only through the Phase 2B-Y
route gate adapter, while keeping actual route/page/server-action usage
deferred. It is not approval to add routes, pages, server actions,
login/logout, protected admin pages, admin UI, product writes, Storage,
deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n
changes, Pinecone runtime code, SaaS chatbot app work, or
`website/chat-config.js` access.

Phase 2B-AA adds the first admin runtime route gate adapter usage boundary.
It adds exactly one first-party server-only route handler at
`website/app/api/admin/auth-check/route.ts` as a harmless authorization probe
only. It is not approval to add other routes, pages, server actions,
login/logout, protected admin pages, admin UI, product writes, Storage,
deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n
changes, Pinecone runtime code, SaaS chatbot app work, or
`website/chat-config.js` access.

Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane.
It approves only the future first-party server-only lane for issuing CSRF
proof material needed by later state-changing admin operations. The future
route must remain server-only and must not bypass the Phase 2B-Y/AA
route-gate authorization path. The future route must not call lower-level
auth/security boundaries directly except the approved Phase 2B-S CSRF issuer
boundary. The future route must not expose CSRF secrets, verifier internals,
provider internals, raw headers, cookies, tokens, SQL/provider errors,
workspace internals, membership internals, or stack traces. The future route
must not approve product/category/product image writes by itself. It is not
approval to add routes, pages, server actions, login/logout, protected admin
pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser
Supabase, service-role runtime paths, n8n changes, Pinecone runtime code,
SaaS chatbot app work, or `website/chat-config.js` access.

Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted
workspace dependency through the existing approved dependency path. It prevents
the route from failing closed unconditionally due to a missing expected
server-resolved workspace ID. It relies on the environment via
`process.env.ADMIN_TRUSTED_WORKSPACE_ID`. It remains fail-closed and does not
add any routes, pages, server actions, admin UI, product writes, login/logout
routes, protected admin pages, Storage, deployment, Supabase Cloud, browser
Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS
chatbot app work, or `website/chat-config.js` access.

Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary. It documents that a future first-party server-only CSRF proof issuer route needs a dedicated route-gate operation model (likely `admin.csrf.issue`) before implementation. The current request preflight requires state-changing operations to be `POST` and to already include a valid CSRF proof, so the issuer route must not route-gate itself as a state-changing operation (like `product.write`), nor use only `admin.auth.check` as a loose substitute for write-operation authorisation. The future route must remain server-only, use the approved route-gate path, and not call lower-level auth/security boundaries directly except the approved CSRF proof issuer boundary. It must not issue proofs for unsupported operations, nor expose CSRF secrets, verifier internals, signer internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, membership internals, workspace internals, or stack traces. Phase 2B-AD does not implement the actual route, approve or implement product/category/product image writes by itself, add admin UI, protected admin pages, login/logout routes, Storage, deployment config, Supabase Cloud connection, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Further Phase 2 implementation work remains unapproved until scoped in a
separate phase PR.

## Phase 3: SaaS Chatbot Boundary

Goal: decide the separate SaaS chatbot project/app boundary and how SKR can
later become its first client/tenant, without implementing SaaS chatbot code in
this repo yet.

Checklist: `docs/checklists/PHASE-3-INTERNAL-CHATBOT.md`

Current SKR may keep using the existing n8n/Pinecone chatbot workflow as a
temporary bridge. The browser must never call n8n directly.

This phase is not approved for implementation yet.

## Phase 4: RAG, Knowledge, And Vector Work

Goal: introduce knowledge source models, document ingestion, chunking,
embeddings, retrieval, and vector storage decisions.

Checklist: `docs/checklists/PHASE-4-RAG-KNOWLEDGE.md`

Do not migrate Pinecone in this repo yet. Pinecone/n8n remain current RAG
workflow context only.

This phase is not approved for implementation yet.

## Phase 5: SaaS Platform Hardening

Goal: harden multi-tenant SaaS operations, onboarding, analytics, abuse
controls, retention, and security posture.

Checklist: `docs/checklists/PHASE-5-SAAS.md`

This phase is not approved for implementation yet.

## Phase 6: Billing And Public SaaS Launch

Goal: make pricing, billing, launch operations, monitoring, incident response,
and legal readiness decisions if a public SaaS launch is needed.

Checklist: `docs/checklists/PHASE-6-BILLING-LAUNCH.md`

This phase is not approved for implementation yet.

Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary. It does not implement the actual CSRF proof issuer route.

Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary. It resolves a binding only from existing Phase 2B server-only session, profile, membership, and trusted workspace boundaries, requires an explicitly injected opaque binding deriver, and keeps the actual issuer route deferred.

Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary. It derives an opaque binding from canonical requested operation, auth user ID, admin user ID, trusted workspace ID, and membership role inputs using the existing server-only `ADMIN_CSRF_PROOF_SECRET` and Node crypto. It does not implement the actual issuer route, add route/page/server-action usage, add a replay store, approve product/category/product image writes, add admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route at `website/app/api/admin/csrf-proof/route.ts`. The route accepts only `POST`, rejects missing or malformed JSON, rejects missing, unsupported, and non-state-changing target operations, gates itself with the approved `admin.csrf.issue` route-gate lane, resolves the target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime dependencies, and returns only safe JSON success or failure shapes. It issues proofs only for `product.write`, `category.write`, `productImage.write`, `quote.write`, and `membership.manage`. Phase 2B-AK does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AL implements the first backend-only admin product-management write surface. It adds session-bound product/category/product image metadata persistence under `website/lib/products/persistence/`, owner/admin RLS write policies and product-management audit inserts, and protected first-party admin routes under `website/app/api/admin/` for category, product, and product-image metadata mutations. The routes require the approved route-gate stack, a matching CSRF proof for `category.write`, `product.write`, or `productImage.write`, `ADMIN_TRUSTED_WORKSPACE_ID`, safe JSON validation, and no-store responses. Phase 2B-AL does not add admin UI, login/logout, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or access `website/chat-config.js`.

Phase 2B-AN implements only a minimal first-party admin login page,
server-owned Supabase Auth login/logout routes, and a protected admin shell.
The protected shell uses the existing route-gate path with
`admin.shell.access`, allowing owner/admin membership and denying viewer
membership. Phase 2B-AN does not add product-management UI,
product/category/product-image write forms, server actions, binary uploads,
Supabase Storage, browser Supabase, service-role runtime paths, deployment
config, Supabase Cloud, n8n changes, Pinecone runtime code, SaaS chatbot work,
or access `website/chat-config.js`.

Phase 2B-AQ pivots current product direction to an admin-managed furniture/event-rental listing catalogue plus customer enquiry/quote request system. It is docs/status/checklist and safe-copy work only. It does not rename existing `products`, `categories`, or `product_images` tables/routes/helpers, add listing write UI, uploads, Storage, browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, carts, checkout, payments, stock reservation, order fulfilment, online ordering, or access `website/chat-config.js`.

Phase 2B-AR fixes only the protected admin shell GET missing-Origin handling
inside the existing server-only route-gate path. Safe read-only `GET`/`HEAD`
operations may proceed without Origin only when Host matches the trusted
expected host, while present Origin metadata remains strictly validated.
`admin.csrf.issue` and state-changing writes still require strict Origin/Host
validation, POST, and the existing CSRF proof requirements for writes. Phase
2B-AR does not add listing CRUD UI, listing uploads, Storage, browser Supabase,
service-role runtime paths, deployment config, n8n changes, Pinecone runtime
code, SaaS chatbot work, SQL migrations, or access `website/chat-config.js`.

Phase 2B-AS adds only metadata admin furniture listing management UI inside
the existing protected admin shell. It uses the existing Phase 2B-AL/AM
product internals and protected `product.write` backend routes for create,
update, publish/unpublish via status updates, and archive. The browser UI
requests a first-party CSRF proof and sends `x-csrf-proof` on write requests.
It does not add listing image upload, Supabase Storage, public catalogue
redesign, enquiry forms, DB/API/table/RPC/RLS renames, SQL migrations,
browser Supabase, service-role runtime paths, deployment config, n8n changes,
Pinecone runtime code, SaaS chatbot work, cart, checkout, payments, customer
accounts, stock reservation, order fulfilment, online ordering, or access
`website/chat-config.js`.

Phase 2B-AT adds only public furniture catalogue and listing detail UX polish.
The public catalogue and listing detail pages keep the existing
`getPublicCatalogue()` and `getPublicProductBySlug()` read paths, update
visible copy to reflect furniture/event-rental listings, keep safe fallback
behavior when env/catalogue data is unavailable, and add a clean empty-state
view when no public listings are available.

Phase 2B-AT does not add listing image upload/storage, image metadata admin
UI, enquiry form implementation, DB/API/table/RPC/RLS renames, SQL migrations,
browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone
runtime code, SaaS chatbot work, or ecommerce flows such as carts,
checkout, payments, customer accounts, stock reservation, order fulfilment,
or online ordering.

Phase 2B-AU adds only public events and quote copy polish. The public events
page removes shell/MVP wording and uses normal event-rental, furniture-rental,
styled-setup, enquiry, and quote-request language. The quote page and site
metadata remain quote-request oriented without implying checkout, payment,
online ordering, stock reservation, confirmed booking, or fulfilment.

Phase 2B-AU does not add enquiry form implementation beyond the existing quote
request form, admin changes, image upload, Supabase Storage, SQL migrations,
DB/API/table/RPC/RLS renames, browser Supabase, service-role runtime paths,
deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, or
ecommerce flows such as carts, checkout, payments, customer accounts, stock
reservation, order fulfilment, or online ordering.

Phase 2B-AV adds only narrow anti-framing response headers for the protected
admin UI. `website/next.config.mjs` applies
`Content-Security-Policy: frame-ancestors 'none'` and
`X-Frame-Options: DENY` to `/admin` and nested admin UI routes. This is a
low-severity clickjacking hardening fix: SameSite=Lax auth cookies may reduce
arbitrary off-site exploitability, but anti-framing headers close the missing
browser-side defence.

Phase 2B-AV does not add or change admin UI features, admin auth, CSRF,
Origin/Host checks, Supabase SSR cookie handling, product/category write route
logic, SQL migrations, DB/API/table/RPC/RLS names, browser Supabase,
service-role runtime paths, image upload, Supabase Storage, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, ecommerce flows, or access
`website/chat-config.js`.

Phase 2B-AW adds only a read-only admin quote request inbox inside the
protected admin shell. It uses a server-only, session-bound admin read client
and trusted admin workspace configuration to load recent quote requests and
requested item snapshots from `quote_requests` and `quote_request_items`.
Authorised admins can review recent quote request details, but cannot update
status, send notifications, assign follow-up, sync to CRM, confirm bookings,
or create orders from this phase.

Phase 2B-AW does not add quote status writes, notifications, CRM integration,
customer accounts, ordering, checkout, payments, fulfilment, stock reservation,
confirmed booking, SQL migrations, DB/API/table/RPC/RLS renames, browser
Supabase, service-role runtime paths, image upload, Supabase Storage,
n8n/Pinecone runtime behavior, SaaS chatbot runtime work, ecommerce flows, or
access `website/chat-config.js`.

Phase 2B-AX adds only admin quote request status updates from the protected
admin quote request inbox. It introduces the quote-specific `quote.write`
admin operation, permits it for owner/admin memberships only, adds it to the
CSRF proof target operation set, and uses a first-party server-only route at
`POST /api/admin/quote-requests/[quoteRequestId]/status` to accept only
`{ status }` payloads for existing quote requests. The server-side write
boundary updates only `quote_requests.status` for the trusted admin workspace
and returns generic failure results.

Phase 2B-AX does not add public quote status pages, customer-facing quote
tracking, notifications, CRM integration, internal notes, assignment,
customer accounts, cart, checkout, payments, stock reservation, fulfilment,
confirmed booking, online ordering, image upload, Supabase Storage, SQL
migrations, DB/API/table/RPC/RLS renames, browser Supabase, service-role
runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot runtime work,
ecommerce flows, or access `website/chat-config.js`.

Phase 2B-AY adds only metadata listing image management UI inside the existing
protected admin shell. It reuses the existing protected product-image metadata
backend routes and `productImage.write` CSRF operation for create, update, and
archive actions. The browser UI sends only JSON metadata fields and
`x-csrf-proof`; the server-only dashboard read boundary includes editable
image metadata scoped to `ADMIN_TRUSTED_WORKSPACE_ID`.

Phase 2B-AY does not add binary image upload, file inputs,
multipart/form-data, Supabase Storage bucket creation or API calls, public
image upload or management routes, DB/API/table/RPC/RLS renames, SQL
migrations, browser Supabase, service-role runtime paths, notifications, CRM
integration, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, access
to `website/chat-config.js`, or ecommerce flows such as carts, checkout,
payments, customer accounts, stock reservation, fulfilment, confirmed booking,
or online ordering.

Phase 2C-A adds storage-backed listing media upload and public image rendering.
Authorised owner/admin users may upload approved listing image files from the
protected admin shell. The existing `POST /api/admin/product-images` route
keeps JSON metadata creation unchanged and handles multipart uploads through a
server-only branch that requires `productImage.write`, same-origin Origin/Host
validation, a valid CSRF proof, trusted workspace resolution, a session-bound
authenticated Supabase client, safe MIME/size/filename validation, and
server-generated `listing-media` storage paths. Public catalogue and listing
detail pages render real listing image URLs from approved metadata and keep
fallback images when media is missing or unavailable. The `listing-media`
bucket is public, so object serving is public by unguessable server-generated
URL; catalogue metadata gates which URLs the website renders, not whether a
known public object URL can be fetched.

Phase 2C-A approves only admin-controlled listing media upload and public
rendering. It does not add customer uploads, arbitrary public upload routes,
browser Supabase, service-role runtime paths, DB/API/table/RPC/RLS renames,
notifications, CRM integration, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, access to `website/chat-config.js`, or ecommerce flows such as
carts, checkout, payments, customer accounts, stock reservation, fulfilment,
confirmed booking, or online ordering.

Phase 2C-B adds public catalogue/detail polish and quote enquiry handoff. It
improves public catalogue cards and listing detail pages for real uploaded
listing images, preserves fallback imagery, adds safe catalogue/detail
metadata, and lets public CTAs pass an optional listing slug into the existing
quote request page. The quote page treats that slug as untrusted until resolved
through the public catalogue read surface and only uses it to display context
and prefill the existing items text area.

Phase 2C-B is public read-only polish only. It does not add customer uploads,
arbitrary public upload routes, public quote status tracking, notifications,
CRM integration, DB/API/table/RPC/RLS renames, browser Supabase, service-role
runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, access
to `website/chat-config.js`, or ecommerce flows such as carts, checkout,
payments, customer accounts, stock reservation, fulfilment, confirmed booking,
or online ordering.

Phase 2C-C adds admin quote operations and enquiry workflow closeout. It lets
authorised owner/admin users save internal follow-up notes alongside quote
request status changes from the protected admin quote inbox, and lets the
server-only admin quote read boundary return recent admin-only quote activity
for the trusted workspace. Quote workflow writes remain first-party,
route-gated, CSRF-protected, session-bound, and scoped by owner/admin RLS.

Phase 2C-C does not add public quote status tracking, customer-visible
internal notes, notifications, CRM integration, customer accounts, customer
uploads, arbitrary public upload routes, DB/API/RPC/table renames, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud
actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, access to
`website/chat-config.js`, or ecommerce flows such as carts, checkout,
payments, stock reservation, fulfilment, confirmed booking, or online
ordering.

Phase 2C-D adds quote workflow atomicity and admin operations hardening. It
replaces the Phase 2C-C multi-call quote status/activity write path with a
single narrow `execute_admin_quote_workflow` database function. The function
validates the authenticated owner/admin workspace actor, locks the target
quote request, updates only quote workflow status fields, and inserts related
internal activity in one transaction. Direct authenticated table write grants
for quote workflow updates/activity inserts are revoked or narrowed.

Phase 2C-D does not add public quote status tracking, customer-visible
internal notes, notifications, CRM integration, customer accounts, customer
uploads, arbitrary public upload routes, deployment config, Supabase Cloud
actions, browser Supabase, service-role runtime paths, n8n/Pinecone runtime
behavior, SaaS chatbot runtime work, access to `website/chat-config.js`, or
ecommerce flows such as carts, checkout, payments, stock reservation,
fulfilment, confirmed booking, or online ordering.

Phase 2D-A adds deployment readiness, environment contract, and smoke-test runbook updates only. It refreshes the existing deployment readiness package
for the current app state: active public catalogue workspace review, quote
workspace review, trusted admin workspace review, public `listing-media` bucket
serving expectations, storage-backed listing image rendering smoke tests,
admin listing image upload smoke tests, admin quote inbox/status/internal note
smoke tests, atomic quote workflow RPC checks, server-only n8n webhook checks,
trusted proxy/CDN client IP header review, rollback/disable steps, and operator
evidence capture.

Phase 2D-A does not approve deployment, Vercel project config, Supabase Cloud
config, production env files, real secrets, production seed data, runtime env
behaviour changes, browser Supabase, service-role runtime paths, customer
uploads, arbitrary public upload routes, public quote status tracking,
customer-visible internal notes, notifications, CRM integration, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, access to
`website/chat-config.js`, or ecommerce flows such as carts, checkout, payments,
customer accounts, stock reservation, fulfilment, confirmed booking, or online
ordering.

Phase 2D-B reconciles post-Phase 2D-A status, remaining-work mapping,
deployment evidence expectations, and static guard coverage only. It records
PR #97 as the latest completed deployment-readiness capability, distinguishes
completed admin-controlled listing media upload from still-blocked
customer/public upload surfaces, and keeps future deployment, privacy,
governance, and runtime tracks separate.

Phase 2D-B does not approve deployment, Vercel project config, Supabase Cloud
config, production env files, real secrets, production seed data, runtime env
behaviour changes, browser Supabase, service-role runtime paths, customer
uploads, arbitrary public upload routes, public quote status tracking,
customer-visible internal notes, notifications, CRM integration, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, access to
`website/chat-config.js`, or ecommerce flows such as carts, checkout, payments,
customer accounts, stock reservation, fulfilment, confirmed booking, or online
ordering.

Phase 2E-A adds privacy, retention, identity, and conversation/message governance planning before future transcript persistence. It documents PII minimisation, anonymous visitor identity, future authenticated/admin-linked identity considerations, retention rules, deletion/export expectations, transcript access rules, admin visibility boundaries, future persistence idempotency expectations, and redaction guidance.

Phase 2E-A is docs/checklist/static-guard planning only. Conversation/message
persistence is not implemented, transcript storage is not implemented, admin
transcript UI is not implemented, customer accounts are not approved, public
quote tracking is not approved, notifications are not approved, CRM integration
is not approved, n8n/Pinecone runtime changes are not approved, SaaS chatbot
runtime work is not approved, deployment is not approved, browser Supabase
remains forbidden, service-role runtime paths remain forbidden, and
`website/chat-config.js` access remains forbidden.

Phase 2E-B adds the conversation/message schema and RLS foundation only. It
hardens the existing `conversations` and `messages` tables with additive
metadata, retention, deletion marker, ordering, message-type, content-size,
and metadata-safety constraints, and it changes direct conversation/message
RLS to fail closed for anonymous/public and authenticated client roles.

Phase 2E-B does not wire runtime transcript writes, runtime transcript reads,
admin transcript UI, public transcript access, customer accounts, public quote
tracking, notifications, CRM integration, n8n/Pinecone runtime changes, SaaS
chatbot runtime work, deployment config, Supabase Cloud actions, browser
Supabase, service-role runtime paths, ecommerce flows, or
`website/chat-config.js` access. Runtime transcript writes remain blocked.
Runtime transcript reads remain blocked. Admin transcript UI remains blocked.
Customer accounts remain blocked. Public quote tracking remains blocked.
Notifications remain blocked. CRM integration remains blocked. Deployment
remains blocked.

Phase 2E-C adds the server-only transcript persistence contract and validation
boundary. It defines TypeScript command/result/adapter shapes for future
conversation/message persistence, pure validation and minimisation helpers,
safe command construction, safe unavailable/failure results, and
fake/injected adapter tests. The contract treats trusted workspace IDs as
server-owned, conversation/message IDs as server-generated inputs, anonymous
session hashes as correlation only, and `clientMessageId` as idempotency and
deduplication only.

Phase 2E-C does not wire runtime transcript writes, runtime transcript reads,
admin transcript UI, public transcript access, customer accounts, public quote
tracking, notifications, CRM integration, n8n/Pinecone runtime changes, SaaS
chatbot runtime work, deployment config, Supabase Cloud actions, browser
Supabase, service-role runtime paths, ecommerce flows, or
`website/chat-config.js` access. It does not call live Supabase, SQL, RPC,
n8n, Pinecone, or external providers. Runtime transcript writes remain
blocked. Runtime transcript reads remain blocked. Admin transcript UI remains
blocked. Customer accounts remain blocked. Public quote tracking remains
blocked. Browser Supabase remains forbidden. Service-role runtime paths remain
forbidden.

Phase 2E-D adds the server-only transcript persistence RPC/adapter boundary.
It adds a local Supabase SQL/RPC contract for validated trusted-workspace
conversation/message batches, keeps `clientMessageId` as idempotency only,
keeps anonymous session hashes as correlation only, preserves retention fields
and minimised metadata, and keeps browser roles ungranted. It also adds a
server-only TypeScript adapter that maps the Phase 2E-C command into an
injected RPC executor payload.

Phase 2E-D does not wire runtime transcript writes, runtime transcript reads,
admin transcript UI, public transcript access, customer accounts, public quote
tracking, notifications, CRM integration, n8n/Pinecone runtime changes, SaaS
chatbot runtime work, deployment config, Supabase Cloud actions, browser
Supabase, service-role runtime paths, ecommerce flows, or
`website/chat-config.js` access. It does not create a live service-role runtime
path and `/api/chat` remains unwired. Runtime transcript writes remain blocked.
Runtime transcript reads remain blocked. Admin transcript UI remains blocked.
Customer accounts remain blocked. Public quote tracking remains blocked.
Browser Supabase remains forbidden. Service-role runtime paths remain
forbidden.

Phase 2E-E adds transcript persistence activation governance and executor
approval gates only. It follows the Phase 2E-D hotfix that rejects conflicting
`clientMessageId` reuse and makes malformed runtime validation non-throwing.
It documents that the RPC remains ungranted to browser roles, the TypeScript
adapter requires an injected executor, no live executor exists yet, and any
future executor requires explicit owner approval, a reviewed privilege model,
failure redaction, idempotency proof, audit/evidence requirements, and
rollback/disable controls before `/api/chat` can use it.

Phase 2E-E does not add a live Supabase RPC executor, service-role runtime
path, `/api/chat` transcript write wiring, transcript reads, admin transcript
UI, deletion/export runtime paths, retention cleanup jobs, customer
identity/account linking, public quote tracking, notifications, CRM,
n8n/Pinecone runtime changes, SaaS chatbot runtime work, deployment config,
Supabase Cloud actions, browser Supabase, ecommerce flows, or
`website/chat-config.js` access.

Phase 2E-F adds transcript lifecycle governance and retention/deletion/export readiness only. It documents the future approval requirements for transcript retention policy, retention expiry handling, manual deletion requests, export requests, admin-only transcript access review, audit/evidence requirements, operator runbook requirements, failure/rollback/disable controls, data minimisation and redaction requirements, customer identity/account linking risks, and public quote tracking/public transcript access risks.

Phase 2E-F does not add runtime transcript writes, runtime transcript reads,
Live Supabase RPC executor, Any service-role or privileged DB execution
strategy, `/api/chat` transcript write wiring, Transcript deletion/export
runtime paths, Retention cleanup jobs, Admin transcript UI, Customer accounts,
Public quote tracking or public transcript access, Notifications, CRM
integration, n8n/Pinecone runtime changes, SaaS chatbot runtime work,
Deployment, Vercel config, Supabase Cloud config, env/secrets, production
evidence, browser Supabase, ecommerce flows, or `website/chat-config.js`
access.

Phase 2E-G adds transcript audit/evidence model and operator runbook readiness
only. It documents future transcript lifecycle audit event types, safe
audit/evidence field categories, forbidden audit/evidence material, operator
approval capture, dry-run/local proof, local SQL/RLS proof, static guard proof,
evidence template placeholders, failure triage, rollback/disable steps, audit
review, data minimisation review, redaction review, post-action verification,
and "Do not proceed" stop conditions.

Phase 2E-G does not add audit/evidence storage, audit/evidence runtime writers,
production evidence files, runtime transcript writes, runtime transcript reads,
Live Supabase RPC executor, Any service-role or privileged DB execution
strategy, `/api/chat` transcript write wiring, Transcript deletion/export
runtime paths, Retention cleanup jobs, Admin transcript UI, Customer accounts,
Public quote tracking or public transcript access, Notifications, CRM
integration, n8n/Pinecone runtime changes, SaaS chatbot runtime work,
Deployment, Vercel config, Supabase Cloud config, env/secrets, browser
Supabase, ecommerce flows, or `website/chat-config.js` access.

Phase 2E-H adds local transcript audit/evidence schema, RLS, and server-only contract foundation only. It creates local workspace-scoped
`transcript_audit_events` and `transcript_evidence_records` tables with RLS
enabled, no browser grants, no public policies, safe event/result/actor and
metadata constraints, and placeholder-only evidence summaries. It also adds a
server-only TypeScript contract under `website/lib/chat/audit/` with safe
command validation, unsafe payload rejection, a disabled default adapter, and
injected adapter calls only.

Phase 2E-H does not wire `/api/chat`, add runtime transcript writes, runtime
transcript reads, audit/evidence runtime writers, deletion/export runtime
paths, retention cleanup jobs, a live Supabase RPC executor, service-role
runtime paths, browser Supabase, admin transcript UI, production evidence,
customer accounts, public quote tracking or public transcript access,
notifications, CRM integration, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, deployment, Vercel config, Supabase Cloud config, env/secrets,
ecommerce flows, or `website/chat-config.js` access.

Phase 2E-I adds a server-only local/test-only insert boundary for transcript audit/evidence rows. It defines local `insert_transcript_audit_event` and `insert_transcript_evidence_record` RPC contracts for validated audit/evidence rows, keeps those functions ungranted to browser roles, validates trusted workspace scope and same-workspace relationships, reuses the shared safe metadata helper, and adds an injected TypeScript RPC adapter under `website/lib/chat/audit/`.

Phase 2E-I does not wire `/api/chat`, add admin transcript UI, add
deletion/export/retention runtime paths, add live Supabase service-role
execution, add browser grants, add browser Supabase, add production evidence,
change n8n/Pinecone runtime behavior, add SaaS chatbot runtime work, deploy,
change Vercel or Supabase Cloud config, access `website/chat-config.js`, or
add ecommerce flows. Product wording remains enquiry/quote/request.

Phase 2F-A adds a server-only listing-facing admin domain foundation for
admin-managed rental/event furniture listings and listing image metadata. It
adds `website/lib/listings/admin/` with listing-named TypeScript contracts and
an injected adapter that maps validated listing commands into the existing
`ProductPersistence` boundary. Existing `products`, `categories`, and
`product_images` database/API internals remain legacy technical names for this
phase; no DB/API/table/RPC/RLS rename is attempted.

Phase 2F-A does not add a Supabase migration, new runtime routes, public or
customer uploads, arbitrary upload endpoints, live Supabase executors, browser
Supabase, service-role runtime paths, admin transcript UI, `/api/chat`
transcript wiring, deletion/export/retention transcript runtime paths,
customer accounts, public quote tracking, customer-visible internal notes,
notifications, CRM integration, deployment, Vercel or Supabase Cloud config,
real env values, production evidence, or ecommerce flows such as carts,
checkout, payments, stock reservation, order fulfilment, confirmed booking, or
online ordering. Product wording remains listing/enquiry/quote/request.

Phase 2G-A adds RAG/search-index architecture and sync governance only. It
documents that Supabase/listing data remains canonical for website/admin
listing data and quote/enquiry workflows, while Pinecone is a future derived
search index only. It adds a dedicated `docs/RAG-SEARCH-INDEX-PLAN.md`
covering the future search document model, public-safe metadata rules,
outbox/worker sync lifecycle, stable IDs and `content_hash`, archived/
unpublished delete-or-hide behavior, metadata filters, reranking, and hybrid
search as a later decision gate.

Phase 2G-A does not add Pinecone runtime code, Pinecone package dependencies,
Pinecone env reads, secrets, API keys, n8n workflow/runtime changes,
embedding runtime, search-index tables, sync workers, `/api/chat` retrieval
wiring, admin UI changes, real data ingestion, real vector upsert/delete,
runtime reranking, hybrid search runtime, public/customer uploads, customer
accounts, public quote tracking, customer-visible internal notes,
notifications, CRM integration, deployment, Vercel or Supabase Cloud config,
browser Supabase, service-role runtime paths, transcript runtime paths, or
ecommerce flows. Future runtime sync/retrieval/reranking requires explicit
owner approval.

The metadata diagnostic denylist hotfix after Phase 2G-A restores provider
debug and trace dump key rejection in the shared SQL transcript metadata helper
and TypeScript audit/evidence contract only. It adds no transcript runtime
writes or reads, no live Supabase executor, no admin transcript UI, no
Pinecone/n8n runtime changes, no customer/public quote tracking functionality,
and no ecommerce functionality.

Phase 2G-B adds a local search-index outbox foundation only. It adds local
Supabase `search_index_jobs` and `search_index_documents` tables for future
queue/document tracking, plus a server-only disabled/injected TypeScript
contract boundary. Supabase/listing data remains canonical, and Pinecone
remains a future derived search index only.

Phase 2G-B does not add Pinecone runtime code, Pinecone package dependencies,
Pinecone env reads, Pinecone executors, API keys, n8n workflow/runtime
changes, embedding runtime, sync workers, `/api/chat` retrieval wiring, admin
UI changes, real data ingestion, real vector upsert/delete, runtime
reranking, hybrid search runtime, public/customer uploads, customer accounts,
public quote tracking, customer-visible internal notes, notifications, CRM
integration, deployment, Vercel or Supabase Cloud config, browser Supabase,
service-role runtime paths, transcript runtime paths, or ecommerce flows.
Future sync worker/retrieval/reranking/hybrid runtime requires explicit owner
approval.

Phase 2G-C/D adds server-only local search-index enqueue integration only. It
adds a narrow authenticated `enqueue_search_index_job` RPC, keeps direct
search-index table grants fail-closed, lets existing admin listing/category/
image metadata writes enqueue local outbox jobs after successful database
writes, and adds server-only TypeScript enqueue adapter plus pure safe job
builders.

Phase 2G-C/D does not add Pinecone runtime code, Pinecone package
dependencies, Pinecone env reads, Pinecone executors, API keys, n8n workflow/
runtime changes, embedding runtime, sync workers, `/api/chat` retrieval
wiring, admin UI changes, search-index document writers, real vector
upsert/delete, runtime reranking, hybrid search runtime, public/customer
uploads, customer accounts, public quote tracking, customer-visible internal
notes, notifications, CRM integration, deployment, Vercel or Supabase Cloud
config, browser Supabase, service-role runtime paths, transcript runtime
paths, or ecommerce flows. Future sync worker/retrieval/reranking/hybrid
runtime requires explicit owner approval.

Phase 2H-A/B adds the admin operations UI MVP. It splits the protected admin
shell into focused listing, category, media, quote request, and quote detail
surfaces while reusing the existing server-only admin auth/session/workspace
route-gate conventions.

Phase 2H-A/B keeps listing/category/listing-image writes on the existing
first-party admin routes and `execute_admin_product_write` persistence
boundary, preserving the Phase 2G-C/D local search-index enqueue behavior. It
keeps quote workflow review, status changes, and internal notes on the
existing protected quote workflow route and `execute_admin_quote_workflow`
RPC.

Phase 2H-A/B does not add Pinecone runtime code, Pinecone packages, Pinecone
env reads, Pinecone executors, API keys, n8n workflow/runtime changes,
embedding runtime, sync workers, `/api/chat` retrieval wiring, search-index
document writers, real vector upsert/delete, runtime reranking, hybrid search
runtime, public/customer upload routes, customer accounts, public quote
tracking, customer-visible internal notes, notifications, CRM integration,
deployment, Vercel or Supabase Cloud config, browser Supabase, service-role
runtime paths, transcript runtime paths, or ecommerce flows.

Phase 2I-A/B adds the public rental catalogue and quote request UX MVP. It
improves public homepage conversion sections, public rental listing browsing,
listing detail pages, category browsing, and quote/enquiry handoff while using
the existing public catalogue read boundary and public quote request boundary.

Phase 2I-A/B keeps public users limited to published public-safe
listing/category/listing-image data. Quote/enquiry submission confirms receipt
without exposing internal quote workflow state, admin internal notes, public
tracking links, customer accounts, notifications, CRM, or ecommerce flows.
Supabase remains canonical for website/admin listing and quote data, while
Pinecone remains a future derived index only.

Phase 2I-A/B does not add Pinecone runtime code, Pinecone packages, Pinecone
env reads, Pinecone executors, API keys, n8n workflow/runtime changes,
embedding runtime, sync workers, `/api/chat` retrieval wiring, search-index
document writers, real vector upsert/delete, runtime reranking, hybrid search
runtime, public/customer upload routes, customer accounts, public quote
tracking, customer-visible internal notes, notifications, CRM integration,
deployment, Vercel or Supabase Cloud config, browser Supabase, service-role
runtime paths, transcript runtime paths, or ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

Phase 2J-A/B adds MVP hardening, quote intake correctness, and demo readiness.
It preserves public quote/enquiry customer messages safely, adds a protected
dedicated admin quote-detail read path, improves public quote/listing empty,
error, success, and not-found states, and strengthens public catalogue to quote
submission to admin quote review coverage.

Phase 2J-A/B keeps public users unable to track quotes or view internal quote
workflow state. Admin internal notes remain admin-only. Supabase remains
canonical for website/admin listing and quote data, while Pinecone remains a
future derived index only.

Phase 2J-A/B does not add Pinecone runtime code, Pinecone packages, Pinecone
env reads, Pinecone executors, API keys, n8n workflow/runtime changes,
embedding runtime, sync workers, `/api/chat` retrieval wiring, search-index
document writers, real vector upsert/delete, runtime reranking, hybrid search
runtime, public/customer upload routes, customer accounts, public quote
tracking, customer-visible internal notes, notifications, CRM integration,
deployment, Vercel or Supabase Cloud config, browser Supabase, service-role
runtime paths, transcript runtime paths, or ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

Phase 2K-A/B adds admin write-boundary hardening and deployment readiness. It
blocks direct authenticated browser-role writes to listing metadata tables,
keeps admin listing/category/image writes on the protected
`execute_admin_product_write(...)` RPC, preserves product audit and local
search-index enqueue invariants, and refreshes deployment/demo readiness docs
and smoke-test runbooks.

Phase 2K-A/B keeps public catalogue reads on `get_public_catalogue(...)`,
public quote/enquiry submissions on `POST /api/quote`, and admin quote workflow
writes on `execute_admin_quote_workflow(...)`. Public users still cannot track
quotes or view internal quote workflow state, customer messages, quote items,
quote activity, or admin internal notes. Admin internal notes remain
admin-only.

Phase 2K-A/B does not deploy, add Vercel or Supabase Cloud config, add real
env values, add production evidence, add browser Supabase, add service-role
runtime paths, access `website/chat-config.js`, add public/customer upload
routes, add customer accounts, public quote tracking, customer-visible
internal notes, notifications, CRM integration, n8n/Pinecone runtime changes,
SaaS chatbot runtime work, Pinecone packages/env/API keys, embedding or
reranking runtime, `/api/chat` retrieval/RAG wiring, transcript runtime paths,
or ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

Phase 2L-A/B adds the release-candidate acceptance suite and final MVP polish.
It proves the current MVP surfaces locally before any future preview or
deployment review: public homepage/listings/listing detail/categories/
catalogue/quote/events/not-found states, quote/enquiry form behaviour,
protected admin operations, admin quote detail separation, admin listing/
category/image write boundaries, quote workflow boundaries, and final
static/security non-runtime scope.

Phase 2L-A/B keeps Supabase canonical for website/admin listing and quote data.
Pinecone remains a future derived search/retrieval index only. Admin
listing/category/image writes remain behind `execute_admin_product_write(...)`;
admin quote workflow writes remain behind `execute_admin_quote_workflow(...)`;
local search-index jobs remain local enqueue records only.

Phase 2L-A/B does not deploy, add Vercel or Supabase Cloud config, add real
env values, add production evidence, add browser Supabase, add service-role
runtime paths, access `website/chat-config.js`, add public/customer upload
routes, add customer accounts, public quote tracking, customer-visible
internal notes, notifications, CRM integration, n8n/Pinecone runtime changes,
SaaS chatbot runtime work, Pinecone packages/env/API keys, embedding or
reranking runtime, `/api/chat` retrieval/RAG wiring, transcript runtime paths,
or ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

Phase 2M-A/B adds preview/deployment review preflight and CI parity hardening.
It closes the release-gate parity gap by making pull-request CI run the full
release-candidate command set where practical, including Docker-backed local
Supabase RLS/schema tests and `git diff --check`, and by adding a local
`npm run validate:release-candidate` convenience gate.

Phase 2M-A/B records the future preview/deployment review preflight checklist:
environment variable inventory by visibility, workspace ID review, Supabase
Cloud review, admin access review, public quote/listing smoke checks, and
rollback/abort checks.

Phase 2M-A/B does not deploy, add Vercel or Supabase Cloud config, add real
env values, add production evidence, add browser Supabase, add service-role
runtime paths, access `website/chat-config.js`, add public/customer upload
routes, add customer accounts, public quote tracking, customer-visible
internal notes, notifications, CRM integration, n8n/Pinecone runtime changes,
SaaS chatbot runtime work, Pinecone packages/env/API keys, embedding or
reranking runtime, `/api/chat` retrieval/RAG wiring, transcript runtime paths,
or ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

Phase 2N-A/B adds server runtime configuration hardening and a local deploy
dry-run harness. It centralizes typed, server-only parsing for the existing
Supabase, catalogue, quote, admin, chat, n8n, and trusted-header settings and
adds `npm run validate:deploy-dry-run` as a local review harness that runs the
release-candidate gate plus static/runtime config checks.

Phase 2N-A/B does not deploy, add Vercel or Supabase Cloud config, add real
env values, add production evidence, add browser Supabase, add service-role
runtime paths, access `website/chat-config.js`, add public/customer upload
routes, add customer accounts, public quote tracking, customer-visible
internal notes, notifications, CRM integration, n8n/Pinecone runtime changes,
SaaS chatbot runtime work, Pinecone packages/env/API keys, embedding or
reranking runtime, `/api/chat` retrieval/RAG wiring, transcript runtime paths,
or ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

Phase 2O-A/B adds preview deployment approval package docs and redacted
operator evidence templates. It gives the future deployment lane an
operator-facing approval packet, redacted evidence templates, go/no-go
decision capture, and `npm run validate:preview-approval-package` static
validation before any separately approved preview or deployment PR.

Phase 2O-A/B does not deploy, approve deployment, add Vercel or Supabase
Cloud config, add real env values, add filled production evidence, add browser
Supabase, add service-role runtime paths, access `website/chat-config.js`, add
public/customer upload routes, add customer accounts, public quote tracking,
customer-visible internal notes, notifications, CRM integration, n8n/Pinecone
runtime changes, SaaS chatbot runtime work, Pinecone packages/env/API keys,
embedding or reranking runtime, `/api/chat` retrieval/RAG wiring, transcript
runtime paths, or ecommerce flows such as carts, checkout, payments, stock
reservation, confirmed booking, order fulfilment, or online ordering.

Phase 2P-A/B adds an external preview smoke harness and rollback drill package.
It gives operators a reviewed `npm run smoke:preview` command for external
preview targets supplied through `SKR_PREVIEW_BASE_URL`, a deterministic
no-network `npm run validate:preview-smoke-harness` static validator for CI,
and redacted rollback drill/result templates.

Phase 2P-A/B does not deploy, approve deployment, add Vercel or Supabase
Cloud config, add real env values, add filled preview or production evidence,
add browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, public quote tracking, customer-visible internal notes,
notifications, CRM integration, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, Pinecone packages/env/API keys, embedding or reranking runtime,
`/api/chat` retrieval/RAG wiring, transcript runtime paths, or ecommerce flows
such as carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze
package. It records the verified PR #117 through PR #121 capability chain, a
final no-deploy handoff, an explicit next-step decision table, branch-freeze
rules, blocker definitions, outside-git evidence requirements, and
`npm run validate:preview-handoff` as deterministic no-network validation.

Phase 2Q-A/B does not deploy, approve deployment, add Vercel or Supabase
Cloud config, add real env values, add filled preview or production evidence,
add browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, public quote tracking, customer-visible internal notes,
notifications, CRM integration, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, Pinecone packages/env/API keys, embedding or reranking runtime,
`/api/chat` retrieval/RAG wiring, transcript runtime paths, or ecommerce flows
such as carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## Phase 3A: Product Polish, Content, And Rental UI Iteration

Phase 3A-A/B adds product-facing polish for the public rental catalogue,
quote/enquiry flow, and protected admin usability. It improves listing card
quote cues, listing detail planning copy, quote form helper/receipt/error
states, admin empty states, archive guidance, focus states, and accessibility
text while keeping public users on published public-safe listing/category/
image data only.

Phase 3A-A/B keeps the site as a normal furniture/event rental website. Public
users browse rental/event furniture listings and submit quote/enquiry requests.
Admin users manage listings/images and the quote workflow. Copy should use
listing, enquiry, quote, quote request, rental request, selected items, and
requested items wording.

Phase 3A-A/B does not deploy, approve deployment, add Vercel or Supabase
Cloud config, add real env values, add filled preview or production evidence,
add browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, or add ecommerce flows such as carts, checkout,
payments, stock reservation, confirmed booking, order fulfilment, or online
ordering.

## Phase 3B: Admin Operations Readiness And Quote Triage Polish

Phase 3B-A/B adds admin operations readiness and quote triage polish for the
protected admin listing, category, media, and quote workflow surfaces. It
improves listing publication readiness cues, category grouping guidance, media
readiness guidance, quote request triage summaries, missing-data hints,
requested item cues, customer message cues, and admin-only internal follow-up
guidance.

Phase 3B-A/B keeps the work repo-local and admin/product-scoped. Public users
still browse rental/event furniture listings and submit quote/enquiry requests
with receipt-only success. Admin users use the protected existing admin
surfaces to understand listing readiness and quote triage status before any
separately approved preview deployment.

Phase 3B-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, or add ecommerce flows such as carts, checkout,
payments, stock reservation, confirmed booking, order fulfilment, or online
ordering.

## Phase 3C: Public Catalogue Discovery And Quote Funnel Polish

Phase 3C-A/B adds public catalogue discovery and quote funnel polish for the
public catalogue, listing, category, and quote request surfaces. It improves
category discovery affordances, event setup guidance, filtered catalogue
recovery paths, category empty states, selected-listing quote handoff,
requested-item context, and quote helper copy around event date, venue,
quantities, setup notes, and contact method.

Phase 3C-A/B keeps the work repo-local and public/product-scoped. Public users
still browse public-safe rental/event furniture listings and submit
quote/enquiry requests with receipt-only success. Admin internal notes remain
admin-only, and public catalogue data stays limited to published listing,
category, and image metadata.

Phase 3C-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, or add ecommerce flows such as carts, checkout,
payments, stock reservation, confirmed booking, order fulfilment, or online
ordering.

## Phase 3D: Sitewide Public Journey, Trust Content, And Route Polish

Phase 3D-A/B adds sitewide public journey, trust content, and route polish for
the homepage, public catalogue, listing, category, event setup, and quote
request surfaces. It improves homepage journey guidance, event setup
expectation-setting, route recovery links, listing detail quote-request
preparation, quote enquiry expectations, and route metadata.

Phase 3D-A/B keeps content public-safe and honest. Public users browse
public-safe rental/event furniture listings, prepare event date, venue,
quantities, alternates, and setup notes, then submit quote/enquiry requests
with receipt-only success. The site does not claim verified clients, awards,
certifications, real contact details, legal commitments, or production
policies that are not already present in the repo.

Phase 3D-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, legal claims, production policies, or add ecommerce flows such as
carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## Phase 3E: Product Readiness, Navigation QA, And Dead-End Polish

Phase 3E-A/B adds product readiness, navigation QA, and public/admin dead-end
polish for key public and protected admin surfaces. It verifies internal route
links across homepage, catalogue, listings, categories, events, quote, listing
detail, and protected admin operations surfaces with deterministic static and
render coverage.

Phase 3E-A/B improves empty, filtered, missing, blocked, and unavailable
states without crossing public/admin boundaries. Public recovery paths point
back to listings, categories, events, or quote enquiry. Admin recovery paths
stay inside protected admin overview, listing, category, media, and quote
management surfaces.

Phase 3E-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3F: Catalogue Content Quality, Media Readiness, And Admin Publication Polish

Phase 3F-A/B adds catalogue content quality, media readiness, and admin
publication polish for public listing/category/quote handoff surfaces and
protected admin listing/category/media readiness panels. It improves
incomplete-but-safe public listing and category copy, keeps fallback imagery
and honest alt text coherent, and clarifies quote handoff copy when selected
listing context is missing, invalid, unpublished, or unavailable.

Phase 3F-A/B keeps readiness hints admin-only. Protected admin surfaces may
summarize draft, published, and archived listings; published listings missing
category, media, alt text, or quote-planning details; categories with no
published listings; duplicate or missing active primary image metadata; inactive
image metadata; and listings with no active public image metadata.

Phase 3F-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3G: Quote Intake Quality, Admin Triage Depth, And Enquiry Workflow Polish

Phase 3G-A/B adds quote intake quality, admin triage depth, and enquiry
workflow polish for the public quote/enquiry form, selected-listing handoff,
protected admin quote inbox, and protected admin quote detail surfaces. It
improves contact/event/item helper copy, receipt-only success copy, selected
listing expectation-setting, admin-only missing-info summaries, next-action
cues, and detail readability from existing quote request data.

Phase 3G-A/B keeps public and admin boundaries separated. Public users submit
quote/enquiry requests and receive only receipt-style confirmation. Admin
users can triage quote requests, read requested item snapshots, review
customer messages, and record internal follow-up status or notes inside the
protected admin workspace. Internal activity, internal notes, and admin triage
details remain admin-only.

Phase 3G-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3H: Admin Operator QA, Dashboard Consistency, And Non-Deployment Release Readiness Polish

Phase 3H-A/B adds admin operator QA, dashboard consistency, and
non-deployment release readiness polish for the protected admin overview,
listings, categories, media, quote inbox, and quote detail surfaces. It
improves consistent headings, summaries, aria labels, read-only/write-enabled
distinctions, public-facing/admin-only boundaries, empty and recovery states,
and next safe admin actions from existing workspace data.

Phase 3H-A/B keeps recovery and readiness guidance admin-only. Public users
continue to browse public rental/event furniture listings and submit
receipt-only quote/enquiry requests without public quote tracking, customer
accounts, internal notes, admin management URLs, or admin triage details.

Phase 3H-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3I: Full-Site Acceptance QA, Public SEO/Accessibility Polish, And Non-Deployment Release Hardening

Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and
non-deployment release hardening for the homepage, catalogue, listings,
categories, events, quote, listing detail, and recovery surfaces. It verifies
public route metadata, heading clarity, internal link paths, selected-listing
quote context, receipt-only quote expectations, and deterministic no-deploy
guardrails.

Phase 3I-A/B keeps public and admin boundaries separated. Public users browse
public rental/event furniture listings, public categories, event setup
guidance, listing detail pages, safe not-found/recovery states, and
receipt-only quote/enquiry requests without seeing admin readiness cues,
internal quote notes, protected management URLs, or admin triage details.

Phase 3I-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3J: Owner Review Readiness Package, Manual QA Runbook, And Release-Decision Preparation

Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and
release-decision preparation for the current repo-local rental website
candidate. It summarizes what is ready for owner review, what is intentionally
not implemented, public website journey readiness, protected admin
listing/category/media readiness, quote/enquiry intake and admin triage
readiness, owner-supplied content needs, known deferred capabilities, and
future go/no-go decision points.

Phase 3J-A/B keeps deployment approval separate. Manual QA steps are non-live
and repo-local. Owner decision materials can say Hold deployment or Approve
future deployment separately, but this phase does not perform deployment,
approve deployment, connect providers, or add filled preview or production
evidence.

Phase 3J-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, testimonials, client
names, awards, certifications, legal claims, production policies, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## Phase 3K: Owner Content Intake, Content Gap Register, And Launch-Blocker Governance

Phase 3K-A/B adds owner content intake, a content gap register, and
launch-blocker governance for the current repo-local rental website candidate.
It collects owner-supplied requirements for approved brand spelling, public
display name, listing/product names, listing/category/event descriptions,
image selection and alt text, public service-area wording, public contact
details, business hours, operating expectations, legal/policy wording, and
admin access/workspace ownership expectations.

Phase 3K-A/B keeps unknown real-world business facts marked as owner input
required. Missing real contact/legal/business-hour content does not get
invented. Owner review can continue without deployment, but public launch
cannot proceed until required owner content and explicit deployment approval
are both supplied.

Phase 3K-A/B separates Blocks owner review, Blocks launch/deployment, Deferred
after launch, and Not in scope by owner direction so content decisions do not
silently turn into deployment approval or runtime work.

Phase 3K-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, business hours,
addresses, testimonials, client names, awards, certifications, legal claims,
guarantees, production policies, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## Phase 3L: Protected Content Readiness Workspace, Owner-Review Issue Ledger, And Public Copy Fact-Safety Audit

Phase 3L-A/B adds a protected content readiness workspace, owner-review issue
ledger, and public copy fact-safety audit for the current repo-local rental
website candidate. It turns the Phase 3K owner content intake and content gap
register into an admin-only review surface inside the existing protected admin
shell.

Phase 3L-A/B keeps owner review and public launch separate. The protected
workspace summarizes owner-required content gaps from
`docs/content/OWNER-CONTENT-INTAKE.md` and
`docs/content/CONTENT-GAP-REGISTER.md`, while the owner-review issue ledger
records safe issue categories and status values without adding public customer
issue tracking.

Phase 3L-A/B adds deterministic public copy fact-safety coverage. Public
routes must not expose owner-only readiness statuses, admin issue ledger
details, protected admin URLs, internal notes, fake contact details, business
hours, physical addresses, client names, testimonials, awards,
certifications, legal claims, guarantees, production policies, or ecommerce
wording.

Phase 3L-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, business hours,
addresses, testimonials, client names, awards, certifications, legal claims,
guarantees, production policies, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## Phase 3M: Owner-Review Execution Checklist, Route-By-Route Decision Matrix, And Admin Review Snapshot

Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision
matrix, and admin review snapshot for the current repo-local rental website
candidate. It turns the Phase 3L protected content readiness workspace and
owner-review issue ledger into an executable owner/admin review package.

Phase 3M-A/B keeps owner review non-live and route-specific. The execution
checklist defines what to review, the required owner decision, owner-input
fields, launch/deployment blocker status, deferred/not-in-scope notes, and the
public/admin visibility boundary for every public and protected review
surface.

Phase 3M-A/B adds a route decision matrix that maps public and protected route
families to readiness status, owner decisions, owner review blockers, launch
blockers, public-safe notes, and admin-only notes. The protected content
readiness workspace summarizes review surface groups, route families covered,
owner decision categories, owner-input-required categories, and launch-blocker
categories while keeping those details inside protected admin routes.

Phase 3M-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, business hours,
addresses, testimonials, client names, awards, certifications, legal claims,
guarantees, production policies, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## Phase 3N: Owner-Review Dry-Run Packet, Findings Disposition Workflow, And Launch Hold/Approve Rehearsal

Phase 3N-A/B adds an owner-review dry-run packet, findings disposition
workflow, and launch hold/approve rehearsal for the current repo-local rental
website candidate. It turns the Phase 3M execution checklist, route decision
matrix, and admin review snapshot into template-only review materials.

Phase 3N-A/B keeps owner review non-live and placeholder-only. The dry-run
packet lists each public and protected review area, review objectives,
questions for the owner, safe outcome statuses, owner-input-required
placeholders, launch-blocker classification, deferred/not-in-scope notes, and
public/admin visibility boundaries without claiming that review happened.

Phase 3N-A/B adds a findings disposition workflow that routes placeholder
findings into safe statuses and next local actions. It also adds launch
hold/approve rehearsal language that separates continuing owner review, holding
launch, preparing for later deployment planning, and separately approving any
future deployment.

Phase 3N-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled preview or production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer uploads, add customer accounts,
add public quote tracking, expose customer-visible internal notes, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
Pinecone packages/env/API keys, wire `/api/chat` to retrieval/RAG, add
transcript runtime paths, invent real contact details, business hours,
addresses, testimonials, client names, awards, certifications, legal claims,
guarantees, production policies, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## Phase 3O: Owner-Review Correction Intake, Launch-Blocker Freeze Gate, And Admin Triage Snapshot

Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate,
and admin triage snapshot for the current repo-local rental website candidate.
It turns the Phase 3N dry-run packet and launch rehearsal into template-only
future correction capture and freeze planning.

Phase 3O-A/B keeps correction handling non-live and placeholder-only. The
correction intake defines safe correction categories, safe statuses, future
local PR placeholders, evidence handling placeholders, and owner-input-required
boundaries without recording actual owner corrections or owner sign-off.

Phase 3O-A/B adds a launch-blocker freeze gate that separates owner-review
blockers, launch/deployment blockers, deferred items, out-of-scope items, and
separate deployment approval boundaries. It also adds a correction PR plan that
shows how future owner-supplied corrections should be split into narrow local
PRs after the owner supplies approved content.

Phase 3O-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled owner-review evidence, add filled
preview or production evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer uploads, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add Pinecone packages/env/API keys, wire `/api/chat` to
retrieval/RAG, add transcript runtime paths, invent real contact details,
business hours, addresses, testimonials, client names, awards, certifications,
legal claims, guarantees, production policies, or add ecommerce flows such as
carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## Phase 3P: Owner-Review Closure Packet, Readiness Sign-Off Template, And Deployment Approval Separation

Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template,
and deployment approval separation for the current repo-local rental website
candidate. It turns the Phase 3O correction intake, launch-blocker freeze
gate, and correction PR plan into template-only closure readiness material.

Phase 3P-A/B keeps closure handling non-live and placeholder-only. The closure
packet defines what it means for owner review to continue, owner review to be
blocked, and owner review to be locally ready to close. The sign-off template
keeps required fields empty and makes clear that closure readiness does not
record owner sign-off.

Phase 3P-A/B adds deployment approval separation material that distinguishes
owner-review closure readiness, deployment approval, preview evidence,
production launch, and post-launch monitoring. It also adds a protected admin
closure readiness snapshot with template-only status values and explicit
deployment approval status.

Phase 3P-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled owner-review evidence, add filled
preview or production evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer uploads, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add Pinecone packages/env/API keys, wire `/api/chat` to
retrieval/RAG, add transcript runtime paths, invent real contact details,
business hours, addresses, testimonials, client names, awards, certifications,
legal claims, guarantees, production policies, or add public/customer
transaction flows, retail transaction flows, stock-reservation-like flows, or
fulfilment-like flows.

## Phase 3V: Quote Enquiry Workflow Hardening, Protected Admin Triage Polish, And Local Acceptance Coverage

Phase 3V-A/B hardens the public quote/enquiry conversion path and protected
admin quote triage for the current furniture/event rental website candidate.

Phase 3V-A/B improves the public quote/enquiry page so users can understand
what to provide: event date, venue or location, requested listings or items,
quantities, alternatives, setup/access/timing notes, and preferred contact
method. Public response copy remains receipt-like and does not imply customer
accounts, public tracking, transaction-like, retail-like,
stock-hold-like, or rental-completion-like flows.

Phase 3V-A/B improves listing, category, and event handoff wording with
customer-facing rental language such as Request this listing, Send category
enquiry, Compare event setup guidance, Start quote request, Bring event
details, Add quantities and alternatives, and Share setup/access/timing notes.

Phase 3V-A/B polishes protected admin quote triage by grouping contact and
follow-up, event and setup details, requested listings and items, and
admin-only status and notes. Internal notes and status history stay inside
protected admin surfaces and never appear on public routes.

Phase 3V-A/B adds
`docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md` as a repo-local,
template-only, non-live checklist and adds an admin-only quote/enquiry
acceptance snapshot inside the protected content readiness workspace.

Phase 3V-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real secrets or env values, add filled evidence, invent owner
review, invent real business facts, add browser Supabase, add service-role
runtime paths, add n8n/Pinecone/RAG runtime changes, add public uploads, add
customer accounts, add public quote tracking, add notifications or CRM, or add
self-service completion-like, stock-hold-like, rental-completion-like, or
customer account flows.

## Phase 3U: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall

Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board,
and deployment decision firewall for the current furniture/event rental website
candidate.

Phase 3U-A/B adds `docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md` as a
repo-local, template-only, non-live handoff pack that summarizes current
candidate purpose, public route review, protected admin review, local suite
scope, owner input still required, local follow-up categories, blocked future
work, and failure reporting without evidence files.

Phase 3U-A/B adds `docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md` as a
template-only triage board for public route polish, listing/category/media
content, quote/enquiry flow, protected admin workflow, owner input required,
local suite failure, future deployment blockers, deferred after launch, and
not-in-current-scope follow-up.

Phase 3U-A/B adds `docs/content/DEPLOYMENT-DECISION-FIREWALL.md` to separate
local acceptance readiness, owner review readiness, owner sign-off, deployment
approval, provider configuration, preview publication, production launch, and
post-launch monitoring. Local acceptance, owner-review closure readiness, and
handoff pack completion do not approve deployment.

Phase 3U-A/B adds an admin-only final handoff snapshot inside the protected
content readiness workspace and extends local validators to check the new
handoff pack, triage board, deployment decision firewall, public leakage
boundaries, and no-deploy/no-evidence scope.

Phase 3U-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real secrets or env values, add filled evidence, invent owner
review, invent real business facts, add browser Supabase, add service-role
runtime paths, add n8n/Pinecone/RAG runtime changes, add public uploads, add
customer accounts, add public quote tracking, add notifications or CRM, or add
self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## Phase 3T: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist

Phase 3T-A/B adds a local release-candidate command centre,
acceptance-suite orchestration, and no-deploy command allowlist for the current
furniture/event rental website candidate.

Phase 3T-A/B adds
`docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md` as a repo-local,
template-only, non-live command centre defining safe local command groups,
forbidden command categories, local acceptance-suite sequence, command purpose,
what commands prove, what commands do not prove, blocked future work, and
failure reporting without filled evidence.

Phase 3T-A/B adds `scripts/validate-release-candidate-suite.cjs` and
`validate:release-candidate-suite` as a fail-fast local suite runner for the
safe repo validators, local Supabase checks, n8n validators, website tests,
website typecheck, and website build. The suite runner does not run deployment,
provider, live preview, network, environment-file, evidence-writing, or legacy
local chat configuration commands.

Phase 3T-A/B adds an admin-only command centre snapshot inside the protected
content readiness workspace and extends local validators to check the command
centre, suite runner, package script, allowlist, forbidden-command audit,
public leakage boundaries, and no-deploy/no-evidence scope.

Phase 3T-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real secrets or env values, add filled evidence, invent owner
review, invent real business facts, add browser Supabase, add service-role
runtime paths, add n8n/Pinecone/RAG runtime changes, add public uploads, add
customer accounts, add public quote tracking, add notifications or CRM, or add
self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## Phase 3S: Local Release-Candidate Acceptance Gate, Route Inventory Freeze, And Public/Admin Regression Harness

Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route
inventory freeze, and public/admin regression harness for the current
furniture/event rental website candidate.

Phase 3S-A/B adds
`docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md` as a
template-only, non-live matrix for route purpose, audience, allowed wording,
forbidden public wording, data boundary, owner input status, deployment
boundary, acceptance status placeholders, and local follow-up placeholders.

Phase 3S-A/B adds `docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md` as a local
route-group expectation freeze covering public homepage, listings/catalogue,
listing detail, categories, category-to-listing journey, events/event-use
guidance, quote/enquiry request, not-found/recovery, protected admin overview,
protected listing/category/media operations, protected quote inbox/detail, and
the protected content readiness workspace.

Phase 3S-A/B adds `scripts/validate-local-release-candidate.cjs` and
`validate:local-release-candidate` to make local review deterministic. The
validator checks the new docs, Phase 3S status tracking, public route leakage,
public wording safety, protected admin snapshot references, forbidden tracked
runtime/config/evidence paths, and Pinecone/n8n boundary preservation without
running deployment, provider, or live preview commands.

Phase 3S-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real secrets or env values, add filled evidence, invent owner
review, invent real business facts, add browser Supabase, add service-role
runtime paths, add n8n/Pinecone/RAG runtime changes, add public uploads, add
customer accounts, add public quote tracking, add notifications or CRM, or add
self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## Phase 3R: Product Acceptance Hardening, Public/Admin Route Polish, And Owner-Demo Issue Backlog Readiness

Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route
polish, and owner-demo issue backlog readiness for the current furniture/event
rental website candidate. It keeps the public website focused on normal
listing, enquiry, quote, request, rental, and event furniture language.

Phase 3R-A/B improves public route guidance, empty-state recovery,
category/listing/event setup cross-links, listing fit-check copy, and
quote/enquiry handoff clarity without adding public tracking, customer
accounts, self-service completion flows, or invented facts.

Phase 3R-A/B adds `docs/content/OWNER-DEMO-ISSUE-BACKLOG.md` as a
template-only owner-demo issue backlog and adds an admin-only backlog snapshot
to the protected content readiness workspace. The backlog separates product
polish, owner input required, owner-review blockers, future launch/deployment
blockers, deferred work, and out-of-scope items without recording real owner
corrections or approving launch.

Phase 3R-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled owner-review evidence, add filled
preview or production evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer uploads, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add Pinecone packages/env/API keys, wire `/api/chat` to
retrieval/RAG, add transcript runtime paths, invent real contact details,
business hours, addresses, testimonials, client names, awards, certifications,
legal claims, guarantees, production policies, or add self-service
completion-like flows, stock-reservation-like flows, fulfilment-like flows, or
customer account flows.

## Phase 3Q: Repo-Local Owner-Demo Polish, Public Journey QA Hardening, And Protected Admin Closure Workspace Polish

Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening,
and protected admin closure workspace polish for the current rental website
candidate. It pivots from governance-only closure templates into a reviewable
public/admin walkthrough while keeping the work non-live and local.

Phase 3Q-A/B adds a template-only owner-demo walkthrough covering homepage,
catalogue/listing, category/event-use, quote/enquiry request, protected admin
overview, listing/category/media, quote workflow, and protected content
readiness review. The walkthrough keeps placeholders empty and records no
owner decision.

Phase 3Q-A/B polishes public route guidance around listing, enquiry, quote,
request, rental, and event furniture wording. It also adds an admin-only
owner-demo snapshot to the protected content readiness workspace so authorised
admins can see that demo review, closure readiness, and deployment approval
remain separate.

Phase 3Q-A/B does not deploy, approve deployment, add Vercel or Supabase Cloud
config, add real env values, add filled owner-review evidence, add filled
preview or production evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer uploads, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add Pinecone packages/env/API keys, wire `/api/chat` to
retrieval/RAG, add transcript runtime paths, invent real contact details,
business hours, addresses, testimonials, client names, awards, certifications,
legal claims, guarantees, production policies, or add public self-service
rental completion flows outside the current quote request path.

Phase 3W-A/B hardens the public catalogue/listing/category/media discovery path and protected admin content-ops surfaces while keeping catalogue/listing/media acceptance repo-local and template-only.


## Phase 3X: Protected Admin Write-Ops Hardening, Content-Operation Guardrails, And Local Acceptance Coverage

Phase 3X-A/B hardens the protected admin write operations lane for listing,
category, media, and quote follow-up workflows. It keeps public quote/enquiry
and catalogue discovery unchanged while making protected admin operations
safer, clearer, and better covered by local tests and validators.

Phase 3X-A/B improves protected listing, category, media, image upload, and
quote follow-up copy with clearer public-field labels, helper text,
validation/recovery language, read/write boundary cues, draft/published/archive
and media readiness guidance, and admin-only status/note controls.

Phase 3X-A/B adds `docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md`
as a repo-local, template-only, non-live checklist and adds a protected admin
write-ops acceptance snapshot to `/admin/content-readiness` for authorised
admins only.

Phase 3X-A/B remains repo-local only. It does not deploy, approve deployment,
add provider config, add real secrets or env values, add filled evidence,
invent owner feedback or sign-off, add browser Supabase, add service-role
runtime paths, change n8n/Pinecone/RAG runtime behavior, or add out-of-scope
public visitor self-service workflows.
