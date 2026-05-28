# Phase 2B Auth Implementation Checklist

This is the future implementation checklist for real admin auth runtime work.

Completed design-only milestones are referenced, not duplicated as implementation work.

Phase 2B-E is design and guard coverage only. Phase 2B-F reconciles checklist
status only. Phase 2B-I refines current implementation-gate wording only.
Keep all real auth, cookie, header, route, UI, product write, Storage, browser
Supabase, and service-role runtime implementation items unchecked until a
future PR has explicit approval.

Reference docs:

- `docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md`
- `docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md`
- `docs/checklists/PHASE-2B-ADMIN-AUTH.md`

## Approval Gates

- [ ] Supabase Auth provider approved.
- [ ] Server-only auth boundary approved.
- [ ] Session cookie strategy approved.
- [ ] CSRF strategy approved.
- [ ] Login route design approved.
- [ ] Logout route design approved.
- [ ] Protected admin page design approved.
- [ ] Admin identity to `admin_users.auth_user_id` mapping approved.
- [ ] Admin profile lookup approved.
- [ ] Membership lookup approved.
- [ ] Adapter integration approved.

## Test Plan

- [ ] Anonymous denial tests planned.
- [ ] Inactive admin profile tests planned.
- [ ] Missing membership tests planned.
- [ ] Wrong-actor membership tests planned.
- [ ] Cross-workspace denial tests planned.
- [ ] Viewer write denial tests planned.
- [ ] Admin allowed path tests planned.
- [ ] Owner membership-management tests planned.
- [ ] Safe auth error tests planned.

## Explicit Future Approval

- [ ] Explicit approval obtained before real auth runtime wiring.
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
