# Deployment Environment Readiness

Phase 1O-A is readiness only. No deployment is performed, no Supabase Cloud
connection is used, and no real environment values are added.

The future target shape remains a Vercel-hosted `website/` Next.js app with
server-only Supabase access and a temporary server-side n8n provider behind the
first-party chat API. This document defines the environment contract that must
be reviewed before a future deployment is approved.

The machine-readable companion contract is:

```text
docs/contracts/server-env-contract.json
```

It lists names, feature ownership, visibility, and browser-exposure rules only.
It does not contain values.

## Required Server-Only Runtime Variables

### Supabase read/write runtime

- `SUPABASE_URL`: server-side Supabase project endpoint used only by the
  server Supabase helper.
- `SUPABASE_ANON_KEY`: server-side anon key used with RLS through first-party
  server routes and repositories.

These variables are required before any DB-backed catalogue read or approved
quote persistence path can use Supabase. They must never be exposed through
browser-visible variables.

### Public catalogue DB-backed reads

- `CATALOGUE_WORKSPACE_ID`: trusted server-side workspace gate used by the
  catalogue repository.
- Matching `catalogue_public_workspace_config` row: database-owned active
  workspace configuration required by `get_public_catalogue`.

The browser must not choose the catalogue workspace. If Supabase env,
`CATALOGUE_WORKSPACE_ID`, the RPC response, or the active config row is
missing, the catalogue uses safe fallback to shell catalogue data.

### Quote persistence

- `QUOTE_WORKSPACE_ID`: trusted server-side workspace gate for approved public
  quote request persistence.

Quote route fails safely when Supabase or quote workspace configuration is
missing. It must not expose Supabase errors or workspace details to the
browser.

### Chat provider

- `CHAT_PROVIDER`: server-side provider selector. Phase 1 uses `n8n`.
- `N8N_CHAT_WEBHOOK_URL`: server-only n8n webhook URL for the temporary
  provider.
- `N8N_CHAT_WEBHOOK_TIMEOUT_MS`: server-only timeout setting for the temporary
  provider.

Chat route fails safely when the provider or webhook config is missing. The
browser must only call `POST /api/chat` and must never receive the n8n webhook
URL.

### Abuse throttling and trusted proxy headers

- `CHAT_TRUSTED_CLIENT_IP_HEADER`: optional server-side header allowlist entry
  for chat rate limiting.
- `QUOTE_TRUSTED_CLIENT_IP_HEADER`: optional server-side header allowlist entry
  for quote rate limiting.

Only set these to headers overwritten by the trusted deployment proxy or CDN.
User-supplied forwarding headers must not be trusted by default. If no trusted
header is configured or present, the routes use their fail-closed fallback
buckets.

## Explicitly Forbidden Environment And Config

Do not add:

- `NEXT_PUBLIC_SUPABASE_*`.
- `NEXT_PUBLIC_N8N*`.
- Browser-visible n8n URLs.
- `SUPABASE_SERVICE_ROLE_KEY`.
- Any service-role runtime key or path.
- `website/chat-config.js` as source for the Next.js app.

Service-role runtime paths remain deferred. Browser Supabase remains forbidden.
n8n webhook access remains server-only.

## Safe Missing-Env Behaviour

- Catalogue: falls back to shell catalogue data when Supabase env, trusted
  workspace config, or the active workspace config row is missing.
- Quote: returns a safe persistence-unavailable response when required
  persistence env is missing or persistence fails.
- Chat: returns or delegates to safe fallback behaviour when provider or webhook
  config is missing.

These behaviours are intentional so local development, tests, and unconfigured
environments do not need Supabase Cloud, deployment secrets, live n8n, or
service-role keys.

## Future deployment preflight checklist

Before any future deployment is approved, verify:

- All required variables are configured only in server-side deployment
  settings.
- No `NEXT_PUBLIC_SUPABASE_*` or `NEXT_PUBLIC_N8N*` variables exist.
- No browser bundle references Supabase server env, n8n webhook env, or
  service-role key names.
- `CATALOGUE_WORKSPACE_ID` matches the reviewed workspace.
- `catalogue_public_workspace_config` points to the same active workspace.
- `QUOTE_WORKSPACE_ID` names the approved quote workspace.
- `N8N_CHAT_WEBHOOK_URL` remains server-only and is not logged or exposed to
  the browser.
- Trusted client IP header variables are set only to proxy or CDN overwritten
  headers.
- Missing-env fallback behaviour has been checked before enabling real env.
- Smoke tests are planned for public catalogue list/detail, quote submission,
  chat fallback/provider behaviour, and browser bundle exposure after
  deployment is separately approved.

## Deferred

The following remain deferred until separately approved:

- Actual Vercel deployment.
- Supabase Cloud connection.
- Production seed data.
- Service-role runtime paths.
- Browser Supabase client code.
- Admin/auth UI.
- Supabase Storage.
- Product/category/product image writes.
- Conversation/message writes.
- Public product/category/product image mutation routes.
- Deployment or production configuration files.
