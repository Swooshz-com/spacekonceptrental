# Admin Auth Membership Design

Phase 2B-A is design and guard coverage only.
Phase 2B-B adds a pure server-only policy module only.
Phase 2B-C adds a server-only resolver contract and disabled scaffold only.
Phase 2B-D adds server-only adapter contracts and dependency-injected resolver
logic only.

This PR adds server-only adapter contracts and dependency-injected resolver logic only.
This PR does not implement auth.
This PR does not implement real auth.
This PR does not add admin UI.
This PR does not add product writes.
This PR does not add Supabase Auth runtime wiring.
This PR does not read cookies.
This PR does not read headers.
This PR does not add login/logout routes.
This PR does not add protected admin pages.
This PR adds a server-only resolver contract and disabled scaffold only.
This PR does not wire the resolver into runtime routes/pages/server actions.

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

## Non-goals

This PR does not:

- Implement real auth.
- Add Supabase Auth runtime wiring.
- Read cookies.
- Read headers.
- Add login or logout routes.
- Add protected admin pages.
- Add admin UI.
- Add product/category/product image writes.
- Add product/category/product image mutation routes.
- Add browser Supabase.
- Add service-role runtime reads or writes.
- Add Supabase Storage wiring.
- Wire the admin resolver into runtime routes, pages, or server actions.
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
publish, archive, or upload path is approved by this PR.

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

This PR does not read cookies and does not add session code.

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
