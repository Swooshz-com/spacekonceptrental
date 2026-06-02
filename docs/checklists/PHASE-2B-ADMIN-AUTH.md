# Phase 2B Checklist: Admin Auth And Membership

Completed design, policy, resolver, adapter, and provider-session milestones
are recorded here as admin/auth readiness work.

Real auth runtime implementation remains unchecked outside the Phase 2B-AN
login/logout and protected shell boundary.

Product-management writes are approved only through the Phase 2B-AL/AM backend API route boundary.

Phase 2B-A is design and guard coverage only. Phase 2B-B adds a pure
server-only policy module and tests only. Phase 2B-C adds a server-only
resolver contract and disabled scaffold only. Phase 2B-D adds server-only
adapter contracts and dependency-injected resolver tests with fake adapters
only. Phase 2B-E adds auth provider/session/security design and a future auth
implementation checklist only. Phase 2B-F reconciles checklist status only.
Phase 2B-G refreshes repo agent instructions only. Phase 2B-H strengthens the
reviewed server-side resolver/adapter boundary with fake-adapter tests only.
Phase 2B-I cleans admin auth implementation gate wording and
runtime-readiness checklist/static guard wording only. Phase 2B-J approves the
future server-only Supabase Auth runtime lane only. Phase 2B-K adds only the
server-only Supabase Auth identity/session-read boundary. Cookie reads and
Supabase Auth server calls are restricted to that boundary and tracked in
`PHASE-2B-AUTH-IMPLEMENTATION.md`. Phase 2B-L adds only the server-only
Supabase admin profile/membership read boundary. `admin_users` and
`memberships` reads are restricted to that boundary and tracked in
`PHASE-2B-AUTH-IMPLEMENTATION.md`. The boundary requires an explicitly
injected authenticated admin-read client and fails closed without one; live
read-client wiring remains deferred. Phase 2B-M adds only the server-only
admin workspace resolution boundary behind an explicitly injected trusted
server-side workspace ID. Phase 2B-N adds only the server-only session-bound
admin read-client factory inside the Phase 2B-K identity boundary. Phase 2B-O
adds only the server-only admin authorization adapter-set composition
boundary. Phase 2B-P adds only the server-only composed admin authorization
decision boundary. Phase 2B-Q adds only the server-only admin request security
preflight boundary. Phase 2B-R adds only the server-only CSRF proof verifier
boundary. Phase 2B-S adds only the server-only CSRF proof issuer boundary.
Phase 2B-T adds only the server-only admin authorization gate composition
boundary. Phase 2B-U approves only the future admin runtime gate usage lane.
Phase 2B-V adds only the server-only admin request metadata adapter boundary.
Phase 2B-W adds only the server-only admin runtime gate invocation boundary.
Phase 2B-X approves only the future admin runtime gate invocation usage lane.
Phase 2B-Y adds only the server-only admin runtime route gate adapter
boundary. Phase 2B-Z approves only the future admin runtime route gate adapter
usage lane. Phase 2B-AA adds the first admin runtime route gate adapter usage
boundary as exactly one harmless GET authorization probe/check route handler.
Phase 2B-AB approves only the future server-only admin CSRF proof issuer
runtime usage lane. Phase 2B-AC repairs the admin auth-check trusted workspace
dependency. Phase 2B-AD approves only the future admin CSRF proof issuer route
operation model. Phase 2B-AE adds only the admin CSRF issue operation policy
and preflight boundary. Phase 2B-AI adds only the server-only admin CSRF proof
issuer session/workspace binding boundary and keeps the actual route deferred.
Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace
binding runtime dependency boundary and keeps the actual route deferred. Phase
2B-AK adds only the first-party server-only admin CSRF proof issuer route.
Phase 2B-AL adds only backend protected product/category/product-image
metadata write API routes through the approved route gate, CSRF proof,
session-bound Supabase client, RLS, and audit-log boundary. Phase 2B-AM hardens
the Phase 2B-AL write boundary by migrating product mutations and audit inserts
into a single Postgres RPC transaction block, and enforcing POST-only state
changes. Phase 2B-AN adds only a minimal first-party admin login page,
server-owned login/logout routes, and a protected admin shell through the
approved server-only route-gate path. Phase 2B-AR repairs only missing-Origin
GET handling for that protected shell while preserving strict Origin/Host/CSRF
requirements for CSRF issuance and state-changing writes. Phase 2B-AS adds
only metadata furniture listing management UI through the existing protected
`product.write` backend routes. Keep real auth runtime wiring outside
Phase 2B-AN, factory, adapter-set, decision-boundary, preflight, CSRF verifier,
CSRF issuer, request metadata adapter, runtime gate invocation helper, or
authorization gate usage from other runtime routes/pages/actions, headers,
product-management admin UI, product-management writes outside the Phase
2B-AL/AM backend API route boundary, browser Supabase, service-role runtime
paths, deployment, and Supabase Cloud work unchecked until a future PR has
explicit approval.

## Completed Design, Policy, Resolver, Adapter, And Provider-session Milestones

- [x] Add admin/auth and workspace membership authorization design.
- [x] Add pure server-only admin authorization policy module.
- [x] Add policy tests for anonymous, inactive admin, missing membership, cross-workspace, role denial, and allowed-member decisions.
- [x] Add server-only admin auth/membership resolver contract.
- [x] Add disabled resolver scaffold tests.
- [x] Add server-only admin auth/membership adapter contract.
- [x] Add dependency-injected resolver tests with fake adapters.
- [x] Add admin auth provider/session design.
- [x] Add admin auth implementation checklist.
- [x] Add checklist hygiene/status reconciliation guards.
- [x] Add reviewed server-side admin auth/membership resolution tests with fake adapters.
- [x] Clean stale admin auth implementation gate wording and runtime-readiness checklist/static guards.
- [x] Approve future server-only Supabase Auth runtime lane.
- [x] Add server-only Supabase Auth identity boundary.
- [x] Add server-only Supabase admin profile/membership read boundary.
- [x] Add server-only admin workspace resolution boundary.
- [x] Add server-only session-bound admin read-client factory.
- [x] Add server-only admin authorization adapter-set composition boundary.
- [x] Add server-only composed admin authorization decision boundary.
- [x] Add server-only admin request security preflight boundary.
- [x] Add server-only CSRF proof verifier boundary.
- [x] Add server-only CSRF proof issuer boundary.
- [x] Add server-only admin authorization gate composition boundary.
- [x] Approve future server-only admin authorization gate runtime usage lane.
- [x] Add server-only admin request metadata adapter boundary.
- [x] Add server-only admin runtime gate invocation boundary.
- [x] Approve future server-only admin runtime gate invocation usage lane.
- [x] Add server-only admin runtime route gate adapter boundary.
- [x] Approve future server-only admin runtime route gate adapter usage lane.
- [x] Add first admin runtime route gate adapter usage boundary.
- [x] Approve future server-only admin CSRF proof issuer runtime usage lane.
- [x] Admin auth-check trusted workspace dependency repair.
- [x] Approve future admin CSRF proof issuer route operation model.
- [x] Add server-only admin CSRF proof issuer session/workspace binding boundary.
- [x] Add server-only admin CSRF proof session/workspace binding runtime dependency boundary.
- [x] Add first-party server-only admin CSRF proof issuer route.
- [x] Add backend-only admin product persistence and protected product write API routes.
- [x] Add admin product write audit atomicity boundary.
- [x] Add minimal first-party admin login/logout and protected shell boundary.
- [x] Add read-only admin product dashboard boundary.
- [x] Add category management UI boundary.
- [x] Add admin shell GET missing-Origin route-gate repair.
- [x] Add metadata-only admin furniture listing management UI boundary.

## Design References

- [x] Auth provider preference documented as future server-side Supabase Auth.
- [x] Admin identity model documented.
- [x] Workspace membership model documented.
- [x] Role model documented.
- [x] Server-side workspace resolution expectations documented.
- [x] Route/server-action boundary expectations documented.
- [x] Product/category/product image write gate documented.
- [x] Audit log expectations documented.
- [x] RLS expectations documented.
- [x] Error handling expectations documented.
- [x] Session/cookie expectations documented.

## Future Runtime Approval Gates

These stay unchecked until a future implementation PR approves and tests the
actual runtime boundary. Completed design docs above are references, not
runtime implementation approval.

- [ ] Auth provider selected.
- [ ] Admin identity model approved.
- [ ] Workspace membership model approved.
- [ ] Role model approved.
- [ ] Server-side workspace resolution approved.
- [ ] Route/server-action boundary approved.
- [ ] Product/category/product image write gate approved.
- [ ] Audit log expectations approved.
- [ ] RLS expectations approved.
- [ ] Error handling expectations approved.
- [x] Route/server-action boundary approved for Phase 2B-AL backend API routes.
- [x] Product/category/product image write gate approved for Phase 2B-AL backend API routes.
- [x] Audit log expectations approved for Phase 2B-AL backend API routes.
- [x] RLS expectations approved for Phase 2B-AL backend API routes.
- [x] Error handling expectations approved for Phase 2B-AL backend API routes.
- [x] Phase 2B-AL backend admin product persistence and write API routes.
- [x] Phase 2B-AM admin product write audit atomicity boundary.
- [x] Phase 2B-AN admin login/logout and protected shell boundary.
- [x] Session/cookie expectations approved for Phase 2B-AN login/logout.
- [x] Phase 2B-AO read-only admin product dashboard boundary.
- [x] Phase 2B-AR admin shell GET missing-Origin route-gate repair.
- [x] Phase 2B-AS metadata-only admin furniture listing management UI boundary.

## Future Runtime Test Plan Approvals

- [x] Tests for anonymous denial planned.
- [ ] Tests for non-member denial planned.
- [ ] Tests for cross-workspace denial planned.
- [x] Tests for admin/member allowed path planned for Phase 2B-AN protected shell.

## Explicit Future Approval Gates

- [x] Explicit approval obtained before Phase 2B-AL backend product writes.
- [x] Explicit approval obtained before Phase 2B-AN login/logout routes and minimal protected shell.
- [ ] Explicit approval obtained before product writes.
- [ ] Explicit approval obtained before product-management admin UI.
- [x] Explicit approval obtained before Phase 2B-AP category-management admin UI.
- [x] Explicit approval obtained before Phase 2B-AS metadata listing management UI.
- [ ] Explicit approval obtained before service-role runtime path, if ever needed.

## Still Deferred

- [ ] Real auth runtime wiring outside the Phase 2B-AN login/logout and protected shell boundary.
- [ ] Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth session boundaries.
- [ ] Resolver/adapter runtime wiring into routes, pages, or server actions.
- [ ] Cookie reads outside the Phase 2B-K server-only identity boundary.
- [ ] Admin profile/membership Supabase table reads outside the Phase 2B-L server-only read boundary.
- [ ] Admin workspace resolution outside the Phase 2B-M server-only workspace boundary.
- [ ] Session-bound admin read-client factory usage from runtime routes, pages, or server actions.
- [ ] Admin authorization adapter-set usage from runtime routes, pages, or server actions.
- [ ] Admin authorization decision boundary usage from runtime routes, pages, or server actions.
- [ ] Admin request security preflight usage from runtime routes, pages, or server actions.
- [ ] Admin CSRF proof verifier usage from runtime routes, pages, or server actions.
- [ ] Admin CSRF proof issuer usage from other runtime routes, pages, or server actions.
- [ ] Admin CSRF proof session/workspace binding usage from other runtime routes, pages, or server actions.
- [ ] Admin authorization gate usage from runtime routes, pages, or server actions.
- [ ] Admin runtime gate invocation usage from runtime routes, pages, or server actions.
- [ ] Admin runtime route gate adapter usage from other runtime routes, pages, or server actions.
- [ ] Header reads outside the Phase 2B-V request metadata adapter.
- [x] Login/logout routes for the Phase 2B-AN first-party admin auth boundary.
- [x] Protected admin shell for Phase 2B-AN.
- [ ] Product-management admin UI.
- [x] Category-management admin UI for Phase 2B-AP.
- [x] Metadata listing management UI for Phase 2B-AS.
- [ ] Product/category/product image writes outside the Phase 2B-AL/AM backend API route boundary.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage and binary product image uploads.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
