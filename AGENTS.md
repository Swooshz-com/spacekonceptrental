# AGENTS.md

## Role

You are an execution-first coding agent working in the SpaceKonceptRental repo.

Understand the current task, inspect only the relevant repo context, make the
smallest safe change, validate it, and report clearly.

Do not stop after setup; continue implementation unless blocked by a real
error.

## Start Here

Before editing, confirm:

- Current branch.
- Current head commit.
- Dirty state.

Start by confirming current branch, head, and dirty state.

If on an old branch, update from current main before creating a new branch.

Use these docs as the source of truth:

- `docs/PHASE-STATUS.md` - quick current status and latest phase summary.
- `docs/PHASE-ROADMAP.md` - phase sequencing and implementation gates.
- `docs/checklists/README.md` - checklist ownership and maintenance rules.
- `docs/SAFETY-BOUNDARIES.md` - hard operational and secret-handling rules.
- `docs/DECISION-LOG.md` - accepted decisions and rationale.
- `docs/PROJECT-CONTEXT.md` - repo and architecture context.

Latest completed phase at the start of Phase 2B-G: Phase 2B-F - checklist
hygiene and status reconciliation, merged in PR #45 at
`1e67b2e7ca1098a474b2be29bf372ad60d20807e`.

## Current Architecture Direction

`website/` is the Next.js app root.

Supabase is the future system of record for app data, auth/admin users,
memberships, quotes, products, audits, and workspace boundaries.

Long-term public chat flow:

```text
Custom Chat UI -> POST /api/chat -> ChatProvider
```

n8n remains temporary server-side integration only.

Browser must never call n8n directly.

The current SKR website may keep using the existing n8n/Pinecone chatbot
workflow as a temporary production bridge.

The future SaaS chatbot should be a separate project/app.

SKR can later become the first client/tenant of that SaaS chatbot.

Do not implement SaaS chatbot app work in this repo yet.

Do not migrate Pinecone in this repo yet.

Do not add Pinecone runtime code or credentials without separate approval.

## Current Runtime Blockers

These remain blocked until explicitly approved, implemented in the right phase,
and proven by tests:

- Real auth runtime wiring remains blocked.
- Supabase Auth runtime wiring remains blocked.
- Cookie reads remain blocked.
- Header reads remain blocked.
- Login/logout routes remain blocked.
- Protected admin pages remain blocked.
- Admin UI remains blocked.
- Resolver/adapter runtime wiring remains blocked.
- Product/category/product image writes remain blocked.
- Conversation/message writes remain blocked.
- Supabase Storage remains blocked.
- Supabase Cloud connection remains blocked.
- Deployment and Vercel config remain blocked.
- Browser Supabase remains blocked.
- Service-role runtime paths remain blocked unless separately approved.

Product/category/product image writes remain blocked until real
auth/membership resolution, RLS, audit, and route/action boundaries are
implemented and tested.

## Checklist Maintenance

Every phase/status PR must update exactly the relevant checklist(s).

Do not duplicate the same item across checklists unless one entry is a
cross-link or reference.

Do not mark planned, scaffolded, design, or policy work as runtime complete.

Completed design/scaffold/policy work must be named as design/scaffold/policy.

Runtime blockers stay unchecked until runtime code exists and tests prove it.

Cross-link instead of duplicating checklist items.

Narrative plans, roadmaps, status summaries, and decision docs stay in `docs/`.
Checkbox/status trackers stay in `docs/checklists/`.

## Scope Control

Keep PRs narrow.

Avoid unrelated cleanup unless owner explicitly approves it.

When the owner explicitly approves a deletion/move, document it in the PR body.

Future phase checklists are guardrails only. They are not approval to implement
those phases.

When architecture, scope, safety rules, or phase boundaries change, update the
relevant docs in the same PR.

Do not mix unrelated dirty worktree entries into website architecture PRs.

## Safety Boundaries

Do not run live n8n, Docker, workflow import/export, workflow activation or
execution, credential changes, deployments, production systems, source-watch,
or runtime operations without explicit current-turn user approval naming the
target and action.

Never print, copy, migrate, expose, or commit secrets, webhook URLs, `.env`
files, `.n8n-local/`, `.tmp/`, credential bindings, runtime payloads, local
config files, private keys, or product repo secrets.

`website/chat-config.js` is gitignored and may contain a local real webhook URL.
Never read it as source for the new app, print it, copy it, migrate it, commit
it, or expose it. The new app must read the n8n webhook URL only from
server-side environment variables such as `N8N_CHAT_WEBHOOK_URL`.

Never expose Supabase service-role keys to the browser. Browser Supabase
remains forbidden unless separately approved.

Do not add `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_N8N*`,
`SUPABASE_SERVICE_ROLE_KEY`, real env values, deployment config, or production
seed data without separate approval.

## Validation

Run relevant validation for every PR.

For docs-only PRs with static tests, run at least:

```powershell
cd website
npm test
npm run typecheck
npm run build
cd ..
git diff --check
```

Run root validation scripts when touched or relevant:

```powershell
npm run validate:supabase-migrations
npm run test:supabase-migrations
npm run test:supabase-rls
npm run validate:n8n
npm run test:n8n-validation
```

Do not use Supabase CLI, `npx supabase`, Supabase Cloud commands, Vercel
deployment commands, or live n8n import/export/execute commands unless
explicitly approved.
