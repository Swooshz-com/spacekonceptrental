import "server-only";

import type {
  AdminQuoteRequestCrmHandoffPacket,
  AdminQuoteRequestCrmHandoffPacketRecord
} from "./admin-quote-request-crm-handoff-packet-read";

export type AdminQuoteRequestHubSpotImportCsvResult =
  | {
      status: "generated";
      csv: string;
      filename: string;
      recordCount: number;
    }
  | {
      status: "invalid_packet";
    };

const csvHeaders = [
  "Quote Request ID",
  "Public Reference",
  "Created At",
  "Status",
  "Customer Name",
  "Customer Email",
  "Customer Phone",
  "Company Or Event Organisation",
  "Message Details",
  "Source Page Path",
  "Source Listing Slug",
  "CRM Provider",
  "Local CRM Sync Status"
] as const;

const formulaInjectionPattern = /^[=+\-@\t\r]/;

function safeCell(value: string | undefined) {
  const cell = value ?? "";
  const formulaSafeCell = formulaInjectionPattern.test(cell)
    ? `'${cell}`
    : cell;

  return `"${formulaSafeCell.replace(/"/g, '""')}"`;
}

function formatCsvRow(values: Array<string | undefined>) {
  return values.map(safeCell).join(",");
}

function isValidPacket(packet: AdminQuoteRequestCrmHandoffPacket) {
  return (
    packet.provider === "hubspot" &&
    packet.localCrmSyncStatus === "queued" &&
    Number.isInteger(packet.limit) &&
    packet.limit > 0 &&
    packet.limit <= 100 &&
    packet.recordCount === packet.records.length &&
    packet.records.length <= 100
  );
}

function recordToRow(record: AdminQuoteRequestCrmHandoffPacketRecord) {
  return [
    record.id,
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
  ];
}

function filenameTimestamp(generatedAt: string) {
  const date = new Date(generatedAt);
  const safeDate = Number.isNaN(date.getTime()) ? new Date(0) : date;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${safeDate.getUTCFullYear()}${pad(
    safeDate.getUTCMonth() + 1
  )}${pad(safeDate.getUTCDate())}-${pad(safeDate.getUTCHours())}${pad(
    safeDate.getUTCMinutes()
  )}${pad(safeDate.getUTCSeconds())}`;
}

export function generateAdminQuoteRequestHubSpotImportCsv(
  packet: AdminQuoteRequestCrmHandoffPacket
): AdminQuoteRequestHubSpotImportCsvResult {
  if (!isValidPacket(packet)) {
    return {
      status: "invalid_packet"
    };
  }

  const rows = [
    formatCsvRow([...csvHeaders]),
    ...packet.records.map((record) => formatCsvRow(recordToRow(record)))
  ];

  return {
    status: "generated",
    csv: `${rows.join("\r\n")}\r\n`,
    filename: `skr-hubspot-import-queued-enquiries-${filenameTimestamp(
      packet.generatedAt
    )}.csv`,
    recordCount: packet.records.length
  };
}
