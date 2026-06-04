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

## Phase 2E-C Completed Contract And Validation Boundary

- [x] Server-only persistence contract is completed for future
      conversation/message persistence commands.
- [x] Conversation persistence command, message persistence command, batch
      transcript persistence command, result, unavailable, and adapter
      dependency shapes are defined.
- [x] Validation/minimisation helpers are completed for trusted workspace IDs,
      server-generated conversation/message IDs, message role/type pairs,
      bounded content, bounded metadata, and unsafe metadata keys.
- [x] Anonymous session hash is treated as correlation only, not identity.
- [x] `clientMessageId` is treated as idempotency/deduplication only, not
      authentication or authorization.
- [x] Fake/injected adapter tests prove no live persistence dependency is used.
- [x] Static guards prove Phase 2E-C stays contract/validation-only.

## Phase 2E-D Completed RPC And Adapter Boundary

- [x] Local `persist_transcript_batch` SQL/RPC contract is defined for
      validated trusted-workspace transcript batches.
- [x] Browser roles are not granted execute on the transcript persistence RPC.
- [x] RPC metadata checks reject unsafe operational keys before table writes.
- [x] RPC persistence keeps `clientMessageId` as idempotency/deduplication only.
- [x] RPC persistence keeps anonymous session hashes as correlation only.
- [x] Server-only RPC adapter maps validated commands to an injected executor
      payload.
- [x] Default persistence remains unavailable without explicit injection.
- [x] Static guards prove Phase 2E-D does not wire `/api/chat`, browser
      Supabase, service-role runtime paths, env reads, or transcript read/UI
      surfaces.

## Phase 2E-D Hotfix Completed Findings

- [x] Conflicting `clientMessageId` reuse is rejected instead of silently dropping changed messages.
- [x] Exact duplicate retries with the same `clientMessageId` and matching
      payload return the original message ID and do not create a second row.
- [x] Conflicts on changed content, changed request ID, and changed metadata
      fail with `transcript_client_message_id_conflict`.
- [x] RPC idempotency fingerprint compares role, message type, content,
      provider, request ID, sequence number, retention expiry, and metadata.
- [x] RPC idempotency fingerprint excludes message `id` because a future
      server-side executor may regenerate server-owned IDs while replaying the
      same client idempotency key.
- [x] Transcript command validation returns safe rejected results for malformed
      JSON-like runtime input instead of throwing validation exceptions.
- [x] Static guards prove conflict rejection behavior remains in the migration
      and browser roles still do not receive RPC execute grants.

## Phase 2E-E Activation Governance And Executor Approval Gate

- [x] Phase 2E-E is documented as governance/approval-gate only.
- [x] Current Phase 2E-D RPC is documented as ungranted to browser roles.
- [x] Current TypeScript adapter is documented as requiring an injected
      executor.
- [x] No live executor exists yet.
- [x] Future live executor requirements are documented for owner approval,
      reviewed privilege model, browser/client service-role separation,
      failure redaction, idempotency proof, audit/evidence requirements,
      rollback/disable controls, and tests before `/api/chat` usage.
- [x] Static guards prove Phase 2E-E remains governance/approval-gate only.

## Phase 2E-F Lifecycle Governance And Retention/Deletion/Export Readiness

- [x] Phase 2E-F is documented as governance/readiness only.
- [x] Transcript retention policy requirements are documented.
- [x] Retention expiry handling requirements are documented.
- [x] Manual deletion request requirements are documented.
- [x] Export request requirements are documented.
- [x] Admin-only transcript access review requirements are documented.
- [x] Audit/evidence requirements are documented.
- [x] Operator runbook requirements are documented.
- [x] Failure/rollback/disable controls are documented.
- [x] Data minimisation and redaction requirements are documented.
- [x] Customer identity/account linking risks are documented.
- [x] Public quote tracking/public transcript access risks are documented.
- [x] Static guards prove Phase 2E-F remains governance/readiness only.

## Phase 2E-G Audit/Evidence Model And Operator Runbook Readiness

- [x] Phase 2E-G is documented as governance/readiness only.
- [x] Future transcript lifecycle audit event types are documented.
- [x] Safe future audit/evidence field categories are documented.
- [x] Forbidden audit/evidence fields and copied material are documented.
- [x] Future operator runbook requirements are documented.
- [x] Future evidence template placeholder requirements are documented.
- [x] "Do not proceed" stop conditions are documented.
- [x] Static guards prove Phase 2E-G remains governance/readiness only.

## Phase 2E-H Completed Local Schema/RLS And Server-Only Contract Foundation

- [x] Phase 2E-H is documented as local schema/RLS and server-only contract
      foundation only.
- [x] Local `transcript_audit_events` table exists for workspace-scoped,
      redacted audit event facts only.
- [x] Local `transcript_evidence_records` table exists for workspace-scoped,
      placeholder evidence references and summaries only.
- [x] Both tables enable RLS.
- [x] Anonymous/public and authenticated browser roles receive no direct table
      grants or policies.
- [x] Local SQL constraints reject unsafe metadata keys and unsafe evidence
      summary text.
- [x] Shared SQL metadata helper denylist is expanded for Phase 2E-H
      forbidden key classes while preserving recursive object-only metadata
      checks.
- [x] Local SQL constraints reject invalid audit event, actor, result, evidence
      type, cross-workspace evidence relationships, and negative affected
      record counts.
- [x] Server-only TypeScript audit/evidence contract exists under
      `website/lib/chat/audit/`.
- [x] Default audit/evidence adapter remains unavailable.
- [x] Contract calls are dependency-injected only and do not instantiate
      Supabase, read env, read cookies or headers, call RPCs, use browser
      Supabase, or read `website/chat-config.js`.
- [x] Contract validation rejects malformed input, unsafe payload keys, unsafe
      metadata, full transcript attempts, raw provider payload attempts,
      tokens, API keys, private keys, secrets, and service-role material before
      an adapter can run.
- [x] Static guards prove Phase 2E-H keeps `/api/chat`, runtime writers,
      deletion/export routes, retention jobs, admin transcript UI, production
      evidence, deployment/config, browser Supabase, and service-role runtime
      paths unwired.

Audit/evidence approval gates requiring explicit owner approval:

- [ ] Audit event model owner approval.
- [ ] Evidence template owner approval.
- [ ] Operator runbook owner approval.
- [ ] Redaction policy approval.
- [ ] Stop-condition approval.
- [ ] Rollback/disable approval.
- [ ] Local SQL/RLS proof.
- [ ] Static guard proof.
- [ ] No full transcript content in audit/evidence.
- [ ] No secrets/provider payloads in audit/evidence.

Lifecycle approval gates requiring explicit owner approval:

- [ ] Retention/deletion/export owner approval.
- [ ] Data classification review.
- [ ] Admin access approval.
- [ ] Audit event model approval.
- [ ] Evidence template approval.
- [ ] Failure rollback/disable plan approval.
- [ ] Local SQL/RLS proof before any runtime implementation.
- [ ] Static guard proof before any runtime implementation.
- [ ] No customer-visible internal notes.
- [ ] No public transcript visibility.

Approval gates requiring explicit owner approval:

- [ ] Audit/evidence runtime writer.
- [ ] Audit/evidence runtime storage path beyond the local Phase 2E-H tables.
- [ ] Production evidence file or artifact.
- [ ] Live Supabase RPC executor.
- [ ] Any service-role or privileged DB execution strategy.
- [ ] `/api/chat` transcript write wiring.
- [ ] Transcript read paths.
- [ ] Admin transcript UI.
- [ ] Transcript deletion/export paths.
- [ ] Retention cleanup jobs.
- [ ] Customer identity/account linking.
- [ ] Public quote tracking or public transcript access.
- [ ] Notifications or CRM integration.

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
