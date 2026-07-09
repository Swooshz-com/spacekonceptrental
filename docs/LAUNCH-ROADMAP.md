# Launch Roadmap

This roadmap sequences the next SpaceKonceptRental launch work after PR #288.
It is a focused implementation plan, not hosted staging evidence and not a
production-readiness claim.

SpaceKonceptRental remains a furniture and event rental enquiry/catalogue
site. Launch work must keep the product boundary on public catalogue browsing,
listing detail, quote/enquiry submission, and protected admin triage. Do not
add cart, checkout, payment, order, booking, reservation, stock or inventory,
fulfilment, customer account, or custom CRM workflows.

## Current Admin UX Baseline

PR #283 established the protected admin shell and design-token foundation. PR
#284 added the admin UX mapping, launch roadmap, Hero simplification, wider
Hero layout, and clickable admin brand link. PR #285 redesigned Catalogue into
an owner-friendly workflow, removed standalone category management from the
primary Catalogue UX, and mapped image data to an owner-safe client DTO before
the client boundary. PR #286 made Setups an honest derived review workflow
backed by published Catalogue items for launch. PR #287 implemented the
server-only SKR enquiry handoff contract and delivery-log write path. PR #288
added the inactive credential-free n8n workflow skeleton plus hosted migration
and smoke-test runbooks.

Current protected admin pages remain:

- `/admin`
- `/admin/hero`
- `/admin/catalogue`
- `/admin/setups`
- `/admin/enquiry-email`
- `/admin/delivery-log`

The current admin UX mapping source of truth for the next implementation
slices is `docs/admin/ADMIN-UX-MAPPING.md`.

Protected admin pages intentionally redirect unauthenticated requests to
`/admin/login?state=unauthenticated`. Authenticated but unauthorized and
unavailable states remain safe protected admin shell states.

## Next Implementation Sequence

### 1. Hero simplification plus clickable admin logo

Status: implemented in PR #284.

Goal: make the safest obvious UX fixes first.

Scope:

- Remove the owner-facing `Publish hero image` toggle.
- Save hero image changes as active through the existing protected write path.
- Keep only current preview, upload replacement image, alt text, and save.
- Keep headline, body, CTA, raw image URL, and About story media controls out
  of the Hero page.
- Link the top-left `SpaceKonceptRental Admin` brand to `/admin`.
- Keep `View public site` as the separate public link.

Backend note:

- No schema change is required for launch because the existing hero write
  contract accepts `isEnabled`, and the UI can submit `true`.

Exit criteria:

- Focused admin shell and hero tests pass.
- No new protected routes are added.

### 2. Catalogue owner workflow redesign

Status: implemented in PR #285.

Goal: make Catalogue feel like the public catalogue page with admin controls.

Target:

- Public-like catalogue card grid.
- Add item action.
- Search, filter, and status controls.
- Edit item drawer or panel.
- Item editor fields for name, description, category, images, primary image,
  alt text, publish status, display position, and save.
- Categories/tags managed through catalogue or setup item assignments.
- Frontend category menus derived from actual tagged or assigned, published
  content.
- Empty categories/tags do not appear on the frontend, and derived category/tag
  lists are sorted alphabetically.
- No separate manual taxonomy manager as the primary launch workflow.
- No raw URL owner workflow.
- No storage bucket/path owner workflow.
- No fake item data.

Backend note:

- Current internals still use `products`, `categories`, and `product_images`.
  Preserve those internals until a separate rename/migration strategy is
  approved.
- Current backend support still uses separate category records and product
  `categoryId` assignments. The Catalogue editor may assign an existing
  category, but this slice does not add item-level category/tag create-on-save.
- Add a later backend-backed tagging or create-on-save category slice if owners
  need to create categories/tags directly from item editing.
- If style/context is required, add a reviewed schema and read/write contract
  before showing the field as editable.
- Current admin reads do not expose a backed style/context field, so
  style/context remains deferred.
- Current image metadata updates can save alt text, primary image state, and
  display position without exposing storage bucket/path inputs.

Exit criteria:

- Owner can understand item status and edit one item without switching between
  unrelated technical panels.
- Public catalogue read boundaries and protected write boundaries remain
  intact.

### 3. Setups owner workflow decision and implementation

Status: implemented in PR #286.

Goal: make Setups an honest owner-friendly derived review workflow for launch.

Launch decision:

- Keep Setups derived from published Catalogue items for launch.
- To change setup content for launch, edit the relevant Catalogue item.
- Do not add fake setup data or setup-specific CRUD without a backed model.

Derived path:

- Show public-like setup cards sourced from published Catalogue items.
- Show published candidate, excluded draft/hidden, and image-review counts.
- Link every card back to Catalogue for edits.
- Keep Setups as a review/check surface.

Real setup record path:

- Add schema, RLS, protected read/write routes, tests, admin editor, and public
  rendering in a separate backend-first slice.
- Setup-specific tagging/context remains deferred until backed by a
  schema/read/write contract.

Exit criteria:

- No fake setup editor exists.
- Public Setups behavior is honest about its Catalogue source.
- No setup-specific records are introduced.

### 4. n8n enquiry handoff UI, backend, and workflow readiness

Status: SKR-side server-only handoff implemented in PR #287. Repo-side n8n
workflow readiness, hosted migration runbook, and hosted smoke checklist are
added in this readiness package.

Goal: make enquiry email handoff operational without exposing secrets or fake
success.

Target flow:

- SKR stores the enquiry first.
- SKR creates a stable public reference and idempotency key.
- SKR triggers n8n from a server-side boundary after persistence succeeds.
- n8n sends the internal email or handoff notification.
- Delivery Log records the attempt/result with safe status/error categories.
- Optional HubSpot mirror can be added later.

Admin UX:

- Enquiry Email page shows n8n handoff readiness and status.
- Delivery Log shows technical enquiry handoff and delivery attempts.
- No raw provider token/config UI.
- No secrets displayed.
- No fake send success.

Backend notes:

- n8n configuration is server-only and uses `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`,
  `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`, and optional
  `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`.
- The browser never calls n8n directly.
- The public quote response is based on SKR persistence, not final email
  delivery. It must not claim a final quote, confirmed rental fit, or email
  delivery.
- A reviewed migration extends the existing technical delivery-log provider and
  status contract for `n8n`, `pending`, `delivered`, `failed`, and
  `not_configured`. Hosted Supabase migration application remains separate
  approval-gated work.
- A repo-side inactive n8n workflow skeleton is reviewed at
  `n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json`.
- The workflow skeleton contains no credentials, no real webhook URLs, no real
  recipient addresses, and no execution data. It is not a live workflow import,
  activation, or execution.
- The workflow skeleton intentionally requires manual n8n setup for HMAC
  verification, timestamp freshness, idempotency, and email/internal handoff
  before activation; it must not be treated as hosted readiness by itself.
- Hosted Supabase migration application remains separate approval-gated work
  documented in
  `docs/N8N-ENQUIRY-HANDOFF-HOSTED-MIGRATION-RUNBOOK.md`.
- Hosted end-to-end enquiry -> n8n -> email/internal handoff -> Delivery Log
  validation remains separate approval-gated work documented in
  `docs/N8N-ENQUIRY-HANDOFF-HOSTED-SMOKE-CHECKLIST.md`.

Exit criteria:

- Handoff failure is visible in protected admin technical status without
  leaking raw provider or workflow details.
- Public quote response remains honest and generic.
- Browser never calls n8n directly.
- No hosted staging readiness or UAT pass is claimed.

### 5. Google-only admin access management

Status: implemented in this PR as a repo-side code and reviewed migration
slice. Hosted Supabase migration application and owner access bootstrap remain
approval-gated hosted operations.

Goal: keep admin access manageable for the owner without expanding customer
account scope.

Target:

- Google-only admin sign-in through Supabase Auth.
- DB-backed active `admin_access` record required after Google sign-in.
- Owner/admin launch roles only; viewer is not exposed as a launch admin
  concept.
- Owner row is immutable and cannot be removed or disabled.
- Owner can add, disable, remove, and reactivate admin email access from the
  existing `/admin` dashboard.
- Admins must sign in with Google using the same normalized email that appears
  in the access list.
- Google-authenticated alone is not enough.
- No password login.
- No public signup.
- No public customer accounts.
- No visitor login.
- No self-service customer dashboard.

Backend notes:

- Reviewed migration:
  `supabase/migrations/20260709100000_google_admin_access_management.sql`.
- The migration adds `admin_access`, owner immutability, owner-only access
  write RPC, and active-access checks in workspace/product/enquiry admin helper
  functions.
- The migration also provides owner-safe admin access read helpers:
  `list_admin_access_records` for the dashboard DTO and
  `get_admin_access_membership` for the protected admin gate. App code should
  not filter `admin_access` directly by private columns such as `workspace_id`
  or `linked_admin_user_id`.
- Hosted Supabase migration application is not performed by this repo PR.
- The fixed owner row must be bootstrapped only through the approved hosted
  Supabase migration/access process after explicit owner approval. No owner
  email, seed data, seed file, OAuth secret, service-role key, connection
  string, or service credential is committed here.
- After bootstrap, the owner must sign in with Google using the exact
  normalized owner email; unknown Google users and disabled/removed admins must
  remain blocked before any hosted UAT claim.
- Existing `admin_users` and `memberships` remain as compatibility/audit tables;
  the new access table gates and links them after a successful Google session.

Exit criteria:

- Admin access is limited to approved owner/admin identities.
- Unknown Google users are blocked.
- Disabled or removed admins are blocked.
- Owner cannot be disabled or removed.
- Session, CSRF, and protected route boundaries remain server-owned.
- No new protected admin pages are added.

### 6. Chatbot mapping

Status: implemented in this PR as a public chatbot launch boundary slice. Real
n8n workflow implementation/mapping remains deferred until Hostinger VPS,
Coolify, and the hosted n8n app are set up.

Goal: map the existing temporary chatbot bridge to the launch site without
starting the future SaaS chatbot inside this repo.

Target:

- Keep browser chat behind first-party `/api/chat`.
- Keep n8n server-side.
- Keep the chatbot as public visitor guidance only.
- Allow navigation help for Home, Catalogue, Setups, About, and Request Quote.
- Direct item-specific and event-specific requests to the Request Quote form.
- Block claims about availability, booking/reservation, final pricing, payment,
  order creation, human review, email delivery, n8n delivery, or internal/admin
  data.
- Keep chatbot off protected admin routes, including login and logout.
- Do not migrate Pinecone in this repo yet.
- Do not add Pinecone runtime code or credentials without separate approval.
- Document what public pages the chatbot may answer from and what must remain
  outside its scope.
- Document the launch boundary in `docs/CHATBOT-LAUNCH-BOUNDARY.md`.

Backend note:

- The real n8n workflow depends on the hosted n8n domain, HTTPS webhook URL,
  SKR hosted domain, email credentials, server networking, and hosted Supabase
  migration state. It is intentionally deferred until Hostinger VPS, Coolify,
  and hosted n8n are set up.

Exit criteria:

- Chatbot boundaries are mapped before hosted UAT.
- Browser code calls only `/api/chat`, not n8n.
- Unsafe provider replies are replaced with Request Quote guidance before they
  reach the browser.
- No SaaS chatbot app work is introduced in this repo.
- No hosted staging readiness or UAT pass is claimed.

### 7. Hostinger/Coolify deployment and hosted UAT

Goal: prepare and execute hosted UAT only after the owner explicitly approves
the deployment target and operation.

Target:

- Hostinger/Coolify deployment plan.
- Server-only environment placement.
- Hosted UAT checklist.
- Rollback/disable path.
- Evidence collection after deployment is actually approved and run.

Exit criteria:

- Hosted UAT is run only after explicit approval naming the target operation.
- Local validation and hosted checks are reported separately.

## Launch Gate Notes

No hosted staging readiness is claimed by this roadmap.

Before any hosted launch or UAT claim, the repo still needs:

- Local validation for the relevant implementation slice.
- Hosted runtime environment review.
- Explicit deployment approval naming the target and operation.
- Hosted smoke/UAT evidence after deployment.
- Safe verification of enquiry persistence and handoff in the hosted runtime.

## Related Docs

- `docs/admin/ADMIN-UX-MAPPING.md`
- `docs/SAFETY-BOUNDARIES.md`
- `docs/PHASE-STATUS.md`
- `docs/PHASE-ROADMAP.md`
