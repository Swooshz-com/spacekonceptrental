# Owner-Review Launch-Blocker Freeze Gate

This is a repo-local gate for deciding what must be frozen before any later
launch planning. It does not approve launch or deployment.

Public launch remains blocked until owner-required facts and explicit
deployment approval both exist.

## Freeze Classes

- Owner-review blockers.
- Launch/deployment blockers.
- Deferred after launch.
- Not in scope by owner direction.
- Requires separate deployment approval.

## Freeze States

- `Not evaluated`.
- `Owner input required`.
- `Blocked before owner review closes`.
- `Blocked before launch planning`.
- `Ready for later planning, not deployment approval`.
- `Requires separate deployment approval`.

## Placeholder Freeze Table

| Freeze area | Freeze class | Freeze state | Owner input placeholder | Local blocker placeholder |
| --- | --- | --- | --- | --- |
| `<freeze area>` | `<freeze class>` | `<freeze state>` | `<owner input placeholder>` | `<local blocker placeholder>` |

## Boundary Table

| Boundary | Template-only rule |
| --- | --- |
| Owner-review blockers | Keep the affected owner-review area open until the missing owner input or local correction scope is defined. |
| Launch/deployment blockers | Keep launch planning blocked until owner-required facts and separate deployment approval both exist. |
| Deferred after launch | Keep deferred items out of current implementation unless separately approved. |
| Not in scope by owner direction | Keep excluded items out of public copy and protected workflows unless owner direction changes later. |
| Requires separate deployment approval | Keep any public traffic or provider step blocked until a later explicit approval names the target and allowed action. |

## Non-Deployment Boundaries

- No production evidence is created.
- No preview evidence is filled.
- No provider config is changed.
- No route, upload, account, notification, CRM, Pinecone, n8n, or RAG runtime
  is added.
- No public quote tracking, customer account, upload, notification, CRM,
  Pinecone, n8n, RAG, or ecommerce scope is added.
