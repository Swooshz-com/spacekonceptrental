# SpaceKonceptRental Capstone Problem Log

Working notes for the final presentation. These are the practical issues found while preparing the n8n capstone workflows for demo and later production deployment.

## Environment and configuration issues

- New PC setup broke local n8n mappings for Google Drive, Google Sheets, and credentials.
  - Impact: workflow nodes opened with wrong or missing folder, sheet, and credential selections.
  - Fix: restored local credential bindings and rechecked node mappings against the intended Drive folders, Sheets workbook, and service credentials.
  - Presentation point: deployment needs repeatable environment setup, not only working local clicks.

- Some Google Sheets fields looked unmapped in n8n.
  - Impact: it looked like fields such as `bot_reply`, `intent`, `ticket_id`, and source fields were broken.
  - Root cause: some fields are intentionally blank during the processing stage because AI/RAG output does not exist yet.
  - Fix: documented the intentional blank placeholders in workflow sticky notes.
  - Presentation point: intermediate workflow states should be documented to avoid false debugging.

- Static namespace handling was unclear.
  - Impact: the Pinecone namespace could appear as `{{ $json.namespace }}` if upstream data was not obvious.
  - Fix: kept namespace set upstream in `Prepare Chunk Metadata`, with fallback to `SpaceKonceptRental_kb`.
  - Presentation point: production workflows should centralise runtime config and use safe fallbacks.

## Ingestion workflow issues

- `Prepare Ingestion Log` hit an item index error after Pinecone returned chunk-level output.
  - Impact: the log node tried to read item indexes that did not exist after the workflow expanded files into chunks.
  - Root cause: source file metadata had fewer items than chunk output.
  - Fix: grouped chunk outputs back into one log row per source file before writing to Sheets.
  - Presentation point: multi-item workflows need careful item pairing after splitting documents.

- File links in Google Sheets pointed to `http://filename.md/`.
  - Impact: clicking file names opened invalid URLs.
  - Root cause: Google Sheets auto-linked file names instead of using a real Drive URL.
  - Fix: added a dedicated `file_url` column with the actual Google Drive file URL.
  - Presentation point: separate human labels from machine links.

- File names in Google Sheets still appeared as links.
  - Impact: file name column was visually confusing and pointed to wrong generated links.
  - Root cause: n8n Google Sheets v4.7 writes defaulted to `USER_ENTERED`, and Google Sheets could still render `.md` text as a hyperlink even after RAW value writes.
  - Fix: mapped the append node to use RAW cell writes, then added a Sheets API formatting step that sets the `file_name` column hyperlink display to plain text. `file_url` remains the only clickable URL column.
  - Presentation point: output formatting matters for operator review.

- Created vs updated file events were not visible in the log.
  - Impact: logs did not show whether an ingestion row came from a new upload or an update.
  - Fix: added `event_type` with `created` or `updated`.
  - Presentation point: audit logs need event context, not just final status.

- Ingestion timestamps were UTC instead of Singapore time.
  - Impact: demo logs were harder to read and compare with n8n execution times.
  - Fix: changed log timestamps to `YYYY-MM-DD HH:mm:ss SGT`.
  - Presentation point: production logs should use the operator's business timezone.

- Fast multi-file uploads produced duplicate or split trigger runs.
  - Impact: several uploads could appear as separate n8n executions, and duplicate events could happen in the same trigger batch.
  - Root cause: Google Drive created and updated triggers poll independently and are not guaranteed to group all files together.
  - Fix: added duplicate filtering within a single trigger batch, while still allowing distinct files and later updates to continue.
  - Presentation point: event-driven automation must be idempotent because trigger batching is not reliable.

- File `04` ran separately from files `01`, `02`, and `03`.
  - Impact: Pinecone and Sheet counts looked inconsistent at first glance.
  - Root cause: separate Drive trigger polling windows for created and updated events.
  - Fix: treated this as expected behaviour and made each file ingestion safe to run independently.
  - Presentation point: correct workflow design should not depend on all files arriving in one batch.

## Pinecone and RAG issues

- Pinecone chunk counts kept growing after repeated updates.
  - Impact: counts looked wrong, for example 8 chunks, then 23, then 55.
  - Root cause: re-uploading or updating files inserted fresh vectors without deleting stale vectors for the same file.
  - Fix: added a delete-before-insert path that deletes existing vectors matching `source_file_id` or `source_file_name` before inserting fresh chunks.
  - Presentation point: vector databases need explicit update semantics; insert-only ingestion is not production-safe.

- Same file content with a new Google Drive file ID could leave old vectors behind.
  - Impact: replacing a file in Drive can create a new file ID, so deleting only by ID is not enough.
  - Fix: delete stale vectors by either `source_file_id` or `source_file_name`.
  - Presentation point: stable business identifiers are important when external system IDs can change.

- Pinecone delete required the index host, not only the index name.
  - Impact: the workflow needed extra setup before it could call Pinecone delete endpoints.
  - Fix: added a Pinecone index-host lookup step, then used the returned host for vector deletion.
  - Presentation point: production readiness sometimes requires lower-level API calls when built-in nodes do not expose needed operations.

- Pinecone cleanup nodes were not obvious from the canvas alone.
  - Impact: the delete-before-insert subflow looked confusing during review.
  - Fix: updated the Vector Indexing sticky note to explain the host lookup, delete request, stale vector deletion, and context restore steps.
  - Presentation point: production workflows need operator-facing documentation, especially around destructive-looking cleanup steps.

- Pinecone delete failed on first clean namespace.
  - Impact: the workflow stopped at `Delete Existing Pinecone File Chunks` with `Namespace not found` before fresh chunks could be inserted.
  - Root cause: Pinecone returns 404 when deleting from a namespace that has not been created by any prior insert.
  - Fix: allow only the first-run `Namespace not found` delete response to continue, while still failing unexpected Pinecone delete errors.
  - Presentation point: idempotent cleanup should tolerate empty initial state without hiding real infrastructure failures.

- Pinecone host lookup response shape changed after error handling update.
  - Impact: the workflow stopped at `Prepare Pinecone Delete Request` because the host was wrapped under `body.host` instead of returned as top-level `host`.
  - Root cause: full HTTP response handling was accidentally applied to the index-host lookup node instead of only the delete node.
  - Fix: keep normal JSON output on the host lookup, make the delete request return a full response, and make host parsing tolerate both shapes.
  - Presentation point: when chaining HTTP nodes, response shape changes must be treated as data-contract changes.

- Live n8n kept running an older workflow after the repo fix.
  - Impact: execution `945` still failed with `Namespace not found` even though the repo workflow had been patched.
  - Root cause: the fixed workflow JSON had not been imported back into the live n8n instance, so the active node still had `neverError` disabled.
  - Fix: import the updated workflow before retesting, then confirm the live node parameters match the repo.
  - Presentation point: repository changes and live automation state must be synced and verified separately.

## Logging and audit issues

- KB ingestion logs were replacing old rows instead of preserving history.
  - Impact: repeated ingestion for the same file overwrote the previous audit row.
  - Root cause: Google Sheets node used `appendOrUpdate` with `file_id` as the match column.
  - Fix: changed the ingestion log back to append-only so every event is recorded as a new row.
  - Presentation point: operational logs should be append-only unless the workflow is intentionally maintaining current state.

- Switching the Google Sheets operation cleared the field mapping.
  - Impact: the workflow reached the log step, but no ingestion row was appended because the append node had no mapped columns.
  - Root cause: changing the Sheets node operation in the n8n UI reset `columns.value`.
  - Fix: restored explicit mappings for `file_id`, `file_name`, `file_url`, `event_type`, `status`, `chunks_count`, `namespace`, `execution_id`, `ingested_at`, and `error_message`.
  - Presentation point: low-code node settings can silently reset downstream mappings, so final workflow exports need source control review.

- Import helper skipped unchanged workflows.
  - Impact: it looked like an import failure when only one workflow had actually changed.
  - Root cause: the import script compares workflow content and skips files with no effective changes.
  - Fix: confirmed this was expected behaviour, then added a force-import option for cases where local n8n should be refreshed even when the comparison sees no meaningful diff.
  - Presentation point: deployment scripts should clearly report skipped vs imported workflows.

## Error handling and notifications

- Error alert email formatting needed improvement.
  - Impact: raw or inconsistent error messages were harder to scan.
  - Fix: formatted error email body with structured HTML fields such as time, contact ID, error type, message, last node, execution ID, and execution URL.
  - Presentation point: ops alerts should be structured so failures can be triaged quickly.

- Manual chat testing could leave conversation rows stuck at `processing`.
  - Impact: when the customer support agent failed after writing the initial processing row, the customer did not get a graceful fallback and the conversation log looked permanently unfinished.
  - Root cause: the global Error Trigger workflow is useful for workflow-level ops alerts, but it is not a customer-facing fallback path and may not fire during manual chat testing or unpublished workflow runs.
  - Fix: added a workflow-local AI/RAG error output path that builds a fallback response, sends the customer a handoff message, updates the conversation row with `status` set to `failed`, and routes the item to escalation and unanswered-question handling.
  - Presentation point: customer-facing automations need local graceful degradation; global error workflows are a safety net, not the full recovery experience.

- Fresh chat messages incorrectly went to the duplicate-safe reply path.
  - Impact: a normal customer message could be treated as an already-processing or completed duplicate, and the Chat response node then failed with `Response Mode` not set to `Using Response Nodes`.
  - Root cause: `Lookup Conversation State` was reading the conversations sheet without a stable duplicate key, while `message_id` was timestamp-based and therefore not reliable for double-submit detection. The old Chat Trigger node version also did not preserve the `responseNodes` option needed by Chat response nodes.
  - Fix: build a hashed `dedupe_key` from channel, session, redacted normalised message, and a short time bucket; check current and previous buckets before processing; keep `message_id` as the unique audit row id; upgrade the Chat Trigger node version; set response mode to `responseNodes`; and add validator checks for these settings.
  - Presentation point: duplicate protection must be scoped to a stable message key, and response-node workflows need trigger-level response mode guarded in source control.

## AI agent design notes

- Question raised: whether the AI agent needs memory.
  - Current capstone decision: short-term workflow state is stored in Google Sheets logs, while RAG knowledge comes from Pinecone.
  - Future website deployment decision: add proper conversation/session memory if users return across multiple sessions and expect continuity.
  - Presentation point: capstone scope uses logged state and RAG, while production deployment can extend into user/session memory.

## Current production-readiness direction

- Keep Google Sheets ingestion logs append-only.
- Keep Pinecone vector ingestion idempotent by deleting stale vectors before inserting fresh chunks.
- Keep Drive trigger batching assumptions loose because created and updated events can split across executions.
- Keep static production values documented in sticky notes.
- Keep credentials in n8n credentials and local binding files, not hardcoded secrets in workflow JSON.
- Before final demo, run one clean end-to-end ingestion and verify:
  - each KB file produces a log row;
  - each log row has `file_id`, plain `file_name`, Drive `file_url`, `event_type`, `chunks_count`, namespace, execution ID, and SGT timestamp;
  - Pinecone chunk total does not grow unexpectedly after updating the same files;
  - customer-support RAG answers cite the refreshed KB content.
