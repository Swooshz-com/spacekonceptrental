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
Phase 2B-R implements only the server-only CSRF proof verifier boundary.
Phase 2B-Z approves only the future admin runtime route gate adapter usage lane. Phase 2B-AA implements only the first admin runtime route gate adapter usage boundary as a harmless GET authorization probe via the `admin.auth.check` operation. Phase 2B-AB approves only the future server-only admin CSRF proof issuer runtime usage lane. Phase 2B-AC repairs the admin auth-check trusted workspace dependency. Phase 2B-AD approves only the future admin CSRF proof issuer route operation model. Phase 2B-AE implements only the admin CSRF issue operation policy and preflight boundary. Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness; actual route implementation is deferred because the required runtime signer dependencies are missing. Phase 2B-AG implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. Phase 2B-AH is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries. Phase 2B-AI implements only the server-only admin CSRF proof issuer session/workspace binding boundary and keeps the actual route deferred. Phase 2B-AJ implements only the server-only admin CSRF proof session/workspace binding runtime dependency boundary, deriving opaque bindings from canonical session/workspace inputs with the existing server-only `ADMIN_CSRF_PROOF_SECRET`. Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route for supported state-changing admin operations. Phase 2B-AL implements only backend protected product/category/product-image metadata write API routes through the approved route gate, CSRF proof, session-bound Supabase client, RLS, and audit-log boundary. Phase 2B-AN implements only a minimal first-party admin login page, server-owned login/logout routes, and a protected admin shell through the approved route-gate path. Keep
real auth runtime wiring outside Phase 2B-AN, factory, adapter-set,
decision-boundary, preflight,
CSRF verifier, CSRF issuer, request metadata adapter, runtime gate invocation helper, or authorization gate usage from other runtime routes/pages/actions,
headers, other routes, product-management UI, product writes outside the Phase 2B-AL/AM backend API route boundary, Storage, browser Supabase, and service-role runtime
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
- [x] Explicit approval obtained before Phase 2B-AN login/logout routes.
- [x] Explicit approval obtained before Phase 2B-AN protected admin shell.
- [ ] Explicit approval obtained before product-management admin UI.
- [x] Explicit approval obtained before Phase 2B-AL backend product writes.
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
- [x] Server-only CSRF proof issuer boundary.
- [x] Server-only admin authorization gate composition boundary.
- [x] Admin runtime gate usage approval lane.
- [x] Server-only admin request metadata adapter boundary.
- [x] Server-only admin runtime gate invocation boundary.
- [x] Admin runtime gate invocation usage approval lane.
- [x] Server-only admin runtime route gate adapter boundary.
- [x] Admin runtime route gate adapter usage approval lane.
- [x] First admin runtime route gate adapter usage boundary.
- [x] Admin CSRF proof issuer runtime usage approval lane.
- [x] Admin auth-check trusted workspace dependency repair.
- [x] Admin CSRF proof issuer route operation approval boundary.
- [x] Admin CSRF issue operation policy and preflight boundary.
- [x] Admin CSRF proof issuer route readiness and route-if-safe boundary.
- [x] Admin CSRF proof runtime dependency boundary.
- [x] Admin CSRF proof issuer route deferred because of missing safe server-side session/workspace binding.
- [x] Admin CSRF proof issuer session/workspace binding boundary.
- [x] Admin CSRF proof session/workspace binding runtime dependency boundary.
- [x] Admin CSRF proof issuer route implementation.
- [x] Backend-only protected product/category/product-image write API route boundary.
- [x] Minimal first-party admin login/logout and protected shell boundary.

## Still Deferred

- [ ] Real auth runtime wiring outside the Phase 2B-AN login/logout and protected shell boundary.
- [ ] Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth session boundaries.
- [ ] Resolver/adapter runtime wiring into routes, pages, or server actions.
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
- [ ] Product/category/product image writes outside the Phase 2B-AL/AM backend API route boundary.
- [ ] Product writes.
- [ ] Category writes.
- [ ] Product image writes.
- [ ] Storage and binary product image uploads.
- [ ] Storage.
- [ ] Service-role runtime paths.
- [ ] Browser Supabase.
