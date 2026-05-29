# Phase 2B Auth Implementation Checklist

This is the future implementation checklist for real admin auth runtime work.

Completed design-only milestones are referenced, not duplicated as implementation work.

Phase 2B-E is design and guard coverage only. Phase 2B-F reconciles checklist
status only. Phase 2B-I refines current implementation-gate wording only.
Phase 2B-J approves the future server-only Supabase Auth runtime lane and
test-plan gates only. Phase 2B-K implements only the server-only Supabase Auth
identity/session-read boundary. Phase 2B-L implements only the server-only
Supabase admin profile/membership read boundary. Phase 2B-L does not default
to a plain anon-key Supabase helper; it requires an explicitly injected
authenticated admin-read client and fails closed without one. Phase 2B-M
implements only the server-only admin workspace resolution boundary behind an
explicitly injected trusted server-side workspace ID. Phase 2B-N implements
only the server-only session-bound admin read-client factory inside the
Phase 2B-K identity boundary. Phase 2B-O implements only the server-only admin
authorization adapter-set composition boundary. Phase 2B-P implements only the
server-only composed admin authorization decision boundary. Phase 2B-Q
implements only the server-only admin request security preflight boundary.
Phase 2B-R implements only the server-only CSRF proof verifier boundary. Keep
real auth runtime wiring, factory, adapter-set, decision-boundary, preflight,
or CSRF verifier usage from runtime routes/pages/actions, headers, routes, UI,
product write, Storage, browser Supabase, and service-role runtime
implementation items unchecked until a future implementation PR adds and tests
that runtime code.

Reference docs:

- `docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md`
- `docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md`
- `docs/checklists/PHASE-2B-ADMIN-AUTH.md`

## Approval Gates

- [x] Supabase Auth provider approved.
- [x] Server-only auth boundary approved.
- [x] Session cookie strategy approved.
- [x] CSRF strategy approved.
- [x] Login route design approved.
- [x] Logout route design approved.
- [x] Protected admin page design approved.
- [x] Admin identity to `admin_users.auth_user_id` mapping approved.
- [x] Admin profile lookup approved.
- [x] Membership lookup approved.
- [x] Adapter integration approved.

## Test Plan

- [x] Anonymous denial tests planned.
- [x] Inactive admin profile tests planned.
- [x] Missing membership tests planned.
- [x] Wrong-actor membership tests planned.
- [x] Cross-workspace denial tests planned.
- [x] Viewer write denial tests planned.
- [x] Admin allowed path tests planned.
- [x] Owner membership-management tests planned.
- [x] Safe auth error tests planned.
- [x] CSRF failure tests planned.
- [x] Safe redirect tests planned.

## Explicit Future Approval

- [x] Explicit approval obtained before real auth runtime wiring.
- [ ] Explicit approval obtained before login/logout routes.
- [ ] Explicit approval obtained before protected admin pages.
- [ ] Explicit approval obtained before admin UI.
- [ ] Explicit approval obtained before product writes.

## Completed Narrow Runtime Boundary

- [x] Server-only Supabase Auth identity boundary.
- [x] Cookie reads.
- [x] Server-only Supabase admin profile/membership read boundary.
- [x] Server-only admin workspace resolution boundary.
- [x] Server-only session-bound admin read-client factory.
- [x] Server-only admin authorization adapter-set composition boundary.
- [x] Server-only composed admin authorization decision boundary.
- [x] Server-only admin request security preflight boundary.
- [x] Server-only CSRF proof verifier boundary.

## Still Deferred

- [ ] Real auth runtime wiring.
- [ ] Supabase Auth runtime wiring.
- [ ] Resolver/adapter runtime wiring into routes, pages, or server actions.
- [ ] Admin profile/membership Supabase table reads outside the Phase 2B-L server-only read boundary.
- [ ] Admin workspace resolution outside the Phase 2B-M server-only workspace boundary.
- [ ] Session-bound admin read-client factory usage from runtime routes, pages, or server actions.
- [ ] Admin authorization adapter-set usage from runtime routes, pages, or server actions.
- [ ] Admin authorization decision boundary usage from runtime routes, pages, or server actions.
- [ ] Admin request security preflight usage from runtime routes, pages, or server actions.
- [ ] Admin CSRF proof verifier usage from runtime routes, pages, or server actions.
- [ ] Header reads.
- [ ] Login/logout routes.
- [ ] Protected admin pages.
- [ ] Admin UI.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
