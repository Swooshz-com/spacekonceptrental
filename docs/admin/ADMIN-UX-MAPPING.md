# Protected Admin UX Mapping

This document maps the protected SpaceKonceptRental admin pages to real owner
functions after PR #284. It is a planning and implementation-slicing document,
not a claim that all protected admin pages have production-ready owner workflow
parity.

Protected admin routes stay exactly:

- `/admin`
- `/admin/hero`
- `/admin/catalogue`
- `/admin/setups`
- `/admin/enquiry-email`
- `/admin/delivery-log`

SpaceKonceptRental remains a furniture and event rental enquiry/catalogue site.
Admin UX must not introduce cart, checkout, payment, order, booking,
reservation, stock or inventory, fulfilment, customer account, or custom CRM
workflow language.

## Current Decisions

### Hero

Decision: the Hero page is image-only for launch.

The protected Hero page should keep only:

- Current hero preview.
- Upload replacement image.
- Alt text.
- Save hero image.

Homepage headline, body, CTA, raw image URL, and About story media controls
must not return to this page.

The previous `Publish hero image` toggle is removed from the owner-facing UI.
The existing backend still stores `homepage_hero_content.is_enabled`, and the
existing protected write route still accepts `isEnabled`. No schema or RPC
change is required for this launch slice because the UI now saves hero image
changes with `isEnabled=true`.

If a future cleanup wants to remove the backend flag entirely, the minimal
backend change is to update the hero write contract, RPC, public read contract,
tests, and migration history with an explicit compatibility plan. That cleanup
is not needed before launch.

### Admin Shell Logo

Decision: the top-left `SpaceKonceptRental Admin` brand links back to `/admin`.

`View public site` remains the separate public-site link. The brand link is an
admin home affordance, not a public navigation shortcut.

### Protected Admin Routing

Decision: unauthenticated protected admin page requests redirect to
`/admin/login?state=unauthenticated`.

This is intentional protected-admin UX behavior so owners land on the login page
instead of a blocked admin shell state when they are not signed in. Authenticated
but unauthorized and unavailable states still render safe admin shell states.

## Page Mapping

### `/admin`

Owner task: understand overall public-content readiness and navigate to the
right protected admin page.

Current controls:

- Admin brand link to `/admin`.
- `View public site`.
- `Sign out`.
- Six-page admin navigation.
- Content status counts.
- Attention required counts.
- Quick links to Hero, Catalogue, and Setups.

Confusing or unnecessary controls:

- The dashboard is useful as a shell, but it is not yet a true owner task
  command centre because it does not deep-link to the exact record that needs
  attention.

Controls to remove:

- None in this PR.
- Do not add quote inbox, internal quote workflow, or provider mutation
  controls to this six-page shell.

Controls to merge:

- Future dashboard polish should merge attention rows and quick links into
  direct task cards once Catalogue and Setups have owner-friendly editors.

Backend constraints:

- The page reads protected catalogue summaries through the existing
  owner/admin route-gated admin shell and session-bound read client.
- It must not expose workspace internals, SQL/provider errors, secrets, or
  hidden admin details.

Next implementation slice:

- Keep the dashboard as navigation and readiness summary while the subpages are
  redesigned.
- After Catalogue and Setups are improved, add direct task links to filtered
  views rather than adding new protected routes.

### `/admin/hero`

Owner task: replace the homepage hero image and keep accessible alt text
current.

Current controls:

- Current hero preview.
- Replacement image upload.
- Image alt text.
- Save hero image.

Confusing or unnecessary controls:

- A separate publish toggle was confusing because the owner expected a saved
  hero image to become active.

Controls removed:

- `Publish hero image` toggle.

Controls that must stay removed:

- Headline controls.
- Body controls.
- CTA controls.
- Raw image URL input.
- About story media controls.

Controls to merge:

- Save and activation are now one workflow: save hero image.

Backend constraints:

- Current storage and persistence are already protected behind `hero.write`,
  CSRF proof, owner/admin authorization, server-side Storage upload, and the
  existing `homepage_hero_content` persistence boundary.
- The database still contains an enabled flag for compatibility. The UI saves
  `isEnabled=true`; no schema change is required for this PR.
- Existing disabled hero rows may remain disabled until the owner saves the
  current or replacement image through the simplified form.

Next implementation slice:

- Hero simplification plus clickable admin logo is the first implementation
  slice and is safe to land independently.
- Later visual polish should be limited to layout, preview clarity, upload
  recovery copy, and validation states.

### `/admin/catalogue`

Owner task: manage the public furniture catalogue items that visitors browse
before sending an enquiry.

Current controls:

- Owner-facing Catalogue header with Add catalogue item and View public
  catalogue actions.
- Catalogue overview counts for total items, published items, draft items, and
  image review attention.
- Search by item name.
- Filter by public status.
- Filter by category, with categories sorted alphabetically.
- Public-like catalogue item cards with calm image/missing-image state, item
  name, category, public status, image attention state, and edit action.
- One selected item editor for item details, category assignment, public
  status, display position, image upload, primary image, image alt text, and
  save.

Confusing or unnecessary controls:

- The lower-level listing, image upload, and image metadata panels still exist
  as protected implementation components, but they are no longer the primary
  `/admin/catalogue` owner experience.
- Standalone category management is not the target launch UX for SKR. Owners
  should assign categories/tags through catalogue or setup content, not maintain
  a separate taxonomy table as the normal workflow.

Controls to remove:

- Standalone manual taxonomy management should stay out of the primary owner
  workflow unless a hard product reason appears.
- Raw URL owner workflows must stay absent.
- Storage bucket/path owner workflows must stay absent from the Catalogue page.
- Fake item data must not be introduced.

Controls to merge:

- Listing metadata, category assignment, media upload, primary image, alt text,
  and public status are now merged into one selected-item editor.
- Categories/tags should be managed through catalogue/setup item tagging and
  assignments.
- Frontend category menus should derive from actual tagged or assigned,
  published content. Empty categories/tags should not appear, and derived lists
  should be sorted alphabetically.
- Future style/context filters should be derived from backed item fields or
  setup/catalogue tagging rather than a manual taxonomy manager.

Target owner-friendly model:

- Admin Catalogue should feel like the public catalogue page with admin
  controls.
- Use a public-like catalogue card grid.
- Provide one clear Add item action.
- Provide search, filter, and status controls.
- Open an edit item drawer or panel from a card.
- Item editor fields should include name, description, category, images,
  primary image, alt text, publish status, and save.
- Existing-category assignment may remain as a temporary backend-backed control
  until item-level tagging or category create-on-save exists.
- Style/context should be added only after a backed schema and protected
  read/write contract exists.
- Use furniture/event rental copy such as item, catalogue item, listing, image,
  public status, and enquiry context.

Backend constraints:

- Current internals still use `products`, `categories`, and `product_images`.
  Those names are existing database/API/RPC internals and should not be renamed
  in a UI redesign PR.
- Current backend support still has separate category records and product
  records with an existing category assignment. The owner editor can assign an
  existing category, but this PR does not add item-level category/tag
  create-on-save.
- Current reads expose category, product, and image summaries but do not expose
  a dedicated `style` or `context` item field.
- Current image metadata updates can save alt text, display position, and
  primary image without exposing storage bucket/path inputs. New image upload
  remains protected and server-controlled.
- Current writes are protected behind first-party admin routes, CSRF proof,
  owner/admin authorization, RLS, and RPC-backed persistence.
- Public catalogue reads remain server-side and read-only.
- Browser Supabase and service-role runtime paths remain forbidden.

Next implementation slice:

- Continue with Setups owner workflow decision and implementation.
- Add a later backend-backed item-level tagging or category create-on-save
  slice if owners need to create categories/tags from the item editor.
- If style/context is required for launch, add it as a reviewed schema and
  protected write/read contract slice before exposing it in the Catalogue
  editor.

### `/admin/setups`

Owner task: manage or review the public setup presentation that helps visitors
understand event furniture groupings before sending an enquiry.

Current controls:

- Setup presentation review explanation.
- Primary Manage catalogue action.
- Secondary View public setups action.
- Derived setup overview counts for published catalogue items available for
  setups, draft/hidden items excluded from public setups, and published items
  needing image or alt-text review.
- Public-like setup candidate cards derived from published Catalogue items,
  with item name, category, public status, image readiness, and Edit in
  Catalogue action.
- Calm empty state when no published setup candidates exist.

Confusing or unnecessary controls:

- The page must not imply setup-specific editing exists for launch.
- There is no real setup editor or setup-specific backend record.

Controls to remove:

- Do not add a fake setup editor.
- Do not add Add setup or Edit setup controls unless a real setup model exists.
- Do not add raw URL or storage bucket/path owner workflows.
- Do not add booking, reservation, event inventory, or fulfilment wording.

Controls to merge:

- For launch, setup changes happen through Catalogue item editing and Setups is
  a review/check page.
- Categories/tags for setup presentation should follow the Catalogue/Setup
  content tagging direction once backed. Frontend menus should derive from
  actual tagged or published content rather than empty manual taxonomy rows.
- If real setup records are added, setup edit controls should be separate from
  item editing only where setup-specific content exists.

Launch decision:

- Setups remain derived from published Catalogue items for launch.
- The owner edits setup content by editing the relevant Catalogue item.
- Real setup records/editor are deferred unless the owner has setup-specific
  content that cannot honestly be represented by Catalogue items.

Tradeoff:

- Derived Setups have the lowest implementation risk, avoid fake data, and use
  the existing protected catalogue backend.
- Real setup records would give better setup-specific titles, descriptions,
  grouping, tagging/context, and public display control, but require schema,
  RLS, protected read/write routes, tests, admin editor, and public read
  integration before the workflow is honest.

Backend constraints:

- Current Setups derives from protected Catalogue reads.
- No setup-specific write model exists today.
- Setup-specific tagging/context is not backed by schema/read/write support
  today and remains deferred.
- Any real setup record model must be added as a separate reviewed backend and
  admin UI slice.

Next implementation slice:

- n8n enquiry handoff UI/backend.
- If setup-specific content becomes necessary, implement backend first, then
  admin editor, then public rendering in a separate slice.

### `/admin/enquiry-email`

Owner task: understand whether public enquiries can be handed off for email
follow-up after SKR stores the enquiry.

Current controls:

- n8n handoff readiness status.
- Server-side webhook endpoint configured/not configured state without showing
  the endpoint value.
- Server-side signing configured/not configured state without showing the
  secret value.
- Last known delivery-log status when a protected delivery-log read is
  available.
- Link to Delivery Log.

Confusing or unnecessary controls:

- The page must not look like an editable provider settings UI. The owner needs
  readiness/status, not raw n8n or email provider configuration.

Controls to remove:

- No raw provider token fields.
- No webhook URL fields.
- No secret display.
- No fake send button or fake success state.
- No customer-facing notification controls.

Controls to merge:

- Merge readiness, last known delivery status, and recovery guidance into a
  single handoff readiness panel.

Target n8n direction:

- SKR stores the enquiry first.
- SKR triggers n8n from a server-side boundary after persistence succeeds.
- n8n sends the email.
- Optional HubSpot mirror can be added later after the email handoff is safe.
- The admin page should show n8n handoff readiness and status, not raw provider
  token or config UI.
- n8n workflow credentials and email recipients are owned in n8n, not edited
  from SKR admin.

Backend constraints:

- No live n8n workflow import, export, activation, execution, or mutation is
  approved by this document.
- n8n must remain server-side. Browser code must never call n8n directly.
- Webhook URLs and provider credentials must remain server-only and must not be
  displayed in admin UI or committed to the repo.
- The public quote route returns received after SKR persistence succeeds. It
  must not claim email delivery, final quote details, or confirmed rental fit.
- Handoff failures are recorded in Delivery Log using safe status/error
  categories.

Next implementation slice:

- Implemented in this slice: server-side n8n handoff trigger after persistence,
  safe not-configured/failure delivery-log writes, readiness UI, and docs.
- Keep HubSpot mirror optional and later.

### `/admin/delivery-log`

Owner task: inspect technical delivery attempts for enquiry handoff and know
whether a submitted enquiry reached the configured handoff path.

Current controls:

- Empty state when no delivery attempts exist.
- Technical table for attempted time, enquiry reference, handoff channel,
  status, and safe result/error category.

Confusing or unnecessary controls:

- None should be added for launch unless they directly support technical
  delivery troubleshooting.

Controls to remove:

- No customer-detail review link.
- No follow-up controls.
- No sales workflow language.
- No archive/retry/send controls until a real backend retry model exists.

Controls to merge:

- Keep channel, status, and safe result in one technical table. Do not expose
  customer messages or raw workflow data.

Backend constraints:

- Current delivery log records are bounded technical metadata.
- It must not expose full customer messages, requested item details, email
  bodies, raw provider payloads, headers, cookies, tokens, secrets, or raw
  workflow execution data.

Current implementation slice:

- Preserves this as a technical delivery log only.
- Adds useful empty state and failure details tied to the n8n handoff contract.
- Adds no retry controls because no reviewed retry backend exists.

## Implementation PR Sequence

1. Hero simplification plus clickable admin logo.
2. Catalogue owner workflow redesign.
3. Setups owner workflow decision and implementation.
4. n8n enquiry handoff UI and backend.
5. Google-only admin access management.
6. Chatbot mapping.
7. Hostinger/Coolify deployment and hosted UAT.

This sequence does not claim hosted staging readiness. Deployment, provider
configuration, live n8n mutation, Supabase Cloud actions, and hosted UAT remain
separate approval-gated work.
