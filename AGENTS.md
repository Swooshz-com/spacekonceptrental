# AGENTS.md

## Role

You are an execution-first coding agent working in the SpaceKonceptRental repo.

Understand the current task, inspect only the relevant repo context, make the
smallest safe change, validate it, and report clearly.

## Current Architecture Direction

This repo is moving toward a Vercel-hosted Next.js app under `website/`,
Supabase as the system of record, and a provider-based chat architecture.

Long-term public chat flow:

```text
Custom Chat UI -> POST /api/chat -> ChatProvider
```

Phase 1 uses a server-only `N8nChatProvider`. A future
`InternalSaasChatProvider` may replace n8n as the chat runtime without changing
the frontend.

The browser must never call n8n directly in the long-term app. The old static
`@n8n/chat` demo is legacy reference only until replaced. Do not ship the old
widget and the new custom chat as competing production paths.

## Scope Control

- Do not start app development unless the user explicitly asks for
  implementation.
- Phase 1 must remain intentionally small. See
  `docs/checklists/PHASE-1-MVP.md`.
- Future phase checklists are guardrails only. They are not approval to
  implement those phases.
- When architecture, scope, safety rules, or phase boundaries change, update the
  relevant docs in the same PR.
- Before implementation work, start from a clean branch or explicitly separate
  unrelated local changes.
- Do not mix unrelated dirty worktree entries into website architecture PRs.

## Safety Boundaries

Do not run live n8n, Docker, workflow import/export, workflow activation or
execution, credential changes, deployments, production systems, source-watch, or
runtime operations without explicit current-turn user approval naming the target
and action.

Never print, copy, migrate, expose, or commit secrets, webhook URLs, `.env`
files, `.n8n-local/`, `.tmp/`, credential bindings, runtime payloads, local
config files, private keys, or product repo secrets.

`website/chat-config.js` is gitignored and may contain a local real webhook URL.
Never read it as source for the new app, print it, copy it, migrate it, commit
it, or expose it. The new app must read the n8n webhook URL only from
server-side environment variables such as `N8N_CHAT_WEBHOOK_URL`.

Never expose Supabase service-role keys to the browser. Use Supabase RLS for
tenant isolation when schema is introduced.

## Documentation Map

- `docs/PROJECT-CONTEXT.md` - project and repo context for future agents.
- `docs/ARCHITECTURE.md` - approved system architecture and chat API boundary.
- `docs/PHASE-ROADMAP.md` - phase sequencing and implementation gates.
- `docs/SAFETY-BOUNDARIES.md` - hard operational and secret-handling rules.
- `docs/DECISION-LOG.md` - concise decision history.
- `docs/ADR/0001-nextjs-supabase-chat-provider.md` - architecture decision.
- `docs/checklists/` - phase checklists and explicit non-goals.

## Validation

Use the lowest-cost relevant checks first. For docs-only changes, run at least:

```powershell
git diff --check
git status --short
```

Run `npm run validate:n8n` or `npm run test:n8n-validation` only when workflow
JSON, n8n helper scripts, or n8n validation contracts are touched.
