# Phase 3 Checklist: Internal Chatbot Provider

This phase is not approved for implementation yet.

Current direction: the current SKR repo may continue using the existing
n8n/Pinecone chatbot workflow as a temporary bridge while the website
stabilizes. The future SaaS chatbot should be a separate project/app, and SKR
can later become its first client/tenant. Do not implement SaaS chatbot app
code in this repo yet.

## Directional Scope

- [ ] Decide the separate SaaS chatbot project/app boundary.
- [ ] Decide how SKR becomes the first client/tenant later.
- [ ] Decide the future provider contract between SKR and the SaaS chatbot.
- [ ] Keep the SKR frontend on first-party `/api/chat`.
- [ ] Support shadow/test mode before any future provider switch.
- [ ] Compare n8n/Pinecone and future SaaS outputs if cost/privacy allows.
- [ ] Keep n8n/Pinecone as the current temporary bridge until replacement is
      separately approved.
- [ ] Add provider observability in the future SaaS app, not in this PR.
- [ ] Add safe failure handling in the future SaaS boundary.
- [ ] Decide what conversation history is used by the future SaaS provider.

## Guardrails

- [ ] Do not implement RAG/vector store here unless Phase 4 is approved.
- [ ] Do not implement SaaS chatbot app code inside this repo yet.
- [ ] Do not force the current n8n/Pinecone workflow into the future SaaS
      architecture.
- [ ] Do not expose provider internals to the browser.
- [ ] Do not make frontend changes required for provider swap.
