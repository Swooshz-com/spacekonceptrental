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

Runtime transcript writes remain blocked. Runtime transcript reads remain
blocked. Admin transcript UI remains blocked. Customer accounts remain blocked.
Public quote tracking remains blocked. Notifications remain blocked. CRM
integration remains blocked. n8n/Pinecone runtime changes remain blocked. SaaS
chatbot runtime work remains blocked. Deployment remains blocked. Browser
Supabase remains forbidden. Service-role runtime paths remain forbidden.
`website/chat-config.js` access remains forbidden.

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
