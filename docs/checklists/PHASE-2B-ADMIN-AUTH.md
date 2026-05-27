# Phase 2B Checklist: Admin Auth And Membership

Phase 2B-A is design and guard coverage only. Phase 2B-B adds a pure
server-only policy module and tests only. Phase 2B-C adds a server-only
resolver contract and disabled scaffold only. Phase 2B-D adds server-only
adapter contracts and dependency-injected resolver tests with fake adapters
only. Phase 2B-E adds auth provider/session/security design and an auth
implementation checklist only. Keep real auth, Supabase Auth runtime wiring,
cookies, headers, admin UI, product management writes, browser Supabase,
service-role runtime paths, deployment, and Supabase Cloud work unchecked until
a future PR has explicit approval.

## Completed Policy Boundary

- [x] Add pure server-only admin authorization policy module.
- [x] Add policy tests for anonymous, inactive admin, missing membership, cross-workspace, role denial, and allowed-member decisions.
- [x] Add server-only admin auth/membership resolver contract.
- [x] Add disabled resolver scaffold tests.
- [x] Add server-only admin auth/membership adapter contract.
- [x] Add dependency-injected resolver tests with fake adapters.
- [x] Add admin auth provider/session design.
- [x] Add admin auth implementation checklist.

## Design Approvals

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

## Test Plan Approvals

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
- [ ] Cookie/session reads.
- [ ] Header reads.
- [ ] Admin UI.
- [ ] Login/logout routes.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
