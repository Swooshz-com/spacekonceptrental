# SKR Admin UI Pre-Launch Quality Audit

Date: 2026-07-03

Branch: `codex/skr-admin-ui-prelaunch-quality-audit`

Base inspected: `ba57ba902b8759c0ee3ca5ef0a98598b78f62bf7`
(`origin/main` after the hosted deployment execution runbook update).

This is a docs-only protected admin UI audit and correction plan. It does not
change public routes, public CSS, public layout, public copy, quote API, email
handoff behavior, Delivery Log behavior, Supabase migrations, auth/session
behavior, chat API, catalogue/listing/detail implementation, product runtime
behavior, or protected admin runtime behavior.

## Instruction Sources Used

- `AGENTS.md`
- `docs/agent-playbooks/INDEX.md`
- `docs/agent-playbooks/project-completion-audit.md`
- `docs/agent-playbooks/safety-gates.md`
- `docs/agent-playbooks/local-docs.md`
- `docs/agent-playbooks/git-completion.md`
- `docs/PHASE-STATUS.md`
- `docs/PHASE-ROADMAP.md`
- `docs/checklists/README.md`
- `docs/SAFETY-BOUNDARIES.md`
- `docs/DECISION-LOG.md`
- `docs/PROJECT-CONTEXT.md`
- `docs/SKR-OWNER-MVP-CURRENT-STATE-AUDIT.md`
- `docs/SKR-LAUNCH-READINESS-FINAL-GAP-AUDIT.md`
- Product Design skill: `product-design:audit`
- UI/UX skill: `ai-agent-toolkit:ui-ux-secure-frontend-design`

`MEMORY.md` does not exist in this checkout.

## Audit Scope

Protected owner CMS pages audited:

1. Dashboard - `/admin`
2. Hero - `/admin/hero`
3. Catalogue - `/admin/catalogue`
4. Setups - `/admin/setups`
5. Enquiry Email - `/admin/enquiry-email`
6. Delivery Log - `/admin/delivery-log`

Support routes such as `/admin/login` and `/admin/logout` were treated as
supporting auth surfaces only. Removed historical admin routes were checked
only when current admin UI links still referenced them.

## Evidence And Screenshot Status

Evidence was source review of the implemented protected admin routes,
components, CSS module, tests, and current launch-readiness docs:

- `website/app/admin/page.tsx`
- `website/app/admin/hero/page.tsx`
- `website/app/admin/catalogue/page.tsx`
- `website/app/admin/setups/page.tsx`
- `website/app/admin/enquiry-email/page.tsx`
- `website/app/admin/delivery-log/page.tsx`
- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/components/admin/hero-content-management-panel.tsx`
- `website/components/admin/listing-management-panel.tsx`
- `website/components/admin/category-management-panel.tsx`
- `website/components/admin/listing-image-upload-panel.tsx`
- `website/components/admin/listing-image-metadata-management-panel.tsx`

Screenshots were not captured for this audit. The current request allowed
screenshots only if existing repo-local screenshot tooling safely supported the
task without committing generated artifacts. No narrow documented screenshot
helper was found for this protected six-page admin UI audit, and protected
runtime/auth state may depend on local env/session setup. This report therefore
does not claim pixel-perfect visual verification, keyboard verification, or
full WCAG compliance.

## Overall Assessment

The six-page CMS scope is preserved at the route level. The current protected
admin shell is calm, coherent, and aligned with the owner-MVP direction:
Dashboard, Hero, Catalogue, Setups, Enquiry Email, and Delivery Log are the
only protected owner CMS pages under the scoped admin workspace.

The shell and navigation feel more premium than the embedded Catalogue panels.
Dashboard, Setups, Enquiry Email, and Delivery Log are quiet and bounded, but
Catalogue still carries older implementation artifacts: dense inline styles,
duplicated helper text, repeated readiness summaries, stale links to removed
admin routes, and too many repeated per-record actions. Those issues make the
owner CMS feel unfinished before public launch even though the underlying scope
and safety boundaries are intact.

No public visual change is recommended by this audit. All proposed corrections
are admin-only and should stay inside protected admin routes/components.

## Page-By-Page Findings

### 1. Dashboard - `/admin`

Health: mostly launch-grade after the route-link issue is fixed in shared
Catalogue helpers.

Strengths:

- The owner workspace uses a calm two-column shell, restrained metrics, and a
clear six-page nav.
- The page explains the CMS scope without introducing quote inbox, CRM,
booking, payment, checkout, customer account, or order language.
- Empty catalogue data has a quiet fallback message instead of fake sample
records.

Risks:

- Dashboard tables use role-based div tables rather than native table markup.
  This is acceptable for the current small summary, but should be verified by
  keyboard and assistive technology before launch.
- On narrow mobile widths, the shared `.dataTable` CSS hides columns after the
  second column. That preserves layout but can remove useful status context.

Likely affected files for correction:

- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`

### 2. Hero - `/admin/hero`

Health: functional, but should be polished before launch.

Strengths:

- Hero is no longer a dead placeholder. It supports headline, body, CTA labels,
  CTA hrefs, image URL/reference, alt text, and enabled state through the
  protected admin boundary.
- The form keeps media upload/storage deferred and tells the owner that the
  image reference must already be reviewed.
- Errors stay generic and avoid exposing internals.

Risks:

- The page has no admin-side preview or compact summary of the public Hero
  state. Owners must save and then inspect the public homepage to understand
  the visual result.
- The form uses one long stack of inline-styled fields. It works, but it feels
  more generated than the admin shell around it.
- Status colors are hard-coded green/red/blue instead of using the admin shell
  tone tokens.

Likely affected files for correction:

- `website/components/admin/hero-content-management-panel.tsx`
- `website/components/admin/hero-content-management-panel.test.tsx`
- `website/app/admin/protected-admin-shell.module.css`

### 3. Catalogue - `/admin/catalogue`

Health: not launch-grade until the P0 dead links are fixed and the panel is
reduced.

Strengths:

- Catalogue is the correct single owner workspace for listing, category, image
  upload, and image metadata management.
- The page keeps ecommerce, checkout, booking, payment, and custom CRM scope
  out.
- Public-ready cues help owners understand why listings need category, copy,
  rental-unit, image, and alt-text review before publication.

Risks:

- Current Catalogue cards still link to removed admin routes:
  `/admin/media`, `/admin/listings`, and `/admin/listings#listing-form-*`.
  Those routes are intentionally absent from the six-page CMS and are checked
  as removed by local smoke tooling.
- The listing summary repeats the same readiness counts in multiple adjacent
  paragraphs, including duplicate strong and non-strong variants.
- The page has four large management panels in one scroll: listing metadata,
  category metadata, upload, and image metadata. This preserves the six-page
  scope but makes the single Catalogue page feel heavy and harder to scan.
- Per-listing cards repeat "View public listing", "Edit listing details",
  "Manage images", and "Return to top" controls. The repeated actions create
  noise, and some are currently stale.
- Archive and visibility actions sit beside safe save actions with similar
  button weight. That is risky for owner confidence even if the protected
  write boundaries are correct.
- Inline styling dominates these panels, so they do not fully inherit the calm
  admin shell system.

Likely affected files for correction:

- `website/components/admin/listing-management-panel.tsx`
- `website/components/admin/listing-management-panel.test.tsx`
- `website/components/admin/category-management-panel.tsx`
- `website/components/admin/category-management-panel.test.tsx`
- `website/components/admin/listing-image-upload-panel.tsx`
- `website/components/admin/listing-image-upload-panel.test.tsx`
- `website/components/admin/listing-image-metadata-management-panel.tsx`
- `website/components/admin/listing-image-metadata-management-panel.test.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`

### 4. Setups - `/admin/setups`

Health: acceptable for launch as a derived read-only admin page.

Strengths:

- The page honestly explains that public setups derive from published catalogue
  records and points owners back to Catalogue for edits.
- Empty state copy is useful and does not pretend setup-specific storage
  exists.
- It preserves the six-page CMS scope and avoids adding a new setup editor
  before storage exists.

Risks:

- It shows only up to five published setup candidates, which is fine for a
  preview but should be labeled as a limited preview if the owner has more
  launch records.
- The public `/listings` link is useful, but future correction should keep it
  as a preview action rather than turning this page into a public visual polish
  surface.

Likely affected files for correction:

- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`

### 5. Enquiry Email - `/admin/enquiry-email`

Health: acceptable, with small clarity polish recommended.

Strengths:

- The page correctly stays environment-managed and does not add editable email
  settings, send controls, outbound messaging, or CRM behavior.
- It shows provider and recipient status without exposing secrets.
- The single centered card is calm and not overloaded.

Risks:

- The page uses the same "empty state" visual pattern even when it is showing a
  real configuration status. That makes a live status surface feel like a
  placeholder.
- Provider/recipient labels are clear but could be more operator-friendly by
  separating "ready to send" from "configured/missing".
- It has no direct admin-only link to Delivery Log, even though the two pages
  are the owner workflow pair for email handoff visibility.

Likely affected files for correction:

- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`

### 6. Delivery Log - `/admin/delivery-log`

Health: acceptable in data scope, but mobile/readability polish should happen
before launch.

Strengths:

- The page is technical-only, bounded, and aligned with the privacy model.
- It does not expose full customer messages, email bodies, raw provider
  payloads, headers, cookies, tokens, secrets, or provider API responses in the
  reviewed source.
- Empty state is calm and does not invent delivery records.

Risks:

- Empty copy says records appear "once delivery logging exists", but delivery
  logging now exists. The copy should say that no delivery attempts have been
  recorded yet.
- The shared table CSS hides all columns after the second column on mobile.
  For Delivery Log, this can remove recipient, status, and provider result
  context exactly where an owner may need it.
- Technical labels such as provider result are safe, but should stay bounded
  and plain. Do not expand this into a quote inbox.

Likely affected files for correction:

- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`

## Prioritized Correction Plan

### P0 Launch-Blocking Admin UI Issues

| Finding | Why it blocks launch | Recommended correction | Likely affected files/routes |
| --- | --- | --- | --- |
| Dead links to removed admin routes from current Catalogue cards. | The six-page CMS intentionally removed `/admin/media` and `/admin/listings`, but current Catalogue helper actions still send owners there. That creates a broken admin workflow and violates the preserved six-page CMS scope. | Change current in-page actions to `/admin/catalogue` anchors only, for example `/admin/catalogue#update-listing-image-metadata` and `/admin/catalogue#listing-form-*`; remove or rename "Return to top" so it targets `/admin/catalogue` or an in-page anchor. Update tests that currently expect removed routes. | `website/components/admin/listing-management-panel.tsx`, `website/components/admin/listing-management-panel.test.tsx`, `website/components/admin/listing-image-metadata-management-panel.tsx`, `website/components/admin/listing-image-metadata-management-panel.test.tsx`, route `/admin/catalogue`. |

### P1 Should-Fix Before Public Launch

| Finding | Why it matters before launch | Recommended correction | Likely affected files/routes |
| --- | --- | --- | --- |
| Catalogue page is too dense for owner-ready daily use. | The page preserves scope, but four large panels and repeated helper copy make it feel unfinished and AI-generated. | Keep all controls on `/admin/catalogue`, but introduce admin-only section navigation or collapsible groups for Listings, Categories, Upload, and Image Metadata. Put the most common owner task first and reduce repetitive explanatory copy. | `website/app/admin/protected-admin-shell.tsx`, `website/components/admin/listing-management-panel.tsx`, `website/components/admin/category-management-panel.tsx`, `website/components/admin/listing-image-upload-panel.tsx`, `website/components/admin/listing-image-metadata-management-panel.tsx`, route `/admin/catalogue`. |
| Listing readiness summary repeats the same counts and warnings. | Duplicate adjacent paragraphs make the page feel generated and reduce trust in the owner CMS. | Collapse readiness copy to one metric row plus one actionable warning list. Keep the factual readiness checks, remove duplicate strong/non-strong variants. | `website/components/admin/listing-management-panel.tsx`, `website/components/admin/listing-management-panel.test.tsx`. |
| Archive and publish actions have the same visual weight as routine save actions. | Owners can mistake visibility/archive changes for routine edits. | Add admin-only confirmation, clearer destructive/visibility tone, and copy that distinguishes "Save metadata" from "Change public visibility" and "Archive". Keep existing protected write boundaries and CSRF behavior. | `website/components/admin/listing-management-panel.tsx`, `website/components/admin/category-management-panel.tsx`, `website/components/admin/listing-image-metadata-management-panel.tsx`, related tests, route `/admin/catalogue`. |
| Embedded admin panels use heavy inline styling and legacy `premium-*` overrides. | The shell feels coherent, but nested panels do not fully share the admin design system. | Move repeated panel, status, field, helper, and action styling into admin-owned CSS/module classes or shared admin panel components. Keep public CSS untouched. | `website/app/admin/protected-admin-shell.module.css`, `website/components/admin/*.tsx`, related tests. |
| Hero page lacks a protected admin preview/summary. | Owners need confidence before launch without editing public visuals. | Add an admin-only preview/summary card that mirrors the current Hero fields enough to catch copy, CTA, image URL/reference, enabled state, and alt text issues. Do not change public Hero rendering. | `website/components/admin/hero-content-management-panel.tsx`, `website/components/admin/hero-content-management-panel.test.tsx`, route `/admin/hero`. |
| Mobile Delivery Log table hides critical status columns. | Mobile/tablet admin review should preserve timestamp/reference/status/result context. | Replace generic column hiding with responsive row cards or per-row stacked details for Delivery Log. Keep bounded metadata only. | `website/app/admin/protected-admin-shell.tsx`, `website/app/admin/protected-admin-shell.module.css`, route `/admin/delivery-log`. |
| Enquiry Email status uses empty-state treatment for a real configuration page. | It reads as placeholder-like even when configuration is present. | Convert to a compact status panel with "Ready", "Needs setup", or "Unavailable" framing, plus a safe link to Delivery Log. Do not add editable settings or send controls. | `website/app/admin/protected-admin-shell.tsx`, `website/app/admin/protected-admin-shell.module.css`, route `/admin/enquiry-email`. |
| Delivery Log empty copy is stale. | "Once delivery logging exists" is now inaccurate and makes the page feel unfinished. | Change empty copy to "No enquiry email delivery attempts have been recorded yet." Keep privacy-safe technical scope. | `website/app/admin/protected-admin-shell.tsx`, `website/app/admin/protected-admin-shell.test.tsx`, route `/admin/delivery-log`. |

### P2 Nice-To-Have After Launch

| Finding | Why it can defer | Recommended correction | Likely affected files/routes |
| --- | --- | --- | --- |
| Dashboard summary uses div-based table roles. | Current summary is small and readable, but assistive tech behavior should be checked later. | Consider native tables or stacked summary cards for tabular admin data. | `website/app/admin/protected-admin-shell.tsx`, `website/app/admin/protected-admin-shell.module.css`, route `/admin`. |
| Setups preview is capped at five records without explicit "preview" wording. | It does not block launch because Setups intentionally derive from Catalogue. | Label it as a preview and link to Catalogue for full management. | `website/app/admin/protected-admin-shell.tsx`, route `/admin/setups`. |
| Admin shell uses handmade SVG empty-state icons. | They are harmless and internal, but the design guidance prefers an icon library where available. | If an icon library is already present later, replace with shared admin icons. Do not add a dependency just for this. | `website/app/admin/protected-admin-shell.tsx`. |
| Status labels could be more consistent across pages. | Labels are understandable now, but consistency would make owner review faster. | Standardize Published/Draft/Hidden, Ready/Needs setup, Sent/Failed, and Unavailable label treatment across admin pages. | `website/app/admin/protected-admin-shell.tsx`, `website/components/admin/*.tsx`. |

## Admin-Only Correction Boundaries

Future correction PRs should stay within protected admin UI files and tests.
Recommended safe paths:

- `website/app/admin/protected-admin-shell.tsx`
- `website/app/admin/protected-admin-shell.module.css`
- `website/app/admin/protected-admin-shell.test.tsx`
- `website/components/admin/hero-content-management-panel.tsx`
- `website/components/admin/hero-content-management-panel.test.tsx`
- `website/components/admin/listing-management-panel.tsx`
- `website/components/admin/listing-management-panel.test.tsx`
- `website/components/admin/category-management-panel.tsx`
- `website/components/admin/category-management-panel.test.tsx`
- `website/components/admin/listing-image-upload-panel.tsx`
- `website/components/admin/listing-image-upload-panel.test.tsx`
- `website/components/admin/listing-image-metadata-management-panel.tsx`
- `website/components/admin/listing-image-metadata-management-panel.test.tsx`

Do not change:

- Public CSS/layout/copy/design.
- Public routes.
- Quote API.
- Email handoff behavior.
- Delivery Log behavior or metadata contract.
- Supabase migrations.
- Auth/session behavior.
- Chat API.
- Catalogue/listing/detail implementation.
- Product/runtime behavior.

## Scope Boundary Confirmation

- Public visual files changed by this audit: No.
- Public route files changed by this audit: No.
- App/runtime behavior changed by this audit: No.
- Protected admin runtime behavior changed by this audit: No.
- Quote API or email handoff behavior changed by this audit: No.
- Delivery Log behavior changed by this audit: No.
- Supabase migrations changed by this audit: No.
- Auth/session behavior changed by this audit: No.
- Secrets, env values, private values, or generated local outputs committed by
  this audit: No.
- Generated screenshot output committed: No.
- Repo map created: No.
- `MEMORY.md` changed: No - no memory file was needed.

## Validation Plan

Required validation for this docs-only audit PR:

```powershell
git diff --check
git diff --cached --check
npm run validate:local-release-candidate
```

Repo-local docs-only PR guidance also requires website static validation:

```powershell
cd website
npm test
npm run typecheck
npm run build
cd ..
```

This audit is docs-only, but the website validation commands remain relevant
because `AGENTS.md` requires them for docs-only PRs with static tests. They do
not prove hosted launch readiness, owner approval, provider setup, live quote
delivery, production traffic readiness, or public visual acceptance.
