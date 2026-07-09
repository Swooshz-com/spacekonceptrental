# Chatbot Launch Boundary

This document defines the public chatbot boundary for the SpaceKonceptRental
launch path. It is not hosted staging evidence, not live n8n setup evidence,
and not a UAT pass.

## Current Implementation

- The public chat UI is the custom `ChatWidget`.
- The browser posts chat messages only to the first-party `/api/chat` route.
- The server-side chat provider can hand off to n8n when server configuration
  exists.
- The public route returns generic safe errors when the provider is unavailable.
- The chatbot is not rendered on protected admin routes, including `/admin`,
  `/admin/hero`, `/admin/catalogue`, `/admin/setups`, `/admin/enquiry-email`,
  `/admin/delivery-log`, `/admin/login`, and `/admin/logout`.

## Allowed Behaviour

The chatbot may:

- Help visitors navigate Home, Catalogue, Setups, About, and Request Quote.
- Explain how to submit a quote/enquiry.
- Answer basic rental enquiry FAQs from approved public site content.
- Suggest using the Request Quote form for item-specific or event-specific
  requests.
- Guide visitors to browse catalogue items and setup presentation pages.

## Blocked Behaviour

The chatbot must not:

- Confirm booking or reservation.
- Promise stock/item availability.
- Quote final price.
- Take payment.
- Create orders.
- Claim a human has reviewed anything.
- Claim email or n8n delivery succeeded.
- Expose admin/internal data.
- Expose provider config, secrets, environment names, webhook URLs,
  Supabase IDs, storage paths, or raw payloads.
- Call n8n directly from browser code.
- Invent catalogue/setup content not present in approved public content.

If provider output violates this boundary, SKR replaces the reply with a safe
Request Quote handoff message before it reaches the browser.

## Deferred n8n Work

Do not continue real n8n workflow implementation or mapping in this slice. The
real workflow depends on Hostinger VPS, Coolify, the hosted n8n app, real HTTPS
domains, email credentials, server networking, and hosted Supabase migration
state.

The repo-side n8n skeleton from PR #288 remains inactive and credential-free.
No live n8n workflow is imported, activated, executed, or mutated by this
chatbot boundary slice.

## Hosted Validation Still Required

Before launch, hosted validation still needs:

- Hosted Supabase migration approval and application.
- Fixed owner admin access bootstrap.
- Hostinger/Coolify deployment setup.
- Hosted n8n app setup.
- Live chat provider configuration and smoke testing.
- Public chatbot smoke tests proving browser calls only `/api/chat`.

No hosted staging readiness or UAT pass is claimed by this document.
