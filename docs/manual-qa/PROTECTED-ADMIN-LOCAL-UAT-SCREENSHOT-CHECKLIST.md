# Protected Admin Local UAT Screenshot Checklist

Status: repo-local, admin-only, local UAT planning checklist.

Evidence status: [NOT EVIDENCE / NOT RECORDED]

Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]

Use this checklist before buying or configuring Hostinger VPS staging. It is a
manual protected-admin review plan only. It does not deploy, configure hosted
services, record owner approval, approve public launch, send email, call n8n,
create CRM flows, or change public site visuals.

For the real Supabase Auth sign-in path and required workspace/profile/
membership rows, use
`docs/manual-qa/PROTECTED-ADMIN-AUTHORISED-UAT-RUNBOOK.md` before attempting
authorised six-page owner CMS UAT.

Screenshots, if captured, are local working notes only. Do not commit generated
screenshots unless the owner separately approves a specific evidence path.

## Local Setup Prerequisites

1. Start from the intended local branch and a clean worktree.
2. Install repo dependencies if they are not already installed:

```powershell
npm install
cd website
npm install
cd ..
```

3. Configure local server-only env values outside git. Do not paste or commit
   real values. The protected admin walkthrough needs the local app to have
   the current server-side Supabase, catalogue, quote, and admin env names
   configured for the target local or reviewed hosted Supabase project:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CATALOGUE_WORKSPACE_ID`
- `QUOTE_WORKSPACE_ID`
- `ADMIN_TRUSTED_WORKSPACE_ID`
- `ADMIN_EXPECTED_ORIGIN`
- `ADMIN_EXPECTED_HOST`
- `ADMIN_CSRF_PROOF_SECRET`
- `QUOTE_ENQUIRY_EMAIL_PROVIDER`
- `QUOTE_ENQUIRY_EMAIL_RECIPIENT`
- `QUOTE_ENQUIRY_EMAIL_FROM`
- `RESEND_API_KEY` only when checking a Ready Resend handoff state

4. For local `http://localhost:3000`, `ADMIN_EXPECTED_ORIGIN` and
   `ADMIN_EXPECTED_HOST` must match the local browser origin and host used for
   the review. If another local port is used, update those local env values to
   match before sign-in.
5. Confirm an approved owner/admin Supabase Auth user, `admin_users` record,
   membership, and `ADMIN_TRUSTED_WORKSPACE_ID` are available for the workspace
   being reviewed.
6. Confirm hosted/local Supabase contains real workspace records for the review:
   catalogue categories, listings, listing image metadata, homepage Hero
   content, quote request records when triage context is needed, and delivery
   log rows only if delivery activity has actually occurred.
7. Do not configure `NEXT_PUBLIC_SKR_DEMO_CONTENT`. Public demo-content runtime
   support is removed and forbidden.
8. Do not read or use `website/chat-config.js`.
9. Start the local website:

```powershell
cd website
npm run dev
```

10. Optional route smoke from repo root:

```powershell
npm run local-uat:owner-flow
```

The local smoke helper may start the dev server if one is not already
reachable, checks a bounded owner-flow route set, confirms removed admin routes
return non-success, and does not capture screenshots. It is not a substitute
for the manual six-page visual UAT below.

## Screenshot Tooling Decision

A focused repo-local Playwright smoke is available for the protected admin
access gate only:

```powershell
cd website
npm run test:admin-access-playwright
```

It starts or reuses a local Next app, checks `/admin/login`, pre-auth `/admin`,
and pre-auth `/admin/catalogue`, and saves screenshots under:

```text
.tmp\admin-access-playwright\
```

Use it before continuing six-page owner CMS UAT to confirm the public
header/footer/chat/mobile nav are absent from admin access screens and the
protected route map is not exposed before authorisation.

No full six-page protected admin screenshot automation is currently available.
Do not add brittle broad automation for the manual owner CMS pass.

Use browser or operating-system screenshot tools manually. Store screenshots
outside the repo when possible, for example:

```text
Desktop\skr-admin-uat-screenshots\<YYYY-MM-DD>\
```

If screenshots must be saved under the repo during local work, use an ignored
temporary path such as:

```text
.tmp\admin-uat-screenshots\<YYYY-MM-DD>\
```

Never stage or commit generated screenshots unless separately approved.

Recommended screenshot naming:

```text
YYYY-MM-DD-admin-01-dashboard-desktop-1440.png
YYYY-MM-DD-admin-01-dashboard-tablet-768.png
YYYY-MM-DD-admin-01-dashboard-mobile-390.png
YYYY-MM-DD-admin-02-hero-desktop-1440.png
YYYY-MM-DD-admin-03-catalogue-desktop-1440.png
YYYY-MM-DD-admin-04-setups-desktop-1440.png
YYYY-MM-DD-admin-05-enquiry-email-desktop-1440.png
YYYY-MM-DD-admin-06-delivery-log-desktop-1440.png
```

Use the same pattern for additional states, for example
`YYYY-MM-DD-admin-03-catalogue-mobile-390-validation.png`.

## Routes To Visit

| Order | Page | Route | Primary UAT focus |
| --- | --- | --- | --- |
| 0 | Sign in | `/admin/login` | Owner sign-in, same-origin admin access, safe unavailable/unauthenticated states. |
| 1 | Dashboard | `/admin` | Six-page owner CMS overview, navigation, readiness summary, no removed admin links. |
| 2 | Hero | `/admin/hero` | Homepage hero content, image reference, enabled state, save clarity. |
| 3 | Catalogue | `/admin/catalogue` | Listing, category, image metadata, image upload, readiness warnings, visibility actions. |
| 4 | Setups | `/admin/setups` | Public `/listings` setup presentation derived from real catalogue records. |
| 5 | Enquiry Email | `/admin/enquiry-email` | Ready / Needs setup / Unavailable status framing for email handoff config. |
| 6 | Delivery Log | `/admin/delivery-log` | Metadata-only delivery attempts, privacy-safe empty and loaded states. |

The owner CMS scope is these six protected pages only. `/admin/login` and
`/admin/logout` support access control, but they are not additional owner CMS
pages.

## Viewports

Review every route at these widths:

| Viewport | Suggested size | What to verify |
| --- | --- | --- |
| Desktop | 1440 x 900 | Calm premium layout, clear hierarchy, no duplicate actions, tables/cards/forms are readable. |
| Tablet | 768 x 1024 | Navigation remains usable, cards/forms do not crowd, important actions stay visible. |
| Mobile | 390 x 844 | Text wraps cleanly, controls remain tappable, forms do not overflow, no horizontal scrolling. |

Also scan one narrower mobile pass around 360 px if time allows.

## Owner Workflow Checks

1. Before sign-in, visit `/admin/login`, `/admin`, and `/admin/catalogue`.
2. Confirm `/admin/login` is a polished protected-admin sign-in screen and does
   not show the public header, footer, chat widget, or mobile bottom nav.
3. Confirm unauthenticated, unavailable, or denied `/admin` and protected
   sub-route states do not expose links to Dashboard, Hero, Catalogue, Setups,
   Enquiry Email, Delivery Log, `/admin/media`, or `/admin/listings`; only
   safe sign-in and public-site recovery actions should appear.
4. Sign in through `/admin/login` using the approved local owner/admin account.
5. Confirm unauthenticated users are asked to sign in and authorised owners see
   the protected shell only after sign-in.
6. View Dashboard at `/admin`.
7. Review Hero at `/admin/hero`.
8. Review Catalogue listing, category, image metadata, and image upload areas
   at `/admin/catalogue`.
9. Review Setups at `/admin/setups`.
10. Review Enquiry Email status at `/admin/enquiry-email`.
11. Review Delivery Log at `/admin/delivery-log`.
12. Confirm no visible admin navigation, helper action, button, or link points
   to removed routes:
   - `/admin/media`
   - `/admin/listings`
   - `/admin/listings#...`
13. Confirm no ecommerce, cart, checkout, order, payment, purchase, booking,
    reservation, fulfilment, customer account, or custom CRM wording or flow
    appears.
14. Confirm no placeholder/dead "pending backend" UI appears.
15. Confirm no fake, demo, sample, synthetic, or fallback content dependency is
    required to make the admin pages look populated.
16. Confirm empty states are honest, useful, and specific to the protected page.
17. Confirm no public visual redesign is implied or required by the admin UAT.

## Page-By-Page Checks

### Dashboard `/admin`

- Confirm the shell feels premium, calm, coherent, and owner-ready.
- Confirm navigation lists Dashboard, Hero, Catalogue, Setups, Enquiry Email,
  and Delivery Log as the six CMS pages.
- Confirm dashboard cards summarize real admin work without noisy release or
  phase language.
- Confirm any empty/unavailable admin data state explains the local setup gap
  without pretending content exists.
- Confirm actions route to the six preserved admin pages only.

### Hero `/admin/hero`

- Confirm Hero fields are understandable to an owner: eyebrow, headline, body,
  CTA labels/hrefs, image URL/reference, image alt text, and enabled state.
- Confirm routine save actions are visually/copy-wise separate from visibility
  or enabled-state decisions.
- Confirm validation and error copy is useful without exposing SQL, secrets,
  workspace IDs, cookies, tokens, provider details, or stack traces.
- Confirm no public homepage layout/design changes are requested during this
  UAT; only protected admin content management is under review.

### Catalogue `/admin/catalogue`

- Confirm listing management, category management, image metadata management,
  and image upload are present in one protected Catalogue page.
- Confirm readiness copy is compact and factual, not repetitive or AI-shaped.
- Confirm factual readiness checks remain visible: missing category, missing
  descriptions, missing rental unit, draft/not-public state, image count,
  primary image, alt text, and archived media where relevant.
- Confirm routine save controls are separated from publish, draft, visibility,
  archive, primary-image, active/archive, and upload-style actions.
- Confirm helper actions target `/admin/catalogue` anchors only and never
  `/admin/media`, `/admin/listings`, or `/admin/listings#...`.
- Confirm public preview links, if present, go to public catalogue/listing
  routes and do not expose protected internals.
- Confirm no fake/demo/sample listing, category, or setup data is required.

### Setups `/admin/setups`

- Confirm the page explains that public setup presentation derives from real
  published catalogue records on `/listings`.
- Confirm setup empty states are useful if records are missing or unpublished.
- Confirm the page does not invent styled setup examples, fake collections, or
  sample inventory.
- Confirm any links stay within `/admin/setups`, `/admin/catalogue` anchors, or
  public `/listings` preview paths as appropriate.

### Enquiry Email `/admin/enquiry-email`

- Confirm status framing reads as a real configuration state, such as Ready,
  Needs setup, or Unavailable.
- Confirm missing recipient, from address, provider, or API key states are
  named by configuration category only and do not expose env values.
- Confirm the page does not offer editable email settings, send controls,
  outbound messaging, customer messaging, or CRM behavior.
- Confirm a safe admin-only path to Delivery Log is visible if present.

### Delivery Log `/admin/delivery-log`

- Confirm empty copy says no enquiry email delivery attempts have been recorded
  yet, or equivalent current wording.
- Confirm loaded rows are metadata-only: provider/status, redacted recipient,
  provider message id or safe error code, request reference, and timestamps.
- Confirm the page does not show full customer messages, full email bodies, raw
  provider payloads, headers, cookies, tokens, secrets, provider API responses,
  or private Supabase details.
- Confirm the page does not become a quote inbox, CRM, mailbox, support queue,
  or customer messaging surface.

## Cross-Page Visual Checks

- Forms, cards, tables, status labels, buttons, and admin explanations should
  feel consistent across all six pages.
- Empty states should be quiet and useful, not decorative or noisy.
- Primary actions should be obvious; duplicate CTAs should not compete.
- Dangerous or visibility-changing actions should be visually/copy-wise clear.
- Mobile and tablet layouts should avoid overlap, clipped text, unreadable
  tables, horizontal overflow, and tiny tap targets.
- Status labels should explain admin reality without placeholder language.

## Finding Notes

Do not record real secrets, customer-private data, raw email payloads, provider
tokens, `.env` values, or unredacted screenshots in repo files.

Use a local note outside git or a temporary ignored file for working findings.
Recommended finding fields:

| Field | Local note |
| --- | --- |
| Page | Dashboard / Hero / Catalogue / Setups / Enquiry Email / Delivery Log |
| Viewport | Desktop / Tablet / Mobile |
| Finding | What looked broken, noisy, dead, confusing, or launch-blocking |
| Severity | P0 launch blocker / P1 before launch / P2 after launch |
| Suggested file/route | Local code path or route likely affected |
| Screenshot | Local filename only; do not commit screenshot |

If launch-blocking admin UI issues are found, create a separate protected
admin-only correction PR. Do not change public visuals as part of this UAT
checklist.
