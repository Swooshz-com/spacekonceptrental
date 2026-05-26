-- Phase 1F-B base schema only.
-- RLS policies are intentionally deferred to a later PR with tests.
-- No app runtime should rely on these tables until RLS policies and tests land.
-- Service-role keys must never reach browser code.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status text not null default 'active',
  primary_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_slug_format_check
    check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint workspaces_status_check
    check (status in ('active', 'paused', 'archived')),
  constraint workspaces_slug_key unique (slug),
  constraint workspaces_primary_domain_key unique (primary_domain)
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email text not null,
  display_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_not_blank_check
    check (btrim(email) <> ''),
  constraint admin_users_status_check
    check (status in ('active', 'inactive')),
  constraint admin_users_auth_user_id_key unique (auth_user_id),
  constraint admin_users_email_key unique (email)
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  admin_user_id uuid not null,
  role text not null default 'viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint memberships_admin_user_id_fkey
    foreign key (admin_user_id)
    references public.admin_users (id)
    on delete cascade,
  constraint memberships_role_check
    check (role in ('owner', 'admin', 'viewer')),
  constraint memberships_status_check
    check (status in ('active', 'invited', 'suspended')),
  constraint memberships_workspace_admin_user_key
    unique (workspace_id, admin_user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint categories_slug_format_check
    check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint categories_sort_order_check
    check (sort_order >= 0),
  constraint categories_workspace_slug_key
    unique (workspace_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  category_id uuid,
  slug text not null,
  name text not null,
  short_description text,
  description text,
  rental_unit text not null default 'item',
  status text not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint products_category_id_fkey
    foreign key (category_id)
    references public.categories (id)
    on delete set null,
  constraint products_slug_format_check
    check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint products_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint products_sort_order_check
    check (sort_order >= 0),
  constraint products_workspace_slug_key
    unique (workspace_id, slug)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  product_id uuid not null,
  storage_bucket text not null,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint product_images_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on delete cascade,
  constraint product_images_storage_bucket_not_blank_check
    check (btrim(storage_bucket) <> ''),
  constraint product_images_storage_path_not_blank_check
    check (btrim(storage_path) <> ''),
  constraint product_images_sort_order_check
    check (sort_order >= 0),
  constraint product_images_workspace_storage_path_key
    unique (workspace_id, storage_bucket, storage_path)
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  public_reference text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  event_date date,
  venue text,
  status text not null default 'new',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_requests_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_requests_public_reference_not_blank_check
    check (btrim(public_reference) <> ''),
  constraint quote_requests_status_check
    check (status in ('new', 'reviewing', 'quoted', 'closed', 'archived')),
  constraint quote_requests_source_check
    check (source in ('website', 'chat', 'admin')),
  constraint quote_requests_workspace_public_reference_key
    unique (workspace_id, public_reference)
);

create table if not exists public.quote_request_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  quote_request_id uuid not null,
  product_id uuid,
  product_name_snapshot text not null,
  quantity integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_request_items_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint quote_request_items_quote_request_id_fkey
    foreign key (quote_request_id)
    references public.quote_requests (id)
    on delete cascade,
  constraint quote_request_items_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on delete set null,
  constraint quote_request_items_product_name_not_blank_check
    check (btrim(product_name_snapshot) <> ''),
  constraint quote_request_items_quantity_check
    check (quantity > 0)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  public_reference text not null,
  client_session_hash text,
  quote_request_id uuid,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint conversations_quote_request_id_fkey
    foreign key (quote_request_id)
    references public.quote_requests (id)
    on delete set null,
  constraint conversations_public_reference_not_blank_check
    check (btrim(public_reference) <> ''),
  constraint conversations_status_check
    check (status in ('open', 'closed', 'archived')),
  constraint conversations_workspace_public_reference_key
    unique (workspace_id, public_reference)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null,
  role text not null,
  content text not null,
  provider text,
  client_message_id text,
  request_id text,
  created_at timestamptz not null default now(),
  constraint messages_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint messages_conversation_id_fkey
    foreign key (conversation_id)
    references public.conversations (id)
    on delete cascade,
  constraint messages_role_check
    check (role in ('user', 'assistant', 'system')),
  constraint messages_content_not_blank_check
    check (btrim(content) <> ''),
  constraint messages_workspace_conversation_client_message_key
    unique (workspace_id, conversation_id, client_message_id)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  event_type text not null,
  subject_type text,
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint usage_events_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint usage_events_event_type_not_blank_check
    check (btrim(event_type) <> '')
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  actor_admin_user_id uuid,
  actor_type text not null default 'system',
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint audit_logs_actor_admin_user_id_fkey
    foreign key (actor_admin_user_id)
    references public.admin_users (id)
    on delete set null,
  constraint audit_logs_actor_type_check
    check (actor_type in ('admin', 'system', 'service')),
  constraint audit_logs_action_not_blank_check
    check (btrim(action) <> '')
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  provider text not null,
  display_name text,
  status text not null default 'disabled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_connections_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces (id)
    on delete cascade,
  constraint integration_connections_provider_not_blank_check
    check (btrim(provider) <> ''),
  constraint integration_connections_status_check
    check (status in ('disabled', 'active', 'error', 'archived'))
);

comment on table public.integration_connections is
  'Non-secret integration metadata only. Credentials and webhook secrets stay outside this table.';

create index if not exists memberships_workspace_id_idx
  on public.memberships (workspace_id);
create index if not exists memberships_admin_user_id_idx
  on public.memberships (admin_user_id);

create index if not exists categories_workspace_published_sort_idx
  on public.categories (workspace_id, is_published, sort_order);

create index if not exists products_workspace_status_sort_idx
  on public.products (workspace_id, status, sort_order);
create index if not exists products_category_id_idx
  on public.products (category_id);

create index if not exists product_images_workspace_id_idx
  on public.product_images (workspace_id);
create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary_per_product_idx
  on public.product_images (product_id)
  where is_primary;

create index if not exists quote_requests_workspace_status_created_idx
  on public.quote_requests (workspace_id, status, created_at desc);

create index if not exists quote_request_items_workspace_id_idx
  on public.quote_request_items (workspace_id);
create index if not exists quote_request_items_quote_request_id_idx
  on public.quote_request_items (quote_request_id);
create index if not exists quote_request_items_product_id_idx
  on public.quote_request_items (product_id);

create index if not exists conversations_workspace_status_created_idx
  on public.conversations (workspace_id, status, created_at desc);
create index if not exists conversations_quote_request_id_idx
  on public.conversations (quote_request_id);

create index if not exists messages_workspace_created_idx
  on public.messages (workspace_id, created_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists usage_events_workspace_type_created_idx
  on public.usage_events (workspace_id, event_type, created_at desc);

create index if not exists audit_logs_workspace_created_idx
  on public.audit_logs (workspace_id, created_at desc);
create index if not exists audit_logs_actor_admin_user_id_idx
  on public.audit_logs (actor_admin_user_id);

create index if not exists integration_connections_workspace_provider_idx
  on public.integration_connections (workspace_id, provider);
