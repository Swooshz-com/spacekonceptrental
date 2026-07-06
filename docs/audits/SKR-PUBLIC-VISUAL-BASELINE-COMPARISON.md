# SKR Public Visual Baseline Comparison

Status: local screenshot comparison with one narrow protected-admin CSS
compatibility fix required to render current admin pre-auth captures under the
webpack dev server.

This report does not approve deployment, restore demo content, or record owner
acceptance. Screenshot artifacts are local-only and must not be committed unless
separately approved.

## Sources Compared

| Reference | Commit | Purpose |
| --- | --- | --- |
| Baseline candidate A | `731a534b05a97927d564cefab066055d99ae3608` | Main after the production dependency fallback audit, before public demo runtime removal. |
| Baseline candidate B | `8f3343ceebf92c5b87462d5af4e8d0aa17424224` | Main after public demo runtime removal. |
| Current | `7767af8425bcd72bfa195b0941ece8e0d5bd4b1c` plus the admin CSS module compatibility fix in this branch | Admin access-shell fix branch state used for current public and admin pre-auth comparison. |

Temporary worktrees were used only to capture screenshots. Main was not
reverted and old commits were not restored into the current branch.

## Capture Scope

Viewports captured:

| Viewport | Size |
| --- | --- |
| Desktop | `1440 x 900` |
| Tablet | `768 x 1024` |
| Mobile | `390 x 844` |

Public routes captured for each reference:

- `/`
- `/catalogue`
- `/listings`
- `/quote`
- `/about`
- `/contact`

Current-only admin pre-auth routes captured:

- `/admin/login`
- `/admin`
- `/admin/catalogue`

Local screenshot and metrics artifact paths:

- `.tmp/visual-baseline-731a534/`
- `.tmp/visual-baseline-8f3343c/`
- `.tmp/visual-current/`

The focused Playwright capture passed for all three capture sets. Current
screenshots include `desktop-home-chat-open.png` to verify the desktop chat
panel opens on click, and current admin screenshots include
`desktop-admin-login.png`, `desktop-admin.png`, and
`desktop-admin-catalogue.png`.

## Findings

| Area | Classification | Evidence | Recommendation |
| --- | --- | --- | --- |
| Home hero width | Current intended behavior / needs user decision | Desktop metrics match baseline A, baseline B, and current: hero width `1440`, hero media width `1310`, hero height `683.1875`. No public screenshot delta was found between baseline B and current. | Do not treat this as a regression from the admin shell fix. If the owner expects a more full-bleed hero than both baselines, handle it as a narrow visual decision in the next public polish PR. |
| Editorial section rhythm | Expected demo-removal difference plus needs user decision | Baseline A shows demo-backed category cards on home. Baseline B and current show honest empty category and catalogue states. Spacing around the hero and Advantage section matched across captures. | Keep honest empty states. Polish their rhythm and density without restoring demo records. |
| Home category content | Expected change from removing demo content | Baseline A renders demo category cards such as Seating, Tables, Lighting, and Decor and accents when real records are unavailable. Baseline B/current correctly remove those fake records and show an empty category state. | Do not restore demo runtime content. Populate hosted Supabase records for production, or keep the honest empty state until records exist. |
| Catalogue empty state alignment | Data-dependent empty state issue | Desktop `/catalogue` empty state is offset about `141px` from viewport center in baseline A, baseline B, and current because it sits beside the filter rail. It looks awkward with no records. | Center and polish the no-records state when filters have no real data, while preserving real-data catalogue behavior. |
| Hardcoded style pills | Data-dependent empty state issue | `/catalogue` shows Mid-Century Modern, Minimalist, and Brutalist in baseline A, baseline B, and current despite no real records. | Derive public style/category filters only from real data, or hide unavailable filter groups in empty states. |
| Hardcoded setup pills | Data-dependent empty state issue | `/listings` shows All Setups, Weddings, Corporate Summits, Intimate Dining, and Lounges in baseline A, baseline B, and current despite no real setup records. | Derive setup filters from real setup records, keeping only a useful all-state if real setup data exists. |
| Quote count | Confirmed regression / robustness gap | Current capture intentionally seeded stale local selection data with quantity `597`; the header rendered `Request Quote 597` across public routes. Baselines without injected storage showed `0`. | Add a narrow local selection sanity guard: dedupe, reject malformed entries, clear invalid/stale data, and prevent absurd counts. Keep quote as enquiry selection only. |
| Chatbot open behavior | Current intended behavior on desktop; manual follow-up still needed | Current desktop capture opened the chat panel successfully on click in `desktop-home-chat-open.png`. The reported local bug was not reproduced by Playwright desktop. | Keep a manual Chrome/mobile cache check in the next fix pass. If backend config is unavailable, the panel should still open with a safe unavailable state. |
| About and Contact visibility | Needs user decision | `/about` and `/contact` exist in baseline A, baseline B, and current, and code/tests still include nav links. `docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md` describes core public route groups but does not explicitly list dedicated About/Contact groups. | Confirm launch IA. If About/Contact are not part of launch navigation, hide active nav/footer/mobile links in a separate narrow PR without inventing new Contact/About scope. |
| Public CSS/layout effect from admin shell fix | Current intended behavior | Public screenshots and desktop hero metrics match baseline B after the route-aware admin shell change. | No evidence that the admin route shell isolation changed public layout in this capture set. |
| Admin pre-auth screens | Current intended behavior after narrow CSS fix | Current `/admin/login`, `/admin`, and `/admin/catalogue` screenshots render isolated protected-admin screens. Public header/footer/chat/mobile nav are absent, and protected owner CMS route shortcuts are absent before authorisation. | Keep the CSS module compatibility fix. Authorised admin UAT still requires real Supabase Auth and admin membership records; do not fake it. |

## Minimal Fix Included

The first current admin capture showed `/admin` and `/admin/catalogue` blocked
by a CSS Modules purity error from the selector
`:global(body:has(.skr-admin-workspace))` in
`website/app/admin/protected-admin-shell.module.css`. The report branch removes
that global body selector pattern and keeps the typography overrides scoped to
the local admin workspace class.

This is protected-admin-only. It does not change public routes, public copy,
public CSS direction, quote API behavior, email handoff behavior, Delivery Log
behavior, auth/session behavior, or Supabase migrations.

## Recommended Next Fix

1. Fix quote selection count sanity first, because the `597` header count is a
   clear public trust issue and can be reproduced with malformed/stale local
   selection data.
2. Remove hardcoded public style/setup filter fallbacks from no-data states.
   Filters should come from real hosted records or be hidden until real records
   exist.
3. Center and polish empty catalogue/listings/setup states for real no-data
   conditions without inventing products, categories, setups, or sample content.
4. Ask for an owner decision on About/Contact launch navigation. Keep routes if
   they remain approved; otherwise hide active public nav/footer/mobile links in
   a narrow IA PR.
5. Treat the hero/full-bleed concern as a design decision rather than a proven
   current-vs-baseline regression. Any adjustment should preserve the approved
   visual direction and must not restore demo category cards.
6. Recheck chatbot opening manually in the owner's browser and on mobile,
   because desktop Playwright opened the panel successfully.

Do not restore `NEXT_PUBLIC_SKR_DEMO_CONTENT`, demo products, demo categories,
demo setup records, sample inventory, or any replacement fake-data fallback.

## What Remains Manual

- Authorised admin UAT remains manual and blocked until real Supabase Auth,
  admin profile, workspace, membership, and role records are configured.
- Owner must decide whether About/Contact are launch navigation items.
- Owner must decide whether the hero should become wider than both known
  screenshot baselines.
- Chatbot open behavior should be checked in the owner's actual browser session
  and on mobile, since the desktop Playwright capture did not reproduce the
  reported open failure.
- Production visual acceptance still depends on real hosted Supabase catalogue,
  category, setup, hero, storage/media, quote, and email-delivery-log data.
