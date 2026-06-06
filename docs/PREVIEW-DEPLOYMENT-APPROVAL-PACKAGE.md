# Preview Deployment Approval Package

## Purpose

This package prepares the repo for a future explicitly approved preview or
deployment PR. It gives operators and reviewers a single checklist for the
approval boundary, redacted evidence expectations, local validation commands,
cloud-project review topics, and go/no-go decision capture.

## Scope

This package covers review preparation only:

- Confirm the candidate branch is locally and statically ready for a future
  preview/deployment review.
- Confirm operators know which Supabase Cloud, Vercel, admin, public listing,
  and public quote checks must be reviewed outside the repo.
- Confirm evidence is redacted and template-only in this repo.
- Confirm deployment remains a later explicit approval, not an implied action.

This package does not approve deployment and does not deploy anything.

## Explicit Non-Approval Statement

This PR is not a deployment PR. It does not approve deployment, does not change
Vercel project config, does not connect Supabase Cloud, does not add real env
values, and does not create production evidence.

A later current-turn approval is required before any deployment, provider
connection, env change, production evidence capture, public traffic enablement,
or rollback action.

This is the explicit later approval boundary for deployment work.

## Required Reviewer Checks

- Confirm PR #119 is recorded as merged for Phase 2N-A/B with merge commit
  `ad97aace9c2145af139a45f3e0f2d0b6d09a24a9`.
- Confirm Phase 2O-A/B is approval packaging only.
- Confirm public wording stays listing, enquiry, quote, and request oriented.
- Confirm existing technical persistence internals remain unchanged:
  categories, products, and product_images are still persistence names only.
- Confirm admin listing/category/image writes still go through
  `execute_admin_product_write(...)`.
- Confirm local search-index jobs remain local derived queue records only.
- Confirm Pinecone is not treated as canonical business storage.
- Confirm no filled production evidence is committed.
- Confirm no screenshots, logs, dashboard links, raw URLs, real env values,
  keys, tokens, webhook values, or provider identifiers are committed.

## Required Validation Commands

Run these before any future deployment approval decision:

```text
npm run validate:release-candidate
npm run validate:deploy-dry-run
npm run validate:preview-approval-package
cd website && npm test
cd website && npm run typecheck
cd website && npm run build
npm run validate:supabase-migrations
npm run test:supabase-migrations
npm run test:supabase-rls
git diff --check
```

## Required Dry-Run Commands

- `npm run validate:release-candidate`
- `npm run validate:deploy-dry-run`
- `npm run validate:preview-approval-package`

All dry-run commands must complete without real env values, provider
connections, cloud-provider actions, or deployment.

## Supabase Cloud Review Checklist

- Confirm the reviewed Supabase project is identified outside the repo.
- Confirm no Supabase dashboard links, project URLs, keys, screenshots, or
  provider identifiers are committed.
- Confirm migrations pass the local static and Docker-backed checks.
- Confirm RLS remains enabled for scoped business data.
- Confirm direct browser-role listing metadata table writes remain blocked.
- Confirm `execute_admin_product_write(...)` still enforces admin
  listing/category/image writes and local search-index enqueue.
- Confirm quote workflow writes still go through
  `execute_admin_quote_workflow(...)`.
- Confirm Supabase remains the source of truth for website/admin listing and
  quote data.

## Vercel Project Review Checklist

- Confirm the reviewed Vercel project is identified outside the repo.
- Confirm no Vercel project config, dashboard links, team identifiers,
  screenshots, real URLs, or provider identifiers are committed.
- Confirm deployment target, branch, domain exposure, preview visibility, and
  rollback controls are reviewed outside the repo before public traffic.
- Confirm the app remains server-only for Supabase, n8n webhook, admin trust,
  and workspace configuration.
- Confirm no browser Supabase or public provider env is added.

## Server-Only Environment Setup Checklist

Review variable names only. Do not commit values.

| Variable name | Visibility | Required review |
| --- | --- | --- |
| `SUPABASE_URL` | Server-only | Supabase project placement reviewed externally |
| `SUPABASE_ANON_KEY` | Server-only | RLS-backed server usage reviewed externally |
| `CATALOGUE_WORKSPACE_ID` | Server-only | Public listing workspace reviewed externally |
| `QUOTE_WORKSPACE_ID` | Server-only | Quote/enquiry workspace reviewed externally |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Server-only | Protected admin workspace reviewed externally |
| `ADMIN_EXPECTED_ORIGIN` | Server-only | Admin same-origin setting reviewed externally |
| `ADMIN_EXPECTED_HOST` | Server-only | Admin host setting reviewed externally |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only | CSRF proof signing secret placement reviewed externally |
| `CHAT_PROVIDER` | Server-only | Temporary provider selection reviewed externally |
| `N8N_CHAT_WEBHOOK_URL` | Server-only | Temporary n8n webhook placement reviewed externally |
| `N8N_CHAT_WEBHOOK_TIMEOUT_MS` | Server-only | Timeout reviewed externally |
| `CHAT_TRUSTED_CLIENT_IP_HEADER` | Server-only | Trusted edge header reviewed externally |
| `QUOTE_TRUSTED_CLIENT_IP_HEADER` | Server-only | Trusted edge header reviewed externally |

## Admin Access Review Checklist

- Confirm only owner/admin members in the trusted workspace can reach protected
  admin listing, category, media, quote inbox, and quote detail surfaces.
- Confirm viewer, no-membership, wrong-workspace, and anonymous users are
  denied.
- Confirm state-changing admin routes require same-origin checks, CSRF proof,
  trusted workspace scope, and owner/admin membership.
- Confirm admin internal notes remain admin-only.
- Confirm safe unavailable states do not expose provider errors, SQL details,
  stack traces, env values, tokens, or workspace identifiers.

## Public Listing And Quote Smoke Checklist

- Public homepage loads without provider, SQL, stack trace, token, or env
  leakage.
- Public listing pages show only public-safe published listing, category, and
  listing image data.
- Public listing detail pages render safe not-found and fallback states.
- Public quote/enquiry submission posts only to first-party `POST /api/quote`.
- Public quote/enquiry success is receipt-only and exposes no public tracking
  or status link.
- Public chat remains first-party `POST /api/chat` only and is not wired to
  retrieval, RAG, Pinecone, transcript reads, or transcript writes.

## Rollback And Abort Checklist

- Abort before public traffic if any required validation command fails.
- Abort before public traffic if any dry-run command requires real env values
  or cloud-provider access.
- Abort if a secret, env value, dashboard link, screenshot, raw URL, provider
  identifier, production evidence file, Vercel config, or Supabase Cloud config
  appears in the PR.
- Abort if browser Supabase, service-role runtime paths, public/customer
  uploads, customer accounts, public quote tracking, customer-visible internal
  notes, notifications, CRM integration, n8n/Pinecone runtime changes,
  `/api/chat` retrieval/RAG wiring, transcript runtime wiring, or ecommerce
  flows appear.
- If a later deployment fails review, stop public traffic through the approved
  hosting control, rotate or remove affected external env values outside the
  repo, and rerun validation before another review.

## Final Go/No-Go Decision Table

| Decision area | Required result | Evidence location | Decision |
| --- | --- | --- | --- |
| Local validation | All required commands pass | `<reviewed externally>` | `<redacted>` |
| Dry-run validation | No deployment and no live provider access | `<reviewed externally>` | `<redacted>` |
| Supabase Cloud review | Project and RLS posture reviewed externally | `<reviewed externally>` | `<redacted>` |
| Vercel review | Project, branch, traffic, and rollback reviewed externally | `<reviewed externally>` | `<redacted>` |
| Server-only env review | Names reviewed; values kept outside repo | `<reviewed externally>` | `<redacted>` |
| Admin access smoke | Owner/admin allowed; unsafe roles denied | `<reviewed externally>` | `<redacted>` |
| Public listing/quote smoke | Listing and quote flows safe | `<reviewed externally>` | `<redacted>` |
| Scope guard | No forbidden runtime or evidence added | `<reviewed externally>` | `<redacted>` |

The final decision must be recorded outside the repo unless a later approved
policy says otherwise.
