// Repo-owned n8n workflow validation rules.
//
// The reusable validator only checks generic workflow hygiene and loads this
// file when it exists. Keep SpaceKonceptRental-specific workflow names, node
// names, node-version expectations, and sheet-column contract checks here so
// future copies of the generic validator stay project-agnostic.

const currentNodeTypeVersions = {
  '@n8n/n8n-nodes-langchain.agent': '3.1',
  '@n8n/n8n-nodes-langchain.chat': '1.3',
  '@n8n/n8n-nodes-langchain.chatTrigger': '1.4',
  '@n8n/n8n-nodes-langchain.documentDefaultDataLoader': '1.1',
  '@n8n/n8n-nodes-langchain.embeddingsOpenAi': '1.2',
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': '1.1',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow': '1.4',
  '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter': '1',
  '@n8n/n8n-nodes-langchain.vectorStorePinecone': '1.3',
  'n8n-nodes-base.code': '2',
  'n8n-nodes-base.errorTrigger': '1',
  'n8n-nodes-base.gmail': '2.2',
  'n8n-nodes-base.googleDrive': '3',
  'n8n-nodes-base.googleDriveTrigger': '1',
  'n8n-nodes-base.googleSheets': '4.7',
  'n8n-nodes-base.httpRequest': '4.4',
  'n8n-nodes-base.if': '2.3',
  'n8n-nodes-base.set': '3.4',
  'n8n-nodes-base.stickyNote': '1',
};

let activeFail = null;

function fail(message) {
  if (typeof activeFail !== 'function') {
    throw new Error(`Validation failure without active reporter: ${message}`);
  }
  activeFail(message);
}

function checkCountFieldsStayNumeric(workflow, relative) {
  const stringifiedCountPattern = /\b[A-Za-z0-9_]*_count\s*:\s*String\s*\(/;

  for (const node of workflow.nodes || []) {
    if (node.type === 'n8n-nodes-base.code') {
      const jsCode = node.parameters?.jsCode;
      if (typeof jsCode === 'string' && stringifiedCountPattern.test(jsCode)) {
        fail(`${relative} stringifies a *_count field in Code node "${node.name}". Count fields should stay numeric before Sheets writes them.`);
      }
    }

    if (node.type !== 'n8n-nodes-base.googleSheets') {
      continue;
    }

    const columns = node.parameters?.columns;
    const values = columns?.value;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      continue;
    }

    const schema = Array.isArray(columns.schema) ? columns.schema : [];
    for (const columnId of Object.keys(values)) {
      if (!/_count$/i.test(columnId)) {
        continue;
      }

      const field = schema.find((entry) => entry && entry.id === columnId);
      if (!field) {
        fail(`${relative} maps count column "${columnId}" in Google Sheets node "${node.name}" but has no schema entry for it.`);
        continue;
      }

      if (field.type !== 'number') {
        fail(`${relative} maps count column "${columnId}" in Google Sheets node "${node.name}" as ${JSON.stringify(field.type)}; use "number".`);
      }
    }
  }
}

function checkIngestionFileNamePlainText(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - KB Ingestion to Pinecone') {
    return;
  }

  const prepareLogNode = findWorkflowNode(workflow, 'Prepare Ingestion Log');
  const prepareLogCode = String(prepareLogNode?.parameters?.jsCode || '');
  if (!prepareLogCode.includes("return String(value || '').trim() || 'unknown_file_name';")) {
    fail(`${relative} Prepare Ingestion Log must return raw file_name text before Google Sheets writes.`);
  }
  if (prepareLogCode.includes('return \'="\'') || prepareLogCode.includes('return "=\\"')) {
    fail(`${relative} Prepare Ingestion Log must not write file_name as a formula string; formulas can become clickable sheet links.`);
  }
  if (prepareLogCode.includes('return "\'" + text;')) {
    fail(`${relative} Prepare Ingestion Log must not prefix file_name with a leading apostrophe; RAW writes should receive the display value directly.`);
  }

  const appendLogNode = findWorkflowNode(workflow, 'Append KB Ingestion Log');
  if (appendLogNode?.parameters?.options?.cellFormat !== 'RAW') {
    fail(`${relative} Append KB Ingestion Log must set options.cellFormat to RAW so file_name values stay plain text.`);
  }

  const formatNode = findWorkflowNode(workflow, 'Disable File Name Hyperlinks');
  if (!formatNode) {
    fail(`${relative} must format the file_name column with Disable File Name Hyperlinks.`);
    return;
  }

  if (!hasConnection(workflow, 'Append KB Ingestion Log', 0, 'Disable File Name Hyperlinks')) {
    fail(`${relative} must run Disable File Name Hyperlinks after Append KB Ingestion Log.`);
  }
  if (formatNode.type !== 'n8n-nodes-base.httpRequest') {
    fail(`${relative} Disable File Name Hyperlinks must be an HTTP Request node.`);
  }
  if (formatNode.parameters?.authentication !== 'predefinedCredentialType' || formatNode.parameters?.nodeCredentialType !== 'googleSheetsOAuth2Api') {
    fail(`${relative} Disable File Name Hyperlinks must use the Google Sheets OAuth credential type.`);
  }

  const spreadsheetId = appendLogNode?.parameters?.documentId?.value;
  const expectedUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  if (formatNode.parameters?.url !== expectedUrl) {
    fail(`${relative} Disable File Name Hyperlinks url must match the Append KB Ingestion Log spreadsheet ID.`);
  }

  let formatBody = null;
  try {
    formatBody = JSON.parse(String(formatNode.parameters?.jsonBody || ''));
  } catch (error) {
    fail(`${relative} Disable File Name Hyperlinks jsonBody is not valid JSON: ${error.message}`);
  }

  const repeatCell = formatBody?.requests?.[0]?.repeatCell;
  const range = repeatCell?.range || {};
  const userEnteredFormat = repeatCell?.cell?.userEnteredFormat || {};
  const fields = String(repeatCell?.fields || '');
  if (range.sheetId !== 0 || range.startRowIndex !== 1 || range.startColumnIndex !== 1 || range.endColumnIndex !== 2) {
    fail(`${relative} Disable File Name Hyperlinks must target kb_ingestion file_name cells only.`);
  }
  if (userEnteredFormat.hyperlinkDisplayType !== 'PLAIN_TEXT') {
    fail(`${relative} Disable File Name Hyperlinks must set hyperlinkDisplayType to PLAIN_TEXT.`);
  }
  if (userEnteredFormat.numberFormat?.type !== 'TEXT') {
    fail(`${relative} Disable File Name Hyperlinks must set file_name numberFormat to TEXT.`);
  }
  if (!fields.includes('userEnteredFormat.hyperlinkDisplayType') || !fields.includes('userEnteredFormat.numberFormat')) {
    fail(`${relative} Disable File Name Hyperlinks must update hyperlinkDisplayType and numberFormat fields.`);
  }
}

function compareVersion(a, b) {
  const aParts = String(a).split('.').map((part) => Number.parseInt(part, 10));
  const bParts = String(b).split('.').map((part) => Number.parseInt(part, 10));
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const aPart = Number.isFinite(aParts[index]) ? aParts[index] : 0;
    const bPart = Number.isFinite(bParts[index]) ? bParts[index] : 0;
    if (aPart !== bPart) return aPart - bPart;
  }

  return 0;
}

function checkCurrentNodeTypeVersions(workflow, relative) {
  for (const node of workflow.nodes || []) {
    const currentVersion = currentNodeTypeVersions[node.type];
    if (!currentVersion) {
      continue;
    }

    if (node.typeVersion === undefined || node.typeVersion === null) {
      fail(`${relative} node "${node.name}" is missing typeVersion; expected ${currentVersion} for ${node.type}.`);
      continue;
    }

    if (compareVersion(node.typeVersion, currentVersion) < 0) {
      fail(`${relative} node "${node.name}" uses ${node.type} typeVersion ${node.typeVersion}; update to ${currentVersion}.`);
    }
  }
}

function hasConnection(workflow, sourceName, outputIndex, targetName) {
  const output = workflow.connections?.[sourceName]?.main?.[outputIndex];
  return Array.isArray(output) && output.some((connection) => connection.node === targetName);
}

function findWorkflowNode(workflow, nodeName) {
  return (workflow.nodes || []).find((node) => node.name === nodeName);
}

function findAssignment(node, assignmentName) {
  return node?.parameters?.assignments?.assignments?.find((entry) => entry?.name === assignmentName);
}

function usesSgtDisplayTimestamp(value) {
  const text = String(value || '');
  return (
    text.includes('yyyy-MM-dd HH:mm:ss') &&
    text.includes('SGT') &&
    !text.includes('toISO()') &&
    !text.includes('+08:00')
  );
}

function checkCustomerSupportAgentFallback(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - RAG Customer Support Agent') {
    return;
  }

  const agentNode = findWorkflowNode(workflow, 'SpaceKonceptRental AI Agent');
  if (!agentNode) {
    fail(`${relative} is missing SpaceKonceptRental AI Agent.`);
    return;
  }

  if (agentNode.onError !== 'continueErrorOutput') {
    fail(`${relative} must route AI/RAG failures using onError: continueErrorOutput on "SpaceKonceptRental AI Agent".`);
  }

  const requiredNodes = [
    ['Build Agent Failure Fallback', 'n8n-nodes-base.set'],
    ['Upsert Conversation Failed', 'n8n-nodes-base.googleSheets'],
    ['Send Fallback Reply', '@n8n/n8n-nodes-langchain.chat'],
  ];

  for (const [nodeName, expectedType] of requiredNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    if (!node) {
      fail(`${relative} is missing fallback node "${nodeName}".`);
      continue;
    }
    if (node.type !== expectedType) {
      fail(`${relative} fallback node "${nodeName}" has type ${JSON.stringify(node.type)}; expected ${expectedType}.`);
    }
  }

  if (!hasConnection(workflow, 'SpaceKonceptRental AI Agent', 1, 'Build Agent Failure Fallback')) {
    fail(`${relative} must connect the AI Agent error output to "Build Agent Failure Fallback".`);
  }

  if (!hasConnection(workflow, 'Build Agent Failure Fallback', 0, 'Upsert Conversation Failed')) {
    fail(`${relative} must update the conversation row on the agent fallback path.`);
  }

  if (!hasConnection(workflow, 'Build Agent Failure Fallback', 0, 'Send Fallback Reply')) {
    fail(`${relative} must send a customer fallback reply on the agent fallback path.`);
  }

  const fallbackLogNode = findWorkflowNode(workflow, 'Upsert Conversation Failed');
  const fallbackValues = fallbackLogNode?.parameters?.columns?.value || {};
  if (fallbackValues.status !== 'failed') {
    fail(`${relative} fallback conversation log must write status "failed".`);
  }
  if (!String(fallbackValues.needs_escalation || '').includes('needs_escalation')) {
    fail(`${relative} fallback conversation log must preserve needs_escalation from the fallback row.`);
  }
}

function checkCustomerSupportAgentDedupeAndResponseMode(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - RAG Customer Support Agent') {
    return;
  }

  const triggerNode = findWorkflowNode(workflow, 'When Chat Message Received');
  if (!triggerNode) {
    fail(`${relative} is missing When Chat Message Received.`);
  } else if (triggerNode.parameters?.options?.responseMode !== 'responseNodes') {
    fail(`${relative} Chat Trigger must set options.responseMode to "responseNodes" because the workflow uses Chat response nodes.`);
  } else if (Number(triggerNode.typeVersion || 0) < 1.3) {
    fail(`${relative} Chat Trigger must use typeVersion 1.3 or newer so the responseNodes mode is supported and preserved by n8n.`);
  } else if (triggerNode.parameters?.mode === 'webhook') {
    fail(`${relative} Chat Trigger must use Hosted Chat mode when Chat response nodes are present.`);
  }

  const lookupNode = findWorkflowNode(workflow, 'Lookup Conversation State');
  if (!lookupNode) {
    fail(`${relative} is missing Lookup Conversation State.`);
    return;
  }

  if (lookupNode.type !== 'n8n-nodes-base.googleSheets') {
    fail(`${relative} Lookup Conversation State must use the Google Sheets node.`);
  }

  if ((lookupNode.parameters?.operation || 'read') !== 'read') {
    fail(`${relative} Lookup Conversation State must read the conversation log before the processing guard.`);
  }

  const filters = Array.isArray(lookupNode.parameters?.filtersUI?.values)
    ? lookupNode.parameters.filtersUI.values
    : [];
  const hasSessionFilter = filters.some((filter) =>
    filter?.lookupColumn === 'session_id' &&
    String(filter?.lookupValue || '').includes('session_id')
  );
  const hasProcessingStatusFilter = filters.some((filter) =>
    filter?.lookupColumn === 'status' &&
    String(filter?.lookupValue || '') === 'processing'
  );

  if (!hasSessionFilter || !hasProcessingStatusFilter) {
    fail(`${relative} Lookup Conversation State must filter by session_id and status=processing before the wait reply guard.`);
  }

  if (lookupNode.parameters?.combineFilters !== 'AND') {
    fail(`${relative} Lookup Conversation State must combine session_id and processing status filters with AND.`);
  }

  if (lookupNode.parameters?.options?.returnFirstMatch === true) {
    fail(`${relative} Lookup Conversation State must return all same-session processing rows so the freshest active row can be selected.`);
  }

  if (lookupNode.alwaysOutputData !== true) {
    fail(`${relative} Lookup Conversation State must keep alwaysOutputData true so new messages can continue when no row is found.`);
  }

  const selectorNode = findWorkflowNode(workflow, 'Select Active Processing Row');
  const selectorCode = String(selectorNode?.parameters?.jsCode || '');
  if (!selectorNode) {
    fail(`${relative} is missing Select Active Processing Row.`);
  } else if (
    !selectorCode.includes('maxProcessingAgeMs') ||
    !selectorCode.includes('2 * 60 * 1000') ||
    !selectorCode.includes('active_processing') ||
    !selectorCode.includes('sort((a, b) => b.startedAt - a.startedAt)')
  ) {
    fail(`${relative} Select Active Processing Row must choose the freshest processing row inside the guard window.`);
  }

  const lookupTargets = workflow.connections?.['Lookup Conversation State']?.main?.[0] || [];
  const selectorTargets = workflow.connections?.['Select Active Processing Row']?.main?.[0] || [];
  if (!lookupTargets.some((target) => target?.node === 'Select Active Processing Row')) {
    fail(`${relative} Lookup Conversation State must feed Select Active Processing Row.`);
  }
  if (!selectorTargets.some((target) => target?.node === 'Already Processing or Completed?')) {
    fail(`${relative} Select Active Processing Row must feed Already Processing or Completed?.`);
  }

  const gateNode = findWorkflowNode(workflow, 'Already Processing or Completed?');
  const gateConditions = gateNode?.parameters?.conditions || {};
  const gateConditionsText = JSON.stringify(gateConditions);
  if (!gateNode) {
    fail(`${relative} is missing Already Processing or Completed?.`);
  } else {
    const gatesOnActiveProcessing = gateConditionsText.includes('active_processing') &&
      gateConditionsText.includes('"true"') &&
      gateConditionsText.includes('"operation":"equals"');

    if (!gatesOnActiveProcessing || gateConditions?.combinator !== 'and') {
      fail(`${relative} Already Processing or Completed? must only block when Select Active Processing Row sets active_processing=true.`);
    }
  }

  const duplicateReplyNode = findWorkflowNode(workflow, 'Duplicate Safe Reply');
  const duplicateReplyMessage = String(duplicateReplyNode?.parameters?.message || '').toLowerCase();
  if (!duplicateReplyNode) {
    fail(`${relative} is missing Duplicate Safe Reply.`);
  } else if (!duplicateReplyMessage.includes('still working') || !duplicateReplyMessage.includes('previous message')) {
    fail(`${relative} Duplicate Safe Reply must ask the user to wait while the previous message is still processing.`);
  }

  const redactNode = findWorkflowNode(workflow, 'Redact PII for Logs');
  const redactCode = String(redactNode?.parameters?.jsCode || '');
  if (!redactCode.includes('dedupe_key') || !redactCode.includes('hashText')) {
    fail(`${relative} Redact PII for Logs must build a hashed dedupe_key for audit logging.`);
  }

  const conversationLogNodes = [
    'Upsert Conversation Processing',
    'Upsert Conversation Completed',
    'Upsert Conversation Failed',
  ];

  for (const nodeName of conversationLogNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    const values = node?.parameters?.columns?.value || {};
    const schema = Array.isArray(node?.parameters?.columns?.schema) ? node.parameters.columns.schema : [];
    const dedupeSchema = schema.find((entry) => entry?.id === 'dedupe_key');

    for (const key of Object.keys(values)) {
      if (key.trim() === 'dedupe_key' && key !== 'dedupe_key') {
        fail(`${relative} ${nodeName} must write to "dedupe_key" without trailing spaces.`);
      }
    }
    for (const entry of schema) {
      if (
        (typeof entry?.id === 'string' && entry.id.trim() === 'dedupe_key' && entry.id !== 'dedupe_key') ||
        (typeof entry?.displayName === 'string' && entry.displayName.trim() === 'dedupe_key' && entry.displayName !== 'dedupe_key')
      ) {
        fail(`${relative} ${nodeName} schema must use "dedupe_key" without trailing spaces.`);
      }
    }

    if (!String(values.dedupe_key || '').includes('dedupe_key')) {
      fail(`${relative} ${nodeName} must write dedupe_key to the conversations sheet.`);
    }

    if (!dedupeSchema || dedupeSchema.type !== 'string') {
      fail(`${relative} ${nodeName} must include a string schema entry for dedupe_key.`);
    }
  }
}

function checkCustomerSupportAgentLoggingContract(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - RAG Customer Support Agent') {
    return;
  }

  const normaliseNode = findWorkflowNode(workflow, 'Normalise Input');
  const messageIdAssignment = findAssignment(normaliseNode, 'message_id');
  const timestampAssignment = findAssignment(normaliseNode, 'timestamp');
  if (!String(messageIdAssignment?.value || '').includes('SKR-MSG-')) {
    fail(`${relative} Normalise Input must create readable SKR-MSG message IDs when chat input has no message id.`);
  }
  if (!String(timestampAssignment?.value || '').includes("setZone('Asia/Singapore')") || !usesSgtDisplayTimestamp(timestampAssignment?.value)) {
    fail(`${relative} Normalise Input timestamp must use display SGT format like 2026-05-17 15:17:46 SGT.`);
  }

  const redactNode = findWorkflowNode(workflow, 'Redact PII for Logs');
  const redactCode = String(redactNode?.parameters?.jsCode || '');
  if (redactCode.includes('[redacted-email]') || redactCode.includes('[redacted-phone]')) {
    fail(`${relative} Redact PII for Logs must preserve operational customer email and phone values in support logs.`);
  }
  if (!redactCode.includes('[redacted-nric-fin]')) {
    fail(`${relative} Redact PII for Logs must still redact high-risk NRIC/FIN values.`);
  }

  const parserNode = findWorkflowNode(workflow, 'Parse Strict JSON Response');
  const parserCode = String(parserNode?.parameters?.jsCode || '');
  for (const requiredSnippet of [
    'sgtTimestamp',
    "' SGT'",
    'driveFileUrl',
    'sourceUrls',
    'parsed.lead?.name',
    'parsed.ticket?.name',
    'escalation_reference_id',
    'const leadCaptured = !ticketRequired',
    'const bookingRequested = !ticketRequired',
    'const leadRequired = leadCaptured || bookingRequested',
    'const ticketReady = ticketRequired',
    'ticket_ready: ticketReady',
    'ticket_id: ticketId',
  ]) {
    if (!parserCode.includes(requiredSnippet)) {
      fail(`${relative} Parse Strict JSON Response must include ${requiredSnippet} for logging normalization.`);
    }
  }
  if (parserCode.includes('sgtIso') || parserCode.includes('+08:00') || !parserCode.includes('completed_at: sgtTimestamp(now)')) {
    fail(`${relative} Parse Strict JSON Response completed_at must use display SGT format, not ISO +08:00.`);
  }

  const failureNode = findWorkflowNode(workflow, 'Build Agent Failure Fallback');
  const failureCompletedAt = findAssignment(failureNode, 'completed_at');
  if (!usesSgtDisplayTimestamp(failureCompletedAt?.value)) {
    fail(`${relative} Build Agent Failure Fallback completed_at must use display SGT format like 2026-05-17 15:17:46 SGT.`);
  }

  const activeProcessingNode = findWorkflowNode(workflow, 'Select Active Processing Row');
  const activeProcessingCode = String(activeProcessingNode?.parameters?.jsCode || '');
  if (!activeProcessingCode.includes('parseSgtTimestamp') || !activeProcessingCode.includes('Date.UTC')) {
    fail(`${relative} Select Active Processing Row must parse display SGT timestamps before applying the processing lock window.`);
  }

  const agentNode = findWorkflowNode(workflow, 'SpaceKonceptRental AI Agent');
  const systemMessage = String(agentNode?.parameters?.options?.systemMessage || '');
  if (!systemMessage.includes('ticket-only complaint or support cases') || !systemMessage.includes('do not set lead_captured to true')) {
    fail(`${relative} SpaceKonceptRental AI Agent must keep ticket-only complaints out of lead capture.`);
  }

  const leadBranch = findWorkflowNode(workflow, 'Lead or Booking Required?');
  const leadBranchConditions = JSON.stringify(leadBranch?.parameters?.conditions || {});
  if (!leadBranchConditions.includes('ticket_required') || !leadBranchConditions.includes('lead_captured') || !leadBranchConditions.includes('booking_requested')) {
    fail(`${relative} Lead or Booking Required? must exclude ticket-only requests before routing to the leads sheet.`);
  }

  const ticketBranch = findWorkflowNode(workflow, 'Ticket Required?');
  const ticketBranchConditions = JSON.stringify(ticketBranch?.parameters?.conditions || {});
  if (!ticketBranchConditions.includes('ticket_ready')) {
    fail(`${relative} Ticket Required? must wait for actionable ticket details before routing to the tickets sheet.`);
  }

  const outputParserNode = findWorkflowNode(workflow, 'Agent Structured Output Parser');
  let schema = null;
  try {
    schema = JSON.parse(String(outputParserNode?.parameters?.inputSchema || '{}'));
  } catch (error) {
    fail(`${relative} Agent Structured Output Parser schema must be valid JSON: ${error.message}`);
  }
  const ticketRequired = schema?.properties?.ticket?.required || [];
  for (const field of ['name', 'email', 'phone']) {
    if (!ticketRequired.includes(field) || schema?.properties?.ticket?.properties?.[field]?.type !== 'string') {
      fail(`${relative} Agent Structured Output Parser ticket schema must expose ticket.${field}.`);
    }
  }

  const rawSheetsNodes = [
    'Upsert Conversation Processing',
    'Upsert Conversation Completed',
    'Upsert Conversation Failed',
    'Upsert Lead or Booking',
    'Upsert Ticket',
    'Upsert Unanswered Question',
  ];
  for (const nodeName of rawSheetsNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    if (node?.parameters?.options?.cellFormat !== 'RAW') {
      fail(`${relative} ${nodeName} must write Google Sheets values with RAW cellFormat so phone numbers beginning with + stay plain text.`);
    }
  }

  const notificationEdges = [
    ['Upsert Lead or Booking', 'Send Lead Notification'],
    ['Upsert Ticket', 'Send Ticket Notification'],
    ['Upsert Unanswered Question', 'Send Unanswered Notification'],
  ];
  for (const [sourceName, targetName] of notificationEdges) {
    const targetNode = findWorkflowNode(workflow, targetName);
    if (!targetNode) {
      fail(`${relative} is missing downstream notification node "${targetName}".`);
      continue;
    }
    if (targetNode.type !== 'n8n-nodes-base.gmail') {
      fail(`${relative} downstream notification node "${targetName}" must use Gmail.`);
    }
    if (!hasConnection(workflow, sourceName, 0, targetName)) {
      fail(`${relative} ${sourceName} must feed downstream notification node "${targetName}".`);
    }
  }

  const escalationNode = findWorkflowNode(workflow, 'Send Escalation Alert');
  const escalationMessage = String(escalationNode?.parameters?.message || '');
  if (!escalationMessage.includes('Reference ID') || !escalationMessage.includes('source_file_ids')) {
    fail(`${relative} Send Escalation Alert must include a useful reference id and source URL field.`);
  }
}

function checkRagIngestionLoggingContract(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - KB Ingestion to Pinecone') {
    return;
  }

  const prepareMetadataNode = findWorkflowNode(workflow, 'Prepare Chunk Metadata');
  for (const field of ['modified_time', 'ingested_at']) {
    const assignment = findAssignment(prepareMetadataNode, field);
    if (!usesSgtDisplayTimestamp(assignment?.value)) {
      fail(`${relative} Prepare Chunk Metadata ${field} must use display SGT format like 2026-05-17 15:17:46 SGT.`);
    }
  }

  const prepareLogNode = findWorkflowNode(workflow, 'Prepare Ingestion Log');
  const prepareLogCode = String(prepareLogNode?.parameters?.jsCode || '');
  if (!prepareLogCode.includes('singaporeTimestamp') || !prepareLogCode.includes(' SGT')) {
    fail(`${relative} Prepare Ingestion Log must write ingested_at in display SGT format.`);
  }
}

function validateWorkflow(context) {
  const { workflow, relative, fail: reportFailure } = context;
  activeFail = reportFailure;

  try {
    checkCountFieldsStayNumeric(workflow, relative);
    checkIngestionFileNamePlainText(workflow, relative);
    checkCurrentNodeTypeVersions(workflow, relative);
    checkCustomerSupportAgentFallback(workflow, relative);
    checkCustomerSupportAgentDedupeAndResponseMode(workflow, relative);
    checkCustomerSupportAgentLoggingContract(workflow, relative);
    checkRagIngestionLoggingContract(workflow, relative);
  } finally {
    activeFail = null;
  }
}

module.exports = {
  validateWorkflow,
};
