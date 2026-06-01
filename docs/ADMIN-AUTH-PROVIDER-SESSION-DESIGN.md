# Admin Auth Provider Session Design

This document records the Phase 2B-E auth provider/session/security design,
the Phase 2B-J approved future admin auth runtime lane, the Phase 2B-K
implemented server-only identity/session-read boundary, and the Phase 2B-L
implemented server-only profile/membership read boundary, and the Phase 2B-M
implemented server-only workspace resolution boundary, and the Phase 2B-N
implemented server-only session-bound admin read-client factory, and the Phase
2B-O implemented server-only admin authorization adapter-set composition
boundary, and the Phase 2B-P implemented server-only composed admin
authorization decision boundary, and the Phase 2B-Q implemented server-only
admin request security preflight boundary, and the Phase 2B-R implemented
server-only CSRF proof verifier boundary, the Phase 2B-S implemented
server-only CSRF proof issuer boundary, the Phase 2B-T implemented
server-only admin authorization gate composition boundary, the Phase 2B-U
approved future admin runtime gate usage lane, and the Phase 2B-V implemented
server-only admin request metadata adapter boundary, the Phase 2B-W
implemented server-only admin runtime gate invocation boundary, the Phase 2B-X
approved future admin runtime gate invocation usage lane, the Phase 2B-Y
implemented server-only admin runtime route gate adapter boundary, the
Phase 2B-Z approved future admin runtime route gate adapter usage lane, and the
Phase 2B-AA implemented the first admin runtime route gate adapter usage boundary, and the
Phase 2B-AB approved future admin CSRF proof issuer runtime usage lane.

Phase 2B-E added auth provider/session/security design only.
Phase 2B-J approves the future server-only Supabase Auth runtime lane only.
Phase 2B-K implements only the server-only Supabase Auth identity boundary.
Phase 2B-L implements only the server-only admin profile/membership read
boundary.
Phase 2B-M implements only the server-only admin workspace resolution boundary.
Phase 2B-N implements only the server-only session-bound admin read-client
factory.
Phase 2B-O implements only the server-only admin authorization adapter-set
composition boundary.
Phase 2B-P implements only the server-only composed admin authorization
decision boundary.
Phase 2B-Q implements only the server-only admin request security preflight
boundary.
Phase 2B-R implements only the server-only CSRF proof verifier boundary.
Phase 2B-S implements only the server-only CSRF proof issuer boundary.
Phase 2B-T implements only the server-only admin authorization gate
composition boundary.
Phase 2B-U approves only the future admin runtime gate usage lane.
Phase 2B-V implements only the server-only admin request metadata adapter
boundary.
Phase 2B-W implements only the server-only admin runtime gate invocation
boundary.
Phase 2B-X approves only the future admin runtime gate invocation usage lane.
Phase 2B-Y implements only the server-only admin runtime route gate adapter
boundary.
Phase 2B-Z approves only the future admin runtime route gate adapter usage
lane.
Phase 2B-AA implements only the first admin runtime route gate adapter usage boundary.
Phase 2B-AB approves only the future admin CSRF proof issuer runtime usage lane.

Phase 2B-K cookie reads and Supabase Auth server calls are restricted to the
server-only identity adapter named below.
Phase 2B-L `admin_users` and `memberships` reads are restricted to the
server-only profile/membership adapter named below.
Phase 2B-M admin workspace resolution is restricted to the server-only
workspace resolver named below.
Phase 2B-N session-bound admin read-client creation is restricted to the
server-only identity adapter named below.
Phase 2B-O adapter-set composition is restricted to the server-only
composition module named below.
Phase 2B-P composed decision resolution is restricted to the server-only
decision module named below.
Phase 2B-Q request security preflight validation is restricted to the
server-only preflight module named below.
Phase 2B-R CSRF proof verification is restricted to the server-only verifier
module named below.
Phase 2B-S CSRF proof issuance is restricted to the server-only issuer module
named below.
Phase 2B-T admin authorization gate composition is restricted to the
server-only gate module named below.
Phase 2B-U is docs/checklist approval only and does not add runtime wiring.
Phase 2B-V request metadata reads are restricted to the server-only request
metadata adapter named below.
Phase 2B-W admin runtime gate invocation is restricted to the server-only
invocation helper named below.
Phase 2B-Y admin runtime route gate adapter plumbing is restricted to the
server-only route gate adapter named below.
Phase 2B-Z is docs/checklist approval only for future first-party server-only
usage of the Phase 2B-Y route gate adapter and does not add runtime wiring.
Phase 2B-AA first admin runtime usage is restricted to the server-only probe route named below.
This document does not approve auth runtime wiring outside these boundaries.
This document does not approve header reads outside the Phase 2B-V adapter.
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

## Phase 2B-N Implemented Session-bound Admin Read-client Factory

`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts` is also the only approved module for creating a session-bound admin read client in this phase.

The factory returns the Phase 2B-L `SupabaseAdminReadClientResult` shape and is not wired into runtime routes, pages, or server actions.

The factory reuses the reviewed server-only Supabase URL, anon key, and
request-cookie path inside the Phase 2B-K identity boundary to create a
session-bound Supabase SSR client for future RLS-scoped admin profile and
membership reads. It does not call Supabase Auth itself, does not validate a
session by querying a provider, and does not make runtime admin auth complete.

Missing server env, cookie-read failure, client-factory failure, or a missing
session-bound client fail closed with the safe Phase 2B-L unavailable
dependency shape. The result does not expose cookie values, tokens, Supabase
internals, env values, SQL, provider errors, or stack traces.

Creating this factory does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The factory does not query `admin_users`, does not query `memberships`, does
not read headers, does not use service-role keys, does not create browser
Supabase clients, does not add product writes, does not add Storage, does not
connect Supabase Cloud, does not deploy, does not change n8n workflows, does
not add Pinecone runtime code, and does not access `website/chat-config.js`.

## Phase 2B-O Implemented Adapter-set Composition Boundary

`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts` is the only approved module for composing the admin authorization adapter set in this phase.

The composition boundary returns an `AdminAuthorizationAdapterSet` only when the session-bound admin read client and trusted server-side workspace input are both available.

It composes the existing `AdminAuthAdapter`, `AdminProfileAdapter`,
`AdminMembershipAdapter`, and `AdminWorkspaceResolver` contracts by using the
Phase 2B-K/N identity and session-bound read-client boundary, the Phase 2B-L
profile/membership read boundary, and the Phase 2B-M workspace resolver
boundary. Missing server env, cookie-read failure, client-factory failure,
missing session-bound client, missing trusted workspace input, or workspace
provider failure returns a safe unavailable result without exposing cookies,
tokens, env values, Supabase internals, SQL, provider details, stack traces,
or membership details.

Composing this adapter set does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The composition module does not import `next/headers`, `@supabase/ssr`,
`@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or
`website/chat-config.js`. It does not read headers, use service-role keys,
create browser Supabase clients, add product writes, add Storage, connect
Supabase Cloud, deploy, change n8n workflows, or add Pinecone runtime code.

## Phase 2B-P Implemented Composed Decision Boundary

`website/lib/admin/authorization/server-admin-authorization-decision.ts` is the only approved module for resolving a composed admin authorization decision in this phase.

The decision boundary composes the Phase 2B-O adapter set and calls `resolveAdminAuthorizationWithAdapters()`.

It returns the existing adapter-driven policy decision shapes when the
composed adapter set is available. Adapter-set composition failures, missing
session-bound admin read clients, missing trusted workspace input, resolver
throws, or provider dependency failures return a safe unavailable result
without exposing cookies, tokens, env values, Supabase internals, SQL, provider
details, stack traces, workspace details, or membership details.

Creating this decision boundary does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The decision module does not import `next/headers`, `@supabase/ssr`,
`@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or
`website/chat-config.js`. It does not read headers, use service-role keys,
create browser Supabase clients, add product writes, add Storage, connect
Supabase Cloud, deploy, change n8n workflows, add Pinecone runtime code, or
duplicate policy logic.

## Phase 2B-Q Implemented Request Security Preflight Boundary

`website/lib/admin/authorization/server-admin-request-security-preflight.ts` is the only approved module for validating admin request security preflight in this phase.

The preflight boundary validates only explicitly injected request metadata and optional injected CSRF verifier results.

It treats request method, Origin, Host, and CSRF proof values as untrusted
validation inputs supplied by a future server boundary. It does not read real
request headers, cookies, Supabase Auth, Supabase tables, service-role keys,
runtime route handlers, pages, or server actions.

The preflight validator permits read-only `catalogue.read` requests with safe
methods and same-origin metadata without CSRF proof. It treats
`product.write`, `category.write`, `productImage.write`, and
`membership.manage` as state-changing admin operations that require POST,
same-origin Origin/Host metadata, an explicit CSRF proof, and a valid injected
CSRF verifier result. Missing method, missing Origin, missing Host,
Origin/Host mismatch, missing CSRF proof, invalid, stale, replayed,
mismatched, thrown, or unsupported inputs fail closed with safe result shapes.

Creating this preflight validator does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The preflight module does not import `next/headers`, `@supabase/ssr`,
`@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or
`website/chat-config.js`. It does not read headers or cookies, call Supabase
Auth, query `admin_users` or `memberships`, create a session-bound admin read
client, compose the adapter set, call the composed decision boundary, use
service-role keys, create browser Supabase clients, add product writes, add
Storage, connect Supabase Cloud, deploy, change n8n workflows, or add Pinecone
runtime code.

## Phase 2B-R Implemented CSRF Proof Verifier Boundary

`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts` is the only approved module for validating structured CSRF proofs in this phase.

The verifier validates only explicitly injected proof material and dependency-injected signature or replay checks.

It accepts the Phase 2B-Q `verifyCsrfProof` dependency input shape and returns
only Phase 2B-Q-compatible results. It can be injected into the Phase 2B-Q
preflight validator in isolated unit tests, but it is not wired into runtime
routes, pages, or server actions.

The verifier parses a simple structured
`base64url(JSON payload).base64url(signature)` proof shape. The payload may
include operation, session binding, nonce, issued-at timestamp, and expiry
timestamp. Operation, expected session binding, expected nonce, freshness,
expiry, replay state, and signature validity are validated only from explicit
injected inputs or injected verifier dependencies. Missing proof, malformed
proof, operation mismatch, session binding mismatch, missing nonce, invalid
timestamps, stale proof, expired proof, replayed proof, invalid signature,
missing signature verifier, signature verifier throws, and replay checker
throws fail closed with safe CSRF proof reasons.

Creating this CSRF verifier does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The verifier module does not import `next/headers`, `@supabase/ssr`,
`@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or
`website/chat-config.js`. It does not read headers, read cookies, read env,
call Supabase Auth, query `admin_users` or `memberships`, create a
session-bound admin read client, compose the adapter set, call the composed
decision boundary, use service-role keys, create browser Supabase clients,
issue CSRF tokens, add product writes, add Storage, connect Supabase Cloud,
deploy, change n8n workflows, or add Pinecone runtime code.

## Phase 2B-S Implemented CSRF Proof Issuer Boundary

`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts` is the only approved module for issuing structured CSRF proofs in this phase.

The issuer creates verifier-compatible proofs only from explicitly injected operation, session binding, nonce, timestamps, and signer dependencies.

It supports only state-changing admin operations and returns a structured
`base64url(JSON payload).base64url(signature)` proof with safe expiry metadata
only when operation, session binding, nonce, issued-at timestamp, expiry
timestamp, and signature signer are all valid. It can use an injected nonce
generator when no nonce is supplied. Missing or unsupported operations,
read-only operations, missing session binding, missing nonce, invalid
timestamps, expiry before or equal issued-at, missing signer, signer empty
return, signer throw, or dependency failure fail closed with safe issue
reasons.

Creating this CSRF issuer does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The issuer module does not import `next/headers`, `@supabase/ssr`,
`@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or
`website/chat-config.js`. It does not read headers, read cookies, read env,
call Supabase Auth, query `admin_users` or `memberships`, create a
session-bound admin read client, compose the adapter set, call the composed
decision boundary, call the preflight boundary, verify CSRF proofs, store
replay state, use service-role keys, create browser Supabase clients, add
product writes, add Storage, connect Supabase Cloud, deploy, change n8n
workflows, or add Pinecone runtime code. Future runtime callers must pair
issued nonces with verifier `expectedNonce` or replay checking before runtime
use is approved.


## Phase 2B-T Implemented Admin Authorization Gate Composition Boundary

`website/lib/admin/authorization/server-admin-authorization-gate.ts` is the only approved module for composing the request-security preflight and composed admin authorization decision boundaries in this phase.

The gate runs the Phase 2B-Q request security preflight before the Phase 2B-P composed admin authorization decision. It may inject the Phase 2B-R CSRF proof verifier into preflight when verifier dependencies are supplied. It calls the decision boundary only after preflight passes and returns safe allow, deny, or unavailable shapes.

Creating this gate does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The gate module does not import `next/headers`, `@supabase/ssr`, `@supabase/supabase-js`, public catalogue workspace config, n8n, Pinecone, or `website/chat-config.js`. It does not read headers, read cookies, read env, call Supabase Auth, query `admin_users` or `memberships`, create a session-bound admin read client directly, compose adapter sets directly, issue CSRF proofs, duplicate admin role or membership policy logic, use service-role keys, create browser Supabase clients, add product writes, add Storage, connect Supabase Cloud, deploy, change n8n workflows, or add Pinecone runtime code.

## Phase 2B-U Approved Future Admin Runtime Gate Usage Lane

A future runtime PR may call `resolveServerAdminAuthorizationGate()` only from a first-party server-only route handler or server action after a reviewed request metadata adapter exists.

The future request metadata adapter is the only future place where real request headers may be read, and it must pass explicit method, Origin, Host, expected Origin, expected Host, request ID, operation, workspace validation, and CSRF proof metadata into the gate. Header values remain untrusted validation inputs; they must not become identity, membership, workspace, or provider authority.

The future runtime lane must keep Supabase Auth cookie reads only inside `supabase-admin-auth-identity-adapter.ts`, keep `admin_users` and `memberships` reads only inside `supabase-admin-profile-membership-adapters.ts`, keep trusted workspace resolution only inside `server-admin-workspace-resolver.ts`, keep session-bound admin read-client creation only inside the Phase 2B-K/N identity boundary, keep adapter-set composition only inside `server-admin-authorization-adapter-set.ts`, and keep CSRF proof issuing and verification behind the Phase 2B-S issuer and Phase 2B-R verifier boundaries.

Preflight-before-decision ordering must be preserved by using the Phase 2B-T gate. CSRF proof plus Origin/Host validation must run before any state-changing admin route or server action reaches authorization. Future login/logout work must validate safe same-origin redirects and return generic errors without provider internals.

Phase 2B-U does not add that metadata adapter, route handler, page, server action, header read, login/logout route, protected admin page, admin UI, product write, Supabase Cloud connection, deployment config, or real env value.

Future runtime gate usage is not complete until tests prove:

- Anonymous denial.
- Expired session denial.
- Missing or inactive admin profile denial.
- Missing, inactive, or wrong-actor membership denial.
- Cross-workspace denial.
- Viewer write denial.
- Admin allowed access.
- Owner membership-management allowed access.
- Missing, invalid, stale, replayed, or mismatched CSRF proof denial.
- Origin/Host mismatch denial.
- Safe unavailable result on dependency failure.
- No browser Supabase.
- No service-role runtime path.
- No `website/chat-config.js` access.

## Phase 2B-V Implemented Admin Request Metadata Adapter Boundary

`website/lib/admin/authorization/server-admin-request-metadata-adapter.ts` is the only newly approved production module in this phase that may import `next/headers` and call `headers()`.

The adapter reads only untrusted request metadata for future injection into `resolveServerAdminAuthorizationGate()` and does not call the gate. It may collect request method from explicit injected input, request Origin and Host from request headers, optional request ID, and optional CSRF proof. Trusted expected Origin and expected Host must be supplied through explicit dependency/config injection rather than request headers, env reads, or deployment metadata.

Missing trusted expected Origin or expected Host fails closed. Header read failures and dependency throws return only safe unavailable shapes. Missing request Origin or Host may be represented as absent untrusted metadata so the Phase 2B-Q preflight can deny it safely when the gate is used in a later approved runtime PR.

Header values remain validation metadata only. They are not identity, membership, workspace, provider, session, or authorization authority, and workspace IDs from headers must not be parsed or trusted as authority.

Creating this metadata adapter does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The adapter does not call the Phase 2B-T gate, Phase 2B-Q preflight, Phase 2B-P decision boundary, Phase 2B-R verifier, Phase 2B-S issuer, Phase 2B-O adapter-set composition, Supabase Auth, `admin_users`, `memberships`, product write logic, Storage, n8n, Pinecone, or `website/chat-config.js`.

## Phase 2B-W Implemented Admin Runtime Gate Invocation Boundary

`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts` is the only approved module in this phase for composing the Phase 2B-V request metadata adapter with the Phase 2B-T admin authorization gate.

The invocation helper calls `readServerAdminRequestMetadata()` to collect explicit request metadata, then passes that metadata plus explicit requested operation and workspace-validation inputs into `resolveServerAdminAuthorizationGate()`. Trusted expected Origin and expected Host must still come through explicit dependency/config injection. Request headers remain untrusted validation metadata and are read only by the Phase 2B-V adapter.

Creating this invocation helper does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The helper does not import `next/headers`, call `headers()`, read cookies, read env, call Supabase Auth, query `admin_users` or `memberships`, resolve workspaces directly, compose adapter sets directly, call the decision boundary directly, call request-security preflight directly, issue or verify CSRF proofs directly, use service-role keys, add browser Supabase, add Storage, connect Supabase Cloud, deploy, change n8n workflows, add Pinecone runtime code, or access `website/chat-config.js`.

## Phase 2B-X Approved Future Admin Runtime Gate Invocation Usage Lane

A future runtime PR may call `resolveServerAdminRuntimeGateInvocation()` only from a first-party server-only route handler or server action.

Future runtime usage must call only the Phase 2B-W invocation helper from the route/action boundary. It must pass explicit trusted configuration and dependencies into that helper rather than duplicating lower-level boundary logic.

Header reads must remain inside the Phase 2B-V request metadata adapter. Cookie reads and Supabase Auth calls must remain inside the Phase 2B-K/N identity boundary. `admin_users` and `memberships` reads must remain inside the Phase 2B-L profile/membership boundary. Workspace resolution must remain inside Phase 2B-M. Adapter-set composition must remain inside Phase 2B-O. Decision logic must remain inside Phase 2B-P. Request-security preflight must remain inside Phase 2B-Q / Phase 2B-T gate. CSRF verification must remain inside Phase 2B-R / Phase 2B-T gate. CSRF issuance must remain inside the Phase 2B-S issuer boundary.

Phase 2B-X does not add route handlers, pages, server actions, runtime helper usage, login/logout, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role paths, n8n changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

Actual runtime route/page/server-action usage of `resolveServerAdminRuntimeGateInvocation()` remains unchecked and deferred until a later implementation PR adds and tests that code.

## Phase 2B-Y Implemented Admin Runtime Route Gate Adapter Boundary

`website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts` is the only approved module in this phase for route/action-safe calls into `resolveServerAdminRuntimeGateInvocation()`.

The adapter accepts explicit requested operation and workspace-validation inputs, trusted expected Origin and expected Host dependencies, gate dependencies, and either an explicit request method or a minimal request-like object with only `method`. It normalizes the method, injects it into the Phase 2B-W request metadata dependency shape, and calls only `resolveServerAdminRuntimeGateInvocation()`.

Creating this adapter does not approve adding or using route handlers, pages, server actions, protected admin pages, login/logout, admin UI, or product writes.

The adapter does not read request headers directly, read cookies, read env, import `next/headers`, call `headers()`, import or call `cookies()`, call `readServerAdminRequestMetadata()` directly, call `resolveServerAdminAuthorizationGate()` directly, call preflight, decision, CSRF verifier, CSRF issuer, adapter-set composition, Supabase Auth, `admin_users`, `memberships`, or workspace resolver boundaries directly, use service-role keys, add browser Supabase, add Storage, connect Supabase Cloud, deploy, change n8n workflows, add Pinecone runtime code, or access `website/chat-config.js`.

Actual runtime route/page/server-action usage of this adapter remains unchecked and deferred until a later implementation PR adds and tests that code.
## Phase 2B-Z Approved Future Admin Runtime Route Gate Adapter Usage Lane

A future runtime PR may call `resolveServerAdminRuntimeRouteGateAdapter()` only from a first-party server-only route handler or server action.

Future runtime usage must call only the Phase 2B-Y route gate adapter from the route/action boundary. It must pass explicit trusted configuration and dependencies into that adapter rather than duplicating lower-level boundary logic.

Header reads must remain inside the Phase 2B-V request metadata adapter. Cookie reads and Supabase Auth calls must remain inside the Phase 2B-K/N identity boundary. `admin_users` and `memberships` reads must remain inside the Phase 2B-L profile/membership boundary. Workspace resolution must remain inside Phase 2B-M. Adapter-set composition must remain inside Phase 2B-O. Decision logic must remain inside Phase 2B-P. Request-security preflight must remain inside Phase 2B-Q / Phase 2B-T gate. CSRF verification must remain inside Phase 2B-R / Phase 2B-T gate. CSRF issuance must remain inside the Phase 2B-S issuer boundary. Runtime gate invocation must remain inside the Phase 2B-W invocation boundary. Route gate adapter plumbing must remain inside the Phase 2B-Y route gate adapter boundary.

Phase 2B-Z does not add route handlers, pages, server actions, route gate adapter runtime usage, login/logout, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role paths, n8n changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

Actual runtime route/page/server-action usage of `resolveServerAdminRuntimeRouteGateAdapter()` remains unchecked and deferred until a later implementation PR adds and tests that code.

## Phase 2B-AA Implemented First Admin Runtime Route Gate Adapter Usage Boundary

`website/app/api/admin/auth-check/route.ts` is the only approved first-party server-only route handler in this phase that calls `resolveServerAdminRuntimeRouteGateAdapter()`.

This boundary introduces a harmless GET authorization probe/check that uses the Phase 2B-Y route gate adapter with the read-only `admin.auth.check` operation. It passes explicit requested operation, empty workspace-validation inputs, and the request method to the adapter. Trusted expected Origin and expected Host continue to come from explicit dependency injection.

This first usage boundary does not read request headers directly, read cookies directly, import `next/headers` directly, call `headers()` directly, import or call `cookies()` directly, call `readServerAdminRequestMetadata()` directly, call `resolveServerAdminAuthorizationGate()` directly, call preflight, decision, CSRF verifier, CSRF issuer, adapter-set composition, Supabase Auth, `admin_users`, `memberships`, workspace resolver, or invocation boundaries directly. It reads only `ADMIN_EXPECTED_ORIGIN` and `ADMIN_EXPECTED_HOST` from env to supply expected request metadata to the route gate adapter.

Creating this first runtime boundary does not approve adding or using other route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.
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

## Phase 2B-M Implemented Workspace Resolution Boundary

`website/lib/admin/authorization/server-admin-workspace-resolver.ts` is the only approved module for admin workspace resolution in this phase.

It implements the existing `AdminWorkspaceResolver` safe shape only and is not wired into runtime routes, pages, or server actions.

The boundary resolves trusted admin workspace scope only from an explicitly
injected trusted server-side workspace ID. Browser/request workspace IDs are validation-only and never become authority.
`requestedWorkspaceIdForValidationOnly` may validate or compare against the
trusted server-side workspace ID, but it must not choose the trusted workspace.

The boundary fails closed with `{ serverResolvedWorkspaceId: null }` without an explicitly injected trusted server-side workspace ID.
Missing, empty, whitespace-only, mismatched, or provider-error values fail
closed without exposing tokens, cookies, headers, env values, SQL, provider
internals, or stack traces. Matching validation-only workspace IDs may pass
only when trusted server-side workspace input is already present.

It does not use public catalogue workspace config as an admin authorization
shortcut. The boundary does not read cookies, call Supabase Auth, read headers,
call Supabase tables, use service-role keys, create browser Supabase clients,
add login/logout routes, add protected admin pages, add admin UI, add product
writes, add Storage, connect Supabase Cloud, change n8n workflows, add
Pinecone runtime code, access `website/chat-config.js`, or deploy.

## Non-goals

This document does not:

- Wire real auth into runtime routes, pages, or server actions.
- Add Supabase Auth runtime wiring outside the Phase 2B-K identity boundary.
- Read cookies outside the Phase 2B-K identity boundary.
- Read `admin_users` or `memberships` outside the Phase 2B-L
  profile/membership boundary.
- Add live authenticated read-client wiring for Phase 2B-L profile/membership
  reads.
- Resolve admin workspace scope outside the Phase 2B-M workspace resolution
  boundary.
- Use the Phase 2B-N session-bound admin read-client factory from runtime
  routes, pages, or server actions.
- Use the Phase 2B-O admin authorization adapter-set composition boundary from
  runtime routes, pages, or server actions.
- Use the Phase 2B-P composed admin authorization decision boundary from
  runtime routes, pages, or server actions.
- Use the Phase 2B-Q admin request security preflight boundary from runtime
  routes, pages, or server actions.
- Use the Phase 2B-R CSRF proof verifier boundary from runtime routes, pages,
  or server actions.
- Use the Phase 2B-S CSRF proof issuer boundary from runtime routes, pages, or
  server actions.
- Read headers outside the Phase 2B-V request metadata adapter.
- Add login/logout routes.
- Add protected admin pages.
- Add admin UI.
- Add product/category/product image writes.
- Add product/category/product image mutation routes.
- Wire resolver/adapters into runtime routes, pages, or server actions.
- Add browser Supabase.
- Add service-role runtime reads or writes.
- Add Supabase Storage wiring.
- Use the Phase 2B-Y admin runtime route gate adapter from runtime routes,
  pages, or server actions.
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

## Phase 2B-AB Approved Admin CSRF Proof Issuer Runtime Usage Lane

Phase 2B-AB approves the future first-party server-only CSRF proof issuer runtime usage lane.

A future implementation PR may add exactly one first-party server-only CSRF proof issuer route under `website/app/api/admin/**`. The future route must call only the Phase 2B-S CSRF issuer boundary for CSRF proof issuance and the Phase 2B-AI session/workspace binding boundary for deriving the opaque proof binding, after separate route-usage approval.

The future route must remain server-only and must not bypass the Phase 2B-Y/AA route-gate authorization path.

The future route must not call lower-level auth/security boundaries directly except the approved CSRF issuer and session/workspace binding boundaries.

The future route must not expose CSRF secrets, verifier internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, workspace internals, membership internals, or stack traces.

The future route must not approve product/category/product image writes by itself.

The future route must not add login/logout, protected admin pages, or admin UI.

Header reads must remain inside the Phase 2B-V request metadata adapter.

Runtime gate invocation must remain inside the Phase 2B-W invocation boundary.

Creating this approval lane does not approve adding or using route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## First Implementation PR After This Design

The next implementation PR should still avoid product writes.

A safe next PR would add only the reviewed server-side auth boundary using the
approved provider, with tests for anonymous denial, inactive admin denial,
missing membership denial, wrong-actor membership denial, cross-workspace
denial, role denial, safe errors, CSRF expectations, and no browser Supabase.

Login/logout routes, protected admin pages, admin UI, and product writes should
remain separate PRs unless explicitly approved.
