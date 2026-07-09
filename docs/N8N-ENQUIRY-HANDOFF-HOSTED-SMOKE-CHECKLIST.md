# n8n Enquiry Handoff Hosted Smoke Checklist

This checklist is for a future approved hosted validation pass of the SKR
quote/enquiry handoff. It does not approve deployment, configure live
services, apply hosted migrations, import or activate n8n workflows, execute
live workflows, or claim hosted readiness.

## Preconditions

- SKR source includes the server-side n8n handoff contract from PR #287.
- The repo-side workflow readiness template exists at
  `n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json`.
- The hosted Supabase migration runbook has been reviewed:
  `docs/N8N-ENQUIRY-HANDOFF-HOSTED-MIGRATION-RUNBOOK.md`.
- The n8n workflow remains inactive until manual security and email handoff
  configuration is complete.
- Real webhook URLs, shared secrets, provider credentials, recipient values,
  execution IDs, logs, screenshots, and production payloads stay outside the
  repo.

## Hosted Smoke Flow

Run this only after explicit owner approval for the hosted target and allowed
operation.

1. Configure server-only SKR env names in the hosted runtime:
   `N8N_ENQUIRY_HANDOFF_WEBHOOK_URL`,
   `N8N_ENQUIRY_HANDOFF_SHARED_SECRET`, and optional
   `N8N_ENQUIRY_HANDOFF_TIMEOUT_MS`.
2. Configure the matching verification secret in n8n using the approved n8n
   credential or secret mechanism for the target instance.
3. Import or recreate the reviewed workflow template in n8n for review only.
4. Keep the workflow inactive until HMAC verification, timestamp freshness,
   idempotency, email/internal handoff, and response paths are reviewed.
5. Apply the hosted Supabase migration only after explicit approval and only
   through the approved migration process.
6. Run hosted/runtime readiness commands:

   ```powershell
   npm run validate:production-security-readiness -- --launch
   npm run validate:quote-email-runtime-readiness
   ```

7. Submit one clearly synthetic public quote/enquiry through the hosted public
   form.
8. Confirm SKR persisted the quote/enquiry first in the reviewed quote
   workspace.
9. Confirm n8n received a server-side signed handoff only after SKR
   persistence.
10. Confirm n8n idempotency prevents duplicate email/internal handoff for the
    same `x-skr-idempotency-key`.
11. Confirm the internal email or notification was received through n8n-owned
    credentials.
12. Confirm protected Delivery Log shows a safe status and safe reference only.
13. Confirm the public response is receipt-only and does not claim final quote,
    email delivery, or confirmed rental fit.
14. Confirm admin UI, logs, browser output, and evidence do not expose webhook
    URLs, shared secrets, credentials, raw provider payloads, full email bodies,
    raw headers, cookies, tokens, workflow execution data, or unnecessary
    customer message details.

## Launch Hold Conditions

Hold hosted UAT if any item below is true:

- Hosted migration was not applied or cannot be verified.
- The n8n workflow is active before HMAC, timestamp freshness, idempotency, and
  email handoff are implemented.
- The workflow returns a success response before accepting or completing the
  reviewed internal handoff path.
- SKR public quote response exposes n8n/provider internals or claims final
  delivery.
- Delivery Log exposes raw payloads, full customer messages, email bodies,
  headers, cookies, tokens, webhook values, provider responses, or workflow
  execution data.
- Any secret, credential, real webhook value, real recipient address, execution
  ID, production payload, log, screenshot, or trace is committed to the repo.

This checklist is not hosted staging readiness and not UAT evidence.
