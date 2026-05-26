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

## Worktree Hygiene

The repo was already dirty during planning. Do not mix unrelated dirty worktree
changes into website architecture PRs.

Before implementation, start from a clean branch or explicitly separate
unrelated local changes.

## Documentation Rule

Docs must be updated when architecture, scope, safety rules, or phase boundaries
change. Update the roadmap, relevant checklist, ADR or decision log, and safety
docs in the same PR when applicable.
