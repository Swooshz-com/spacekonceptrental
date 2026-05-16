# spacekonceptrental

Capstone project for a RAG Customer Support Agent built with n8n, Pinecone, Google Drive, and Google Sheets.

See:

`docs/capstone/README_CAPSTONE.md`

## Quick start

1. Import the inactive workflow templates from `n8n_workflows/` into n8n.
2. Configure the required non-credential placeholder values in n8n.
3. Attach credentials in n8n credential selectors.
4. Ingest approved knowledge-base files into Pinecone namespace `spacekonceptrental_kb`.
5. Run the test plan in `docs/capstone/test-plan.md`.

## Validation

Run:

```bash
npm run validate:n8n
```

## Reference files

Source/reference material lives in `ref/` and is retained for post-capstone expansion. Some original source documents may contain legacy internal naming, but repo-facing naming is now `spacekonceptrental`.
