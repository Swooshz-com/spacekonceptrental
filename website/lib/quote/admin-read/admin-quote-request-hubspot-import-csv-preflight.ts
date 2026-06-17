import "server-only";

import type {
  AdminQuoteRequestCrmHandoffPacket,
  AdminQuoteRequestCrmHandoffPacketRecord
} from "./admin-quote-request-crm-handoff-packet-read";
import { isAdminQuoteRequestHubSpotImportCsvFormulaRisk } from "./admin-quote-request-hubspot-import-csv";

export const adminQuoteRequestHubSpotImportCsvPreflightIssueTypes = [
  "missing_customer_name",
  "missing_customer_email",
  "invalid_customer_email",
  "missing_customer_phone",
  "duplicate_customer_email_in_batch",
  "duplicate_customer_phone_in_batch",
  "missing_message_details",
  "message_details_too_long",
  "missing_public_reference",
  "missing_created_at",
  "csv_formula_risk_sanitised",
  "missing_source_context"
] as const;

export type AdminQuoteRequestHubSpotImportCsvPreflightIssueType =
  (typeof adminQuoteRequestHubSpotImportCsvPreflightIssueTypes)[number];

export type AdminQuoteRequestHubSpotImportCsvPreflightIssueCounts = Record<
  AdminQuoteRequestHubSpotImportCsvPreflightIssueType,
  number
>;

export type AdminQuoteRequestHubSpotImportCsvPreflightRowIssue = {
  quoteRequestId: string;
  publicReference?: string;
  issueTypes: AdminQuoteRequestHubSpotImportCsvPreflightIssueType[];
  issueCount: number;
  exportable: boolean;
  formulaRiskCellCount: number;
};

export type AdminQuoteRequestHubSpotImportCsvPreflightReport = {
  generatedAt: string;
  provider: "hubspot";
  localCrmSyncStatus: "queued";
  limit: number;
  totalRecordCount: number;
  exportableRecordCount: number;
  needsReviewRecordCount: number;
  duplicateEmailCount: number;
  duplicatePhoneCount: number;
  formulaRiskCellCount: number;
  issueCountsByType: AdminQuoteRequestHubSpotImportCsvPreflightIssueCounts;
  rowIssues: AdminQuoteRequestHubSpotImportCsvPreflightRowIssue[];
};

const maxLimit = 100;
const messageDetailsLimit = 1000;
const invalidEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blockingIssueTypes = new Set<
  AdminQuoteRequestHubSpotImportCsvPreflightIssueType
>([
  "missing_customer_name",
  "missing_customer_email",
  "invalid_customer_email",
  "missing_customer_phone",
  "duplicate_customer_email_in_batch",
  "duplicate_customer_phone_in_batch",
  "missing_message_details",
  "message_details_too_long",
  "missing_public_reference",
  "missing_created_at"
]);

function normalize(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function normalizeEmail(value: string | undefined) {
  return normalize(value)?.toLowerCase();
}

function normalizePhone(value: string | undefined) {
  return normalize(value)?.replace(/\s+/g, " ");
}

function createIssueCounts(): AdminQuoteRequestHubSpotImportCsvPreflightIssueCounts {
  return adminQuoteRequestHubSpotImportCsvPreflightIssueTypes.reduce(
    (counts, issueType) => ({
      ...counts,
      [issueType]: 0
    }),
    {} as AdminQuoteRequestHubSpotImportCsvPreflightIssueCounts
  );
}

function countDuplicates(
  records: AdminQuoteRequestCrmHandoffPacketRecord[],
  getValue: (record: AdminQuoteRequestCrmHandoffPacketRecord) => string | undefined
) {
  const counts = new Map<string, number>();

  for (const record of records) {
    const value = getValue(record);

    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return counts;
}

function isDuplicate(value: string | undefined, counts: Map<string, number>) {
  return Boolean(value && (counts.get(value) ?? 0) > 1);
}

function countFormulaRiskCells(
  record: AdminQuoteRequestCrmHandoffPacketRecord
) {
  return [
    record.publicReference,
    record.createdAt,
    record.status,
    record.customerName,
    record.customerEmail,
    record.customerPhone,
    record.companyOrEventOrganisation,
    record.messageDetails,
    record.sourcePagePath,
    record.sourceListingSlug,
    record.futureProvider,
    record.localCrmSyncStatus
  ].filter(isAdminQuoteRequestHubSpotImportCsvFormulaRisk).length;
}

function getLimit(packet: AdminQuoteRequestCrmHandoffPacket) {
  return Number.isInteger(packet.limit) && packet.limit > 0
    ? Math.min(packet.limit, maxLimit)
    : Math.min(packet.records.length, maxLimit);
}

export function generateAdminQuoteRequestHubSpotImportCsvPreflight(
  packet: AdminQuoteRequestCrmHandoffPacket
): AdminQuoteRequestHubSpotImportCsvPreflightReport {
  const limit = getLimit(packet);
  const records = packet.records.slice(0, limit);
  const issueCountsByType = createIssueCounts();
  const duplicateEmails = countDuplicates(records, (record) =>
    normalizeEmail(record.customerEmail)
  );
  const duplicatePhones = countDuplicates(records, (record) =>
    normalizePhone(record.customerPhone)
  );
  const rowIssues: AdminQuoteRequestHubSpotImportCsvPreflightRowIssue[] = [];
  let exportableRecordCount = 0;
  let duplicateEmailCount = 0;
  let duplicatePhoneCount = 0;
  let formulaRiskCellCount = 0;

  for (const record of records) {
    const issueTypes: AdminQuoteRequestHubSpotImportCsvPreflightIssueType[] =
      [];
    const addIssue = (
      issueType: AdminQuoteRequestHubSpotImportCsvPreflightIssueType
    ) => {
      if (!issueTypes.includes(issueType)) {
        issueTypes.push(issueType);
      }

      issueCountsByType[issueType] += 1;
    };
    const customerEmail = normalizeEmail(record.customerEmail);
    const customerPhone = normalizePhone(record.customerPhone);

    if (!normalize(record.customerName)) {
      addIssue("missing_customer_name");
    }

    if (!customerEmail) {
      addIssue("missing_customer_email");
    } else if (!invalidEmailPattern.test(customerEmail)) {
      addIssue("invalid_customer_email");
    }

    if (!customerPhone) {
      addIssue("missing_customer_phone");
    }

    if (isDuplicate(customerEmail, duplicateEmails)) {
      addIssue("duplicate_customer_email_in_batch");
      duplicateEmailCount += 1;
    }

    if (isDuplicate(customerPhone, duplicatePhones)) {
      addIssue("duplicate_customer_phone_in_batch");
      duplicatePhoneCount += 1;
    }

    const messageDetails = normalize(record.messageDetails);

    if (!messageDetails) {
      addIssue("missing_message_details");
    } else if (messageDetails.length > messageDetailsLimit) {
      addIssue("message_details_too_long");
    }

    if (!normalize(record.publicReference)) {
      addIssue("missing_public_reference");
    }

    if (!normalize(record.createdAt)) {
      addIssue("missing_created_at");
    }

    if (!normalize(record.sourcePagePath) && !normalize(record.sourceListingSlug)) {
      addIssue("missing_source_context");
    }

    const rowFormulaRiskCellCount = countFormulaRiskCells(record);

    if (rowFormulaRiskCellCount > 0) {
      if (!issueTypes.includes("csv_formula_risk_sanitised")) {
        issueTypes.push("csv_formula_risk_sanitised");
      }

      issueCountsByType.csv_formula_risk_sanitised +=
        rowFormulaRiskCellCount;
      formulaRiskCellCount += rowFormulaRiskCellCount;
    }

    const exportable = !issueTypes.some((issueType) =>
      blockingIssueTypes.has(issueType)
    );

    if (exportable) {
      exportableRecordCount += 1;
    }

    if (issueTypes.length > 0) {
      rowIssues.push({
        quoteRequestId: record.id,
        ...(normalize(record.publicReference)
          ? { publicReference: normalize(record.publicReference) }
          : {}),
        issueTypes,
        issueCount:
          issueTypes.length +
          Math.max(0, rowFormulaRiskCellCount > 0 ? rowFormulaRiskCellCount - 1 : 0),
        exportable,
        formulaRiskCellCount: rowFormulaRiskCellCount
      });
    }
  }

  return {
    generatedAt: packet.generatedAt,
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit,
    totalRecordCount: records.length,
    exportableRecordCount,
    needsReviewRecordCount: rowIssues.length,
    duplicateEmailCount,
    duplicatePhoneCount,
    formulaRiskCellCount,
    issueCountsByType,
    rowIssues: [
      ...rowIssues.filter((rowIssue) => rowIssue.publicReference),
      ...rowIssues.filter((rowIssue) => !rowIssue.publicReference)
    ].slice(0, limit)
  };
}
