# Phase 2B Checklist: Admin Auth And Membership

Phase 2B-A is design and guard coverage only. Keep implementation items
unchecked until a future PR has explicit approval to add real auth, admin UI,
or product management writes.

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
- [ ] Admin UI.
- [ ] Login/logout routes.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
