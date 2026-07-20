# Redacted Env Inventory Template

Do not commit filled production evidence.
Do not commit screenshots containing secrets.
Do not commit real env values.
Store filled evidence outside the repo unless a later approved policy says otherwise.

Use this template to review names and external placement only. Never add actual
values to this file.

| Variable name | Visibility | Value | External placement reviewed |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Server-only | `<redacted>` | `<reviewed externally>` |
| `SUPABASE_ANON_KEY` | Server-only | `<redacted>` | `<reviewed externally>` |
| `CATALOGUE_WORKSPACE_ID` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_WORKSPACE_ID` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_SUBMISSION_ADMISSION_SECRET` | Server-only | `<redacted>` | `<reviewed externally>` |
| `ADMIN_TRUSTED_WORKSPACE_ID` | Server-only | `<redacted>` | `<reviewed externally>` |
| `ADMIN_EXPECTED_ORIGIN` | Server-only | `<redacted>` | `<reviewed externally>` |
| `ADMIN_EXPECTED_HOST` | Server-only | `<redacted>` | `<reviewed externally>` |
| `ADMIN_CSRF_PROOF_SECRET` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_ENQUIRY_EMAIL_PROVIDER` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_ENQUIRY_EMAIL_RECIPIENT` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_ENQUIRY_EMAIL_FROM` | Server-only | `<redacted>` | `<reviewed externally>` |
| `RESEND_API_KEY` | Server-only secret | `<redacted>` | `<reviewed externally>` |
| `CHAT_PROVIDER` | Server-only | `<redacted>` | `<reviewed externally>` |
| `N8N_CHAT_WEBHOOK_URL` | Server-only | `<redacted>` | `<reviewed externally>` |
| `N8N_CHAT_WEBHOOK_TIMEOUT_MS` | Server-only | `<redacted>` | `<reviewed externally>` |
| `CHAT_TRUSTED_CLIENT_IP_HEADER` | Server-only | `<redacted>` | `<reviewed externally>` |
| `QUOTE_TRUSTED_CLIENT_IP_HEADER` | Server-only | `<redacted>` | `<reviewed externally>` |

## Forbidden Inventory Entries

- No `NEXT_PUBLIC_SUPABASE_*`.
- No `NEXT_PUBLIC_N8N*`.
- No service-role runtime path.
- No browser Supabase config.
- No Pinecone runtime or env entry.
- No HubSpot runtime or env entry for the owner MVP launch gate.
- No filled secrets, tokens, keys, webhook values, or raw URLs.
