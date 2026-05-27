# Safety Boundaries

These rules apply to all future work in this repo unless the user gives
explicit current-turn approval naming the target and action.

## Prohibited Without Explicit Approval

- Live n8n actions.
- Docker actions.
- Workflow import/export.
- Workflow activation or execution.
- Credential operations.
- Deployment actions.
- Production system actions.
- Source-watch or runtime operations.
- Mutating customer, production, or private business data.

## Secret And Runtime File Rules

Do not print, copy, migrate, expose, or commit:

- Webhook URLs.
- Secrets or tokens.
- `.env` files.
- `.n8n-local/`.
- `.tmp/`.
- Credential bindings.
- Live runtime payloads.
- Private keys.
- Product repo secrets.
- Local config files containing private values.

`website/chat-config.js` is gitignored and may contain a local real webhook
URL. Do not use it as source for the new Next.js app.

The new app must read the n8n webhook URL only from server-side environment
variables such as `N8N_CHAT_WEBHOOK_URL`.

## Browser Exposure Rules

- Do not expose Supabase service-role keys to the browser.
- Do not expose n8n webhook URLs to the browser.
- Do not expose provider trace IDs, n8n node names, workflow errors, stack
  traces, or internal provider details to the browser.
- Browser chat must call first-party `/api/chat`, not n8n.
- Browser chat must not write directly to Supabase.
- Do not add browser-visible `NEXT_PUBLIC_SUPABASE_*` or `NEXT_PUBLIC_` n8n
  variables for the chat path.

## Chat Persistence Privacy Rules

- Treat `conversations` and `messages` as privacy-sensitive.
- Do not add actual conversation or message persistence without separate
  approval, migrations, RLS review, and tests.
- Do not trust browser-provided session IDs as identity or authorization.
- Use `clientMessageId` only for idempotency and deduplication, not
  authentication.
- Resolve chat workspace from trusted server-side configuration or a future
  trusted host/workspace mapping, never from an anonymous browser field.
- Avoid storing unnecessary PII, provider debug payloads, raw n8n internals,
  webhook URLs, forwarding headers, or trace IDs.

## Chat Rate-Limit Identity Rules

- Do not trust user-supplied forwarding headers by default.
- Configure `CHAT_TRUSTED_CLIENT_IP_HEADER` only to a deployment header that a
  trusted proxy or CDN overwrites.
- Use `clientSessionId` for per-session limiting.
- Use a trusted client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER`
  names a proxy/CDN-overwritten header and that header is present.
- If no trusted client IP source is configured or present, use a server-side
  fallback bucket as a fail-closed public chat cap so rotating
  `clientSessionId` cannot bypass rate limits.
- Configure a trusted client IP header in deployment to avoid over-broad
  fallback throttling.

## Product/Admin Persistence Rules

- Product, category, and product image writes are trusted-admin operations
  only.
- Do not add browser-side Supabase writes for product management.
- Do not add anonymous category, product, or product image write policies.
- Do not add public product-management mutation routes.
- Do not add service-role product write paths without separate approval.
- Resolve product-management workspace access from trusted server-side auth and
  membership context, not browser input.
- Keep public catalogue reads read-only, published-only, and scoped by trusted
  server-side workspace configuration.
- Keep product image/media persistence deferred until Supabase Storage strategy,
  upload flows, path validation, and lifecycle rules are approved.
- Treat Git-tracked prepared images as demo/public-shell assets, not the
  long-term media store.

## Worktree Hygiene

The repo was already dirty during planning. Do not mix unrelated dirty worktree
changes into website architecture PRs.

Before implementation, start from a clean branch or explicitly separate
unrelated local changes.

## Documentation Rule

Docs must be updated when architecture, scope, safety rules, or phase boundaries
change. Update the roadmap, relevant checklist, ADR or decision log, and safety
docs in the same PR when applicable.
