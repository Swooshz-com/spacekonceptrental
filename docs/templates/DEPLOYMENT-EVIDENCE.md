# Deployment Evidence

Use this template for a future approved deployment PR. Replace placeholders
with reviewed, non-secret summaries only. Do not include real secrets, env
values, tokens, webhook URLs, private dashboard links, or customer data.

## Deployment summary

- Environment: `<environment-name>`
- Deployment target: `<deployment-url>`
- Operator: `<operator-name-or-role>`
- Reviewers: `<reviewer-list>`
- Approval reference: `<approval-reference>`

## Environment reviewed

- Supabase project reviewed: `<review-summary>`
- Hosting project reviewed: `<review-summary>`
- Runtime scope reviewed: `<review-summary>`

## Env placement confirmation

- Supabase env values are server-only: `<confirmed-by>`
- Catalogue workspace env is server-only: `<confirmed-by>`
- Quote workspace env is server-only: `<confirmed-by>`
- n8n webhook env is server-only: `<confirmed-by>`
- Trusted proxy header env is server-only: `<confirmed-by>`

## Forbidden public env confirmation

- No `NEXT_PUBLIC_SUPABASE_*` variables: `<confirmed-by>`
- No `NEXT_PUBLIC_N8N*` variables: `<confirmed-by>`
- No browser-visible n8n URLs: `<confirmed-by>`
- No `SUPABASE_SERVICE_ROLE_KEY` runtime path: `<confirmed-by>`
- No `website/chat-config.js` source usage: `<confirmed-by>`

## Supabase Cloud confirmation

- Project reviewed without exposing real URLs or keys: `<confirmed-by>`
- Supabase CLI was not used unless separately approved: `<confirmed-by>`
- Production seed data status: `<not-added-or-approved-reference>`

## Active catalogue workspace confirmation

- Active workspace reviewed: `<approved-catalogue-workspace-id>`
- `CATALOGUE_WORKSPACE_ID` reviewed: `<confirmed-by>`
- `catalogue_public_workspace_config` reviewed: `<confirmed-by>`
- Direct anonymous base-table catalogue denial reviewed: `<confirmed-by>`

## Quote workspace confirmation

- Quote workspace reviewed: `<approved-quote-workspace-id>`
- `QUOTE_WORKSPACE_ID` reviewed: `<confirmed-by>`
- Quote route safe error behaviour reviewed: `<confirmed-by>`
- Quote throttling unchanged: `<confirmed-by>`

## n8n server-only webhook confirmation

- Webhook stored only server-side: `<confirmed-by>`
- Browser calls only `POST /api/chat`: `<confirmed-by>`
- No n8n workflow files changed: `<confirmed-by>`
- No live n8n import, export, activation, or execution: `<confirmed-by>`

## Smoke-test evidence

- Catalogue fallback smoke test: `<result-and-evidence>`
- DB-backed catalogue smoke test: `<result-and-evidence>`
- Quote submission smoke test: `<result-and-evidence>`
- Chat fallback smoke test: `<result-and-evidence>`
- Server-only n8n chat smoke test: `<result-and-evidence>`
- Browser bundle exposure check: `<result-and-evidence>`

## Rollback plan

- Rollback owner: `<owner>`
- Rollback trigger: `<trigger>`
- Rollback action: `<action>`
- Fallback behaviour verified: `<result-and-evidence>`

## Known limitations

- In-process throttling limitation: `<acknowledged>`
- Deferred product writes: `<acknowledged>`
- Deferred conversation/message writes: `<acknowledged>`
- Deferred Storage/admin/auth/internal RAG work: `<acknowledged>`

## Safety confirmations

- No real secrets or env values are included in this PR body.
- No deployment config is included unless this is the separately approved
  deployment PR.
- No service-role runtime path is added unless separately approved.
- No browser Supabase config is added unless separately approved.
- No product/category/product image writes are added unless separately
  approved.
- No conversation/message writes are added unless separately approved.
- No n8n workflow files are changed unless separately approved.
- `website/chat-config.js` was not read, copied, printed, exposed, or changed.
