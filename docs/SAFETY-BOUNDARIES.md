# Safety Boundaries

These rules apply to all future work in this repo unless the user gives
explicit current-turn approval naming the target and action.

## Prohibited Without Explicit Approval

- Live n8n actions.
- Docker actions.
- Workflow import/export.
- Workflow activation or execution.
- Credential operations.
- Deployment actions.
- Production system actions.
- Source-watch or runtime operations.
- Mutating customer, production, or private business data.

## Secret And Runtime File Rules

Do not print, copy, migrate, expose, or commit:

- Webhook URLs.
- Secrets or tokens.
- `.env` files.
- `.n8n-local/`.
- `.tmp/`.
- Credential bindings.
- Live runtime payloads.
- Private keys.
- Product repo secrets.
- Local config files containing private values.

`website/chat-config.js` is gitignored and may contain a local real webhook
URL. Do not use it as source for the new Next.js app.

The new app must read the n8n webhook URL only from server-side environment
variables such as `N8N_CHAT_WEBHOOK_URL`.

## Browser Exposure Rules

- Do not expose Supabase service-role keys to the browser.
- Do not expose n8n webhook URLs to the browser.
- Do not expose provider trace IDs, n8n node names, workflow errors, stack
  traces, or internal provider details to the browser.
- Browser chat must call first-party `/api/chat`, not n8n.
- Browser chat must not write directly to Supabase.
- Do not add browser-visible `NEXT_PUBLIC_SUPABASE_*` or `NEXT_PUBLIC_` n8n
  variables for the chat path.

## Current n8n/Pinecone And SaaS Boundary

- The current SKR website may keep using the existing n8n/Pinecone chatbot
  workflow as a temporary production bridge.
- n8n remains temporary server-side integration only.
- Browser must never call n8n directly.
- The future SaaS chatbot should be a separate project/app.
- SKR can later become the first client/tenant of that SaaS chatbot.
- Do not implement SaaS chatbot app work inside this repo yet.
- Do not migrate Pinecone in this repo yet.
- Do not add Pinecone runtime code or credentials without separate approval.

## Deployment Environment Rules

- Phase 1O-A is readiness only; it is not approval to deploy.
- Phase 1P-A closeout/readiness planning is not approval to start Phase 2
  runtime work.
- Phase 2A-A deployment smoke-test runbook and operator checklist are
  preparation only; they are not approval to deploy, connect Supabase Cloud,
  add Vercel config, add real env values, or add runtime features.
- Required deployment env for Supabase, catalogue, quote, chat, and trusted
  proxy header settings must be server-only.
- Do not add real env values, deployment secrets, production config, Vercel
  project config, or production seed data without separate approval.
- Do not add `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`,
  `SUPABASE_SERVICE_ROLE_KEY`, or any service-role runtime path.
- Keep `N8N_CHAT_WEBHOOK_URL` server-only and never source it from
  `website/chat-config.js`.
- Trusted client IP header env must name only a header overwritten by the
  deployment proxy or CDN.
- Missing env must continue to fail safely: catalogue fallback, quote
  persistence-unavailable response, and chat provider fallback or safe
  unavailable response.

## Catalogue RLS Hardening Rules

- Public catalogue reads must stay server-only unless a separate browser
  Supabase client phase is approved.
- Runtime catalogue reads must stay scoped by trusted server-side
  `CATALOGUE_WORKSPACE_ID` or a future trusted host/workspace mapping.
- Do not tighten direct anonymous catalogue RLS until DB-backed catalogue reads
  keep working for the configured workspace without service-role keys.
- Future direct anonymous catalogue RLS hardening must include
  cross-workspace denial tests for published catalogue rows.
- Do not use browser-provided workspace IDs as catalogue authorization context.
- Do not add service-role catalogue reads, `NEXT_PUBLIC_SUPABASE_*` variables,
  or public product/category/product image mutation routes.

## Chat Persistence Privacy Rules

- Treat `conversations` and `messages` as privacy-sensitive.
- Do not add actual conversation or message persistence without separate
  approval, migrations, RLS review, and tests.
- Do not trust browser-provided session IDs as identity or authorization.
- Use `clientMessageId` only for idempotency and deduplication, not
  authentication.
- Resolve chat workspace from trusted server-side configuration or a future
  trusted host/workspace mapping, never from an anonymous browser field.
- Avoid storing unnecessary PII, provider debug payloads, raw n8n internals,
  webhook URLs, forwarding headers, or trace IDs.

## Chat Rate-Limit Identity Rules

- Do not trust user-supplied forwarding headers by default.
- Configure `CHAT_TRUSTED_CLIENT_IP_HEADER` only to a deployment header that a
  trusted proxy or CDN overwrites.
- Use `clientSessionId` for per-session limiting.
- Use a trusted client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER`
  names a proxy/CDN-overwritten header and that header is present.
- If no trusted client IP source is configured or present, use a server-side
  fallback bucket as a fail-closed public chat cap so rotating
  `clientSessionId` cannot bypass rate limits.
- Configure a trusted client IP header in deployment to avoid over-broad
  fallback throttling.

## Quote Abuse-Throttling Rules

- Public quote creation must keep bounded JSON parsing and schema validation
  before persistence.
- Apply quote abuse throttling before quote persistence writes.
- Do not trust user-supplied forwarding headers by default.
- Configure `QUOTE_TRUSTED_CLIENT_IP_HEADER` only to a deployment header that a
  trusted proxy or CDN overwrites.
- Use a trusted client IP bucket only when the configured trusted header is
  present.
- If no trusted client IP source is configured or present, use a server-side
  fallback bucket as a fail-closed public quote cap.
- Use validated normalized contact fields, such as lowercase email, only for
  additional best-effort throttling; do not treat them as identity or
  authorization.
- Return safe generic `429` responses with `retry-after`; do not expose bucket
  keys, IPs, trusted header names, Supabase errors, stack traces, or internal
  implementation details.
- In-process throttling is best-effort only. It is not a production-grade
  distributed rate limit and does not replace future CDN/WAF/platform controls.

## Furniture Listing Catalogue Direction Rules

The current SKR product direction is an admin-managed furniture/event-rental listing catalogue with customer enquiry/quote requests. Do not add ecommerce carts, checkout, payment, customer-account, stock-reservation, order-fulfilment, or online-ordering flows without separate explicit approval.

Keep existing `products`, `categories`, and `product_images` database/API/RPC/helper names as technical internals until a separately approved rename/migration strategy exists. Prefer furniture listing, catalogue listing, and listing image wording in safe visible copy.

## Product/Admin Persistence Rules

- Phase 2B-A admin/auth and workspace membership authorization design is
  guardrail documentation only; it is not approval to implement real auth,
  admin UI, product/category/product image writes, browser Supabase,
  service-role runtime paths, deployment, or Supabase Cloud connection.
- Phase 2B-B admin authorization policy code is a pure server-only policy
  boundary only; it is not approval to add Supabase Auth runtime wiring,
  login/logout routes, protected admin pages, admin UI, product writes,
  browser Supabase, service-role runtime paths, deployment, or Supabase Cloud
  connection.
- Phase 2B-C admin auth/membership resolver code is a server-only disabled
  scaffold only; it is not approval to implement real auth, add Supabase Auth
  runtime wiring, add login/logout routes, add protected admin pages, add admin
  UI, wire runtime routes/pages/server actions, add product writes, add browser
  Supabase, add service-role runtime paths, deploy, or connect Supabase Cloud.
- Phase 2B-D admin auth/membership adapter code is a server-only
  dependency-injected boundary tested with fake adapters only; it is not
  approval to implement real auth, add Supabase Auth runtime wiring, read
  cookies, read headers, add login/logout routes, add protected admin pages,
  add admin UI, wire runtime routes/pages/server actions, add product writes,
  add browser Supabase, add service-role runtime paths, deploy, or connect
  Supabase Cloud.
- Phase 2B-E admin auth provider/session/security design is documentation and
  guard coverage only; it is not approval to implement real auth, add Supabase
  Auth runtime wiring, read cookies, read headers, add login/logout routes, add
  protected admin pages, add admin UI, wire runtime routes/pages/server actions,
  add product writes, add browser Supabase, add service-role runtime paths,
  deploy, or connect Supabase Cloud.
- Phase 2B-F checklist hygiene/status reconciliation is documentation and
  guard coverage only; it is not approval to implement real auth, add Supabase
  Auth runtime wiring, read cookies, read headers, add login/logout routes, add
  protected admin pages, add admin UI, wire runtime routes/pages/server actions,
  add product/category/product image writes, add browser Supabase, add
  service-role runtime paths, deploy, connect Supabase Cloud, change n8n
  workflows, add Pinecone runtime code, migrate Pinecone, or add SaaS chatbot
  app code.
- Phase 2B-G repo agent instruction refresh is instruction and guard coverage
  only; it is not approval to implement real auth, add Supabase Auth runtime
  wiring, read cookies, read headers, add login/logout routes, add protected
  admin pages, add admin UI, wire runtime routes/pages/server actions, add
  product/category/product image writes, add browser Supabase, add
  service-role runtime paths, deploy, connect Supabase Cloud, change n8n
  workflows, add Pinecone runtime code, migrate Pinecone, or add SaaS chatbot
  app code.
- Phase 2B-H reviewed server-side admin auth/membership resolution boundary is
  fake-adapter test coverage and server-only resolver boundary hardening only;
  it is not approval to implement real auth, add Supabase Auth runtime wiring,
  read cookies, read headers, add login/logout routes, add protected admin
  pages, add admin UI, wire runtime routes/pages/server actions, add
  product/category/product image writes, add Supabase Storage, add browser
  Supabase, add service-role runtime paths, deploy, connect Supabase Cloud,
  change n8n workflows, add Pinecone runtime code, migrate Pinecone, or add
  SaaS chatbot app code.
- Phase 2B-K server-only Supabase Auth identity boundary is the only approved
  place to read Supabase Auth cookies and call Supabase Auth server APIs in
  that phase. It is not approval to wire runtime routes, pages, or server
  actions, read headers, add login/logout routes, protected admin pages, admin
  UI, product writes, Storage, browser Supabase, service-role runtime paths,
  deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, or
  SaaS chatbot app code.
- Phase 2B-L server-only admin profile/membership read boundary is the only
  approved place to read `admin_users` and `memberships` for admin
  authorization in that phase. It requires an explicitly injected authenticated
  admin-read client and fails closed without one. It is not approval to wire
  runtime routes, pages, or server actions, add live authenticated read-client
  wiring, read headers, add login/logout routes, protected admin pages, admin
  UI, product writes, Storage, browser Supabase, service-role runtime paths,
  deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, or
  SaaS chatbot app code.
- Phase 2B-M server-only admin workspace resolution boundary is the only
  approved place to resolve trusted admin workspace scope in that phase. It
  requires an explicitly injected trusted server-side workspace ID, treats
  browser/request workspace IDs as validation-only, fails closed for missing,
  empty, whitespace-only, or mismatched values, and must not use public
  catalogue workspace config as an admin authorization shortcut. It is not
  approval to wire runtime routes, pages, or server actions, read cookies,
  call Supabase Auth, read headers, call Supabase tables, add login/logout
  routes, protected admin pages, admin UI, product writes, Storage, browser
  Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n
  workflow changes, Pinecone runtime code, or SaaS chatbot app code.
- Phase 2B-N server-only session-bound admin read-client factory is approved
  only inside the existing Phase 2B-K identity boundary. It may create a
  session-bound Supabase SSR admin-read client from reviewed server-only
  Supabase env and request cookies, and it returns the Phase 2B-L read-client
  dependency shape. It is not approval to query `admin_users` or `memberships`
  outside the Phase 2B-L boundary, wire runtime routes, pages, or server
  actions, add login/logout routes, protected admin pages, admin UI, product
  writes, Storage, browser Supabase, service-role runtime paths, deployment,
  Supabase Cloud, n8n workflow changes, Pinecone runtime code, or SaaS chatbot
  app code.
- Phase 2B-O server-only admin authorization adapter-set composition boundary is approved only as a server-only composition module
  at `website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
  It may assemble the existing identity, profile, membership, and workspace
  adapter contracts when a session-bound admin read client and trusted
  server-side workspace input are available. It is not approval to use that
  adapter set from runtime routes, pages, or server actions, add login/logout
  routes, protected admin pages, admin UI, product writes, Storage, browser
  Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n
  workflow changes, Pinecone runtime code, or SaaS chatbot app code.
- Phase 2B-P server-only composed admin authorization decision boundary is approved only as a server-only decision module
  at `website/lib/admin/authorization/server-admin-authorization-decision.ts`.
  It may compose the Phase 2B-O adapter set and call
  `resolveAdminAuthorizationWithAdapters()`. It is not approval to use that
  decision boundary from runtime routes, pages, or server actions, add
  login/logout routes, protected admin pages, admin UI, product writes,
  Storage, browser Supabase, service-role runtime paths, deployment, Supabase
  Cloud, n8n workflow changes, Pinecone runtime code, or SaaS chatbot app
  code.
- Phase 2B-Q server-only admin request security preflight boundary is approved only as a server-only validator module
  at `website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
  It may validate explicitly injected request metadata and optional injected
  CSRF verifier results for future state-changing admin routes and server
  actions. It is not approval to read real headers, use that preflight
  boundary from runtime routes, pages, or server actions, add login/logout
  routes, protected admin pages, admin UI, product writes, Storage, browser
  Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n
  workflow changes, Pinecone runtime code, or SaaS chatbot app code.
- Phase 2B-R server-only CSRF proof verifier boundary is approved only as a server-only verifier module
  at `website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`.
  It may validate explicitly injected proof material and dependency-injected
  signature or replay checks for future CSRF proof validation. It is not
  approval to issue CSRF tokens, read real headers, read cookies, read env, use
  that verifier from runtime routes, pages, or server actions, add
  login/logout routes, protected admin pages, admin UI, product writes,
  Storage, browser Supabase, service-role runtime paths, deployment, Supabase
  Cloud, n8n workflow changes, Pinecone runtime code, or SaaS chatbot app
  code.
- Phase 2B-S server-only CSRF proof issuer boundary is approved only as a server-only issuer module
  at `website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`.
  It may issue verifier-compatible structured CSRF proofs only from explicitly
  injected operation, session binding, nonce or nonce generator, timestamps,
  and a dependency-injected signer. It is not approval to verify proofs, read
  real headers, read cookies, read env, call Supabase, store replay state, use
  that issuer from runtime routes, pages, or server actions, add login/logout
  routes, protected admin pages, admin UI, product writes, Storage, browser
  Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n
  workflow changes, Pinecone runtime code, or SaaS chatbot app code.
- Phase 2B-T server-only admin authorization gate composition boundary is approved only as a server-only gate module
  at `website/lib/admin/authorization/server-admin-authorization-gate.ts`.
  It may run the Phase 2B-Q request security preflight, inject the Phase 2B-R
  CSRF proof verifier into preflight when verifier dependencies are supplied,
  and call the Phase 2B-P composed admin authorization decision only after
  preflight passes. It is not approval to issue CSRF proofs, read real
  headers, read cookies, read env, call Supabase, query `admin_users` or
  `memberships`, create a session-bound admin read client directly, compose
  adapter sets directly, use that gate from runtime routes, pages, or server
  actions, add login/logout routes, protected admin pages, admin UI, product
  writes, Storage, browser Supabase, service-role runtime paths, deployment,
  Supabase Cloud, n8n workflow changes, Pinecone runtime code, or SaaS
  chatbot app code.
- Phase 2B-U admin runtime wiring approval lane is docs/checklist approval only.
  It approves only a future first-party server-only route handler or server
  action lane for calling `resolveServerAdminAuthorizationGate()` after a
  reviewed request metadata adapter exists. Real request headers may be read
  only inside that future reviewed server-only metadata adapter. Phase 2B-U
  does not add that adapter, runtime routes, pages, server actions, header
  reads, login/logout routes, protected admin pages, admin UI, product writes,
  Storage, browser Supabase, service-role runtime paths, deployment, Supabase
  Cloud, real env values, n8n workflow changes, Pinecone runtime code, or
  `website/chat-config.js` access.
- Phase 2B-V server-only admin request metadata adapter boundary is approved only as a server-only request metadata reader
  at `website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.
  It is the only newly approved production module in this phase that may
  import `next/headers` and call `headers()`. It may read minimal untrusted
  request metadata for future gate injection and requires trusted expected
  Origin and expected Host through explicit dependency/config injection. It is
  not approval to call the gate from runtime routes, pages, or server actions,
  read cookies, read env, call Supabase, query `admin_users` or `memberships`,
  issue or verify CSRF proofs, add login/logout routes, protected admin pages,
  admin UI, product writes, Storage, browser Supabase, service-role runtime
  paths, deployment, Supabase Cloud, real env values, n8n workflow changes,
  Pinecone runtime code, or `website/chat-config.js` access.
- Phase 2B-W server-only admin runtime gate invocation boundary is approved only as server-only invocation plumbing
  at `website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.
  It may compose only the Phase 2B-V request metadata adapter and the Phase
  2B-T admin authorization gate. It must not import `next/headers`, call
  `headers()`, read cookies, read env, call Supabase, query `admin_users` or
  `memberships`, resolve workspaces directly, compose adapter sets directly,
  call request-security preflight or decision boundaries directly, issue or
  verify CSRF proofs directly, use that helper from runtime routes, pages, or
  server actions, add login/logout routes, protected admin pages, admin UI,
  product writes, Storage, browser Supabase, service-role runtime paths,
  deployment, Supabase Cloud, real env values, n8n workflow changes, Pinecone
  runtime code, or `website/chat-config.js` access.
- Future admin auth must remain server-side. Future session cookies must be
  HttpOnly, Secure in production, and have reviewed SameSite behaviour. Future
  state-changing admin routes/server actions need CSRF strategy before
  implementation.
- Furniture listing, category, and listing image metadata writes are trusted-admin operations
  only.
- Do not add browser-side Supabase writes for furniture listing management.
- Do not add anonymous category, product, or product image write policies.
- Do not add public furniture listing mutation routes.
- Do not add service-role product write paths without separate approval.
- Resolve furniture listing management workspace access from trusted server-side auth and
  membership context, not browser input.
- Require trusted admin membership context to be owned by the active
  server-resolved admin profile before using its role.
- Do not accept browser-provided workspace IDs as trusted admin write scope.
- Future admin writes must resolve workspace access server-side from
  authenticated identity plus active membership and role checks.
- Future furniture listing writes must have audit expectations and RLS tests before they
  are enabled.
- Keep public catalogue reads read-only, published-only, and scoped by trusted
  server-side workspace configuration.
- Keep binary listing image/media persistence deferred until Supabase Storage
  strategy, upload flows, path validation, and lifecycle rules are approved.
- Phase 2B-AY may expose listing image bucket/path metadata only to
  authorised admins inside the protected admin shell. It must not add binary
  image upload, file inputs, multipart form handling, Supabase Storage calls,
  public image upload routes, public image management routes, browser
  Supabase, or service-role runtime paths.
- Treat Git-tracked prepared images as demo/public-shell assets, not the
  long-term media store.

## Worktree Hygiene

The repo was already dirty during planning. Do not mix unrelated dirty worktree
changes into website architecture PRs.

Before implementation, start from a clean branch or explicitly separate
unrelated local changes.

## Documentation Rule

Docs must be updated when architecture, scope, safety rules, or phase boundaries
change. Update the roadmap, relevant checklist, ADR or decision log, and safety
docs in the same PR when applicable.

Every phase PR that changes status must update exactly the relevant
checklist(s). Do not mark planned, scaffolded, design, or policy work as
runtime complete until runtime code exists and tests prove it.

## Phase 2B-X Admin Runtime Gate Invocation Usage Approval Lane

Phase 2B-X admin runtime gate invocation usage approval lane is docs/checklist/static-guard approval only. It approves only the future lane where a first-party server-only route handler or server action may call `resolveServerAdminRuntimeGateInvocation()` after separate implementation approval.

Future usage must call only the Phase 2B-W helper from the route/action boundary. Header reads must remain inside Phase 2B-V, cookie reads and Supabase Auth inside Phase 2B-K/N, admin table reads inside Phase 2B-L, workspace resolution inside Phase 2B-M, adapter composition inside Phase 2B-O, decision logic inside Phase 2B-P, preflight inside Phase 2B-Q / Phase 2B-T, CSRF verification inside Phase 2B-R / Phase 2B-T, and CSRF issuance inside Phase 2B-S.

This approval lane does not add runtime route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app code, or `website/chat-config.js` access.

## Phase 2B-Y Server-only Admin Runtime Route Gate Adapter Boundary

Phase 2B-Y server-only admin runtime route gate adapter boundary is approved only as server-only route/action adapter plumbing at `website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`.

It may call only the Phase 2B-W `resolveServerAdminRuntimeGateInvocation()` helper for authorization. It must not read request headers directly, read cookies, read env, call lower-level auth/security boundaries directly, add route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app code, or `website/chat-config.js` access.
## Phase 2B-Z Admin Runtime Route Gate Adapter Usage Approval Lane

Phase 2B-Z admin runtime route gate adapter usage approval lane is docs/checklist/static-guard approval only.

It approves only a future first-party server-only route handler or server action lane for calling `resolveServerAdminRuntimeRouteGateAdapter()` through the Phase 2B-Y route gate adapter. Future route/action code must not duplicate lower-level boundary logic: header reads stay inside Phase 2B-V; cookie reads and Supabase Auth calls stay inside Phase 2B-K/N; `admin_users` and `memberships` reads stay inside Phase 2B-L; workspace resolution stays inside Phase 2B-M; adapter-set composition stays inside Phase 2B-O; decision logic stays inside Phase 2B-P; request-security preflight stays inside Phase 2B-Q / Phase 2B-T; CSRF verification stays inside Phase 2B-R / Phase 2B-T; CSRF issuance stays inside Phase 2B-S; runtime gate invocation stays inside Phase 2B-W; and route gate adapter plumbing stays inside Phase 2B-Y.

Phase 2B-Z does not add route handlers, pages, server actions, runtime route gate adapter usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## Phase 2B-AA First Admin Runtime Route Gate Adapter Usage Boundary

Phase 2B-AA first admin runtime route gate adapter usage boundary is approved only as exactly one harmless GET authorization probe/check route handler at `website/app/api/admin/auth-check/route.ts`.

It may call only the Phase 2B-Y route gate adapter using the harmless read-only `admin.auth.check` operation. It must not read request headers directly, read cookies directly, or call lower-level auth/security boundaries directly. It reads only `ADMIN_EXPECTED_ORIGIN` and `ADMIN_EXPECTED_HOST` from env to supply expected request metadata. It is not approval to add other route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app code, or `website/chat-config.js` access.

## Phase 2B-AB Admin CSRF Proof Issuer Runtime Usage Approval Lane

Phase 2B-AB admin CSRF proof issuer runtime usage approval lane is docs/checklist/static-guard approval only. It approves only a future first-party server-only lane for issuing CSRF proof material needed by later state-changing admin operations. The future route must remain server-only and must not bypass the Phase 2B-Y/AA route-gate authorization path. The future route must not call lower-level auth/security boundaries directly except the approved Phase 2B-S CSRF issuer boundary and the Phase 2B-AI session/workspace binding boundary. The future route must not expose CSRF secrets, verifier internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, workspace internals, membership internals, or stack traces.

Phase 2B-AB does not add routes, pages, server actions, runtime CSRF proof issuer usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## Phase 2B-AC Admin Auth-Check Trusted Workspace Dependency Repair

Phase 2B-AC admin auth-check trusted workspace dependency repair remains fail-closed and does not add product writes, admin UI, routes, pages, server actions, login/logout routes, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access. It relies on the environment via `process.env.ADMIN_TRUSTED_WORKSPACE_ID` instead of anonymous inputs.

## Phase 2B-AD Admin CSRF Proof Issuer Route Operation Approval Boundary

Phase 2B-AD admin CSRF proof issuer route operation approval boundary is docs/checklist/static-guard approval only. It documents that a future first-party server-only CSRF proof issuer route needs a dedicated route-gate operation model (likely `admin.csrf.issue`). The future route must not route-gate itself as a state-changing operation (like `product.write`), as that requires a pre-existing CSRF proof, creating a chicken-and-egg dependency. It must also not loosely use `admin.auth.check` as a substitute.

Phase 2B-AD does not implement the actual route, nor does it add product writes, admin UI, pages, server actions, login/logout routes, protected admin pages, Storage, deployment config, Supabase Cloud connection, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.
Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary. It does not implement the actual CSRF proof issuer route. It does not issue CSRF proofs from runtime. A future runtime route must still validate the requested proof target operation before issuing a proof.

## Phase 2B-AI Admin CSRF Proof Issuer Session/Workspace Binding Boundary

Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary at `website/lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding.ts`.

The boundary may derive an opaque proof binding only after existing Phase 2B server-only adapters resolve an authenticated admin session, active admin profile, active owner/admin membership, and trusted server-resolved workspace for a state-changing proof target operation. The actual binding value must come from an explicitly injected deriver and must fail closed when the deriver is missing or returns a blank value.

Phase 2B-AI does not add the actual CSRF proof issuer route, runtime route/page/server-action usage, product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## Phase 2B-AJ Admin CSRF Proof Session/Workspace Binding Runtime Dependency Boundary

Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary at `website/lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies.ts`.

The dependency derives an opaque binding from canonical requested operation, auth user ID, admin user ID, trusted workspace ID, and membership role inputs. It reuses the existing server-only `ADMIN_CSRF_PROOF_SECRET` with Node crypto, never records a real secret value, fails closed for missing or blank secrets, malformed inputs, and crypto failures, and is exposed only through the existing runtime dependency factory for injection into the Phase 2B-AI boundary.

Phase 2B-AJ does not add the actual CSRF proof issuer route, runtime route/page/server-action usage, product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## Phase 2B-AK Admin CSRF Proof Issuer Route Implementation

Phase 2B-AK adds only the first-party server-only admin CSRF proof issuer route at `website/app/api/admin/csrf-proof/route.ts`.

The route accepts only `POST /api/admin/csrf-proof`, validates a safe JSON body containing a supported target state-changing admin operation, rejects non-state-changing operations including `catalogue.read`, `admin.auth.check`, and `admin.csrf.issue`, and gates the route itself through the approved `admin.csrf.issue` route-gate lane without requiring an existing CSRF proof.

The route may read only `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, and `ADMIN_TRUSTED_WORKSPACE_ID` to supply existing approved runtime dependencies. It may use the Phase 2B-AI session/workspace binding boundary, Phase 2B-AJ runtime dependencies, and Phase 2B-S CSRF proof issuer. It must not expose raw headers, cookies, tokens, secrets, SQL/provider errors, workspace internals, membership internals, signer internals, verifier internals, or stack traces.

Phase 2B-AK does not add product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, a replay store, or `website/chat-config.js` access.

## Phase 2B-AL Admin Product Persistence And Protected Write API Routes

Phase 2B-AL adds only backend first-party admin product-management write routes and session-bound product persistence.

The protected route boundary may create, update, publish, or archive category/product/product-image metadata through `website/app/api/admin/**` route handlers only. Every route must use the approved admin route-gate stack, a matching CSRF proof for `category.write`, `product.write`, or `productImage.write`, `ADMIN_TRUSTED_WORKSPACE_ID`, safe JSON validation, and no-store JSON responses. Product image writes are metadata-only.

The persistence boundary may use only a session-bound authenticated Supabase client, owner/admin RLS policies, workspace filters, and product-management audit inserts. It must not use service-role keys, browser Supabase, public mutation routes, hard deletes, binary uploads, Supabase Storage, production seed data, raw SQL errors in responses, or workspace/admin/membership internals in route responses.

Phase 2B-AL does not add admin UI, login/logout routes, protected admin pages, server actions, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## Phase 2B-AM Admin Product Write Audit Atomicity Boundary

Phase 2B-AM resolves the atomicity limitation from Phase 2B-AL by migrating product metadata mutations and audit insertions into a single Postgres RPC transaction block (`execute_admin_product_write`), and enforcing POST-only routing for all state changes.

The Postgres RPC must use explicit static SQL branches per action to remain type-aware and prevent dynamic SQL injection. It must securely resolve the actor ID via `current_product_admin_user_id()`.

Phase 2B-AM does not add admin UI, login/logout routes, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## Phase 2B-AN Admin Auth Login Logout And Protected Shell

Phase 2B-AN adds only a minimal first-party admin login page, server-owned
login/logout routes, and a protected admin shell.

Login/logout must use the existing server-only Supabase Auth/session boundary.
Cookie reads, cookie writes, and Supabase Auth session calls must stay inside
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`.
Route responses must be no-store and must expose only generic
unauthenticated or unavailable states.

Login must read only bounded `application/x-www-form-urlencoded` bodies before
session mutation. Login and logout must validate same-origin `Origin` and
`Host` against `ADMIN_EXPECTED_ORIGIN` and `ADMIN_EXPECTED_HOST` before
session mutation. A full login/logout CSRF token boundary is deferred because
the existing CSRF proof issuer is session/workspace-bound and intended for
authenticated admin operations after an admin session exists.

The protected shell must use the existing server-only route-gate path with the
read-only `admin.shell.access` operation. It may render only safe
unauthenticated, authenticated-but-not-authorised, authorised-admin, and
unavailable/misconfigured states. It must not expose provider errors, SQL,
stack traces, cookie values, tokens, workspace internals, membership internals,
or secrets.

Phase 2B-AN does not add product-management UI, product/category/product-image
write forms, server actions, binary uploads, Supabase Storage, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud,
n8n changes, Pinecone runtime code, SaaS chatbot work, or
`website/chat-config.js` access.

## Phase 2B-AO Admin Read-only Product Dashboard Boundary

Phase 2B-AO adds only a read-only admin product dashboard inside the protected admin shell.

The dashboard must stay under the existing server-only `admin.shell.access`
gate and must render catalogue management data only after owner/admin access
is allowed. It may use only a session-bound authenticated admin read client,
trusted `ADMIN_TRUSTED_WORKSPACE_ID`, RLS, and select-only reads of
`categories`, `products`, and `product_images`.

The Phase 2B-AO read-only dashboard summary must not expose SQL/provider
errors, stack traces, cookies, tokens, env values, workspace internals,
membership internals, service-role details, or secrets. Phase 2B-AY is the
separate approved metadata-only admin UI boundary for authorised admins to
view and edit listing image bucket/path metadata. Missing env, unavailable
dependencies, provider errors, and malformed rows must fail into a generic
unavailable state.

Phase 2B-AO does not add product/category/product-image write forms,
create/edit/archive/publish/delete controls, server actions, binary uploads,
Supabase Storage, browser Supabase, service-role runtime paths, deployment
config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS
chatbot work, or `website/chat-config.js` access.

## Phase 2B-AP Admin Category Management UI Boundary

Phase 2B-AP adds only category create, update, and archive controls inside the protected admin shell.

The category UI may run as a small browser component only after the server-rendered protected shell resolves authorised owner/admin access and loaded dashboard data. Browser code may call only first-party admin HTTP APIs: `POST /api/admin/csrf-proof` for `category.write`, `POST /api/admin/categories`, `POST /api/admin/categories/[categoryId]`, and `POST /api/admin/categories/[categoryId]/archive`. Category write requests must include `x-csrf-proof` and must keep route responses safe and generic.

Phase 2B-AP does not add product create/edit/archive/publish UI, product image write UI, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## Phase 2C-A Listing Media Storage Boundary

Phase 2C-A approves only admin-controlled listing media upload and public
image rendering for the furniture/event-rental catalogue. The approved upload
surface is the server-only multipart branch of
`POST /api/admin/product-images`, reachable from the protected admin shell
only after owner/admin access. It must require `productImage.write`, same-origin
Origin/Host validation, a valid CSRF proof, trusted workspace resolution, and
a session-bound authenticated Supabase client. It may store only approved
JPEG, PNG, WebP, or AVIF files in the `listing-media` bucket under
server-generated workspace/listing paths. Because `listing-media` is a public
bucket, object serving is public to anyone with the unguessable URL; RLS must
not be described as the public URL serving gate.

Public catalogue and listing detail pages may render derived public image URLs
for active listing image metadata and must keep fallback imagery when images
are missing or unavailable. Public catalogue rendering remains read-only and
metadata-gated.

Phase 2C-A does not approve customer image uploads, arbitrary public upload
routes, SVG upload, client-controlled storage path writes, browser Supabase,
service-role runtime paths, DB/API/table/RPC/RLS renames, notifications, CRM
integration, quote status public tracking, n8n/Pinecone runtime behavior, SaaS
chatbot runtime work, ecommerce flows, or `website/chat-config.js` access.

## Phase 2C-B Public Catalogue Polish Boundary

Phase 2C-B approves only public read-only catalogue/detail polish and quote
enquiry handoff. Public pages may improve uploaded listing image presentation,
fallback image behavior, listing/category/rental-unit hierarchy,
enquiry-oriented CTA copy, and safe metadata derived from public listing data.
Public CTA links may pass an optional listing slug to the existing quote page,
but the quote page must resolve that slug through the public catalogue read
surface before displaying context or pre-filling the existing quote items text
area.

Phase 2C-B does not approve carts, checkout, payments, customer accounts, stock
reservation, order fulfilment, confirmed booking, online ordering, customer
uploads, arbitrary public upload routes, public quote status tracking,
notifications, CRM integration, browser Supabase, service-role runtime paths,
DB/API/table/RPC/RLS renames, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, or `website/chat-config.js` access.
