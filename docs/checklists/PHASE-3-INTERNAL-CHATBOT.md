# Phase 3 Checklist: Internal Chatbot Provider

This phase is not approved for implementation yet.

## Directional Scope

- [ ] Implement `InternalSaasChatProvider` behind the same provider contract.
- [ ] Keep frontend unchanged.
- [ ] Support shadow/test mode before switching provider.
- [ ] Compare n8n and internal outputs if cost/privacy allows.
- [ ] Switch with `CHAT_PROVIDER=internal`.
- [ ] Keep n8n as notifications/integration layer only.
- [ ] Add provider observability.
- [ ] Add safe failure handling.
- [ ] Decide what conversation history is used by the internal provider.

## Guardrails

- [ ] Do not implement RAG/vector store here unless Phase 4 is approved.
- [ ] Do not expose provider internals to the browser.
- [ ] Do not make frontend changes required for provider swap.
