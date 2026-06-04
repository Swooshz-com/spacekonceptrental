# Conversation Privacy Retention Governance

Phase 2E-A recorded privacy, identity, retention, deletion/export, transcript
access, and admin visibility decisions before future conversation/message
persistence.

Phase 2E-B adds the local conversation/message schema and RLS foundation only.
It does not add runtime transcript writes, runtime transcript reads, admin
transcript UI, public transcript access, customer accounts, public quote
tracking, notifications, CRM integration, n8n/Pinecone runtime changes, SaaS
chatbot runtime work, deployment, browser Supabase, service-role runtime paths,
or `website/chat-config.js` access.

Phase 2E-C adds the server-only transcript persistence contract and validation
boundary only. It defines TypeScript command/result/adapter shapes and pure
validation/minimisation helpers for a future persistence adapter, but it does
not wire transcript writes into `/api/chat`, call Supabase, call SQL/RPC, call
n8n/Pinecone, read cookies or headers, read env, use service-role runtime
paths, or expose transcript reads.

Phase 2E-D adds the server-only transcript persistence RPC/adapter boundary
only. It defines a local SQL/RPC contract for validated trusted-workspace
conversation/message batches and a server-only TypeScript adapter that maps
the Phase 2E-C command into an injected RPC executor payload, but it does not
wire transcript writes into `/api/chat`, instantiate Supabase from env, add
browser Supabase, create service-role runtime paths, or expose transcript
reads.

Phase 2E-E records transcript persistence activation governance and executor
approval gates only. It also documents the Phase 2E-D hotfix for
`clientMessageId` idempotency conflicts and malformed runtime validation. It
does not implement a live Supabase RPC executor, service-role runtime path,
`/api/chat` transcript write wiring, transcript reads, admin transcript UI,
deletion/export paths, retention cleanup jobs, customer identity/account
linking, public quote tracking, notifications, or CRM integration.

Phase 2E-F adds transcript lifecycle governance and retention/deletion/export
readiness only. It documents future requirements for Transcript retention
policy, Retention expiry handling, Manual deletion requests, Export requests,
Admin-only transcript access review, Audit/evidence requirements, Operator
runbook requirements, Failure/rollback/disable controls, Data minimisation and
redaction requirements, Customer identity/account linking risks, and Public
quote tracking/public transcript access risks. Phase 2E-F is
governance/readiness and static-guard coverage only. It does not implement
runtime transcript deletion/export, does not implement retention cleanup jobs,
and does not wire transcript writes or reads into `/api/chat`.

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Live Supabase RPC executor remains blocked. Any service-role or
privileged DB execution strategy remains blocked. `/api/chat` transcript write
wiring remains blocked. Transcript deletion/export runtime paths remain
blocked. Retention cleanup jobs remain blocked. Admin transcript UI remains
blocked. Customer accounts remain blocked. Public quote tracking or public
transcript access remains blocked. Notifications remain blocked. CRM
integration remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS
chatbot runtime work remains blocked. Deployment, Vercel config, Supabase
Cloud config, env/secrets, production evidence remain blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

## Phase 2E-F lifecycle governance and retention/deletion/export readiness

Phase 2E-F is governance/readiness and static-guard coverage only. It defines
the future transcript lifecycle decisions that must be approved before any
retention, deletion, export, transcript read, admin UI, or cleanup runtime path
exists.

Future lifecycle implementation must document and obtain approval for:

- Transcript retention policy: the purpose, retention window, and disposal
  rule for raw transcript content, redacted summaries, quote handoff context,
  and audit events.
- Retention expiry handling: whether expired content is deleted, anonymised,
  or reduced to an approved safe summary, and how failures are surfaced to
  operators without exposing transcript content.
- Manual deletion requests: who may request deletion, how identity or
  ownership is verified, which records are removed or anonymised, and how
  unresolved identity cases fail closed.
- Export requests: which customer-relevant transcript fields may be exported,
  which internal/admin/provider fields are excluded, and how exports avoid
  provider internals, webhook URLs, raw headers, tokens, and workspace
  internals.
- Admin-only transcript access review: the protected owner/admin access path,
  least-privilege transcript fields, access reason, and audit expectations
  required before admins can view transcripts.
- Audit/evidence requirements: safe event fields for transcript access,
  deletion, export, expiry, failures, and operator overrides without copying
  full transcript content into audit rows.
- Operator runbook requirements: local verification, approval record,
  dry-run/proof expectations, failure triage, disable steps, and evidence
  capture before any lifecycle operation reaches production.
- Failure/rollback/disable controls: a reviewed way to disable persistence,
  reads, deletion/export, retention cleanup jobs, or lifecycle workers without
  losing auditability or exposing partial data.
- Data minimisation and redaction requirements: storage and export should avoid
  raw provider diagnostics, n8n internals, webhook URLs, raw headers, tokens,
  sensitive payment/personal details, and unnecessary workspace/admin internals.
- Customer identity/account linking risks: anonymous session hashes,
  `clientMessageId`, conversation IDs, and quote references must not become
  account ownership proof without a separately approved identity model.
- Public quote tracking/public transcript access risks: public visitors must
  not receive transcript lookup, quote tracking, or account-linked transcript
  pages until ownership proof, access controls, audit, and redaction are
  separately approved.

Explicit owner approval remains required before any of these:

- Runtime transcript writes.
- Runtime transcript reads.
- Live Supabase RPC executor.
- Any service-role or privileged DB execution strategy.
- `/api/chat` transcript write wiring.
- Transcript deletion/export runtime paths.
- Retention cleanup jobs.
- Admin transcript UI.
- Customer accounts.
- Public quote tracking or public transcript access.
- Notifications.
- CRM integration.
- n8n/Pinecone runtime changes.
- SaaS chatbot runtime work.
- Deployment, Vercel config, Supabase Cloud config, env/secrets, production evidence.

## Phase 2E-D server-only RPC/adapter boundary

The Phase 2E-D RPC boundary persists only a validated batch for a trusted
workspace into the existing `conversations` and `messages` tables. It keeps
conversation and message rows workspace-scoped, preserves retention fields,
and treats the anonymous session hash as correlation only. Browser roles are
not granted execute on the RPC.

The RPC checks metadata again before table writes. It rejects provider debug
payloads, workflow payloads, webhook references, raw headers, tokens,
authorization values, cookies, trace dumps, credentials, private keys,
secrets, passwords, and API keys. This repeats the TypeScript minimisation
boundary at the database edge.

The TypeScript adapter is server-only and injected. It maps the existing
validated command shape into the RPC payload shape, including
`client_message_id` for idempotency/deduplication only. It does not instantiate
Supabase, read env, read cookies, read headers, read `website/chat-config.js`,
or make persistence available by default.

The Phase 2E-D hotfix changes RPC idempotency handling so exact duplicate
retries return the original message ID, while conflicting `clientMessageId`
reuse now rejects with `transcript_client_message_id_conflict`. The RPC
compares role, message type, content, provider, request ID, sequence number,
retention expiry, and metadata before accepting a reused client key.

The RPC idempotency fingerprint deliberately excludes `id` because a future
server-side executor may generate a new server-owned message ID while replaying
the same client idempotency key. `clientMessageId` plus the normalized payload
is the retry contract.

The Phase 2E-D hotfix also makes transcript command validation total and
non-throwing for malformed JSON-like runtime input. Missing or non-object
conversation payloads, missing/non-array messages, null message elements,
non-string IDs, non-string roles, non-string content, non-string provider,
non-string client message IDs, non-string request IDs, invalid retention
timestamps, and malformed metadata return safe rejected results instead of
propagating validation exceptions.

In short, transcript command validation is total and non-throwing for
malformed JSON-like runtime input.

## Phase 2E-E activation governance and executor approval gate

Phase 2E-E is governance and static-guard coverage only. It defines the
approval gates required before transcript persistence can move from the local
RPC/adapter contract into runtime use.

Explicit owner approval is required before implementing any of these:

- Live Supabase RPC executor.
- Any service-role or privileged DB execution strategy.
- `/api/chat` transcript write wiring.
- Transcript read paths.
- Admin transcript UI.
- Transcript deletion/export paths.
- Retention cleanup jobs.
- Customer identity/account linking.
- Public quote tracking or public transcript access.
- Notifications or CRM integration.

Executor approval strategy:

- The current Phase 2E-D RPC is ungranted to browser roles.
- The current TypeScript adapter requires an injected executor.
- No live executor exists yet.
- A future live executor must have explicit owner approval.
- A future live executor must have a reviewed privilege model.
- A future live executor must not expose service-role material to
  browser/client code.
- A future live executor must have failure redaction, idempotency proof,
  audit/evidence requirements, and rollback/disable controls.
- A future live executor must be tested before `/api/chat` can use it.
- The Phase 2E-D hotfix makes conflicting `clientMessageId` reuse reject
  instead of silently dropping changed messages.
- The Phase 2E-D hotfix makes transcript command validation total and
  non-throwing for malformed runtime input.

## Phase 2E-C server-only persistence contract

The Phase 2E-C contract lives behind server-only TypeScript modules. It shapes
future conversation/message persistence commands from explicit trusted inputs
and keeps all database work behind an injected adapter interface. The default
adapter remains unavailable, and tests use fake adapters only.

The contract validates that the workspace ID is trusted server input, not a
browser-controlled selector. Conversation IDs and message IDs are treated as
server-generated inputs. Invalid IDs, missing trusted workspace scope, invalid
message role/type pairs, blank or oversized content, oversized metadata, and
unsafe metadata keys fail closed before any adapter can run.

Metadata is minimized to JSON-compatible objects and rejects unsafe operational
keys such as provider debug payloads, workflow payloads, webhook URLs, raw
headers, tokens, trace dumps, credentials, private keys, secrets, passwords,
and API keys. Adapter failures return only a generic safe unavailable result.

Anonymous session hashes remain correlation only. They do not prove identity,
ownership, workspace access, or transcript access. `clientMessageId` remains
idempotency and deduplication only. It does not prove authentication,
authorization, transcript ownership, or customer identity.

## Phase 2E-B schema/RLS foundation

The existing `conversations` and `messages` tables remain the stable table
names. Phase 2E-B hardens them rather than creating parallel transcript tables
or renaming unrelated database/API/RPC boundaries.

`conversations` stores only workspace-scoped conversation metadata for future
server-side persistence. It may hold a server-created non-reversible anonymous
session hash for correlation, but that hash does not prove identity,
ownership, workspace access, or transcript access. The table has bounded
metadata, retention, deletion marker, last-message, status, and workspace-safe
relationship constraints.

`messages` stores only normalized message rows for a future server-side write
path. It has bounded content, role/type constraints, bounded metadata,
retention and deletion markers, optional sequence ordering, and workspace-safe
conversation relationships. Metadata must stay minimal and must not contain
provider diagnostics, workflow payloads, webhook URLs, forwarding headers,
tokens, trace dumps, credentials, private keys, or raw operational dumps.

Direct anonymous/public reads and writes are denied. Direct authenticated
reads and writes are denied, including for current owner/admin workspace
members, until a later reviewed server-side transcript write/read path exists.
Admin transcript reads remain blocked by design in Phase 2E-B.

## Privacy and PII minimisation model

Future chat persistence must treat every conversation and message as
privacy-sensitive. Store only the minimum fields needed for support continuity,
quote handoff, abuse review, and safe analytics after those use cases are
approved.

The default storage model should avoid:

- Raw provider debug payloads.
- n8n internals, node names, workflow traces, webhook URLs, and provider error
  details.
- Raw forwarding headers, IP addresses, user agent strings, and trace IDs.
- Payment details, credentials, private event addresses, government IDs, or
  other sensitive content unless a later approved workflow has a specific field,
  purpose, and retention rule.

If sensitive text appears in a customer message, future persistence should keep
the customer-visible message only when it is necessary for support context and
should redact or avoid copying sensitive fragments into summaries, analytics,
operator notes, exports, or logs.

## Anonymous visitor identity model

Anonymous chat must remain unlinkable to a named customer account. A browser
provided `clientSessionId` may be used only as an untrusted correlation and
rate-limit hint. It must not prove identity, ownership, workspace, or transcript
access.

Future persistence may store a non-reversible session hash only if the hash is
created server-side, scoped to the trusted workspace, and documented with an
expiry and deletion rule. The raw anonymous session identifier should not be
stored unless a later privacy review approves a narrower reason.

Anonymous conversation identifiers must be generated server-side. Browser
provided conversation IDs may be treated only as untrusted lookup or
idempotency hints after the server verifies the trusted workspace and future
access policy.

## Future authenticated/admin-linked identity considerations

Future authenticated identity is separate from anonymous chat. Customer
accounts are not approved in Phase 2E-A, and no public account, login, profile,
or quote-tracking surface is added by this phase.

If authenticated customer identity is approved later, it must define:

- How an anonymous conversation can be linked only after an authenticated
  customer action proves ownership.
- Whether old anonymous transcripts remain separate from the new account.
- What admins can see about account-linked transcripts.
- How exports and deletion requests handle anonymous and authenticated records.

Admin-linked identity is also future work. Admin users may be associated with
internal transcript review actions only after protected admin access, role
checks, audit expectations, and transcript permissions are implemented.

## Conversation/message retention rules

Retention timers must be defined before any migration stores transcripts.
Future retention rules should name separate windows for:

- Raw conversation/message content.
- Redacted summaries or quote handoff context.
- Provider metadata allowed by privacy review.
- Abuse-review records.
- Admin audit events for transcript access or deletion/export actions.

The default policy should prefer short transcript retention unless longer
retention is needed for a documented support, legal, audit, or quote-follow-up
purpose. Retention expiry should delete or anonymise stored content instead of
leaving it available indefinitely.

## Deletion and export expectations

Future deletion/export support must be defined before transcript persistence is
implemented. The design should support a way to locate records by server-owned
conversation reference, future verified account identity, or another approved
lookup path without trusting anonymous browser input as ownership.

Deletion should remove or anonymise conversation content, message content, and
unnecessary correlation metadata when the approved retention or user-request
rule applies. Export should include only customer-relevant transcript content
and approved metadata, not provider internals, webhook details, raw headers,
tokens, workspace internals, admin-only notes, or unrelated records.

## Transcript access rules

Admins may view transcripts only through a future protected admin boundary.
Transcript access must require owner/admin membership for the trusted workspace,
use server-only authorization, and return generic unavailable states on
provider or policy failures.

Public visitors must not get a public transcript lookup, quote status tracker,
or account-linked transcript page in Phase 2E-A. Any future public transcript
access must prove ownership through a separately approved identity model.

## Admin visibility boundaries

Admin visibility should be need-to-know. Future admin transcript views should
show only the fields required to support a furniture/event-rental enquiry or
quote follow-up. Admins should not see raw provider diagnostics, secrets,
tokens, webhook URLs, raw headers, service-role details, workspace internals,
or unrelated tenant data.

Any future admin transcript access should be auditable. Audit events should
record safe metadata such as action type, trusted workspace, approved admin
actor, and timestamp, without copying full transcript content into audit rows.

## Future persistence idempotency expectations

Future persistence must be idempotent around provider retries and browser
retries. `clientMessageId` may be used only for deduplication and ordering
support after the server verifies trusted workspace scope. It must not be used
as authentication or authorization.

Server-generated request IDs, conversation IDs, and message IDs should be the
canonical write keys. Provider calls and persistence writes should avoid
duplicating messages, reordering customer/assistant turns, or creating partial
conversation records when the provider or database fails.

## Redaction and minimisation guidance

Future redaction should prefer avoiding storage over storing and masking later.
When content must be stored, sensitive fragments should not be copied into
summaries, analytics, admin notes, logs, exports, or provider diagnostics.

Messages should have bounded size limits, and future persistence should reject
or safely truncate oversized content before storage. Truncation must not expose
raw errors to the browser.

## Non-goals and blocked work

Phase 2E-A does not add runtime implementation. The following stay blocked:

- Conversation/message persistence is not implemented.
- Transcript storage is not implemented.
- Transcript reads are not implemented.
- Admin transcript UI is not implemented.
- Customer accounts are not approved.
- Public quote tracking is not approved.
- Notifications are not approved.
- CRM integration is not approved.
- n8n/Pinecone runtime changes are not approved.
- SaaS chatbot runtime work is not approved.
- Deployment is not approved.
- Browser Supabase remains forbidden.
- Service-role runtime paths remain forbidden.
- `website/chat-config.js` access remains forbidden.
- Ecommerce flows remain blocked, including carts, checkout, payments,
  customer accounts, stock reservation, order fulfilment, confirmed booking,
  and online ordering.
