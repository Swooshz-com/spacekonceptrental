# Preview Deployment Branch Freeze

No deployment is performed by this PR.

This does not approve deployment.

Future preview deployment requires explicit later approval. This freeze applies
after the Phase 2Q-A/B handoff package until the owner chooses:

- Approve preview deployment.
- Hold deployment.
- Pivot to product polish.

## Freeze Rules

- No feature expansion should be added before preview deployment unless
  explicitly approved.
- No runtime provider wiring changes should be added.
- No database migrations should be added unless fixing a verified blocker.
- No UI expansion should be added unless it fixes a release-blocking
  public/admin flow.
- Only blocker fixes, docs corrections, and validation corrections are allowed
  during freeze.

## Allowed During Freeze

- Reproducible validation failure fixes.
- Security-boundary fixes.
- Docs corrections that prevent operator confusion.
- Static validator corrections.
- Release-blocking public listing/category/quote/enquiry flow fixes.
- Release-blocking admin listing/image/quote workflow fixes.

## Not Allowed During Freeze

- Generic deployment-prep PRs after this handoff.
- New runtime provider wiring.
- New Supabase Cloud or Vercel config.
- Real env values, `.env` files, secrets, provider IDs, dashboard links, or
  filled evidence.
- Browser Supabase or service-role runtime paths.
- n8n workflow JSON changes.
- Pinecone runtime, SDK/package, env, executor, embedding, reranking, or vector
  upsert/delete work.
- `/api/chat` retrieval/RAG wiring.
- Public/customer uploads, customer accounts, public quote tracking,
  notifications, CRM, customer-visible internal notes, transcript runtime
  paths, or ecommerce flows.

## Evidence Handling

All preview URLs, dashboard checks, provider IDs, environment values, approval
records, screenshots, smoke evidence, and rollback evidence stay outside git.
Use `<redacted>` and `<reviewed externally>` only where placeholders are needed
in repo docs.
