# Owner-Review Deployment Approval Separation

This note separates owner-review closure readiness from deployment approval.
Phase 3P does not approve deployment, preview publication, production launch,
provider configuration, or live smoke testing.

Deployment approval remains `[DEPLOYMENT APPROVAL: NOT GRANTED]` in Phase 3P.

| State | Meaning | Allowed repo-local action | Disallowed action |
| --- | --- | --- | --- |
| Owner review continues | Review is still ongoing | Update template placeholders and local docs only | Deployment or filled evidence |
| Owner review blocked | Review cannot close because blockers remain | Track blockers locally | Pretend sign-off happened |
| Owner review ready to close | Local templates suggest review may be closable | Prepare owner-facing closure packet | Deploy or approve launch |
| Deployment approved | Explicit future owner approval only | Future deployment workflow may begin | Must not be assumed in Phase 3P |

## Separation Rules

- Owner-review closure readiness can be prepared locally without deployment.
- Owner review can continue without deployment.
- Owner review can remain blocked without deployment.
- Owner review can be locally ready to close without deployment.
- Deployment approval must be a separate future owner approval that names the
  target and allowed action.
- Preview evidence, production evidence, provider configuration, and launch
  actions stay outside Phase 3P.
