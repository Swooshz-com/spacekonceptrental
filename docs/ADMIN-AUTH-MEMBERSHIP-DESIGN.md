# Admin Auth Membership Design

This document records completed Phase 2B admin/auth readiness history and the
latest reviewed boundary state. It is historical design/status context, not
runtime approval for auth, admin UI, product writes, or deployment work.

Completed phase history:

- Phase 2B-A added admin/auth and workspace membership design and guard
  coverage only.
- Phase 2B-B added a pure server-only policy module and tests only.
- Phase 2B-C added a server-only resolver contract and disabled scaffold only.
- Phase 2B-D added server-only adapter contracts and dependency-injected resolver logic only.
- Phase 2B-E added auth provider/session/security design only.
- Phase 2B-F reconciled checklist hygiene and phase status only.
- Phase 2B-G refreshed repo agent instructions only.
- Phase 2B-H strengthened the reviewed server-side auth/membership resolution boundary with fake-adapter tests only.
- Phase 2B-K added only the server-only Supabase Auth identity boundary.
- Phase 2B-L added only the server-only admin profile/membership read boundary.
- Phase 2B-M added only the server-only admin workspace resolution boundary.
- Phase 2B-N added only the server-only session-bound admin read-client
  factory.
- Phase 2B-O adds a server-only admin authorization adapter-set composition boundary
  only.
- Phase 2B-P adds a server-only composed admin authorization decision boundary
  only.
- Phase 2B-Q adds a server-only admin request security preflight boundary
  only.
- Phase 2B-R adds a server-only CSRF proof verifier boundary only.
- Phase 2B-S adds a server-only CSRF proof issuer boundary only.
- Phase 2B-T adds a server-only admin authorization gate composition boundary
  only.
- Phase 2B-U approves only the future admin runtime gate usage lane.
- Phase 2B-V adds a server-only admin request metadata adapter boundary only.
- Phase 2B-W adds a server-only admin runtime gate invocation boundary only.
- Phase 2B-X adds a docs/checklist/static-guard approval lane for future runtime usage of the Phase 2B-W invocation helper only.
- Phase 2B-Y adds a server-only admin runtime route gate adapter boundary only.
- Phase 2B-Z adds a docs/checklist/static-guard approval lane for future runtime usage of the Phase 2B-Y route gate adapter only.

Latest completed admin/auth boundary state: Phase 2B-Y server-only admin
runtime route gate adapter boundary.

This design does not implement real auth.
This design does not add admin UI.
This design does not add product writes.
This design does not add Supabase Auth runtime wiring.
This design does not read cookies.
This design does not approve header reads outside the Phase 2B-V request
metadata adapter.
This design does not add login or logout routes.
This design does not add protected admin pages.
This design does not wire the admin resolver into runtime routes, pages, or server actions.
This design does not resolve admin workspace scope outside the Phase 2B-M
server-only workspace boundary.
This design does not use the Phase 2B-N session-bound admin read-client factory
from runtime routes, pages, or server actions.
This design does not use the Phase 2B-O admin authorization adapter-set
composition boundary from runtime routes, pages, or server actions.
This design does not use the Phase 2B-P composed admin authorization decision
boundary from runtime routes, pages, or server actions.
This design does not use the Phase 2B-Q admin request security preflight
boundary from runtime routes, pages, or server actions.
This design does not use the Phase 2B-R CSRF proof verifier boundary from
runtime routes, pages, or server actions.
This design does not use the Phase 2B-S CSRF proof issuer boundary from
runtime routes, pages, or server actions.
This design does not use the Phase 2B-W admin runtime gate invocation helper
from runtime routes, pages, or server actions.
This design does not use the Phase 2B-Y admin runtime route gate adapter from
runtime routes, pages, or server actions.

Product/category/product image writes remain blocked until admin/auth boundaries are implemented and tested.
Product writes remain blocked until real auth/membership resolution, RLS, audit, and route/action boundaries are implemented and tested.
Browser Supabase remains forbidden.
Service-role runtime paths remain forbidden unless separately approved.
Workspace ID must never be accepted from browser input for trusted admin write scope.
Admin write scope must be resolved server-side from authenticated identity + membership.
The membership used for admin write scope must be owned by that active admin
profile.
Public mutation routes remain forbidden.
Audit expectations must exist before product writes.

## Purpose

Define the admin identity, workspace membership, role, route/action, audit, and
RLS boundaries that must exist before any category, product, or product image
mutation is approved.

The design keeps Phase 2B focused on authorization shape rather than runtime
feature work. It is the gate between the Phase 1 disabled product/admin
persistence scaffold and a future approved admin implementation.

## Scope

This document covers:

- Future admin identity model.
- Future auth provider assumptions.
- Workspace membership and role model.
- Server-side workspace resolution rules.
- Route and server-action authorization boundaries.
- Product/category/product image write gate.
- Audit log expectations.
- RLS expectations.
- Error handling and session/cookie expectations.

It applies to future trusted admin operations for `categories`, `products`, and
`product_images`.

Phase 2B-B adds `website/lib/admin/authorization/admin-authorization-policy.ts`
as a pure server-only policy module. It exports types and pure decision
functions only. It does not read cookies, read environment variables, call
Supabase, import Supabase, perform database reads or writes, or wire itself
into routes, pages, or server actions.

Phase 2B-C adds `website/lib/admin/authorization/admin-authorization-resolver.ts`
as a server-only resolver contract and disabled scaffold. It defines how future
server-side auth and membership resolution should produce
`AdminAuthorizationInput` for `authorizeAdminOperation`, but it does not
implement real auth, call Supabase, read cookies, read headers, read
environment variables, perform database reads or writes, or wire itself into
routes, pages, or server actions.

Phase 2B-D adds
`website/lib/admin/authorization/admin-authorization-adapters.ts` as a
server-only adapter contract and extends the resolver with
dependency-injected resolution for fake/test adapters. The adapter boundary
names future identity, admin profile, membership, and workspace resolver
dependencies. It does not implement real auth, call Supabase, read cookies,
read headers, read environment variables, perform database reads or writes, or
wire itself into routes, pages, or server actions.

Phase 2B-E adds `docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md` and
`docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md`. It documents the preferred
future Supabase Auth provider, server-only auth boundary, session/cookie
expectations, CSRF expectations, login/logout expectations, protected admin
page expectations, and implementation gates before any real auth runtime is
added. It does not implement real auth, call Supabase Auth APIs, read cookies,
read headers, add routes, add pages, add server actions, add admin UI, add
product writes, or wire resolver/adapters into runtime.

Phase 2B-H strengthens the existing server-only resolver/adapter boundary with
additional fake-adapter tests for trusted server-side inputs and safe
allow/deny decisions. It proves anonymous, missing profile, inactive profile,
missing membership, inactive membership, wrong-actor membership,
cross-workspace membership, requested record workspace mismatch, unsupported
operation, viewer write denial, admin allowed, owner allowed, and owner-only
membership-management decisions without real auth, Supabase Auth runtime
wiring, cookies, headers, routes, pages, server actions, admin UI, product
writes, browser Supabase, service-role runtime paths, deployment, or Supabase
Cloud connection.

Phase 2B-M adds
`website/lib/admin/authorization/server-admin-workspace-resolver.ts` as a
server-only workspace resolver boundary behind the existing
`AdminWorkspaceResolver` contract. It resolves trusted admin workspace scope
only from an explicitly injected trusted server-side workspace ID, treats
browser/request workspace IDs as validation-only, fails closed for missing,
empty, whitespace-only, or mismatched values, and does not use public catalogue
workspace config as an admin authorization shortcut. It does not read cookies,
call Supabase Auth, read headers, call Supabase tables, use service-role keys,
add browser Supabase, add routes, add pages, add server actions, add admin UI,
or add product writes.

Phase 2B-N adds a session-bound admin read-client factory inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`.
That module remains the only approved place in this phase to read cookies,
call Supabase Auth for identity resolution, and create a session-bound admin
read client. The factory returns the Phase 2B-L
`SupabaseAdminReadClientResult` dependency shape for future profile/membership
reads, fails closed without server env, cookies, or a client, and does not
query `admin_users` or `memberships`. It is not wired into runtime routes,
pages, server actions, protected admin pages, login/logout, admin UI, or
product writes.

Phase 2B-O adds
`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts` as
a server-only adapter-set composition boundary. It assembles the existing
`AdminAuthAdapter`, `AdminProfileAdapter`, `AdminMembershipAdapter`, and
`AdminWorkspaceResolver` contracts using the reviewed identity/read-client,
profile/membership, and workspace resolver boundaries. It fails closed without
a session-bound admin read client or trusted server-side workspace input. It
is not wired into runtime routes, pages, server actions, protected admin
pages, login/logout, admin UI, or product writes.

Phase 2B-P adds
`website/lib/admin/authorization/server-admin-authorization-decision.ts` as a
server-only composed admin authorization decision boundary. It composes the
Phase 2B-O adapter set and calls the existing
`resolveAdminAuthorizationWithAdapters()` decision function without
duplicating policy logic. It fails closed when adapter-set composition,
session-bound admin read-client creation, trusted workspace input, or provider
dependencies are unavailable. It is not wired into runtime routes, pages,
server actions, protected admin pages, login/logout, admin UI, or product
writes.

Phase 2B-Q adds a server-only admin request security preflight boundary at
`website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
It validates only explicitly injected request metadata and optional injected
CSRF verifier results for future state-changing admin routes and server
actions. It treats request/browser supplied fields as untrusted validation
inputs, requires same-origin Origin/Host metadata, requires POST and a valid
CSRF proof for state-changing admin operations, and fails closed for missing,
invalid, stale, replayed, mismatched, thrown, or unsupported inputs. It does
not read real headers, read cookies, call Supabase Auth, query Supabase tables,
compose adapters, call the composed decision boundary, or wire itself into
runtime routes, pages, server actions, protected admin pages, login/logout,
admin UI, or product writes.

Phase 2B-R adds a server-only CSRF proof verifier boundary at
`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
validates only explicitly injected proof material, expected session binding,
expected nonce, timestamps, and dependency-injected signature or replay
checks. It accepts the Phase 2B-Q `verifyCsrfProof` dependency input shape and
returns only Phase 2B-Q-compatible safe CSRF proof results. It does not issue
CSRF tokens, read real headers, read cookies, read env, call Supabase, store
replay state except through an injected dependency, or wire itself into
runtime routes, pages, server actions, protected admin pages, login/logout,
admin UI, or product writes.

Phase 2B-S adds a server-only CSRF proof issuer boundary at
`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It
creates verifier-compatible structured CSRF proofs only from explicitly
injected operation, session binding, nonce or nonce generator, timestamps, and
dependency-injected signature signer. It supports only state-changing admin
operations, fails closed for read-only or unsupported operations, missing
session binding, missing nonce, invalid timestamps, missing signer, signer
failure, or provider/dependency throws, and returns only safe issue shapes. It
does not verify CSRF proofs, read real headers, read cookies, read env, call
Supabase, store replay state, or wire itself into runtime routes, pages,
server actions, protected admin pages, login/logout, admin UI, or product
writes.


Phase 2B-T adds a server-only admin authorization gate composition boundary at
`website/lib/admin/authorization/server-admin-authorization-gate.ts`. It runs
the Phase 2B-Q request-security preflight before the Phase 2B-P composed
admin authorization decision, may inject the Phase 2B-R CSRF proof verifier
when verifier dependencies are supplied, and returns only safe allow, deny, or
unavailable shapes. It does not issue CSRF proofs, read real headers, read
cookies, read env, call Supabase, query `admin_users` or `memberships`,
create a session-bound admin read client directly, compose adapter sets
directly, duplicate admin role/membership policy logic, or wire itself into
runtime routes, pages, server actions, protected admin pages, login/logout,
admin UI, or product writes.

Phase 2B-U adds a docs/checklist-only admin runtime wiring approval lane for
future use of `resolveServerAdminAuthorizationGate()`. The future lane is
limited to first-party server-only route handlers or server actions after a
reviewed request metadata adapter exists. Real request headers may be read
only inside that future server-only metadata adapter, which must pass explicit
metadata into the Phase 2B-T gate. Cookie reads, profile/membership reads,
workspace resolution, adapter-set composition, decision resolution, CSRF proof
issuance, and CSRF proof verification remain restricted to their existing
Phase 2B-K through Phase 2B-T boundaries. This phase does not add runtime
routes, pages, server actions, header reads, login/logout, protected admin
pages, admin UI, product/category/product image writes, Supabase Storage,
browser Supabase, service-role runtime paths, Supabase Cloud, deployment,
n8n changes, Pinecone runtime code, or `website/chat-config.js` access.

Phase 2B-V adds a server-only admin request metadata adapter boundary at
`website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.
It is the only newly approved production module in this phase that may import
`next/headers` and call `headers()`. It reads only minimal untrusted request
metadata for future injection into the Phase 2B-T gate, requires trusted
expected Origin and expected Host from explicit dependency/config injection,
and does not treat headers as identity, membership, workspace, provider, or
authorization authority. It does not call the gate, preflight, decision
boundary, CSRF verifier, CSRF issuer, adapter-set composition, Supabase Auth,
`admin_users`, `memberships`, or product write logic. Creating this adapter
does not approve using it from runtime routes, pages, server actions,
protected admin pages, login/logout, admin UI, or product writes.

Phase 2B-W adds a server-only admin runtime gate invocation boundary at
`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.
It composes only the Phase 2B-V request metadata adapter and the Phase 2B-T
admin authorization gate. Trusted expected Origin and expected Host still come
from explicit dependency/config injection. The helper does not import
`next/headers`, read cookies, call Supabase Auth, query `admin_users` or
`memberships`, resolve workspaces directly, compose adapter sets directly,
call preflight or decision boundaries directly, issue or verify CSRF proofs
directly, or add route/page/server-action runtime usage. Creating this helper
does not approve using it from runtime routes, pages, server actions,
protected admin pages, login/logout, admin UI, or product writes.

## Non-goals

This design does not:

- Implement real auth.
- Add Supabase Auth runtime wiring.
- Read cookies.
- Read headers outside the Phase 2B-V request metadata adapter.
- Add login or logout routes.
- Add protected admin pages.
- Add admin UI.
- Add product/category/product image writes.
- Add product/category/product image mutation routes.
- Add browser Supabase.
- Add service-role runtime reads or writes.
- Add Supabase Storage wiring.
- Wire the admin resolver into runtime routes, pages, or server actions.
- Resolve admin workspace scope outside the Phase 2B-M server-only workspace
  boundary.
- Use the Phase 2B-N session-bound admin read-client factory from runtime
  routes, pages, or server actions.
- Use the Phase 2B-O admin authorization adapter-set composition boundary from
  runtime routes, pages, or server actions.
- Use the Phase 2B-P composed admin authorization decision boundary from
  runtime routes, pages, or server actions.
- Use the Phase 2B-Q admin request security preflight boundary from runtime
  routes, pages, or server actions.
- Use the Phase 2B-R CSRF proof verifier boundary from runtime routes, pages,
  or server actions.
- Use the Phase 2B-S CSRF proof issuer boundary from runtime routes, pages, or
  server actions.
- Use the Phase 2B-W admin runtime gate invocation helper from runtime routes,
  pages, or server actions.
- Connect to Supabase Cloud.
- Add deployment configuration.
- Add production seed data.

## Admin identity model

Future admin identity should start from the authenticated user supplied by the
approved auth provider, likely Supabase Auth unless a later decision chooses a
different provider.

The application-level admin profile is `admin_users`. A future auth user maps
to `admin_users.auth_user_id`. The profile records who the admin is, but it
does not by itself grant workspace access.

An admin user must be active before any admin route or server action grants
access. Disabled or deleted admin profiles must fail closed.

## Future auth provider assumptions

The current preferred assumption is Supabase Auth because the schema already
plans `admin_users.auth_user_id`, and the app already has server-only Supabase
helpers.

That assumption is not runtime approval. A later implementation PR must define:

- How the server validates the authenticated user.
- How sessions are represented and refreshed.
- Which cookies are set and how they are protected.
- How auth errors map to safe responses.
- How auth tests prove anonymous denial.

The browser must not receive a Supabase service-role key, server-only Supabase
env values, or a browser Supabase client as part of this design.

## Workspace membership model

Workspace access is granted through `memberships`.

A future trusted admin write request must resolve:

1. Authenticated identity from the approved server-side auth boundary.
2. Active `admin_users` profile for that identity.
3. Active `memberships` row for that admin user and the target workspace.
4. Role permission that allows the requested operation.

Membership rows should be workspace-scoped, actor-scoped, and status-aware.
Inactive, revoked, pending, missing, or wrong-actor memberships must deny
access.

Membership IDs, role names, workspace IDs, or admin IDs from browser input must
never be treated as authority. A membership role is trusted only when the
membership row belongs to the active server-resolved admin profile.

## Role model

Start with a small role set:

- `owner`: may manage product catalogue data and future admin membership
  operations when those features are approved.
- `admin`: may manage product catalogue data when product writes are approved.
- `viewer`: may read future admin data when admin reads are approved, but may
  not mutate product catalogue data.

Granular permissions should wait until real admin workflows require them.
Role checks must be performed server-side and mirrored by RLS where database
access is involved.

## Workspace resolution rules

Trusted admin workspace scope must be derived server-side from authenticated
identity and active membership.

Route parameters or form fields may identify the record being edited, but they
must not decide the trusted workspace. If a request includes a workspace ID, it
is untrusted input used only for lookup or validation after the server has
resolved allowed workspaces from membership.

Cross-workspace attempts must fail closed even when a user is an admin in some
other workspace.

The current public catalogue path remains separate: it uses trusted
server-side `CATALOGUE_WORKSPACE_ID` and database-owned active workspace
configuration. Admin write scope must not reuse public catalogue config as an
authorization shortcut.

## Route/server-action boundary rules

Future product management writes must go through first-party server routes or
server actions. Public mutation routes remain forbidden.

Every future admin mutation boundary must:

- Run only on the server.
- Validate the authenticated identity.
- Resolve active admin user and active membership.
- Verify the active membership belongs to that admin user.
- Check role permission before mutation.
- Validate and normalize request input.
- Scope every read or write by resolved workspace.
- Return safe normalized errors.
- Record audit information once audit implementation is approved.

Client components may collect form input later, but they must not hold trusted
Supabase credentials or choose the trusted workspace.

## Product/category/product image write gate

No category, product, or product image insert, update, upsert, delete,
publish, archive, or upload path is approved by this design.

Before writes are allowed, a later PR must add and test:

- Real server-side auth boundary.
- Active admin profile lookup.
- Active workspace membership lookup.
- Role-based write authorization.
- Cross-workspace denial.
- Anonymous denial.
- Non-member denial.
- Audit logging expectations and implementation plan.
- RLS policies or server-side data access strategy aligned with membership.

The existing disabled product/admin persistence scaffold must remain disabled
until this gate is implemented and tested.

The Phase 2B-B policy module can return an allowed policy decision for future
admin and owner operations only when a future server-side resolver has already
supplied authenticated identity, active admin profile, active same-admin
same-workspace membership, role, requested operation, and optional
same-workspace target record validation. It does not itself approve or perform
product writes. The policy denies memberships whose `adminUserId` does not
match the active `adminUser.id`.

The Phase 2B-C resolver scaffold returns `auth_resolver_disabled` by default.
Its helper builds policy input only from explicitly supplied trusted
server-resolved identity, admin profile, workspace, membership, and requested
operation context. Browser/request workspace IDs remain validation-only
metadata and must never become trusted workspace authority.

The Phase 2B-D adapter boundary allows tests to supply fake identity, profile,
workspace, and membership adapters to the resolver. The resolver delegates the
final decision to `authorizeAdminOperation` after building policy input from
the injected adapter results. Request or browser workspace IDs remain
validation-only metadata; the trusted workspace must come from the injected
server-side workspace resolver, and the trusted membership must be owned by the
server-resolved admin profile. The default resolver remains disabled and no
runtime route, page, or server action imports this adapter-driven path.

The Phase 2B-E provider/session design recommends Supabase Auth as the future
admin auth provider, but does not approve runtime wiring. Future auth must
remain server-side. Future session cookies must be HttpOnly, Secure in
production, and have reviewed SameSite behaviour. Future state-changing admin
routes/server actions need CSRF strategy before implementation. Login/logout
routes must be added separately and must not expose tokens, secrets, stack
traces, or Supabase internals.

The Phase 2B-H resolver boundary keeps the default resolver disabled and uses
only dependency-injected fake adapters for tests. The adapter-driven resolver
returns early for anonymous identity, missing profile, inactive profile, and
unsupported operations before resolving deeper workspace or membership context.
When trusted adapter inputs are available, the policy still revalidates active
admin profile, membership actor ownership, workspace match, requested record
workspace match, operation support, and role permission before returning an
allow decision.

The Phase 2B-M workspace resolver boundary fills only the existing
`AdminWorkspaceResolver` seam. It may return a trusted workspace only from
explicitly injected trusted server-side workspace input. Browser/request
workspace IDs remain validation-only and may only match or reject that trusted
workspace; they must not become authority. Missing trusted input, empty or
whitespace input, mismatches, or provider errors return
`{ serverResolvedWorkspaceId: null }`.

The Phase 2B-N session-bound admin read-client factory fills only the missing
dependency needed by the Phase 2B-L profile/membership adapters. Tests may
inject the returned `SupabaseAdminReadClientResult` into those adapters, but
runtime routes, pages, and server actions must not use the factory until a
later phase explicitly approves resolver/adapter runtime wiring.

The Phase 2B-O adapter-set composition boundary fills only the missing
server-only assembly point for the existing adapter contracts. Tests may use
the composed adapter set, but runtime routes, pages, and server actions must
not use it until a later phase explicitly approves resolver/adapter runtime
wiring.

The Phase 2B-P composed decision boundary fills only the missing server-only
decision entrypoint for the composed adapter set. Tests may call it, but
runtime routes, pages, and server actions must not use it until a later phase
explicitly approves resolver/adapter/decision runtime wiring.

## Audit log expectations

Product management mutations need audit coverage before they are enabled.

Audit records should capture:

- Workspace ID resolved server-side.
- Actor admin user ID.
- Actor type.
- Action name.
- Target type and target ID.
- Request ID or correlation ID.
- Timestamp.
- Minimal non-secret metadata needed for review.

Audit records must not store secrets, raw env values, n8n webhook URLs,
service-role keys, or unnecessary customer PII. Audit failures should be part
of the future mutation design rather than silently ignored by default.

## RLS expectations

Future admin RLS should scope admin reads and writes through active membership
checks.

RLS must prove:

- Anonymous callers cannot write `categories`, `products`, or
  `product_images`.
- Non-members cannot read or write workspace-owned admin data.
- A member cannot authorize with another admin user's membership or role.
- Members cannot cross workspace boundaries.
- View-only roles cannot mutate product catalogue data.
- Approved admin roles can perform only approved mutations in their workspace.

Service-role runtime paths remain forbidden unless separately approved because
they bypass RLS and require a different authorization and audit design.

## Error handling expectations

Future admin errors should be safe and boring:

- Anonymous request: `401` or an equivalent unauthenticated result.
- Authenticated but unauthorized request: `403` or an equivalent forbidden
  result.
- Missing target record: a safe not-found result that does not reveal
  cross-workspace existence.
- Validation failure: bounded field-level errors without stack traces.
- Provider/database failure: generic safe error without Supabase internals.

Browser responses must not expose workspace IDs, membership IDs, SQL errors,
service-role details, stack traces, or internal provider traces.

## Session/cookie expectations

A future auth implementation must keep session handling server-controlled.

Expected properties:

- Secure cookies in production.
- `HttpOnly` cookies for session material when cookie sessions are used.
- `SameSite` policy reviewed for admin workflows.
- CSRF strategy reviewed before state-changing routes or server actions.
- No localStorage token authority for admin access.
- No browser-visible service-role key or server-only Supabase env value.

This design does not read cookies and does not add session code.

## Forbidden shortcuts

Do not use:

- Browser-provided workspace ID as trusted admin write scope.
- Browser Supabase for product management.
- Service-role runtime writes as a substitute for membership authorization.
- Public product/category/product image mutation routes.
- Public anonymous product write policies.
- Active public catalogue workspace config as admin authorization.
- `website/chat-config.js` for any auth, admin, or product path.
- Production seed data to bootstrap admin access without review.
- Deployment configuration as part of admin/auth design.

## What remains deferred

- Real auth runtime wiring.
- Supabase Auth route/session integration.
- Login/logout routes.
- Protected admin pages.
- Admin UI.
- Product/category/product image writes.
- Product image uploads.
- Supabase Storage.
- Service-role runtime paths.
- Browser Supabase.
- Production seed data.
- Supabase Cloud connection.
- Deployment.
- Conversation/message writes.

## First implementation PR after this design

The next admin/auth PR should still avoid product writes. A safe first
implementation would select the auth provider, add a disabled or read-only
server-only authorization boundary, and prove anonymous denial, non-member
denial, cross-workspace denial, and member role checks with tests.

Only after that boundary is implemented and reviewed should a separate PR
propose category, product, or product image mutation behaviour.
