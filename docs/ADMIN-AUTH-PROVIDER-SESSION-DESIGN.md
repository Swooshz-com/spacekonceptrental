# Admin Auth Provider Session Design

This document records the Phase 2B-E auth provider/session/security design,
the Phase 2B-J approved future admin auth runtime lane, the Phase 2B-K
implemented server-only identity/session-read boundary, and the Phase 2B-L
implemented server-only profile/membership read boundary.

Phase 2B-E added auth provider/session/security design only.
Phase 2B-J approves the future server-only Supabase Auth runtime lane only.
Phase 2B-K implements only the server-only Supabase Auth identity boundary.
Phase 2B-L implements only the server-only admin profile/membership read
boundary.

Phase 2B-K cookie reads and Supabase Auth server calls are restricted to the
server-only identity adapter named below.
Phase 2B-L `admin_users` and `memberships` reads are restricted to the
server-only profile/membership adapter named below.
This document does not approve auth runtime wiring outside that boundary.
This document does not read headers.
This document does not add login/logout routes.
This document does not add protected admin pages.
This document does not add admin UI.
This document does not add product writes.

Browser Supabase remains forbidden.
Service-role runtime paths remain forbidden unless separately approved.
Supabase Auth is officially selected as the future admin auth provider.
Future auth must remain server-side.
Future session cookies must be server-managed, HttpOnly, Secure in
production, and have reviewed SameSite behaviour.
Future state-changing admin routes/server actions need CSRF strategy before implementation.
Admin identity must be resolved server-side and mapped to active admin profile before membership role is trusted.
Membership role must belong to the active server-resolved admin profile.
Browser/request workspace IDs remain validation-only and never trusted authority.
Product writes remain blocked until real auth/membership resolution, RLS, audit, and route/action boundaries are implemented and tested.

## Purpose

Define the future admin auth provider, server-side session model, cookie
expectations, CSRF expectations, login/logout boundary, protected-admin-page
boundary, and implementation gates before any real auth runtime is added.

This document extends `docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md`. It narrows the
next auth decision without adding runtime auth, cookies, headers, routes,
server actions, admin UI, product writes, Supabase Cloud, deployment, or
service-role runtime paths.

## Scope

This document covers:

- Recommended future auth provider.
- Server-only auth boundary.
- Future session and cookie expectations.
- CSRF expectations for state-changing admin operations.
- Login/logout route expectations.
- Protected admin page expectations.
- Mapping auth identity to `admin_users.auth_user_id`.
- Active admin profile and membership lookup expectations.
- Adapter integration expectations.
- Error, redirect, audit, and security event expectations.
- Testing requirements and implementation gates.

It does not change any runtime code.

## Phase 2B-J Approved Future Runtime Lane

Supabase Auth is officially selected as the future admin auth provider.

Approved future implementation boundary: first-party server-only routes or server actions may use Supabase Auth server APIs only on the server.

The approved future auth boundary must resolve provider identity server-side,
map it to exactly one active `admin_users.auth_user_id`, resolve active
workspace membership owned by that admin profile, build
`AdminAuthorizationInput` through the existing server-only resolver/adapter
contracts, and return safe unauthenticated or forbidden results without
exposing provider internals.

Session cookies must be server-managed, HttpOnly, Secure in production, SameSite=Lax by default unless a later OAuth flow documents an exception, path-scoped, bounded by reviewed lifetime, rotated or refreshed server-side, and cleared on logout.

Session material must not be stored in localStorage, exposed to browser
components, logged, or mixed with service-role credentials. A later
implementation PR may read cookies only inside the reviewed server-only auth
boundary.

CSRF must be implemented before any state-changing admin route or server action by validating a signed per-session CSRF token or an equivalent framework-supported proof, checking Origin/Host, and failing closed for missing, stale, replayed, or mismatched proof.

Login and logout routes must be first-party server routes or server actions, use POST for state changes, validate safe same-origin redirects, return generic errors, avoid logging credentials or tokens, and never expose Supabase internals.

Protected admin pages must resolve identity, active admin profile, and active membership server-side before rendering workspace-scoped admin data.

Protected pages must not import resolver/adapters into browser components, must
not reveal cross-workspace record existence, and must not add admin UI or
product/category/product image writes without separate approval.

Runtime auth is not complete until tests cover anonymous denial, expired session denial, inactive profile denial, missing membership denial, wrong-actor membership denial, cross-workspace denial, viewer write denial, admin allowed access, owner membership-management access, CSRF failure, safe redirect handling, safe auth errors, no browser Supabase, and no service-role runtime path.

This approval lane authorizes a later PR to implement only the reviewed
server-only auth boundary. Login/logout route implementation, protected admin
pages, admin UI, product writes, Supabase Storage, deployment, Supabase Cloud,
browser Supabase, and service-role runtime paths remain separate unchecked
runtime work unless a future PR explicitly approves them.

## Phase 2B-K Implemented Identity Boundary

`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts` is the only approved module for reading Supabase Auth cookies and calling Supabase Auth server APIs in this phase.

It implements the existing `AdminAuthAdapter` identity shape only and is not wired into runtime routes, pages, or server actions.

Cookie reads and `auth.getUser()` are allowed only inside that server-only identity boundary.

The boundary imports `server-only`, uses `@supabase/ssr` with the existing
server-side Supabase URL and anon key configuration, reads request cookies with
`cookies()`, and resolves the provider user through `auth.getUser()`.

The boundary returns `{ authenticated: true, authUserId }` only when Supabase
Auth returns a user ID. Missing, expired, invalid, or provider-error sessions
return safe unauthenticated denial results without exposing tokens, cookies,
provider internals, stack traces, Supabase internals, SQL, or env values.

The boundary does not read headers, use service-role keys, create browser
Supabase clients, add login/logout routes, add protected admin pages, add
admin UI, add product writes, add Storage, connect Supabase Cloud, or deploy.

## Phase 2B-L Implemented Profile And Membership Read Boundary

`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts` is the only approved module for Supabase `admin_users` and `memberships` table reads in this phase.

It implements the existing `AdminProfileAdapter` and `AdminMembershipAdapter` safe shapes only and is not wired into runtime routes, pages, or server actions.

The profile boundary reads `admin_users` by `auth_user_id`, requires exactly one
active profile row, and returns only `{ id, status }`. Missing, inactive,
duplicate, non-exact, query-error, or provider-error profile results fail
closed.

The membership boundary reads `memberships` by active admin profile ID and the
server-resolved workspace ID, requires exactly one active membership row with a
known role, and returns only `{ adminUserId, workspaceId, status, role }`.
Missing, inactive, wrong-actor, cross-workspace, duplicate, non-exact,
query-error, or provider-error membership results fail closed.

It does not default to the plain anon-key Supabase helper. This phase requires
an explicitly injected authenticated admin-read client before live Supabase
admin profile or membership reads can run; without that dependency, the
adapters fail closed with `null`.

Live authenticated read-client wiring remains deferred. The boundary does not
read cookies, call Supabase Auth, read headers, use service-role keys, create
browser Supabase clients, add login/logout routes, add protected admin pages,
add admin UI, add product writes, add Storage, connect Supabase Cloud, change
n8n workflows, add Pinecone runtime code, access `website/chat-config.js`, or
deploy.

## Non-goals

This document does not:

- Wire real auth into runtime routes, pages, or server actions.
- Add Supabase Auth runtime wiring outside the Phase 2B-K identity boundary.
- Read cookies outside the Phase 2B-K identity boundary.
- Read `admin_users` or `memberships` outside the Phase 2B-L
  profile/membership boundary.
- Add live authenticated read-client wiring for Phase 2B-L profile/membership
  reads.
- Read headers.
- Add login/logout routes.
- Add protected admin pages.
- Add admin UI.
- Add product/category/product image writes.
- Add product/category/product image mutation routes.
- Wire resolver/adapters into runtime routes, pages, or server actions.
- Add browser Supabase.
- Add service-role runtime reads or writes.
- Add Supabase Storage wiring.
- Connect to Supabase Cloud.
- Add deployment configuration.
- Add production seed data.

## Recommended Auth Provider

Supabase Auth is officially selected as the future admin auth provider.

That selection approves only the future server-only lane documented in Phase
2B-J. Runtime wiring still belongs to a later implementation PR that must
follow the exact server boundary, cookie/session, CSRF, login/logout,
protected-page, and test requirements in this document.

## Why Supabase Auth Is The Preferred Future Provider

Supabase Auth aligns with the current schema and architecture:

- The MVP schema already includes `admin_users.auth_user_id`.
- Workspace authorization already flows through `admin_users` and
  `memberships`.
- Existing Supabase runtime helpers are server-only.
- Future admin RLS can align authenticated Supabase identity with active
  `admin_users` and active `memberships`.

The browser must not receive a Supabase service-role key, server-only Supabase
environment values, or a browser Supabase client for admin auth in this phase.

## Server-only Auth Boundary

Future auth must remain server-side.

A future auth boundary should:

- Resolve authenticated identity on the server.
- Map that identity to an active `admin_users` profile.
- Resolve active workspace membership for that admin profile.
- Prove membership ownership before trusting a role.
- Build `AdminAuthorizationInput` through the existing server-only resolver
  and adapter contracts.
- Return safe authorization failures without exposing provider internals.

Client components may submit credentials or form data only through approved
first-party routes or server actions in a future PR. They must not hold trusted
workspace authority, service-role credentials, server-only Supabase env values,
or browser Supabase clients.

## Session/cookie Model

Future session cookies must be HttpOnly, Secure in production, and have reviewed SameSite behaviour.

The future implementation must decide:

- Which cookies exist.
- Which route or server action creates or clears each cookie.
- Whether cookies contain opaque session references or provider-managed session
  material.
- Cookie lifetime, refresh, rotation, and revocation behaviour.
- `SameSite` mode for login, logout, and admin workflows.
- Local development differences from production cookie flags.

Session material must not be stored in localStorage for admin authority.
Session cookies must not expose tokens, secrets, stack traces, Supabase
internals, service-role keys, or n8n details.

This document does not read cookies and does not add session code.

## CSRF Expectations

Future state-changing admin routes/server actions need CSRF strategy before implementation.

Before any admin mutation, login, logout, or session-changing endpoint is added,
a future PR must define and test:

- CSRF token or equivalent framework-supported protection.
- Origin and host validation expectations.
- SameSite assumptions.
- Behaviour for missing, stale, replayed, or mismatched CSRF proof.
- Safe failure responses or redirects.

Product/category/product image writes remain blocked until this is resolved.

## Login/logout Route Expectations

Login/logout routes must be added separately and must not expose tokens, secrets, stack traces, or Supabase internals.

Future login and logout routes should:

- Be first-party server routes or server actions.
- Validate bounded inputs.
- Use safe generic errors.
- Avoid logging raw credentials or provider token material.
- Avoid exposing Supabase internals or stack traces.
- Respect CSRF and redirect rules.
- Clear session state safely on logout.

This document does not add login/logout routes.

## Protected Admin Page Expectations

Protected admin pages must be added separately after the server-only auth
boundary is implemented and tested.

Future protected pages should:

- Resolve identity server-side before rendering admin data.
- Resolve active admin profile before trusting membership.
- Resolve active workspace membership before allowing workspace-scoped access.
- Avoid revealing cross-workspace record existence.
- Avoid importing resolver/adapters into browser components.
- Avoid product/category/product image writes until the write gate is approved.

This document does not add protected admin pages.

## Admin Identity Mapping

Admin identity must map to `admin_users.auth_user_id`.

The future auth adapter should turn the provider identity into an auth user ID,
then the profile adapter should look up a matching active `admin_users` row.
Missing or inactive admin profiles must deny access before membership role is
trusted.

## Admin Profile Lookup Expectations

Admin profile lookup must be server-side and status-aware.

Future lookup must deny:

- Missing profile.
- Inactive profile.
- Deleted, disabled, or otherwise non-active profile states.
- Provider identities that do not map to exactly one allowed admin profile.

Errors must be safe and must not expose SQL, Supabase internals, stack traces,
raw provider payloads, or tokens.

## Workspace Membership Lookup Expectations

Membership lookup must be server-side, workspace-scoped, actor-scoped, and
status-aware.

Future lookup must prove:

- Membership belongs to the active server-resolved admin profile.
- Membership belongs to the server-resolved workspace.
- Membership is active.
- Role allows the requested operation.

Membership role must belong to the active server-resolved admin profile.
Browser/request workspace IDs remain validation-only and never trusted authority.

## Adapter Integration Expectations

The future Supabase Auth implementation should satisfy the existing
server-only adapter contracts rather than bypassing them:

- `AdminAuthAdapter` resolves authenticated identity.
- `AdminProfileAdapter` resolves active admin profile.
- `AdminWorkspaceResolver` resolves trusted workspace scope server-side.
- `AdminMembershipAdapter` resolves membership owned by that admin profile.

The resolver and adapter modules are not wired into runtime routes/pages/server
actions by this document.

## Error Handling Expectations

Future auth errors should be safe and boring:

- Anonymous or expired session: unauthenticated response or redirect.
- Missing or inactive admin profile: forbidden or safe admin-unavailable
  response.
- Missing or inactive membership: forbidden without cross-workspace leakage.
- Wrong-actor membership: forbidden.
- Provider or database failure: generic unavailable response.

Responses must not expose tokens, cookies, secrets, SQL, Supabase internals,
stack traces, provider traces, n8n details, or workspace data the actor cannot
access.

## Redirect Expectations

Redirect behaviour must be reviewed before login/logout routes or protected
admin pages are implemented.

Future redirects should:

- Allow only same-origin or reviewed relative return targets.
- Avoid reflecting untrusted redirect targets.
- Preserve enough context for user experience without leaking private data.
- Use safe fallback destinations for invalid or missing return targets.

## Audit/security Event Expectations

Future auth work should define security event logging before product writes are
enabled.

Candidate events:

- Login success and failure.
- Logout.
- Session refresh failure.
- Missing admin profile.
- Inactive admin profile.
- Missing membership.
- Wrong-actor membership.
- Cross-workspace denial.
- Role denial.

Audit/security events must not store secrets, raw cookies, raw tokens, password
material, n8n webhook URLs, service-role keys, or unnecessary customer PII.

## Testing Expectations

A future implementation PR must include tests for:

- Anonymous denial.
- Expired or missing session denial.
- Inactive admin profile denial.
- Missing membership denial.
- Wrong-actor membership denial.
- Cross-workspace denial.
- Viewer write denial.
- Admin allowed path after active same-admin same-workspace membership.
- Owner membership-management path after active same-admin same-workspace
  membership.
- Safe auth errors.
- CSRF failures for state-changing boundaries.
- Safe redirect handling.
- No browser Supabase.
- No service-role runtime path.

## Forbidden Shortcuts

Do not use:

- Browser Supabase for admin auth.
- Browser/request workspace ID as trusted admin scope.
- Service-role runtime paths as an auth shortcut.
- Public product/category/product image mutation routes.
- Login/logout routes without CSRF and safe redirect review.
- Protected admin pages without server-side identity/profile/membership
  resolution.
- `website/chat-config.js` for auth, admin, workspace, product, or provider
  configuration.
- Production seed data to create admin access without review.
- Deployment configuration as auth implementation.

## First Implementation PR After This Design

The next implementation PR should still avoid product writes.

A safe next PR would add only the reviewed server-side auth boundary using the
approved provider, with tests for anonymous denial, inactive admin denial,
missing membership denial, wrong-actor membership denial, cross-workspace
denial, role denial, safe errors, CSRF expectations, and no browser Supabase.

Login/logout routes, protected admin pages, admin UI, and product writes should
remain separate PRs unless explicitly approved.
