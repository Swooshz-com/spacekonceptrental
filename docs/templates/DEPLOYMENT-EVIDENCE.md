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

## Remaining-work map

- Completed phases confirmed: `<summary>`
- Safe next phases not bundled into this PR: `<summary>`
- Blocked phases requiring explicit owner approval: `<summary>`
- Phases too broad or risky to bundle: `<summary>`
- Largest safe bundle rationale: `<summary>`
- Confirmation that unrelated runtime, privacy, CRM, notification, SaaS chatbot,
  or ecommerce work is not bundled: `<confirmed-by>`

## Environment reviewed

- Supabase project reviewed: `<review-summary>`
- Hosting project reviewed: `<review-summary>`
- Runtime scope reviewed: `<review-summary>`

## Env placement confirmation

- Supabase env values are server-only: `<confirmed-by>`
- Catalogue workspace env is server-only: `<confirmed-by>`
- Quote workspace env is server-only: `<confirmed-by>`
- Admin trusted workspace env is server-only: `<confirmed-by>`
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
- Public catalogue metadata gate reviewed: `<confirmed-by>`

## Quote workspace confirmation

- Quote workspace reviewed: `<approved-quote-workspace-id>`
- `QUOTE_WORKSPACE_ID` reviewed: `<confirmed-by>`
- Quote route safe error behaviour reviewed: `<confirmed-by>`
- Quote throttling unchanged: `<confirmed-by>`

## Admin trusted workspace confirmation

- Admin workspace reviewed: `<approved-admin-workspace-id>`
- `ADMIN_TRUSTED_WORKSPACE_ID` reviewed: `<confirmed-by>`
- Admin expected origin and host reviewed: `<confirmed-by>`
- Admin CSRF proof secret placement reviewed as server-only: `<confirmed-by>`
- Owner/admin membership smoke-test actor reviewed: `<confirmed-by>`
- Viewer or wrong-workspace denial actor reviewed: `<confirmed-by>`

## Listing media confirmation

- `listing-media` public bucket model reviewed: `<confirmed-by>`
- Public object serving by unguessable server-generated URL acknowledged:
  `<confirmed-by>`
- Public catalogue rendering metadata gate reviewed: `<confirmed-by>`
- Admin listing media upload boundary reviewed: `<confirmed-by>`
- No customer upload or arbitrary public upload route: `<confirmed-by>`

## n8n server-only webhook confirmation

- Webhook stored only server-side: `<confirmed-by>`
- Browser calls only `POST /api/chat`: `<confirmed-by>`
- No n8n workflow files changed: `<confirmed-by>`
- No live n8n import, export, activation, or execution: `<confirmed-by>`

## Smoke-test evidence

- Static/fallback homepage smoke test: `<result-and-evidence>`
- Catalogue fallback smoke test: `<result-and-evidence>`
- DB-backed catalogue smoke test: `<result-and-evidence>`
- Listing detail page smoke test: `<result-and-evidence>`
- Uploaded listing image rendering smoke test: `<result-and-evidence>`
- Quote submission smoke test: `<result-and-evidence>`
- Quote handoff smoke test: `<result-and-evidence>`
- Admin login/protected shell smoke test: `<result-and-evidence>`
- Admin product/category/listing management smoke test: `<result-and-evidence>`
- Admin listing media upload smoke test: `<result-and-evidence>`
- Admin quote inbox/status/internal note workflow smoke test: `<result-and-evidence>`
- Atomic quote workflow RPC smoke test: `<result-and-evidence>`
- Chat fallback smoke test: `<result-and-evidence>`
- Server-only n8n chat smoke test: `<result-and-evidence>`
- 404/error states smoke test: `<result-and-evidence>`
- No provider/SQL/secret leakage check: `<result-and-evidence>`
- Browser bundle exposure check: `<result-and-evidence>`
- Browser console server-only env exposure check: `<result-and-evidence>`

## Rollback plan

- Rollback owner: `<owner>`
- Rollback trigger: `<trigger>`
- Disable public traffic action: `<action>`
- Remove or rotate leaked env values action: `<action>`
- Disable n8n webhook env action: `<action>`
- Revert deployment action: `<action>`
- Fallback catalogue behaviour verified: `<result-and-evidence>`
- Quote submission unavailable-or-safe behaviour verified: `<result-and-evidence>`
- Incident notes captured: `<location-or-reference>`

## Known limitations

- In-process throttling limitation: `<acknowledged>`
- Service-role runtime path prohibition: `<acknowledged>`
- Browser Supabase prohibition: `<acknowledged>`
- Deferred conversation/message writes: `<acknowledged>`
- Deferred public quote status, notifications, CRM, and ecommerce flows:
  `<acknowledged>`

## Safety confirmations

- No real secrets or env values are included in this PR body.
- No deployment config is included unless this is the separately approved
  deployment PR.
- No service-role runtime path is added unless separately approved.
- No browser Supabase config is added unless separately approved.
- No conversation/message writes are added unless separately approved.
- No n8n workflow files are changed unless separately approved.
- No customer uploads, public upload routes, public quote status tracking,
  notifications, CRM, carts, checkout, payments, customer accounts, stock
  reservation, order fulfilment, confirmed booking, or online ordering are
  added unless separately approved.
- `website/chat-config.js` was not read, copied, printed, exposed, or changed.
