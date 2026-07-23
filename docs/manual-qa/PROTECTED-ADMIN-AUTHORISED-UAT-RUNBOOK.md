# Protected Admin Authorised UAT Runbook

Status: repository-defined manual production UAT contract.

Evidence status: [NOT EVIDENCE / NOT RECORDED]

Deployment status: [SEPARATE EXPLICIT APPROVAL REQUIRED]

This runbook defines the controlled production admin-authentication UAT for the
existing Google OAuth implementation. It does not approve deployment, provider
configuration, browser automation, credential access, workspace/admin record
mutation, quote enablement, n8n activation, or public launch.

## Authorised Authentication Path

Production admin authentication is Google OAuth only:

```text
/admin/login
  -> POST /api/admin/login
  -> Supabase Google OAuth
  -> GET /api/admin/login/callback
  -> protected /admin gate
```

The first-party application route must initiate sign-in. Do not add public
signup, alternate login methods, fake users, local fallback sessions, or direct
browser-to-provider code.

The exact production application callback is:

```text
https://spacekonceptrental.com/api/admin/login/callback
```

The separate Google-to-Supabase provider callback remains external provider
configuration and must not be confused with the application callback.

## Mandatory Provider Admission Prerequisite

Do not begin owner OAuth UAT until the hosted Supabase Auth project has a
directly verified `PASS` for one reviewed admission mechanism:

- new-user signup disabled while the pre-provisioned owner account remains
  usable; or
- an equivalent before-user-created / pre-user-creation admission hook that
  permits only approved owner/admin identities before account creation.

Record `PASS | HOLD - NOT VERIFIED | FAIL`, admission mechanism class,
verification timestamp, operator/approval reference, existing-owner readiness,
and no-public-signup result. `HOLD - NOT VERIFIED` blocks UAT and Stage A
completion. Authentication or membership denial after callback is not evidence
that user creation was prevented. Repository tests cannot prove this live
provider state. A later authorised operator must use the strongest suitable
official Supabase interface or API without exposing secrets, private emails,
project references, provider values, or credentials.

The evidence mechanism must be exactly `new-user-signup-disabled` or
`before-user-created-admission-hook`; free-form alternatives are invalid. The
verification timestamp must be valid and not later than the validator's
current time.

## Source Boundaries

- Login page: `website/app/admin/login/page.tsx`
- First-party login route: `website/app/api/admin/login/route.ts`
- Application callback route:
  `website/app/api/admin/login/callback/route.ts`
- Logout route: `website/app/admin/logout/route.ts`
- Protected admin shell: `website/app/admin/protected-admin-shell.tsx`
- Server auth/session adapter:
  `website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
- Canonical authority and Host validation:
  `website/lib/admin/authorization/admin-auth-route-security.ts`
- Admin profile and membership adapters:
  `website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`
- Role policy:
  `website/lib/admin/authorization/admin-authorization-policy.ts`

## Required Pre-existing State

UAT uses only identities and records that were deliberately configured and
approved outside this runbook. Do not create or change them during UAT.

- One approved Google identity is already linked to the intended Supabase Auth
  user.
- The authorised actor has one active `admin_users` profile.
- The authorised actor has one active `owner` or `admin` membership for the
  trusted workspace.
- Negative-test actors or fixtures, when available, are pre-existing and
  approved for wrong-workspace, inactive-user, and insufficient-role checks.
- `ADMIN_TRUSTED_WORKSPACE_ID`, `ADMIN_EXPECTED_ORIGIN`,
  `ADMIN_EXPECTED_HOST`, `ADMIN_CSRF_PROOF_SECRET`, and
  `ADMIN_MUTATIONS_ENABLED` in its explicit disabled state are configured
  server-side without exposing their values.
- The canonical production values are represented by the operator as safe
  equality results only:
  - expected origin equals `https://spacekonceptrental.com`;
  - expected host equals `spacekonceptrental.com`.
- Quote submission remains disabled and n8n remains inactive throughout this
  Stage A UAT.
- Every protected admin mutation is denied by the server-only capability gate;
  login, callback, logout, session reads, and protected admin-page reads remain
  available.

If any prerequisite is missing, stop. Do not repair provider configuration,
records, roles, memberships, or environment values from this UAT procedure.

## Secret-safe Evidence Rules

Record only route, safe status, timestamp, actor class, expected/actual outcome,
and an approved evidence reference. Do not record cookies, authorization codes,
tokens, headers, environment values, provider response bodies, identity details,
workspace identifiers, or customer data.

Use a fresh clean browser context only in the separately authorised provider
UAT operation. This repository follow-up does not open or control a browser.

## Production UAT Sequence

### 1. Anonymous `/admin` denial

1. In a clean signed-out context, request
   `https://spacekonceptrental.com/admin`.
2. Confirm the request is denied or redirected only to the first-party
   `/admin/login` surface.
3. Confirm no redirect contains localhost, an internal proxy authority, an
   arbitrary Host, or provider internals.

### 2. Google sign-in initiation

1. Open the first-party `/admin/login` page.
2. Confirm the visible action is Google sign-in and does not expose public
   signup or another authentication method.
3. Submit the first-party action to `POST /api/admin/login`.
4. Confirm the application initiates Supabase Google OAuth. Do not construct a
   provider URL manually and do not bypass the first-party route.

### 3. Exact application callback

1. Complete the approved Google authentication interaction.
2. Confirm the application returns only through
   `https://spacekonceptrental.com/api/admin/login/callback`.
3. Confirm the callback Host is the canonical apex and no callback redirect
   exposes localhost, internal proxy authority, forwarded authority, or an
   arbitrary host.
4. Confirm session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`,
   and have no `Domain` attribute. Record attributes only, never values.

### 4. Authorised owner/admin access

1. Confirm the authorised actor reaches `/admin`.
2. Confirm the six protected owner CMS routes are available:

```text
/admin
/admin/hero
/admin/catalogue
/admin/setups
/admin/enquiry-email
/admin/delivery-log
```

3. Confirm access remains bound to the trusted workspace and the approved
   `owner` or `admin` role.
4. Do not perform product, category, listing, workspace, membership, quote, or
   provider mutations as part of authentication UAT.
5. Confirm a representative protected admin write attempt is denied before
   repository/provider mutation using only secret-safe status evidence. Do not
   change records to manufacture this evidence.

### 5. Negative authorisation checks

Run only with pre-existing approved negative-test actors or fixtures. Never
create a user or change records merely to manufacture a denial case.

- Wrong workspace: an otherwise valid actor without membership in the trusted
  workspace is denied the protected shell.
- Inactive user: an actor with an inactive admin profile is denied.
- Inactive membership: an actor with an inactive trusted-workspace membership
  is denied.
- Insufficient role: a `viewer` or other non-owner/non-admin role is denied the
  six-page owner CMS shell.

Each denial must be generic and must not expose membership, workspace, provider,
SQL, stack, cookie, or environment details.

### 6. Duplicate-session and duplicate-membership checks

Where the existing approved data and test plan make these checks applicable:

- Repeat sign-in for the same authorised Google identity and confirm it does
  not create a second admin profile or membership.
- Confirm concurrent or refreshed sessions remain associated with the same
  authorised identity and trusted-workspace decision.
- Confirm duplicate active memberships cannot broaden role or workspace access.
- Record only a safe equality/count result; do not record identity, session, or
  record values.

If the check would require creating records, changing membership, or querying
production data outside an already approved evidence surface, mark it not run
and retain the gate.

### 7. Logout and former-session rejection

1. Use the first-party `POST /admin/logout` flow.
2. Confirm the redirect remains on the canonical apex and returns to the
   intended first-party login surface.
3. Confirm deletion cookie writes preserve the production cookie policy and
   are recorded without values.
4. Revisit `/admin` and confirm anonymous denial.
5. Retry a protected request associated with the former session and confirm it
   is rejected. Browser history, a cached page, or a copied former request must
   not restore protected access.

## Pass Criteria

Pass only when every applicable step above has secret-safe evidence and:

- anonymous `/admin` is denied;
- Google OAuth starts through the first-party application route;
- the exact application callback and canonical host are preserved;
- an authorised owner/admin reaches the trusted protected shell;
- wrong-workspace, inactive-user, inactive-membership, and insufficient-role
  cases are denied where approved actors exist;
- duplicate checks show no access broadening where applicable;
- logout succeeds and the former session is rejected;
- quote submission remained disabled;
- n8n remained inactive;
- admin mutations remained disabled;
- provider signup admission had a direct `PASS` before UAT began;
- no customer quote was submitted.

Repository tests and a production read-only smoke pass do not substitute for
this real-owner UAT. Provider configuration, record preparation, deployment,
and browser execution remain separately approved operations.

## Prohibited Workarounds

Do not add hardcoded admins, environment-only allowlists, fake sessions,
browser storage authentication, service-role browser clients, bypass routes,
public signup, alternate authentication methods, demo admin rows, or public
shortcuts into protected pages.
