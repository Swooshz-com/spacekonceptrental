# No-Deploy Preflight Command Center

Status: repo-local, template-only, non-live, and not evidence.
Evidence status: [NOT EVIDENCE / NOT RECORDED].
Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED].

Passing all commands does not equal owner approval. Passing all commands does not equal provider approval. Passing all commands does not equal deployment approval. No preview smoke command is allowed in this phase. Docker unavailability may be reported only in PR text; do not bypass Docker-required checks.

Run this exact sequence before any future approval request:

| Command | What it proves | What it does not prove | Failure response | Evidence boundary | Deployment boundary |
| --- | --- | --- | --- | --- | --- |
| `git diff --check` | The patch has no whitespace errors. | It does not prove content approval, provider readiness, or deployment readiness. | Fix the whitespace issue before requesting review. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:owner-approval-request` | The Phase 4E approval gate remains intact. | It does not record owner approval or permit preview/provider/deployment work. | Fix the local template/status failure. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:local-freeze` | The local release-candidate freeze guardrails remain intact. | It does not approve release, launch, provider setup, or deployment. | Fix the local freeze guardrail failure. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:owner-review-rehearsal` | Owner-review rehearsal templates remain local and protected. | It does not show owner review occurred. | Fix the rehearsal template/protection failure. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:preview-handoff` | Preview handoff documents remain safe and local. | It does not approve preview planning or provider setup. | Fix the handoff boundary failure. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:local-release-candidate` | The local release-candidate checks remain aligned. | It does not prove deployment readiness or owner approval. | Fix the release-candidate guardrail failure. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm test` | Website tests pass locally. | It does not prove owner approval, provider approval, or deployment approval. | Fix failing website tests without weakening safety assertions. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm run typecheck` | Website TypeScript checks pass locally. | It does not prove runtime provider access or deployment approval. | Fix type errors. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `cd website && npm run build` | The website builds locally. | It does not deploy, smoke a preview, or approve provider setup. | Fix build errors locally. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
| `npm run validate:release-candidate-suite` where Docker/Supabase is available | The full local release-candidate suite passes in an environment with required Docker/Supabase support. | It does not grant owner, provider, preview, or deployment approval. | If Docker/Supabase is unavailable, report that limitation in PR text only; do not bypass Docker-required checks. | [NOT EVIDENCE / NOT RECORDED] | [DEPLOYMENT APPROVAL: NOT GRANTED] |
