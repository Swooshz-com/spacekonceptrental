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
- Product, category, and product image writes are trusted-admin operations
  only.
- Do not add browser-side Supabase writes for product management.
- Do not add anonymous category, product, or product image write policies.
- Do not add public product-management mutation routes.
- Do not add service-role product write paths without separate approval.
- Resolve product-management workspace access from trusted server-side auth and
  membership context, not browser input.
- Require trusted admin membership context to be owned by the active
  server-resolved admin profile before using its role.
- Do not accept browser-provided workspace IDs as trusted admin write scope.
- Future admin writes must resolve workspace access server-side from
  authenticated identity plus active membership and role checks.
- Future product writes must have audit expectations and RLS tests before they
  are enabled.
- Keep public catalogue reads read-only, published-only, and scoped by trusted
  server-side workspace configuration.
- Keep product image/media persistence deferred until Supabase Storage strategy,
  upload flows, path validation, and lifecycle rules are approved.
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