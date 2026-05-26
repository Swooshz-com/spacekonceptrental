# Supabase MVP Schema Plan

This is a planning document only. It does not define SQL migrations, RLS
policies, Supabase client wiring, seed files, or deployment configuration.

Phase 1E performed step 1 of the migration sequence: documentation. Phase 1F-B
started step 2 with a base table migration. Phase 1F-C-A adds initial RLS
policy SQL with static coverage only. Behavioural RLS tests, seed data,
Supabase runtime wiring, and persistence features remain deferred.

## Naming Decision

Use `workspaces` as the tenant boundary table. The docs may still say tenant
isolation when describing the security model, but the planned table name is
`workspaces`.

## Access Levels

- Public-readable: data that may be visible to anonymous site visitors after
  RLS policies and behavioural tests exist.
- Admin-only: data visible only to authenticated admin users scoped through
  workspace membership.
- Service-only: data written or read only by server-side code using privileged
  server credentials. Service-role keys must never reach the browser.

## Planned Tables

### `workspaces`

Purpose: top-level tenant boundary for products, quotes, conversations, usage,
and audit records.

Key fields: `id`, `slug`, `name`, `status`, `primary_domain`, `created_at`,
`updated_at`.

Ownership / tenant boundary: each workspace owns its catalogue, quote, chat,
usage, and audit data.

Access: admin-only for management; public code may resolve a published
workspace through server-side routing later.

Relationships: parent for `memberships`, `categories`, `products`,
`quote_requests`, `conversations`, `usage_events`, `audit_logs`, and optional
`integration_connections`.

Deferred: custom domains, billing state, onboarding workflows, and workspace
settings beyond MVP identification.

### `admin_users`

Purpose: application-level admin user profile linked to Supabase Auth.

Key fields: `id`, `auth_user_id`, `email`, `display_name`, `status`,
`created_at`, `updated_at`.

Ownership / tenant boundary: user profile is global; workspace access is
granted only through `memberships`.

Access: admin-only for the signed-in user and service-only for privileged
admin operations.

Relationships: linked to `memberships` and `audit_logs.actor_admin_user_id`.

Deferred: password handling, full profile management, invitations, SSO, and
fine-grained user preferences.

### `memberships`

Purpose: connect admin users to workspaces and roles.

Key fields: `id`, `workspace_id`, `admin_user_id`, `role`, `status`,
`created_at`, `updated_at`.

Ownership / tenant boundary: scoped to one workspace.

Access: admin-only; users may access records for workspaces where they have an
active membership.

Relationships: joins `workspaces` and `admin_users`.

Deferred: granular permissions, team invitations, pending invitation records,
and enterprise role management.

### `categories`

Purpose: organize public catalogue products.

Key fields: `id`, `workspace_id`, `slug`, `name`, `description`, `sort_order`,
`is_published`, `created_at`, `updated_at`.

Ownership / tenant boundary: every category belongs to one workspace.

Access: public-readable only when published; admin-only for drafts and edits.

Relationships: parent for `products.category_id`.

Deferred: nested categories, merchandising rules, localization, and SEO
metadata beyond MVP basics.

### `products`

Purpose: represent rentable catalogue items.

Key fields: `id`, `workspace_id`, `category_id`, `slug`, `name`,
`short_description`, `description`, `rental_unit`, `status`, `sort_order`,
`created_at`, `updated_at`.

Ownership / tenant boundary: every product belongs to one workspace.

Access: public-readable only when published; admin-only for drafts and edits.

Relationships: belongs to `categories`; parent for `product_images` and future
quote item references.

Deferred: inventory counts, price books, availability calendars, variants,
bundles, SEO automation, and full admin product workflows.

### `product_images`

Purpose: metadata records for product media stored outside Git, eventually in
Supabase Storage.

Key fields: `id`, `workspace_id`, `product_id`, `storage_bucket`,
`storage_path`, `alt_text`, `sort_order`, `is_primary`, `created_at`,
`updated_at`.

Ownership / tenant boundary: every image belongs to one workspace and one
product.

Access: public-readable only when the parent product is published and the media
path is safe for public delivery; admin-only for draft media management.

Relationships: belongs to `products`.

Deferred: upload UI, image transforms, CDN invalidation, private media,
moderation, and asset lifecycle automation.

### `quote_requests`

Purpose: capture customer quote intent from public flows.

Key fields: `id`, `workspace_id`, `public_reference`, `customer_name`,
`customer_email`, `customer_phone`, `event_date`, `venue`, `status`,
`source`, `created_at`, `updated_at`.

Ownership / tenant boundary: every quote request belongs to one workspace.

Access: service-only for anonymous creation until tested policies exist;
admin-only for review and follow-up.

Relationships: parent for `quote_request_items`; may link to a
`conversation_id` later.

Deferred: real persistence in Phase 1E, notifications, CRM sync, quote
approval, pricing, and customer account portals.

### `quote_request_items`

Purpose: line items for requested products, quantities, and notes.

Key fields: `id`, `workspace_id`, `quote_request_id`, `product_id`,
`product_name_snapshot`, `quantity`, `notes`, `created_at`, `updated_at`.

Ownership / tenant boundary: every item belongs to the same workspace as its
quote request.

Access: service-only for anonymous creation until tested policies exist;
admin-only for review.

Relationships: belongs to `quote_requests`; may reference `products`.

Deferred: pricing snapshots, availability holds, substitutions, discounts, and
approval workflows.

### `conversations`

Purpose: store chat conversation metadata when persistence is approved.

Key fields: `id`, `workspace_id`, `public_reference`, `client_session_hash`,
`quote_request_id`, `status`, `created_at`, `updated_at`.

Ownership / tenant boundary: every conversation belongs to one workspace.

Access: service-only for public chat writes; admin-only for future inbox views.

Relationships: parent for `messages`; may link to `quote_requests`.

Deferred: full inbox, human takeover, transcript export, retention workflows,
and internal chatbot runtime storage.

### `messages`

Purpose: store normalized conversation messages.

Key fields: `id`, `workspace_id`, `conversation_id`, `role`, `content`,
`provider`, `client_message_id`, `request_id`, `created_at`.

Ownership / tenant boundary: every message belongs to the same workspace as its
conversation.

Access: service-only for writes; admin-only for future support review.

Relationships: belongs to `conversations`.

Deferred: embeddings, attachments, streaming chunks, tool traces, provider
debug payloads, and raw n8n internals.

### `usage_events`

Purpose: record low-risk operational usage metrics for rate limits, audit
support, and future analytics.

Key fields: `id`, `workspace_id`, `event_type`, `subject_type`, `subject_id`,
`metadata`, `created_at`.

Ownership / tenant boundary: every event belongs to one workspace unless a
future global system event is explicitly designed.

Access: service-only for writes and reads in MVP; admin analytics are deferred.

Relationships: may reference quote, conversation, product, or admin subjects by
type and ID.

Deferred: dashboards, billing metering, retention jobs, anomaly detection, and
cross-workspace reporting.

### `audit_logs`

Purpose: immutable record of sensitive admin or service actions.

Key fields: `id`, `workspace_id`, `actor_admin_user_id`, `actor_type`,
`action`, `target_type`, `target_id`, `metadata`, `created_at`.

Ownership / tenant boundary: workspace-scoped except for future explicit
platform-level audit records.

Access: service-only for writes; admin-only reads may be added later with
strict membership checks.

Relationships: may reference `admin_users` and target records by type and ID.

Deferred: broad audit dashboards, export tooling, retention policies, and
tamper-evident storage.

### `integration_connections` Optional

Purpose: store non-secret metadata for external integrations.

Key fields: `id`, `workspace_id`, `provider`, `display_name`, `status`,
`metadata`, `created_at`, `updated_at`.

Ownership / tenant boundary: every integration connection belongs to one
workspace.

Access: admin-only for metadata; service-only for operational reads if needed.

Relationships: belongs to `workspaces`.

Deferred: credentials, OAuth tokens, webhook secrets, refresh tokens, live n8n
credential bindings, and runtime payloads. Secrets must stay in the approved
secret manager or provider credential store, not this table.

## Migration Sequencing

Future Supabase work should land in this order:

1. Planning docs.
2. Migration files.
3. RLS policies.
4. RLS and tenant-isolation tests.
5. Seed fixtures with fake/sample data only.
6. Server-only Supabase client wiring.
7. Public catalogue read path.
8. Quote persistence.
9. Conversation and message persistence.

Phase 1E performed step 1. Phase 1F-B started step 2 with base table
definitions. Phase 1F-C-A adds RLS policy SQL only.

## Deferred After Phase 1F-C-A

- Behavioural RLS and tenant-isolation tests.
- Supabase project connection.
- Supabase client packages or runtime wiring.
- Real product, quote, conversation, or message persistence.
- Admin product workflows.
- Customer/private file import.
