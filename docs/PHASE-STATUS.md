# Phase Status

This is the quick status page for the SKR repo. Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers.

## Current phase

Current phase: Phase 2D-A - deployment readiness, environment contract, and smoke-test runbook.

This phase updates deployment readiness documentation, the environment
contract, operator smoke-test runbook, rollback/disable plan, evidence
template, and static guard coverage for the current SKR app after
storage-backed listing media, public catalogue/detail handoff, protected admin
listing management, and atomic admin quote workflow hardening. No deployment is approved by this phase. It does not add Vercel project config, Supabase
Cloud config, production env files, real secrets, production seed data,
runtime env behaviour changes, browser Supabase, service-role runtime paths,
customer uploads, public upload routes, public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-D - quote workflow atomicity and admin operations hardening.

Last merged phase PR: #96

Merge commit: `3147c1206e763412e9edc6e8b792cc87b80e523b`

## Previous merged status snapshot: Phase 2C-D

Current phase: Phase 2C-D - quote workflow atomicity and admin operations hardening.

This phase hardens the internal admin quote workflow write path. The protected
admin status/note route still uses the existing `quote.write` route gate,
same-origin checks, CSRF proof, trusted workspace resolution, and a
session-bound authenticated Supabase client, but persistence now calls a single
`execute_admin_quote_workflow` RPC. The database function validates the
authenticated owner/admin workspace actor, locks the target quote request,
updates only `quote_requests.status` and `quote_requests.updated_at`, and
inserts status-change and internal-note activity in one transaction. Status and
activity now succeed or fail together. Direct authenticated table update/insert
grants for quote workflow writes are revoked, while admin activity reads remain
RLS-scoped. This phase does not add public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, customer uploads, arbitrary public upload
routes, browser Supabase, service-role runtime paths, deployment config,
Supabase Cloud actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-C - admin quote operations and enquiry workflow closeout.

Last merged phase PR: #95

Merge commit: `ab59adb8bf3c328b71ed91cc7a8141df9a43948e`

## Previous merged status snapshot: Phase 2C-C

Current phase: Phase 2C-C - admin quote operations and enquiry workflow closeout.

This phase improves internal quote/enquiry follow-up for authorised admins.
The protected admin quote inbox can now save internal follow-up notes alongside
status changes, and the server-only quote read boundary returns recent
admin-only quote activity scoped to the trusted workspace. Persistence uses a
session-bound authenticated Supabase client, owner/admin RLS policies, CSRF
proofs for `quote.write`, generic route responses, and a new admin-only
`quote_request_activity` table. Internal activity is never shown on public
quote pages. This phase does not add public quote status tracking,
customer-visible internal notes, notifications, CRM integration, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
confirmed booking, online ordering, customer uploads, arbitrary public upload
routes, browser Supabase, service-role runtime paths, deployment config,
Supabase Cloud actions, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-B - public catalogue polish and enquiry handoff.

Last merged phase PR: #94

Merge commit: `33067c3b3dd86847885db7c57c81c8e17962b043`

## Previous merged status snapshot: Phase 2C-B

Current phase: Phase 2C-B - public catalogue polish and enquiry handoff.

This phase polishes the public catalogue and listing detail experience for the
furniture/event-rental website now that admin-uploaded listing images can be
rendered. Catalogue cards and detail pages use stable image frames, clearer
category/rental-unit hierarchy, safe fallback imagery, and enquiry-oriented CTA
copy. Catalogue and detail CTA links may pass an optional listing slug to the
existing quote request page; the quote page validates that slug through the
public catalogue read surface before displaying context or pre-filling the
existing items text area. This phase also adds safe catalogue/detail metadata
using only public listing data. It does not add carts, checkout, payments,
customer accounts, stock reservation, order fulfilment, confirmed booking,
online ordering, customer uploads, arbitrary public upload routes, public quote
status tracking, notifications, CRM integration, browser Supabase, service-role
runtime paths, DB/API/table/RPC/RLS renames, n8n/Pinecone runtime behavior,
SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2C-A - storage-backed listing media upload and public image rendering.

Last merged phase PR: #93

Merge commit: `88f8b7147bcabb06189f44c300187a4149415c2f`

## Previous merged status snapshot: Phase 2C-A

Current phase: Phase 2C-A - storage-backed listing media upload and public image rendering.

This phase adds an admin-controlled listing media workflow. Authorised
owner/admin users can upload approved JPEG, PNG, WebP, or AVIF listing images
through the protected admin shell. The existing `POST /api/admin/product-images`
route now keeps JSON metadata creation unchanged and handles multipart uploads
through a server-only branch that requires `productImage.write`, same-origin
Origin/Host validation, a valid CSRF proof, trusted workspace resolution, and a
session-bound authenticated Supabase client. Uploaded files are stored in the
public `listing-media` bucket under server-generated workspace/listing paths,
then existing `product_images` metadata is created through the current
metadata persistence contract. Because the bucket is public, object serving is
public to anyone with the unguessable server-generated URL; RLS is not treated
as a public URL serving gate. Public catalogue and listing detail pages render
only URLs surfaced by active published listing metadata and keep safe fallback
imagery when they are not available. This phase does not add customer uploads, arbitrary
public upload routes, carts, checkout, payments, customer accounts, stock
reservation, order fulfilment, confirmed booking, online ordering, quote
status tracking, notifications, CRM integration, browser Supabase, service-role
runtime paths, DB/API/table/RPC/RLS renames, n8n/Pinecone runtime behavior,
SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AY - admin listing image metadata UI boundary.

Last merged phase PR: #92

Merge commit: `eaf6f19a42e47b9bfb7f9ecb780bbec5bed50cbd`

## Previous merged status snapshot: Phase 2B-AY

Current phase: Phase 2B-AY - admin listing image metadata UI boundary.

This phase adds metadata-only listing image management controls inside the
protected admin shell. Authorised owner/admin users can request a
`productImage.write` CSRF proof and create, update, or archive listing image
metadata through the existing protected product-image metadata backend routes.
The dashboard read boundary now includes the editable image metadata needed by
the UI, scoped to the trusted admin workspace and mapped to generic unavailable
states on provider errors. This phase does not add binary image upload,
`<input type="file">`, multipart form handling, Supabase Storage bucket
creation or API calls, public image upload or management routes, browser
Supabase, service-role runtime paths, SQL migrations, DB/API/table/RPC/RLS
renames, carts, checkout, payments, customer accounts, stock reservation,
order fulfilment, confirmed booking, online ordering, notifications, CRM
integration, n8n/Pinecone runtime behavior, SaaS chatbot runtime work, or
`website/chat-config.js` access.

Latest completed phase: Phase 2B-AX - admin quote request status update boundary.

Last merged phase PR: #91

Merge commit: `0977f70a85c15cc82350160d6b8d8394b16ba5d9`

## Previous merged status snapshot: Phase 2B-AX

Current phase: Phase 2B-AX - admin quote request status update boundary.

This phase adds admin-only quote request status updates from the protected
admin quote request inbox. Authorised owner/admin users can request a
`quote.write` CSRF proof and update only the `status` field of an existing
quote request through a first-party server-only route scoped to the trusted
admin workspace. Viewer memberships cannot use `quote.write`. The UI presents
these statuses as internal follow-up status only and returns generic success or
failure states. It does not add public quote tracking, customer-facing status
pages, notifications, CRM integration, internal notes, assignment, customer
accounts, ecommerce ordering, checkout, payments, fulfilment, stock
reservation, confirmed booking, online ordering, image upload, Supabase
Storage, SQL migrations, DB/API/table/RPC/RLS renames, browser Supabase,
service-role runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AW - admin quote request inbox boundary.

Last merged phase PR: #90

Merge commit: `1852b6910fdd1eb5ddf19aaf788ead47d4a05bf0`

## Previous merged status snapshot: Phase 2B-AW

Current phase: Phase 2B-AW - admin quote request inbox boundary.

This phase adds a read-only admin quote request inbox inside the protected
admin shell. Authorised admins can review recent customer quote requests and
requested item snapshots for the trusted admin workspace through a server-only,
session-bound admin read path. The inbox is read-only and returns only generic
unavailable UI when quote data cannot be loaded. It does not add quote status
writes, notifications, CRM integration, customer accounts, ordering, checkout,
payments, fulfilment, stock reservation, confirmed booking, SQL migrations,
browser Supabase, service-role runtime paths, ecommerce flows, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, or `website/chat-config.js`
access.

Latest completed phase: Phase 2B-AV - admin anti-framing header hardening.

Last merged phase PR: #89

Merge commit: `59c79e8e6e08f3065944e0252333f2f6a8947597`

## Previous merged status snapshot: Phase 2B-AV

Current phase: Phase 2B-AV - admin anti-framing header hardening.

This phase adds a narrow browser-side clickjacking hardening control for the
protected admin UI. The Next.js config now applies only
`Content-Security-Policy: frame-ancestors 'none'` and
`X-Frame-Options: DENY` to `/admin` and nested admin UI routes. This is a
low-severity hardening fix: SameSite=Lax auth cookies may reduce arbitrary
off-site exploitability, but anti-framing headers close the missing
browser-side defence for the real first-party admin UI. It does not change
admin auth, CSRF, Origin/Host checks, Supabase SSR cookies, write route logic,
admin UI behavior, SQL migrations, browser Supabase, service-role runtime
paths, ecommerce flows, n8n/Pinecone runtime behavior, SaaS chatbot runtime
work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AU - public events and quote copy polish.

Last merged phase PR: #88

Merge commit: `8b7ef181ba44c63847d3accc324627ae38e4b5b8`

## Previous merged status snapshot: Phase 2B-AU

Current phase: Phase 2B-AU - public events and quote copy polish.

This phase polishes public events and quote-request copy without changing the
public data path or quote form behavior. The events page now uses normal
event-rental, furniture-rental, styled-setup, enquiry, and quote-request
language instead of public shell/MVP wording. The quote page and site metadata
stay focused on quote requests and do not imply checkout, payment, online
ordering, stock reservation, or confirmed bookings. It does not add enquiry
form implementation beyond the existing quote request form, admin changes,
image upload, Supabase Storage, SQL migrations, DB/API/table/RPC/RLS renames,
ecommerce flows, browser Supabase, service-role runtime paths, n8n/Pinecone
changes, SaaS chatbot runtime work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AT - public furniture catalogue UX polish.

Last merged phase PR: #87

Merge commit: `806395ba83e1b7114a4305be772ec8ac2a6d190c`

## Previous merged status snapshot: Phase 2B-AT

Current phase: Phase 2B-AT - public furniture catalogue UX polish.

This phase polishes public catalogue and listing detail UX without changing the
public data path. The pages now use listing-forward copy for browsing and detail
views, keep a safe fallback empty state, and preserve existing read paths using
`getPublicCatalogue()` and `getPublicProductBySlug()`. It does not add image
upload, Supabase Storage, public image generation from Supabase Storage URLs,
enquiry form implementation, DB/API/table/RPC/RLS renames, ecommerce flows,
browser Supabase, service-role runtime paths, or `website/chat-config.js`
access.

Latest completed phase: Phase 2B-AS - metadata-only admin listing management.

Last merged phase PR: #86

Merge commit: `6b031b3a287a6b763f55676a791ee29a7504b4a8`

## Previous merged status snapshot: Phase 2B-AS

Current phase: Phase 2B-AS - admin furniture listing management UI boundary.

This phase adds metadata-only furniture listing management controls inside the
existing protected admin shell. Authorised admins can create, edit,
publish/unpublish, and archive listing metadata through the existing hardened
`product.write` backend routes. The UI requests a first-party CSRF proof and
sends `x-csrf-proof` on write requests. It does not add image upload, Supabase
Storage, public catalogue redesign, enquiry forms, DB/API/table/RPC/RLS
renames, ecommerce flows, browser Supabase, service-role runtime paths, or
`website/chat-config.js` access.

Latest completed phase: Phase 2B-AR - admin shell GET origin handling fix.

Last merged phase PR: #85

Merge commit: `b120ebe24290c9a7d675fc51160f9b63ded464e2`

## Previous merged status snapshot: Phase 2B-AR

Current phase: Phase 2B-AR - admin shell GET origin handling fix.

This phase fixes the protected admin shell request-security gate so safe
top-level `GET`/`HEAD` admin shell access can proceed when the browser omits
`Origin` and the request `Host` matches trusted expected host configuration.
Strict Origin/Host validation remains required when Origin is present, for
`admin.csrf.issue`, and for state-changing admin writes. The shell maps
request-security denials to generic unavailable copy rather than implying an
authenticated-but-not-authorised account state.

Latest completed phase: Phase 2B-AQ - furniture listing catalogue direction pivot.

Last merged phase PR: #84

Merge commit: `0cc3db57d7f2d1f578a5e1384fc17fe530e8a9f7`

## Previous merged status snapshot: Phase 2B-AQ

Current phase: Phase 2B-AQ - furniture listing catalogue direction pivot.

This phase updates direction and presentation copy so the current product track is clearly a furniture/event-rental listing catalogue plus customer enquiry/quote request system. Admin-managed categories and catalogue listings remain the operating model; carts, checkout, payments, customer accounts, stock reservation, order fulfilment, and online ordering are not the near-term direction. Internal database/API names such as `products`, `categories`, and `product_images` remain unchanged for now to avoid risky churn.

Latest completed phase: Phase 2B-AP - admin category management UI boundary.

Last merged phase PR: #83

Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`

## Previous merged status snapshot: Phase 2B-AP

Current phase: Phase 2B-AP - admin category management UI boundary.
Latest completed phase: Phase 2B-AO - admin read-only product dashboard boundary.
Last merged phase PR: #83
Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`

## Previous merged status snapshot

Current phase: Phase 2B-AN - admin auth login logout protected shell.

This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Latest completed phase: Phase 2B-AM - admin product write audit atomicity boundary.

Last merged phase PR: #80

Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`

## Completed foundation

- Next.js app root exists under `website/`.
- Public homepage, catalogue, furniture listing detail, events, quote, and chat shells
  exist.
- Browser chat calls first-party `POST /api/chat` only.
- n8n remains behind the server-only `N8nChatProvider`.
- Supabase schema, migrations, RLS strategy, local RLS tests, server-only
  Supabase helper, public catalogue reads, quote persistence, and
  session-bound admin product persistence exist.
- Disabled server-only chat persistence scaffold exists.

## Completed deployment readiness docs

- `docs/DEPLOYMENT-ENVIRONMENT-READINESS.md`
- `docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md`
- `docs/templates/DEPLOYMENT-EVIDENCE.md`
- `docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md`

These are preparation only. They do not deploy, connect Supabase Cloud, add
Vercel config, add real env values, or add runtime features.

## Completed admin/auth design and policy scaffolds

- `docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md`
- `docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md`
- `docs/checklists/PHASE-2B-ADMIN-AUTH.md`
- `docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md`
- Server-only admin authorization policy module.
- Server-only disabled auth/membership resolver scaffold.
- Server-only admin auth/membership adapter contracts with fake-adapter tests.
- Checklist ownership, maintenance rules, and quick phase status docs.
- Reviewed server-side resolver decisions for trusted fake adapter inputs.
- Admin auth implementation-gate cleanup and runtime-readiness checklist/static
  guard refinement is complete.
- Future server-only Supabase Auth runtime approval lane is complete.
- Server-only Supabase Auth identity/session-read boundary is complete.
- Server-only Supabase admin profile/membership read boundary is complete.
- Server-only admin workspace resolution boundary is complete.
- Server-only session-bound admin read-client factory is complete.
- Server-only admin authorization adapter-set composition boundary is complete.
- Server-only composed admin authorization decision boundary is complete.
- Server-only admin request security preflight boundary is complete.
- Server-only CSRF proof verifier boundary is complete.
- Server-only CSRF proof issuer boundary is complete.
- Server-only admin authorization gate composition boundary is complete.
- Admin runtime wiring approval lane is complete.
- Server-only admin request metadata adapter boundary is complete.
- Server-only admin runtime gate invocation boundary is complete.
- Admin runtime gate invocation usage approval lane is complete.
- Server-only admin runtime route gate adapter boundary is complete.
- Admin runtime route gate adapter usage approval lane is complete.
- First admin runtime route gate adapter usage boundary is complete.
- Admin CSRF proof issuer runtime usage approval lane is complete.
- Admin auth-check trusted workspace dependency repair is complete.
- Admin CSRF proof issuer route operation approval boundary is complete.
- Admin CSRF issue operation policy and preflight boundary is complete.
- Admin CSRF proof issuer route readiness and route-if-safe boundary is complete.
- Admin CSRF proof runtime dependency boundary is complete. This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.
- Admin CSRF proof issuer route deferred because of missing safe server-side session/workspace binding is complete.
- Admin CSRF proof issuer session/workspace binding boundary is complete.
- Admin CSRF proof session/workspace binding runtime dependency boundary is complete.
- Admin CSRF proof issuer route implementation is complete.
- Backend-only protected admin product persistence and write API routes are
  complete.
- Admin product write audit atomicity boundary is complete.
- Minimal first-party admin login/logout and protected admin shell boundary is
  complete.
- Read-only admin furniture listing dashboard boundary is complete.
- Admin shell GET missing-Origin route-gate repair is complete.
- Metadata-only admin furniture listing management UI boundary is complete.
Supabase Auth is approved as the future server-side admin auth provider. The
Phase 2B-K identity boundary remains the only approved place to read Supabase
Auth cookies or call Supabase Auth server APIs. The Phase 2B-L
profile/membership boundary is the only approved place in this phase to read
`admin_users` or `memberships` for admin authorization. The Phase 2B-M
workspace resolver boundary is the only approved place in this phase to
resolve trusted admin workspace scope. The Phase 2B-N session-bound admin
read-client factory is restricted to the Phase 2B-K identity boundary and is
not a runtime wiring approval. The Phase 2B-O adapter-set composition boundary
is restricted to composing those existing server-only contracts and is not a
runtime wiring approval. The Phase 2B-P composed decision boundary is
restricted to composing the adapter set and calling the existing adapter-driven
decision resolver; it is not a runtime wiring approval. The Phase 2B-Q request
security preflight boundary is restricted to validating explicitly injected
request metadata and optional injected CSRF verifier results; it is not a
runtime wiring or header-read approval. The Phase 2B-R CSRF proof verifier
boundary is restricted to validating explicitly injected proof material and
dependency-injected verifier checks; it is not a runtime wiring, header-read,
cookie-read, or CSRF issuance approval. The Phase 2B-S CSRF proof issuer
boundary is restricted to issuing verifier-compatible proofs from explicitly
injected proof material and dependency-injected signer/nonce dependencies; it
is not a runtime wiring, header-read, cookie-read, env-read, replay-store, or
CSRF verification approval. The Phase 2B-T admin authorization gate
composition boundary is restricted to composing those server-only boundaries
from explicit inputs only and is not a runtime wiring approval. Phase 2B-U
approves only the future runtime lane for gate usage from first-party
server-only routes or server actions after a reviewed request metadata adapter
exists; it is not runtime implementation approval. The Phase 2B-V request
metadata adapter boundary is restricted to reading minimal untrusted request
metadata and trusted expected origin/host inputs for future gate injection; it
is not runtime route/page/server-action wiring approval. The Phase 2B-W
runtime gate invocation boundary is restricted to composing the Phase 2B-V
metadata adapter and Phase 2B-T gate from explicit inputs; it is not runtime
route/page/server-action wiring approval. The Phase 2B-X approval lane is
docs/checklist/static-guard approval only and is not runtime implementation
approval. The Phase 2B-Y route gate adapter boundary is restricted to calling
the Phase 2B-W invocation helper from explicit inputs only and is not runtime
route/page/server-action wiring approval. The Phase 2B-Z approval lane is
docs/checklist/static-guard approval only for future first-party server-only
usage of `resolveServerAdminRuntimeRouteGateAdapter()`, and it is not runtime
implementation approval. Phase 2B-AA approves and adds the first admin runtime
route gate adapter usage boundary from exactly one first-party server-only
route handler. Phase 2B-AB approves only the future server-only admin CSRF
proof issuer runtime usage lane. Phase 2B-AC repairs the admin auth-check
trusted workspace dependency. Phase 2B-AD is docs/checklist/static-guard approval only for the future admin CSRF proof issuer route operation model, and it is not runtime implementation approval. Phase 2B-AE implements only the admin CSRF issue operation policy and preflight boundary. Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented. Phase 2B-AG implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. Phase 2B-AH is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries. Phase 2B-AI implements only the server-only admin CSRF proof issuer session/workspace binding boundary. Phase 2B-AJ implements only the server-only runtime dependency that derives opaque session/workspace bindings for that boundary from canonical operation, auth user, admin user, trusted workspace, and membership role inputs. Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route. It reuses the approved `admin.csrf.issue` route gate lane, `ADMIN_EXPECTED_ORIGIN`, `ADMIN_EXPECTED_HOST`, `ADMIN_TRUSTED_WORKSPACE_ID`, the Phase 2B-AI binding boundary, and the Phase 2B-AJ runtime dependencies. It does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access. These boundaries are not wired into pages, server actions,
protected admin runtime, login/logout, admin UI, or product writes. Phase
2B-AL implements only backend protected product/category/product-image metadata
write routes and session-bound persistence through the approved admin
gate/CSRF/RLS/audit boundaries. Phase 2B-AM resolves the atomicity limitation in
2B-AL by migrating product metadata mutations and audit insertions to a single
Postgres RPC transaction block (`execute_admin_product_write`), and hardens
route methods to POST-only for state changes. These 2B-AL/AM boundaries are not
wired into pages, server actions, protected admin runtime, login/logout, admin
UI, Storage, uploads, browser Supabase, or service-role paths. Phase 2B-AN
adds only minimal login/logout and a protected admin shell. Login/logout uses
the existing server-only Supabase Auth boundary for session creation and
clearing. The protected shell uses the existing route-gate stack with the new
read-only `admin.shell.access` operation, which allows owner/admin membership
and denies viewer membership. It does not add product-management UI, product
write forms, server actions, Storage, uploads, browser Supabase, service-role
paths, deployment config, Supabase Cloud, n8n changes, Pinecone runtime code,
SaaS chatbot work, or `website/chat-config.js` access.
Phase 2B-AO adds only a read-only furniture listing dashboard inside that protected
shell. It keeps the existing `admin.shell.access` gate as the page boundary,
uses a session-bound authenticated read client for select-only catalogue table
reads, and renders only safe catalogue management summaries. It does not add
write forms, mutation controls, server actions, Storage/uploads, browser
Supabase, service-role paths, deployment config, Supabase Cloud, n8n changes,
Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

Runtime session-bound read-client usage remains deferred outside the approved
Phase 2B-AL/AM backend routes, Phase 2B-AN protected admin shell path, and
Phase 2B-AO read-only admin dashboard path.
Runtime adapter-set usage remains deferred outside the approved Phase 2B-AL/AM
backend routes and Phase 2B-AN protected admin shell path.
Runtime decision-boundary usage remains deferred outside the approved Phase
2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime request-security preflight usage remains deferred outside the approved
Phase 2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime CSRF proof verifier usage remains deferred.
Runtime CSRF proof issuer usage remains deferred except the approved
Phase 2B-AK `POST /api/admin/csrf-proof` route.
Runtime CSRF proof session/workspace binding usage from routes, pages, or
server actions remains deferred except the approved Phase 2B-AK route.
Runtime admin authorization gate usage remains deferred outside the approved
Phase 2B-AL/AM backend routes and Phase 2B-AN protected admin shell path.
Runtime request metadata adapter usage from routes, pages, or server actions
remains deferred except the approved Phase 2B-AA route boundary, Phase 2B-AK
route boundary, Phase 2B-AL/AM backend route boundaries, and Phase 2B-AN
protected admin shell boundary.
Runtime admin gate invocation helper usage from routes, pages, or server
actions remains deferred except the approved Phase 2B-AA route boundary, Phase
2B-AK route boundary, Phase 2B-AL/AM backend route boundaries, and Phase 2B-AN
protected admin shell boundary.
Runtime admin route gate adapter usage from routes, pages, or server actions
remains deferred except the approved Phase 2B-AA, Phase 2B-AK, Phase 2B-AL/AM,
Phase 2B-AN, Phase 2B-AO, Phase 2B-AR, and Phase 2B-AS boundaries.

## Still blocked

- Real auth runtime wiring outside the Phase 2B-AN login/logout and protected
  admin shell boundary.
- Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth
  session boundaries.
- Cookie reads outside the Phase 2B-K server-only identity boundary.
- Admin profile/membership Supabase table reads outside the Phase 2B-L
  server-only read boundary.
- Admin workspace resolution outside the Phase 2B-M server-only workspace
  boundary.
- Session-bound admin read-client factory usage from runtime routes, pages, or
  server actions.
- Admin authorization adapter-set usage from runtime routes, pages, or server
  actions.
- Admin authorization decision boundary usage from runtime routes, pages, or
  server actions.
- Admin request security preflight usage from runtime routes, pages, or server
  actions.
- Admin CSRF proof verifier usage from runtime routes, pages, or server
  actions.
- Admin CSRF proof issuer usage from other runtime routes, pages, or server
  actions.
- Admin CSRF proof session/workspace binding usage from other runtime routes,
  pages, or server actions.
- Admin authorization gate usage from runtime routes, pages, or server actions.
- Admin runtime gate invocation usage from routes, pages, or server
  actions (except the approved Phase 2B-AA route boundary).
- Admin runtime route gate adapter usage from routes, pages, or server
  actions except the approved Phase 2B-AA, Phase 2B-AK, and Phase 2B-AL route
  boundaries, plus the Phase 2B-AN/AO protected admin shell boundary repaired
  in Phase 2B-AR.
- Header reads outside the Phase 2B-V request metadata adapter.
- Login/logout routes outside the Phase 2B-AN first-party admin auth boundary.
- Protected admin pages outside the Phase 2B-AN minimal protected shell and
  Phase 2B-AO read-only dashboard boundary.
- Furniture listing write UI beyond the approved category management,
  metadata listing, and metadata listing image controls. Phase 2B-AY adds only
  listing image metadata controls through the existing backend routes; binary
  upload and Supabase Storage remain blocked.
- Resolver/adapter runtime wiring into routes, pages, or server actions.
- Product writes outside the Phase 2B-AL backend API route boundary.
- Listing image uploads and Supabase Storage wiring.
- Conversation/message writes.
- Supabase Cloud connection.
- Deployment and Vercel project config.
- Production seed data.
- Browser Supabase.
- Service-role runtime paths unless separately approved.
- Pinecone runtime changes or migration.
- SaaS chatbot app work in this repo.
- n8n workflow import, export, activation, execution, or mutation.

Furniture listing metadata writes currently use the existing Phase 2B-AL/AM backend API route boundary, whose internal technical names still reference product/product image tables and routes.
Furniture listing write UI beyond categories, Phase 2B-AS metadata-only
listing controls, and Phase 2B-AY metadata-only listing image controls, plus
server actions, binary listing image upload, Supabase Storage, service-role
shortcuts, and browser Supabase product writes remain blocked.

## Current n8n/Pinecone position

The current SKR website may keep using the existing n8n/Pinecone chatbot workflow as a temporary production bridge.

n8n remains temporary server-side integration only.

Browser must never call n8n directly.

Do not migrate Pinecone in this repo yet.

Do not add Pinecone runtime code or credentials in this repo yet.

## Future SaaS chatbot note

The future SaaS chatbot should be a separate project/app.

SKR can later become the first client/tenant of that SaaS chatbot.

Do not implement SaaS chatbot work inside this repo yet.

Do not force the current n8n/Pinecone workflow into the future SaaS
architecture.

## Next recommended PR

The next recommended PR should keep the furniture listing catalogue direction narrow. Safe follow-up work can harden listing terminology, prepare listing image metadata planning without upload/storage, or improve enquiry/quote planning docs. Binary listing image uploads, Supabase Storage, carts, checkout, payments, customer accounts, stock reservation, order fulfilment, online ordering, deployment config, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain blocked.

## Phase 2B-AP Current Boundary

Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell for authorised owner/admin users. The browser requests a CSRF proof for `category.write` from the first-party `/api/admin/csrf-proof` route and then calls only the existing first-party category write endpoints with `x-csrf-proof`.

Product create/edit/archive/publish UI, product image write UI, binary uploads, Supabase Storage, server actions, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.


## Previous merged status snapshot: Phase 2B-AO

Current phase: Phase 2B-AO - admin read-only product dashboard boundary.
Latest completed phase: Phase 2B-AN - admin auth login logout protected shell.
Last merged phase PR: #81
Merge commit: `f66a37644c51123780fee0944e584ab5e00d6f3e`

## Phase 2B-AQ Current Boundary

Phase 2B-AQ is a terminology and direction pivot only. It makes current docs, checklists, and safe visible copy point to an admin-managed furniture/event-rental listing catalogue with customer enquiry/quote requests.

This phase does not rename database tables, Supabase tables, API routes, RPCs, RLS policies, or server helper modules. The existing internal `products`, `categories`, and `product_images` names remain in place until a separately approved migration/rename strategy exists.

Carts, checkout, payments, customer accounts, stock reservation, order fulfilment, online order flows, new listing write UI, uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment, n8n changes, Pinecone runtime code, SaaS chatbot work, and `website/chat-config.js` access remain out of scope.

## Phase 2B-AS Current Boundary

Phase 2B-AS adds only metadata furniture listing management controls inside
the protected admin shell. The browser component requests a CSRF proof for
`product.write`, then calls only `POST /api/admin/products`,
`POST /api/admin/products/[productId]`, and
`POST /api/admin/products/[productId]/archive` with `x-csrf-proof`.

Image upload, Supabase Storage, public catalogue redesign, enquiry forms,
DB/API/table/RPC/RLS renames, cart, checkout, payments, customer accounts,
stock reservation, order fulfilment, online ordering, browser Supabase,
service-role runtime paths, deployment config, n8n changes, Pinecone runtime
code, SaaS chatbot work, and `website/chat-config.js` access remain out of
scope.

## Phase 2B-AY Current Boundary

Phase 2B-AY adds only metadata listing image management controls inside the
protected admin shell. The browser component requests a CSRF proof for
`productImage.write`, then calls only `POST /api/admin/product-images`,
`POST /api/admin/product-images/[imageId]`, and
`POST /api/admin/product-images/[imageId]/archive` with `x-csrf-proof`.

Binary image upload, file inputs, multipart form handling, Supabase Storage,
public image upload or management routes, DB/API/table/RPC/RLS renames, SQL
migrations, cart, checkout, payments, customer accounts, stock reservation,
order fulfilment, confirmed booking, online ordering, notifications, CRM
integration, browser Supabase, service-role runtime paths, deployment config,
n8n/Pinecone runtime behavior, SaaS chatbot runtime work, and
`website/chat-config.js` access remain out of scope.
