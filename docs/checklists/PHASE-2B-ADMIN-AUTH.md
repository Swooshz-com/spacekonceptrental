# Phase 2B Checklist: Admin Auth And Membership

Completed design, policy, resolver, adapter, and provider-session milestones
are recorded here as admin/auth readiness work.

Real runtime implementation remains unchecked.

Phase 2B-A is design and guard coverage only. Phase 2B-B adds a pure
server-only policy module and tests only. Phase 2B-C adds a server-only
resolver contract and disabled scaffold only. Phase 2B-D adds server-only
adapter contracts and dependency-injected resolver tests with fake adapters
only. Phase 2B-E adds auth provider/session/security design and a future auth
implementation checklist only. Phase 2B-F reconciles checklist status only.
Phase 2B-G refreshes repo agent instructions only. Phase 2B-H strengthens the
reviewed server-side resolver/adapter boundary with fake-adapter tests only.
Phase 2B-I cleans admin auth implementation gate wording and
runtime-readiness checklist/static guard wording only.
Phase 2B-J approves the future server-only Supabase Auth runtime lane only.
Phase 2B-K adds only the server-only Supabase Auth identity/session-read
boundary. Cookie reads and Supabase Auth server calls are restricted to that
boundary and tracked in `PHASE-2B-AUTH-IMPLEMENTATION.md`. Phase 2B-L adds
only the server-only Supabase admin profile/membership read boundary.
`admin_users` and `memberships` reads are restricted to that boundary and
tracked in `PHASE-2B-AUTH-IMPLEMENTATION.md`. The boundary requires an
explicitly injected authenticated admin-read client and fails closed without
one; live read-client wiring remains deferred. Phase 2B-M adds only the
server-only admin workspace resolution boundary behind an explicitly injected
trusted server-side workspace ID. Phase 2B-N adds only the server-only
session-bound admin read-client factory inside the Phase 2B-K identity
boundary. Phase 2B-O adds only the server-only admin authorization adapter-set
composition boundary. Phase 2B-P adds only the server-only composed admin
authorization decision boundary. Phase 2B-Q adds only the server-only admin
request security preflight boundary. Phase 2B-R adds only the server-only CSRF
proof verifier boundary. Phase 2B-S adds only the server-only CSRF proof issuer
boundary. Phase 2B-T adds only the server-only admin authorization gate
composition boundary. Phase 2B-U approves only the future admin runtime
gate usage lane. Phase 2B-V adds only the server-only admin request metadata
adapter boundary. Phase 2B-W adds only the server-only admin runtime gate
invocation boundary. Keep real auth runtime wiring, factory, adapter-set,
decision-boundary, preflight, CSRF verifier, CSRF issuer, request metadata
adapter, runtime gate invocation helper, or authorization gate usage from runtime
routes/pages/actions, headers, login/logout routes, protected admin pages,
admin UI, product management writes, browser Supabase, service-role runtime
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
- [x] Add server-only admin runtime gate invocation boundary.`r`n- [x] Approve future server-only admin runtime gate invocation usage lane.

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
- [ ] Session/cookie expectations approved.

## Future Runtime Test Plan Approvals

- [ ] Tests for anonymous denial planned.
- [ ] Tests for non-member denial planned.
- [ ] Tests for cross-workspace denial planned.
- [ ] Tests for admin/member allowed path planned.

## Explicit Future Approval Gates

- [ ] Explicit approval obtained before product writes.
- [ ] Explicit approval obtained before admin UI.
- [ ] Explicit approval obtained before service-role runtime path, if ever needed.

## Still Deferred

- [ ] Real auth runtime wiring.
- [ ] Supabase Auth runtime wiring.
- [ ] Resolver/adapter runtime wiring into routes, pages, or server actions.
- [ ] Cookie reads outside the Phase 2B-K server-only identity boundary.
- [ ] Admin profile/membership Supabase table reads outside the Phase 2B-L server-only read boundary.
- [ ] Admin workspace resolution outside the Phase 2B-M server-only workspace boundary.
- [ ] Session-bound admin read-client factory usage from runtime routes, pages, or server actions.
- [ ] Admin authorization adapter-set usage from runtime routes, pages, or server actions.
- [ ] Admin authorization decision boundary usage from runtime routes, pages, or server actions.
- [ ] Admin request security preflight usage from runtime routes, pages, or server actions.
- [ ] Admin CSRF proof verifier usage from runtime routes, pages, or server actions.
- [ ] Admin CSRF proof issuer usage from runtime routes, pages, or server actions.
- [ ] Admin authorization gate usage from runtime routes, pages, or server actions.
- [ ] Admin runtime gate invocation usage from runtime routes, pages, or server actions.
- [ ] Header reads outside the Phase 2B-V request metadata adapter.
- [ ] Login/logout routes.
- [ ] Protected admin pages.
- [ ] Admin UI.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
