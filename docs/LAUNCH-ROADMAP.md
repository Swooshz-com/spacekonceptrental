# Launch Roadmap

This roadmap sequences the next SpaceKonceptRental launch work after PR #284.
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
Hero layout, and clickable admin brand link. These PRs did not complete
all-page owner workflow parity.

Current protected admin pages remain:

- `/admin`
- `/admin/hero`
- `/admin/catalogue`
- `/admin/setups`
- `/admin/enquiry-email`
- `/admin/delivery-log`

The current admin UX mapping source of truth for the next implementation
slices is `docs/admin/ADMIN-UX-MAPPING.md`.

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

Status: current implementation slice.

Goal: make Catalogue feel like the public catalogue page with admin controls.

Target:

- Public-like catalogue card grid.
- Add item action.
- Search, filter, and status controls.
- Edit item drawer or panel.
- Item editor fields for name, description, category, images, primary image,
  alt text, publish status, display position, and save.
- Categories derived from existing category assignments and sorted
  alphabetically.
- No separate manual taxonomy manager as the primary workflow unless a hard
  product reason exists.
- No raw URL owner workflow.
- No storage bucket/path owner workflow.
- No fake item data.

Backend note:

- Current internals still use `products`, `categories`, and `product_images`.
  Preserve those internals until a separate rename/migration strategy is
  approved.
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

Goal: decide whether Setups is derived from Catalogue for launch or backed by
real setup records.

Preferred launch direction:

- Use derived Setups from Catalogue unless the owner confirms setup-specific
  content is required before launch.

Derived path:

- Show public-like setup cards sourced from published catalogue records.
- Send edits back to Catalogue.
- Keep Setups as review/check surface.

Real setup record path:

- Add schema, RLS, protected read/write routes, tests, admin editor, and public
  rendering in a separate backend-first slice.

Exit criteria:

- No fake setup editor exists.
- Public Setups behavior is honest about its source.

### 4. n8n enquiry handoff UI and backend

Goal: make enquiry email handoff operational without exposing secrets or fake
success.

Target flow:

- SKR stores the enquiry first.
- SKR triggers n8n from a server-side boundary.
- n8n sends the email.
- Optional HubSpot mirror can be added later.

Admin UX:

- Enquiry Email page shows n8n handoff readiness and status.
- Delivery Log shows technical enquiry handoff and delivery attempts.
- No raw provider token/config UI.
- No secrets displayed.
- No fake send success.

Exit criteria:

- Handoff failure is visible in protected admin technical status without
  leaking raw provider or workflow details.
- Public quote response remains honest and generic.
- Browser never calls n8n directly.

### 5. Google-only admin access management

Goal: keep admin access manageable for the owner without expanding customer
account scope.

Target:

- Google-only admin sign-in and access management for owner/admin users.
- No public customer accounts.
- No visitor login.
- No self-service customer dashboard.

Exit criteria:

- Admin access is limited to approved owner/admin identities.
- Session, CSRF, and protected route boundaries remain server-owned.

### 6. Chatbot mapping

Goal: map the existing temporary chatbot bridge to the launch site without
starting the future SaaS chatbot inside this repo.

Target:

- Keep browser chat behind first-party `/api/chat`.
- Keep n8n server-side.
- Do not migrate Pinecone in this repo yet.
- Do not add Pinecone runtime code or credentials without separate approval.
- Document what public pages the chatbot may answer from and what must remain
  outside its scope.

Exit criteria:

- Chatbot boundaries are mapped before hosted UAT.
- No SaaS chatbot app work is introduced in this repo.

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
