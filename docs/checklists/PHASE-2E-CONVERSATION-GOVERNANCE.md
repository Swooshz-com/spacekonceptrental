# Phase 2E-A Conversation Privacy And Retention Governance

This checklist tracks the Phase 2E-A governance planning bundle. It is not
runtime approval and is not a permission slip for transcript persistence.

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

## Runtime Blockers

- [ ] Conversation/message persistence is not implemented.
- [ ] Transcript storage is not implemented.
- [ ] Transcript reads are not implemented.
- [ ] Admin transcript UI is not implemented.
- [ ] Customer accounts are not approved.
- [ ] Public quote tracking is not approved.
- [ ] Notifications are not approved.
- [ ] CRM integration is not approved.
- [ ] n8n/Pinecone runtime changes are not approved.
- [ ] SaaS chatbot runtime work is not approved.
- [ ] Deployment is not approved.
- [ ] Browser Supabase remains forbidden.
- [ ] Service-role runtime paths remain forbidden.
- [ ] `website/chat-config.js` access remains forbidden.

## Future Implementation Gates

- [ ] Add migrations only after retention, deletion/export, RLS, and transcript
      access rules are approved.
- [ ] Add transcript reads only after protected admin access rules and audit
      expectations are implemented and tested.
- [ ] Add public transcript or quote-tracking access only after a separate
      customer identity and ownership model is approved.
- [ ] Add n8n/Pinecone or SaaS chatbot runtime changes only in a separate
      approved runtime phase.
