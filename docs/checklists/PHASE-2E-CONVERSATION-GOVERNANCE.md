# Phase 2E Conversation Governance And Persistence Foundation

This checklist tracks Phase 2E conversation/message governance and the local
schema/RLS foundation. It is not runtime approval and is not a permission slip
for transcript writes, transcript reads, or admin transcript UI.

## Completed Planning Work

- [x] Privacy and PII minimisation model is documented.
- [x] Anonymous visitor identity model is documented.
- [x] Future authenticated/admin-linked identity considerations are documented
      without approving customer accounts.
- [x] Conversation/message retention rules are documented as prerequisites.
- [x] Deletion and export expectations are documented.
- [x] Transcript access rules are documented.
- [x] Admin visibility boundaries are documented.
- [x] Future persistence idempotency expectations are documented.
- [x] Redaction and minimisation guidance is documented.
- [x] Non-goals and blocked work are explicit.
- [x] Static guards prove Phase 2E-A stays governance-only.

## Phase 2E-B Completed Schema/RLS Foundation

- [x] Existing `conversations` and `messages` tables are kept as the stable
      table names.
- [x] Conversation/message schema foundation is completed with additive local
      migration constraints.
- [x] Conversation metadata is bounded and excludes unsafe operational keys.
- [x] Optional anonymous session hash is documented as non-identity
      correlation only.
- [x] Message role/type constraints are implemented.
- [x] Message content size constraints are implemented.
- [x] Message metadata is bounded and excludes unsafe operational keys.
- [x] Retention and deletion marker columns exist for future retention work.
- [x] Direct anonymous/public conversation/message reads are denied by RLS.
- [x] Direct anonymous/public conversation/message writes are denied by RLS.
- [x] Direct authenticated conversation/message reads are denied by RLS.
- [x] Direct authenticated conversation/message writes are denied by RLS.
- [x] Static guards prove Phase 2E-B stays schema/RLS-only.

## Runtime Blockers

- [ ] Runtime transcript writes remain blocked.
- [ ] Runtime transcript reads remain blocked.
- [ ] Admin transcript UI remains blocked.
- [ ] Customer accounts remain blocked.
- [ ] Public quote tracking remains blocked.
- [ ] Notifications remain blocked.
- [ ] CRM integration remains blocked.
- [ ] n8n/Pinecone runtime changes remain blocked.
- [ ] SaaS chatbot runtime work remains blocked.
- [ ] Deployment remains blocked.
- [ ] Browser Supabase remains forbidden.
- [ ] Service-role runtime paths remain forbidden.
- [ ] `website/chat-config.js` access remains forbidden.

## Future Implementation Gates

- [ ] Add runtime transcript writes only after a separately approved
      server-only trusted-workspace write path, idempotency design, and tests.
- [ ] Add transcript reads only after protected admin access rules and audit
      expectations are implemented and tested.
- [ ] Add public transcript or quote-tracking access only after a separate
      customer identity and ownership model is approved.
- [ ] Add n8n/Pinecone or SaaS chatbot runtime changes only in a separate
      approved runtime phase.
