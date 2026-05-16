# SpaceKonceptRental Submission Pack

## Final Capstone Deliverables

- FAQs: `docs/capstone/faqs.md`
- Knowledge base starter: `docs/capstone/knowledge-base.md`
- Workflow diagram: `docs/capstone/workflow-diagram.mmd`
- Agent instructions and prompt: `docs/capstone/agent-instructions.md`
- n8n workflow JSON files:
  - `n8n_workflows/SpaceKonceptRental-error-handler.workflow.json`
  - `n8n_workflows/SpaceKonceptRental-rag-ingestion.workflow.json`
  - `n8n_workflows/SpaceKonceptRental-customer-support-agent.workflow.json`
- Google Sheets schema: documented in `docs/capstone/README_CAPSTONE.md`
- Testing evidence checklist: `docs/capstone/test-plan.md`
- Deployment notes: documented in `docs/capstone/README_CAPSTONE.md`

## Testing Evidence Checklist

- [ ] Workflow JSON validation run.
- [ ] n8n import screenshots captured.
- [ ] Google Drive KB folder configured.
- [ ] Ingestion workflow test run completed.
- [ ] Pinecone namespace `SpaceKonceptRental_kb` contains vectors.
- [ ] Chat FAQ test completed.
- [ ] Pricing-missing test completed.
- [ ] Booking test completed.
- [ ] Ticket creation test completed.
- [ ] Lead capture test completed.
- [ ] Angry customer escalation test completed.
- [ ] Duplicate message test completed.
- [ ] Conversation upsert test confirms `processing` and `completed` share one `message_id` row.
- [ ] Error handler test confirms Gmail alert still sends if Sheets logging fails.
- [ ] Google Drive created-file and updated-file ingestion tests completed.
- [ ] Error handler test completed.

## Screenshots Checklist

- [ ] n8n workflow canvas: SpaceKonceptRental - Global Error Handler.
- [ ] n8n workflow canvas: SpaceKonceptRental - KB Ingestion to Pinecone.
- [ ] n8n workflow canvas: SpaceKonceptRental - RAG Customer Support Agent.
- [ ] Google Sheets conversations tab.
- [ ] Google Sheets leads tab.
- [ ] Google Sheets tickets tab.
- [ ] Google Sheets unanswered_questions tab.
- [ ] Google Sheets failures tab.
- [ ] Google Sheets kb_ingestion tab.
- [ ] Pinecone index and namespace.
- [ ] Chat test.
- [ ] Error handler Gmail alert.

## Deployment Notes

These files are local inactive workflow templates and documentation. They minimise custom Code nodes in favour of native/default n8n nodes. They have not been imported, activated, or tested against a live n8n instance in this repository session.

Reference files in `ref/` are retained as source/reference material for post-capstone expansion. Some original source documents may contain legacy internal naming, but repo-facing naming is now `SpaceKonceptRental`.

Before production use:

- Configure the non-credential placeholders in n8n.
- Attach credentials through n8n credential selectors.
- Complete and verify all business facts in the KB.
- Run the test plan.
- Keep workflows inactive until each test passes.

## Manual Configuration Summary

### Required manual configuration:

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
- **`Send Escalation Alert`**
  - `sendTo`: Configure the support mailbox for escalation alerts.
- **`Append Failure Log`**
  - `documentId`: Configure the Google Sheets document used for failure logs.
- **`Send Failure Alert`**
  - `sendTo`: Configure the support mailbox for failure alerts.
