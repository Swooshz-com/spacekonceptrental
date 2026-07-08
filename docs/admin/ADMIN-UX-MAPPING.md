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
- Advanced category details disclosure for the existing category write panel.

Confusing or unnecessary controls:

- The lower-level listing, image upload, and image metadata panels still exist
  as protected implementation components, but they are no longer the primary
  `/admin/catalogue` owner experience.
- The existing backend still has separate category records, so full category
  creation/editing remains behind an Advanced category details disclosure.

Controls to remove:

- Standalone manual taxonomy management should stay out of the primary owner
  workflow unless a hard product reason appears.
- Raw URL owner workflows must stay absent.
- Storage bucket/path owner workflows must stay absent from the Catalogue page.
- Fake item data must not be introduced.

Controls to merge:

- Listing metadata, category assignment, media upload, primary image, alt text,
  and public status are now merged into one selected-item editor.
- Categories are derived from item/category assignments and sorted
  alphabetically for browsing and filtering.
- Future style/context filters should be derived from backed item fields rather
  than a manual taxonomy manager.

Target owner-friendly model:

- Admin Catalogue should feel like the public catalogue page with admin
  controls.
- Use a public-like catalogue card grid.
- Provide one clear Add item action.
- Provide search, filter, and status controls.
- Open an edit item drawer or panel from a card.
- Item editor fields should include name, description, category, images,
  primary image, alt text, publish status, and save.
- Style/context should be added only after a backed schema and protected
  read/write contract exists.
- Use furniture/event rental copy such as item, catalogue item, listing, image,
  public status, and enquiry context.

Backend constraints:

- Current internals still use `products`, `categories`, and `product_images`.
  Those names are existing database/API/RPC internals and should not be renamed
  in a UI redesign PR.
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
- If style/context is required for launch, add it as a reviewed schema and
  protected write/read contract slice before exposing it in the Catalogue
  editor.

### `/admin/setups`

Owner task: manage or review the public setup presentation that helps visitors
understand event furniture groupings before sending an enquiry.

Current controls:

- Current setup source explanation.
- Link to manage Catalogue.
- Link to view public setups.
- Published setup candidates derived from published catalogue records.

Confusing or unnecessary controls:

- The page title implies setup management, but the current implementation is
  only a derived review surface.
- There is no real setup editor or setup-specific backend record.

Controls to remove:

- Do not add a fake setup editor.
- Do not add booking, reservation, event inventory, or fulfilment wording.

Controls to merge:

- If launch keeps derived setups, merge setup changes into Catalogue item
  editing and make Setups a review/check page.
- If real setup records are added, setup edit controls should be separate from
  item editing only where setup-specific content exists.

Launch direction options:

Option A: derive Setups from Catalogue items.

- Pros: lowest implementation risk, no fake data, uses existing protected
  catalogue backend, keeps launch scope narrow.
- Cons: limited layout/content control for setup-specific storytelling.
- Best fit if launch only needs public-like setup cards sourced from published
  catalogue items.

Option B: add real setup records with a setup-specific editor.

- Pros: better control over setup titles, descriptions, images, grouping, and
  public display.
- Cons: requires schema, RLS, protected read/write routes, tests, admin editor,
  and public read integration before it is honest.
- Best fit only if owner has real setup content that cannot be represented by
  catalogue items.

Target direction:

- Keep Setups derived from Catalogue for launch unless the owner confirms a
  hard need for setup-specific records.
- Show public-like setup cards.
- Add/edit setup only if the backend supports real setup records.

Backend constraints:

- Current Setups derives from protected catalogue reads.
- No setup-specific write model exists today.
- Any real setup record model must be added as a separate reviewed backend and
  admin UI slice.

Next implementation slice:

- Make an explicit launch choice: derived Setups for launch, or a real setup
  schema/editor PR.
- If derived, improve the review UI and point edits back to Catalogue.
- If real records, implement backend first, then admin editor, then public
  rendering.

### `/admin/enquiry-email`

Owner task: understand whether public enquiries can be handed off for email
follow-up after SKR stores the enquiry.

Current controls:

- Environment-managed provider status.
- Environment-managed recipient status.
- Provider name.
- Redacted recipient when configured.
- Link to Delivery Log.

Confusing or unnecessary controls:

- The current page is safer than an editable provider settings UI, but the
  target launch direction should be framed around enquiry handoff readiness
  rather than raw provider configuration.

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

Backend constraints:

- No live n8n workflow import, export, activation, execution, or mutation is
  approved by this document.
- n8n must remain server-side. Browser code must never call n8n directly.
- Webhook URLs and provider credentials must remain server-only and must not be
  displayed in admin UI or committed to the repo.
- The public quote route must not claim send success unless persistence and
  handoff are actually complete.

Next implementation slice:

- Replace provider-centric copy with n8n handoff readiness copy after the
  backend handoff contract exists.
- Implement the server-side persisted-enquiry-to-n8n trigger as a separate
  backend slice with safe failure handling and delivery log writes.
- Keep HubSpot mirror optional and later.

### `/admin/delivery-log`

Owner task: inspect technical delivery attempts for enquiry handoff and know
whether a submitted enquiry reached the configured handoff path.

Current controls:

- Empty state when no delivery attempts exist.
- Technical table for attempted time, reference, redacted recipient, status,
  and provider result.

Confusing or unnecessary controls:

- None should be added for launch unless they directly support technical
  delivery troubleshooting.

Controls to remove:

- No customer-detail review link.
- No follow-up controls.
- No sales workflow language.
- No archive/retry/send controls until a real backend retry model exists.

Controls to merge:

- When n8n handoff exists, merge provider result and n8n attempt result into a
  clear technical status column.

Backend constraints:

- Current delivery log records are bounded technical metadata.
- It must not expose full customer messages, requested item details, email
  bodies, raw provider payloads, headers, cookies, tokens, secrets, or raw
  workflow execution data.

Next implementation slice:

- Preserve this as a technical delivery log only.
- Add useful empty state and failure details tied to the n8n handoff contract.
- Add retry controls only after a reviewed retry backend exists.

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
