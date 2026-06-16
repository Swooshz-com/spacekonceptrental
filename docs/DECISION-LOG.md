## Supabase Enquiry Persistence And CRM Handoff Foundation References

Current implementation-foundation focus: Supabase enquiry persistence and CRM handoff foundation for public quote/enquiry submissions and future CRM handoff tracking.

References: `docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md`, `supabase/migrations/20260616100000_quote_enquiry_crm_handoff_foundation.sql`, `website/lib/quote/types.ts`, `website/lib/quote/validation.ts`, `website/lib/quote/quote-repository.ts`, and `scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs`.

Supabase enquiry persistence and CRM handoff foundation extends the existing quote/enquiry record with source metadata, safe duplicate-handling support, review metadata, and CRM handoff placeholder fields. Supabase owns the canonical SKR enquiry submission record; HubSpot remains the future CRM and sales workflow owner.

Implementation firewall: schema, contracts, tests, docs, and validator only. No HubSpot API calls, n8n workflows, email sending, public customer accounts, public login, or custom CRM are implemented.

## External Services Architecture Pivot References

Current planning focus: external-services architecture and implementation-plan reduction for auth, CRM, email, and enquiry persistence.

Latest completed readiness ladder phase remains Phase 6P-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement review readiness.

This pivot pauses additional readiness-only Phase 6Q/6R work and reviews where low-cost/free external services reduce custom SKR build work, security risk, maintenance burden, and admin workflow complexity.

References: `docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md`, `docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md`, and `scripts/validate-external-services-auth-crm-email-enquiry-architecture.cjs`.

MVP decisions: Supabase remains the app database/auth/backend foundation; HubSpot is the preferred CRM; n8n is optional automation glue and not required for the first implementation; Google Workspace/domain email is first-line human/admin email; Resend is optional future transactional email only; public customer accounts are deferred; custom CRM is rejected/deferred.

Planning firewall: architecture/planning only. No provider integration, credentials/secrets, runtime provider calls, CRM sync code, n8n workflows, email sending code, public login, customer dashboard, runtime/API/provider/env/scheduler/chat/RAG/public visitor-facing behaviour changes, or retail/transaction flow expansion is implemented.

## Phase 6P-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Outcome Acknowledgement Review Readiness References

Phase 6P-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-REVIEW-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-acknowledgement-review-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-acknowledgement-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement review readiness helper coverage.

Current phase: Phase 6P-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement review readiness, audit response acknowledgement review outcome follow-up planning review outcome acknowledgement review ledger, and no-planning-review-outcome-acknowledgement-review/no-acknowledgement-review-decision/no-follow-up-action/no-contact/no-remediation firewall.

Phase 6P-A/B keeps the repo readiness-only for owner/admin review readiness of future theoretical follow-up planning review outcome acknowledgement materials after Phase 6O-A/B follow-up planning review outcome acknowledgement readiness. It follows Phase 6O without selecting follow-up planning review outcome acknowledgement reviews, recording follow-up planning review outcome acknowledgement reviews, selecting acknowledgement review decisions, recording acknowledgement review decisions, selecting follow-up planning review outcome acknowledgements, recording follow-up planning review outcome acknowledgements, selecting acknowledgement decisions, recording acknowledgement decisions, selecting follow-up planning review outcomes, recording follow-up planning review outcomes, selecting follow-up planning review decisions, recording follow-up planning review decisions, selecting follow-up planning decisions, recording follow-up planning decisions, selecting follow-up actions, recording follow-up actions, assigning follow-up owners, assigning remediation, contacting recipients, sending customer/support/outbound/admin contact, recording closure decisions, creating archives, applying retention policies, recording production evidence, deploying, changing runtime/API/provider/env/scheduler/chat/RAG/public behaviour, or adding ecommerce/customer-flow creep.

Historical reference: Phase 6O-A/B remains the prior follow-up planning review outcome acknowledgement readiness phase, Phase 6N-A/B remains the earlier follow-up planning review outcome readiness phase, Phase 6M-A/B remains the earlier follow-up planning review readiness phase, and Phase 6L-A/B remains the earlier follow-up planning readiness phase. None of those historical phases is current Phase 6P-A/B.

## Phase 6O-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Outcome Acknowledgement Readiness References

Phase 6O-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-ACKNOWLEDGEMENT-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-acknowledgement-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement readiness helper coverage.

Previous current phase: Phase 6O-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement readiness, audit response acknowledgement review outcome follow-up planning review outcome acknowledgement ledger, and no-planning-review-outcome-acknowledgement/no-acknowledgement-decision/no-follow-up-action/no-contact/no-remediation firewall.

Phase 6O-A/B kept the repo readiness-only for owner/admin acknowledgement readiness of future theoretical follow-up planning review outcome materials after Phase 6N-A/B follow-up planning review outcome readiness. It followed Phase 6N without selecting follow-up planning review outcome acknowledgements, recording follow-up planning review outcome acknowledgements, selecting acknowledgement decisions, recording acknowledgement decisions, selecting follow-up planning review outcomes, recording follow-up planning review outcomes, selecting follow-up planning review decisions, recording follow-up planning review decisions, selecting follow-up planning decisions, recording follow-up planning decisions, selecting follow-up actions, recording follow-up actions, assigning follow-up owners, assigning remediation, contacting recipients, sending customer/support/outbound/admin contact, recording closure decisions, creating archives, applying retention policies, recording production evidence, deploying, changing runtime/API/provider/env/scheduler/chat/RAG/public behaviour, or adding ecommerce/customer-flow creep.

Historical reference: Phase 6N-A/B remains the prior follow-up planning review outcome readiness phase, Phase 6M-A/B remains the earlier follow-up planning review readiness phase, and Phase 6L-A/B remains the earlier follow-up planning readiness phase. None of those historical phases is Phase 6O-A/B.

## Phase 6N-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Outcome Readiness References

Phase 6N-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs`, protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness helper coverage, protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness helper coverage, and protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness helper coverage.

Previous current phase: Phase 6N-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness, audit response acknowledgement review outcome follow-up planning review outcome ledger, and no-planning-review-outcome/no-planning-review-decision/no-follow-up-action/no-contact/no-remediation firewall.

Phase 6N-A/B kept the repo readiness-only for owner/admin review readiness of future theoretical follow-up planning review outcome materials after Phase 6M-A/B follow-up planning review readiness. It followed Phase 6M without selecting follow-up planning review outcomes, recording follow-up planning review outcomes, selecting follow-up planning review decisions, recording follow-up planning review decisions, selecting follow-up planning decisions, recording follow-up planning decisions, selecting follow-up actions, recording follow-up actions, assigning follow-up owners, assigning remediation, contacting recipients, sending customer/support/outbound/admin contact, recording closure decisions, creating archives, applying retention policies, recording production evidence, deploying, changing runtime/API/provider/env/scheduler/chat/RAG/public behaviour, or adding ecommerce/customer-flow creep.

Historical reference: Phase 6M-A/B remains the prior follow-up planning review readiness phase and Phase 6L-A/B remains the earlier follow-up planning readiness phase. Neither historical phase is Phase 6N-A/B.

## Phase 6M-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Readiness References

Phase 6M-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness helper coverage.

Previous current phase: Phase 6M-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness, audit response acknowledgement review outcome follow-up planning review ledger, and no-planning-review-decision/no-follow-up-action/no-contact/no-remediation firewall.

Phase 6M-A/B kept the repo readiness-only for owner/admin review readiness of future theoretical follow-up planning review materials after Phase 6L-A/B follow-up planning readiness. It followed Phase 6L without selecting follow-up planning reviews, recording follow-up planning reviews, selecting follow-up planning decisions, recording follow-up planning decisions, selecting follow-up actions, recording follow-up actions, assigning follow-up owners, assigning remediation, contacting recipients, sending customer/support/outbound/admin contact, recording closure decisions, creating archives, applying retention policies, recording production evidence, deploying, changing runtime/API/provider/env/scheduler/chat/RAG/public behaviour, or adding ecommerce/customer-flow creep.

## Phase 6L-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Readiness References

Phase 6L-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness helper coverage.

Previous current phase: Phase 6L-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness, audit response acknowledgement review outcome follow-up planning ledger, and no-follow-up-action/no-contact/no-remediation firewall.

Phase 6L-A/B kept the repo readiness-only for owner/admin review of a future theoretical acknowledgement review outcome follow-up planning packet after Phase 6K-A/B acknowledgement review outcome readiness. It followed Phase 6K without recording acknowledgement review outcomes, selecting acknowledgement review outcomes, accepting acknowledgement review outcomes, creating outcome follow-up actions, selecting outcome follow-up actions, recording outcome follow-up actions, assigning follow-up owners, assigning remediation, creating remediation tasks, recording acknowledgement review decisions, recording acknowledgement, recording delivery, contacting recipients, configuring recipients or channels, sending acknowledgement requests, sending follow-up requests, recording recipient confirmation, recording recipient acknowledgement, dispatching audit responses, receiving or recording audit findings, creating audit follow-up records, classifying findings, assigning severity, assigning triage owners, recording triage decisions, creating archives, writing archive records, applying retention policies, recording closure decisions, accepting closure recommendations, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider/runtime checks, deploying, changing public runtime behavior, sending support/customer follow-up, creating outbound messaging, or claiming production readiness.

## Phase 6K-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Readiness References

Phase 6K-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review outcome readiness helper coverage.

Current phase: Phase 6K-A/B maintenance closure audit follow-up response acknowledgement review outcome readiness, audit response acknowledgement review outcome ledger, and no-outcome/no-contact/no-remediation firewall.

Phase 6K-A/B keeps the repo readiness-only for owner/admin review of a future theoretical audit response acknowledgement review outcome packet after Phase 6J-A/B acknowledgement review readiness. It follows Phase 6J without recording acknowledgement review outcomes, selecting acknowledgement review outcomes, accepting acknowledgement review outcomes, completing acknowledgement reviews, recording acknowledgement review decisions, recording acknowledgement, recording delivery, contacting recipients, configuring recipients or channels, sending acknowledgement requests, recording recipient confirmation, recording recipient acknowledgement, assigning remediation, creating remediation tasks, disclosing externally, receiving or recording audit findings, creating audit follow-up records, classifying findings, assigning severity, assigning triage owners, recording triage decisions, creating archives, writing archive records, applying retention policies, recording closure decisions, accepting closure recommendations, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider/runtime checks, deploying, changing public runtime behavior, sending support/customer follow-up, creating outbound messaging, or claiming production readiness.

## Phase 6J-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Readiness References

Phase 6J-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-PACKET-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-readiness.cjs`, and protected admin maintenance closure audit follow-up response acknowledgement review readiness helper coverage. It follows Phase 6I without recording acknowledgement, recording delivery, contacting recipients, recording acknowledgement review decisions, assigning remediation, disclosing externally, recording closure, approving completion, collecting evidence, dispatching responses, sending responses, configuring channels, configuring recipient lists, or changing public customer-facing behaviour.

Current phase: Phase 6J-A/B maintenance closure audit follow-up response acknowledgement review readiness, audit response acknowledgement review ledger, and no-review-decision/no-contact/no-remediation firewall.

Phase 6J-A/B keeps the repo readiness-only for owner/admin review of a future theoretical audit response acknowledgement review packet after Phase 6I-A/B acknowledgement packet readiness. It does not record acknowledgement, complete acknowledgement review, record acknowledgement review decisions, dispatch audit responses, send audit responses, deliver audit responses, contact recipients, configure recipients or channels, send acknowledgement requests, record recipient confirmation, record recipient acknowledgement, assign remediation, create remediation tasks, disclose externally, receive or record audit findings, create audit follow-up records, classify findings, assign severity, assign triage owners, record triage decisions, create archives, write archive records, apply retention policies, record closure decisions, accept closure recommendations, record closure approval, mark maintenance complete, collect production evidence, run smoke checks, execute provider/runtime checks, deploy, change public runtime behavior, send support/customer follow-up, create outbound messaging, or claim production readiness.

## Phase 6F-A/B Maintenance Closure Audit Follow-Up Response Planning Readiness References

Current phase: Phase 6F-A/B maintenance closure audit follow-up response planning readiness, audit response option ledger, and no-response/no-remediation firewall.

Phase 6F-A/B keeps the repo readiness-only for owner/admin review of a future theoretical audit response planning packet after Phase 6E-A/B triage/classification readiness. It does not select response options, draft audit responses, approve audit responses, send audit responses, assign remediation, create remediation tasks, disclose externally, contact audit recipients, receive or record audit findings, create audit follow-up records, classify findings, assign severity, assign triage owners, record triage decisions, create archives, write archive records, apply retention policies, record closure decisions, accept closure recommendations, record closure approval, mark maintenance complete, collect production evidence, run smoke checks, execute provider/runtime checks, deploy, change public runtime behavior, send support/customer follow-up, create outbound messaging, or claim production readiness.

Phase 6F-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-PLANNING-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-OPTION-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-TRIAGE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-CLASSIFICATION-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-response-planning-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-triage-readiness.cjs`, and protected admin maintenance closure audit follow-up response planning readiness helper coverage. It follows Phase 6E without selecting response options, drafting or sending responses, assigning remediation, disclosing externally, recording closure, approving completion, or collecting evidence.

## Phase 6D-A/B Maintenance Closure Audit Follow-Up Intake Readiness References

Current phase: Phase 6D-A/B maintenance closure audit follow-up intake readiness, audit finding intake ledger, and no-response/no-remediation firewall.

Latest completed capability: Phase 6C-A/B maintenance closure audit handoff readiness, audit packet routing ledger, and no-handoff/no-external-disclosure firewall.

Last merged capability PR: #184.

Last merged capability merge commit: 54d9559d1638609659ae59b2a4f8408299aa3849.

Phase 6D-A/B adds repo-local maintenance closure audit follow-up intake readiness, a local audit finding intake ledger template, protected admin maintenance closure audit follow-up intake readiness helper coverage, no-response/no-remediation firewall coverage, release-candidate suite integration, validate:maintenance-closure-audit-follow-up-intake-readiness validator coverage, and deterministic Phase 6D maintenance closure audit follow-up intake readiness tests. These controls are template-only, non-live, not evidence, and follow Phase 6C without creating an audit handoff, sending an audit packet, contacting an audit recipient, disclosing externally, receiving or recording audit findings, creating audit follow-up records, sending audit responses, assigning remediation, creating an archive, writing archive records, applying retention policies, recording a closure decision, accepting a closure recommendation, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider checks, executing runtime checks, performing deployment, changing public runtime behavior, sending support responses, contacting customers, publishing public notices, creating monitoring, creating analytics, creating alerts, creating cron, creating jobs, adding provider setup, adding env/secrets, wiring chat/RAG retrieval, or granting launch clearance.

Phase 6E-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-TRIAGE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-CLASSIFICATION-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-INTAKE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-INTAKE-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-triage-readiness.cjs`, `scripts/validate-maintenance-closure-audit-follow-up-intake-readiness.cjs`, and protected admin maintenance closure audit follow-up triage readiness helper coverage. It follows Phase 6D without receiving or recording audit findings, classifying findings, assigning severity or triage owners, sending responses, assigning remediation, disclosing externally, recording closure, approving completion, or collecting evidence.

Phase 6D-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-INTAKE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-INTAKE-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-follow-up-intake-readiness.cjs`, `scripts/validate-maintenance-closure-audit-handoff-readiness.cjs`, and protected admin maintenance closure audit follow-up intake readiness helper coverage.

No deployment is performed or approved by Phase 6D-A/B. It does not add provider config, storage configuration, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, audit recipient contact, external disclosure, audit packet delivery, audit finding receipt, audit finding records, audit follow-up records, audit response sending, remediation assignment, filled archive evidence, filled retention evidence, filled closure evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled production evidence, filled smoke evidence, filled response-sent evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled maintenance evidence, filled archive record, filled archive package, applied retention policy, filled closure decision, filled closure recommendation, filled closure approval, filled maintenance completion, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, launch clearance, provider readiness, preview readiness, production readiness, smoke readiness, rollback readiness, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance execution, maintenance approval, maintenance execution, maintenance verification, maintenance closure, closure archive, audit handoff, audit follow-up intake, audit finding intake, external disclosure, deployment permission, or public admin internals.

## Phase 6C-A/B Maintenance Closure Audit Handoff Readiness References

Current phase: Phase 6C-A/B maintenance closure audit handoff readiness, audit packet routing ledger, and no-handoff/no-external-disclosure firewall.

Latest completed capability: Phase 6B-A/B maintenance closure archive readiness, closure packet retention ledger, and no-archive/no-record firewall.

Last merged capability PR: #183.

Last merged capability merge commit: c98a2a193ff37d84bc518db785e55fe9819ed082.

Phase 6C-A/B adds repo-local maintenance closure audit handoff readiness, a local audit handoff packet routing ledger template, protected admin maintenance closure audit handoff readiness helper coverage, no-handoff/no-external-disclosure firewall coverage, release-candidate suite integration, validate:maintenance-closure-audit-handoff-readiness validator coverage, and deterministic Phase 6C maintenance closure audit handoff readiness tests. These controls are template-only, non-live, not evidence, and follow Phase 6B without creating an archive, generating an archive package, writing an archive record, applying a retention policy, creating an audit handoff, sending an audit packet, contacting an audit recipient, disclosing externally, recording a closure decision, accepting a closure recommendation, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider checks, executing runtime checks, performing deployment, changing public runtime behavior, sending support responses, contacting customers, publishing public notices, creating monitoring, creating analytics, creating alerts, creating cron, creating jobs, adding provider setup, adding env/secrets, wiring chat/RAG retrieval, or granting launch clearance.

Phase 6C-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-RETENTION-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-audit-handoff-readiness.cjs`, `scripts/validate-maintenance-closure-archive-readiness.cjs`, and protected admin maintenance closure audit handoff readiness helper coverage.

No deployment is performed or approved by Phase 6C-A/B. It does not add provider config, storage configuration, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, audit recipient contact, external disclosure, audit packet delivery, filled archive evidence, filled retention evidence, filled closure evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled production evidence, filled smoke evidence, filled response-sent evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled maintenance evidence, filled archive record, filled archive package, applied retention policy, filled closure decision, filled closure recommendation, filled closure approval, filled maintenance completion, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, launch clearance, provider readiness, preview readiness, production readiness, smoke readiness, rollback readiness, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance execution, maintenance approval, maintenance execution, maintenance verification, maintenance closure, closure archive, audit handoff, external disclosure, deployment permission, or public admin internals.

## Phase 6B-A/B Maintenance Closure Archive Readiness References

Current phase: Phase 6B-A/B maintenance closure archive readiness, closure packet retention ledger, and no-archive/no-record firewall.

Latest completed capability: Phase 6A-A/B maintenance closure decision readiness, closure recommendation packet ledger, and no-approval/no-completion firewall.

Last merged capability PR: #182.

Last merged capability merge commit: 6710bfd707ab7f7560fc6adc96131c4f972820e4.

Phase 6B-A/B adds repo-local maintenance closure archive readiness, a local closure packet archive / retention ledger template, protected admin maintenance closure archive readiness helper coverage, no-archive/no-record firewall coverage, release-candidate suite integration, validate:maintenance-closure-archive-readiness validator coverage, and deterministic Phase 6B maintenance closure archive readiness tests. These controls are template-only, non-live, not evidence, and follow Phase 6A without creating a closure archive, generating an archive package, writing an archive record, applying a retention policy, creating storage configuration, recording a closure decision, accepting a closure recommendation, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider checks, executing runtime checks, performing deployment, changing public runtime behavior, sending support responses, contacting customers, publishing public notices, creating monitoring, creating analytics, creating alerts, creating cron, creating jobs, adding provider setup, adding env/secrets, wiring chat/RAG retrieval, or granting launch clearance.

Phase 6B-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-RETENTION-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-DECISION-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-RECOMMENDATION-PACKET-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-archive-readiness.cjs`, `scripts/validate-maintenance-closure-decision-readiness.cjs`, and protected admin maintenance closure archive readiness helper coverage.

No deployment is performed or approved by Phase 6B-A/B. It does not add provider config, storage configuration, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled archive evidence, filled retention evidence, filled closure evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled production evidence, filled smoke evidence, filled response-sent evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled maintenance evidence, filled maintenance-approval evidence, filled maintenance-execution evidence, filled maintenance-schedule evidence, filled change-window evidence, filled archive record, filled archive package, applied retention policy, filled closure decision, filled closure recommendation, filled closure approval, filled maintenance completion, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, provider approval, storage readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance approval, maintenance execution, maintenance verification, maintenance closure, closure archive, retention archive, maintenance scheduling, change-window scheduling, opened change window, completed precheck, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 6A-A/B Maintenance Closure Decision Readiness References

Current phase: Phase 6A-A/B maintenance closure decision readiness, closure recommendation packet ledger, and no-approval/no-completion firewall.
Latest completed capability: Phase 5Z-A/B maintenance verification closure readiness, change-window outcome ledger, and no-completion/no-production-evidence firewall.
Last merged capability PR: #181.
Last merged capability merge commit: 65768d6d3b5ad0aeaa213de450e90616d5784e63.

Phase 6A-A/B adds repo-local maintenance closure decision readiness, a local maintenance closure recommendation packet ledger template, protected admin maintenance closure decision readiness helper coverage, no-approval/no-completion firewall coverage, release-candidate suite integration, validate:maintenance-closure-decision-readiness validator coverage, and deterministic Phase 6A maintenance closure decision readiness tests. These controls are template-only, non-live, not evidence, and follow Phase 5Z without recording a closure decision, accepting a closure recommendation, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider checks, executing runtime checks, performing deployment, changing public runtime behavior, sending support responses, contacting customers, publishing public notices, creating monitoring, creating analytics, creating alerts, creating cron, creating jobs, adding provider setup, adding env/secrets, wiring chat/RAG retrieval, or granting launch clearance.

Phase 6A-A/B references `docs/content/LOCAL-MAINTENANCE-CLOSURE-DECISION-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CLOSURE-RECOMMENDATION-PACKET-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-VERIFICATION-CLOSURE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-OUTCOME-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-closure-decision-readiness.cjs`, `scripts/validate-maintenance-verification-closure-readiness.cjs`, and protected admin maintenance closure decision readiness helper coverage.

No deployment is performed or approved by Phase 6A-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled maintenance-approval evidence, filled maintenance-execution evidence, filled maintenance-schedule evidence, filled change-window evidence, filled correction-completed evidence, filled verification evidence, filled outcome evidence, filled closure decision, filled closure recommendation, filled closure approval, filled maintenance completion, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, provider approval, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance approval, maintenance execution, maintenance verification, maintenance closure, maintenance scheduling, change-window scheduling, opened change window, completed precheck, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 5Z-A/B Maintenance Verification Closure Readiness References

Current phase: Phase 5Z-A/B maintenance verification closure readiness, change-window outcome ledger, and no-completion/no-production-evidence firewall.
Latest completed capability: Phase 5Y-A/B maintenance execution runbook readiness, change-window checklist, and no-execution/no-runtime firewall.
Last merged capability PR: #180.
Last merged capability merge commit: 89e18b7919f6251950b9f520ad6c97fc2dfdc660.

Phase 5Z-A/B adds repo-local maintenance verification closure readiness, a local maintenance change-window outcome ledger template, protected admin maintenance verification closure readiness helper coverage, no-completion/no-production-evidence firewall coverage, release-candidate suite integration, validate:maintenance-verification-closure-readiness validator coverage, and deterministic Phase 5Z maintenance verification closure readiness tests. These controls are template-only, non-live, not evidence, and follow Phase 5Y without executing maintenance, implementing maintenance tasks, recording maintenance approval, recording owner approval, recording provider approval, scheduling maintenance, creating or opening change windows, completing execution checklists, completing verification checklists, claiming maintenance closure, collecting production evidence, running smoke checks, executing provider checks, executing runtime checks, making production readiness claims, recording closure approval, marking maintenance complete, executing rollback, performing deployment, changing public runtime behavior, sending support responses, contacting customers, publishing public notices, creating monitoring, creating analytics, creating alerts, creating cron, creating jobs, adding provider setup, adding env/secrets, wiring chat/RAG retrieval, or granting launch clearance.

Phase 5Z-A/B references `docs/content/LOCAL-MAINTENANCE-VERIFICATION-CLOSURE-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-OUTCOME-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-EXECUTION-RUNBOOK-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-EXECUTION-CHECKLIST-TEMPLATE.md`, `scripts/validate-maintenance-verification-closure-readiness.cjs`, `scripts/validate-maintenance-execution-runbook-readiness.cjs`, and protected admin maintenance verification closure readiness helper coverage.

No deployment is performed or approved by Phase 5Z-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled maintenance-approval evidence, filled maintenance-execution evidence, filled maintenance-schedule evidence, filled change-window evidence, filled correction-completed evidence, filled verification evidence, filled outcome evidence, filled closure approval, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, provider approval, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance approval, maintenance execution, maintenance verification, maintenance closure, maintenance scheduling, change-window scheduling, opened change window, completed precheck, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 5Y-A/B Maintenance Execution Runbook Readiness References

Current phase: Phase 5Y-A/B maintenance execution runbook readiness, change-window checklist, and no-execution/no-runtime firewall.
Latest completed capability: Phase 5X-A/B maintenance approval readiness, change-window planning ledger, and no-schedule/no-change firewall.
Last merged capability PR: #179.
Last merged capability merge commit: e46684f4b216888727993501b0cad465eab31b2d.

Phase 5Y-A/B adds repo-local maintenance execution runbook readiness, a local maintenance change-window execution checklist template, protected admin maintenance execution runbook readiness helper coverage, no-execution/no-runtime firewall coverage, release-candidate suite integration, validate:maintenance-execution-runbook-readiness validator coverage, and deterministic Phase 5Y maintenance execution runbook readiness tests. These controls are template-only, non-live, not evidence, and do not execute maintenance, implement maintenance tasks, record maintenance approval, record owner approval, record provider approval, schedule maintenance, create or open change windows, complete execution checklists, create cron or jobs, configure monitoring, configure analytics, configure alerts, perform provider setup, change production, change public runtime behavior, send support responses, contact customers, publish public notices, perform remediation, verify corrections, run retests, apply hotfixes, capture maintenance execution evidence, capture schedule evidence, capture change-window evidence, capture production evidence, execute rollback, perform deployment, record release closure, or grant deployment permission.

Phase 5Y-A/B references `docs/content/LOCAL-MAINTENANCE-EXECUTION-RUNBOOK-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-EXECUTION-CHECKLIST-TEMPLATE.md`, `docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md`, `scripts/validate-maintenance-execution-runbook-readiness.cjs`, `scripts/validate-maintenance-approval-readiness.cjs`, and protected admin maintenance execution runbook readiness helper coverage.

No deployment is performed or approved by Phase 5Y-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled maintenance-approval evidence, filled maintenance-execution evidence, filled maintenance-schedule evidence, filled change-window evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, provider approval, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance approval, maintenance execution, maintenance completion, maintenance scheduling, change-window scheduling, opened change window, completed precheck, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 5X-A/B Maintenance Approval Readiness References

Current phase: Phase 5X-A/B maintenance approval readiness, change-window planning ledger, and no-schedule/no-change firewall.
Latest completed capability: Phase 5W-A/B preventive maintenance readiness, lessons-to-maintenance backlog, and no-maintenance-change firewall.
Last merged capability PR: #178.
Last merged capability merge commit: f88ff02523a8a82db2d6a163717aa53a1e3b7118.

Phase 5X-A/B adds repo-local maintenance approval readiness, a local maintenance change-window planning ledger template, protected admin maintenance approval readiness helper coverage, no-schedule/no-change firewall coverage, release-candidate suite integration, validate:maintenance-approval-readiness validator coverage, and deterministic Phase 5X maintenance approval readiness tests. These controls are template-only, non-live, not evidence, and do not record owner approval, record provider approval, approve maintenance, schedule maintenance, create change windows, create cron or jobs, configure monitoring, configure analytics, configure alerts, perform provider setup, implement maintenance tasks, change production, change public runtime behavior, send support responses, contact customers, publish public notices, perform remediation, verify corrections, run retests, apply hotfixes, capture maintenance approval evidence, capture schedule evidence, capture change-window evidence, capture production evidence, execute rollback, perform deployment, record release closure, or grant deployment permission.

Phase 5X-A/B references `docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md`, `docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md`, `docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md`, `scripts/validate-maintenance-approval-readiness.cjs`, `scripts/validate-preventive-maintenance-readiness.cjs`, and protected admin maintenance approval readiness helper coverage.

No deployment is performed or approved by Phase 5X-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled provider decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled maintenance-approval evidence, filled maintenance-schedule evidence, filled change-window evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, provider approval, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance approval, maintenance completion, maintenance scheduling, change-window scheduling, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 5W-A/B Preventive Maintenance Readiness References

Current phase: Phase 5W-A/B preventive maintenance readiness, lessons-to-maintenance backlog, and no-maintenance-change firewall.
Latest completed capability: Phase 5V-A/B incident resolution response readiness, post-remediation closure ledger, and no-support-response firewall.
Last merged capability PR: #177.
Last merged capability merge commit: c803f30191a1f7264f8f4be2b55c084a7565957a.

Phase 5W-A/B adds repo-local preventive maintenance readiness, a local lessons-to-maintenance backlog template, protected admin preventive maintenance readiness helper coverage, no-maintenance-change firewall coverage, release-candidate suite integration, validate:preventive-maintenance-readiness validator coverage, and deterministic Phase 5W preventive maintenance readiness tests. These controls are template-only, non-live, not evidence, and do not implement maintenance tasks, create maintenance schedules, add cron or job schedulers, configure monitoring, configure analytics, configure alerts, perform provider setup, change production, change public runtime behavior, send support responses, contact customers, publish public notices, perform remediation, verify corrections, run retests, apply hotfixes, capture maintenance evidence, capture monitoring evidence, capture analytics evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission.

Phase 5W-A/B references `docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md`, `docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md`, `docs/content/LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS.md`, `docs/content/LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE.md`, `scripts/validate-preventive-maintenance-readiness.cjs`, `scripts/validate-incident-resolution-response-readiness.cjs`, and protected admin preventive maintenance readiness helper coverage.

No deployment is performed or approved by Phase 5W-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled maintenance-schedule evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, maintenance follow-up, preventive maintenance, maintenance completion, maintenance scheduling, live hotfix, correction completion, incident closure, deployment permission, or public admin internals.

## Phase 5V-A/B Incident Resolution Response Readiness References

Current phase: Phase 5V-A/B incident resolution response readiness, post-remediation closure ledger, and no-support-response firewall.
Latest completed capability: Phase 5U-A/B remediation verification readiness, correction retest ledger, and no-resolution-claim firewall.
Last merged capability PR: #176.
Last merged capability merge commit: a1a8161e01d7da67de7512e06f09dc271c269333.

Phase 5V-A/B adds repo-local incident resolution response readiness, a local post-remediation closure / lessons ledger template, protected admin incident resolution response readiness helper coverage, no-support-response firewall coverage, release-candidate suite integration, validate:incident-resolution-response-readiness validator coverage, and deterministic Phase 5V incident resolution response readiness tests. These controls are template-only, non-live, not evidence, and do not send support responses, send customer follow-ups, close incidents, record incident resolution, publish public notices, publish changelogs, perform remediation, verify corrections, run retests, apply hotfixes, change production, change public runtime behavior, configure providers, capture resolution evidence, capture response-sent evidence, capture closure evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission.

Phase 5V-A/B references `docs/content/LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS.md`, `docs/content/LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-REMEDIATION-VERIFICATION-READINESS.md`, `docs/content/LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE.md`, `scripts/validate-incident-resolution-response-readiness.cjs`, `scripts/validate-remediation-verification-readiness.cjs`, and protected admin incident resolution response readiness helper coverage.

No deployment is performed or approved by Phase 5V-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled closure evidence, filled maintenance evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, support response, customer follow-up, public notice, monitoring, analytics, support follow-up, live hotfix, correction completion, incident closure, maintenance completion, deployment permission, or public admin internals.

## Phase 5U-A/B Remediation Verification Readiness References

Current phase: Phase 5U-A/B remediation verification readiness, correction retest ledger, and no-resolution-claim firewall.
Latest completed capability: Phase 5T-A/B post-launch remediation readiness, incident triage correction backlog, and no-live-hotfix firewall.
Last merged capability PR: #175.
Last merged capability merge commit: 92a39f6fa8540a45f9a2369b3ec1fc497e76058e.

Phase 5U-A/B adds repo-local remediation verification readiness, a local correction retest / resolution ledger template, protected admin remediation verification readiness helper coverage, no-resolution-claim firewall coverage, release-candidate suite integration, validate:remediation-verification-readiness validator coverage, and deterministic Phase 5U remediation verification readiness tests. These controls are template-only, non-live, not evidence, and do not apply hotfixes, change production, change public runtime behavior, run retests, verify corrections, resolve incidents, perform remediation, complete corrections, send support responses, contact customers, configure providers, capture retest evidence, capture resolution evidence, capture remediation evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission.

Phase 5U-A/B references `docs/content/LOCAL-REMEDIATION-VERIFICATION-READINESS.md`, `docs/content/LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-POST-LAUNCH-REMEDIATION-READINESS.md`, `docs/content/LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE.md`, `scripts/validate-remediation-verification-readiness.cjs`, `scripts/validate-post-launch-remediation-readiness.cjs`, and protected admin remediation verification readiness helper coverage.

No deployment is performed or approved by Phase 5U-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled retest evidence, filled resolution evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, route walkthrough, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, retest, resolution, monitoring, analytics, support follow-up, live hotfix, correction completion, deployment permission, or public admin internals.

## Phase 5T-A/B Post-Launch Remediation Readiness References

Current phase: Phase 5T-A/B post-launch remediation readiness, incident triage correction backlog, and no-live-hotfix firewall.
Latest completed capability: Phase 5S-A/B post-launch observation readiness, incident/follow-up ledger, and no-live-monitoring firewall.
Last merged capability PR: #174.
Last merged capability merge commit: 98afaaf7ea94dfd8aac80d2b5dda26c2d57e731d.

Phase 5T-A/B adds repo-local post-launch remediation readiness, a local incident triage correction backlog template, protected admin post-launch remediation readiness helper coverage, no-live-hotfix firewall coverage, release-candidate suite integration, validate:post-launch-remediation-readiness validator coverage, and deterministic Phase 5T post-launch remediation readiness tests. These controls are template-only, non-live, not evidence, and do not apply hotfixes, change production, change public runtime behavior, record incidents, perform remediation, complete corrections, send support responses, contact customers, configure providers, capture remediation evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission.

Phase 5T-A/B references `docs/content/LOCAL-POST-LAUNCH-REMEDIATION-READINESS.md`, `docs/content/LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE.md`, `docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md`, `docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md`, `scripts/validate-post-launch-remediation-readiness.cjs`, `scripts/validate-post-launch-observation-readiness.cjs`, and protected admin post-launch remediation readiness helper coverage.

No deployment is performed or approved by Phase 5T-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled remediation evidence, filled hotfix evidence, filled correction-completed evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, remediation, monitoring, analytics, support follow-up, live hotfix, correction completion, deployment permission, or public admin internals.

## Phase 5S-A/B Post-Launch Observation Readiness References

Current phase: Phase 5S-A/B post-launch observation readiness, incident/follow-up ledger, and no-live-monitoring firewall.
Latest completed capability: Phase 5R-A/B launch decision response readiness, release closure packet template, and no-live-change firewall.
Last merged capability PR: #173.
Last merged capability merge commit: 6d6bcd9ebae98a068a89d062eea8654879ca2019.

Phase 5S-A/B adds repo-local post-launch observation readiness, a local incident/follow-up ledger template, protected admin post-launch observation readiness helper coverage, no-live-monitoring firewall coverage, release-candidate suite integration, validate:post-launch-observation-readiness validator coverage, and deterministic Phase 5S post-launch observation readiness tests. These controls are template-only, non-live, not evidence, and do not launch production, monitor live traffic, collect analytics, configure alerts, record incidents, send support responses, send customer follow-up, capture post-launch evidence, capture production evidence, capture preview evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission.

Phase 5S-A/B references `docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md`, `docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md`, `docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md`, `scripts/validate-post-launch-observation-readiness.cjs`, `scripts/validate-launch-decision-response-readiness.cjs`, and protected admin post-launch observation readiness helper coverage.

No deployment is performed or approved by Phase 5S-A/B. It does not add provider config, monitoring provider config, analytics provider config, alerting provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled incident evidence, filled support evidence, filled monitoring evidence, filled analytics evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, post-launch readiness, incident triage, monitoring, analytics, support follow-up, deployment permission, or public admin internals.

## Phase 5R-A/B Launch Decision Response Readiness References

Current phase: Phase 5R-A/B launch decision response readiness, release closure packet template, and no-live-change firewall.
Latest completed capability: Phase 5Q-A/B smoke evidence review readiness, go/no-go decision ledger, and no-launch/no-production firewall.
Last merged capability PR: #172.
Last merged capability merge commit: 607196e684649c2ed0fa70a9e530e9a58c7d09ab.

Phase 5R-A/B adds repo-local launch decision response readiness, a local release closure / continuation packet template, protected admin launch decision response readiness helper coverage, no-live-change firewall coverage, release-candidate suite integration, validate:launch-decision-response-readiness validator coverage, and deterministic Phase 5R launch decision response readiness tests. These controls are template-only, non-live, not evidence, and do not send launch decision responses, record go/no-go decisions, complete evidence review, record route verification, record route-walkthrough evidence, record rollback evidence, record preview evidence, record production evidence, record owner approval, record owner sign-off, grant launch clearance, grant deployment permission, claim release closure, or claim production readiness.

Phase 5R-A/B references `docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md`, `docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md`, `docs/content/LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS.md`, `docs/content/LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE.md`, `scripts/validate-launch-decision-response-readiness.cjs`, `scripts/validate-smoke-evidence-review-readiness.cjs`, and protected admin launch decision response readiness helper coverage.

No deployment is performed or approved by Phase 5R-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled response-sent evidence, filled launch-response evidence, filled release-closure evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, go/no-go approval, launch response, release closure, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, deployment permission, or public admin internals.

## Phase 5Q-A/B Smoke Evidence Review Readiness References

Current phase: Phase 5Q-A/B smoke evidence review readiness, go/no-go decision ledger, and no-launch/no-production firewall.
Latest completed capability: Phase 5P-A/B smoke evidence intake readiness, route verification ledger, and rollback observation firewall.
Last merged capability PR: #171.
Last merged capability merge commit: 3a1e1e80dfe0f1e21ac58335a7dfafebed829c53.

Phase 5Q-A/B adds repo-local smoke evidence review readiness, a local go/no-go decision ledger template, protected admin smoke evidence review readiness helper coverage, no-launch/no-production firewall coverage, release-candidate suite integration, validate:smoke-evidence-review-readiness validator coverage, and deterministic Phase 5Q smoke evidence review readiness tests. These controls are template-only, non-live, not evidence, and do not review actual smoke evidence, record go/no-go decisions, record route verification, record route-walkthrough evidence, record rollback evidence, record preview evidence, record production evidence, record owner approval, grant launch clearance, grant deployment permission, or claim production readiness.

Phase 5Q-A/B references `docs/content/LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS.md`, `docs/content/LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS.md`, `docs/content/LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE.md`, `scripts/validate-smoke-evidence-review-readiness.cjs`, `scripts/validate-smoke-evidence-intake-readiness.cjs`, and protected admin smoke evidence review readiness helper coverage.

No deployment is performed or approved by Phase 5Q-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, go/no-go approval, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, deployment permission, or public admin internals.

## Phase 5P-A/B Smoke Evidence Intake Readiness References

Current phase: Phase 5P-A/B smoke evidence intake readiness, route verification ledger, and rollback observation firewall.
Latest completed capability: Phase 5O-A/B deployment execution runbook readiness, provider/env decision matrix, and rollback rehearsal firewall.
Last merged capability PR: #170.
Last merged capability merge commit: dc2307a3ce2389b5b7b1780b4012e957a2fa49ed.

Phase 5P-A/B adds repo-local smoke evidence intake readiness, a local route verification and rollback observation ledger template, protected admin smoke evidence intake readiness helper coverage, rollback observation firewall coverage, release-candidate suite integration, validate:smoke-evidence-intake-readiness validator coverage, and deterministic Phase 5P smoke evidence intake readiness tests. These controls are template-only, non-live, not evidence, and do not record deployment approval, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, route verification, rollback readiness, owner review, owner feedback, owner re-review, owner approval, owner sign-off, owner decision evidence, preview evidence, production evidence, smoke evidence, rollback evidence, route-walkthrough evidence, deployment permission, or filled owner-review evidence.

Phase 5P-A/B references `docs/content/LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS.md`, `docs/content/LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS.md`, `docs/content/LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE.md`, `scripts/validate-smoke-evidence-intake-readiness.cjs`, `scripts/validate-deployment-execution-runbook-readiness.cjs`, and protected admin smoke evidence intake readiness helper coverage.

No deployment is performed or approved by Phase 5P-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled route-walkthrough evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route verification, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, deployment permission, or public admin internals.

## Phase 5O-A/B Deployment Execution Runbook Readiness References

Current phase: Phase 5O-A/B deployment execution runbook readiness, provider/env decision matrix, and rollback rehearsal firewall.
Latest completed capability: Phase 5N-A/B deployment approval request readiness, pre-launch blocker ledger, and no-provider/no-deploy approval firewall.
Last merged capability PR: #169.
Last merged capability merge commit: 0fe53323a6346bb425c9fd66efea00e82ab3cfe6.

Phase 5O-A/B adds repo-local deployment execution runbook readiness, a local provider/environment decision matrix template, protected admin deployment execution runbook readiness helper coverage, rollback rehearsal firewall coverage, release-candidate suite integration, validate:deployment-execution-runbook-readiness validator coverage, and deterministic Phase 5O deployment execution runbook readiness tests. These controls are template-only, non-live, not evidence, and do not record deployment approval, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, owner approval, owner sign-off, owner decision evidence, preview evidence, production evidence, smoke evidence, rollback evidence, deployment permission, or filled owner-review evidence.

Phase 5O-A/B references `docs/content/LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS.md`, `docs/content/LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE.md`, `docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md`, `docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md`, `scripts/validate-deployment-execution-runbook-readiness.cjs`, `scripts/validate-deployment-approval-request-readiness.cjs`, and protected admin deployment execution runbook readiness helper coverage.

No deployment is performed or approved by Phase 5O-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled rollback evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, launch clearance, provider readiness, environment readiness, preview readiness, production readiness, smoke readiness, rollback readiness, deployment permission, or public admin internals.

## Phase 5N-A/B Deployment Approval Request Readiness References

Current phase: Phase 5N-A/B deployment approval request readiness, pre-launch blocker ledger, and no-provider/no-deploy approval firewall.
Latest completed capability: Phase 5M-A/B owner decision intake readiness, sign-off criteria ledger, and no-launch/no-deploy decision guard.
Last merged capability PR: #168.
Last merged capability merge commit: 4def227c0da884391a1d1789ed8386b84211c0e8.

Phase 5N-A/B adds repo-local deployment approval request readiness, a local pre-launch blocker ledger template, protected admin deployment approval request readiness helper coverage, no-provider/no-deploy approval firewall coverage, release-candidate suite integration, validate:deployment-approval-request-readiness validator coverage, and deterministic Phase 5N deployment approval request readiness tests. These controls are template-only, non-live, not evidence, and do not record deployment approval, launch clearance, production readiness, provider setup, preview evidence, production evidence, owner approval, owner sign-off, owner decision evidence, smoke evidence, deployment permission, or filled owner-review evidence.

Phase 5N-A/B references `docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md`, `docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md`, `docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md`, `scripts/validate-deployment-approval-request-readiness.cjs`, `scripts/validate-owner-decision-intake-readiness.cjs`, and protected admin deployment approval request readiness helper coverage.

No deployment is performed or approved by Phase 5N-A/B. It does not add provider config, Vercel config, Supabase Cloud config, DNS/domain/CDN/environment/platform changes, real secrets or env values, filled owner-review evidence, filled preview evidence, filled production evidence, filled smoke evidence, filled owner decisions, filled approval evidence, filled sign-off evidence, filled launch evidence, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, launch clearance, provider readiness, production readiness, deployment permission, or public admin internals.

## Phase 5M-A/B Owner Decision Intake Readiness References

Current phase: Phase 5M-A/B owner decision intake readiness, sign-off criteria ledger, and no-launch/no-deploy decision guard.
Latest completed capability: Phase 5L-A/B owner re-review request readiness, correction delta packet, and no-signoff/no-response guard.
Last merged capability PR: #167.
Last merged capability merge commit: 4fe4b56cf2853517b9998d1d23237b6e1a37d8f4.

Phase 5M-A/B adds repo-local owner decision intake readiness, a local sign-off criteria ledger template, protected admin owner decision intake readiness helper coverage, no-launch/no-deploy decision guard coverage, release-candidate suite integration, validate:owner-decision-intake-readiness validator coverage, and deterministic Phase 5M owner decision intake readiness tests. These controls are template-only, non-live, not evidence, and do not record actual owner decisions, owner approval, owner acceptance, owner rejection, owner sign-off, launch clearance, deployment approval, production evidence, response-sent evidence, correction-completed evidence, or filled owner-review evidence.

Phase 5M-A/B references `docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md`, `docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md`, `docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md`, `docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md`, `scripts/validate-owner-decision-intake-readiness.cjs`, `scripts/validate-owner-re-review-request-readiness.cjs`, and protected admin owner decision intake readiness helper coverage.

No deployment is performed or approved by Phase 5M-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner decisions, filled sign-off criteria, filled owner approval, filled launch facts, filled business facts, filled deployment approval, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner response, owner sign-off, or public admin internals.

## Phase 5L-A/B Owner Re-Review Request Readiness References

Current phase: Phase 5L-A/B owner re-review request readiness, correction delta packet, and no-signoff/no-response guard.

Latest completed capability: Phase 5K-A/B owner correction workflow readiness, public content-gap guard, and no-response/no-deploy correction handoff.

Last merged capability PR: #166.

Last merged capability merge commit: fc9eb856143be259e63a31fa8cc9c54426741a97.

Phase 5L-A/B adds repo-local owner re-review request readiness, a local correction delta packet template, protected admin owner re-review request readiness helper coverage, no-response/no-signoff guard coverage, release-candidate suite integration, validate:owner-re-review-request-readiness validator coverage, and deterministic Phase 5L owner re-review request readiness tests. These controls are template-only, non-live, not evidence, and do not record actual owner feedback, owner re-review, owner responses, owner decisions, owner acceptance, owner rejection, owner approval, owner sign-off, owner corrections completed, correction-completed evidence, response-sent evidence, preview evidence, production evidence, route-walkthrough evidence, smoke evidence, acceptance evidence, launch clearance, public launch evidence, or deployment approval.

Phase 5L-A/B references `docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md`, `docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md`, `docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md`, `docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md`, `scripts/validate-owner-re-review-request-readiness.cjs`, `scripts/validate-owner-correction-workflow-readiness.cjs`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner re-review request readiness helper coverage.

No deployment is performed or approved by Phase 5L-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled owner re-review records, filled correction delta packets, filled public content gaps, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner approval, owner response, owner sign-off, or public admin internals.

## Phase 5K-A/B Owner Correction Workflow Readiness References

Current phase: Phase 5K-A/B owner correction workflow readiness, public content-gap guard, and no-response/no-deploy correction handoff.

Latest completed capability: Phase 5J-A/B owner-review feedback intake readiness, correction queue reconciliation, and no-approval update guard.

Last merged capability PR: #164.

Last merged capability merge commit: 68d4a20ac46c2a37abca3a253e0ae11ed713e2e1.

Phase 5K-A/B adds a repo-local owner correction workflow readiness template, local public content-gap register template, protected admin owner correction workflow helper, public/private route safety guard coverage, no-response/no-evidence/no-deploy correction handoff coverage, validate:owner-correction-workflow-readiness validator coverage, and deterministic Phase 5K owner correction workflow readiness tests. These controls are template-only, non-live, not evidence, and do not record filled owner feedback, owner approval, owner decisions, owner corrections, owner responses, owner answers, owner sign-off, preview evidence, production evidence, provider approval, correction-completed evidence, response-sent evidence, route-walkthrough evidence, acceptance evidence, launch clearance, public launch evidence, or deployment approval.

Phase 5K-A/B references `docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md`, `docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md`, `docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md`, `docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md`, `scripts/validate-owner-correction-workflow-readiness.cjs`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner correction workflow readiness helper coverage.

No deployment is performed or approved by Phase 5K-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled public content gaps, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, launch clearance, owner approval, owner response, or public admin internals.

## Phase 5J-A/B Owner Feedback Intake Readiness References

Current phase: Phase 5J-A/B owner-review feedback intake readiness, correction queue reconciliation, and no-approval update guard.

Latest completed capability: Phase 5I-A/B owner-review walkthrough readiness, full-route acceptance matrix, and no-deploy handoff refresh.

Last merged capability PR: #163.

Last merged capability merge commit: 62c8a9aefb15e2bbc420507a1b52bc716f49b670.

Phase 5J-A/B adds a repo-local owner feedback intake readiness package, local correction queue reconciliation template, protected admin owner-feedback readiness helper, public/private route parity guard coverage, no-approval/no-evidence update guard coverage, validate:owner-feedback-intake-readiness validator coverage, and deterministic Phase 5J owner-feedback intake readiness tests. These controls are template-only, non-live, not evidence, and do not record filled owner feedback, owner approval, owner decisions, owner corrections, owner answers, owner sign-off, preview evidence, production evidence, provider approval, correction-completed evidence, response-sent evidence, route-walkthrough evidence, acceptance evidence, public launch evidence, or deployment approval.

Phase 5J-A/B references `docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md`, `docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md`, `docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md`, `docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md`, `scripts/validate-owner-feedback-intake-readiness.cjs`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner-feedback readiness helper coverage.

No deployment is performed or approved by Phase 5J-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled owner feedback, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, correction-completed evidence, response-sent evidence, route-walkthrough evidence, public launch evidence, owner approval, or public admin internals.

## Phase 5I-A/B Owner-Review Walkthrough Readiness References

Current phase: Phase 5I-A/B owner-review walkthrough readiness, full-route acceptance matrix, and no-deploy handoff refresh.

Latest completed capability: Phase 5H-A/B protected admin catalogue write workflow polish, validation/error UX, and public parity guard.

Last merged capability PR: #162.

Last merged capability merge commit: fddfce84daa93141a7b353179f906c8827a9d6e7.

Phase 5I-A/B adds a repo-local owner-review walkthrough readiness package, local full-route acceptance matrix, protected admin owner-review walkthrough helper, public/private route parity guard coverage, owner input question inventory, validate:owner-review-walkthrough-readiness validator coverage, and deterministic Phase 5I owner-review walkthrough tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, route-walkthrough evidence, response-sent evidence, write-success evidence, acceptance evidence, public launch evidence, or deployment approval.

Phase 5I-A/B references `docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md`, `docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md`, `docs/content/LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS.md`, `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `scripts/validate-owner-review-walkthrough-readiness.cjs`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin owner-review walkthrough helper coverage.

No deployment is performed or approved by Phase 5I-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, route-walkthrough evidence, write-success evidence, response-sent evidence, public launch evidence, or public admin internals.

## Phase 5H-A/B Catalogue Write Workflow Readiness References

Current phase: Phase 5H-A/B protected admin catalogue write workflow polish, validation/error UX, and public parity guard.

Latest completed capability: Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary.

Last merged capability PR: #161.

Last merged capability merge commit: e051d98ee50501fccca8e9b55411dee6a6d7cc95.

Phase 5H-A/B adds repo-local protected admin listing, category, and media write workflow polish, validation/error/success boundary hardening, public parity guard coverage, local catalogue write workflow readiness documentation, validate:catalogue-write-workflow-readiness validator coverage, and deterministic Phase 5H catalogue write workflow tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, write-success evidence, or deployment approval.

Phase 5H-A/B references `docs/content/LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS.md`, `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `scripts/validate-catalogue-write-workflow-readiness.cjs`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin listing/category/media write workflow helpers.

No deployment is performed or approved by Phase 5H-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, write-success evidence, or public admin internals.

## Phase 5G-A/B Catalogue Content-Ops Readiness References

Current phase: Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary.

Latest completed capability: Phase 5F-A/B protected admin quote triage workflow, response-readiness checklist, and public/private boundary hardening.

Last merged capability PR: #160.

Last merged capability merge commit: faa06b3598317699c06ab55a1f987dac831306b6.

Phase 5G-A/B adds repo-local protected admin catalogue content-ops UX polish, listing/category/media readiness checklist coverage, media/fallback/alt-text boundary hardening, public catalogue parity checks, local catalogue content-ops readiness documentation, validate:catalogue-content-ops-readiness validator coverage, and deterministic Phase 5G catalogue content-ops tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, or deployment approval.

Phase 5G-A/B references `docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md`, `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-catalogue-content-ops-readiness.cjs`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin catalogue/listing/media readiness helpers.

No deployment is performed or approved by Phase 5G-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, owner-approved media claims, final styling claims, real inventory confirmation, or public admin internals.

## Phase 5F-A/B Quote Triage Readiness References

Current phase: Phase 5F-A/B protected admin quote triage workflow, response-readiness checklist, and public/private boundary hardening.

Latest completed capability: Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected admin triage parity.

Last merged capability PR: #159.

Last merged capability merge commit: aec1d7e781f3db463aac3079a00ddb7a25564a0c.

Phase 5F-A/B adds repo-local protected admin quote triage workflow polish, admin status/lifecycle display clarity, a response-readiness checklist derived from existing request fields, public/private quote boundary hardening, local quote triage readiness documentation, validate:quote-triage-readiness validator coverage, and deterministic Phase 5F quote triage tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, response-sent evidence, or deployment approval.

Phase 5F-A/B references `docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md`, `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-quote-triage-readiness.cjs`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin quote triage helpers.

No deployment is performed or approved by Phase 5F-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, outbound messaging, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5E-A/B Quote/Enquiry Intake Readiness References

Current phase: Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected admin triage parity.

Latest completed capability: Phase 5D-A/B public listing-detail readiness, media/context polish, and quote-intent review closure.

Last merged capability PR: #158.

Last merged capability merge commit: f5f3b23426df052568158ba3cf1c898deb617a93.

Phase 5E-A/B adds repo-local quote/enquiry intake reliability polish, public validation/error boundary hardening, receipt/reference boundary hardening, selected listing/category/event/search context preservation as editable request text, a protected admin quote triage parity helper, local quote/enquiry intake readiness documentation, validate:quote-intake-readiness validator coverage, and deterministic Phase 5E quote intake tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5E-A/B references `docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md`, `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-quote-intake-readiness.cjs`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin quote triage parity helpers.

No deployment is performed or approved by Phase 5E-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5D-A/B Listing Detail Readiness References

Current phase: Phase 5D-A/B public listing-detail readiness, media/context polish, and quote-intent review closure.

Latest completed capability: Phase 5C-A/B public discovery search/filter polish, quote-intent context, and admin discovery parity closure.

Last merged capability PR: #157.

Last merged capability merge commit: 1f471213c71aa1d3ff979a267ffd1c8b2a39fe6f.

Phase 5D-A/B adds repo-local public listing detail readiness polish, media/fallback copy hardening, related browsing continuity, quote-intent handoff closure, a protected admin listing-detail parity helper, local listing detail readiness documentation, validate:listing-detail-readiness validator coverage, and deterministic Phase 5D listing detail tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5D-A/B references `docs/content/LOCAL-LISTING-DETAIL-READINESS.md`, `docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-listing-detail-readiness.cjs`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin listing-detail parity helpers.

No deployment is performed or approved by Phase 5D-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5C-A/B Public Discovery Acceptance References

Current phase: Phase 5C-A/B public discovery search/filter polish, quote-intent context, and admin discovery parity closure.

Latest completed capability: Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks.

Last merged capability PR: #156.

Last merged capability merge commit: adca108ef0b5577fea0078b69f3ad524d9406e77.

Phase 5C-A/B adds repo-local public discovery search/filter polish, category/event-use discovery cleanup, quote-intent context hardening, public empty/fallback UX hardening, a protected admin discovery parity helper, local discovery acceptance documentation, validate:public-discovery-acceptance validator coverage, and deterministic Phase 5C public discovery tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5C-A/B references `docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md`, `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-public-discovery-acceptance.cjs`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin discovery parity helpers.

No deployment is performed or approved by Phase 5C-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5B-A/B Public Journey Acceptance References

Current phase: Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks.

Latest completed capability: Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure.

Last merged capability PR: #155.

Last merged capability merge commit: 00b750ab34f433f1d4ca5567828b73e8ddeb3d05.

Phase 5B-A/B adds repo-local public catalogue-to-enquiry journey hardening, listing continuity, quote/enquiry request UX hardening, a protected admin public-parity review helper, local public journey acceptance documentation, validate:public-journey-acceptance validator coverage, and deterministic Phase 5B public journey tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5B-A/B references `docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md`, `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, `scripts/validate-public-journey-acceptance.cjs`, `scripts/validate-public-review-polish.cjs`, and protected admin public-parity review helpers.

No deployment is performed or approved by Phase 5B-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 5A-A/B Public Review Polish References

Current phase: Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure.

Latest completed capability: Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center.

Last merged capability PR: #154.

Last merged capability merge commit: 85bfc8fb459cfc74db3ff80634ff35302691cb7f.

Phase 5A-A/B adds a repo-local public owner-review polish sweep, quote/enquiry intake copy cleanup, protected admin owner review checklist summary, local content-readiness cleanup note, validate:public-review-polish validator, and deterministic Phase 5A public review polish tests. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 5A-A/B references `docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md`, `scripts/validate-public-review-polish.cjs`, `docs/OWNER-HANDOFF-BUNDLE.md`, `docs/content/OWNER-FACING-REVIEW-BRIEF.md`, `.github/ISSUE_TEMPLATE/owner-approval-request.md`, and `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`.

No deployment is performed or approved by Phase 5A-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Phase 4F-A/B Owner Handoff Bundle References

Current phase: Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center.

Latest completed capability: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate.

Last merged capability PR: #153.

Last merged capability merge commit: 0e5379d21edd9ee67b9f929a3ba8e217d51ed17f.

Phase 4F-A/B adds a repo-local owner-facing review brief, blank owner approval issue template, no-deploy preflight command center, owner handoff bundle index, validate:owner-handoff-bundle validator, and protected admin Phase 4F handoff-bundle snapshot. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4F-A/B references `docs/content/OWNER-FACING-REVIEW-BRIEF.md`, `.github/ISSUE_TEMPLATE/owner-approval-request.md`, `docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md`, `docs/OWNER-HANDOFF-BUNDLE.md`, and `scripts/validate-owner-handoff-bundle.cjs`.

No deployment is performed or approved by Phase 4F-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

# Decision Log

## Phase 4E-A/B Owner Approval Request Gate References

Current phase: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate.

Latest completed capability: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure.

Last merged capability PR: #152

Merge commit: `10950d11ca6c40580982f35e615b3cf063f58a49`

Phase 4E-A/B adds a repo-local owner approval request packet, preview-planning handoff template, final no-deploy decision gate, validate:owner-approval-request validator, and protected admin Phase 4E approval-request snapshot. These controls are template-only, non-live, not evidence, and do not record owner approval, owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4E-A/B references `docs/content/OWNER-APPROVAL-REQUEST-PACKET.md`, `docs/content/PREVIEW-PLANNING-HANDOFF-TEMPLATE.md`, `docs/content/FINAL-NO-DEPLOY-DECISION-GATE.md`, and `scripts/validate-owner-approval-request.cjs`.

No deployment is performed or approved by Phase 4E-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.

## Previous Current Phase 4D-A/B status:


## Phase 4D-A/B Local Release-Candidate Freeze References

Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure.

Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.

Last merged capability PR: #151

Merge commit: `9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336`

Phase 4D-A/B adds a repo-local local release-candidate freeze, full-suite reliability gate, deployment-planning firewall closure, validate:local-freeze validator, full website test-suite reliability hardening, and protected admin Phase 4D local-freeze snapshot. These controls are template-only, non-live, not evidence, and do not record owner feedback, owner decisions, owner corrections, owner sign-off, preview evidence, production evidence, provider approval, or deployment approval.

Phase 4D-A/B references `docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md`, `docs/content/FULL-SUITE-RELIABILITY-GATE.md`, `docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md`, and `scripts/validate-local-freeze.cjs`.

No deployment is performed or approved by Phase 4D-A/B. It does not add provider config, Vercel config, Supabase Cloud config, real secrets or env values, filled evidence, browser Supabase, service-role runtime paths, n8n/Pinecone runtime changes, `/api/chat` retrieval wiring, public uploads, customer accounts, public quote tracking, notifications, CRM, invented operational facts, ecommerce flows, payment/order/checkout flows, booking/reservation flows, fulfilment flows, stock-reservation flows, or public admin internals.


## Phase 3Y-A/B Protected Admin Destructive-Action Safeguards

Decision: Phase 3Y-A/B adds protected admin destructive-action safeguard docs, recovery lane guidance, a status-transition matrix, protected admin helper/recovery copy, content readiness snapshot coverage, validators, and deterministic local tests. Latest completed capability is Phase 3X-A/B protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage from PR #146 at `50316a5c4052607487ba7409d5dc854889db6e24`.

Rationale: Admin actions that hide, archive, unpublish, or change operational state need clearer repo-local guardrails and recovery guidance without adding public routes, provider changes, deployment work, ecommerce flows, fake facts, or filled evidence.


## 2026-05-26: Vercel/Next.js Direction

Decision: `website/` becomes the future Next.js app root deployed by Vercel.

Reason: the public site needs a first-party app and API boundary instead of a
static direct-n8n demo architecture.

## 2026-05-26: Supabase System Of Record

Decision: Supabase becomes the system of record for products, quote requests,
conversations, messages, auth, storage, RLS, and tenant-ready boundaries.

Reason: the future site and SaaS chatbot need durable business data outside
n8n and Google Sheets.

## 2026-05-26: n8n Temporary Provider

Decision: n8n remains a temporary server-side chat provider and automation
integration layer.

Reason: the existing workflow can support Phase 1 while the app owns the public
API boundary.

## 2026-05-26: Custom Chat UI And `/api/chat`

Decision: long-term production chat uses custom UI that calls first-party
`POST /api/chat`.

Reason: the browser must not depend on n8n webhooks or the n8n chat widget.

## 2026-05-26: Provider Adapter Pattern

Decision: use a server-only `ChatProvider` interface with `N8nChatProvider` now
and `InternalSaasChatProvider` later.

Reason: provider swap should not require a frontend rewrite.

## 2026-05-26: Phase 1 Narrowed Deliberately

Decision: Phase 1 is limited to Next.js scaffold, public page/catalogue shell,
custom chat UI, `/api/chat`, server-only provider boundary, `N8nChatProvider`,
safe errors, basic Supabase schema, and tests.

Reason: Phase 1 must not become a full SaaS/RAG/admin rebuild.

## 2026-05-26: No Direct Browser-to-n8n

Decision: browser-to-n8n direct calls are not part of the long-term app.

Reason: direct calls expose n8n as the runtime boundary and make future
migration harder.

## 2026-05-26: MVP Non-streaming

Decision: MVP chat is non-streaming.

Reason: the current workflow is non-streaming and streaming/SSE should not
become a Phase 1 frontend dependency.

## 2026-05-26: Deferred Work

Decision: full SaaS admin, RAG, internal chatbot runtime, vector DB,
streaming/SSE, billing, and public SaaS onboarding are deferred.

Reason: these belong to later phases and require separate approval.

## 2026-05-26: Local Chat Config Must Not Be Reused

Decision: `website/chat-config.js` must never be read, printed, copied,
migrated, committed, or used as source for the new app.

Reason: it is gitignored and may contain a local real webhook URL.

## 2026-05-26: Server-only Provider Selection

Decision: Phase 1 chat provider selection reads server-only `CHAT_PROVIDER`.
Unset, empty, and `n8n` use `N8nChatProvider`; unknown values fail through the
safe provider-unavailable `/api/chat` response.

Reason: provider selection must not create browser-visible n8n configuration or
revive the old static n8n chat path as a production route.

## 2026-05-27: Fail-closed Chat Rate-limit Fallback

Decision: public chat rate limiting uses `clientSessionId` for per-session
limits, a trusted client IP bucket only when `CHAT_TRUSTED_CLIENT_IP_HEADER`
names a proxy/CDN-overwritten header, and a server-side fallback bucket when no
trusted client IP source is available.

Reason: user-supplied forwarding headers are spoofable, but relying only on
attacker-controlled `clientSessionId` lets callers bypass the public chat cap
by rotating sessions. The fallback bucket fails closed until deployment
configures a trusted client IP header.

## 2026-05-27: Local-only Supabase RLS Behaviour Tests

Decision: behavioural RLS and tenant-isolation coverage runs against a
throwaway local Docker database with fake fixtures and a minimal
Supabase-compatible auth role surface.

Reason: the project needs executable proof for the committed RLS policies
before runtime Supabase use, without linking to Supabase Cloud, adding
credentials, deploying, or introducing app-side Supabase wiring.

## 2026-05-27: Fake Catalogue Seed Fixtures

Decision: Phase 1F-D seed data is limited to reviewed fake/sample catalogue
fixtures under `supabase/seeds/`, validated with a Docker-only local database
harness.

Reason: the project needs deterministic sample catalogue rows for future local
checks while keeping production seeding, Supabase Cloud connection, runtime
Supabase wiring, catalogue DB reads, quote persistence, conversation/message
persistence, and deployment deferred.

## 2026-05-27: Server-only Supabase Runtime Wiring

Decision: Phase 1G-A adds a server-only Supabase JS wrapper under
`website/lib/supabase/` that reads only `SUPABASE_URL` and
`SUPABASE_ANON_KEY`, returns an explicit disabled result when missing, and is
covered by static tests that keep `@supabase/*` out of browser-facing code.

Reason: future server routes need a narrow Supabase foundation, but this phase
must not introduce browser clients, service-role keys, Supabase Cloud
connection, catalogue reads, persistence flows, deployment, or n8n workflow
changes.

## 2026-05-27: Server-only Published Catalogue Reads

Decision: Phase 1G-B adds a server-only public catalogue repository under
`website/lib/catalogue/` and wires public catalogue pages to read published
`categories`, published `products`, and image metadata for published products
when Supabase server env and trusted server-only `CATALOGUE_WORKSPACE_ID` are
configured.

Reason: public catalogue pages can now use the approved Supabase runtime
boundary without mixing workspace-owned catalogue rows or adding browser
Supabase code, service-role keys, writes, quote/chat/admin persistence,
Supabase Storage delivery, deployment, or live Supabase Cloud validation.

## 2026-05-27: Defer Direct Anonymous Catalogue RLS Hardening

Decision: direct anonymous RLS access to published `categories`, `products`,
and `product_images` remains available for the server-side anon-key catalogue
runtime in Phase 1H-A. Runtime catalogue queries must still use trusted
server-only `CATALOGUE_WORKSPACE_ID` filters. Direct anonymous RLS hardening is
deferred until a trusted active-workspace read strategy exists.

Reason: disabling direct anonymous catalogue reads while the runtime still uses
the anon key would make configured DB-backed catalogue reads return empty rows.
A future hardening phase needs a strategy that avoids broad direct reads
without service-role keys or browser Supabase code.

## 2026-05-27: First-party Quote Request Persistence

Decision: Phase 1H-A adds `POST /api/quote`, a server-only quote repository,
bounded quote request validation, and narrow Supabase insert policies for
`quote_requests` and freeform `quote_request_items`.

Reason: quote persistence gives immediate MVP lead-capture value while keeping
product/admin persistence, conversation/message persistence, browser Supabase
clients, service-role keys, deployment, and n8n workflow changes out of scope.
The quote request row is the durable lead-capture boundary for this phase; if
freeform item insertion fails after the quote row is captured, the public
request is still treated as received and atomic quote/item writes remain
deferred.

## 2026-05-27: Chat Persistence Design Before Writes

Decision: Phase 1I-A documents the future chat persistence privacy/security
boundary and adds only disabled server-only scaffolding under
`website/lib/chat/persistence/`.

Reason: `conversations` and `messages` are privacy-sensitive and need trusted
server-side workspace resolution, first-party route boundaries, idempotency
rules, and PII minimization before any real writes are approved. This phase
does not add conversation/message persistence, Supabase reads or writes,
migrations, service-role keys, browser Supabase code, Supabase Cloud
connection, n8n workflow changes, RAG/vector DB, streaming/SSE, admin chat
history tools, or authenticated user-linked conversations.

## 2026-05-27: Product/Admin Persistence Design Before Writes

Decision: Phase 1J-A documents the future product/admin persistence boundary
and adds only disabled server-only scaffolding under
`website/lib/products/persistence/`.

Reason: category, product, and product image writes are trusted-admin
operations that need auth, membership-scoped workspace resolution, first-party
server routes/actions, media strategy, and audit/publishing decisions before
real writes are approved. This phase does not add product/category/product
image persistence, public mutation routes, admin/auth UI, Supabase reads or
writes, migrations, service-role keys, browser Supabase code, Supabase Storage,
product image upload flows, Supabase Cloud connection, deployment, or n8n
workflow changes.

## 2026-05-27: Quote Endpoint Abuse Throttling

Decision: Phase 1K-A adds best-effort in-process abuse throttling to
`POST /api/quote` before quote persistence writes.

Reason: the public unauthenticated quote route intentionally accepts bounded
website quote submissions, but repeated valid submissions can pollute quote
data and consume Supabase write quota. The route now uses bounded in-memory
client and normalized-email buckets, trusts forwarding headers only when
`QUOTE_TRUSTED_CLIENT_IP_HEADER` is configured to an approved proxy/CDN
header, falls back to a shared fail-closed bucket otherwise, and returns safe
generic `429` responses with `retry-after`. This phase does not change quote
table schema, quote persistence semantics, Supabase RLS policies, direct
anonymous catalogue RLS, browser Supabase code, service-role keys, deployment,
external anti-abuse services, or n8n workflows.

## 2026-05-27: Catalogue RLS Hardening Strategy First

Decision: Phase 1L-A documents the trusted active-workspace catalogue RLS
hardening strategy and adds static proof guards, but does not tighten direct
anonymous catalogue RLS yet.

Reason: current DB-backed catalogue reads still use the anon Supabase key from
a server-only runtime and must keep returning rows for trusted
`CATALOGUE_WORKSPACE_ID`. Removing anonymous catalogue `select` policies before
a trusted active-workspace read surface is proven would break configured
catalogue pages. The future hardening path must deny cross-workspace direct
anonymous catalogue reads without adding service-role keys, browser Supabase
clients, client-provided workspace IDs, deployment changes, Supabase Cloud
connection, or n8n workflow changes.

## 2026-05-27: Trusted Active-Workspace Catalogue Read Surface

Decision: Phase 1M-A adds `catalogue_public_workspace_config` and the
server-only `get_public_catalogue(expected_workspace_id, product_slug)` RPC,
then tightens direct anonymous base-table catalogue select policies with
`alter policy ... using (false)`.

Reason: DB-backed public catalogue pages need to keep working through the
anon-key server runtime for trusted `CATALOGUE_WORKSPACE_ID`, but direct
anonymous callers must not be able to query published catalogue base tables
across workspaces. The RPC validates the server-configured expected workspace
against database-owned active workspace state, uses no service-role key, keeps
Supabase out of browser-facing code, and is covered by local behavioural RLS
tests.

## 2026-05-27: Active Catalogue Workspace Bootstrap Plan

Decision: Phase 1N-A documents `catalogue_public_workspace_config` as
deployment/database-owned configuration and adds a docs-only SQL example for a
future approved operator to set the active public catalogue workspace.

Reason: Phase 1M-A made DB-backed catalogue reads depend on a database-owned
active workspace config row. The project needs a reviewed bootstrap path before
real environments enable DB-backed public catalogue reads, while keeping
Supabase Cloud connection, deployment, production seed data, service-role
runtime writes, browser Supabase code, catalogue writes, quote throttling
changes, and n8n workflow changes deferred.

## 2026-05-27: Deployment Environment Readiness Before Deployment

Decision: Phase 1O-A documents the future server-only environment contract and
forbidden public variables before any Vercel deployment or Supabase Cloud
connection is approved.

Reason: the project now has server-only Supabase, catalogue, quote, chat, and
trusted proxy header paths that will need deployment configuration later. The
required env names, safe missing-env behaviour, and preflight checks should be
explicit before real secrets, deployment config, browser Supabase, service-role
runtime paths, production seed data, or live external systems are introduced.

## 2026-05-27: Phase 1 Closeout Before Phase 2 Runtime Work

Decision: Phase 1P-A adds a closeout audit and Phase 2 readiness plan without
adding runtime features.

Reason: the repo now has enough local foundation, server-only boundaries,
Supabase schema/RLS proof, catalogue/quote runtime paths, and safety guards
that future work should start from an explicit decision gate. Product writes,
conversation/message persistence, Supabase Storage, deployment, Supabase Cloud
connection, admin/auth UI, service-role runtime paths, browser Supabase, and
internal RAG remain deferred until separately approved.

## 2026-05-27: Deployment Smoke-Test Runbook Before Deployment

Decision: Phase 2A-A adds a deployment smoke-test runbook, unchecked operator
checklist, and deployment evidence template before any real deployment work is
approved.

Reason: the first Phase 2 deployment track needs an operator-facing way to
review server-only env placement, forbidden public variables, active catalogue
workspace config, quote workspace config, server-only n8n webhook handling,
trusted proxy headers, smoke-test evidence, rollback, and monitoring before
Vercel or Supabase Cloud work begins. This phase does not deploy, connect to
Supabase Cloud, add Vercel config, add real env values, add service-role
runtime paths, add browser Supabase, add runtime features, change catalogue
RLS/runtime behaviour, change quote throttling, add product/category/product
image writes, add conversation/message writes, or change n8n workflows.

## 2026-05-27: Admin/Auth Membership Design Before Product Writes

Decision: Phase 2B-A adds the admin/auth and workspace membership
authorization design plus an unchecked implementation checklist before any
product-management writes are approved.

Reason: category, product, and product image mutations need a reviewed
authenticated admin identity, active workspace membership, role model,
server-side workspace resolution, route/action boundary, audit expectations,
and RLS test plan before runtime writes exist. This phase does not implement
auth, add admin UI, add product/category/product image writes, add public
mutation routes, add browser Supabase, add service-role runtime paths, deploy,
connect to Supabase Cloud, change catalogue RLS/runtime behaviour, change quote
throttling, add conversation/message writes, or change n8n workflows.

## 2026-05-27: Server-only Admin Authorization Policy Boundary

Decision: Phase 2B-B adds a pure server-only admin authorization policy module
and tests that model future admin identity, active admin profile, active
workspace membership, role, workspace, and operation decisions from explicit
inputs only.

Reason: future product-management routes or server actions need a small,
testable policy boundary before real auth and membership resolution are wired
to runtime code. This phase does not implement real auth, add Supabase Auth
runtime wiring, add login/logout routes, add protected admin pages, add admin
UI, add product/category/product image writes, add service-role runtime paths,
add browser Supabase, deploy, connect to Supabase Cloud, change catalogue
RLS/runtime behaviour, change quote throttling, add conversation/message
writes, or change n8n workflows.

## 2026-05-27: Disabled Admin Auth Membership Resolver Contract

Decision: Phase 2B-C adds a server-only admin auth/membership resolver contract
and disabled scaffold that defines how future server-side auth and membership
resolution should produce inputs for the existing admin authorization policy.

Reason: future runtime admin routes or server actions need a clear boundary between
auth identity resolution, admin profile lookup, workspace membership
resolution, policy input construction, and policy decision output before real
auth is implemented. This phase returns `auth_resolver_disabled` by default and
does not implement real auth, add Supabase Auth runtime wiring, add
login/logout routes, add protected admin pages, add admin UI, add runtime
routes/pages/server actions, add product/category/product image writes, add
service-role runtime paths, add browser Supabase, deploy, connect to Supabase
Cloud, change catalogue RLS/runtime behaviour, change quote throttling, add
conversation/message writes, or change n8n workflows.

## 2026-05-28: Dependency-injected Admin Auth Adapter Boundary

Decision: Phase 2B-D adds server-only admin auth/membership adapter contracts
and a dependency-injected resolver path that can build policy input through
explicit fake/test adapters only.

Reason: future runtime admin boundaries need named contracts for authenticated
identity lookup, admin profile lookup, workspace resolution, and membership
lookup before real auth or database resolution is implemented. This phase does
bind the policy membership input to the active admin profile so a same-workspace
membership owned by another admin cannot authorize the actor. It does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, add
runtime routes/pages/server actions, add product/category/product image writes,
add service-role runtime paths, add browser Supabase, deploy, connect to
Supabase Cloud, change catalogue RLS/runtime behaviour, change quote
throttling, add conversation/message writes, or change n8n workflows.

## 2026-05-28: Admin Auth Provider And Session Design Before Runtime Auth

Decision: Phase 2B-E documents Supabase Auth as the preferred future
server-side admin auth provider and records the session/cookie, CSRF,
login/logout, protected admin page, adapter integration, and implementation
gates before any real auth runtime is added.

Reason: future auth wiring needs an explicit provider and session security
contract before cookies, headers, login/logout routes, protected admin pages,
or admin UI exist. This phase does not implement real auth, add Supabase Auth
runtime wiring, read cookies, read headers, add login/logout routes, add
protected admin pages, add admin UI, add runtime routes/pages/server actions,
add product/category/product image writes, add service-role runtime paths, add
browser Supabase, deploy, connect to Supabase Cloud, change catalogue
RLS/runtime behaviour, change quote throttling, add conversation/message
writes, or change n8n workflows.

## 2026-05-28: Checklist Hygiene And Current Phase Status

Decision: Phase 2B-F adds checklist maintenance rules, a quick phase status
page, reconciled checklist ownership/status, and static guard coverage only.

Reason: after the Phase 2B admin/auth design, policy, resolver, adapter, and
provider-session milestones, the repo needs checklists that stay truthful,
non-duplicative, and maintained along with development. This phase does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI, wire
resolver/adapters into runtime routes/pages/server actions, add
product/category/product image writes, deploy, connect to Supabase Cloud,
change catalogue RLS/runtime behaviour, change quote throttling, add
conversation/message writes, change n8n workflows, add Pinecone runtime code,
migrate Pinecone, or add SaaS chatbot app code.

## 2026-05-28: Separate Future SaaS Chatbot Boundary

Decision: the current SKR repo may keep using the existing n8n/Pinecone chatbot
workflow as a temporary production bridge while the website stabilizes. The
future SaaS chatbot should be a separate project/app, and SKR can later become
its first client/tenant.

Reason: the current n8n/Pinecone workflow should remain current RAG workflow
context only, not be forced into the future SaaS architecture. This keeps the
Phase 2B-F PR limited to docs/status hygiene and avoids Pinecone migration,
Pinecone credentials, SaaS chatbot app code, or n8n workflow changes.

## 2026-05-28: Repo Agent Instruction Refresh

Decision: Phase 2B-G refreshes repo agent instructions and static guard
coverage while keeping runtime auth, admin UI, product writes, browser
Supabase, service-role runtime paths, deployment, n8n workflow changes,
Pinecone runtime changes, and SaaS chatbot app work blocked.

Reason: future coding agents need the current architecture direction, phase
status, checklist rules, and hard safety boundaries in the repo-local
instructions before additional admin/auth boundary work continues.

## 2026-05-28: Reviewed Server-side Admin Auth Resolution Boundary

Decision: Phase 2B-H strengthens the dependency-injected server-only admin
authorization resolver/adapter boundary and proves safe allow/deny decisions
from trusted fake adapter inputs only.

Reason: future runtime admin routes or server actions need a reviewed
server-side boundary that denies anonymous identity, missing or inactive admin
profiles, missing or inactive memberships, wrong-actor memberships,
cross-workspace memberships, requested record workspace mismatches,
unsupported operations, and role violations before product writes are
approved. This phase keeps real auth runtime wiring, Supabase Auth runtime
wiring, cookie reads, header reads, login/logout routes, protected admin pages,
admin UI, runtime route/page/server-action wiring, product/category/product
image writes, Supabase Storage, service-role runtime paths, browser Supabase,
deployment, Supabase Cloud connection, n8n workflow changes, Pinecone runtime
changes, and SaaS chatbot app code out of scope.

## 2026-05-28: Admin Auth Implementation Gate Wording Cleanup

Decision: Phase 2B-I cleans stale stacked current-PR wording in the admin auth
membership design and refines runtime-readiness checklist/static guard wording
only.

Reason: the admin auth membership design had accumulated phase-specific
sentences from older Phase 2B PRs that could make the current work look like
Phase 2B-D, Phase 2B-E, or Phase 2B-H runtime boundary work. This phase keeps
the completed phase history, records Phase 2B-H as the latest completed
server-side boundary state, and leaves real auth runtime wiring, Supabase Auth
runtime wiring, cookie reads, header reads, login/logout routes, protected
admin pages, admin UI, runtime route/page/server-action wiring,
product/category/product image writes, Supabase Storage, service-role runtime
paths, browser Supabase, deployment, Supabase Cloud connection, n8n workflow
changes, Pinecone runtime changes, and SaaS chatbot app code out of scope.

## 2026-05-28: Admin Auth Runtime Approval Lane

Decision: Phase 2B-J selects Supabase Auth as the future admin auth provider
and approves the exact future server-only admin auth runtime lane.

The approved future lane is limited to first-party server-only routes or
server actions that use Supabase Auth server APIs only on the server, map the
provider identity to exactly one active `admin_users.auth_user_id`, resolve
active workspace membership owned by that admin profile, build policy input
through the existing server-only resolver/adapter contracts, use
server-managed HttpOnly cookies that are Secure in production and SameSite=Lax
by default unless a later OAuth flow documents an exception, validate CSRF
proof plus Origin/Host before any state-changing admin boundary, and prove the
required anonymous, expired-session, inactive-profile, missing-membership,
wrong-actor, cross-workspace, viewer-denial, admin-allowed,
owner-membership-management, CSRF-failure, safe-redirect, safe-error, no
browser Supabase, and no service-role runtime-path tests.

Reason: future runtime auth now needs one explicit approved lane before code
starts. This phase approves the lane and checklist gates only. It does not
implement real auth, add Supabase Auth runtime wiring, read cookies, read
headers, add login/logout routes, add protected admin pages, add admin UI,
wire resolver/adapters into runtime routes/pages/server actions, add
product/category/product image writes, add Supabase Storage, add service-role
runtime paths, add browser Supabase, deploy, connect Supabase Cloud, change
n8n workflows, add Pinecone runtime code, migrate Pinecone, or add SaaS chatbot
app code.

## 2026-05-28: Server-only Supabase Auth Identity Boundary

Decision: Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary.

The approved implementation boundary is
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`. It
is a server-only `AdminAuthAdapter` identity adapter that may read request
cookies with `cookies()` and call Supabase Auth `auth.getUser()` through
`@supabase/ssr` only inside that module. It returns the existing safe
authenticated identity shape or boring unauthenticated denial reasons, and it
does not expose tokens, cookies, provider internals, stack traces, Supabase
internals, SQL, or env values.

Reason: Phase 2B-J approved Supabase Auth as the future provider and approved
a server-only auth lane. The next safe step is a narrow identity/session-read
boundary behind the existing adapter contract, without wiring auth into
runtime routes, pages, server actions, protected admin pages, login/logout,
admin UI, product/category/product image writes, Supabase Storage,
service-role runtime paths, browser Supabase, deployment, Supabase Cloud, n8n
workflows, Pinecone runtime code, or SaaS chatbot code. Header reads remain
blocked; no headers are needed for this boundary.

## 2026-05-29: Server-only Admin Profile And Membership Read Boundary

Decision: Phase 2B-L adds only the server-only admin profile and membership read boundary.

The approved implementation boundary is
`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts`.
It is a server-only `AdminProfileAdapter` and `AdminMembershipAdapter`
implementation that may read `admin_users` by `auth_user_id` and
`memberships` by server-resolved `admin_user_id` plus `workspace_id` only
inside that module when an authenticated admin-read client is explicitly
injected. It does not default to the plain anon-key Supabase helper. Without
that injected dependency, the adapters fail closed with `null`. It returns the
existing safe adapter shapes only. Missing, inactive, duplicate, non-exact,
wrong-actor, cross-workspace, query-error, or provider-error results fail
closed without exposing Supabase errors, SQL, provider internals, env values,
stack traces, cookies, or tokens.

Reason: Phase 2B-K established the server-only Supabase Auth identity boundary.
The next safe step is the smallest Supabase-backed profile/membership read
boundary behind the existing adapter contracts, while live authenticated
read-client wiring remains deferred. This avoids silently using an
unauthenticated anon-key client for RLS-scoped admin reads. The phase does not
wire auth into runtime routes, pages, server actions, protected admin pages,
login/logout, admin UI, product/category/product image writes, Supabase
Storage, service-role runtime paths, browser Supabase, deployment, Supabase
Cloud, n8n workflows, Pinecone runtime code, `website/chat-config.js`, or SaaS
chatbot code. Cookie reads and Supabase Auth calls remain restricted to the
Phase 2B-K identity boundary; header reads remain blocked.

## 2026-05-29: Server-only Admin Workspace Resolution Boundary

Decision: Phase 2B-M adds only the server-only admin workspace resolution boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-workspace-resolver.ts`. It is a
server-only `AdminWorkspaceResolver` implementation that resolves trusted
workspace scope only from an explicitly injected trusted server-side workspace
ID. Browser/request workspace IDs are validation-only and never become
authority. Missing, empty, whitespace-only, mismatched, or provider-error
values fail closed with `{ serverResolvedWorkspaceId: null }`. Matching
validation-only workspace IDs may pass only when trusted server-side workspace
input is already present.

Reason: Phase 2B-L established the server-only admin profile/membership read
boundary behind the existing adapter contracts. The next safe step is to fill
the existing workspace resolver seam without using public catalogue workspace
configuration as an admin authorization shortcut and without wiring the
resolver into runtime routes, pages, or server actions. This phase does not
read cookies, call Supabase Auth, read headers, call Supabase tables, use
service-role keys, add browser Supabase, add login/logout, add protected admin
pages, add admin UI, add product/category/product image writes, add Supabase
Storage, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or add SaaS chatbot code.

## 2026-05-29: Server-only Session-bound Admin Read-client Factory

Decision: Phase 2B-N adds only the server-only session-bound admin read-client factory.

The approved implementation boundary remains
`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts`
because that module already owns the reviewed Phase 2B-K server-only cookie
read and Supabase Auth boundary. The factory creates a session-bound Supabase
SSR client from the reviewed server-only Supabase URL, anon key, and request
cookies, and returns the Phase 2B-L `SupabaseAdminReadClientResult` dependency
shape. Missing server env, cookie-read failure, client-factory failure, or a
missing explicit session-bound client fail closed with
`{ configured: false, client: null, reason: "authenticated_admin_read_client_required" }`.

Reason: Phase 2B-L profile/membership adapters require an explicitly injected
authenticated admin-read client and fail closed without one. The next safe step
is to create that dependency factory without wiring it into runtime routes,
pages, server actions, protected admin pages, login/logout, admin UI, or
product writes. This phase does not query `admin_users` or `memberships`, does
not call Supabase Auth from the read-client factory, does not read headers, use
service-role keys, add browser Supabase, add Supabase Storage, deploy, connect
Supabase Cloud, change n8n workflows, add Pinecone runtime code, access
`website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only Admin Authorization Adapter-set Composition Boundary

Decision: Phase 2B-O adds only the server-only admin authorization adapter-set composition boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-authorization-adapter-set.ts`.
It composes the existing `AdminAuthAdapter`, `AdminProfileAdapter`,
`AdminMembershipAdapter`, and `AdminWorkspaceResolver` contracts by assembling
the reviewed Phase 2B-K/N Supabase Auth identity and session-bound read-client
boundary, the Phase 2B-L profile/membership read boundary, and the Phase 2B-M
trusted workspace resolver boundary. The factory returns an
`AdminAuthorizationAdapterSet` only when the session-bound admin read client
and trusted server-side workspace input are available; otherwise it fails
closed with a safe unavailable result.

Reason: Phase 2B-N created the missing session-bound admin read-client
factory, while Phase 2B-L profile/membership adapters and Phase 2B-M workspace
resolution remained unwired. The next safe step is a server-only composition
boundary for future runtime use without importing route/page/server-action
code or completing runtime admin auth. This phase does not use the adapter set
from runtime routes, pages, or server actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, read
headers, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or make runtime admin auth
complete.

## 2026-05-29: Server-only Composed Admin Authorization Decision Boundary

Decision: Phase 2B-P adds only the server-only composed admin authorization decision boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-authorization-decision.ts`. It
uses the Phase 2B-O adapter-set composition boundary and calls the existing
`resolveAdminAuthorizationWithAdapters()` decision function. It returns normal
adapter-driven policy decisions when the composed adapter set is available and
returns a safe unavailable result when composition, the session-bound admin
read client, trusted workspace input, or provider dependencies fail.

Reason: Phase 2B-O created the server-only adapter-set composition boundary,
but runtime routes, pages, and server actions still need a future decision
entrypoint that does not duplicate policy logic. The next safe step is a
server-only decision wrapper for future runtime use, while keeping actual
runtime usage blocked. This phase does not use the decision boundary from
runtime routes, pages, or server actions, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, read
headers, deploy, connect Supabase Cloud, change n8n workflows, add Pinecone
runtime code, access `website/chat-config.js`, or make runtime admin auth
complete.

## 2026-05-29: Server-only Admin Request Security Preflight Boundary

Decision: Phase 2B-Q adds only the server-only admin request security preflight boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-request-security-preflight.ts`.
It validates only explicitly injected request metadata and optional injected
CSRF verifier results. It treats request/browser supplied method, Origin,
Host, and CSRF proof values as untrusted validation inputs, permits safe
read-only `catalogue.read` requests with same-origin metadata, requires POST
and a valid injected CSRF proof for state-changing admin operations, and fails
closed with safe shapes for missing, invalid, stale, replayed, mismatched, or
unsupported inputs.

Reason: Phase 2B-P created the future server-only composed authorization
decision boundary, but future state-changing admin routes and server actions
also need a request-security preflight before runtime wiring is approved. The
next safe step is a pure server-only validator that does not read real
headers, cookies, Supabase, route handlers, pages, or server actions. This
phase does not use the preflight boundary from runtime routes, pages, or
server actions, read headers, read cookies, call Supabase Auth, query
`admin_users` or `memberships`, compose the adapter set, call the decision
boundary, add login/logout routes, add protected admin pages, add admin UI,
add product/category/product image writes, add Supabase Storage, use
service-role keys, add browser Supabase, deploy, connect Supabase Cloud,
change n8n workflows, add Pinecone runtime code, access
`website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only CSRF Proof Verifier Boundary

Decision: Phase 2B-R adds only the server-only CSRF proof verifier boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts`. It
validates only explicitly injected proof material, expected session binding,
expected nonce, injected timestamps, and dependency-injected signature or
replay checks. It parses the simple structured
`base64url(JSON payload).base64url(signature)` proof shape and returns only
Phase 2B-Q-compatible verifier results: valid or one of the safe CSRF proof
failure reasons.

Reason: Phase 2B-Q added the request security preflight validator and requires
an injected CSRF verifier for future state-changing admin operations. The next
safe step is to add the verifier boundary without issuing tokens, reading real
headers, reading cookies, reading env, calling Supabase, or wiring the
verifier into runtime routes, pages, server actions, protected admin pages,
login/logout, admin UI, or product writes. This phase does not use the
verifier from runtime routes, pages, or server actions, read headers, read
cookies, call Supabase Auth, query `admin_users` or `memberships`, compose the
adapter set, call the decision boundary, add login/logout routes, add
protected admin pages, add admin UI, add product/category/product image writes,
add Supabase Storage, use service-role keys, add browser Supabase, deploy,
connect Supabase Cloud, change n8n workflows, add Pinecone runtime code,
access `website/chat-config.js`, or make runtime admin auth complete.

## 2026-05-29: Server-only CSRF Proof Issuer Boundary

Decision: Phase 2B-S adds only the server-only CSRF proof issuer boundary.

The approved implementation boundary is
`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts`. It issues
only verifier-compatible structured
`base64url(JSON payload).base64url(signature)` CSRF proofs for supported
state-changing admin operations. It accepts only explicitly injected operation,
session binding, nonce or nonce generator, issued-at/expiry timestamps, and a
dependency-injected signature signer. It returns a proof and safe expiry
metadata only when all required inputs are present and valid; otherwise it
fails closed with safe issue reasons.

Reason: Phase 2B-R created the verifier boundary, and future state-changing
admin routes or server actions need a matching issuer before any runtime use
can be considered. The next safe step is to add the issuer boundary without
reading real headers, cookies, env, Supabase, route handlers, pages, or server
actions, and without storing replay state or wiring the issuer into runtime.
This phase does not use the issuer from runtime routes, pages, or server
actions, read headers, read cookies, call Supabase Auth, query `admin_users`
or `memberships`, compose the adapter set, call the decision boundary, call
the preflight boundary from runtime, call the verifier from runtime, add
login/logout routes, add protected admin pages, add admin UI, add
product/category/product image writes, add Supabase Storage, use service-role
keys, add browser Supabase, deploy, connect Supabase Cloud, change n8n
workflows, add Pinecone runtime code, access `website/chat-config.js`, or make
runtime admin auth complete.

## 2026-05-31: Phase 2B-AC Admin Auth-check Trusted Workspace Dependency Repair

Decision: Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted workspace dependency through the existing approved dependency path.

Reason: The route previously passed only request metadata to the route gate adapter. Because the default `trustedServerWorkspaceId` was undefined without explicit injection, the internal workspace resolver failed closed (returning `{ serverResolvedWorkspaceId: null }`). The auth-check would therefore return HTTP 503 Service Unavailable, failing closed unconditionally. The fix leverages `process.env.ADMIN_TRUSTED_WORKSPACE_ID` and injects it as the trusted workspace dependency. It remains fail-closed and does not add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app code, or `website/chat-config.js` access.

## 2026-05-31: Phase 2B-AD Admin CSRF Proof Issuer Route Operation Approval Boundary

Decision: Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary.

Reason: A future first-party server-only CSRF proof issuer route needs a dedicated route-gate operation model before implementation. The current request preflight requires state-changing operations to be `POST` and to already include a valid CSRF proof. Therefore, a future CSRF proof issuer route must not route-gate itself as `product.write`, `category.write`, `productImage.write`, or `membership.manage`, because that creates a chicken-and-egg path where the proof issuer already needs the proof it is issuing. It must also not use only `admin.auth.check` as a loose substitute for write-operation authorisation without a clearly reviewed operation model. The likely future operation name is `admin.csrf.issue`.

The future route must remain server-only, use the approved route-gate path, and not call lower-level auth/security boundaries directly except the approved CSRF proof issuer boundary. It must not issue proofs for unsupported operations, nor expose CSRF secrets, verifier internals, signer internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, membership internals, workspace internals, or stack traces. Phase 2B-AD does not implement the actual route, approve or implement product/category/product image writes by itself, add admin UI, protected admin pages, login/logout routes, Storage, deployment config, Supabase Cloud connection, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-05-29: Server-only Admin Authorization Gate Composition Boundary

Decision: Phase 2B-T adds only the server-only admin authorization gate composition boundary at `website/lib/admin/authorization/server-admin-authorization-gate.ts`.

Reason: future admin runtime boundaries need one reviewed server-only seam that runs request-security preflight before the composed admin authorization decision without duplicating CSRF verification, role policy, membership policy, adapter composition, provider reads, or runtime route/page/server-action wiring.

The gate may run the Phase 2B-Q request security preflight, inject the Phase 2B-R CSRF proof verifier into preflight when verifier dependencies are supplied, and call the Phase 2B-P composed admin authorization decision only after preflight passes. It is not approval to issue CSRF proofs, read real headers, read cookies, read env, call Supabase, query `admin_users` or `memberships`, use the gate from runtime routes, pages, or server actions, add login/logout routes, protected admin pages, admin UI, product writes, Storage, browser Supabase, service-role runtime paths, deployment, Supabase Cloud, n8n workflow changes, Pinecone runtime code, or SaaS chatbot app code.

## 2026-05-29: Admin Runtime Wiring Approval Lane

Decision: Phase 2B-U adds only the admin runtime wiring approval lane for future use of `resolveServerAdminAuthorizationGate()`.

Reason: Phase 2B-T created the server-only gate, but future runtime code still needs an explicit approval lane before any route handler, page, server action, or real header-read adapter uses it. Recording the lane now lets the next implementation PR stay narrow and testable without accidentally approving product writes or admin UI.

The approved future lane is limited to first-party server-only route handlers or server actions. Real request headers may be read only inside a future reviewed server-only request metadata adapter, which must pass explicit method, Origin, Host, expected Origin, expected Host, request ID, operation, workspace-validation metadata, and CSRF proof values into `resolveServerAdminAuthorizationGate()`. Supabase Auth cookie reads remain only inside `supabase-admin-auth-identity-adapter.ts`; `admin_users` and `memberships` reads remain only inside `supabase-admin-profile-membership-adapters.ts`; workspace resolution remains only inside `server-admin-workspace-resolver.ts`; CSRF proof issuing and verification remain behind the Phase 2B-S and Phase 2B-R boundaries; and the Phase 2B-T gate must preserve preflight-before-decision ordering.

This phase is docs/checklist approval only. It does not implement real auth runtime wiring, read headers, add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud, deployment, real env values, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-29: Server-only Admin Request Metadata Adapter Boundary

Decision: Phase 2B-V adds only the server-only admin request metadata adapter boundary at `website/lib/admin/authorization/server-admin-request-metadata-adapter.ts`.

Reason: Phase 2B-U approved a future runtime lane that requires a reviewed place for reading real request headers before any route, page, or server action may use the Phase 2B-T gate. The narrow adapter lets future runtime code pass explicit method, Origin, Host, expected Origin, expected Host, request ID, and CSRF proof metadata into the gate without letting headers become identity, membership, workspace, provider, or authorization authority.

The adapter is the only newly approved production module in this phase that may import `next/headers` and call `headers()`. Trusted expected origin and expected host values must come from explicit dependency/config injection, not from untrusted request headers or env reads. Missing trusted expected origin or host fails closed. Header read failures and dependency throws return only safe unavailable shapes.

Phase 2B-V does not call `resolveServerAdminAuthorizationGate()`, the request-security preflight, the composed authorization decision, the CSRF verifier, the CSRF issuer, adapter-set composition, Supabase Auth, Supabase table reads, or product write logic. It does not add route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, service-role runtime paths, browser Supabase, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-30: Server-only Admin Runtime Gate Invocation Boundary

Decision: Phase 2B-W adds only the server-only admin runtime gate invocation boundary at `website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts`.

Reason: Phase 2B-V created the reviewed request metadata adapter and Phase 2B-T created the gate. Future admin routes, pages, or server actions need one narrow server-only invocation seam that composes those two approved boundaries without duplicating header reads, preflight, CSRF verification, role policy, membership policy, provider reads, or runtime implementation.

The helper calls the Phase 2B-V request metadata adapter, passes trusted expected origin and expected host only through explicit dependency/config injection, then invokes the Phase 2B-T gate with the explicit operation/workspace validation inputs plus configured metadata. Metadata failures or dependency throws return the existing safe gate unavailable shape.

Phase 2B-W does not import `next/headers`, call `headers()`, read cookies, read env, call Supabase Auth, query `admin_users` or `memberships`, resolve workspaces directly, compose adapter sets directly, call the decision boundary directly, call request-security preflight directly, issue or verify CSRF proofs directly, or add runtime route/page/server-action usage. It does not add login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, or `website/chat-config.js` access.

## 2026-05-30: Admin Runtime Gate Invocation Usage Approval Lane

Decision: Phase 2B-X adds only the admin runtime gate invocation usage approval lane for future use of `resolveServerAdminRuntimeGateInvocation()`.

Reason: Phase 2B-W created the reviewed server-only invocation helper, but runtime routes and server actions still need an explicit approval lane before any first-party runtime boundary may call it. This phase documents and guards that future lane without adding implementation.

The approved future lane is limited to first-party server-only route handlers or server actions. Future runtime usage must call only the Phase 2B-W invocation helper from the route/action boundary. Header reads remain inside the Phase 2B-V request metadata adapter; cookie reads and Supabase Auth calls remain inside the Phase 2B-K/N identity boundary; `admin_users` and `memberships` reads remain inside Phase 2B-L; workspace resolution remains inside Phase 2B-M; adapter-set composition remains inside Phase 2B-O; decision logic remains inside Phase 2B-P; request-security preflight remains inside Phase 2B-Q / Phase 2B-T gate; CSRF verification remains inside Phase 2B-R / Phase 2B-T gate; and CSRF issuance remains inside Phase 2B-S.

This phase is docs/checklist/static-guard approval only. It does not add route handlers, pages, server actions, runtime helper usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud, deployment, real env values, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Server-only Admin Runtime Route Gate Adapter Boundary

Decision: Phase 2B-Y adds only the server-only admin runtime route gate adapter boundary at `website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts`.

Reason: Phase 2B-X approved the future lane for first-party server-only route handlers or server actions to call the Phase 2B-W invocation helper. The next safe step is one reviewed server-only adapter seam that future runtime code can call without duplicating lower-level auth/security logic.

The adapter accepts explicit operation/workspace inputs, trusted expected origin and host dependencies, gate dependencies, and an explicit request method or method from a minimal request-like object. It passes the method into the Phase 2B-W invocation helper through request metadata dependencies and returns the existing safe gate result shape.

Phase 2B-Y does not read headers directly, read cookies, read env, import route/page/server-action code, call `readServerAdminRequestMetadata()` directly, call `resolveServerAdminAuthorizationGate()` directly, call preflight, decision, CSRF verifier, CSRF issuer, adapter-set composition, Supabase Auth, `admin_users`, `memberships`, or workspace resolver boundaries directly, add route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Supabase Storage, browser Supabase, service-role runtime paths, Supabase Cloud/deployment/env changes, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Admin Runtime Route Gate Adapter Usage Approval Lane

Decision: Phase 2B-Z adds only the admin runtime route gate adapter usage approval lane.

The future approved lane is limited to first-party server-only route handlers or server actions. Future runtime route/action code may call `resolveServerAdminRuntimeRouteGateAdapter()` only through the Phase 2B-Y route gate adapter and must not duplicate lower-level boundary logic.

Header reads remain inside Phase 2B-V, cookie reads and Supabase Auth calls remain inside Phase 2B-K/N, `admin_users` and `memberships` reads remain inside Phase 2B-L, workspace resolution remains inside Phase 2B-M, adapter-set composition remains inside Phase 2B-O, decision logic remains inside Phase 2B-P, request-security preflight remains inside Phase 2B-Q / Phase 2B-T, CSRF verification remains inside Phase 2B-R / Phase 2B-T, CSRF issuance remains inside Phase 2B-S, runtime gate invocation remains inside Phase 2B-W, and route gate adapter plumbing remains inside Phase 2B-Y.

Phase 2B-Z does not add route handlers, pages, server actions, runtime route gate adapter usage, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: First Admin Runtime Route Gate Adapter Usage Boundary

Decision: Phase 2B-AA adds the first admin runtime route gate adapter usage boundary at `website/app/api/admin/auth-check/route.ts`.

Reason: Phase 2B-Z approved the lane for route usage, and now the system needs a harmless authorization probe to verify the entire server-side authorization stack without modifying product data or exposing protected admin UI.

The route handler is a first-party server-only boundary that only calls the Phase 2B-Y route gate adapter. It does not import or call lower-level boundaries directly. Phase 2B-AA does not add login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.

## 2026-05-30: Admin CSRF Proof Issuer Runtime Usage Approval Lane

Decision: Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane for future use of `issueServerAdminCsrfProof()` from a first-party server-only CSRF proof issuer route.

Reason: Phase 2B-AA proved the route gate adapter can be used safely from exactly one harmless auth-check route. The next smallest safe step is to approve the future runtime lane for issuing CSRF proofs, because future state-changing admin routes will eventually require CSRF proof flow.

The approved future lane is limited to exactly one first-party server-only CSRF proof issuer route under `website/app/api/admin/**`. The future route must remain server-only and must not bypass the Phase 2B-Y/AA route-gate authorization path. The future route must not call lower-level auth/security boundaries directly except the approved Phase 2B-S CSRF issuer boundary and the Phase 2B-AI session/workspace binding boundary. The future route must not expose CSRF secrets, verifier internals, provider internals, raw headers, cookies, tokens, SQL/provider errors, workspace internals, membership internals, or stack traces. The future route must not approve product/category/product image writes by itself. The future route must not add login/logout, protected admin pages, or admin UI.

This phase is docs/checklist/static-guard approval only. It does not add routes, pages, server actions, login/logout routes, protected admin pages, admin UI, product/category/product image writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access.
Decision: Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary. It does not implement the actual CSRF proof issuer route.

## 2026-06-01: Admin CSRF Proof Issuer Session/Workspace Binding Boundary

Decision: Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary at `website/lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding.ts`.

Reason: Phase 2B-AH deferred the actual issuer route because existing approved boundaries could authorize a request and issue a signed proof, but did not yet provide a safe opaque session/workspace binding for proof payloads. The new boundary resolves the authenticated admin session, active admin profile, active owner/admin membership, and trusted workspace through existing server-only Phase 2B adapters before invoking an explicitly injected binding deriver.

This phase does not implement the actual CSRF proof issuer route, does not approve binding usage from routes/pages/server actions, and does not add product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Admin Auth Login Logout And Protected Shell

Decision: Phase 2B-AN adds a minimal first-party admin login/logout and
protected admin shell boundary.

Reason: The product-management API routes now exist, but operators still need
a first-party session entry point and a safe protected shell before any admin
product-management UI is built. The smallest safe step is a login page,
server-owned login/logout routes, and a protected shell that proves
owner/admin access while keeping product editing out of scope.

Login/logout use the existing server-only Supabase Auth boundary in
`supabase-admin-auth-identity-adapter.ts`. Cookie reads and session mutation
stay inside that boundary, and the routes return only generic
unauthenticated/unavailable redirects without exposing provider errors, SQL,
tokens, cookies, env values, or stack traces.

The protected shell uses the existing server-only route-gate path with the
new read-only `admin.shell.access` operation. Owner/admin memberships are
allowed, viewer memberships are denied, and the UI renders only safe states:
unauthenticated, authenticated but not authorised, authorised admin, and
unavailable/misconfigured.

Phase 2B-AN does not add product-management UI, product/category/product-image
write forms, server actions, binary uploads, Supabase Storage, browser
Supabase, service-role runtime paths, deployment config, Supabase Cloud,
n8n changes, Pinecone runtime code, SaaS chatbot work, or
`website/chat-config.js` access.

## 2026-06-02: Admin Read-only Product Dashboard Boundary

Decision: Phase 2B-AO adds a read-only admin product dashboard inside the protected admin shell.

Reason: PR #81 proved the first-party login/logout and protected admin shell
boundary. The next smallest safe operator surface is read-only catalogue
visibility for authorised owner/admin users before any product-management
write UI, upload flow, or server action exists.

The dashboard remains under the existing `admin.shell.access` page gate, which
allows owner/admin membership and denies viewer membership. After that gate
allows access, the dashboard uses a server-only session-bound authenticated
admin read client and trusted `ADMIN_TRUSTED_WORKSPACE_ID` configuration to
perform select-only RLS-scoped reads of `categories`, `products`, and
`product_images`. The UI renders only category/product summaries and product
image metadata counts or alt-text summaries. It does not expose workspace
internals, membership internals, SQL/provider errors, stack traces, cookies,
tokens, env values, storage paths, or secrets.

Phase 2B-AO does not add product/category/product-image create, edit, archive,
publish, upload, or delete controls; product write forms; server actions;
Supabase Storage; binary uploads; browser Supabase; service-role runtime
paths; deployment config; Supabase Cloud actions; n8n changes; Pinecone
runtime code; SaaS chatbot work; or `website/chat-config.js` access.

## 2026-06-01: Admin Product Persistence And Protected Write API Routes

Decision: Phase 2B-AL adds the first backend-only protected admin product-management write surface.

Reason: Phase 2B-AK made CSRF proof issuance available for state-changing admin operations. The next bounded step is to use the approved route-gate, CSRF, trusted workspace, session-bound Supabase, RLS, and audit boundaries for actual product/category/product-image metadata writes without adding UI, uploads, Storage, or service-role shortcuts.

The implementation adds session-bound product persistence under `website/lib/products/persistence/`, owner/admin RLS write policies and product-management audit inserts, and first-party admin API routes for category, product, and product-image metadata create/update/publish/archive operations. Route responses stay safe and no-store, and product image writes are metadata-only.

Phase 2B-AL does not add admin UI, login/logout routes, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin Product Write Audit Atomicity Boundary

Decision: Phase 2B-AM resolves the atomicity limitation from Phase 2B-AL by migrating product metadata mutations and audit insertions into a single Postgres RPC transaction block (`execute_admin_product_write`).

Reason: The initial protected admin API routes successfully gated persistence but allowed a state where a write could commit without an audit log if the second insert failed. By moving the mutation boundary into a single PL/pgSQL function with explicit static SQL branches per action, both operations happen within an atomic transaction. This also keeps the RPC type-aware, prevents dynamic SQL injection, securely resolves the actor ID via `current_product_admin_user_id()`, and hardens route methods to POST-only for all state changes.

Phase 2B-AM does not add admin UI, login/logout routes, protected admin pages, server actions, binary uploads, Supabase Storage, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin CSRF Proof Issuer Route Implementation

Decision: Phase 2B-AK adds only the first-party server-only admin CSRF proof issuer route at `website/app/api/admin/csrf-proof/route.ts`.

Reason: Phase 2B-AE added the dedicated `admin.csrf.issue` operation/preflight lane, Phase 2B-AI added the safe session/workspace binding boundary, and Phase 2B-AJ added the runtime deriver/signer dependencies. The next narrow implementation step is the actual proof issuer route that can issue proof material for future state-changing admin routes without making those write routes available yet.

The route accepts only `POST`, validates safe JSON body input, rejects missing, malformed, unsupported, and non-state-changing target operations, gates itself as `admin.csrf.issue`, resolves the requested target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime dependencies, and returns only `{ ok: true, csrfProof, expiresAt }` or `{ ok: false, error }`.

Phase 2B-AK does not add a replay store, product/category/product image write routes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-01: Admin CSRF Proof Session/Workspace Binding Runtime Dependency Boundary

Decision: Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary at `website/lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies.ts`.

Reason: Phase 2B-AI created the binding boundary but required an explicitly injected opaque deriver. The runtime dependency factory now supplies that deriver from canonical requested operation, auth user ID, admin user ID, trusted workspace ID, and membership role inputs using the existing server-only `ADMIN_CSRF_PROOF_SECRET` and Node crypto. The binding is deterministic for the same canonical input and secret, changes when any security-relevant input changes, and fails closed for missing secrets, malformed input, or crypto failures.

This phase does not implement the actual CSRF proof issuer route, does not approve binding usage from routes/pages/server actions, and does not add product/category/product image writes, admin UI, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Admin Category Management UI Boundary

Decision: Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell.

Reason: PR #82 added safe read-only catalogue visibility for authorised admins. The next smallest product-management write surface is category management only, using the already protected backend category routes rather than adding product/product-image UI, server actions, browser Supabase, service-role paths, uploads, Storage, deployment changes, or external workflow changes.

The browser component requests a CSRF proof for `category.write` from the first-party `/api/admin/csrf-proof` route, then calls only `POST /api/admin/categories`, `POST /api/admin/categories/[categoryId]`, or `POST /api/admin/categories/[categoryId]/archive` with `x-csrf-proof`. Route-gate, same-origin, CSRF proof, owner/admin membership, trusted workspace, RLS, audit, and atomic RPC boundaries remain server-side. UI success and failure messages stay generic and do not render raw CSRF proof values, provider errors, SQL, stack traces, cookies, tokens, env values, workspace internals, membership internals, or secrets.

Phase 2B-AP does not add product create/edit/archive/publish UI, product image write UI, binary uploads, Supabase Storage, server actions, browser Supabase, service-role runtime paths, deployment config, Supabase Cloud actions, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.

## 2026-06-02: Furniture Listing Catalogue Direction Pivot

Decision: Phase 2B-AQ pivots the current product direction to furniture/event-rental listings plus customer enquiries.

Reason: SpaceKonceptRental is not pursuing ecommerce carts, checkout, payments, customer accounts, stock reservation, order fulfilment, or online ordering as the near-term product direction. The useful near-term operator surface is an admin-managed listing catalogue where authorised admins can organise furniture/event-rental listings and customers can browse listings before submitting enquiry or quote requests.

Existing `products`, `categories`, `product_images`, product-management routes, RLS policies, RPCs, and server helper names remain technical internals for now. Renaming those database/API concepts is explicitly deferred to avoid risky churn and should happen only through a separately approved migration/compatibility plan.

Phase 2B-AQ does not add listing write UI, upload/storage implementation, public catalogue rebuilds, enquiry form implementation, SQL migrations, service-role runtime paths, browser Supabase, n8n changes, Pinecone runtime code, SaaS chatbot work, deployment config, or `website/chat-config.js` access.

## 2026-06-02: Admin Shell GET Origin Handling Fix

Decision: Phase 2B-AR repairs protected admin shell GET handling for normal
top-level browser navigations that omit the `Origin` header.

Reason: The admin shell uses the approved server-only route-gate path with
`admin.shell.access` and `requestMethod: "GET"`. Browser top-level navigation,
including a 303 GET after login, may omit Origin. The request-security
preflight previously required Origin before reaching the read-only method
branch, so legitimate admins could be denied before the authorization decision
ran.

Safe read-only admin operations may now pass preflight without Origin only when
the request Host matches the trusted expected host or the host derived from the
trusted expected Origin. If Origin is present, strict Origin/Host validation
still applies. `admin.csrf.issue` and state-changing admin writes still require
strict Origin/Host validation, POST, and the existing CSRF proof checks for
writes. Shell request-security denials map to generic unavailable UI copy.

Phase 2B-AR does not add listing CRUD UI, listing image upload/storage, public
catalogue redesign, enquiry form implementation, SQL migrations, browser
Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone
runtime code, SaaS chatbot work, or access `website/chat-config.js`.

## 2026-06-02: Admin Furniture Listing Management UI Boundary

Decision: Phase 2B-AS adds metadata-only furniture listing management controls
inside the existing protected admin shell.

Reason: Phase 2B-AQ confirmed the current direction as a furniture/event-rental
listing catalogue rather than ecommerce. The existing Phase 2B-AL/AM backend
routes already provide route-gated, CSRF-protected, RLS/audit-backed product
metadata mutations. The next narrow operator surface is a browser UI that uses
those existing routes without adding new backend write paths or renaming
technical internals.

The browser component requests a CSRF proof for `product.write`, then calls
only `POST /api/admin/products`, `POST /api/admin/products/[productId]`, and
`POST /api/admin/products/[productId]/archive` with `x-csrf-proof`. Create and
edit payloads use only `categoryId`, `slug`, `name`, `shortDescription`,
`description`, `rentalUnit`, `status`, and `sortOrder`. Publish and unpublish
use the update route with `status: "published"` or `status: "draft"`, and
archive uses the archive route rather than hard delete.

Phase 2B-AS does not add listing image upload, Supabase Storage, public
catalogue redesign, enquiry form implementation, DB/API/table/RPC/RLS renames,
SQL migrations, browser Supabase, service-role runtime paths, deployment
config, n8n changes, Pinecone runtime code, SaaS chatbot work, cart, checkout,
payments, customer accounts, stock reservation, order fulfilment, online
ordering, or access `website/chat-config.js`.

## 2026-06-03: Public Furniture Catalogue UX Polish

Decision: Phase 2B-AT adds only public-facing furniture/event-rental listing
UX and copy polish for the existing catalogue path.

Reason: the existing admin-managed listing management work in Phase 2B-AS
introduced listing metadata controls and required the public catalogue surfaces to
feel like a real furniture listing website. This phase updates listing copy,
CTA language, and no-data state handling while preserving existing read
paths and safe fallback behavior.

Phase 2B-AT does not add listing image upload or Supabase Storage, image
metadata admin UI, enquiry form implementation, DB/API/table/RPC/RLS renames,
SQL migrations, browser Supabase, service-role runtime paths, deployment
changes, n8n changes, Pinecone runtime code, SaaS chatbot work, cart,
checkout, payments, customer accounts, stock reservation, order fulfilment,
online ordering, or access `website/chat-config.js`.

## 2026-06-03: Public Events And Quote Copy Polish

Decision: Phase 2B-AU adds only public-facing events and quote-request copy
polish.

Reason: Phase 2B-AT made the catalogue and listing detail pages read like a
real furniture/event-rental website, but the public events route still exposed
shell/MVP wording. This phase completes the adjacent public copy pass by using
normal event-rental, furniture-rental, styled-setup, enquiry, and quote-request
language while keeping the existing quote form honest as a follow-up request.

Phase 2B-AU does not add enquiry form implementation beyond the existing quote
request form, cart, checkout, payment, customer account, stock reservation,
confirmed booking, order fulfilment, online ordering, admin changes, image
upload, Supabase Storage, SQL migrations, DB/API/table/RPC/RLS renames, browser
Supabase, service-role runtime paths, deployment changes, n8n changes, Pinecone
runtime code, SaaS chatbot work, or access `website/chat-config.js`.

## 2026-06-03: Admin Anti-framing Header Hardening

Decision: Phase 2B-AV adds narrow anti-framing headers for the protected admin
UI.

Reason: the protected `/admin` UI renders real admin write controls, including
category and listing management controls, but the app did not configure
anti-framing response headers. CSRF proof validation and Origin/Host checks
remain necessary and unchanged, but they do not stop a same-session user from
interacting with a framed first-party admin UI. SameSite=Lax auth cookies may
reduce arbitrary off-site exploitability, but anti-framing headers close the
missing browser-side defence.

The Next.js config applies only `Content-Security-Policy: frame-ancestors
'none'` and `X-Frame-Options: DENY` to `/admin` and nested admin UI routes.
It does not introduce a broad public-site CSP.

Phase 2B-AV does not change admin auth, CSRF, Origin/Host checks, Supabase SSR
cookies, admin UI behavior, product/category write route logic, SQL
migrations, DB/API/table/RPC/RLS names, browser Supabase, service-role runtime
paths, image upload, Supabase Storage, n8n/Pinecone runtime behavior, SaaS
chatbot runtime work, ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Quote Request Inbox Boundary

Decision: Phase 2B-AW adds a read-only admin quote request inbox inside the
protected admin shell.

Reason: public quote requests are already validated, rate-limited, and
persisted through the existing `/quote` form and `POST /api/quote` route.
Admins now need a bounded review surface for recent submitted enquiries
without adding quote workflow writes, notifications, CRM sync, ecommerce
ordering, or customer accounts.

The inbox uses a server-only admin quote read boundary with the existing
session-bound admin Supabase read client and trusted `ADMIN_TRUSTED_WORKSPACE_ID`.
It queries recent `quote_requests` newest first, includes matching
`quote_request_items` when available, scopes every read to the trusted
workspace, and maps provider failures to generic unavailable UI.

Phase 2B-AW does not add public quote request lists, quote status writes,
notifications, CRM integration, customer accounts, ordering, checkout,
payments, fulfilment, stock reservation, confirmed booking, SQL migrations,
DB/API/table/RPC/RLS renames, browser Supabase, service-role runtime paths,
image upload, Supabase Storage, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Quote Request Status Update Boundary

Decision: Phase 2B-AX adds only admin quote request status updates from the
protected admin quote request inbox.

Reason: Phase 2B-AW gave authorised admins a read-only quote request inbox.
The next narrow operations step is to let owner/admin users move an existing
quote request through the already-defined internal status values without
adding customer-facing quote tracking, notifications, CRM sync, ecommerce
ordering, or broader workflow management.

The implementation introduces the quote-specific `quote.write` admin
operation instead of reusing product/category operations. Owner/admin
memberships are allowed, viewer memberships are denied, and the CSRF proof
issuer can issue operation-bound proofs for `quote.write`. The protected
route accepts only `POST` with a bounded `{ status }` JSON payload, validates
the quote request ID and allowed status, requires same-origin and
`x-csrf-proof` checks, resolves the trusted admin workspace, and updates only
`quote_requests.status`.

Phase 2B-AX does not add public quote status pages, customer-facing quote
tracking, notifications, CRM integration, internal notes, assignment,
customer accounts, cart, checkout, payments, stock reservation, fulfilment,
confirmed booking, online ordering, image upload, Supabase Storage, SQL
migrations, DB/API/table/RPC/RLS renames, browser Supabase, service-role
runtime paths, n8n/Pinecone runtime behavior, SaaS chatbot runtime work,
ecommerce flows, or access `website/chat-config.js`.

## 2026-06-03: Admin Listing Image Metadata UI Boundary

Decision: Phase 2B-AY adds only metadata listing image management controls
inside the protected admin shell.

Reason: Phase 2B-AL/AM already added protected backend product-image metadata
routes, and Phase 2B-AS added listing metadata controls while leaving image
management UI out of scope. The next narrow admin step is to reuse the
existing `productImage.write` route/CSRF boundary for image metadata records
without adding file handling or Supabase Storage.

The implementation extends the existing server-only admin dashboard read
boundary to include editable image metadata rows scoped to
`ADMIN_TRUSTED_WORKSPACE_ID`. The browser component is visible only after the
protected admin shell has loaded authorised dashboard data. It requests a
first-party CSRF proof for `productImage.write`, posts only approved JSON
metadata fields to `POST /api/admin/product-images` and
`POST /api/admin/product-images/[imageId]`, and archives through
`POST /api/admin/product-images/[imageId]/archive`. Failures render only
generic admin-safe copy.

Phase 2B-AY does not add binary image upload, file inputs,
multipart/form-data, Supabase Storage bucket creation or API calls, public
image upload routes, public image management routes, DB/API/table/RPC/RLS
renames, SQL migrations, browser Supabase, service-role runtime paths,
notifications, CRM integration, n8n/Pinecone runtime behavior, SaaS chatbot
runtime work, ecommerce flows including cart, checkout, payments, customer
accounts, stock reservation, fulfilment, confirmed booking, online ordering,
or access `website/chat-config.js`.

## 2026-06-03: Storage-backed Listing Media Upload And Public Rendering

Decision: Phase 2C-A approves admin-controlled listing media upload and public
image rendering.

Reason: Phase 2B-AY gave authorised admins metadata-only listing image
management. The next coherent product capability is to let those same
owner/admin users upload actual listing media through the protected admin
boundary and let public catalogue/detail pages render the resulting media
without adding ecommerce, customer uploads, or unsafe Supabase shortcuts.

The implementation uses the existing `POST /api/admin/product-images` route:
JSON requests still create metadata through the existing route helper, while
multipart requests enter a server-only upload branch. That branch requires
`productImage.write`, same-origin Origin/Host validation, a valid CSRF proof,
trusted workspace resolution, target listing validation, approved MIME types,
a 5 MB size limit, safe filenames, and server-generated
`workspaceId/productId/timestamp-randomId.ext` paths in the public
`listing-media` bucket. Metadata is created through the existing
`product_images` persistence contract after upload, and the route attempts to
remove the object if metadata persistence fails. Because `listing-media` is a
public bucket, object serving is public to anyone with the unguessable
server-generated URL; RLS is used for write/delete scope, not as a public URL
serving gate. Public catalogue reads derive and render image URLs only from
active published listing metadata and render fallbacks when media is absent.

Phase 2C-A does not add customer uploads, arbitrary public upload routes,
quote status public tracking, notifications, CRM integration, DB/API/table/RPC
or RLS renames, browser Supabase, service-role runtime paths, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, ecommerce flows including cart,
checkout, payments, customer accounts, stock reservation, fulfilment,
confirmed booking, online ordering, or access `website/chat-config.js`.

## 2026-06-03: Public Catalogue Polish And Enquiry Handoff

Decision: Phase 2C-B improves public catalogue/detail presentation and quote
enquiry handoff using existing public read surfaces.

Reason: Phase 2C-A made real admin-uploaded listing media available for public
rendering. The next coherent public capability is to make catalogue cards and
listing detail pages feel production-ready for furniture/event rentals and help
customers start a quote request from the listing they were browsing without
adding ecommerce behavior.

The implementation keeps public catalogue/detail pages read-only, improves
stable uploaded-image and fallback presentation, adds safe catalogue/detail
metadata, and passes only an optional public listing slug into `/quote`. The
quote page treats that query value as untrusted until it resolves through the
existing public catalogue read surface, then uses the resolved public listing
only as customer-facing context and as the initial text for the existing quote
items field. The quote backend contract is unchanged.

Phase 2C-B does not add customer uploads, arbitrary public upload routes,
public quote status tracking, notifications, CRM integration, DB/API/table/RPC
or RLS renames, browser Supabase, service-role runtime paths, n8n/Pinecone
runtime behavior, SaaS chatbot runtime work, ecommerce flows including cart,
checkout, payments, customer accounts, stock reservation, fulfilment,
confirmed booking, online ordering, or access `website/chat-config.js`.

## 2026-06-03: Admin Quote Operations And Enquiry Workflow Closeout

Decision: Phase 2C-C adds internal admin quote follow-up activity while
keeping public quote requests enquiry-oriented.

Reason: Phase 2B-AW/AX gave authorised admins a quote inbox and a narrow
status update boundary, while Phase 2C-B improved the public handoff into the
quote request flow. The next coherent operations step is to let the internal
team record lightweight follow-up context and see recent quote activity
without adding public status tracking, notifications, CRM sync, or ecommerce
ordering.

The implementation adds an admin-only `quote_request_activity` table for
bounded internal notes and status-change activity. Owner/admin RLS policies
allow only authenticated quote managers for the workspace to update quote
status and insert/select activity. The existing protected status route remains
first-party and server-only, requires `quote.write`, same-origin Origin/Host
validation, CSRF proof verification, trusted workspace resolution, and a
session-bound authenticated Supabase client. Public quote pages and APIs are
unchanged and do not expose internal notes or quote workflow status.

Phase 2C-C does not add public quote status tracking, customer-visible
internal notes, notifications, CRM integration, customer uploads, arbitrary
public upload routes, DB/API/RPC/table renames, browser Supabase,
service-role runtime paths, deployment config, Supabase Cloud actions,
n8n/Pinecone runtime behavior, SaaS chatbot runtime work, ecommerce flows
including cart, checkout, payments, customer accounts, stock reservation,
fulfilment, confirmed booking, online ordering, or access
`website/chat-config.js`.

## 2026-06-03: Quote Workflow Atomicity And Admin Operations Hardening

Decision: Phase 2C-D replaces the admin quote status/activity multi-call write
path with a single atomic database function.

Reason: Phase 2C-C added internal quote activity, but the application wrote
the status update and activity rows through separate Supabase client calls.
That could allow partial persistence if one call succeeded and a later call
failed. The hardened boundary makes quote workflow status and internal
activity persist together or not at all.

The implementation adds `execute_admin_quote_workflow`, a narrow
security-definer database function granted only to authenticated callers. It
validates the current authenticated owner/admin actor for the trusted
workspace, locks the target quote request, updates only `status` and
`updated_at`, inserts status-change activity only when the status actually
changes, and inserts bounded internal-note activity only when a non-blank note
is supplied. Direct authenticated table grants for quote workflow updates and
activity inserts are revoked or narrowed, while admin activity reads remain
RLS-scoped. The server-only application persistence now calls this RPC once
through the existing session-bound authenticated Supabase client.

Phase 2C-D does not add public quote status tracking, customer-visible
internal notes, notifications, CRM integration, customer uploads, arbitrary
public upload routes, browser Supabase, service-role runtime paths,
deployment config, Supabase Cloud actions, n8n/Pinecone runtime behavior,
SaaS chatbot runtime work, ecommerce flows including cart, checkout,
payments, customer accounts, stock reservation, fulfilment, confirmed
booking, online ordering, or access `website/chat-config.js`.

## 2026-06-04: Deployment Readiness For Catalogue Media And Quote Workflow Operations

Decision: Phase 2D-A refreshes deployment readiness for catalogue media and quote workflow operations without deploying.

Reason: the app now has admin-managed furniture/event-rental listings,
storage-backed listing media rendering, protected admin listing image upload,
public quote handoff, and an atomic admin quote workflow RPC. Before any real
deployment, Supabase Cloud wiring, Vercel configuration, production env setup,
or public traffic, operators need a reviewed environment contract,
smoke-test sequence, rollback/disable plan, and evidence template that covers
those current surfaces.

The readiness contract classifies public-safe, server-only app,
Supabase/project, n8n/server-only webhook, admin/auth/workspace, and forbidden
environment exposure categories. Future operators must review
`CATALOGUE_WORKSPACE_ID`, `QUOTE_WORKSPACE_ID`, and
`ADMIN_TRUSTED_WORKSPACE_ID` before public traffic. The `listing-media` bucket
model remains public object serving by unguessable server-generated URL, while
public catalogue rendering remains metadata-gated by trusted public read
surfaces.

Phase 2D-A does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, change
runtime env behaviour, add browser Supabase, add service-role runtime paths,
add customer uploads, add arbitrary public upload routes, add public quote
status tracking, add customer-visible internal notes, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add ecommerce flows, or access `website/chat-config.js`.

## 2026-06-04: Post-readiness Status And Evidence Guard Reconciliation

Decision: Phase 2D-B reconciles post-Phase 2D-A status, remaining-work mapping,
deployment evidence expectations, and static guard coverage without adding
runtime changes.

Reason: PR #97 merged the deployment readiness package, so the quick status
page must now record Phase 2D-A as the latest completed capability. The repo
also needs the remaining work separated into completed, safe next,
approval-blocked, and too-broad tracks so future work does not accidentally
bundle real deployment, privacy governance, or unrelated runtime expansion.
Finally, stale blocker wording must distinguish the completed
admin-controlled `listing-media` upload boundary from still-blocked
customer uploads, arbitrary public upload routes, and storage usage outside
that approved workflow.

Phase 2D-B does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, change
runtime env behaviour, add browser Supabase, add service-role runtime paths,
add customer uploads, add arbitrary public upload routes, add public quote
status tracking, add customer-visible internal notes, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add ecommerce flows, or access `website/chat-config.js`.

## 2026-06-04: Conversation Privacy Retention And Identity Governance

Decision: Phase 2E-A documents conversation privacy, retention, identity, and transcript governance before future persistence work.

Reason: Conversation and message records are privacy-sensitive. The next safe
bundle after PR #98 is to decide the governance model before any migration,
write path, transcript read path, admin UI, customer account, public quote
tracking, notification, CRM, n8n/Pinecone runtime, SaaS chatbot runtime, or
deployment work can accidentally treat transcript storage as already approved.

The governance model documents PII minimisation, anonymous visitor identity,
future authenticated/admin-linked identity considerations, retention rules,
deletion/export expectations, transcript access rules, admin visibility
boundaries, future persistence idempotency expectations, and redaction
guidance.

Phase 2E-A does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, add
conversation/message persistence, add transcript storage, add transcript
reads, add admin transcript UI, approve customer accounts, approve public quote
tracking, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add browser Supabase, add
service-role runtime paths, add ecommerce flows, or access
`website/chat-config.js`.

## 2026-06-04: Conversation Message Schema And RLS Foundation

Decision: Phase 2E-B adds only the conversation/message schema and RLS foundation.

Reason: PR #99 completed the privacy, retention, identity, and transcript
governance prerequisites. The next safe bundle is to harden the existing
`conversations` and `messages` tables locally before any runtime write or read
path can treat transcript persistence as available. This keeps the database
shape, constraints, and deny-by-default RLS proof separate from chat provider
wiring, admin transcript access, customer accounts, public quote tracking,
notifications, CRM, deployment, and chatbot runtime changes.

The implementation keeps the existing table names, adds only additive
metadata, retention, deletion marker, ordering, message-type, content-size, and
metadata-safety constraints, and changes direct conversation/message RLS to
fail closed for anonymous/public and authenticated client roles.

Phase 2E-B does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, add
runtime transcript writes, add runtime transcript reads, add admin transcript
UI, approve customer accounts, approve public quote tracking, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
SaaS chatbot runtime work, add browser Supabase, add service-role runtime
paths, add ecommerce flows, or access `website/chat-config.js`.

## 2026-06-04: Server-only Transcript Persistence Contract And Validation Boundary

Decision: Phase 2E-C adds only the server-only transcript persistence contract and validation boundary.

Reason: PR #100 completed the conversation/message schema and fail-closed RLS
foundation. The next safe bundle is a TypeScript contract layer that defines
future persistence command shapes and rejects unsafe inputs before any runtime
chat route can treat transcript storage as available.

The implementation defines conversation persistence commands, message
persistence commands, batch transcript persistence commands, safe
persisted/unavailable/rejected result shapes, and an injected adapter
dependency shape. It adds pure validation and minimisation helpers for trusted
workspace IDs, server-generated conversation/message IDs, message role/type
pairs, bounded content, bounded metadata, unsafe metadata keys, anonymous
session-hash correlation, and `clientMessageId` idempotency/deduplication. The
tests use fake/injected adapters only.

Phase 2E-C does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, wire
runtime transcript writes into `/api/chat`, add runtime transcript reads, add
admin transcript UI, approve customer accounts, approve public quote tracking,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add browser Supabase, add service-role runtime
paths, add ecommerce flows, or access `website/chat-config.js`.

## 2026-06-04: Server-only Transcript Persistence RPC/Adapter Boundary

Decision: Phase 2E-D adds only the server-only transcript persistence RPC/adapter boundary.

Reason: PR #101 completed the server-only transcript persistence contract and
validation boundary at merge commit
`cfc48f132e170121e1eb90f6b1af4c60762a7227`. The next safe bundle is a local
database/RPC and adapter boundary that can be tested without making transcript
persistence available to `/api/chat` or browser roles.

The implementation adds an ungranted local `persist_transcript_batch` SQL/RPC
contract for validated trusted-workspace conversation/message batches, repeats
safe metadata checks at the database edge, preserves retention fields,
preserves anonymous session hashes only as correlation, and preserves
`clientMessageId` as idempotency/deduplication only. It also adds a server-only
TypeScript adapter that maps the Phase 2E-C command into an injected RPC
executor payload. The default persistence adapter remains unavailable.

Phase 2E-D does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, wire
runtime transcript writes into `/api/chat`, add runtime transcript reads, add
admin transcript UI, approve customer accounts, approve public quote tracking,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add browser Supabase, add service-role runtime
paths, add ecommerce flows, or access `website/chat-config.js`.

## 2026-06-04: Phase 2E-D Hotfix And Transcript Activation Governance

Decision: Phase 2E-D hotfixes conflicting clientMessageId reuse and malformed runtime validation, and Phase 2E-E adds transcript persistence activation governance and executor approval gates only.

Reason: PR #102 merged at `b34cc02a67e73d497e9b90fd904786da3bbe77d3` and
completed the server-only transcript persistence RPC/adapter boundary. Follow-up
review found two bounded fixes needed before activation governance: reused
`clientMessageId` values with changed payloads must not silently return the old
message row, and transcript command validation must not throw when malformed
JSON-like runtime input reaches the helper boundary.

The hotfix keeps the database uniqueness constraint as the concurrency arbiter
for `(workspace_id, conversation_id, client_message_id)`. Exact duplicate
retries return the original message ID only when role, message type, content,
provider, request ID, sequence number, retention expiry, and metadata match.
Conflicting reused `clientMessageId` payloads reject with
`transcript_client_message_id_conflict`. The fingerprint excludes `id` because
a future server-side executor may regenerate server-owned message IDs while
replaying the same client idempotency key.

The TypeScript transcript persistence contract now safely rejects malformed
runtime input, including non-object top-level payloads, missing/null
conversation objects, missing/non-array messages, null message elements,
non-string IDs, non-string role/content/provider/client message/request IDs,
invalid retention timestamps, and malformed metadata. `persistTranscriptCommand`
returns safe rejected or unavailable result shapes and does not leak validation
exceptions.

Phase 2E-E records that the Phase 2E-D RPC remains ungranted to browser roles,
the TypeScript adapter requires an injected executor, and no live executor
exists yet. A future live executor requires explicit owner approval, a reviewed
privilege model, no service-role material in browser/client code, failure
redaction, idempotency proof, audit/evidence requirements, rollback/disable
controls, and tests before `/api/chat` can use it.

Explicit approval remains required before any Live Supabase RPC executor, Any
service-role or privileged DB execution strategy, `/api/chat` transcript write
wiring, Transcript read paths, Admin transcript UI, Transcript
deletion/export paths, Retention cleanup jobs, Customer identity/account
linking, Public quote tracking or public transcript access, Notifications or
CRM integration.

This phase does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, add a
live Supabase RPC executor, add service-role runtime paths, wire runtime
transcript writes into `/api/chat`, add runtime transcript reads, add admin
transcript UI, approve customer accounts, approve public quote tracking, add
notifications or CRM integration, change n8n/Pinecone runtime behavior, add
SaaS chatbot runtime work, add browser Supabase, add ecommerce flows, or access
`website/chat-config.js`.

## 2026-06-04: Transcript Lifecycle Governance And Retention/Deletion/Export Readiness

Decision: Phase 2E-F adds transcript lifecycle governance and retention/deletion/export readiness only.

Reason: PR #103 merged at `72a85eedfcd30da26e716f95973785cb1408760b` and
completed the Phase 2E-D hotfix plus Phase 2E-E activation governance baseline.
The next safe step is to record lifecycle governance before any runtime
deletion/export, retention cleanup, transcript read, admin transcript UI,
customer account, public quote tracking, notification, CRM, n8n/Pinecone,
SaaS chatbot, deployment, or service-role path treats transcript storage as
operationally ready.

Phase 2E-F documents future requirements for transcript retention policy,
retention expiry handling, manual deletion requests, export requests,
admin-only transcript access review, audit/evidence requirements, operator
runbook requirements, failure/rollback/disable controls, data minimisation and
redaction requirements, customer identity/account linking risks, and public
quote tracking/public transcript access risks.

Explicit approval remains required before Runtime transcript writes, Runtime
transcript reads, Live Supabase RPC executor, Any service-role or privileged DB
execution strategy, `/api/chat` transcript write wiring, Transcript
deletion/export runtime paths, Retention cleanup jobs, Admin transcript UI,
Customer accounts, Public quote tracking or public transcript access,
Notifications, CRM integration, n8n/Pinecone runtime changes, SaaS chatbot
runtime work, Deployment, Vercel config, Supabase Cloud config, env/secrets,
production evidence, browser Supabase, service-role runtime paths, or
`website/chat-config.js` access.

This phase does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, add
runtime transcript writes, add runtime transcript reads, add a live Supabase
RPC executor, add service-role runtime paths, wire transcript writes or reads
into `/api/chat`, add transcript deletion/export runtime paths, add retention
cleanup jobs, add admin transcript UI, approve customer accounts, approve
public quote tracking or public transcript access, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add browser Supabase, add ecommerce flows, or access
`website/chat-config.js`.

## 2026-06-04: Transcript Audit Evidence Model And Operator Runbook Readiness

Decision: Phase 2E-G adds transcript audit/evidence model and operator runbook readiness only.

Reason: PR #104 merged at `49bb60131af99a0a3829a536eb5d29575218a442` and
completed Phase 2E-F transcript lifecycle governance and
retention/deletion/export readiness. The next safe step is to define the
future audit/evidence and operator-readiness model before any lifecycle action,
audit writer, production evidence artifact, transcript read, deletion/export,
retention cleanup, `/api/chat` persistence wiring, live executor, or
service-role path treats transcript storage as operational.

Phase 2E-G documents future audit events for transcript persistence attempts,
transcript access/read, transcript export requests, transcript deletion
requests, retention expiry processing, retention cleanup failure, admin
override, lifecycle disable/rollback, operator approval, and evidence capture.
It defines future approved field categories for `event_type`, `workspace_id`,
approved `conversation_id`, approved `quote_request_id`, `actor_type`,
approved `actor_admin_user_id`, `request_id`, `approval_reference`,
`reason_code`, `result_status`, `affected_record_count`, `created_at`, and
minimal redacted metadata.

Phase 2E-G also forbids copying full transcript content, raw provider
payloads, n8n workflow payloads, webhook URLs, raw headers, cookies, tokens,
API keys, private keys, secrets, service-role material, or customer-visible
internal notes into audit/evidence records or artifacts. Future operator
runbooks must cover owner approval capture, dry-run/local proof, local SQL/RLS
proof, static guard proof, evidence template completion, failure triage,
rollback/disable steps, audit review, data minimisation review, redaction
review, post-action verification, and "Do not proceed" stop conditions.
Future evidence templates remain placeholder-only and must explicitly state
that no secrets or transcript content are copied into evidence.

Explicit approval remains required before any audit/evidence runtime writer,
audit/evidence storage or tables, production evidence file or artifact,
runtime transcript writes, runtime transcript reads, live Supabase RPC
executor, service-role or privileged DB execution strategy, `/api/chat`
transcript write wiring, transcript deletion/export runtime paths, retention
cleanup jobs, admin transcript UI, customer accounts, public quote tracking or
public transcript access, notifications, CRM integration, n8n/Pinecone runtime
changes, SaaS chatbot runtime work, deployment, Vercel config, Supabase Cloud
config, env/secrets, production evidence, browser Supabase, service-role
runtime paths, or `website/chat-config.js` access.

This phase does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, add
runtime transcript writes, add runtime transcript reads, add a live Supabase
RPC executor, add service-role runtime paths, wire transcript writes or reads
into `/api/chat`, add transcript deletion/export runtime paths, add retention
cleanup jobs, add audit/evidence storage, add an audit/evidence runtime
writer, add production evidence files, add admin transcript UI, approve
customer accounts, approve public quote tracking or public transcript access,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add browser Supabase, add ecommerce flows, or
access `website/chat-config.js`.

## 2026-06-04: Transcript Audit Evidence Local Schema And Contract Foundation

Decision: Phase 2E-H adds transcript audit/evidence local schema, RLS, and server-only contract foundation only.

Reason: PR #105 merged at `a59547130c33ec56e275dfdee48ceac9a1f8587f` and
completed Phase 2E-G transcript audit/evidence model and operator runbook
readiness. The next safe step is a local, fail-closed schema/RLS and
server-only contract foundation that can be tested without making
audit/evidence capture available to runtime routes, browser roles, a live
executor, or operators.

The implementation adds local `transcript_audit_events` and
`transcript_evidence_records` tables. They are workspace-scoped, RLS-enabled,
ungranted to anonymous/public and authenticated browser roles, policy-free,
and constrained to safe audit event/result/actor/evidence values, non-negative
affected counts, same-workspace relationships, bounded redacted metadata, and
placeholder-only evidence summaries.
Phase 2E-H also tightens the shared recursive
`public.is_safe_transcript_metadata` helper used by the existing transcript
persistence RPC so Phase 2E-H forbidden audit/evidence key classes are
rejected by local SQL constraints.

The implementation also adds `website/lib/chat/audit/` as a server-only
TypeScript contract. It builds safe audit event and evidence commands from
explicit inputs, rejects malformed or unsafe payloads, rejects attempts to pass
full transcript content, raw provider payloads, tokens, API keys, private
keys, secrets, or service-role material, returns safe rejected/unavailable
results, and records only through an injected adapter. The default adapter
remains disabled.

Phase 2E-H does not deploy, add Vercel project config, connect Supabase Cloud,
add production env files, add real secrets, add production seed data, wire
`/api/chat`, add runtime transcript writes, add runtime transcript reads, add
audit/evidence runtime writers, add transcript deletion/export runtime paths,
add retention cleanup jobs, add a live Supabase RPC executor, add service-role
runtime paths, add browser Supabase, add admin transcript UI, add production
evidence, approve customer accounts, approve public quote tracking or public
transcript access, add notifications or CRM integration, change n8n/Pinecone
runtime behavior, add SaaS chatbot runtime work, add ecommerce flows, or
access `website/chat-config.js`.

## 2026-06-05: Transcript Audit Evidence Server-Only Insert Boundary

Decision: Phase 2E-I adds a server-only local/test-only insert boundary for transcript audit/evidence rows.

Reason: PR #106 merged at `8607e16d3c405df0797ec08536cce79f1b4f68d2` and
completed Phase 2E-H transcript audit/evidence local schema, RLS, and
server-only contract foundation. The next safe step is to define a local
insert RPC and injected TypeScript adapter boundary for already validated
audit/evidence rows without approving any runtime writer, live executor, admin
UI, transcript read path, deletion/export path, or retention job.

The implementation adds local `insert_transcript_audit_event` and
`insert_transcript_evidence_record` RPC contracts. They validate trusted
workspace scope, same-workspace conversation/quote/audit relationships,
active actor workspace membership when an admin actor is supplied, recursive
safe metadata, and placeholder-only evidence summary text before inserting
rows into the Phase 2E-H tables. Both functions are explicitly revoked from
public, anon, and authenticated roles, and no browser table grants are added.

The implementation also adds a server-only TypeScript RPC adapter under
`website/lib/chat/audit/`. It maps validated audit/evidence commands into an
injected executor payload only, keeps the default adapter disabled, returns
safe non-leaking unavailable results for executor failures, and does not
instantiate Supabase, read env, read cookies or headers, call `.rpc`, use
browser Supabase, or read `website/chat-config.js`.

Phase 2E-I does not wire `/api/chat`, add admin UI, add transcript
deletion/export runtime paths, add retention cleanup jobs, add live Supabase
service-role execution, add browser grants, add browser Supabase, add
production evidence, change n8n/Pinecone runtime behavior, add SaaS chatbot
runtime work, deploy, change Vercel or Supabase Cloud config, add ecommerce
flows, or access `website/chat-config.js`. Product wording remains
enquiry/quote/request.

## 2026-06-05: Admin Rental Listing Media Foundation

Decision: Phase 2F-A adds a server-only listing-facing admin domain foundation.

Reason: PR #107 merged Phase 2E-I at
`0f114c3085917f80afab2a5a2b8d30d90596b66f` and completed the transcript
audit/evidence insert boundary without wiring runtime transcript paths. The
next useful product-direction step is to move back to admin-managed
rental/event furniture listings while avoiding a risky rename of the existing
database and API internals.

The implementation adds `website/lib/listings/admin/` as a server-only
listing/enquiry/quote/request oriented contract. It validates rental listing
metadata and listing image metadata, rejects ecommerce, upload-file, and
customer-visible internal-note payload classes, and maps validated commands
into an explicitly injected `ProductPersistence` boundary. Existing
`products`, `categories`, and `product_images` names remain legacy technical
internals for this phase.

Phase 2F-A does not add a Supabase migration, new runtime route, public or
customer upload route, arbitrary upload endpoint, live Supabase executor,
browser Supabase, service-role runtime path, admin transcript UI, `/api/chat`
transcript wiring, transcript deletion/export/retention runtime path, customer
account, public quote tracking, customer-visible internal notes,
notifications, CRM integration, deployment, Vercel or Supabase Cloud config,
real env values, production evidence, or ecommerce flows such as carts,
checkout, payments, stock reservation, order fulfilment, confirmed booking, or
online ordering.

## 2026-06-05: RAG Search-Index Architecture And Sync Governance

Decision: Phase 2G-A defines future-safe RAG/search-index architecture and sync governance.

Reason: PR #108 merged Phase 2F-A at
`8385ac2d925b5edd44cdf016707bb2cd00d67264` and completed the server-only
admin rental listing/media foundation. The next safe RAG step is to document
how listing data can later become searchable without treating Pinecone or any
retrieval provider as canonical business storage.

Supabase/listing data remains canonical for website/admin listing data,
quote/enquiry request workflows, workspace ownership, and admin audit trails.
Pinecone is a future derived search index only. Future listing/category/image
changes should enqueue search-index work through a durable outbox/worker
pattern instead of calling Pinecone directly from admin save paths.

Future sync must render public-safe searchable text from canonical Supabase
records, compute stable IDs and `content_hash`, skip unchanged records, upsert
changed records, delete or mark invisible archived/unpublished/deleted public
sources, and record success/failure/retry state. Future sync must be
idempotent, retryable, auditable, replayable, and must not block admin listing
writes when Pinecone or network dependencies fail.

Future retrieval must be server-only, separately approved, filtered by
workspace, visibility, status, source type, category, and event/listing type
where available, and limited to public-safe visibility such as `public_chat`
for public chatbot answers. Reranking is planned as a future retrieval quality
layer. Hybrid search remains a later decision gate if exact term recall is
weak.

Phase 2G-A does not add Pinecone runtime code, Pinecone package dependencies,
Pinecone env reads, secrets, API keys, n8n workflow/runtime changes,
embedding runtime, search-index tables, sync workers, `/api/chat` retrieval
wiring, admin UI changes, real data ingestion, real vector upsert/delete,
runtime reranking, hybrid search runtime, public/customer uploads, customer
accounts, public quote tracking, customer-visible internal notes,
notifications, CRM integration, deployment, Vercel or Supabase Cloud config,
browser Supabase, service-role runtime paths, transcript runtime paths, or
ecommerce flows.

## 2026-06-05: Transcript Metadata Diagnostic Denylist Hotfix

Decision: Add a metadata diagnostic denylist hotfix after Phase 2G-A.

Reason: PR #109 merged Phase 2G-A at
`02a16bdfd938841ddeac408f4d204d455050f714`. Phase 2E-D originally rejected
provider debug and trace dump diagnostic metadata keys, but the Phase 2E-H
shared helper rewrite accidentally dropped those two denylist classes. The
hotfix restores provider debug and trace dump key rejection in the final shared
SQL transcript metadata helper and the TypeScript audit/evidence contract.

The hotfix preserves Phase 2E-H and Phase 2E-I hardening for transcript
content, provider payloads, webhooks, headers, tokens, credentials, private
keys, secrets, API keys, service-role material, and customer-visible internal
notes. It adds no transcript runtime writes or reads, no live Supabase
executor, no admin transcript UI, no Pinecone/n8n runtime changes, no
customer/public quote tracking functionality, and no ecommerce functionality.

## 2026-06-05: Local Search-Index Outbox Foundation

Decision: Phase 2G-B adds local search-index outbox and document tracking tables only.

Reason: PR #110 merged the transcript metadata diagnostic denylist hotfix at
`608e53892964c172b64286a554ee202c8d1147d8`. After Phase 2G-A defined the
RAG/search-index architecture, the next safe implementation step is a
local-only Supabase foundation that can support future reviewed sync jobs
without adding external index runtime behavior.

Phase 2G-B adds `search_index_jobs` and `search_index_documents` as local
queue/document tracking tables with workspace scope, safe source type,
visibility, operation, and status checks, bounded redacted metadata, active-job
idempotency, source lookup indexes, fail-closed RLS, no browser grants, and no
public policies. It also adds a server-only TypeScript contract boundary whose
default adapter is disabled and whose tests use injected fakes only.

Supabase/listing data remains canonical for website/admin listing data,
quote/enquiry workflows, workspace ownership, and admin audit trails.
Search-index tables are local queue/document tracking foundations only.
Pinecone remains a future derived search index only.

Phase 2G-B adds no Pinecone runtime code, Pinecone package dependencies,
Pinecone env reads, Pinecone executor, API keys, n8n workflow/runtime changes,
embedding runtime, sync worker, `/api/chat` retrieval wiring, admin UI, real
data ingestion, real vector upsert/delete, runtime reranking, hybrid search
runtime, public/customer upload route, customer account, public quote
tracking, customer-visible internal notes, notification, CRM integration,
deployment, Vercel or Supabase Cloud config, browser Supabase, service-role
runtime path, transcript runtime path, or ecommerce flow.

Future sync worker, retrieval, reranking, and hybrid runtime work requires
explicit owner approval in a separate phase.

## 2026-06-05: Server-Only Local Search-Index Enqueue Integration

Decision: Phase 2G-C/D adds server-only local search-index enqueue integration only.

Reason: PR #111 merged Phase 2G-B local search-index outbox foundation at
`f73c7c5515d3e5242975280b25edf28cbc25f96b`. The next safe step is to allow
approved admin listing/category/image metadata writes to enqueue local outbox
jobs while keeping Supabase/listing data canonical and external search runtime
work deferred.

The implementation adds a narrow authenticated `enqueue_search_index_job` RPC
that validates owner/admin workspace access, safe source/visibility/operation
values, queued-only status, idempotency, and bounded safe metadata before
inserting into `search_index_jobs`. Direct search-index table grants remain
fail-closed for browser roles, and `search_index_documents` remains a future
derived document tracking table with no writer in this phase.

Existing admin product-write RPC mutations now enqueue local search-index jobs
for listing, category, and listing image alt-text sources after successful
database writes. The TypeScript boundary adds a server-only Supabase enqueue
adapter and pure safe job builders only. Search-index job cleanup policy
remains future-reviewed; referenced jobs are restricted rather than silently
detached.

Phase 2G-C/D adds no Pinecone runtime code, Pinecone package dependencies,
Pinecone env reads, Pinecone executor, API keys, n8n workflow/runtime changes,
embedding runtime, sync worker, `/api/chat` retrieval wiring, admin UI,
search-index document writer, real vector upsert/delete, runtime reranking,
hybrid search runtime, public/customer upload route, customer account, public
quote tracking, customer-visible internal notes, notification, CRM
integration, deployment, Vercel or Supabase Cloud config, browser Supabase,
service-role runtime path, transcript runtime path, or ecommerce flow.

## 2026-06-06: Admin Operations UI MVP

Decision: Phase 2H-A/B adds the protected admin operations UI MVP.

Reason: PR #112 merged Phase 2G-C/D at
`116f3761032b2af23e2bc240a77b6e810f45e918`, so the next useful local phase is
to make the already-approved admin listing/category/media and quote workflow
boundaries easier to operate without widening runtime scope.

The implementation adds focused protected admin pages for listing management,
category management, listing media management, quote request review, and quote
detail review. Listing/category/listing-image writes continue through the
existing first-party admin routes and `execute_admin_product_write` boundary,
preserving the local search-index enqueue behavior. Quote workflow status and
internal notes continue through the existing protected quote route and
`execute_admin_quote_workflow` RPC.

Phase 2H-A/B does not add Pinecone runtime code, Pinecone package
dependencies, Pinecone env reads, Pinecone executor, API keys, n8n workflow or
runtime changes, embedding runtime, sync worker, `/api/chat` retrieval wiring,
search-index document writer, real vector upsert/delete, runtime reranking,
hybrid search runtime, public or customer upload routes, customer accounts,
public quote tracking, customer-visible internal notes, notifications, CRM,
deployment, Vercel or Supabase Cloud config, browser Supabase, service-role
runtime paths, transcript runtime paths, or ecommerce flows.

## 2026-06-06: Public Rental Catalogue And Quote Request UX MVP

Decision: Phase 2I-A/B adds the public rental catalogue and quote request UX MVP.

Reason: PR #113 merged Phase 2H-A/B at
`dbf59c1250e22956162475284dcbe94899f50c4b`, completing the protected admin
operations UI MVP. The next safe step is to make the public rental website
more usable for browsing listings/categories and sending quote/enquiry requests
without changing the existing data or runtime boundaries.

The implementation improves public homepage conversion sections, public
listing browse/detail routes, category browsing, and quote/enquiry handoff.
Public catalogue views keep using the existing `get_public_catalogue` read
surface and public quote submission keeps using the existing first-party
`/api/quote` boundary.

Public users only see public-safe published listing/category/image data.
Public quote/enquiry submission confirms receipt without exposing internal
quote workflow state, admin internal notes, public quote tracking, customer
accounts, notifications, CRM, or ecommerce flows. Supabase remains canonical
for website/admin listing and quote data. Pinecone remains a future derived
index only.

Phase 2I-A/B does not deploy, add Vercel config, connect Supabase Cloud, add
real secrets or env values, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, or add ecommerce flows such as
carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## 2026-06-06: Preview Deployment Handoff And Branch-Freeze Package

Decision: Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze package.

Reason: PR #121 merged Phase 2P-A/B at
`15a5d23941ac7fbe3297792311f50e414d622f5f`, leaving the repo with the preview
approval package, deploy dry-run validation, external preview smoke harness,
rollback drill package, and local release-candidate gate parity. The next safe
step is a final handoff and branch-freeze package that makes the next decision
explicit: approve preview deployment, hold deployment, or pivot to product
polish.

The implementation adds `docs/PREVIEW-DEPLOYMENT-HANDOFF.md`,
`docs/PREVIEW-DEPLOYMENT-BRANCH-FREEZE.md`, and
`npm run validate:preview-handoff`. The handoff records the verified PR #117
through PR #121 capability chain, required local validation, operator-only
preview smoke after a preview exists, outside-git evidence handling, branch
freeze rules, and definitions for blocker versus non-blocker work.

No deployment is performed in this PR. Phase 2Q-A/B does not approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled preview or production evidence, add browser Supabase, add
service-role runtime paths, access `website/chat-config.js`, add
public/customer upload routes, add customer accounts, add public quote
tracking, expose customer-visible internal notes, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add Pinecone SDK/package dependencies, add Pinecone env vars or API
keys, add embedding/reranking runtime, wire `/api/chat` to retrieval/RAG, wire
transcript reads or writes into `/api/chat`, add admin transcript UI, add
transcript deletion/export runtime paths, add retention cleanup jobs, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-06: Preview Smoke Harness And Rollback Drill Package

Decision: Phase 2P-A/B adds an operator-run external preview smoke harness and rollback drill package.

Reason: PR #120 merged Phase 2O-A/B at
`81431f13836e0b9b182aaca9638ae2e07abd7571`, creating the preview deployment
approval packet and redacted evidence templates. The next safe non-deployment
step is to provide an operator-run preview smoke command and rollback drill
package for a future separately approved preview deployment, while keeping CI
and default local validation deterministic and no-network.

The implementation adds `npm run smoke:preview`, which requires
`SKR_PREVIEW_BASE_URL`, fails closed for missing, local, non-preview, or unsafe
values, redacts the supplied URL in output, and performs only public GET checks
against the reviewed external preview target. It also adds
`npm run validate:preview-smoke-harness` for static CI validation, plus
`docs/PREVIEW-ROLLBACK-DRILL.md` and redacted result templates.

No deployment is performed in this PR. Phase 2P-A/B does not approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled preview or production evidence, add browser Supabase, add
service-role runtime paths, access `website/chat-config.js`, add
public/customer upload routes, add customer accounts, add public quote
tracking, expose customer-visible internal notes, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add Pinecone SDK/package dependencies, add Pinecone env vars or API
keys, add embedding/reranking runtime, wire `/api/chat` to retrieval/RAG, wire
transcript reads or writes into `/api/chat`, add admin transcript UI, add
transcript deletion/export runtime paths, add retention cleanup jobs, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-06: Preview Deployment Approval Package And Operator Evidence Templates

Decision: Phase 2O-A/B adds preview deployment approval packaging and redacted operator evidence templates.

Reason: PR #119 merged Phase 2N-A/B at
`ad97aace9c2145af139a45f3e0f2d0b6d09a24a9`, leaving the repo with typed
server-only runtime config parsing and a deploy dry-run harness, but without a
single final operator packet for a future explicitly approved preview or
deployment PR. The next safe step is to create the approval package,
redacted-only evidence templates, go/no-go decision template, and deterministic
static validation around that approval lane.

The implementation adds `docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md`,
redacted templates under `docs/templates/`, and
`npm run validate:preview-approval-package`. The validator checks that PR #119
and its merge commit are recorded, required docs/templates exist, required
release/dry-run commands are named, explicit later deployment approval is
required, approval docs/templates avoid raw values, and forbidden runtime,
provider, evidence, deployment, browser Supabase, service-role, n8n/Pinecone,
public quote tracking, customer account, upload, notification, CRM, transcript,
and ecommerce surfaces remain absent.

No deployment is performed in this PR. Phase 2O-A/B does not approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled production evidence, add browser Supabase, add service-role
runtime paths, access `website/chat-config.js`, add public/customer upload
routes, add customer accounts, add public quote tracking, expose
customer-visible internal notes, add notifications or CRM integration, change
n8n/Pinecone runtime behavior, add SaaS chatbot runtime work, add Pinecone
SDK/package dependencies, add Pinecone env vars or API keys, add
embedding/reranking runtime, wire `/api/chat` to retrieval/RAG, wire
transcript reads or writes into `/api/chat`, add admin transcript UI, add
transcript deletion/export runtime paths, add retention cleanup jobs, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-06: Server Runtime Configuration Hardening And Deploy Dry-Run Harness

Decision: Phase 2N-A/B hardens server-only runtime configuration parsing and deploy dry-run validation.

Reason: PR #118 merged Phase 2M-A/B at
`a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489`, leaving the repo with local and CI
release-gate parity but without a single typed contract for the existing
server-only runtime settings. The next safe step is to centralize parsing for
the already-approved Supabase, catalogue, quote, admin, chat, n8n, and trusted
header settings and add a local deploy dry-run harness before any future
deployment review.

The implementation adds a server-only runtime config contract with safe
normalization and redacted issue summaries, wires it into existing server
config/fallback paths where it reduces duplicated parsing, and adds
`npm run validate:deploy-dry-run` to run the release-candidate gate plus local
config/static checks. Missing or invalid runtime config stays unavailable or
falls back safely without exposing raw values.

No deployment is performed in this PR. Phase 2N-A/B does not add Vercel
config, connect Supabase Cloud, add real secrets or env values, add production
evidence, add browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-07: Public Catalogue Discovery And Quote Funnel Polish

Decision: Phase 3C-A/B adds public catalogue discovery and quote funnel polish.

Reason: PR #124 merged Phase 3B-A/B at
`bfcf9916a0edd1b7133a1765719b9ddd73197dac`, completing admin operations
readiness and quote triage polish without deploying or approving deployment.
The next approved work item is public catalogue discovery and quote funnel
polish using existing public-safe catalogue and quote request data only.

The implementation improves category discovery affordances, static event setup
guidance, filtered catalogue recovery paths, category empty states,
selected-listing quote context, requested-item context, and quote helper copy
around event date, venue/location, quantities, setup notes, and contact method.
It keeps the existing public catalogue read boundary and public quote API
contract.

Phase 3C-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-07: Sitewide Public Journey, Trust Content, And Route Polish

Decision: Phase 3D-A/B adds sitewide public journey, trust content, and route polish.

Reason: PR #125 merged Phase 3C-A/B at
`d031d7f47a6893f92d0b6739300d52147f6abfa4`, completing public catalogue
discovery and quote funnel polish without deploying or approving deployment.
The next approved work item is sitewide public journey, trust content, and
route polish using existing public-safe catalogue and quote request surfaces
only.

The implementation improves homepage journey guidance, event setup
expectation-setting, route recovery links, listing detail quote-request
preparation, quote enquiry expectations, and route metadata. It keeps public
quote/enquiry success receipt-only and keeps the existing public catalogue read
boundary and public quote API contract.

Phase 3D-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, testimonials,
client names, legal claims, production policies, or add ecommerce flows such
as carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## 2026-06-07: Product Readiness, Navigation QA, And Public/Admin Dead-End Polish

Decision: Phase 3E-A/B adds product readiness, navigation QA, and public/admin dead-end polish.

Reason: PR #126 merged Phase 3D-A/B at
`de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04`, completing sitewide public
journey, trust content, and route polish without deploying or approving
deployment. The next approved work item is deterministic product readiness and
navigation QA across existing public-safe catalogue, quote, and protected admin
surfaces.

The implementation adds internal route allowlist coverage across key public
routes and protected admin operations routes, improves semantic recovery for
empty, filtered, missing, blocked, and unavailable states, and keeps public
recovery links separate from admin-only management links. It also adds content
consistency checks for rental/listing/enquiry/quote/request wording and guards
against ecommerce wording or invented proof/contact claims on production
surfaces touched by this phase.

Phase 3E-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, testimonials,
client names, awards, certifications, legal claims, production policies, or
add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-07: Catalogue Content Quality, Media Readiness, And Admin Publication Polish

Decision: Phase 3F-A/B adds catalogue content quality, media readiness, and admin publication polish.

Reason: PR #127 merged Phase 3E-A/B at
`03c8a21522e6e68aa8b2caf32aedc4218e77f66e`, completing product readiness,
navigation QA, and public/admin dead-end polish without deploying or approving
deployment. The next approved work item is catalogue content quality and
admin-only readiness polish across existing public-safe catalogue, quote
handoff, and protected admin listing/category/media surfaces.

The implementation improves incomplete-but-safe public listing/category copy,
safe fallback image alt text, quote handoff copy when selected listing context
is missing or unavailable, and admin-only publication/media readiness summaries
for draft, published, archived, category, media, alt text, active primary image,
inactive metadata, and quote-planning gaps. It keeps the existing public
catalogue read boundary, public quote API contract, protected admin surfaces,
and RPC-backed admin write boundaries.

Phase 3F-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, testimonials,
client names, awards, certifications, legal claims, production policies, or
add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-07: Quote Intake Quality, Admin Triage Depth, And Enquiry Workflow Polish

Decision: Phase 3G-A/B adds quote intake quality, admin triage depth, and enquiry workflow polish.

Reason: PR #128 merged Phase 3F-A/B at
`69665bb241b1af5c05ad34ac1464cdaeece8b7f8`, completing catalogue content
quality, media readiness, and admin publication polish without deploying or
approving deployment. The next approved work item is focused quote/enquiry
workflow polish across the existing public quote intake, selected-listing
handoff, protected admin quote inbox, and protected admin quote detail
surfaces.

The implementation improves public quote form helper text, contact validation
copy, selected-listing no-reservation expectations, and receipt-only success
messaging. It also adds admin-only triage depth from existing quote request
data, including status buckets, missing-info summaries, next-action cues,
customer-message and internal-activity cues, and a more readable quote detail
summary. It keeps the existing public quote API contract, public catalogue
read boundary, protected admin shell, and RPC-backed admin write boundaries.

Phase 3G-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, testimonials,
client names, awards, certifications, legal claims, production policies, or
add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-07: Admin Operator QA, Dashboard Consistency, And Non-Deployment Release Readiness Polish

Decision: Phase 3H-A/B adds admin operator QA, dashboard consistency, and non-deployment release readiness polish.

Reason: PR #129 merged Phase 3G-A/B at
`75fd104966e3e8c69a434f2325f6f79e4742a40f`, completing quote intake
quality, admin triage depth, and enquiry workflow polish without deploying or
approving deployment. The next approved work item is protected admin operator
QA and release-readiness polish that keeps deployment approval separate.

The implementation improves protected admin overview, listing, category,
media, quote inbox, and quote detail guidance with consistent summaries,
read-only/write-enabled distinctions, public-facing/admin-only boundaries,
next safe admin actions, recovery links, and deterministic no-deployment
guardrails. It keeps the existing public catalogue read boundary, public quote
request API contract, protected admin routes, and RPC-backed admin write
boundaries.

Phase 3H-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-07: Full-Site Acceptance QA, Public SEO/Accessibility Polish, And Non-Deployment Release Hardening

Decision: Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening.

Reason: PR #130 merged Phase 3H-A/B at
`09f92ede4b5d9f725d0df560838a12fef27940b9`, completing admin operator QA,
dashboard consistency, and non-deployment release readiness polish without
deploying or approving deployment. The next approved work item is public
full-site acceptance QA and release hardening that keeps deployment approval
separate.

The implementation improves public route metadata, primary navigation copy,
homepage enquiry-step wording, route heading coverage, public-only internal
links, selected-listing quote expectations, not-found/recovery coverage, and
deterministic no-deployment guardrails. It keeps the existing public catalogue
read boundary, public quote request API contract, protected admin routes, and
RPC-backed admin write boundaries.

Phase 3I-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-09: Quote Enquiry Workflow Hardening, Protected Admin Triage Polish, And Local Acceptance Coverage

Decision: Phase 3V-A/B hardens the quote/enquiry workflow, protected admin triage, and local acceptance coverage.

Reason: PR #143 merged Phase 3U-A/B at
`dd2c3c0176c427e69efa01d6e54841637d61548c`. The repo now has a final local
owner handoff pack, acceptance triage board, and deployment decision firewall,
but the core public conversion path and protected admin quote triage need a
product-hardening pass before any separate deployment lane is considered.

Implementation: Phase 3V-A/B improves public quote/enquiry guidance, invalid
listing handoff recovery, listing/category/event quote handoff wording,
protected admin quote triage grouping, and local acceptance coverage. It adds
`docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md`, an admin-only
quote/enquiry acceptance snapshot inside the protected content readiness
workspace, deterministic Phase 3V regression tests, and local validator
coverage for the quote workflow boundary.

Boundary: Phase 3V-A/B is repo-local only. It does not deploy, approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled owner-review evidence, add filled preview evidence, add
production evidence, invent owner review, invent owner sign-off, invent real
business facts, add browser Supabase, add service-role runtime paths, add n8n
or Pinecone runtime changes, wire `/api/chat` to retrieval, add public uploads,
add customer accounts, add public quote tracking, add notifications or CRM, run
live preview smoke, run network URL checks, write evidence files, or add
self-service completion-like, stock-hold-like, rental-completion-like, or
customer account flows.

## 2026-06-09: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall

Decision: Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall.

Reason: PR #142 merged Phase 3T-A/B at
`66840d5d3bb77d39200a864bfcbecc29ee859f76`. The repo now has a local
release-candidate command centre and suite runner, but owner/operator handoff
still needs one final repo-local layer that separates local acceptance
readiness, owner review readiness, and deployment approval.

Implementation: Phase 3U-A/B adds
`docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md`,
`docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md`,
`docs/content/DEPLOYMENT-DECISION-FIREWALL.md`, an admin-only final handoff
snapshot inside the protected content readiness workspace, deterministic Phase
3U regression tests, and local validator coverage for the handoff/firewall
materials and public/admin boundary.

Boundary: Phase 3U-A/B is repo-local only. It does not deploy, approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled owner-review evidence, add filled preview evidence, add
production evidence, invent owner review, invent owner sign-off, invent real
business facts, add browser Supabase, add service-role runtime paths, add n8n
or Pinecone runtime changes, wire `/api/chat` to retrieval, add public uploads,
add customer accounts, add public quote tracking, add notifications or CRM, run
live preview smoke, run network URL checks, write evidence files, or add
self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## 2026-06-09: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist

Decision: Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.

Reason: PR #141 merged Phase 3S-A/B at
`7d6af15e09f7603e2107801f3b6417fd4d2d40bc`. The repo now has a local
acceptance matrix and route inventory freeze, but future reviews need one clear
local command centre that names safe commands, forbidden commands, suite sequence,
what each command proves, and what remains outside scope before any deployment
discussion.

Implementation: Phase 3T-A/B adds
`docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md`,
`scripts/validate-release-candidate-suite.cjs`,
`validate:release-candidate-suite`, an admin-only command centre snapshot
inside the protected content readiness workspace, deterministic Phase 3T
regression tests, and local validator coverage for the command allowlist and
forbidden-command audit.

Boundary: Phase 3T-A/B is repo-local only. It does not deploy, approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled owner-review evidence, add filled preview evidence, add
production evidence, invent owner review, invent owner sign-off, invent real
business facts, add browser Supabase, add service-role runtime paths, add n8n
or Pinecone runtime changes, wire `/api/chat` to retrieval, add public uploads,
add customer accounts, add public quote tracking, add notifications or CRM, run
live preview smoke, run network URL checks, write evidence files, or add
self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## 2026-06-09: Local Release-Candidate Acceptance Gate, Route Inventory Freeze, And Public/Admin Regression Harness

Decision: Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.

Reason: PR #140 merged Phase 3R-A/B at
`ef18c2357d37fdb613851c427130bb108861de31`. Before any deployment discussion,
the repo needs a deterministic local gate that proves the current
furniture/event rental website candidate keeps public routes customer-facing,
keeps internal review materials protected, and preserves deployment/provider
boundaries.

Implementation: Phase 3S-A/B adds
`docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md`,
`docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md`,
`scripts/validate-local-release-candidate.cjs`,
`validate:local-release-candidate`, CI coverage for the new validator, an
admin-only local acceptance snapshot inside the protected content readiness
workspace, a public quote heading polish, and deterministic Phase 3S regression
tests.

Boundary: Phase 3S-A/B is repo-local only. It does not deploy, approve
deployment, add Vercel config, connect Supabase Cloud, add real secrets or env
values, add filled owner-review evidence, add filled preview evidence, add
production evidence, invent owner review, invent owner sign-off, invent real
business facts, add browser Supabase, add service-role runtime paths, add n8n
or Pinecone runtime changes, wire `/api/chat` to retrieval, add public uploads,
add customer accounts, add public quote tracking, add notifications or CRM, or
add self-service completion-like flows, stock-reservation-like flows,
fulfilment-like flows, or customer account flows.

## 2026-06-08: Product Acceptance Hardening, Public/Admin Route Polish, And Owner-Demo Issue Backlog Readiness

Decision: Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.

Reason: PR #139 merged Phase 3Q-A/B at
`0a0bd665111decffb6cdc837e48782943940f22f`, completing the owner-demo
walkthrough, public journey QA hardening, and protected admin closure workspace
polish without deploying, approving deployment, filling owner-review evidence,
or inventing missing real-world facts. The next approved work item is to
harden the public/admin product acceptance surface and prepare a template-only
owner-demo issue backlog for future follow-up.

The implementation improves public route guidance, empty-state recovery,
category/listing/event setup cross-links, listing fit-check copy, and
quote/enquiry handoff clarity. It adds a template-only owner-demo issue
backlog, an admin-only owner-demo issue backlog snapshot in the protected
content readiness workspace, deterministic Phase 3R tests, preview handoff
validation coverage, and docs/status roll-forward from PR #139. It keeps the
existing public catalogue read boundary, public quote request API contract,
protected admin shell gate, and RPC-backed admin write boundaries.

Phase 3R-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
filled owner-review evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, invent real contact details, phone
numbers, email addresses, physical addresses, business hours, testimonials,
client names, awards, certifications, legal claims, guarantees, production
policies, or add self-service completion-like flows,
stock-reservation-like flows, fulfilment-like flows, or customer account flows.

## 2026-06-08: Repo-Local Owner-Demo Polish, Public Journey QA Hardening, And Protected Admin Closure Workspace Polish

Decision: Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish.

Reason: PR #138 merged Phase 3P-A/B at
`586d17e3f909fcf2986115633bb329a06fbcdf49`, completing the owner-review
closure packet, readiness sign-off template, and deployment approval separation
without deploying, approving deployment, filling owner-review evidence, or
inventing missing real-world facts. The next approved work item is to make the
repo-local public/admin candidate easier for an owner/admin to review while
keeping all deployment, provider, evidence, and filled-signoff boundaries in
place.

The implementation adds a template-only owner-demo walkthrough, public journey
copy polish, an admin-only owner-demo walkthrough snapshot in the protected
content readiness workspace, deterministic Phase 3Q tests, preview handoff
validation coverage, and docs/status roll-forward from PR #138. It keeps the
existing public catalogue read boundary, public quote request API contract,
protected admin shell gate, and RPC-backed admin write boundaries.

Phase 3Q-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
filled owner-review evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, invent real contact details, phone
numbers, email addresses, physical addresses, business hours, testimonials,
client names, awards, certifications, legal claims, guarantees, production
policies, or add public self-service rental completion flows outside the
current quote request path.

## 2026-06-08: Owner-Review Closure Packet, Readiness Sign-Off Template, And Deployment Approval Separation

Decision: Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template, and deployment approval separation.

Reason: PR #137 merged Phase 3O-A/B at
`fd5614bb1e0a9e0e33f064ecaba7bc85dba36efb`, completing the owner-review
correction intake, launch-blocker freeze gate, and admin triage snapshot
without deploying or approving deployment. The next approved work item is to
prepare template-only closure readiness materials that distinguish continuing
owner review, blocked owner review, locally closable owner review, and
separate deployment approval.

The implementation adds an owner-review closure packet, readiness sign-off
template, deployment approval separation note, protected content readiness
workspace closure snapshot update, deterministic Phase 3P tests, preview
handoff validation coverage, and docs/status roll-forward from PR #137. It
keeps the existing public catalogue read boundary, public quote request API
contract, protected admin shell gate, and RPC-backed admin write boundaries.

Phase 3P-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
filled owner-review evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, invent real contact details, phone
numbers, email addresses, physical addresses, business hours, testimonials,
client names, awards, certifications, legal claims, guarantees, production
policies, or add public/customer transaction flows, retail transaction flows,
stock-reservation-like flows, or fulfilment-like flows.

## 2026-06-08: Owner-Review Correction Intake, Launch-Blocker Freeze Gate, And Admin Triage Snapshot

Decision: Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate, and admin triage snapshot.

Reason: PR #136 merged Phase 3N-A/B at
`98d62e9d6641d0d34770c76f156e914be5ba4edd`, completing the owner-review
dry-run packet, findings disposition workflow, and launch hold/approve
rehearsal without deploying or approving deployment. The next approved work
item is to define how future owner-supplied corrections would be captured,
frozen, deferred, or split into safe local PRs while keeping all rows
placeholder-only.

The implementation adds owner-review correction intake, a launch-blocker
freeze gate, correction PR planning, protected content readiness workspace
correction/freeze snapshot update, deterministic Phase 3O tests, preview
handoff validation coverage, and docs/status roll-forward from PR #136. It
keeps the existing public catalogue read boundary, public quote request API
contract, protected admin shell gate, and RPC-backed admin write boundaries.

Phase 3O-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
filled owner-review evidence, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, invent real contact details, phone
numbers, email addresses, physical addresses, business hours, testimonials,
client names, awards, certifications, legal claims, guarantees, production
policies, or add ecommerce flows such as carts, checkout, payments, stock
reservation, confirmed booking, order fulfilment, or online ordering.

## 2026-06-08: Owner-Review Dry-Run Packet, Findings Disposition Workflow, And Launch Hold/Approve Rehearsal

Decision: Phase 3N-A/B adds an owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal.

Reason: PR #135 merged Phase 3M-A/B at
`0528ad92ad756a68d2094a16cd204f1c404c99a3`, completing the owner-review
execution checklist, route-by-route decision matrix, and admin review snapshot
without deploying or approving deployment. The next approved work item is to
make owner review dry-run-ready while keeping findings, owner input, and launch
decision language placeholder-only.

The implementation adds an owner-review dry-run packet, findings disposition
workflow, launch decision rehearsal, protected content readiness workspace
snapshot update, deterministic Phase 3N tests, preview handoff validation
coverage, and docs/status roll-forward from PR #135. It keeps the existing
public catalogue read boundary, public quote request API contract, protected
admin shell gate, and RPC-backed admin write boundaries.

Phase 3N-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, phone numbers,
email addresses, physical addresses, business hours, testimonials, client
names, awards, certifications, legal claims, guarantees, production policies,
or add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-08: Owner-Review Execution Checklist, Route-By-Route Decision Matrix, And Admin Review Snapshot

Decision: Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision matrix, and admin review snapshot.

Reason: PR #134 merged Phase 3L-A/B at
`be7fda99f25f73c86494e1ab323e0624dd917806`, completing the protected content
readiness workspace, owner-review issue ledger, and public copy fact-safety
audit without deploying or approving deployment. The next approved work item is
to make owner review executable route by route while keeping review decisions
repo-local and protected.

The implementation adds an owner-review execution checklist, route-by-route
decision matrix, protected content readiness workspace snapshot update,
deterministic Phase 3M tests, preview handoff validation coverage, and
docs/status roll-forward from PR #134. It keeps the existing public catalogue
read boundary, public quote request API contract, protected admin shell gate,
and RPC-backed admin write boundaries.

Phase 3M-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, phone numbers,
email addresses, physical addresses, business hours, testimonials, client
names, awards, certifications, legal claims, guarantees, production policies,
or add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-08: Protected Content Readiness Workspace, Owner-Review Issue Ledger, And Public Copy Fact-Safety Audit

Decision: Phase 3L-A/B adds a protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit.

Reason: PR #133 merged Phase 3K-A/B at
`d4271ea6b181ee702dfe9d6f2b6003903b0c54dd`, completing owner content intake,
content gap register, and launch-blocker governance without deploying or
approving deployment. The next approved work item is to make that repo-local
content governance visible inside protected admin review and add deterministic
public copy fact-safety checks.

The implementation adds a protected admin content readiness workspace, an
owner-review issue ledger, public copy fact-safety coverage, and docs/status
roll-forward from PR #133. It keeps the existing public catalogue read
boundary, public quote request API contract, protected admin shell gate, and
RPC-backed admin write boundaries.

Phase 3L-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, phone numbers,
email addresses, physical addresses, business hours, testimonials, client
names, awards, certifications, legal claims, guarantees, production policies,
or add ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-08: Owner Content Intake, Content Gap Register, And Launch-Blocker Governance

Decision: Phase 3K-A/B adds owner content intake, content gap register, and launch-blocker governance.

Reason: PR #132 merged Phase 3J-A/B at
`1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa`, completing the owner review
readiness package, manual QA runbook, and release-decision preparation without
deploying or approving deployment. The next approved work item is a repo-local
content governance package that records owner-required content inputs and
launch blockers without inventing public business facts or changing runtime
surfaces.

The implementation adds owner content intake and content gap register docs,
cross-links them from the owner review and preview handoff surfaces, and
records deterministic docs/tests for owner content governance. It keeps the
existing public catalogue read boundary, public quote request API contract,
protected admin routes, and RPC-backed admin write boundaries.

Phase 3K-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, invent real contact details, business
hours, addresses, testimonials, client names, awards, certifications, legal
claims, guarantees, production policies, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-07: Owner Review Readiness Package, Manual QA Runbook, And Release-Decision Preparation

Decision: Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and release-decision preparation.

Reason: PR #131 merged Phase 3I-A/B at
`0d2d40898c4e716032fdec130704117494c542d6`, completing full-site acceptance
QA, public SEO/accessibility polish, and non-deployment release hardening
without deploying or approving deployment. The next approved work item is an
owner review package and manual QA runbook that prepares a future owner
decision while keeping deployment approval separate.

The implementation adds repo-local owner review and manual QA documents,
updates preview handoff decision inputs, and records deterministic docs/tests
for owner review readiness. It keeps the existing public catalogue read
boundary, public quote request API contract, protected admin routes, and
RPC-backed admin write boundaries.

Phase 3J-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-06: Preview/Deployment Review Preflight And CI Parity Hardening

Decision: Phase 2M-A/B makes the release-candidate gate deterministic in CI.

Reason: PR #117 merged Phase 2L-A/B at
`aceee2ded00aee41b4e20197091f8527d9e8f8b7`, and the local validation set used
for release-candidate review was broader than the normal pull-request CI gate.
The next safe step is to make the pull-request gate include the full
release-candidate command set where practical and document the future
preview/deployment review preflight without deploying.

The implementation adds Docker-backed `npm run test:supabase-rls` and
`git diff --check` to pull-request CI, adds
`npm run validate:release-candidate` as a local convenience gate, and records a
future preview/deployment preflight checklist covering environment visibility,
workspace IDs, Supabase Cloud review, admin access review, public
quote/listing smoke checks, and rollback/abort checks.

No deployment is performed in this PR. Phase 2M-A/B does not add Vercel
config, connect Supabase Cloud, add real secrets or env values, add production
evidence, add browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-06: Release-Candidate Acceptance Suite And Final MVP Polish

Decision: Phase 2L-A/B marks the MVP release candidate as locally acceptance-covered.

Reason: PR #116 merged Phase 2K-A/B at
`0bf12dad7255ce667cdbfbdc86c27b59abaac4bc`, leaving the MVP feature set and
admin write boundaries implemented. The next safe step is to add a
release-candidate acceptance suite and small public/admin polish so future
preview or deployment review starts from a locally proven candidate.

The implementation adds deterministic acceptance coverage for public homepage,
listings, listing detail, categories, catalogue compatibility, quote/enquiry,
events, safe not-found states, quote form success/error behavior, protected
admin operations, admin quote detail separation, admin write-boundary
preservation, quote workflow preservation, and final static/security
boundaries. Public catalogue/quote UX, admin operations, quote workflow, and
admin write boundaries are covered locally without requiring live Supabase,
Vercel, n8n, Pinecone, real env values, or deployment.

Supabase remains canonical for website/admin listing and quote data. Pinecone
remains a future derived index only. Search-index jobs remain local enqueue
records produced by approved admin listing/category/image writes through
`execute_admin_product_write(...)`.

The repo is ready for a future preview/deployment review, but no deployment is
performed in this PR. Phase 2L-A/B does not add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-06: Admin Write-Boundary Hardening And Deployment Readiness

Decision: Phase 2K-A/B hardens admin write boundaries and deployment/demo readiness.

Reason: PR #115 merged Phase 2J-A/B at
`611ef1eafee5971b1d60929d17ab41a94a357522`, leaving the MVP ready for a
pre-deployment hardening pass. Admin listing/category/image metadata writes
must not be bypassable through direct authenticated browser-role table writes;
they should go through the approved protected admin API and
`execute_admin_product_write(...)` boundary so mutation, product audit, and
local search-index enqueue stay together.

The implementation revokes direct authenticated insert/update grants and drops
direct insert/update policies for `categories`, `products`, and
`product_images`. It also removes the direct product-admin audit insert policy
so product audit rows are written through the same protected RPC transaction.
The product write RPC remains executable by authenticated admin sessions and is
security-definer with its own owner/admin workspace check, relationship
constraints, product audit insert, and local search-index enqueue.

Quote workflow writes remain on `execute_admin_quote_workflow(...)`. Public
quote creation remains on the public quote request boundary. Public catalogue
reads remain on `get_public_catalogue(...)` and display published public-safe
listing/category/image data only.

Deployment/demo readiness docs and smoke-test runbooks are refreshed without
deploying. Phase 2K-A/B does not add Vercel config, connect Supabase Cloud,
add real secrets or env values, add production evidence, add browser Supabase,
add service-role runtime paths, access `website/chat-config.js`, add
public/customer upload routes, add customer accounts, add public quote
tracking, expose customer-visible internal notes, add notifications or CRM
integration, change n8n/Pinecone runtime behavior, add SaaS chatbot runtime
work, add Pinecone SDK/package dependencies, add Pinecone env vars or API
keys, add embedding/reranking runtime, wire `/api/chat` to retrieval/RAG, wire
transcript reads or writes into `/api/chat`, add admin transcript UI, add
transcript deletion/export runtime paths, add retention cleanup jobs, or add
ecommerce flows such as carts, checkout, payments, stock reservation,
confirmed booking, order fulfilment, or online ordering.

## 2026-06-06: MVP Hardening, Quote Intake Correctness, And Demo Readiness

Decision: Phase 2J-A/B adds MVP hardening, quote intake correctness, and demo readiness.

Reason: PR #114 merged Phase 2I-A/B at
`6bf9202df80fbfac995ee168dceea0ef7c26edfa`, completing the public rental
catalogue and quote request UX MVP. The next safe step is to harden quote
intake and admin review for demo use without widening runtime scope.

The implementation preserves public quote/enquiry customer messages in a
first-class `quote_requests.customer_message` column with a bounded length and
narrow anonymous insert grant. Item-specific quote notes remain on
`quote_request_items.notes`. Admin quote detail uses a protected dedicated
server-only read path for one quote request, customer message, requested
items, and internal activity.

Public users still cannot track quotes or view internal quote workflow state.
Admin internal notes remain admin-only. Supabase remains canonical for
website/admin listing and quote data. Pinecone remains a future derived index
only.

Phase 2J-A/B does not deploy, add Vercel config, connect Supabase Cloud, add
real secrets or env values, add browser Supabase, add service-role runtime
paths, access `website/chat-config.js`, add public/customer upload routes, add
customer accounts, add public quote tracking, expose customer-visible internal
notes, add notifications or CRM integration, change n8n/Pinecone runtime
behavior, add SaaS chatbot runtime work, add Pinecone SDK/package
dependencies, add Pinecone env vars or API keys, add embedding/reranking
runtime, wire `/api/chat` to retrieval/RAG, wire transcript reads or writes
into `/api/chat`, add admin transcript UI, add transcript deletion/export
runtime paths, add retention cleanup jobs, or add ecommerce flows such as
carts, checkout, payments, stock reservation, confirmed booking, order
fulfilment, or online ordering.

## 2026-06-07: Product Polish, Content, And Rental UI Iteration

Decision: Phase 3A-A/B adds product polish, content, and rental UI iteration.

Reason: PR #122 merged Phase 2Q-A/B at
`62c2b11b6b15192434eb4035ba0a66a44cd6f763`, completing the final generic
preview deployment handoff and branch-freeze package without deploying or
approving deployment. The next approved work item is product-facing polish for
the existing public rental catalogue, quote/enquiry flow, and protected admin
usability.

The implementation improves public listing card quote-planning cues, listing
detail planning copy, quote request helper/validation/receipt text, event image
accessibility text, protected admin empty states, archive guidance, and
admin-only follow-up copy. It keeps the existing public catalogue read
boundary, public quote request API contract, protected admin routes, and
RPC-backed admin write boundaries.

Phase 3A-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

## 2026-06-07: Admin Operations Readiness And Quote Triage Polish

Decision: Phase 3B-A/B adds admin operations readiness and quote triage polish.

Reason: PR #123 merged Phase 3A-A/B at
`6e8bcf23bc8d7eef12b738613344764c0c1961e6`, completing product polish,
content, and rental UI iteration without deploying or approving deployment.
The next approved work item is protected admin readiness for real operations
before any separately approved preview deployment.

The implementation improves listing publication readiness cues, category
grouping readiness, media readiness guidance, quote triage summaries,
missing-data hints, requested item cues, customer message cues, and admin-only
internal follow-up guidance. It keeps the existing public quote receipt-only
flow, protected admin surfaces, public catalogue read boundary, public quote
request API contract, and RPC-backed admin write boundaries.

Phase 3B-A/B does not deploy, approve deployment, add Vercel config, connect
Supabase Cloud, add real secrets or env values, add production evidence, add
browser Supabase, add service-role runtime paths, access
`website/chat-config.js`, add public/customer upload routes, add customer
accounts, add public quote tracking, expose customer-visible internal notes,
add notifications or CRM integration, change n8n/Pinecone runtime behavior,
add SaaS chatbot runtime work, add Pinecone SDK/package dependencies, add
Pinecone env vars or API keys, add embedding/reranking runtime, wire
`/api/chat` to retrieval/RAG, wire transcript reads or writes into
`/api/chat`, add admin transcript UI, add transcript deletion/export runtime
paths, add retention cleanup jobs, or add ecommerce flows such as carts,
checkout, payments, stock reservation, confirmed booking, order fulfilment, or
online ordering.

Decision: Phase 3W-A/B hardens public catalogue/listing/category/media discovery, protected admin content operations, and local catalogue/listing/media acceptance coverage. It remains repo-local only, does not approve deployment, does not add provider config or evidence, and keeps public/admin wording separated.


## Phase 3X-A/B Protected Admin Write-Ops Hardening

Decision: Phase 3X-A/B hardens protected admin listing, category, media, and quote follow-up write operations, content-operation guardrails, and local acceptance coverage. It remains repo-local only, does not approve deployment, does not add provider config or evidence, and keeps protected admin write-ops wording separated from public routes.

Context: PR #145 merged Phase 3W-A/B catalogue listing media hardening at
`54cd8d5e7b829e56d245da2ca503c9b4058dca76`. Public quote/enquiry and catalogue
discovery are already hardened, so the next safe lane is protected admin write
operation clarity and local acceptance coverage.

Implementation: Phase 3X-A/B adds safer protected labels and helper text for
listing, category, media, image upload, and quote follow-up controls; adds the
protected admin write-ops checklist; adds the authorised-admin content readiness
snapshot; and extends local validators and regression tests for the new
write-ops boundary.

Boundary: Phase 3X-A/B does not deploy, approve deployment, add Vercel config,
connect Supabase Cloud, add real secrets or env values, add filled evidence,
invent owner feedback or sign-off, access `website/chat-config.js`, expose
admin internal notes publicly, add browser Supabase, add service-role runtime
paths, change n8n/Pinecone/RAG runtime behavior, add provider config, or add
out-of-scope public visitor self-service workflows.
## Phase 3Z-A/B Public Route Readiness Closure Protected Admin Review Bridge And Local Acceptance Coverage

Decision: Phase 3Z-A/B adds public journey readiness closure docs, a quote/enquiry public expectation boundary, a protected admin public-review bridge, public route copy/readiness hardening, protected content-readiness snapshot coverage, and deterministic local acceptance coverage.

Rationale: Public routes must remain rental/enquiry-only and must not imply guaranteed availability, confirmed booking, public tracking, accounts, uploads, ecommerce/payment/order/checkout flows, deployment approval, provider setup, or invented owner facts before any future owner review or deployment discussion.

Safety: The phase is repo-local, template-only, non-live, and not evidence. It does not deploy, add provider config, connect Supabase Cloud, change n8n/Pinecone runtime behaviour, add browser Supabase, add service-role runtime paths, create filled evidence, or expose protected admin details publicly.

## Phase 4A-A/B Local Release-Control Gate Owner-Review Rehearsal And Deployment Approval Firewall

Decision: Phase 4A-A/B adds a repo-local release-control gate, owner-review rehearsal runbook, deployment approval firewall matrix, and protected admin release-control workspace for local review readiness before any future deployment discussion.

Rationale: Phase 3Z-A/B closed public route readiness locally. The next safe step is to keep owner review, protected admin readiness, local acceptance, provider/runtime boundaries, and deployment approval separation deterministic and reviewable without creating filled evidence or live provider changes.

Safety: This phase is template-only, non-live, and not evidence. It records PR #148 as the last merged capability PR with merge commit `26792f73f8e7943eac5e421c6d829bde7613b562`. It does not grant deployment approval, add provider config, add real secrets, add browser Supabase, add service-role runtime paths, add n8n/Pinecone runtime changes, expose admin internals publicly, invent business facts, or add ecommerce/cart/checkout/order/payment/purchase flows.

## Phase 4B-A/B Owner-Input Intake Control Local Correction Queue And Review-Ready Handoff Closure

Decision: Phase 4B-A/B adds template-only owner-input intake control, a local correction queue, review-ready handoff closure templates, protected admin owner-input/correction snapshot coverage, and deterministic validators/tests. It keeps deployment, provider setup, fake facts, ecommerce flows, and filled evidence out of scope.

Context: PR #149 merged Phase 4A-A/B local release-control gate at `d825a112d017e95bd28ce030a5755ef78223e4c1`. The next safe repo-local step is to separate missing owner input from local correction work and review-ready handoff closure without recording real owner feedback or sign-off.

Safety: This phase is repo-local, template-only, non-live, and not evidence. It records PR #149 as the last merged capability PR with merge commit `d825a112d017e95bd28ce030a5755ef78223e4c1`. It does not grant deployment approval, add provider config, add secrets, add browser Supabase, add service-role runtime paths, add n8n/Pinecone runtime changes, expose admin internals publicly, invent business facts, or add ecommerce/cart/checkout/order/payment/purchase flows.

## Phase 4B-A/B Owner-Input Correction Queue References

- Current phase: Phase 4B-A/B - owner-input intake control, local correction queue, and review-ready handoff closure.
- Latest completed capability: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall.
- Last merged capability PR: #149.
- Merge commit: `d825a112d017e95bd28ce030a5755ef78223e4c1`.
- Owner-input intake control: `docs/content/OWNER-INPUT-INTAKE-CONTROL.md`.
- Local correction queue: `docs/content/LOCAL-CORRECTION-QUEUE.md`.
- Review-ready handoff closure: `docs/content/REVIEW-READY-HANDOFF-CLOSURE.md`.
- Protected admin release-control workspace: `/admin/release-control`.

These references are repo-local, template-only, non-live, and not evidence. No owner feedback is recorded, no owner corrections are recorded, no owner sign-off is recorded, no preview evidence is created, no production evidence is created, and no deployment approval is granted.

## Phase 4C-A/B Local Owner-Review Rehearsal Pack Blocker Ledger And Acceptance Drill Validator

Decision: Phase 4C-A/B adds a template-only local owner-review rehearsal pack, blocker ledger template, local acceptance drill, protected admin Phase 4C rehearsal snapshot, deterministic tests, and a repo-local owner-review rehearsal validator.

Context: PR #150 merged Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure at `baa076679756751a725ea65ac565545c6fe56d76`. The next safe repo-local step is to rehearse that handoff deterministically without recording actual owner input or acceptance evidence.

Safety: This phase is repo-local, template-only, non-live, and not evidence. It records PR #150 as the last merged capability PR with merge commit `baa076679756751a725ea65ac565545c6fe56d76`. It does not grant deployment approval, add provider config, add secrets, add browser Supabase, add service-role runtime paths, add n8n/Pinecone runtime changes, expose admin internals publicly, invent business facts, or add ecommerce/cart/checkout/order/payment/purchase flows.

## Phase 4C-A/B Local Owner-Review Rehearsal References

- Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator.
- Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure.
- Last merged capability PR: #150.
- Merge commit: `baa076679756751a725ea65ac565545c6fe56d76`.
- Local owner-review rehearsal pack: `docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md`.
- Local blocker ledger template: `docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md`.
- Local acceptance drill: `docs/content/LOCAL-ACCEPTANCE-DRILL.md`.
- Owner-review rehearsal validator: `scripts/validate-owner-review-rehearsal.cjs`.
- Protected admin release-control workspace: `/admin/release-control`.
