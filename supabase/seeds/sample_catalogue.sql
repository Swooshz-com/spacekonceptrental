-- Phase 1F-D fake/sample catalogue seed fixtures only.
-- This file is for local validation and future reviewed sample loading.
-- It does not contain customer data, quote data, conversation data, secrets,
-- Supabase Storage objects, binary media, or production exports.

insert into public.workspaces (id, slug, name, primary_domain)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'sample-showroom',
    'Sample Event Showroom',
    'sample-showroom.example.test'
  ),
  (
    '11111111-1111-4111-8111-111111111112',
    'sample-outdoor-studio',
    'Sample Outdoor Studio',
    'sample-outdoor.example.test'
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  primary_domain = excluded.primary_domain;

insert into public.categories (
  id,
  workspace_id,
  slug,
  name,
  description,
  sort_order,
  is_published
)
values
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'lounge-seating',
    'Lounge Seating',
    'Sample published seating category for local catalogue validation.',
    10,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'banquet-tables',
    'Banquet Tables',
    'Sample published table category for local catalogue validation.',
    20,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    '11111111-1111-4111-8111-111111111111',
    'draft-concepts',
    'Draft Concepts',
    'Sample unpublished category used to verify anonymous RLS filtering.',
    90,
    false
  ),
  (
    '22222222-2222-4222-8222-222222222224',
    '11111111-1111-4111-8111-111111111112',
    'outdoor-sets',
    'Outdoor Sets',
    'Sample published outdoor category for local catalogue validation.',
    10,
    true
  )
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.products (
  id,
  workspace_id,
  category_id,
  slug,
  name,
  short_description,
  description,
  rental_unit,
  status,
  sort_order
)
values
  (
    '33333333-3333-4333-8333-333333333331',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'modular-lounge-set',
    'Modular Lounge Set',
    'Sample published lounge set.',
    'Fake modular lounge seating for local catalogue validation only.',
    'set',
    'published',
    10
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'banquet-table-pair',
    'Banquet Table Pair',
    'Sample published table pair.',
    'Fake banquet table package for local catalogue validation only.',
    'set',
    'published',
    20
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    'concept-backdrop-frame',
    'Concept Backdrop Frame',
    'Sample draft product hidden from anonymous reads.',
    'Fake draft backdrop concept used to verify anonymous RLS filtering.',
    'item',
    'draft',
    90
  ),
  (
    '33333333-3333-4333-8333-333333333334',
    '11111111-1111-4111-8111-111111111112',
    '22222222-2222-4222-8222-222222222224',
    'garden-bistro-set',
    'Garden Bistro Set',
    'Sample published outdoor set.',
    'Fake garden bistro set for local catalogue validation only.',
    'set',
    'published',
    10
  )
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  category_id = excluded.category_id,
  slug = excluded.slug,
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  rental_unit = excluded.rental_unit,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.product_images (
  id,
  workspace_id,
  product_id,
  storage_bucket,
  storage_path,
  alt_text,
  sort_order,
  is_primary
)
values
  (
    '44444444-4444-4444-8444-444444444441',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333331',
    'sample-catalogue-public',
    'sample-fixtures/modular-lounge-set-main.jpg',
    'Sample image metadata for a modular lounge set.',
    10,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333332',
    'sample-catalogue-public',
    'sample-fixtures/banquet-table-pair-main.jpg',
    'Sample image metadata for a banquet table pair.',
    20,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444443',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333',
    'sample-catalogue-public',
    'sample-fixtures/draft/concept-backdrop-frame-main.jpg',
    'Sample draft image metadata hidden from anonymous reads.',
    90,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '11111111-1111-4111-8111-111111111112',
    '33333333-3333-4333-8333-333333333334',
    'sample-catalogue-public',
    'sample-fixtures/garden-bistro-set-main.jpg',
    'Sample image metadata for a garden bistro set.',
    10,
    true
  )
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  product_id = excluded.product_id,
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary;
