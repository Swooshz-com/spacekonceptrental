# Supabase RLS And Tenant-Isolation Strategy

Phase 1F-C-A adds initial RLS enablement and policy SQL with static coverage.
Phase 1F-C-B adds a local-only database execution harness with behavioural
tenant-isolation tests. Phase 1G-A adds only server-side Supabase client wiring
with private environment guards and static browser-boundary tests. It does not
add persistence, production seed data, Supabase Cloud connection, or deployment
configuration. Phase 1G-B adds server-only public catalogue read code for
published categories, published products, and image metadata attached to
published products. Runtime catalogue reads require trusted server-only
`CATALOGUE_WORKSPACE_ID` configuration and apply it as a `workspace_id` filter
for list and detail queries. At that point, direct anonymous catalogue RLS
hardening remained deferred until a trusted active-workspace read strategy
could keep DB-backed catalogue reads working without service-role keys. Phase
1H-A also
adds only first-party quote request persistence through `POST /api/quote`,
backed by narrow anonymous insert policies for website quote rows and quote
item rows.
Phase 1I-A adds only chat persistence design and disabled server-only
scaffolding. It does not add Supabase chat reads, chat writes, migrations,
service-role keys, browser Supabase code, or Supabase Cloud connection.
Phase 1J-A adds only product/admin persistence design and disabled server-only
scaffolding. It does not add Supabase product reads or writes, mutations,
migrations, service-role keys, browser Supabase code, Supabase Storage, admin
UI, product image uploads, or Supabase Cloud connection.
Phase 1L-A adds only the trusted active-workspace catalogue RLS hardening
strategy and proof scaffold. It does not change catalogue RLS policies,
runtime catalogue behaviour, migrations, service-role keys, browser Supabase
code, Supabase Cloud connection, deployment configuration, or n8n workflows.
Phase 1M-A implements the trusted active-workspace public catalogue RPC and
tightens direct anonymous base-table catalogue reads without service-role keys.
The server-only runtime now reads through `get_public_catalogue` after checking
trusted `CATALOGUE_WORKSPACE_ID`; browser Supabase code, Supabase Cloud,
deployment configuration, catalogue writes, quote throttling changes, and n8n
workflow changes remain out of scope.
Phase 1N-A adds only the active catalogue workspace bootstrap plan and a
docs-only local SQL example for future operator review. It does not change RLS
policies or runtime catalogue behaviour, connect to Supabase Cloud, add
production seed data, add service-role runtime writes, add browser Supabase
code, add catalogue writes, change quote throttling, or change n8n workflows.
Phase 1O-A adds only the deployment/environment readiness contract for future
server-only env placement and forbidden public variables. It does not change
RLS policies, runtime catalogue behaviour, Supabase Cloud state, deployment
configuration, service-role runtime paths, browser Supabase code, catalogue
writes, quote throttling, or n8n workflows.

No runtime route should write Supabase data until each specific flow is
separately approved and tested. Public catalogue read code is limited to the
server-only repository, requires trusted workspace configuration, and reads
through the Phase 1M-A active-workspace RPC. Quote writes are limited to the
Phase 1H-A server-only repository and the approved quote tables.
Conversation and message writes remain unapproved.
Product, category, and product image writes remain unapproved.

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

These tables are not directly public-readable through anonymous base-table
selects. Public catalogue access goes through the trusted active-workspace
read surface after server-side workspace resolution:

- `catalogue_public_workspace_config`: database-owned active workspace config;
  not directly readable by anonymous callers.
- `get_public_catalogue(expected_workspace_id, product_slug)`: returns
  published categories, published products, and public image metadata only for
  the configured active workspace.

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

## Product/Admin Write Boundary

Product-management writes are trusted-admin operations only. No anonymous
category, product, or product image insert, update, delete, or upsert path is
approved. No public product mutation route is approved.

Future product/admin writes must go through first-party server routes or server
actions after auth and admin membership boundaries exist. The server must
resolve workspace access from trusted auth and membership context, not from
browser-provided workspace IDs, admin IDs, membership IDs, or role names.

No service-role product write path is approved in Phase 1J-A. If a future
service-role path is proposed, it must be separately approved, remain
server-only, include abuse and authorization controls, and prove that the
service-role key cannot reach browser code.

Product image/media writes remain deferred until Supabase Storage buckets,
policies, upload flows, path validation, and lifecycle rules are approved.
Git-tracked prepared images remain demo/public-shell assets only.

## Service-Only Tables Or Operations

These tables or operations should be service-role-only in the MVP unless a
separate tested policy proves a narrower safe path:

- Anonymous chat conversation/message persistence.
- `usage_events` writes and reads.
- `audit_logs` writes.
- Integration metadata writes that are coupled to server-side integration
  setup.
- Any cross-workspace maintenance operation.

Service-role keys must never reach the browser. They bypass RLS and would turn
any browser compromise or accidental bundle leak into full database access.

Phase 1H-A is the approved narrow exception for quote creation: the first-party
server route uses the anon-key Supabase runtime with insert-only policies for
`quote_requests` and `quote_request_items`. It does not add anonymous reads,
updates, deletes, service-role keys, product writes, or chat persistence.
Phase 1I-A does not create an exception for chat persistence.

## Anonymous Quote And Chat Flows

Before full auth exists, anonymous public flows should go through first-party
server routes only:

- The browser sends quote or chat input to the Next.js app.
- The server resolves the workspace from trusted route, host, or deployment
  configuration.
- Public catalogue reads currently use server-only `CATALOGUE_WORKSPACE_ID` as
  the trusted deployment configuration and `get_public_catalogue` validates it
  against database-owned active workspace config.
- The server validates and normalizes untrusted customer input.
- The server writes only through the approved server-side credential path after
  migrations, policies, and tests are approved.

The browser should not write directly to Supabase for anonymous quote or chat
flows in the MVP. Direct anonymous catalogue base-table reads no longer return
catalogue rows. The server-only anon-key runtime reads catalogue data through
the trusted active-workspace `get_public_catalogue` RPC and still requires
trusted `CATALOGUE_WORKSPACE_ID`.

## Trusted Active-Workspace Catalogue Reads

Phase 1M-A preserves the first-party boundary while denying broad anonymous
base-table catalogue reads:

- The browser calls the Next.js app, not Supabase directly.
- The server resolves the active workspace from trusted server-side
  configuration, currently `CATALOGUE_WORKSPACE_ID`.
- The database validates that expected workspace against
  `catalogue_public_workspace_config`.
- The database read surface does not trust a browser-provided workspace ID.
- Direct anonymous base-table reads are denied for `categories`, `products`,
  and `product_images`.
- No service-role key may be used for public catalogue reads.

The implemented surface is `get_public_catalogue(expected_workspace_id,
product_slug)`, a constrained, fixed-search-path, dynamic-SQL-free
`security definer` function. It returns only the public catalogue columns for
the database-owned active workspace and is covered by direct anonymous abuse
tests. See `docs/SUPABASE-CATALOGUE-RLS-HARDENING.md`.

The Phase 1N-A bootstrap plan documents how future approved operators should
set `catalogue_public_workspace_config` as database-owned configuration. The
docs-only example stays under `docs/examples/supabase/`, outside
`supabase/migrations/` and `supabase/seeds/`, and must not be imported or
executed by runtime code.

For future chat writes, `clientSessionId` must remain an untrusted correlation
hint rather than identity. `clientMessageId` may support idempotency and
deduplication only; it must not authenticate the browser or authorize access to
a conversation. Workspace identifiers must come from trusted server-side
configuration or a future trusted host/workspace mapping, not the browser.

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
- Runtime website catalogue reads additionally apply server-only workspace
  filters through `CATALOGUE_WORKSPACE_ID`.
- Anonymous reads cannot see draft catalogue rows, membership data, quote data,
  conversation data, messages, usage events, audit logs, or integration
  connection metadata.
- Anonymous quote creation can insert website quote rows and item rows without
  gaining anonymous quote reads.
- Service-only tables are not broadly readable from browser-role clients, and
  representative browser-role writes are rejected.
- Runtime website Supabase reads stay server-only, published-only,
  workspace-scoped, and out of browser-facing code.
- Product/admin persistence scaffolding stays server-only, imports no
  Supabase runtime, and returns disabled results.
- Migrations add no anonymous category, product, or product image write grants
  or policies.

Future runtime work must add targeted tests for any newly approved write path,
including product persistence, chat persistence, and server-side service-role
operations.

Phase 1L-A adds static proof guards that document the catalogue hardening
requirements. Phase 1M-A adds the behavioural proof: direct anonymous
base-table reads return no catalogue rows, cross-workspace published catalogue
rows are denied, draft rows remain denied, the trusted active-workspace RPC
returns configured workspace rows, product images are limited to published
products in the active workspace, anonymous catalogue writes remain rejected,
and private tables remain unreadable by anonymous callers.
Phase 1N-A adds static guards for the bootstrap documentation and SQL example:
the example is docs-only, placeholder-only, outside migrations and seeds, not
imported by runtime code, and does not add service-role keys, browser Supabase
variables, product/category/product image writes, quote throttling changes, or
n8n workflow changes.
Phase 1O-A adds static guards for the deployment environment readiness docs and
machine-readable server env contract. The guards prove sensitive variables are
server-only, forbidden public env patterns remain forbidden, browser-facing code
does not import Supabase or reference server env, no deployment config or
production seed data is added, and PR #35/PR #36 catalogue boundaries remain
unchanged.

## Deferred After Phase 1O-A

- Browser Supabase client code.
- Auth UI.
- Admin routes.
- Direct browser Supabase reads or writes.
- Supabase Cloud configuration of the active catalogue workspace.
- Persistence for categories, products, product images, conversations, or
  messages.
- Product mutation routes.
- Supabase Storage wiring.
- Product image uploads.
- Service-role product write paths.
- Chat retention/audit policy.
- Admin chat review/search/export.
- RAG/vector DB.
- Streaming/SSE.
