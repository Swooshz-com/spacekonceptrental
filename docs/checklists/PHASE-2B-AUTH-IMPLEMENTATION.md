# Phase 2B Auth Implementation Checklist

This is the future implementation checklist for real admin auth runtime work.

Completed design-only milestones are referenced, not duplicated as implementation work.

Phase 2B-E is design and guard coverage only. Phase 2B-F reconciles checklist
status only. Phase 2B-I refines current implementation-gate wording only.
Phase 2B-J approves the future server-only Supabase Auth runtime lane and
test-plan gates only. Keep all real auth, cookie, header, route, UI, product
write, Storage, browser Supabase, and service-role runtime implementation
items unchecked until a future implementation PR adds and tests runtime code.

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

## Still Deferred

- [ ] Real auth runtime wiring.
- [ ] Supabase Auth runtime wiring.
- [ ] Cookie reads.
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
