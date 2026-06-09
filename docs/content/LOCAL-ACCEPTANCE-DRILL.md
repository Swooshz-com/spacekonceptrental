# Local Acceptance Drill

This local acceptance drill is repo-local, template-only, non-live, and not evidence. It defines a deterministic dry-run sequence for future local review without recording pass/fail evidence, owner answers, owner decisions, owner sign-off, preview evidence, production evidence, provider access, deployment evidence, or deployment approval.

Evidence boundary: `[NOT EVIDENCE / NOT RECORDED]`.

Deployment boundary: `[DEPLOYMENT APPROVAL: NOT GRANTED]`.

## Dry-Run Sequence

1. Confirm public route wording remains rental/enquiry-only.
2. Confirm quote/enquiry remains request/intake only.
3. Confirm no public account/tracking/upload/notification/CRM flow exists.
4. Confirm no ecommerce/cart/checkout/order/payment wording exists.
5. Confirm admin-only release-control and correction internals are protected.
6. Confirm fake facts remain absent.
7. Confirm no provider/runtime/deployment files or env reads were added.
8. Confirm release-candidate suite was not weakened.

## Command Checklist

| Command | Expected pass condition | Expected blocked condition | Evidence boundary | Deployment boundary |
| --- | --- | --- | --- | --- |
| `git diff --check` | [EXPECTED PASS: whitespace check has no errors.] | [EXPECTED BLOCKED: whitespace errors require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:owner-review-rehearsal` | [EXPECTED PASS: Phase 4C local rehearsal boundaries validate.] | [EXPECTED BLOCKED: rehearsal docs/status/safety checks require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm test -- phase-4c-ab-local-owner-review-rehearsal.test.tsx` | [EXPECTED PASS: targeted Phase 4C tests pass locally.] | [EXPECTED BLOCKED: targeted test failure requires local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm test` | [EXPECTED PASS: website tests pass locally.] | [EXPECTED BLOCKED: local test failure requires local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm run typecheck` | [EXPECTED PASS: TypeScript check passes locally.] | [EXPECTED BLOCKED: type errors require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm run build` | [EXPECTED PASS: local build completes without deployment.] | [EXPECTED BLOCKED: build errors require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:preview-handoff` | [EXPECTED PASS: preview handoff stays local and non-live.] | [EXPECTED BLOCKED: handoff safety checks require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:local-release-candidate` | [EXPECTED PASS: local release-candidate gate stays safe.] | [EXPECTED BLOCKED: local release-candidate safety checks require local correction.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:release-candidate-suite` | [EXPECTED PASS: suite completes only where required local environment is available.] | [EXPECTED BLOCKED: missing local environment or suite failure must be reported without adding bypasses.] | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |

Do not add live preview smoke commands, deployment commands, provider commands, Docker-skip bypasses, filled owner-review evidence, filled preview evidence, production evidence, or acceptance results to this drill.
