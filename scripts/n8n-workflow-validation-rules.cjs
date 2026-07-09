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
  'n8n-nodes-base.executeWorkflow': '1.3',
  'n8n-nodes-base.executeWorkflowTrigger': '1.1',
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
const PINECONE_KB_NAMESPACE = 'SpaceKonceptRental_kb';

function fail(message) {
  if (typeof activeFail !== 'function') {
    throw new Error(`Validation failure without active reporter: ${message}`);
  }
  activeFail(message);
}

function expressionReferencesPrepareIngestionLogField(expression, field) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\$node\\[["']Prepare Ingestion Log["']\\]\\.json\\.${escapedField}(?![A-Za-z0-9_])`).test(String(expression || ''));
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

function connectionTargets(workflow, sourceName, outputIndex) {
  const output = workflow.connections?.[sourceName]?.main?.[outputIndex];
  return Array.isArray(output) ? output.map((connection) => connection.node) : [];
}

function findWorkflowNode(workflow, nodeName) {
  return (workflow.nodes || []).find((node) => node.name === nodeName);
}

function nodeReceivesConnectionType(workflow, targetName, connectionType) {
  for (const connection of Object.values(workflow.connections || {})) {
    const groups = connection?.[connectionType];
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!Array.isArray(group)) continue;
      if (group.some((edge) => edge?.node === targetName)) return true;
    }
  }
  return false;
}

function findAssignment(node, assignmentName) {
  return node?.parameters?.assignments?.assignments?.find((entry) => entry?.name === assignmentName);
}

function requireCodeSnippets(relative, nodeName, code, snippets, message) {
  for (const snippet of snippets) {
    if (!code.includes(snippet)) {
      fail(`${relative} ${nodeName} ${message}`);
      return;
    }
  }
}

function usesSheetSafeField(value) {
  return /\bsheet_[a-z0-9_]+\b/.test(String(value || ''));
}

function requireSheetSafeColumns(workflow, relative, nodeName, columnNames) {
  const node = findWorkflowNode(workflow, nodeName);
  const values = node?.parameters?.columns?.value || {};
  for (const columnName of columnNames) {
    if (!usesSheetSafeField(values[columnName])) {
      fail(`${relative} ${nodeName} must write formula-hardened sheet fields.`);
      return;
    }
  }
}

function containsRawJsonField(message, fieldName) {
  const text = String(message || '');
  return text.includes(`$json.${fieldName}`) || text.includes(`.json.${fieldName}`);
}

function requireEscapedGmailHtml(workflow, relative, nodeName, unsafeFieldNames, requiredSafeFields = []) {
  const node = findWorkflowNode(workflow, nodeName);
  const message = String(node?.parameters?.message || '');
  for (const fieldName of unsafeFieldNames) {
    if (containsRawJsonField(message, fieldName)) {
      fail(`${relative} ${nodeName} must use escaped notification fields for Gmail HTML.`);
      return;
    }
  }
  for (const fieldName of requiredSafeFields) {
    if (!message.includes(fieldName)) {
      fail(`${relative} ${nodeName} must use escaped notification fields for Gmail HTML.`);
      return;
    }
  }
}

function requireSubjectSafeFields(workflow, relative, nodeName, unsafeFieldNames, requiredSubjectFields = []) {
  const node = findWorkflowNode(workflow, nodeName);
  const subject = String(node?.parameters?.subject || '');
  for (const fieldName of unsafeFieldNames) {
    if (containsRawJsonField(subject, fieldName)) {
      fail(`${relative} ${nodeName} subject must use bounded subject-safe fields.`);
      return;
    }
  }
  for (const fieldName of requiredSubjectFields) {
    if (!subject.includes(fieldName)) {
      fail(`${relative} ${nodeName} subject must use bounded subject-safe fields.`);
      return;
    }
  }
}

function requireTrustedBeforePassthrough(relative, node, fieldName, trustedSnippets, passthroughSnippets) {
  const value = String(findAssignment(node, fieldName)?.value || '');
  const trustedIndexes = trustedSnippets
    .map((snippet) => value.indexOf(snippet))
    .filter((index) => index >= 0);
  const passthroughIndexes = passthroughSnippets
    .map((snippet) => value.indexOf(snippet))
    .filter((index) => index >= 0);

  if (!trustedIndexes.length || !passthroughIndexes.length || Math.min(...trustedIndexes) > Math.min(...passthroughIndexes)) {
    fail(`${relative} Normalise Error Payload ${fieldName} must prefer trusted error handler fields before passthrough context.`);
  }
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
    ['Build Internal Error Context', 'n8n-nodes-base.set'],
    ['Notify Main Error Handler', 'n8n-nodes-base.executeWorkflow'],
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

  if (!hasConnection(workflow, 'SpaceKonceptRental AI Agent', 1, 'Build Internal Error Context')) {
    fail(`${relative} must connect the AI Agent error output to "Build Internal Error Context".`);
  }

  if (!hasConnection(workflow, 'Build Internal Error Context', 0, 'Notify Main Error Handler')) {
    fail(`${relative} must call the global error handler on the agent fallback path.`);
  }

  if (!hasConnection(workflow, 'Build Internal Error Context', 0, 'Send Fallback Reply')) {
    fail(`${relative} must send a customer fallback reply directly from the internal error context so Sheets cannot block the reply.`);
  }
  const fallbackReplyNode = findWorkflowNode(workflow, 'Send Fallback Reply');
  const fallbackNotifyNodeForLayout = findWorkflowNode(workflow, 'Notify Main Error Handler');
  if (
    Array.isArray(fallbackReplyNode?.position) &&
    Array.isArray(fallbackNotifyNodeForLayout?.position) &&
    Number(fallbackReplyNode.position[0]) <= Number(fallbackNotifyNodeForLayout.position[0])
  ) {
    fail(`${relative} Send Fallback Reply must stay visually to the right of Notify Main Error Handler because chat reply nodes park the execution.`);
  }

  const notifyNode = findWorkflowNode(workflow, 'Notify Main Error Handler');
  if (notifyNode?.parameters?.options?.waitForSubWorkflow !== false) {
    fail(`${relative} Notify Main Error Handler must set options.waitForSubWorkflow to false so the customer fallback reply is not blocked by ops logging.`);
  }
  if (notifyNode?.onError !== 'continueRegularOutput') {
    fail(`${relative} Notify Main Error Handler must use onError: continueRegularOutput so a handler failure does not block the customer fallback reply.`);
  }
  const fallbackTargets = connectionTargets(workflow, 'Build Internal Error Context', 0);
  if (fallbackTargets.includes('Notify Main Error Handler') && fallbackTargets.includes('Send Fallback Reply') && fallbackTargets[0] !== 'Notify Main Error Handler') {
    fail(`${relative} Notify Main Error Handler must stay before Send Fallback Reply in the exported fallback branch order.`);
  }
}

function checkPublicChatIsStateless(workflow, relative) {
  const hasPublicChatTrigger = (workflow.nodes || []).some((node) =>
    node.type === '@n8n/n8n-nodes-langchain.chatTrigger' &&
    node.parameters?.public === true
  );
  if (!hasPublicChatTrigger) {
    return;
  }

  const memoryBackedAgents = (workflow.nodes || [])
    .filter((node) =>
      node.type === '@n8n/n8n-nodes-langchain.agent' &&
      nodeReceivesConnectionType(workflow, node.name, 'ai_memory')
    )
    .map((node) => node.name);

  if (memoryBackedAgents.length > 0) {
    fail(`${relative} public Chat Trigger workflows must not connect AI Agent nodes to AI memory; remove persisted AI memory from ${memoryBackedAgents.join(', ')}.`);
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
    fail(`${relative} Lookup Conversation State must read the conversation log before debounce selection.`);
  }

  const filters = Array.isArray(lookupNode.parameters?.filtersUI?.values)
    ? lookupNode.parameters.filtersUI.values
    : [];
  const hasSessionFilter = filters.some((filter) =>
    filter?.lookupColumn === 'session_id' &&
    String(filter?.lookupValue || '').includes('session_id')
  );

  if (!hasSessionFilter) {
    fail(`${relative} Lookup Conversation State must filter by session_id before debounce selection.`);
  }

  if (filters.some((filter) => filter?.lookupColumn === 'status')) {
    fail(`${relative} Lookup Conversation State must not filter by status; debounce selection needs same-session queued and merged rows.`);
  }

  if (lookupNode.parameters?.options?.returnFirstMatch === true) {
    fail(`${relative} Lookup Conversation State must return all same-session rows so the debounce batch can be selected.`);
  }

  if (lookupNode.alwaysOutputData !== true) {
    fail(`${relative} Lookup Conversation State must keep alwaysOutputData true so new messages can continue when no row is found.`);
  }

  const debounceWaitNode = findWorkflowNode(workflow, 'Debounce Chat Batch');
  if (!debounceWaitNode) {
    fail(`${relative} is missing Debounce Chat Batch.`);
  } else if (
    debounceWaitNode.type !== 'n8n-nodes-base.wait' ||
    debounceWaitNode.parameters?.resume !== 'timeInterval' ||
    Number(debounceWaitNode.parameters?.amount || 0) < 5 ||
    String(debounceWaitNode.parameters?.unit || '') !== 'seconds'
  ) {
    fail(`${relative} Debounce Chat Batch must wait at least 5 seconds before reading same-session rows.`);
  }

  const selectorNode = findWorkflowNode(workflow, 'Select Debounced Chat Batch');
  const selectorCode = String(selectorNode?.parameters?.jsCode || '');
  if (!selectorNode) {
    fail(`${relative} is missing Select Debounced Chat Batch.`);
  } else if (
    !selectorCode.includes('debounceWindowMs') ||
    !selectorCode.includes('queued') ||
    !selectorCode.includes('merged') ||
    !selectorCode.includes('processing') ||
    !selectorCode.includes('debounce_superseded') ||
    !selectorCode.includes('merged_message_ids') ||
    !selectorCode.includes('executionOrder') ||
    !selectorCode.includes('Treat them as one customer turn')
  ) {
    fail(`${relative} Select Debounced Chat Batch must choose the newest rapid-fire message and merge same-session queued, merged, or processing rows.`);
  }

  const queueTargets = workflow.connections?.['Upsert Conversation Processing']?.main?.[0] || [];
  const waitTargets = workflow.connections?.['Debounce Chat Batch']?.main?.[0] || [];
  const lookupTargets = workflow.connections?.['Lookup Conversation State']?.main?.[0] || [];
  const selectorTargets = workflow.connections?.['Select Debounced Chat Batch']?.main?.[0] || [];
  if (!queueTargets.some((target) => target?.node === 'Debounce Chat Batch')) {
    fail(`${relative} Upsert Conversation Processing must feed Debounce Chat Batch.`);
  }
  if (!waitTargets.some((target) => target?.node === 'Lookup Conversation State')) {
    fail(`${relative} Debounce Chat Batch must feed Lookup Conversation State.`);
  }
  if (!lookupTargets.some((target) => target?.node === 'Select Debounced Chat Batch')) {
    fail(`${relative} Lookup Conversation State must feed Select Debounced Chat Batch.`);
  }
  if (!selectorTargets.some((target) => target?.node === 'Superseded by Newer Message?')) {
    fail(`${relative} Select Debounced Chat Batch must feed Superseded by Newer Message?.`);
  }

  const gateNode = findWorkflowNode(workflow, 'Superseded by Newer Message?');
  const gateConditions = gateNode?.parameters?.conditions || {};
  const gateConditionsText = JSON.stringify(gateConditions);
  if (!gateNode) {
    fail(`${relative} is missing Superseded by Newer Message?.`);
  } else {
    const gatesOnSuperseded = gateConditionsText.includes('debounce_superseded') &&
      gateConditionsText.includes('"true"') &&
      gateConditionsText.includes('"operation":"equals"');

    if (!gatesOnSuperseded || gateConditions?.combinator !== 'and') {
      fail(`${relative} Superseded by Newer Message? must only branch when Select Debounced Chat Batch sets debounce_superseded=true.`);
    }
  }

  const mergedLogNode = findWorkflowNode(workflow, 'Mark Conversation Merged');
  if (!mergedLogNode) {
    fail(`${relative} is missing Mark Conversation Merged.`);
  } else if (mergedLogNode.parameters?.columns?.value?.status !== 'merged') {
    fail(`${relative} Mark Conversation Merged must write status "merged" for older rapid-fire messages.`);
  } else if (String(mergedLogNode.parameters?.columns?.value?.bot_reply || '').includes('merged_into_latest_message')) {
    fail(`${relative} Mark Conversation Merged must not write an internal merge note as a bot reply.`);
  }

  if (findWorkflowNode(workflow, 'Send Debounce Merge Reply')) {
    fail(`${relative} must remove Send Debounce Merge Reply; merged rapid-fire messages should only be logged as merged, not answered separately.`);
  }
  if (hasConnection(workflow, 'Mark Conversation Merged', 0, 'Send Debounce Merge Reply')) {
    fail(`${relative} merged rapid-fire messages must not send a separate customer-facing debounce reply.`);
  }

  const processingLogNode = findWorkflowNode(workflow, 'Mark Conversation Processing');
  if (!processingLogNode) {
    fail(`${relative} is missing Mark Conversation Processing.`);
  } else if (processingLogNode.parameters?.columns?.value?.status !== 'processing') {
    fail(`${relative} Mark Conversation Processing must set the newest debounced row to status "processing" before AI/RAG runs.`);
  }

  const redactNode = findWorkflowNode(workflow, 'Redact PII for Logs');
  const redactCode = String(redactNode?.parameters?.jsCode || '');
  if (!redactCode.includes('dedupe_key') || !redactCode.includes('hashText')) {
    fail(`${relative} Redact PII for Logs must build a hashed dedupe_key for audit logging.`);
  }

  const conversationLogNodes = [
    'Upsert Conversation Processing',
    'Mark Conversation Processing',
    'Mark Conversation Merged',
    'Upsert Conversation Completed',
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

  for (const nodeName of ['Lookup Conversation State', 'Lookup Conversation Transcript']) {
    const node = findWorkflowNode(workflow, nodeName);
    if (
      node?.type !== 'n8n-nodes-base.googleSheets' ||
      node.retryOnFail !== true ||
      Number(node.maxTries || 0) < 5 ||
      Number(node.waitBetweenTries || 0) < 10000 ||
      node.alwaysOutputData !== true
    ) {
      fail(`${relative} ${nodeName} must tolerate short Google Sheets read-quota bursts with retryOnFail, at least 5 tries, at least 10s between tries, and alwaysOutputData.`);
    }
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
  const usesDisplayCompletedAt =
    parserCode.includes('completed_at: sgtTimestamp(now)') ||
    (parserCode.includes('const completedAt = sgtTimestamp(now)') && parserCode.includes('completed_at: completedAt'));
  if (parserCode.includes('sgtIso') || parserCode.includes('+08:00') || !usesDisplayCompletedAt) {
    fail(`${relative} Parse Strict JSON Response completed_at must use display SGT format, not ISO +08:00.`);
  }
  requireCodeSnippets(relative, 'Parse Strict JSON Response', parserCode, [
    'safeSheetValue',
    'missing_fields_text',
    'incomplete_ticket_followup',
    'ticketRequired && !ticketReady',
  ], 'must formula-harden sheet fields and expose incomplete-ticket follow-up state.');
  requireCodeSnippets(relative, 'Parse Strict JSON Response', parserCode, [
    'deriveUnansweredReason',
    'unanswered_required',
    'unanswered_reason',
    'handledByOwnerRoute',
    'unsupported_inventory',
    'out_of_scope',
    'no_kb_answer',
    'retrievalSummary.used_kb === false',
  ], 'must derive unanswered_required and unanswered_reason after structured output parsing.');

  const failureNode = findWorkflowNode(workflow, 'Build Internal Error Context');
  const failureCompletedAt = findAssignment(failureNode, 'completed_at');
  if (!usesSgtDisplayTimestamp(failureCompletedAt?.value)) {
    fail(`${relative} Build Internal Error Context completed_at must use display SGT format like 2026-05-17 15:17:46 SGT.`);
  }

  const activeProcessingNode = findWorkflowNode(workflow, 'Select Debounced Chat Batch');
  const activeProcessingCode = String(activeProcessingNode?.parameters?.jsCode || '');
  if (!activeProcessingCode.includes('parseSgtTimestamp') || !activeProcessingCode.includes('Date.UTC')) {
    fail(`${relative} Select Debounced Chat Batch must parse display SGT timestamps before applying the debounce window.`);
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

  const escalationBranch = findWorkflowNode(workflow, 'Needs Escalation?');
  const escalationBranchConditions = JSON.stringify(escalationBranch?.parameters?.conditions || {});
  for (const field of ['needs_escalation', 'incomplete_ticket_followup', 'lead_captured', 'booking_requested', 'ticket_ready', 'confidence', 'unknown', 'unanswered_required']) {
    if (!escalationBranchConditions.includes(field)) {
      fail(`${relative} Needs Escalation? must avoid duplicate alerts for lead, booking, ticket, and unanswered follow-up emails.`);
      break;
    }
  }
  if (escalationBranchConditions.includes('ticket_required).toLowerCase() !==') || !escalationBranchConditions.includes('incomplete_ticket_followup')) {
    fail(`${relative} Needs Escalation? must allow incomplete escalated support tickets to reach human notifications.`);
  }

  const unansweredBranch = findWorkflowNode(workflow, 'Unanswered or Low Confidence?');
  const unansweredBranchConditions = JSON.stringify(unansweredBranch?.parameters?.conditions || {});
  if (!unansweredBranchConditions.includes('unanswered_required')) {
    fail(`${relative} Unanswered or Low Confidence? must check unanswered_required before relying on confidence or unknown intent.`);
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
    'Mark Conversation Processing',
    'Mark Conversation Merged',
    'Upsert Conversation Completed',
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
  requireCodeSnippets(relative, 'Redact PII for Logs', redactCode, [
    'safeSheetValue',
    'sheet_user_message_redacted',
    'sheet_session_id',
  ], 'must prepare formula-hardened fields for queued conversation logs.');
  requireCodeSnippets(relative, 'Select Debounced Chat Batch', activeProcessingCode, [
    'safeSheetValue',
    'sheet_user_message_redacted',
    'withSheetFields',
  ], 'must keep formula-hardened fields when rapid messages are merged.');
  requireSheetSafeColumns(workflow, relative, 'Upsert Conversation Processing', [
    'conversation_ref',
    'channel',
    'customer_name',
    'customer_email',
    'customer_phone',
    'user_message_redacted',
    'execution_id',
    'created_at',
    'dedupe_key',
    'message_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Mark Conversation Processing', [
    'conversation_ref',
    'channel',
    'customer_name',
    'customer_email',
    'customer_phone',
    'user_message_redacted',
    'execution_id',
    'created_at',
    'dedupe_key',
    'message_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Mark Conversation Merged', [
    'conversation_ref',
    'channel',
    'customer_name',
    'customer_email',
    'customer_phone',
    'user_message_redacted',
    'execution_id',
    'created_at',
    'dedupe_key',
    'message_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Upsert Conversation Completed', [
    'conversation_ref',
    'channel',
    'customer_name',
    'customer_email',
    'customer_phone',
    'user_message_redacted',
    'bot_reply',
    'intent',
    'ticket_id',
    'source_titles',
    'source_file_ids',
    'execution_id',
    'created_at',
    'completed_at',
    'dedupe_key',
    'message_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Upsert Lead or Booking', [
    'conversation_ref',
    'name',
    'email',
    'phone',
    'company',
    'rental_purpose',
    'rental_start_date',
    'rental_duration',
    'items_needed',
    'delivery_area',
    'budget',
    'status',
    'source_channel',
    'conversation_transcript',
    'created_at',
    'execution_id',
    'lead_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Upsert Ticket', [
    'conversation_ref',
    'name',
    'email',
    'phone',
    'category',
    'summary',
    'details',
    'conversation_transcript',
    'urgency',
    'status',
    'created_at',
    'execution_id',
    'ticket_id',
    'session_id',
  ]);
  requireSheetSafeColumns(workflow, relative, 'Upsert Unanswered Question', [
    'conversation_ref',
    'user_message_redacted',
    'reason',
    'intent',
    'source_titles',
    'conversation_transcript',
    'created_at',
    'execution_id',
    'id',
    'session_id',
  ]);

  for (const nodeName of ['Upsert Conversation Processing', 'Mark Conversation Processing', 'Mark Conversation Merged', 'Upsert Conversation Completed']) {
    const node = findWorkflowNode(workflow, nodeName);
    if (!node?.parameters?.columns?.value?.conversation_ref) {
      fail(`${relative} ${nodeName} must write conversation_ref so lead rows can be traced back to the session.`);
    }
  }

  const followUpRows = [
    ['Set Lead or Booking Row', 'Upsert Lead or Booking'],
    ['Set Ticket Row', 'Upsert Ticket'],
    ['Set Unanswered Row', 'Upsert Unanswered Question'],
  ];
  for (const [setNodeName, upsertNodeName] of followUpRows) {
    const setNode = findWorkflowNode(workflow, setNodeName);
    if (!findAssignment(setNode, 'conversation_ref') || !findAssignment(setNode, 'conversation_transcript')) {
      fail(`${relative} ${setNodeName} must include conversation_ref and conversation_transcript for human-friendly follow-up tracing.`);
    }

    const upsertNode = findWorkflowNode(workflow, upsertNodeName);
    const upsertValues = upsertNode?.parameters?.columns?.value || {};
    if (!upsertValues.conversation_ref || !upsertValues.conversation_transcript) {
      fail(`${relative} ${upsertNodeName} must persist conversation_ref and conversation_transcript.`);
    }
  }
  const unansweredReasonAssignment = findAssignment(findWorkflowNode(workflow, 'Set Unanswered Row'), 'reason');
  if (!String(unansweredReasonAssignment?.value || '').includes('unanswered_reason')) {
    fail(`${relative} Set Unanswered Row must persist the deterministic unanswered_reason when present.`);
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

  const transcriptLookupNode = findWorkflowNode(workflow, 'Lookup Conversation Transcript');
  if (!transcriptLookupNode || transcriptLookupNode.type !== 'n8n-nodes-base.googleSheets') {
    fail(`${relative} must look up the session transcript before notification routing.`);
  }
  if (!hasConnection(workflow, 'Upsert Conversation Completed', 0, 'Lookup Conversation Transcript')) {
    fail(`${relative} Upsert Conversation Completed must feed Lookup Conversation Transcript.`);
  }
  if (!hasConnection(workflow, 'Lookup Conversation Transcript', 0, 'Build Notification Context')) {
    fail(`${relative} Lookup Conversation Transcript must feed Build Notification Context.`);
  }

  const notificationContextNode = findWorkflowNode(workflow, 'Build Notification Context');
  const notificationContextCode = String(notificationContextNode?.parameters?.jsCode || '');
  if (!notificationContextCode.includes('conversation_ref') || !notificationContextCode.includes('conversation_transcript_text') || !notificationContextCode.includes('conversation_transcript_html') || !notificationContextCode.includes('notification_summary_html')) {
    fail(`${relative} Build Notification Context must prepare formatted email summary and transcript fields.`);
  }
  requireCodeSnippets(relative, 'Build Notification Context', notificationContextCode, [
    'MAX_TRANSCRIPT_ROWS',
    'MAX_TRANSCRIPT_CHARS',
    '[Transcript truncated]',
    'safe_conversation_transcript_html',
    'safe_notification_summary_html',
    'safeSubjectText',
    'subject_escalation_intent',
    'subject_lead_name',
    'subject_ticket_summary',
    'subject_unanswered_reference',
    'safe_unanswered_reason',
    'sheet_unanswered_reason',
    'original.unanswered_reason',
    'safeSheetValue',
    'escapeHtml',
  ], 'must bound transcript rows and characters and prepare safe notification fields.');
  const finalResponseNote = findWorkflowNode(workflow, 'Final chat response group');
  const finalResponseNoteContent = String(finalResponseNote?.parameters?.content || '');
  if (
    finalResponseNote?.type !== 'n8n-nodes-base.stickyNote' ||
    !finalResponseNoteContent.includes('FINAL CHAT RESPONSE') ||
    !finalResponseNoteContent.includes('park the execution')
  ) {
    fail(`${relative} must keep a Final chat response sticky note explaining why chat reply nodes stay visually after routing.`);
  }
  for (const targetName of ['Lead or Booking Required?', 'Ticket Required?', 'Needs Escalation?', 'Unanswered or Low Confidence?']) {
    if (!hasConnection(workflow, 'Build Notification Context', 0, targetName)) {
      fail(`${relative} Build Notification Context must feed ${targetName} so notification emails include transcript context.`);
    }
  }
  if (hasConnection(workflow, 'Parse Strict JSON Response', 0, 'Send Customer Reply')) {
    fail(`${relative} Send Customer Reply must not run directly after Parse Strict JSON Response because chat reply nodes park executions in waiting before logging branches finish.`);
  }
  if (!hasConnection(workflow, 'Build Notification Context', 0, 'Send Customer Reply')) {
    fail(`${relative} Build Notification Context must feed Send Customer Reply after completion logging and follow-up routing are prepared.`);
  }
  const notificationTargets = connectionTargets(workflow, 'Build Notification Context', 0);
  if (notificationTargets.includes('Send Customer Reply') && notificationTargets[0] !== 'Send Customer Reply') {
    fail(`${relative} Send Customer Reply must be the first exported Build Notification Context branch so n8n executes Sheet logging and notification routing before the chat execution waits.`);
  }

  const escalationNode = findWorkflowNode(workflow, 'Send Escalation Alert');
  const escalationMessage = String(escalationNode?.parameters?.message || '');
  if (!escalationMessage.includes('safe_notification_summary_html') || !escalationMessage.includes('safe_conversation_transcript_html') || !escalationMessage.includes('safe_source_file_ids')) {
    fail(`${relative} Send Escalation Alert must include summary, source URLs, and session transcript context.`);
  }
  requireEscapedGmailHtml(workflow, relative, 'Send Escalation Alert', [
    'conversation_ref',
    'user_message_redacted',
    'reply',
    'source_titles',
    'source_file_ids',
    'missing_fields_text',
  ], [
    'safe_notification_summary_html',
    'safe_user_message_redacted',
    'safe_reply',
    'safe_missing_fields',
    'safe_conversation_transcript_html',
  ]);
  requireSubjectSafeFields(workflow, relative, 'Send Escalation Alert', [
    'intent',
    'escalation_reference_id',
    'ticket_id',
    'lead_id',
    'message_id',
  ], ['subject_escalation_intent', 'subject_escalation_reference']);

  for (const nodeName of ['Send Lead Notification', 'Send Ticket Notification', 'Send Unanswered Notification']) {
    const emailNode = findWorkflowNode(workflow, nodeName);
    const message = String(emailNode?.parameters?.message || '');
    if (!message.includes('Build Notification Context') || !message.includes('safe_conversation_transcript_html')) {
      fail(`${relative} ${nodeName} must include the formatted session transcript from Build Notification Context.`);
    }
  }
  requireEscapedGmailHtml(workflow, relative, 'Send Lead Notification', [
    'conversation_ref',
    'name',
    'email',
    'phone',
    'company',
    'items_needed',
    'rental_purpose',
    'delivery_area',
    'budget',
  ], ['safe_conversation_ref', 'safe_lead_name', 'safe_conversation_transcript_html']);
  requireSubjectSafeFields(workflow, relative, 'Send Lead Notification', [
    'name',
    'items_needed',
    'rental_purpose',
    'lead_id',
  ], ['subject_lead_name', 'subject_lead_items', 'subject_lead_reference']);
  requireEscapedGmailHtml(workflow, relative, 'Send Ticket Notification', [
    'conversation_ref',
    'name',
    'email',
    'phone',
    'category',
    'urgency',
    'summary',
    'details',
  ], ['safe_conversation_ref', 'safe_ticket_summary', 'safe_conversation_transcript_html']);
  requireSubjectSafeFields(workflow, relative, 'Send Ticket Notification', [
    'urgency',
    'summary',
    'ticket_id',
  ], ['subject_ticket_urgency', 'subject_ticket_summary', 'subject_ticket_reference']);
  requireEscapedGmailHtml(workflow, relative, 'Send Unanswered Notification', [
    'conversation_ref',
    'reason',
    'user_message_redacted',
    'source_titles',
  ], ['safe_notification_summary_html', 'safe_conversation_ref', 'safe_user_message_redacted', 'safe_conversation_transcript_html']);
  requireSubjectSafeFields(workflow, relative, 'Send Unanswered Notification', [
    'intent',
    'id',
  ], ['subject_unanswered_intent', 'subject_unanswered_reference']);
}

function checkGlobalErrorHandlerContract(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - Global Error Handler') {
    return;
  }

  const workflowFailureNode = findWorkflowNode(workflow, 'Workflow Failure');
  if (workflowFailureNode?.type !== 'n8n-nodes-base.errorTrigger') {
    fail(`${relative} is missing Workflow Failure Error Trigger.`);
  }

  const internalFailureNode = findWorkflowNode(workflow, 'Internal Failure Intake');
  if (internalFailureNode?.type !== 'n8n-nodes-base.executeWorkflowTrigger') {
    fail(`${relative} is missing Internal Failure Intake Execute Workflow Trigger.`);
  } else if (internalFailureNode.parameters?.inputSource !== 'passthrough') {
    fail(`${relative} Internal Failure Intake must accept all data passed by customer workflows.`);
  }

  if (!hasConnection(workflow, 'Workflow Failure', 0, 'Normalise Error Payload')) {
    fail(`${relative} Workflow Failure must feed Normalise Error Payload.`);
  }
  if (!hasConnection(workflow, 'Internal Failure Intake', 0, 'Normalise Error Payload')) {
    fail(`${relative} Internal Failure Intake must feed Normalise Error Payload.`);
  }

  const normaliseNode = findWorkflowNode(workflow, 'Normalise Error Payload');
  for (const [field, trustedSnippets, passthroughSnippets] of [
    ['workflow_name', ['$json.workflow?.name', '$json.trigger?.workflow?.name'], ['$json.workflow_name']],
    ['error_message', ['$json.execution?.error?.message', '$json.trigger?.error?.message'], ['$json.agent_error_message', '$json.error_message']],
    ['contact_id', ['$json.execution?.id', '$json.trigger?.execution?.id'], ['$json.contact_id', '$json.conversation_ref', '$json.message_id']],
    ['error_type', ['$json.execution?.mode', '$json.trigger?.mode'], ['$json.error_type']],
    ['execution_url', ['$json.execution?.url'], ['$json.execution_url', '$json.error_link']],
  ]) {
    requireTrustedBeforePassthrough(relative, normaliseNode, field, trustedSnippets, passthroughSnippets);
  }

  if (!hasConnection(workflow, 'Normalise Error Payload', 0, 'Build Safe Error Alert Context')) {
    fail(`${relative} Normalise Error Payload must feed Build Safe Error Alert Context before logging or emailing.`);
  }
  if (!hasConnection(workflow, 'Build Safe Error Alert Context', 0, 'Append Failure Log')) {
    fail(`${relative} Build Safe Error Alert Context must feed Append Failure Log.`);
  }
  if (!hasConnection(workflow, 'Build Safe Error Alert Context', 0, 'Send Failure Alert')) {
    fail(`${relative} Build Safe Error Alert Context must feed Send Failure Alert.`);
  }

  const safeContextNode = findWorkflowNode(workflow, 'Build Safe Error Alert Context');
  if (safeContextNode?.type !== 'n8n-nodes-base.code') {
    fail(`${relative} Build Safe Error Alert Context must be a Code node.`);
  } else {
    const safeContextCode = String(safeContextNode.parameters?.jsCode || '');
    requireCodeSnippets(relative, 'Build Safe Error Alert Context', safeContextCode, [
      'escapeHtml',
      'safeSheetValue',
      'safeSubjectText',
      'subject_workflow_name',
      'subject_error_type',
      'safe_error_message',
      'sheet_error_message',
      'sheet_payload_json',
    ], 'must escape Gmail fields and formula-harden Sheets fields.');
  }

  for (const nodeName of ['Append Failure Log', 'Send Failure Alert']) {
    const node = findWorkflowNode(workflow, nodeName);
    if (node?.onError !== 'continueRegularOutput') {
      fail(`${relative} ${nodeName} must use onError: continueRegularOutput so one ops channel does not block the other.`);
    }
  }
  const appendLogNode = findWorkflowNode(workflow, 'Append Failure Log');
  if (appendLogNode?.parameters?.options?.cellFormat !== 'RAW') {
    fail(`${relative} Append Failure Log must write Google Sheets values with RAW cellFormat so formula-hardened strings stay literal.`);
  }
  requireSheetSafeColumns(workflow, relative, 'Append Failure Log', [
    'logged_date',
    'logged_time',
    'contact_id',
    'error_type',
    'error_message',
    'error_workflow_name',
    'last_node_executed',
    'execution_id',
    'execution_url',
    'payload_json',
  ]);
  requireEscapedGmailHtml(workflow, relative, 'Send Failure Alert', [
    'logged_date',
    'logged_time',
    'contact_id',
    'workflow_name',
    'error_type',
    'error_message',
    'last_node_executed',
    'execution_id',
    'execution_url',
  ], [
    'safe_error_time',
    'safe_contact_id',
    'safe_workflow_name',
    'safe_error_message',
    'safe_execution_url',
  ]);
  requireSubjectSafeFields(workflow, relative, 'Send Failure Alert', [
    'workflow_name',
    'error_type',
  ], ['subject_workflow_name', 'subject_error_type']);
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

function checkRagIngestionDataPlaneSafety(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - KB Ingestion to Pinecone') {
    return;
  }

  const prepareMetadataNode = findWorkflowNode(workflow, 'Prepare Chunk Metadata');
  const namespaceAssignment = findAssignment(prepareMetadataNode, 'namespace');
  const contentHashAssignment = findAssignment(prepareMetadataNode, 'content_sha256');
  const ingestionKeyAssignment = findAssignment(prepareMetadataNode, 'ingestion_key');
  if (namespaceAssignment?.value !== PINECONE_KB_NAMESPACE) {
    fail(`${relative} RAG ingestion Pinecone operations must explicitly use namespace ${PINECONE_KB_NAMESPACE}.`);
  }
  if (!String(contentHashAssignment?.value || '').includes('content_sha256')) {
    fail(`${relative} Prepare Chunk Metadata must preserve content_sha256 from downloaded file content.`);
  }
  if (!String(ingestionKeyAssignment?.value || '').includes('source_file_id') && !String(ingestionKeyAssignment?.value || '').includes('fileId')) {
    fail(`${relative} Prepare Chunk Metadata must build ingestion_key from stable source file keys.`);
  }
  if (String(ingestionKeyAssignment?.value || '').includes('modifiedTime') ||
    String(ingestionKeyAssignment?.value || '').includes('modified_time')) {
    fail(`${relative} Prepare Chunk Metadata ingestion_key must not use Google Drive modifiedTime; use content_sha256 for content-based idempotency.`);
  }
  if (!String(ingestionKeyAssignment?.value || '').includes('content_sha256')) {
    fail(`${relative} Prepare Chunk Metadata ingestion_key must include content_sha256 for content-based idempotency.`);
  }
  if (!String(ingestionKeyAssignment?.value || '').includes(PINECONE_KB_NAMESPACE)) {
    fail(`${relative} Prepare Chunk Metadata ingestion_key must include namespace ${PINECONE_KB_NAMESPACE}.`);
  }

  const contentHashNode = findWorkflowNode(workflow, 'Compute Content Hash');
  const contentHashCode = String(contentHashNode?.parameters?.jsCode || '');
  if (contentHashCode.includes("require('crypto')") ||
    contentHashCode.includes('require("crypto")') ||
    contentHashCode.includes("from 'crypto'") ||
    contentHashCode.includes('from "crypto"')) {
    fail(`${relative} Compute Content Hash must not use the crypto module because n8n Code nodes disallow it.`);
  }
  requireCodeSnippets(relative, 'Compute Content Hash', contentHashCode, [
    'getBinaryDataBuffer',
    'sha256Hex',
    'content_sha256',
    'binary: item.binary',
  ], 'must hash downloaded binary content before metadata preparation.');

  const insertNode = findWorkflowNode(workflow, 'Insert Chunks into Pinecone');
  if (insertNode?.type !== '@n8n/n8n-nodes-langchain.vectorStorePinecone' || insertNode.parameters?.mode !== 'insert') {
    fail(`${relative} Insert Chunks into Pinecone must remain a Pinecone insert node.`);
  }
  const insertNamespace = String(insertNode?.parameters?.options?.pineconeNamespace || '');
  if (!insertNamespace.includes(PINECONE_KB_NAMESPACE)) {
    fail(`${relative} RAG ingestion Pinecone operations must explicitly use namespace ${PINECONE_KB_NAMESPACE}.`);
  }

  const deletePrepNode = findWorkflowNode(workflow, 'Prepare Pinecone Delete Request');
  const deletePrepCode = String(deletePrepNode?.parameters?.jsCode || '');
  if (!deletePrepCode.includes(`const PINECONE_KB_NAMESPACE = '${PINECONE_KB_NAMESPACE}'`) ||
    !deletePrepCode.includes('namespace: PINECONE_KB_NAMESPACE')) {
    fail(`${relative} RAG ingestion Pinecone operations must explicitly use namespace ${PINECONE_KB_NAMESPACE}.`);
  }
  if (deletePrepCode.includes('$or') && deletePrepCode.includes('source_file_id') && deletePrepCode.includes('source_file_name')) {
    fail(`${relative} Prepare Pinecone Delete Request must prefer source_file_id and must not combine source_file_name fallback with source_file_id using $or.`);
  }
  requireCodeSnippets(relative, 'Prepare Pinecone Delete Request', deletePrepCode, [
    'filter = { source_file_id: { $eq: fileId } };',
    'filenameFallbackReviewed',
    'filter = { source_file_name: { $eq: fileName } };',
    'Filename fallback requires filename_fallback_reviewed=true',
  ], 'must prefer source_file_id and allow filename fallback only after manual uniqueness review.');

  const deleteNode = findWorkflowNode(workflow, 'Delete Existing Pinecone File Chunks');
  const neverError = deleteNode?.parameters?.options?.response?.response?.neverError;
  if (neverError === true) {
    fail(`${relative} Delete Existing Pinecone File Chunks must not set neverError true because it bypasses retryOnFail for 429 and 5xx responses.`);
  }
  if (deleteNode?.retryOnFail !== true || Number(deleteNode?.maxTries || 0) < 3) {
    fail(`${relative} Delete Existing Pinecone File Chunks must keep retryOnFail with at least 3 tries.`);
  }
  if (deleteNode?.onError !== 'continueRegularOutput') {
    fail(`${relative} Delete Existing Pinecone File Chunks must continue to Restore Pinecone Ingestion Context after retries so allowed 404 Namespace not found responses can be handled explicitly.`);
  }

  const restoreNode = findWorkflowNode(workflow, 'Restore Pinecone Ingestion Context');
  const restoreCode = String(restoreNode?.parameters?.jsCode || '');
  requireCodeSnippets(relative, 'Restore Pinecone Ingestion Context', restoreCode, [
    'result.error',
    'error.description',
    'Namespace not found',
    'statusCode >= 200 && statusCode < 300',
    'throw new Error(`Pinecone delete failed',
  ], 'must classify Pinecone delete responses after retry-safe HTTP handling.');

  const historicalLookupNode = findWorkflowNode(workflow, 'Lookup KB Ingestion Log');
  if (historicalLookupNode) {
    fail(`${relative} RAG ingestion must not dedupe from append-only kb_ingestion history; use kb_current_state current-state rows instead.`);
  }

  const lookupNode = findWorkflowNode(workflow, 'Lookup KB Current State');
  if (!lookupNode ||
    lookupNode.type !== 'n8n-nodes-base.googleSheets' ||
    (lookupNode.parameters?.operation || 'read') !== 'read') {
    fail(`${relative} RAG ingestion must lookup kb_current_state by file_id and namespace before Pinecone cleanup.`);
    return;
  }

  const lookupSheetName = [
    lookupNode.parameters?.sheetName?.value,
    lookupNode.parameters?.sheetName?.cachedResultName,
  ].map((value) => String(value || '')).join(' ');
  if (!lookupSheetName.includes('kb_current_state')) {
    fail(`${relative} Lookup KB Current State must read the kb_current_state sheet/table, not append-only kb_ingestion history.`);
  }

  const lookupFilters = Array.isArray(lookupNode.parameters?.filtersUI?.values)
    ? lookupNode.parameters.filtersUI.values
    : [];
  const hasFileIdFilter = lookupFilters.some((filter) =>
    filter?.lookupColumn === 'file_id' &&
    String(filter?.lookupValue || '').includes('source_file_id')
  );
  const hasNamespaceFilter = lookupFilters.some((filter) =>
    filter?.lookupColumn === 'namespace' &&
    String(filter?.lookupValue || '').includes(PINECONE_KB_NAMESPACE)
  );
  const hasHistoricalIngestionKeyFilter = lookupFilters.some((filter) =>
    filter?.lookupColumn === 'ingestion_key'
  );
  if (!hasFileIdFilter || !hasNamespaceFilter || hasHistoricalIngestionKeyFilter || lookupNode.parameters?.combineFilters === 'OR') {
    fail(`${relative} RAG ingestion must lookup kb_current_state by file_id and namespace before Pinecone cleanup.`);
  }
  if (lookupNode.alwaysOutputData !== true) {
    fail(`${relative} Lookup KB Current State must keep alwaysOutputData true so new files continue when no current-state row exists.`);
  }

  const selectorNode = findWorkflowNode(workflow, 'Select Changed KB File');
  const selectorCode = String(selectorNode?.parameters?.jsCode || '');
  if (selectorCode.includes('rowModifiedTime') ||
    selectorCode.includes('sourceModifiedTime') ||
    selectorCode.includes('row.modified_time') ||
    selectorCode.includes('source.modified_time')) {
    fail(`${relative} Select Changed KB File must not use modified_time for dedupe; ingestion_key must be content-hash based.`);
  }
  if (selectorCode.includes('matchesCompletedIngestion') ||
    selectorCode.includes('lookupRows.some') ||
    selectorCode.includes('kb_ingestion')) {
    fail(`${relative} Select Changed KB File must not skip from historical kb_ingestion matches; compare only the current kb_current_state row.`);
  }
  requireCodeSnippets(relative, 'Select Changed KB File', selectorCode, [
    "$items('Prepare Chunk Metadata')",
    'currentStateRows',
    'matchesCurrentState',
    'current_ingestion_key',
    'ingestion_key',
    'source_file_id',
    "status === 'completed'",
    'rows.length > 1',
    'return changedItems;',
  ], 'must drop unchanged files only when the single current-state row proves the current indexed ingestion key matches.');

  if (!hasConnection(workflow, 'Download KB File', 0, 'Compute Content Hash') ||
    !hasConnection(workflow, 'Compute Content Hash', 0, 'Prepare Chunk Metadata') ||
    !hasConnection(workflow, 'Prepare Chunk Metadata', 0, 'Lookup KB Current State') ||
    !hasConnection(workflow, 'Lookup KB Current State', 0, 'Select Changed KB File') ||
    !hasConnection(workflow, 'Select Changed KB File', 0, 'Resolve Pinecone Index Host')) {
    fail(`${relative} RAG ingestion must lookup kb_current_state by file_id and namespace before Pinecone cleanup.`);
  }
  if (hasConnection(workflow, 'Download KB File', 0, 'Prepare Chunk Metadata')) {
    fail(`${relative} RAG ingestion must compute content_sha256 between Download KB File and Prepare Chunk Metadata.`);
  }
  if (hasConnection(workflow, 'Prepare Chunk Metadata', 0, 'Resolve Pinecone Index Host')) {
    fail(`${relative} RAG ingestion must not bypass the dedupe lookup before Pinecone cleanup.`);
  }

  const currentStateNode = findWorkflowNode(workflow, 'Upsert KB Current State');
  const currentStateValues = currentStateNode?.parameters?.columns?.value || {};
  const currentStateMatchingColumns = currentStateNode?.parameters?.columns?.matchingColumns || [];
  const currentStateSheetName = [
    currentStateNode?.parameters?.sheetName?.value,
    currentStateNode?.parameters?.sheetName?.cachedResultName,
  ].map((value) => String(value || '')).join(' ');
  if (!currentStateNode ||
    currentStateNode.type !== 'n8n-nodes-base.googleSheets' ||
    currentStateNode.parameters?.operation !== 'appendOrUpdate' ||
    !currentStateSheetName.includes('kb_current_state') ||
    !currentStateMatchingColumns.includes('file_id') ||
    !currentStateMatchingColumns.includes('namespace')) {
    fail(`${relative} Upsert KB Current State must appendOrUpdate kb_current_state by file_id and namespace after successful Pinecone insert.`);
  }
  for (const [field, source] of Object.entries({
    file_id: 'file_id',
    file_name: 'file_name',
    namespace: 'namespace',
    current_content_sha256: 'content_sha256',
    current_ingestion_key: 'ingestion_key',
    last_successful_execution_id: 'execution_id',
    last_indexed_at: 'ingested_at',
    status: 'status',
    chunks_count: 'chunks_count',
    modified_time: 'modified_time',
    file_url: 'file_url',
  })) {
    if (!expressionReferencesPrepareIngestionLogField(currentStateValues[field], source)) {
      fail(`${relative} Upsert KB Current State must persist ${field} from ${source} via Prepare Ingestion Log.`);
    }
  }
  if (currentStateNode?.parameters?.options?.cellFormat !== 'RAW') {
    fail(`${relative} Upsert KB Current State must set options.cellFormat to RAW so Drive file names stay literal in kb_current_state.`);
  }
  if (!hasConnection(workflow, 'Append KB Ingestion Log', 0, 'Upsert KB Current State')) {
    fail(`${relative} Upsert KB Current State must run after successful Pinecone insert and audit append.`);
  }

  const appendLogNode = findWorkflowNode(workflow, 'Append KB Ingestion Log');
  const appendValues = appendLogNode?.parameters?.columns?.value || {};
  const prepareLogNode = findWorkflowNode(workflow, 'Prepare Ingestion Log');
  const prepareLogCode = String(prepareLogNode?.parameters?.jsCode || '');
  if (!prepareLogCode.includes("$items('Select Changed KB File')")) {
    fail(`${relative} Prepare Ingestion Log must read deduped Select Changed KB File metadata so unchanged replays do not append log rows.`);
  }
  if (!prepareLogCode.includes('content_sha256') ||
    !String(appendValues.content_sha256 || '').includes('content_sha256')) {
    fail(`${relative} Append KB Ingestion Log must persist content_sha256 for content-based RAG dedupe auditing.`);
  }
  if (!String(appendValues.modified_time || '').includes('modified_time') ||
    !String(appendValues.ingestion_key || '').includes('ingestion_key')) {
    fail(`${relative} Append KB Ingestion Log must persist modified_time and ingestion_key for RAG audit history.`);
  }
}

function checkEnquiryHandoffReadinessTemplate(workflow, relative, text) {
  if (workflow.name !== 'SpaceKonceptRental - Enquiry Handoff Readiness Template') {
    return;
  }

  const requiredNodes = [
    ['Receive SKR Enquiry Handoff', 'n8n-nodes-base.webhook'],
    ['Validate SKR Contract Markers', 'n8n-nodes-base.set'],
    ['Are Required SKR Markers Present', 'n8n-nodes-base.if'],
    ['Manual HMAC And Idempotency Gate', 'n8n-nodes-base.set'],
    ['Build Internal Handoff Summary', 'n8n-nodes-base.set'],
    ['Send Internal Handoff Placeholder', 'n8n-nodes-base.set'],
    ['Respond Manual Setup Required', 'n8n-nodes-base.respondToWebhook'],
    ['Respond Accepted After Email Handoff', 'n8n-nodes-base.respondToWebhook'],
    ['Respond Invalid Contract', 'n8n-nodes-base.respondToWebhook'],
  ];

  for (const [nodeName, expectedType] of requiredNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    if (!node) {
      fail(`${relative} is missing enquiry handoff node "${nodeName}".`);
      continue;
    }
    if (node.type !== expectedType) {
      fail(`${relative} enquiry handoff node "${nodeName}" has type ${JSON.stringify(node.type)}; expected ${expectedType}.`);
    }
  }

  if (workflow.active !== false) {
    fail(`${relative} enquiry handoff readiness template must stay inactive.`);
  }

  if ('staticData' in workflow || 'pinData' in workflow) {
    fail(`${relative} enquiry handoff readiness template must not include staticData, pinData, execution data, or production payloads.`);
  }

  for (const node of workflow.nodes || []) {
    if (node.credentials) {
      fail(`${relative} enquiry handoff readiness template must not include credential bindings on node "${node.name}".`);
    }
    if (node.webhookId) {
      fail(`${relative} enquiry handoff readiness template must not include webhookId values.`);
    }
  }

  const requiredMarkers = [
    'skr.enquiry.submitted',
    'x-skr-event',
    'x-skr-enquiry-reference',
    'x-skr-idempotency-key',
    'x-skr-timestamp',
    'x-skr-signature',
    'HMAC SHA-256',
    '<timestamp>.<raw body>',
    'manual_required_before_activation',
    'SKR_ENQUIRY_HANDOFF_WEBHOOK_PATH_PLACEHOLDER',
  ];

  for (const marker of requiredMarkers) {
    if (!text.includes(marker)) {
      fail(`${relative} enquiry handoff readiness template must reference ${marker}.`);
    }
  }

  if (/https?:\/\//i.test(text)) {
    fail(`${relative} enquiry handoff readiness template must not contain webhook URLs or other real-looking URLs.`);
  }

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) {
    fail(`${relative} enquiry handoff readiness template must not contain real recipient email addresses.`);
  }

  if (hasConnection(workflow, 'Send Internal Handoff Placeholder', 0, 'Respond Accepted After Email Handoff')) {
    fail(`${relative} enquiry handoff readiness template must not route the placeholder email step to a fake accepted response.`);
  }

  if (!hasConnection(workflow, 'Send Internal Handoff Placeholder', 0, 'Respond Manual Setup Required')) {
    fail(`${relative} enquiry handoff readiness template must route the placeholder email step to Respond Manual Setup Required.`);
  }

  const setupResponse = findWorkflowNode(workflow, 'Respond Manual Setup Required');
  const setupResponseText = JSON.stringify(setupResponse?.parameters || {});
  if (!setupResponseText.includes('not_implemented') || !setupResponseText.includes('503')) {
    fail(`${relative} Respond Manual Setup Required must return a non-success setup-required response until manual n8n work is complete.`);
  }
}

function validateWorkflow(context) {
  const { workflow, relative, text, fail: reportFailure } = context;
  activeFail = reportFailure;

  try {
    checkCountFieldsStayNumeric(workflow, relative);
    checkIngestionFileNamePlainText(workflow, relative);
    checkCurrentNodeTypeVersions(workflow, relative);
    checkCustomerSupportAgentFallback(workflow, relative);
    checkPublicChatIsStateless(workflow, relative);
    checkCustomerSupportAgentDedupeAndResponseMode(workflow, relative);
    checkCustomerSupportAgentLoggingContract(workflow, relative);
    checkGlobalErrorHandlerContract(workflow, relative);
    checkRagIngestionLoggingContract(workflow, relative);
    checkRagIngestionDataPlaneSafety(workflow, relative);
    checkEnquiryHandoffReadinessTemplate(workflow, relative, text);
  } finally {
    activeFail = null;
  }
}

module.exports = {
  validateWorkflow,
};
