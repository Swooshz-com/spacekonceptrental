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
- Phase 2E-B approves only local conversation/message schema and RLS
  foundation work. Do not add runtime transcript writes or reads without
  separate approval, a reviewed server-side access path, RLS review, and tests.
- Phase 2E-C approves only the server-only TypeScript persistence contract,
  validation/minimisation helpers, safe command shaping, and fake/injected
  adapter tests. It is not runtime transcript write approval.
- Phase 2E-D approves only the local server-only SQL/RPC contract and injected
  TypeScript RPC adapter boundary. It is not runtime transcript write approval.
- Phase 2E-D hotfixes only RPC idempotency conflict rejection and malformed
  runtime validation. It is not runtime transcript write approval.
- Phase 2E-E approves only transcript persistence activation governance and
  executor approval gates. It is not live executor, service-role runtime,
  `/api/chat` transcript write, transcript read, or admin transcript UI
  approval.
- Phase 2E-F approves only transcript lifecycle governance and
  retention/deletion/export readiness. It is not runtime transcript writes,
  runtime transcript reads, live executor, service-role runtime,
  `/api/chat` transcript write wiring, Transcript deletion/export runtime
  paths, Retention cleanup jobs, or Admin transcript UI approval.
- Phase 2E-G approves only transcript audit/evidence model and operator runbook readiness.
  It is not audit/evidence storage approval, not an audit/evidence runtime
  writer approval, not production evidence approval, not operator execution
  approval, not runtime transcript write/read approval, not deletion/export
  runtime approval, not retention cleanup job approval, not `/api/chat`
  persistence wiring approval, and not Admin transcript UI approval.
- Phase 2E-H approves only local transcript audit/evidence schema, RLS, and
  server-only contract foundation. It is not `/api/chat` wiring approval, not
  runtime transcript write/read approval, not audit/evidence runtime writer
  approval, not deletion/export runtime approval, not retention cleanup job
  approval, not live Supabase RPC executor approval, not service-role runtime
  approval, not browser Supabase approval, not Admin transcript UI approval,
  and not production evidence approval.
- Future lifecycle work must define these before runtime implementation:
  Transcript retention policy; Retention expiry handling; Manual deletion
  requests; Export requests; Admin-only transcript access review;
  Audit/evidence requirements; Operator runbook requirements;
  Failure/rollback/disable controls; Data minimisation and redaction
  requirements; Customer identity/account linking risks; Public quote
  tracking/public transcript access risks.
- Future audit/evidence work must define these before runtime implementation:
  event type ownership; safe audit field categories; forbidden evidence
  material; owner approval capture; dry-run/local proof; local SQL/RLS proof;
  static guard proof; rollback/disable controls; evidence template completion;
  failure triage; audit review; data minimisation review; redaction review;
  post-action verification; and "Do not proceed" stop conditions.
- Future audit/evidence rows, templates, or artifacts must not include Full
  transcript content, Raw provider payloads, n8n workflow payloads, Webhook
  URLs, Raw headers, Cookies, Tokens, API keys, Private keys, Secrets,
  Service-role material, or Customer-visible internal notes.
- Current Phase 2E-H audit/evidence tables are local-only, RLS-enabled,
  ungranted to browser roles, and policy-free. Future admin or operator access
  requires a separately approved server-only runtime boundary.
- Do not trust browser-provided session IDs as identity or authorization.
- Use `clientMessageId` only for idempotency and deduplication, not
  authentication.
- Resolve chat workspace from trusted server-side configuration or a future
  trusted host/workspace mapping, never from an anonymous browser field.
- Avoid storing unnecessary PII, provider debug payloads, raw n8n internals,
  webhook URLs, forwarding headers, or trace IDs.
- Phase 2E-A is governance planning and static guard coverage only.
- Phase 2E-B adds the local schema/RLS foundation for `conversations` and
  `messages` while direct anonymous/public and authenticated client reads and
  writes remain denied.
- Phase 2E-C adds only an injected-adapter contract boundary; the default
  persistence path remains unavailable and `/api/chat` remains unwired.
- Phase 2E-D adds only an ungranted local RPC contract and injected adapter
  boundary; the default persistence path remains unavailable and `/api/chat`
  remains unwired.
- Phase 2E-E documents approval gates only. Explicit owner approval is required
  before any of these: Live Supabase RPC executor; Any service-role or
  privileged DB execution strategy; `/api/chat` transcript write wiring;
  Transcript read paths; Admin transcript UI; Transcript deletion/export paths;
  Retention cleanup jobs; Customer identity/account linking; Public quote
  tracking or public transcript access; Notifications or CRM integration.
- Phase 2E-F documents lifecycle governance only. Explicit owner approval is
  required before any of these: Runtime transcript writes; Runtime transcript
  reads; Live Supabase RPC executor; Any service-role or privileged DB
  execution strategy; `/api/chat` transcript write wiring; Transcript
  deletion/export runtime paths; Retention cleanup jobs; Admin transcript UI;
  Customer accounts; Public quote tracking or public transcript access;
  Notifications; CRM integration; n8n/Pinecone runtime changes; SaaS chatbot
  runtime work; Deployment, Vercel config, Supabase Cloud config, env/secrets,
  production evidence.
- Phase 2E-G documents audit/evidence model and operator runbook readiness
  only. Explicit owner approval is required before any of these:
  Audit/evidence runtime writer; Audit/evidence storage or tables; Production
  evidence file or artifact; Runtime transcript writes; Runtime transcript
  reads; Live Supabase RPC executor; Any service-role or privileged DB
  execution strategy; `/api/chat` transcript write wiring; Transcript
  deletion/export runtime paths; Retention cleanup jobs; Admin transcript UI;
  Customer accounts; Public quote tracking or public transcript access;
  Notifications; CRM integration; n8n/Pinecone runtime changes; SaaS chatbot
  runtime work; Deployment, Vercel config, Supabase Cloud config, env/secrets,
  production evidence.
- Phase 2E-H adds only local audit/evidence schema/RLS plus a server-only
  disabled contract. Explicit owner approval is still required before any of
  these: Audit/evidence runtime writer; runtime audit/evidence storage path;
  Production evidence file or artifact; Runtime transcript writes; Runtime
  transcript reads; Live Supabase RPC executor; Any service-role or privileged
  DB execution strategy; `/api/chat` transcript write wiring; Transcript
  deletion/export runtime paths; Retention cleanup jobs; Admin transcript UI;
  Customer accounts; Public quote tracking or public transcript access;
  Notifications; CRM integration; n8n/Pinecone runtime changes; SaaS chatbot
  runtime work; Deployment, Vercel config, Supabase Cloud config, env/secrets,
  production evidence.
- Any future live transcript executor must have a reviewed privilege model,
  avoid browser/client exposure of service-role material, redact failures, prove
  idempotency, define audit/evidence requirements, and include rollback/disable
  controls before `/api/chat` can use it.
- Runtime transcript writes remain blocked.
- Runtime transcript reads remain blocked.
- Audit/evidence runtime writers remain blocked.
- Production evidence files remain blocked.
- Admin transcript UI remains blocked.
- Customer accounts remain blocked.
- Public quote tracking remains blocked.
- Notifications remain blocked.
- CRM integration remains blocked.
- n8n/Pinecone runtime changes remain blocked.
- SaaS chatbot runtime work remains blocked.
- Deployment remains blocked.
- Browser Supabase remains forbidden.
- Service-role runtime paths remain forbidden.
- `website/chat-config.js` access remains forbidden.
- Deletion/export workflows, transcript access rules, admin visibility
  implementation, and retention cleanup jobs remain future reviewed work.

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

## Phase 2C-C Admin Quote Operations Boundary

Phase 2C-C approves only internal admin quote/enquiry follow-up inside the
protected admin shell. Authorised owner/admin users may update an existing
quote request status and save bounded internal notes through the first-party
`POST /api/admin/quote-requests/[quoteRequestId]/status` route. The route must
require the existing `quote.write` operation, same-origin Origin/Host
validation, a valid CSRF proof, trusted workspace resolution, and a
session-bound authenticated Supabase client. Writes may update only
`quote_requests.status`/`updated_at` and insert admin-only
`quote_request_activity` rows scoped to the trusted workspace.

The admin quote read boundary may return recent internal activity only to the
protected admin shell after owner/admin access. Public quote pages and public
quote APIs must not expose quote workflow status, internal notes, admin user
IDs, workspace internals, provider errors, SQL, stack traces, service-role
details, tokens, or secrets.

Phase 2C-C does not approve public quote status tracking, customer-visible
internal notes, notifications, CRM integration, carts, checkout, payments,
customer accounts, stock reservation, order fulfilment, confirmed booking,
online ordering, customer uploads, arbitrary public upload routes, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud
actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, or
`website/chat-config.js` access.

## Phase 2C-D Quote Workflow Atomicity Boundary

Phase 2C-D approves only atomic hardening of the existing internal admin quote
workflow write path. The protected admin route may continue to accept only a
required quote status and optional bounded internal note after `quote.write`,
same-origin, CSRF, and trusted-workspace checks. The persistence layer must
call only the `execute_admin_quote_workflow` RPC through a session-bound
authenticated Supabase client.

The RPC must validate the authenticated owner/admin actor for the target
workspace, lock the target quote request, update only
`quote_requests.status`/`updated_at`, insert status-change activity only when
the status changes, insert internal-note activity only for non-blank bounded
notes, and return only a narrow success result. The status update and activity
inserts must succeed or fail together. Direct authenticated table grants for
quote status updates and quote activity inserts must remain revoked or
narrowed so the RPC is the write boundary.

Phase 2C-D does not approve public quote status tracking, customer-visible
internal notes, notifications, CRM integration, carts, checkout, payments,
customer accounts, stock reservation, order fulfilment, confirmed booking,
online ordering, customer uploads, arbitrary public upload routes, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud
actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, or
`website/chat-config.js` access.

## Phase 2D-A Deployment Readiness Boundary

Phase 2D-A is deployment readiness documentation and static guard coverage only.
It may update readiness docs, the environment contract, smoke-test checklist,
rollback/disable plan, evidence template, phase status, roadmap, decision log,
and checklist wording.

Phase 2D-A does not approve or perform deployment. It must not add Vercel
project config, Supabase Cloud config, production env files, real secrets,
production seed data, runtime env behaviour changes, browser Supabase,
service-role runtime paths, customer uploads, arbitrary public upload routes,
public quote status tracking, customer-visible internal notes, notifications,
CRM integration, n8n/Pinecone runtime changes, SaaS chatbot runtime work,
`website/chat-config.js` access, or ecommerce flows such as carts, checkout,
payments, customer accounts, stock reservation, order fulfilment, confirmed
booking, or online ordering.

Future operators must review `CATALOGUE_WORKSPACE_ID`, `QUOTE_WORKSPACE_ID`,
and `ADMIN_TRUSTED_WORKSPACE_ID` before public traffic. The `listing-media`
bucket remains public-by-unguessable-server-generated-URL for object serving,
while public catalogue rendering remains metadata-gated. n8n webhook values
must remain server-only behind first-party `POST /api/chat`.

## Phase 2D-B Post-readiness Reconciliation Boundary

Phase 2D-B is documentation, checklist, evidence-template, and static guard
coverage only. It may reconcile `docs/PHASE-STATUS.md`,
`docs/PHASE-ROADMAP.md`, checklist status, deployment evidence expectations,
decision-log entries, and static guard tests after PR #97 merged Phase 2D-A.

Phase 2D-B may distinguish the completed Phase 2C-A admin-controlled
`listing-media` upload boundary from still-blocked customer uploads, arbitrary
public upload routes, and storage usage outside the approved listing media
workflow. It must not describe admin-controlled listing media upload as still
entirely future or blocked.

Phase 2D-B does not approve or perform deployment. It must not add Vercel
project config, Supabase Cloud config, production env files, real secrets,
production seed data, runtime env behaviour changes, browser Supabase,
service-role runtime paths, customer uploads, arbitrary public upload routes,
public quote status tracking, customer-visible internal notes, notifications,
CRM integration, n8n/Pinecone runtime changes, SaaS chatbot runtime work,
`website/chat-config.js` access, or ecommerce flows such as carts, checkout,
payments, customer accounts, stock reservation, order fulfilment, confirmed
booking, or online ordering.

## Phase 2E-A Conversation Privacy And Retention Governance Boundary

Phase 2E-A is documentation, checklist, and static guard coverage only. It may
document conversation privacy, PII minimisation, anonymous visitor identity,
future authenticated/admin-linked identity considerations, retention,
deletion/export, transcript access, admin visibility, persistence idempotency,
and redaction guidance.

Phase 2E-A does not approve or implement runtime transcript storage.
Conversation/message persistence is not implemented, transcript storage is not
implemented, admin transcript UI is not implemented, customer accounts are not
approved, public quote tracking is not approved, notifications are not
approved, CRM integration is not approved, n8n/Pinecone runtime changes are
not approved, SaaS chatbot runtime work is not approved, deployment is not
approved, browser Supabase remains forbidden, service-role runtime paths remain
forbidden, and `website/chat-config.js` access remains forbidden.

## Phase 2E-B Conversation Message Schema And RLS Foundation Boundary

Phase 2E-B approves only local Supabase schema and RLS foundation work for the
existing `conversations` and `messages` tables. It may add bounded metadata,
retention, deletion marker, ordering, message-type, content-size, and
metadata-safety constraints. It may also change direct conversation/message
RLS to fail closed for anonymous/public and authenticated client roles.

Phase 2E-B does not approve runtime transcript writes, runtime transcript
reads, admin transcript UI, public transcript access, customer accounts,
public quote tracking, notifications, CRM integration, n8n/Pinecone runtime
changes, SaaS chatbot runtime work, deployment, Supabase Cloud actions,
browser Supabase, service-role runtime paths, ecommerce flows, or
`website/chat-config.js` access.

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Admin transcript UI remains blocked. Customer accounts remain
blocked. Public quote tracking remains blocked. Notifications remain blocked.
CRM integration remains blocked. Deployment remains blocked.

## Phase 2E-F Transcript Lifecycle Governance Boundary

Phase 2E-F is documentation, checklist, and static guard coverage only. It may
document transcript lifecycle governance and retention/deletion/export
readiness for future approved work.

Phase 2E-F may document future requirements for Transcript retention policy,
Retention expiry handling, Manual deletion requests, Export requests,
Admin-only transcript access review, Audit/evidence requirements, Operator
runbook requirements, Failure/rollback/disable controls, Data minimisation and
redaction requirements, Customer identity/account linking risks, and Public
quote tracking/public transcript access risks.

Phase 2E-F does not approve runtime transcript writes, Runtime transcript
reads, Live Supabase RPC executor, Any service-role or privileged DB execution
strategy, `/api/chat` transcript write wiring, Transcript deletion/export
runtime paths, Retention cleanup jobs, Admin transcript UI, Customer accounts,
Public quote tracking or public transcript access, Notifications, CRM
integration, n8n/Pinecone runtime changes, SaaS chatbot runtime work, browser
Supabase, service-role runtime paths, `website/chat-config.js` access, or
Deployment, Vercel config, Supabase Cloud config, env/secrets, production
evidence.
