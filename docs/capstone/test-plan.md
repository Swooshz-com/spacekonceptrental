# SpaceKonceptRental Test Plan

Use this plan after workflows are imported, credentials are configured, and verified KB files are ingested.

## 1. FAQ answer found in KB

- Pass/fail: [ ]
- User input: "How does furniture rental work?"
- Expected intent: faq
- Expected chatbot reply behaviour: Answers only from retrieved KB content.
- Expected Google Sheets log: conversations row with status `completed`, intent `faq`, source titles populated where available.
- Expected action: No escalation unless KB content is missing or conflicting.

## 2. Pricing question where pricing is missing from KB

- Pass/fail: [ ]
- User input: "What are your rental prices?"
- Expected intent: pricing
- Expected chatbot reply behaviour: Says it does not have confirmed pricing yet and offers escalation or quote capture.
- Expected Google Sheets log: conversations row; unanswered_questions row if confidence is below 0.55.
- Expected action: Escalation if the customer wants a quote or human follow-up.

## 3. Angry customer escalation

- Pass/fail: [ ]
- User input: "I am really angry. My delivery is late and nobody has helped me."
- Expected intent: escalation
- Expected chatbot reply behaviour: Acknowledges frustration, avoids blame, asks for one focused follow-up if needed.
- Expected Google Sheets log: conversations row with needs_escalation `true`.
- Expected action: Gmail alert to `SPACEKONCEPTRENTAL_SUPPORT_EMAIL`; alert path does not depend on Google Sheets logging success.

## 4. Booking request

- Pass/fail: [ ]
- User input: "Can I book a showroom consultation next Tuesday afternoon?"
- Expected intent: booking
- Expected chatbot reply behaviour: Collects name and email or phone if missing; does not confirm availability.
- Expected Google Sheets log: conversations row with booking_requested `true`.
- Expected action: leads tab row with booking status.

## 5. Ticket creation

- Pass/fail: [ ]
- User input: "Please create a ticket. One rented chair arrived damaged."
- Expected intent: ticket
- Expected chatbot reply behaviour: Collects contact, category, summary, details, urgency, and preferred contact method.
- Expected Google Sheets log: conversations row with ticket_id.
- Expected action: tickets tab row using `SKR-TKT-YYYYMMDD-HHMMSS` format.

## 6. Lead capture

- Pass/fail: [ ]
- User input: "I need furniture for an office pop-up for two months."
- Expected intent: lead
- Expected chatbot reply behaviour: Collects contact details, rental purpose, start date, duration, items, delivery area, and budget if offered.
- Expected Google Sheets log: conversations row with lead_captured `true`.
- Expected action: leads tab row using `SKR-LEAD-YYYYMMDD-HHMMSS` format.

## 7. Multi-step furniture rental enquiry

- Pass/fail: [ ]
- User input: "I need a sofa, coffee table, and dining set for home staging. Can you help with delivery and pricing?"
- Expected intent: lead or pricing
- Expected chatbot reply behaviour: Uses KB for confirmed process details, avoids inventing pricing, asks one focused follow-up.
- Expected Google Sheets log: conversations row with source titles if retrieved.
- Expected action: lead row if enough contact/rental details are captured; escalation if custom quote requested.

## 8. Confusing question

- Pass/fail: [ ]
- User input: "Can the thing be made ready for the event place when it moves?"
- Expected intent: unknown
- Expected chatbot reply behaviour: Asks a focused clarifying question.
- Expected Google Sheets log: conversations row with intent `unknown`.
- Expected action: unanswered_questions row if confidence is below 0.55.

## 9. Unanswered question logging

- Pass/fail: [ ]
- User input: "What is the exact damage fee for a stained sofa?"
- Expected intent: unknown or escalation
- Expected chatbot reply behaviour: Does not invent fees; offers human follow-up.
- Expected Google Sheets log: unanswered_questions row with reason `low_confidence` or `unknown_intent`.
- Expected action: escalation if the customer asks for a confirmed policy or complaint handling.

## 10. Error handler test

- Pass/fail: [ ]
- Test input: Add a temporary Stop and Error node or intentionally broken config in a test workflow.
- Expected intent: Not applicable.
- Expected chatbot reply behaviour: Not applicable.
- Expected Google Sheets log: failures row with workflow name, workflow ID, node name, message, stack, execution URL, and Asia/Singapore timestamp.
- Expected action: Gmail alert to `SPACEKONCEPTRENTAL_SUPPORT_EMAIL`; alert path does not depend on Google Sheets logging success.

## 11. Duplicate message/race-condition test

- Pass/fail: [ ]
- User input: Send the same message_id twice.
- Expected intent: Original intent only once.
- Expected chatbot reply behaviour: First message is processed; duplicate receives a short safe duplicate message or ends.
- Expected Google Sheets log: one conversations row matched by `message_id`; status changes from `processing` to `completed` through `appendOrUpdate`; no duplicate business action.
- Expected action: No duplicate lead, ticket, booking, or escalation row.

## 12. KB ingestion test

- Pass/fail: [ ]
- Test input: Add a new KB file, then update a KB file in the Google Drive folder.
- Expected intent: Not applicable.
- Expected chatbot reply behaviour: Not applicable.
- Expected Google Sheets log: kb_ingestion row with file ID, file name, status, namespace, execution ID, ingested_at, and error_message.
- Expected action: Both created-file and updated-file triggers insert chunks into Pinecone namespace `SpaceKonceptRental_kb`.
