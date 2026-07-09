# n8n Enquiry Handoff Hosted Migration Runbook

This runbook prepares the hosted Supabase migration step required before the
SKR quote/enquiry n8n handoff can be considered for launch validation. It does
not apply the migration, connect to hosted Supabase, configure n8n, import a
workflow, activate a workflow, execute a workflow, or claim hosted readiness.

## Scope

Reviewed migration:

```text
supabase/migrations/20260708100000_n8n_enquiry_handoff_delivery_log_contract.sql
```

This migration is required before hosted n8n handoff launch validation because
the hosted `quote_email_delivery_log` contract must accept the server-side n8n
provider and safe launch delivery states written by SKR after enquiry
persistence.

## Approval Gate

Apply this migration only after explicit current-turn owner approval naming the
hosted Supabase target and allowed migration operation.

Do not:

- run hosted Supabase migrations from this repo-local readiness PR
- run seed data
- paste service-role keys, connection strings, dashboard links, or secrets into
  chat, docs, PR bodies, screenshots, logs, or evidence
- use `supabase db push --include-seed`
- treat local validation as hosted migration evidence

Use only the approved Supabase migration process for the deployment target.

## Before Checks

Before applying the migration in a future approved hosted operation, confirm:

- The target hosted Supabase project is the intended SKR launch project.
- The deployed code commit includes the SKR-side n8n handoff from PR #287.
- The workflow readiness template
  `n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json` has been
  reviewed and remains inactive until manual n8n setup is complete.
- Existing migration state matches the expected base before this migration.
- `quote_email_delivery_log` exists and is RLS-protected.
- Existing public insert policy still ties delivery-log writes to an existing
  quote request in the trusted quote workspace.
- No raw payload, email body, customer message, webhook URL, header, token, or
  provider response columns are present or planned for the delivery log.

## Apply Step

Future approved operators should apply the reviewed migration through the
approved hosted Supabase migration path for the environment.

This document intentionally does not include live commands, credentials,
project URLs, access tokens, service-role keys, or connection strings.

## After Checks

After a future approved migration application, verify through the approved
database inspection path:

- The provider check allows `n8n` while preserving legacy `resend` rows.
- The delivery status check allows `pending`, `delivered`, `failed`, and
  `not_configured` while preserving legacy `sent` rows.
- The status shape requires safe error codes for `failed` and
  `not_configured`, and no error code for success/accepted states.
- The public insert policy still restricts delivery-log rows to existing quote
  requests in the trusted quote workspace.
- No raw payload, email body, customer message, requested item detail, webhook
  URL, header, cookie, token, secret, workflow execution data, or provider
  response fields were added.
- Existing SKR quote persistence still succeeds before any server-side n8n
  handoff attempt.

## Hold And Rollback Notes

Hold launch validation if:

- the migration cannot be verified against the intended hosted project
- the provider/status constraints do not match the reviewed contract
- the public insert policy becomes broader than existing quote-request scoped
  delivery-log writes
- any raw payload or secret-bearing delivery-log field appears
- the hosted runtime cannot record safe n8n delivery states after a persisted
  quote/enquiry

Rollback or compensating migration work must be approved separately and should
preserve the delivery-log privacy boundary. Do not broaden public writes or add
raw provider payload storage as a rollback shortcut.

This runbook is not hosted staging readiness and not UAT evidence.
