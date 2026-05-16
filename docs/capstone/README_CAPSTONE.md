# SpaceKonceptRental RAG Customer Support Agent

## Project Overview

This capstone replaces the original AgentX requirement with an n8n implementation for the Customer Support Agent track. The solution is a Retrieval-Augmented Generation customer support agent for `SpaceKonceptRental`.

The repo does not commit `IMPORT.json` or the SCTP capstone PDF. Workflows and documentation were adapted from the provided import workflow structure and Customer Support Agent capstone brief. Reference business documents are retained in `ref/` for future expansion.

All unverified business facts are marked as:

TODO: Confirm with SpaceKonceptRental.

## Architecture Overview

1. Google Drive stores approved knowledge-base files.
2. The ingestion workflow watches created and updated files.
3. OpenAI embeddings convert chunks into vectors.
4. Pinecone stores vectors in namespace `SpaceKonceptRental_kb`.
5. The customer support workflow receives chat messages.
6. A dedupe lookup preserves the original chat input and prevents duplicate processing.
7. The AI Agent retrieves relevant KB chunks through Pinecone and returns strict JSON.
8. n8n parses the JSON, replies to the customer, and writes Google Sheets rows using `appendOrUpdate`.
9. Native IF and Set nodes route leads, bookings, tickets, escalations, and unanswered questions.
10. The error workflow logs failures and sends Gmail alerts in parallel.

## Workflow List

- `n8n_workflows/SpaceKonceptRental-error-handler.workflow.json`
  - Workflow name: `SpaceKonceptRental - Global Error Handler`
- `n8n_workflows/SpaceKonceptRental-rag-ingestion.workflow.json`
  - Workflow name: `SpaceKonceptRental - KB Ingestion to Pinecone`
- `n8n_workflows/SpaceKonceptRental-customer-support-agent.workflow.json`
  - Workflow name: `SpaceKonceptRental - RAG Customer Support Agent`

All workflow templates are inactive by default.

## Required manual configuration:

- **`KB File Created`**
  - `folderToWatch`: Configure the Google Drive folder that stores approved KB files.
- **`KB File Updated`**
  - `folderToWatch`: Configure the Google Drive folder that stores approved KB files.
- **`Insert Chunks into Pinecone`**
  - `pineconeIndex`: Configure the Pinecone index used for vector storage.
- **`Append KB Ingestion Log`**
  - `documentId`: Configure the Google Sheets document used for ingestion logs.
- **`SpaceKonceptRental Knowledge Base`**
  - `pineconeIndex`: Configure the Pinecone index used for retrieval.
- **`Lookup Conversation State`**
  - `documentId`: Configure the Google Sheets document used for support logs.
- **`Upsert Conversation Processing`**
  - `documentId`: Configure the Google Sheets document used for support logs.
- **`Upsert Conversation Completed`**
  - `documentId`: Configure the Google Sheets document used for support logs.
- **`Upsert Lead or Booking`**
  - `documentId`: Configure the Google Sheets document used for lead and booking logs.
- **`Upsert Ticket`**
  - `documentId`: Configure the Google Sheets document used for ticket logs.
- **`Upsert Unanswered Question`**
  - `documentId`: Configure the Google Sheets document used for unanswered question logs.
- **`Send Escalation Alert`**
  - `sendTo`: Configure the support mailbox for escalation alerts.
- **`Append Failure Log`**
  - `documentId`: Configure the Google Sheets document used for failure logs.
- **`Send Failure Alert`**
  - `sendTo`: Configure the support mailbox for failure alerts.

## Placeholder Values

Configure these non-credential values in n8n before activation:

- `SPACEKONCEPTRENTAL_PINECONE_INDEX`
- `SPACEKONCEPTRENTAL_LOGS_SHEET_ID`
- `SPACEKONCEPTRENTAL_SUPPORT_EMAIL`
- `SPACEKONCEPTRENTAL_GOOGLE_DRIVE_KB_FOLDER_ID`

Use namespace:

`SpaceKonceptRental_kb`

## Google Sheets Schema

Use one Google Sheets document for all logs.

### conversations

- message_id
- session_id
- channel
- customer_name
- customer_email
- customer_phone
- user_message_redacted
- bot_reply
- intent
- confidence
- status
- needs_escalation
- lead_captured
- ticket_id
- booking_requested
- source_titles
- source_file_ids
- execution_id
- created_at
- completed_at

### leads

- lead_id
- session_id
- name
- email
- phone
- company
- rental_purpose
- rental_start_date
- rental_duration
- items_needed
- delivery_area
- budget
- status
- source_channel
- created_at
- execution_id

### tickets

- ticket_id
- session_id
- name
- email
- phone
- category
- summary
- details
- urgency
- status
- created_at
- execution_id

### unanswered_questions

- id
- session_id
- user_message_redacted
- reason
- intent
- confidence
- source_titles
- created_at
- execution_id

### failures

- error_execution_id
- workflow_name
- workflow_id
- error_node_name
- error_message
- error_stack
- error_link
- error_time
- new_error_execution_id
- recovery_status

### kb_ingestion

- file_id
- file_name
- status
- chunks_count
- namespace
- execution_id
- ingested_at
- error_message

## Workflow Notes

- Sticky notes are short visual grouping labels only. Setup details live in this README.
- Customer support keeps two Code nodes: regex PII redaction and strict AI JSON recovery with ID generation.
- Ingestion uses native Set nodes for metadata and ingestion log preparation.
- Error handling uses a native Set node for error payload normalisation.
- Gmail alerting in the error workflow does not depend on Google Sheets logging success.

## Import Order

1. Import `SpaceKonceptRental - Global Error Handler`.
2. Import `SpaceKonceptRental - KB Ingestion to Pinecone`.
3. Import `SpaceKonceptRental - RAG Customer Support Agent`.
4. Configure non-credential placeholders and attach credentials in n8n.
5. Set the error workflow in each main workflow's settings.
6. Test ingestion.
7. Test chatbot.
8. Test error handler.

## Demo Script

1. Put KB docs into the Google Drive KB folder.
2. Run `SpaceKonceptRental - KB Ingestion to Pinecone`.
3. Confirm chunks are inserted into Pinecone namespace `SpaceKonceptRental_kb`.
4. Open `SpaceKonceptRental - RAG Customer Support Agent`.
5. Ask: "How does furniture rental work?"
6. Ask: "What are your prices?"
7. Ask: "Can I book a consultation next week?"
8. Ask: "I need to create a support ticket for a delivery issue."
9. Verify conversations, leads, tickets, and unanswered_questions tabs.
10. Trigger an intentional failure.
11. Verify the Gmail alert and failures tab.

## Source Material Inspected

- `ref/SpaceKonceptRental_q_and_a.docx`
- `ref/SpaceKonceptRental_events_exhibition_rental_website_terms.docx`
- `ref/SpaceKonceptRental_privacy_policy.docx`
- `ref/SpaceKonceptRental_furniture_rental_catalogue.pptx`
- `ref/SpaceKonceptRental_website_display_design_wishlist.jpg`

Files in `ref/` are retained as source/reference material for post-capstone expansion. Some original source documents may contain legacy internal naming, but repo-facing naming is now `SpaceKonceptRental`.

## Known Limitations

- Business facts from draft/reference documents must be confirmed before production use.
- Workflow node parameter names may need small UI adjustments depending on the installed n8n version.
- The templates are not live deployed or activated.

## TODOs Requiring Business Confirmation

- Final public operating hours.
- Final pricing policy and whether catalogue prices can be shown by the chatbot.
- Current rental package details.
- Current delivery and pickup areas.
- Final payment policy.
- Final damage or loss policy.
- Final cancellation terms.
- Final rental extension terms.
- Final appointment booking process.
- Human support contact details from the official contact page.

## Validate Workflow JSON

Run:

```bash
npm run validate:n8n
```
