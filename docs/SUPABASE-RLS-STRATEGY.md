# Supabase RLS And Tenant-Isolation Strategy

Phase 1F-C-A adds initial RLS enablement and policy SQL with static coverage.
Phase 1F-C-B adds a local-only database execution harness with behavioural
tenant-isolation tests. Phase 1G-A adds only server-side Supabase client wiring
with private environment guards and static browser-boundary tests. It does not
add persistence, production seed data, Supabase Cloud connection, or deployment
configuration. Phase 1G-B adds server-only public catalogue reads for published
categories, published products, and image metadata attached to published
products.

No runtime route should write Supabase data until each specific flow is
separately approved and tested. Public catalogue reads are limited to the
Phase 1G-B server-only repository and published catalogue tables.

## Boundary Model

The planned tenant boundary table is `workspaces`. Workspace-scoped tables use
`workspace_id` and must never trust a browser-supplied workspace identifier for
anonymous writes.

Tables requiring `workspace_id`:

- `memberships`
- `categories`
- `products`
- `product_images`
- `quote_requests`
- `quote_request_items`
- `conversations`
- `messages`
- `usage_events`
- `audit_logs`
- optional `integration_connections`

Tables without `workspace_id`:

- `workspaces`, because it is the boundary table.
- `admin_users`, because it is a global profile linked to Supabase Auth.

`admin_users` gains workspace access only through active `memberships`.

## Public-Readable Candidates

These tables may become public-readable later, but only after published-state
filters and RLS tests exist:

- `workspaces`: only safe public lookup fields such as slug or public domain.
- `categories`: published categories for the active public workspace.
- `products`: published products for the active public workspace.
- `product_images`: public media metadata only when the parent product is
  published.

Public-read policies must not expose draft rows, internal metadata, deleted
records, private storage paths, audit data, quote data, conversation data, or
membership data.

## Admin-Only Tables

These tables should be readable by authenticated admins only when the user has
an active membership in the row workspace:

- `memberships`
- draft or unpublished `categories`
- draft or unpublished `products`
- draft or unpublished `product_images`
- `quote_requests`
- `quote_request_items`
- `conversations`
- `messages`
- optional `integration_connections` metadata

Future admin policies should scope reads and writes through membership checks,
not through client-provided role claims alone.

## Service-Only Tables Or Operations

These tables or operations should be service-role-only in the MVP unless a
separate tested policy proves a narrower safe path:

- Anonymous quote creation.
- Anonymous chat conversation/message persistence.
- `usage_events` writes and reads.
- `audit_logs` writes.
- Integration metadata writes that are coupled to server-side integration
  setup.
- Any cross-workspace maintenance operation.

Service-role keys must never reach the browser. They bypass RLS and would turn
any browser compromise or accidental bundle leak into full database access.

## Anonymous Quote And Chat Flows

Before full auth exists, anonymous public flows should go through first-party
server routes only:

- The browser sends quote or chat input to the Next.js app.
- The server resolves the workspace from trusted route, host, or deployment
  configuration.
- The server validates and normalizes untrusted customer input.
- The server writes with service-side credentials only after migrations,
  policies, and tests are approved.

The browser should not write directly to Supabase for anonymous quote or chat
flows in the MVP. If direct anonymous reads are added for public catalogue
data, they must be limited to published rows and covered by RLS tests.

## Future Admin Scoping

Admin access should follow this chain:

1. Supabase Auth identifies the signed-in user.
2. `admin_users.auth_user_id` maps the auth user to an app admin profile.
3. `memberships` grants access to a workspace.
4. RLS checks active membership and role for each workspace-scoped row.

Role names should start simple, such as `owner`, `admin`, and `viewer`, and
should not expand into granular permissions until the admin workflows require
it.

## Test Coverage

Phase 1F-C-A adds static tests proving the intended migration structure. Phase
1F-C-B adds local behavioural database tests proving:

- A user can read allowed admin-only rows in their workspace.
- A user cannot read admin-only rows from another workspace.
- A user without membership cannot access admin-only data.
- Public anonymous reads return only published catalogue rows.
- Anonymous reads cannot see draft catalogue rows, membership data, quote data,
  conversation data, messages, usage events, audit logs, or integration
  connection metadata.
- Service-only tables are not broadly readable from browser-role clients, and
  representative browser-role writes are rejected.
- Runtime website Supabase reads stay server-only, published-only, and out of
  browser-facing code.

Future runtime work must add targeted tests for any newly approved write path,
including anonymous quote creation, chat persistence, and server-side
service-role operations.

## Deferred After Phase 1G-B

- Browser Supabase client code.
- Auth UI.
- Admin routes.
- Direct browser Supabase reads or writes.
- Persistence for products, quotes, conversations, or messages.
