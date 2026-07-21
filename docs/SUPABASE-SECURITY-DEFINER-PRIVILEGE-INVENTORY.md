# Supabase SECURITY DEFINER Privilege Inventory

This is the repository-derived review contract for every function that is in
the `public` schema and `SECURITY DEFINER` after migration
`20260721090000_preproduction_security_remediation.sql`. The forward repair is
`20260721183000_public_security_definer_privilege_hardening.sql`.

The inventory was derived from the ordered migration chain, website RPC call
sites, final `pg_policies`, trigger catalogs, and the disposable local
PostgreSQL harness. It does not record or rely on production queries.

## Role Contract

Anonymous execution is limited to these exact signatures:

- `public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)`
- `public.get_public_catalogue(uuid,text)`
- `public.get_public_homepage_hero(uuid)`
- `public.get_public_page_media(uuid,text)`
- `public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)`
- `public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)`

Authenticated execution is limited to the ten public RPCs with deliberate
session-bound website call sites shown below. No public-schema `SECURITY
DEFINER` function requires `service_role` execution: current server runtime
uses either the server-only anon client for public flows or the session-bound
authenticated client for admin flows. `PUBLIC` receives no execution grant.

The "prior SQL" column describes the explicit grant/revoke intent in the
ordered repository migrations before the forward repair. Supabase production
defaults can add direct role grants, and PostgreSQL grants `EXECUTE` to
`PUBLIC` by default, so the repair revokes all four roles by exact signature
before applying the reviewed allowlists.

## Complete Pre-Repair Public Inventory

| Exact signature | Intended caller and website call site | Policy / trigger / internal dependency | Prior explicit SQL | Final access / disposition |
| --- | --- | --- | --- | --- |
| `public.current_admin_access_email()` | Internal admin-access helper; no website RPC call | Used by admin-access membership helpers | Revoke `PUBLIC`; grant `authenticated` | Public owner-only compatibility helper |
| `public.current_admin_access_id(uuid)` | Internal admin-access helper; no website RPC call | Used by `execute_admin_access_write` | Revoke `PUBLIC`; grant `authenticated` | Public owner-only internal helper |
| `public.current_product_admin_user_id(uuid)` | Internal write helper; no website RPC call | Used by product, hero, and page-media write RPCs | Revoke `PUBLIC`; grant `authenticated` | Public owner-only internal helper |
| `public.current_quote_admin_user_id(uuid)` | Internal quote helper; no website RPC call | Quote manifest/outcome RLS and quote write RPCs | Revoke `PUBLIC`; grant `authenticated` | Original moved to `private` for RLS; public owner-only compatibility wrapper |
| `public.enqueue_search_index_job(uuid,text,uuid,text,text,text,text,jsonb,text)` | Authenticated call in `website/lib/search-index/supabase-search-index-adapter.ts` | Called by listing write functions and the website adapter | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.ensure_admin_access_membership(uuid)` | Authenticated call in `website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts` | Uses admin-access identity helpers | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_access_write(uuid,text,text)` | Authenticated call in `website/lib/admin/access/admin-access-management.ts` | Uses owner and current-access helpers | Exact revoke in `20260721090000`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_homepage_hero_image_write(uuid,jsonb)` | Authenticated call in `website/lib/hero/admin-homepage-hero-write.ts` | Uses current product admin helper | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_homepage_hero_write(uuid,jsonb)` | No current website call; historical compatibility wrapper | Calls the image-only hero write RPC | Revoke `PUBLIC`; grant `authenticated` | Owner-only; no client role grant |
| `public.execute_admin_product_write(text,uuid,uuid,jsonb)` | Authenticated call in `website/lib/products/persistence/supabase-product-persistence.ts` | Uses current product admin helper and audit/outbox writes | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_public_page_media_write(uuid,text,jsonb)` | Authenticated call in `website/lib/page-media/admin-public-page-media-write.ts` | Uses current product admin helper | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_quote_crm_handoff_queue_update(uuid,uuid,text,text)` | Authenticated call in `website/lib/quote/admin-write/admin-quote-request-crm-handoff-write.ts` | Uses current quote admin helper | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.execute_admin_quote_workflow(uuid,uuid,text,text)` | Authenticated call in `website/lib/quote/admin-write/admin-quote-request-status-write.ts` | Uses current quote admin helper | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text)` | No current website call; superseded overload | None after the nine-argument overload was introduced | Revoke `PUBLIC`; historical `anon` removed | Owner-only; no client role grant |
| `public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)` | Server-only anon call in `website/lib/quote/quote-handoff-repository.ts` | Validates exact claim and writes delivery/outbox state | Exact revoke; grant `anon` | `anon` only |
| `public.get_admin_access_membership(uuid,uuid)` | Authenticated call in `website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts` | Safe admin-gate DTO | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.get_public_catalogue(uuid,text)` | Server-only anon call in `website/lib/catalogue/catalogue-repository.ts` | Public catalogue boundary | Revoke `PUBLIC`; grant `anon, authenticated` | `anon` only |
| `public.get_public_homepage_hero(uuid)` | Server-only anon call in `website/lib/hero/public-homepage-hero-repository.ts` | Public homepage boundary | Revoke `PUBLIC`; grant `anon, authenticated` | `anon` only |
| `public.get_public_page_media(uuid,text)` | Server-only anon call in `website/lib/page-media/public-page-media-repository.ts` | Public page-media boundary | Revoke `PUBLIC`; grant `anon, authenticated` | `anon` only |
| `public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)` | Server-only anon call in `website/lib/quote/quote-repository.ts` | Calls private payload digest | Exact revoke; grant `anon` | `anon` only |
| `public.insert_transcript_audit_event(uuid,jsonb)` | No active runtime call; local/test injected adapter only | Transcript audit insert boundary | Revoke `PUBLIC`; no client grant | Owner-only |
| `public.insert_transcript_evidence_record(uuid,jsonb)` | No active runtime call; local/test injected adapter only | Transcript evidence insert boundary | Revoke `PUBLIC`; no client grant | Owner-only |
| `public.is_public_website_quote_request(uuid,uuid)` | Policy-only helper; no website RPC call | `quote_request_items_public_insert_website_quote` | Revoke `PUBLIC`; grant `anon` | Moved to `private`; `anon` executes only for RLS |
| `public.is_workspace_admin_access_member(uuid)` | Policy/internal helper; no website RPC call | `admin_access_member_select`, list and membership helpers | Revoke `PUBLIC`; grant `authenticated` | Original moved to `private` for RLS; public owner-only compatibility wrapper |
| `public.is_workspace_admin_access_owner(uuid)` | Internal helper; no website RPC call | Admin-access mutation and membership provisioning | Revoke `PUBLIC`; grant `authenticated` | Public owner-only internal helper |
| `public.is_workspace_member(uuid)` | Policy-only helper; no website RPC call | Workspace, membership, catalogue, quote, integration, hero, and page-media read policies | Revoke `PUBLIC`; grant `authenticated` | Moved to `private`; `authenticated` executes only for RLS |
| `public.is_workspace_product_manager(uuid)` | Policy/internal helper; no website RPC call | Hero/page-media and Storage policies; admin write helpers | Revoke `PUBLIC`; grant `authenticated` | Original moved to `private` for RLS; public owner-only compatibility wrapper |
| `public.is_workspace_quote_manager(uuid)` | Policy-only helper; no website RPC call | Quote activity and CRM manifest/outcome policies | Revoke `PUBLIC`; grant `authenticated` | Moved to `private`; `authenticated` executes only for RLS |
| `public.list_admin_access_records(uuid)` | Authenticated call in `website/lib/admin/access/admin-access-management.ts` | Uses admin-access membership helper | Revoke `PUBLIC`; grant `authenticated` | `authenticated` only |
| `public.persist_transcript_batch(uuid,jsonb,jsonb)` | No active runtime call; local/test injected adapter only | Transcript persistence boundary | Revoke `PUBLIC`; no client grant | Owner-only |
| `public.prevent_admin_access_owner_mutation()` | Trigger only | `admin_access_prevent_owner_mutation` | Revoke `PUBLIC`; no client grant | Owner-only; trigger remains attached |
| `public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)` | Server-only anon call in `website/lib/quote/quote-repository.ts` | Admission proof, atomic quote/items/outbox persistence | Exact revoke; grant `anon` | `anon` only |
| `public.touch_admin_access_updated_at()` | Trigger only | `admin_access_touch_updated_at` | Revoke `PUBLIC`; no client grant | Owner-only; trigger remains attached |

There are no repository-defined public `SECURITY DEFINER` event-trigger
functions. The two public trigger functions above are ordinary row-trigger
functions and remain owner-executable through their attached triggers.

## Non-Exposed Policy Helpers

The migration uses `ALTER FUNCTION ... SET SCHEMA private`, which preserves the
function OID. PostgreSQL therefore updates dependent RLS and Storage policy
expressions without dropping or weakening those policies.

Moved originals:

- `private.current_quote_admin_user_id(uuid)`
- `private.is_public_website_quote_request(uuid,uuid)`
- `private.is_workspace_admin_access_member(uuid)`
- `private.is_workspace_member(uuid)`
- `private.is_workspace_product_manager(uuid)`
- `private.is_workspace_quote_manager(uuid)`
- `private.is_listing_media_product_admin_object(text,text)`
- `private.is_hero_media_admin_object(text,text)`

### Final effective privilege inventory

| Exact signature | `anon` | `authenticated` | `service_role` | `PUBLIC` |
| --- | --- | --- | --- | --- |
| `private.current_quote_admin_user_id(uuid)` | No | Execute | No | No |
| `private.is_hero_media_admin_object(text,text)` | No | Execute | No | No |
| `private.is_listing_media_product_admin_object(text,text)` | No | Execute | No | No |
| `private.is_public_website_quote_request(uuid,uuid)` | Execute | No | No | No |
| `private.is_workspace_admin_access_member(uuid)` | No | Execute | No | No |
| `private.is_workspace_member(uuid)` | No | Execute | No | No |
| `private.is_workspace_product_manager(uuid)` | No | Execute | No | No |
| `private.is_workspace_quote_manager(uuid)` | No | Execute | No | No |
| `private.quote_submission_payload_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)` | No | No | No | No |
| `private.submit_public_quote_request_unadmitted(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)` | No | No | No | No |

The migration owner retains inherent management rights for every function. The
two owner-only internal functions remain callable only through their reviewed
owner-executed, schema-qualified dependencies.

`anon` receives `USAGE` on `private` and exact execution only on the public
quote policy helper. `authenticated` receives `USAGE` and exact execution only
on the seven admin/RLS/Storage helpers it needs. The schema is not exposed by
PostgREST, all other private objects retain their revokes, and `service_role`
receives no schema usage or helper execution grant.

The forward migration makes future functions deny-by-default for the migration
owner with a global `ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE` from
`PUBLIC`, `anon`, `authenticated`, and `service_role`. Separate `public` and
`private` schema-scoped revokes remain only to reverse any earlier matching
schema-scoped grants; they are not treated as protection from PostgreSQL's
global default `PUBLIC EXECUTE`. After all helper moves and creations, the
migration revokes execution on every existing function in `private` before
restoring the exact helper allowlist above.

## Production PostgREST Prerequisite

Before applying the forward migration to production, verify read-only that
`private` is absent from PostgREST's exposed schemas. Do not expose `private`
and do not add it to PostgREST's extra search path for this migration:
explicitly schema-qualified `private.*` RLS and Storage policy helpers do not
require either setting. Treat an exposed or unverified `private` schema as a
deployment hold. This verification must not change PostgREST, Supabase, or
production configuration.

## Regression Sources

- `scripts/security-definer-privilege-contract.cjs` is the exact-signature
  executable contract shared by static and PostgreSQL behavior tests.
- `scripts/validate-supabase-migrations.test.cjs` requires an exact revoke for
  every pre-repair signature and rejects unreviewed grants.
- `scripts/test-supabase-rls.cjs` applies the chain through
  `20260721090000`, models direct and inherited production-shaped grants,
  applies the forward migration, creates deny-by-default probes in `public`
  and `private`, and then runs the complete RLS/schema suite.
- `scripts/security-remediation-rls-checks.cjs` enumerates the final catalog,
  invokes every non-allowlisted public definer as `anon`, enumerates every
  private function and its effective role privileges, checks private policy
  dependencies, and preserves the admission/handoff/admin behavior tests.
