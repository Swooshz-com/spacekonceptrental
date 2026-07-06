# Protected Admin Authorised UAT Runbook

Status: repo-local, admin-only, manual UAT readiness runbook.

Evidence status: [NOT EVIDENCE / NOT RECORDED]

Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]

Use this runbook after the public/admin pre-auth visual checks pass and before
Hostinger/Coolify staging purchase or configuration. It prepares the real
authorised owner/admin path for the six protected CMS pages using Supabase
Auth, real database rows, and the existing server-only admin gate.

This runbook does not add fake auth, local fallback auth, env-only login,
service-role runtime paths, public visual changes, quote/chat/email behavior
changes, or Delivery Log behavior changes.

## Purpose And Scope

This is a manual setup and UAT checklist for signing in locally through:

```text
/admin/login -> /api/admin/login -> Supabase Auth -> protected admin gate
```

The authorised owner CMS scope remains six pages:

| Page | Route |
| --- | --- |
| Dashboard | `/admin` |
| Hero | `/admin/hero` |
| Catalogue | `/admin/catalogue` |
| Setups | `/admin/setups` |
| Enquiry Email | `/admin/enquiry-email` |
| Delivery Log | `/admin/delivery-log` |

`/admin/login` and `/admin/logout` support access control only. They are not
additional CMS pages.

## Source Findings

The current implementation uses these boundaries:

- Login POST route:
  `website/app/api/admin/login/route.ts`
- Logout POST route:
  `website/app/admin/logout/route.ts`
- Login page form:
  `website/app/admin/login/page.tsx`
- Protected admin shell:
  `website/app/admin/protected-admin-shell.tsx`
- Supabase Auth/session adapter:
  `website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
- Admin profile and membership adapters:
  `website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`
- Trusted workspace resolver:
  `website/lib/admin/authorization/server-admin-workspace-resolver.ts`
- Role policy:
  `website/lib/admin/authorization/admin-authorization-policy.ts`
- Server env parser:
  `website/lib/server-runtime-config.ts`

Login uses Supabase email/password auth through `/api/admin/login`. A successful
Supabase Auth session is not enough by itself: the protected shell still
requires an active `admin_users` row, an active `memberships` row for the
trusted workspace, and a role allowed to access `admin.shell.access`.

The role policy allows `owner` and `admin` to access the owner CMS shell.
`viewer` is intentionally not enough for the six-page owner CMS shell.

## Existing Schema And Migration Coverage

Existing migrations already create the required admin auth tables and RLS
helpers. No new migration is required for authorised local UAT setup.

Required foundations include:

- `supabase/migrations/20260526163104_create_base_schema.sql`
  - `public.workspaces`
  - `public.admin_users`
  - `public.memberships`
- `supabase/migrations/20260526171332_enable_rls_policies.sql`
  - `public.is_workspace_member(...)`
  - active-member read policies
- `supabase/migrations/20260601010000_admin_product_write_policies.sql`
  - owner/admin product-management RLS helpers and policies
- `supabase/migrations/20260703100000_homepage_hero_content_foundation.sql`
  - protected admin Hero content reads/writes
- `supabase/migrations/20260703010000_quote_email_delivery_log_foundation.sql`
  - Delivery Log metadata table and policies

The repo has `supabase/seeds/sample_catalogue.sql`, but it is fake/sample local
catalogue fixture data only. It intentionally does not create admin users or
memberships and must not be used as production or owner-UAT bootstrap data.

No safe existing script was found that bootstraps a real hosted Supabase
authorised admin user. Real owner UAT setup should be done deliberately in
Supabase Auth and the Supabase SQL Editor using placeholders like the template
below.

## Required Local Env Names

Set real values only outside git, for example in the local shell or an ignored
local env file. Do not commit `.env` files or screenshots containing values.

Minimum env needed for real local sign-in and protected admin shell access:

```text
SUPABASE_URL=<hosted-supabase-project-url>
SUPABASE_ANON_KEY=<hosted-supabase-anon-key>
ADMIN_TRUSTED_WORKSPACE_ID=<reviewed-admin-workspace-uuid>
ADMIN_EXPECTED_ORIGIN=http://localhost:3000
ADMIN_EXPECTED_HOST=localhost:3000
```

Required before testing protected admin write controls:

```text
ADMIN_CSRF_PROOF_SECRET=<server-only-random-secret>
```

Recommended for full six-page CMS context:

```text
CATALOGUE_WORKSPACE_ID=<reviewed-public-catalogue-workspace-uuid>
QUOTE_WORKSPACE_ID=<reviewed-quote-workspace-uuid>
QUOTE_ENQUIRY_EMAIL_PROVIDER=resend
QUOTE_ENQUIRY_EMAIL_RECIPIENT=<business-recipient-email>
QUOTE_ENQUIRY_EMAIL_FROM=<verified-resend-from-email>
RESEND_API_KEY=<server-only-resend-api-key>
```

Use `127.0.0.1` consistently if browsing with that host instead of
`localhost`:

```text
ADMIN_EXPECTED_ORIGIN=http://127.0.0.1:3000
ADMIN_EXPECTED_HOST=127.0.0.1:3000
```

The `Origin` and `Host` values must match the browser URL used for the login
POST. A mismatch fails closed before Supabase sign-in.

Do not configure:

```text
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_*
NEXT_PUBLIC_N8N*
NEXT_PUBLIC_SKR_DEMO_CONTENT
```

Do not read or use `website/chat-config.js`.

## Supabase Auth User Setup

Create the owner/admin user in Supabase Auth first:

1. Open the intended hosted Supabase project.
2. Go to Authentication, Users.
3. Add or invite the owner/admin email using Supabase email/password auth.
4. Set a temporary password using Supabase's normal Auth controls.
5. Require the owner to change/store the password outside this repo.
6. Open the created user record and copy the User UID.

Alternative SQL lookup after the user exists:

```sql
select id, email, created_at
from auth.users
where email = '<OWNER_EMAIL@example.invalid>';
```

Only copy the `id` UUID. Do not copy password hashes, tokens, sessions, or
private metadata into docs, PRs, screenshots, or local notes.

## Required Database Rows

The protected admin shell requires these real rows:

| Requirement | Table | Required state |
| --- | --- | --- |
| Workspace | `public.workspaces` | One reviewed workspace with `status = 'active'`. |
| Admin profile | `public.admin_users` | Exactly one row with `auth_user_id = <Supabase Auth user UID>` and `status = 'active'`. |
| Membership | `public.memberships` | Exactly one row for that admin profile and workspace with `status = 'active'`. |
| Role | `public.memberships.role` | `owner` or `admin` for six-page CMS shell access. |
| Trusted workspace env | `ADMIN_TRUSTED_WORKSPACE_ID` | Must equal the reviewed `public.workspaces.id`. |

`viewer` can pass only limited read/auth-check operations and should not be
used for owner CMS UAT.

## SQL Editor Template

Run this only in the intended Supabase project after replacing every
placeholder. Do not run it with angle-bracket placeholders still present.

This template creates or updates the workspace, admin profile, and membership
needed for the local authorised admin path. It does not create Auth users and
does not use a service-role runtime path.

```sql
begin;

insert into public.workspaces (
  id,
  slug,
  name,
  status,
  primary_domain
)
values (
  '<ADMIN_WORKSPACE_UUID>'::uuid,
  '<workspace-slug>',
  '<Workspace display name>',
  'active',
  null
)
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  status = 'active',
  primary_domain = excluded.primary_domain,
  updated_at = now();

with upserted_admin as (
  insert into public.admin_users (
    id,
    auth_user_id,
    email,
    display_name,
    status
  )
  values (
    gen_random_uuid(),
    '<SUPABASE_AUTH_USER_UUID>'::uuid,
    lower('<OWNER_EMAIL@example.invalid>'),
    '<Owner display name>',
    'active'
  )
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    status = 'active',
    updated_at = now()
  returning id
)
insert into public.memberships (
  workspace_id,
  admin_user_id,
  role,
  status
)
select
  '<ADMIN_WORKSPACE_UUID>'::uuid,
  upserted_admin.id,
  'owner',
  'active'
from upserted_admin
on conflict (workspace_id, admin_user_id) do update
set
  role = excluded.role,
  status = 'active',
  updated_at = now();

commit;
```

After the SQL succeeds, set:

```text
ADMIN_TRUSTED_WORKSPACE_ID=<ADMIN_WORKSPACE_UUID>
```

Use the same reviewed workspace ID for `CATALOGUE_WORKSPACE_ID` and
`QUOTE_WORKSPACE_ID` only when the owner has explicitly decided that the
admin, public catalogue, and quote workspaces are the same launch workspace.

## Local Login UAT Steps

1. Confirm the local branch is the intended main or review branch and the
   worktree is clean.
2. Confirm the local env names above are configured outside git.
3. Restart the local website after changing env:

```powershell
cd website
npm run dev
```

4. Browse to `http://localhost:3000/admin/login`.
5. Confirm the page is the isolated protected-admin sign-in screen.
6. Sign in with the real Supabase Auth email and password.
7. Confirm the redirect lands on `/admin`.
8. Confirm the authorised protected shell shows only the six owner CMS pages.
9. Visit every route:

```text
/admin
/admin/hero
/admin/catalogue
/admin/setups
/admin/enquiry-email
/admin/delivery-log
```

10. Confirm `/admin/media`, `/admin/listings`, and `/admin/listings#...` are
    not present as protected admin navigation or helper-action targets.
11. Confirm no ecommerce, cart, checkout, order, payment, purchase, booking,
    reservation, fulfilment, customer account, or custom CRM wording or flow
    appears.
12. Use the `/admin/logout` flow when finished, then revisit `/admin` and
    confirm the pre-auth state is safe.

## Page Checks

### Dashboard `/admin`

- The six-page owner CMS navigation is visible only after authorisation.
- The dashboard uses real workspace-scoped reads or honest unavailable states.
- Removed admin routes are absent.

### Hero `/admin/hero`

- Hero content fields load for the trusted workspace.
- Routine save actions are clear.
- Enabled/visibility state is understandable.
- No public homepage visual redesign is required by this UAT.

### Catalogue `/admin/catalogue`

- Listing/category/image metadata controls load for the trusted workspace.
- Required controls remain present.
- Visibility, publish, archive, and upload-style actions are visually/copy-wise
  clear.
- Helper links target `/admin/catalogue` anchors only.

### Setups `/admin/setups`

- The page explains setup presentation derives from real catalogue records.
- Empty state is honest if there are no real setup records.
- No fake setup examples or sample inventory are required.

### Enquiry Email `/admin/enquiry-email`

- Status reads as Ready, Needs setup, or Unavailable.
- Missing config is named by env category only.
- No editable email settings, send controls, outbound messaging, or CRM flow
  appears.

### Delivery Log `/admin/delivery-log`

- Empty copy says no enquiry email delivery attempts have been recorded yet,
  or equivalent current wording.
- Loaded rows are metadata-only.
- No full customer messages, email bodies, raw provider payloads, headers,
  cookies, tokens, secrets, or provider API responses appear.

## Screenshot Checklist

Screenshots are local working notes only. Do not commit them unless separately
approved.

Recommended ignored local path:

```text
.tmp\admin-authorised-uat\<YYYY-MM-DD>\
```

Recommended names:

```text
YYYY-MM-DD-admin-authorised-01-dashboard-desktop-1440.png
YYYY-MM-DD-admin-authorised-02-hero-desktop-1440.png
YYYY-MM-DD-admin-authorised-03-catalogue-desktop-1440.png
YYYY-MM-DD-admin-authorised-04-setups-desktop-1440.png
YYYY-MM-DD-admin-authorised-05-enquiry-email-desktop-1440.png
YYYY-MM-DD-admin-authorised-06-delivery-log-desktop-1440.png
YYYY-MM-DD-admin-authorised-07-dashboard-mobile-390.png
```

Before sharing screenshots, confirm they do not show real env values, API
keys, passwords, raw customer data, full email bodies, provider payloads, or
private notes.

## Expected Failure Modes

| Symptom | Likely cause | Check |
| --- | --- | --- |
| Login returns to `/admin/login?state=unavailable` | `SUPABASE_URL` or `SUPABASE_ANON_KEY` missing/invalid. | Confirm server-only Supabase env names are set and restart `npm run dev`. |
| Login returns to `/admin/login?state=unauthenticated` | Wrong credentials, missing Auth user, or same-origin failure. | Confirm Supabase Auth user exists and `ADMIN_EXPECTED_ORIGIN` / `ADMIN_EXPECTED_HOST` match the exact browser host. |
| `/admin` says sign-in required after login | Session cookie missing/expired or browser origin changed. | Sign in again using the same `localhost` or `127.0.0.1` host used in env. |
| `/admin` says access unavailable | Missing Supabase env, missing trusted workspace env, or RLS/read dependency failure. | Confirm `ADMIN_TRUSTED_WORKSPACE_ID`, migrations, and Supabase project env. |
| `/admin` denies access after successful login | `admin_users` profile missing/inactive, membership missing/inactive, workspace mismatch, or role denied. | Verify the Auth UID, `admin_users.status`, `memberships.status`, role, and workspace ID. |
| Viewer can sign in but not see owner CMS shell | Expected for `viewer`. | Use `owner` or `admin` membership for owner CMS UAT. |
| Admin write controls fail | `ADMIN_CSRF_PROOF_SECRET` missing, stale page, or session/workspace mismatch. | Configure the secret outside git, restart dev server, refresh after sign-in. |
| Enquiry Email shows Needs setup/Unavailable | Quote email env incomplete. | Configure only when testing Ready email status; do not paste values into screenshots. |
| Delivery Log is empty | No enquiry email delivery attempts recorded yet. | Expected until real quote email handoff attempts exist. |

## No Local Fallback Warning

Do not work around failed authorised UAT by adding:

- hardcoded admin users
- env-only admin allowlists
- fake login sessions
- localStorage/sessionStorage auth
- service-role browser clients
- bypass routes
- demo/sample admin rows in runtime source
- public-route shortcuts into protected admin pages

Fix the real Supabase Auth, `admin_users`, `memberships`, workspace, env, or
RLS setup instead.

## Launch Gate

Do not proceed to Hostinger/Coolify staging purchase or staging configuration
until authorised admin UAT passes for the six protected owner CMS pages using a
real Supabase Auth user and real database rows.

Passing pre-auth screenshots alone is not enough for hosted staging readiness.

## Local Cleanup Notes For This UAT Prep

Observed during the PR #271 post-merge UAT prep:

- `stash@{0}: pre-main-uat-stitch-reference-deletions` exists. Do not pop or
  drop it blindly.
- Local branch `claude/zen-keller-832b4a` is held by another worktree at
  `C:\Users\xPass\AppData\Local\Temp\spacekonceptrental-admin-refresh`. Do not
  delete that worktree or branch without explicit owner approval that it is
  safe.
