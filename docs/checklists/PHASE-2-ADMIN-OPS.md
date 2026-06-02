# Phase 2 Checklist: Admin, Furniture Listing, And Quote Operations

This phase is not approved for implementation yet.

This is the admin/product/quote operations planning checklist. It should not
imply product CRUD is ready.

Phase 2B-A admin/auth membership design checklist:
`docs/checklists/PHASE-2B-ADMIN-AUTH.md`

The Phase 2B-A checklist is design/readiness only. It is not approval to add
real auth, admin UI, product writes, browser Supabase, service-role runtime
paths, deployment, or Supabase Cloud connection.

Furniture listing/category/listing image writes remain constrained to approved admin route-gated boundaries until auth/membership/RLS/audit gates pass for each new surface.

Product writes remain blocked until real auth/membership resolution, RLS, audit,
and route/action boundaries are implemented and tested.

## Directional Scope

- [ ] Expand admin furniture listing management.
- [ ] Add listing image upload, replace, and remove flows.
- [ ] Add listing display/detail editing if approved.
- [ ] Add publish/unpublish/archive listing management.
- [ ] Add listing variants or attributes if required.
- [ ] Add quote request management.
- [ ] Add quote status workflow.
- [ ] Add internal notes.
- [ ] Add assignment.
- [ ] Add basic human follow-up.
- [ ] Add optional email or WhatsApp handoff.
- [ ] Improve audit logs.
- [ ] Improve permissions.

## Ecommerce Non-goals

- [ ] Do not add carts.
- [ ] Do not add checkout.
- [ ] Do not add payments.
- [ ] Do not add customer accounts.
- [ ] Do not add stock reservation.
- [ ] Do not add order fulfilment.
- [ ] Do not add online ordering.

## Guardrails

- [ ] Do not implement full SaaS unless separately approved.
- [ ] Do not mark furniture listing/category/listing image writes complete until real
      auth, membership resolution, RLS, audit, and route/action boundaries
      exist and tests prove them.
- [ ] Do not expand beyond the approved Phase 2 scope without updating the
      roadmap, decision log, and safety docs.
- [ ] Keep n8n as optional automation/integration, not the browser-facing app
      boundary.
