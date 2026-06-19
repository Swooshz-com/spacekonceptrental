# Agent Error/Privacy Defaults Compliance Audit

Audit date: 2026-06-19

Base: `main` after PR #233, merge commit `18ae2b004d77371136ad979d94ce9bffe1b0f139`

Branch: `codex/audit-agent-error-privacy-compliance`

Scope: audit-only review against the refreshed repo-local `AGENTS.md` Application Error, Logging, And Privacy Defaults, relevant compact playbooks, and existing SKR product constraints. This report did not read `website/chat-config.js`.

## Executive Summary

No blocker was found.

The repo already has strong privacy-safe defaults in several places: public chat and quote errors avoid provider internals and stack traces, fake/canned chat fallback responses remain removed, chat persistence/audit adapters are disabled by default, and existing tests guard against ecommerce, booking, payment, customer-account, and public quote-tracking flows.

The main follow-up gaps are traceability and legal readiness. Some APIs already return a per-request `requestId`, but visible quote/chat UI errors do not show the reference, protected admin/product route helpers still return static categorical errors, and the app does not appear to log the same visible reference server-side. Product-facing Privacy Policy and Terms of Use pages/links are also absent. The public catalogue fallback is documented and tested, but it is broad and silent to visitors, which should be reconciled with the refreshed no-broad-fallback default before public testing.

This audit is docs-only and does not change runtime behavior.

## Status By Audit Area

| Audit area | Status | Risk | Notes |
| --- | --- | --- | --- |
| User-facing unexpected errors | Needs follow-up | Should fix before public testing | Generic errors mostly avoid internals, but visible support references are not consistently shown in quote/chat UI and protected admin APIs use static categorical errors. |
| Server/backend logging | Needs follow-up | Should fix before public testing | No application logging was found, which avoids leaking sensitive data but also means visible error references are not logged or traceable server-side. |
| Privacy/GDPR/PDPA data minimisation | Needs follow-up | Should fix before public testing | Quote/chat/admin flows avoid obvious sensitive logging because logging is absent; legal-page requirements remain missing for product-facing data-handling flows. |
| AI/chat behavior | Pass with follow-up | Can defer | Fake/canned assistant fallback is removed; provider-unavailable behavior is explicit. AI/chat persistence and audit adapters are disabled by default, with metadata contracts rejecting unsafe keys. Traceability follow-up still applies to chat errors. |
| Fallback behavior | Needs follow-up | Should fix before public testing | Rate-limit fallback buckets are fail-closed. The public catalogue sample fallback is broad, silent, and unlogged when Supabase/config is unavailable. |
| Product constraints | Pass | Can defer | Current direction remains furniture/event rental: public catalogue, listing detail, quote/enquiry submit, protected admin triage. Tests actively guard against ecommerce, booking, payment, customer account, and quote-tracking flows. |
| Legal page/link requirements | Needs follow-up | Should fix before public testing | No Privacy Policy or Terms of Use app routes or footer links were found for quote/chat data-handling flows. |

## Findings

### F1 - Visible support references are not end-to-end

Risk: Should fix before public testing

Evidence:

- `AGENTS.md:86` through `AGENTS.md:93` requires generic user-facing errors with support-safe traceable references, matching server-side logs, privacy-minimised logging, and no broad fallbacks by default.
- `website/app/api/chat/route.ts:64`, `website/app/api/chat/route.ts:333`, and `website/app/api/chat/route.ts:647` show chat request IDs and generic provider errors are already API-visible.
- `website/components/ChatWidget.tsx:22` through `website/components/ChatWidget.tsx:23`, and `website/components/ChatWidget.tsx:101` through `website/components/ChatWidget.tsx:102`, show the visible chat error is generic but does not display the returned request ID.
- `website/app/api/quote/route.ts:28`, `website/app/api/quote/route.ts:94`, and `website/app/api/quote/route.ts:362` show quote request IDs and generic persistence errors are already API-visible.
- `website/components/QuoteRequestForm.tsx:252` through `website/components/QuoteRequestForm.tsx:266` shows quote success can surface a public/reference ID, but quote failure displays generic copy without the returned request ID.

Impact: support can receive a safe error message, but the reference needed to trace a user-reported failure is not consistently visible to the user.

Recommended follow-up: add a small public/admin error-reference pattern that surfaces the same per-event reference in generic UI errors and keeps existing no-internals behavior.

### F2 - Server-side trace logging is absent

Risk: Should fix before public testing

Evidence:

- A search for `console.log`, `console.error`, `console.warn`, `console.info`, `logger`, and similar logging calls under `website/app`, `website/components`, and `website/lib` found no application logging.
- `website/app/api/chat/route.ts` and `website/app/api/quote/route.ts` create request IDs, but no matching server-side log or approved logging-backend write was found.

Impact: the app currently avoids logging PII by omission, but support cannot trace a visible reference back to server-side route/status/category metadata.

Recommended follow-up: introduce a privacy-minimised logging helper for unexpected/error cases only, logging event/reference ID, route or operation, status/category, and safe metadata only. Do not log raw prompts, quote payloads, auth headers, cookies, private files, provider payloads, or unnecessary PII.

### F3 - Protected admin/product API errors use static categorical codes only

Risk: Should fix before public testing

Evidence:

- `website/lib/quote/admin-write/admin-quote-request-status-route.ts:99` and `website/lib/quote/admin-write/admin-quote-request-status-route.ts:117` return static errors such as `quote_status_update_failed`.
- `website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts:97` and `website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts:112` return static errors such as `quote_crm_handoff_status_update_failed`.
- `website/lib/products/persistence/admin-product-write-route.ts:195` and `website/lib/products/persistence/admin-product-write-route.ts:213` return static errors such as `product_persistence_failed`.
- `website/lib/products/media/admin-product-image-upload-route.ts:186` and `website/lib/products/media/admin-product-image-upload-route.ts:508` return static errors such as `image_storage_unavailable`.
- `website/app/api/admin/csrf-proof/route.ts:116` and `website/app/api/admin/csrf-proof/route.ts:366` return static errors such as `csrf_proof_issue_failed`.

Impact: static categorical codes are useful for non-leaking UX, but they are not event/request-specific references and are not sufficient for refreshed traceability defaults by themselves.

Recommended follow-up: extend the same event-reference helper to protected admin/product APIs, preserving categorical error types for programmatic handling while adding event-specific support references.

### F4 - Privacy Policy and Terms of Use surfaces are missing

Risk: Should fix before public testing

Evidence:

- `website/app/layout.tsx:58` through `website/app/layout.tsx:60` shows the footer has brand and location copy only, with no Privacy Policy or Terms of Use links.
- `website/app` has no Privacy Policy or Terms of Use route. The only `privacy`/`terms` matches under `website/app` and `website/components` are search terms or admin-only boundary copy, not legal pages or links.
- Product-facing flows collect or process personal/contact and chat data through `website/components/QuoteRequestForm.tsx` and `website/components/ChatWidget.tsx`.

Impact: the refreshed defaults call for product-facing/data-handling frontend Privacy Policy and Terms of Use requirements, but the current app has no visible legal surfaces for those flows.

Recommended follow-up: add owner-approved Privacy Policy and Terms of Use pages plus footer/form/chat links in a dedicated legal-readiness PR. Do not invent legal commitments or production claims.

### F5 - Public catalogue fallback is broad and silent

Risk: Should fix before public testing

Evidence:

- `website/lib/catalogue/catalogue-repository.ts:110` and `website/lib/catalogue/catalogue-repository.ts:158` define fallback products and a fallback catalogue.
- `website/lib/catalogue/catalogue-repository.ts:374` through `website/lib/catalogue/catalogue-repository.ts:395` returns fallback catalogue data when Supabase/config/payload is unavailable.
- `website/lib/catalogue/catalogue-repository.ts:398` through `website/lib/catalogue/catalogue-repository.ts:425` returns fallback product detail data in similar unavailable paths.
- `website/app/catalogue/page.tsx:623` labels entries as `Public rental listing`; the fallback source is not visibly disclosed to visitors.

Impact: this fallback predates the refreshed default and is documented/tested elsewhere, but it is broad, silent, and unlogged. Visitors may see sample inventory when the source of record is unavailable.

Recommended follow-up: either obtain explicit owner approval for a narrow, visible, logged, tested, documented fallback with a review/removal condition, or switch catalogue unavailability to an explicit unavailable/empty state before public testing.

### F6 - Chat fallback and AI logging defaults are in good shape

Risk: Can defer

Evidence:

- `website/components/ChatWidget.test.tsx:25` verifies the chat starts without a canned assistant response.
- `website/components/ChatWidget.test.tsx:64` verifies chat failure shows an error instead of an assistant fallback response.
- `website/app/api/chat/route.test.ts:68` verifies provider-unavailable returns an error instead of fallback content.
- `website/lib/chat/provider-factory.ts:15` and `website/lib/chat/n8n-provider.ts:130` use explicit `PROVIDER_UNAVAILABLE` failure paths.
- `website/lib/chat/persistence/disabled-chat-persistence.ts` and `website/lib/chat/audit/disabled-transcript-audit.ts` keep transcript persistence/audit adapters disabled by default.
- `website/lib/chat/persistence/contract.ts:45` and `website/lib/chat/audit/contract.ts:73` reject unsafe metadata keys such as provider payloads, headers, tokens, cookies, credentials, secrets, and private keys.

Impact: the no-fake-fallback and metadata-only/disabled-by-default chat posture aligns with the refreshed defaults. The traceability gaps from F1 and F2 still apply to chat error handling.

Recommended follow-up: handle chat error references and privacy-safe error logging as part of the shared error-reference PR.

### F7 - Product scope constraints remain intact

Risk: Can defer

Evidence:

- `AGENTS.md:233` through `AGENTS.md:245` preserves the furniture/event rental MVP direction and forbids ecommerce/cart/checkout/order/payment/purchase/booking/reservation/fulfilment/stock-reservation/customer-account/dashboard/custom-CRM flows without approval.
- Searches under `website/app`, `website/components`, `website/lib`, and tests found the forbidden product-flow terms primarily in negative assertions and guard tests.
- Public route tests such as `website/app/public-shells.test.tsx` and phase acceptance tests continue to assert that checkout, payment, online ordering, customer accounts, public quote tracking, booking, reservation, and fulfilment language do not appear.

Impact: no product-scope blocker was found during this audit.

Recommended follow-up: none for this audit area beyond keeping these negative tests in future runtime/legal PRs.

## Recommended Follow-Up PR Split

1. Error reference and privacy-safe logging foundation.
   Add a tiny server-only helper that creates event/request references, returns them in generic errors, and logs the same reference with route/status/category metadata only.

2. Quote and chat visible error references.
   Surface returned request IDs in quote/chat failure UI without exposing provider internals, stack traces, payloads, or sensitive fields.

3. Protected admin/product API reference rollout.
   Preserve static categorical error types for programmatic handling, but add event-specific references and server-side privacy-safe logging to protected admin/product API errors.

4. Legal readiness pages and links.
   Add owner-approved Privacy Policy and Terms of Use pages and links for quote/chat data-handling flows. Keep this separate from logging/runtime behavior changes.

5. Catalogue fallback policy reconciliation.
   Decide whether the sample catalogue fallback remains owner-approved. If it stays, make it narrow, visible, logged, tested, and documented with a review/removal condition. Otherwise replace it with an explicit unavailable/empty state before public testing.

## Runtime Behavior Confirmation

This audit PR changes documentation only. It does not modify website runtime code, UI components, API routes, logging implementation, Privacy Policy or Terms pages, Terms links, package/dependency files, schemas/migrations, Supabase config, n8n/HubSpot/provider integrations, env files, or tests.
