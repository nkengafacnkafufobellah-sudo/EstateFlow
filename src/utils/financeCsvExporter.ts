import { FinancialTransaction, PaymentReceipt, SupportedCurrency } from '../types';

export type AccountingSystemFormat =
  | 'standard-erp' // NetSuite, SAP, Sage Intacct, Microsoft Dynamics
  | 'quickbooks'   // QuickBooks Online / Desktop CSV format
  | 'xero'         // Xero Bank & Journal statement format
  | 'receipts-log';// Official Receipts & Treasury Register

export interface CsvExportOptions {
  format?: AccountingSystemFormat;
  scope?: 'filtered' | 'all' | 'settled-only' | 'pending-only';
  includeHeaders?: boolean;
  includeItemizedBreakdown?: boolean;
  includeCryptoHashes?: boolean;
  dateFormat?: 'iso' | 'standard'; // '2026-09-28' vs 'Sep 28, 2026'
  currencyFilter?: 'ALL' | SupportedCurrency;
}

export interface CsvExportResult {
  csvContent: string;
  filename: string;
  recordCount: number;
  totalGrossUSD: number;
  currencyBreakdown: Record<string, number>;
}

/**
 * Proper RFC-4180 cell escaping
 * Wraps in quotes if contains delimiter, quotes, or newlines, and escapes internal quotes.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats date into ISO YYYY-MM-DD or standard display
 */
export function formatExportDate(dateStr: string, format: 'iso' | 'standard' = 'iso'): string {
  if (!dateStr) return '';
  if (format === 'standard') return dateStr;

  // Try parsing common formats like 'Sep 28, 2026' or '2026-09-28'
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  const match = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (match) {
    const m = months[match[1]] || '01';
    const d = match[2].padStart(2, '0');
    const y = match[3];
    return `${y}-${m}-${d}`;
  }

  // Already ISO or other format
  return dateStr;
}

/**
 * Derives property name based on unit if not explicitly available
 */
export function inferPropertyName(unit: string): string {
  if (unit.includes('2A')) return 'Maple Court';
  if (unit.includes('3B')) return 'Cedar Row';
  if (unit.includes('5A')) return 'Willow Flats';
  if (unit.includes('1A') || unit.includes('1C')) return 'Highland Heights';
  return 'Oak Residence';
}

/**
 * Filter transactions based on chosen export options
 */
export function filterTransactionsForExport(
  transactions: FinancialTransaction[],
  options: CsvExportOptions
): FinancialTransaction[] {
  return transactions.filter((t) => {
    // Currency filter
    if (options.scope === 'filtered' && options.currencyFilter && options.currencyFilter !== 'ALL') {
      if ((t.currency || 'USD') !== options.currencyFilter) return false;
    }

    // Status filter
    if (options.scope === 'settled-only') {
      return t.status === 'Settled' || t.reconciled;
    }
    if (options.scope === 'pending-only') {
      return t.status !== 'Settled' && !t.reconciled;
    }

    return true;
  });
}

/**
 * Builds CSV rows for Standard ERP / General Ledger (NetSuite, SAP, Sage)
 */
function buildStandardErpCsv(
  transactions: FinancialTransaction[],
  receiptsMap: Map<string, PaymentReceipt>,
  options: CsvExportOptions
): { headers: string[]; rows: string[][] } {
  const headers = [
    'Transaction_ID',
    'Posting_Date',
    'Posted_UTC',
    'Reference_Number',
    'Gateway_Reference',
    'Receipt_Number',
    'Reconciliation_Status',
    'Is_Reconciled',
    'Reconciled_At',
    'Reconciled_By',
    'Tenant_Name',
    'Unit',
    'Property_Name',
    'Payment_Method',
    'Masked_Account',
    'Gateway_Provider',
    'Currency',
    'Gross_Amount',
  ];

  if (options.includeItemizedBreakdown) {
    headers.push('Itemized_Rent', 'Itemized_Parking');
  }

  headers.push('Base_USD_Equivalent', 'Idempotency_Key', 'Webhook_Status', 'Is_Refunded');

  if (options.includeCryptoHashes) {
    headers.push('HMAC_Digital_Seal');
  }

  const rows = transactions.map((t) => {
    const rcpt = receiptsMap.get(t.id);
    const isReconciled = t.status === 'Settled' || t.reconciled;
    const cur = t.currency || 'USD';
    const grossAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
    const dateFormatted = formatExportDate(t.date, options.dateFormat);

    const row = [
      t.id,
      dateFormatted,
      t.postedUtc || '',
      t.reference,
      t.gatewayRef,
      rcpt?.receiptNumber || t.receiptNumber || 'N/A',
      isReconciled ? 'Settled & Reconciled' : t.status,
      isReconciled ? 'TRUE' : 'FALSE',
      t.reconciledAt || rcpt?.verifiedAt || (isReconciled ? t.postedUtc : ''),
      t.reconciledBy || rcpt?.verifiedBy || (isReconciled ? 'Automated Carrier/Bank Webhook Engine' : 'Pending Verification'),
      t.tenantName,
      t.unit,
      rcpt?.propertyName || inferPropertyName(t.unit),
      t.method,
      t.maskedMethod,
      t.gatewayId || 'direct_gateway',
      cur,
      grossAmount.toFixed(cur === 'CFA' ? 0 : 2),
    ];

    if (options.includeItemizedBreakdown) {
      row.push(
        (t.itemizedRent || grossAmount).toFixed(cur === 'CFA' ? 0 : 2),
        (t.itemizedParking || 0).toFixed(cur === 'CFA' ? 0 : 2)
      );
    }

    row.push(
      t.amount.toFixed(2),
      t.idempotencyKey,
      t.webhookStatus,
      t.refunded ? 'TRUE' : 'FALSE'
    );

    if (options.includeCryptoHashes) {
      row.push(rcpt?.verificationHash || 'N/A');
    }

    return row;
  });

  return { headers, rows };
}

/**
 * Builds CSV rows for QuickBooks Online / Desktop (Bank Feed & Sales Receipts)
 */
function buildQuickBooksCsv(
  transactions: FinancialTransaction[],
  receiptsMap: Map<string, PaymentReceipt>,
  options: CsvExportOptions
): { headers: string[]; rows: string[][] } {
  const headers = [
    'Date',
    'Transaction_Type',
    'Ref_Number',
    'Customer_Tenant',
    'Memo_Description',
    'Account_Category',
    'Class_Location',
    'Gross_Amount',
    'Currency',
    'Payment_Method',
    'External_Gateway_Ref',
    'Reconciled_Status',
  ];

  const rows = transactions.map((t) => {
    const rcpt = receiptsMap.get(t.id);
    const cur = t.currency || 'USD';
    const grossAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
    const isReconciled = t.status === 'Settled' || t.reconciled;
    const dateFormatted = formatExportDate(t.date, options.dateFormat);

    return [
      dateFormatted,
      'Receive Payment',
      t.reference,
      t.tenantName,
      `Rent payment for ${t.unit} via ${t.method} (Receipt #${rcpt?.receiptNumber || t.receiptNumber})`,
      'Rental Revenue:Lease Receipts',
      `${inferPropertyName(t.unit)} - ${t.unit}`,
      grossAmount.toFixed(cur === 'CFA' ? 0 : 2),
      cur,
      t.method,
      t.gatewayRef,
      isReconciled ? 'Cleared' : 'Uncleared',
    ];
  });

  return { headers, rows };
}

/**
 * Builds CSV rows for Xero Bank Import & Statement Feed
 */
function buildXeroCsv(
  transactions: FinancialTransaction[],
  receiptsMap: Map<string, PaymentReceipt>,
  options: CsvExportOptions
): { headers: string[]; rows: string[][] } {
  const headers = [
    '*Date',
    '*Amount',
    '*Payee',
    '*Description',
    '*Reference',
    'Check_Number',
    'Analysis_Code',
    'Currency_Code',
    'Reconciliation_State',
  ];

  const rows = transactions.map((t) => {
    const rcpt = receiptsMap.get(t.id);
    const cur = t.currency || 'USD';
    const grossAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
    const isReconciled = t.status === 'Settled' || t.reconciled;
    const dateFormatted = formatExportDate(t.date, 'iso'); // Xero mandates YYYY-MM-DD

    return [
      dateFormatted,
      grossAmount.toFixed(cur === 'CFA' ? 0 : 2),
      t.tenantName,
      `EstateFlow Rent Reconciliation - ${t.unit} (${t.maskedMethod})`,
      t.gatewayRef,
      rcpt?.receiptNumber || t.receiptNumber,
      inferPropertyName(t.unit),
      cur,
      isReconciled ? 'Reconciled' : 'Unreconciled',
    ];
  });

  return { headers, rows };
}

/**
 * Builds CSV rows for Receipts & Cash Treasury Register
 */
function buildReceiptsRegisterCsv(
  transactions: FinancialTransaction[],
  receiptsMap: Map<string, PaymentReceipt>,
  options: CsvExportOptions
): { headers: string[]; rows: string[][] } {
  const headers = [
    'Receipt_Number',
    'Issue_Date',
    'Verified_At',
    'Verified_By',
    'Tenant_Name',
    'Tenant_Email',
    'Unit',
    'Property_Name',
    'Gross_Paid',
    'Currency',
    'Base_USD',
    'Payment_Method',
    'Gateway_Ref',
    'HMAC_SHA256_Digital_Seal',
  ];

  const rows = transactions.map((t) => {
    const rcpt = receiptsMap.get(t.id);
    const cur = t.currency || 'USD';
    const grossAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
    const dateFormatted = formatExportDate(t.date, options.dateFormat);

    return [
      rcpt?.receiptNumber || t.receiptNumber,
      dateFormatted,
      t.reconciledAt || rcpt?.verifiedAt || (t.status === 'Settled' ? t.postedUtc : 'Unverified'),
      t.reconciledBy || rcpt?.verifiedBy || (t.status === 'Settled' ? 'Automated Carrier/Bank Webhook' : 'Pending Reconciler'),
      t.tenantName,
      rcpt?.tenantEmail || `${t.tenantName.toLowerCase().replace(/[^a-z]/g, '')}@domain.com`,
      t.unit,
      rcpt?.propertyName || inferPropertyName(t.unit),
      grossAmount.toFixed(cur === 'CFA' ? 0 : 2),
      cur,
      t.amount.toFixed(2),
      t.method,
      t.gatewayRef,
      rcpt?.verificationHash || 'hmac_sha256_pending_verification',
    ];
  });

  return { headers, rows };
}

/**
 * Generates the full CSV content and summary metrics for the given transactions and options.
 */
export function generateReconciliationCsv(
  transactions: FinancialTransaction[],
  receipts: PaymentReceipt[],
  options: CsvExportOptions = {}
): CsvExportResult {
  const format = options.format || 'standard-erp';
  const includeHeaders = options.includeHeaders !== false;

  // Filter transactions
  const exportTxns = filterTransactionsForExport(transactions, options);

  // Map receipts by transaction ID
  const receiptsMap = new Map<string, PaymentReceipt>();
  receipts.forEach((r) => {
    receiptsMap.set(r.transactionId, r);
  });

  let headers: string[] = [];
  let rows: string[][] = [];

  switch (format) {
    case 'quickbooks': {
      const built = buildQuickBooksCsv(exportTxns, receiptsMap, options);
      headers = built.headers;
      rows = built.rows;
      break;
    }
    case 'xero': {
      const built = buildXeroCsv(exportTxns, receiptsMap, options);
      headers = built.headers;
      rows = built.rows;
      break;
    }
    case 'receipts-log': {
      const built = buildReceiptsRegisterCsv(exportTxns, receiptsMap, options);
      headers = built.headers;
      rows = built.rows;
      break;
    }
    case 'standard-erp':
    default: {
      const built = buildStandardErpCsv(exportTxns, receiptsMap, options);
      headers = built.headers;
      rows = built.rows;
      break;
    }
  }

  // Build CSV text lines
  const lines: string[] = [];
  if (includeHeaders) {
    lines.push(headers.map(escapeCsvCell).join(','));
  }
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }

  const csvContent = lines.join('\r\n');

  // Compute metrics
  let totalGrossUSD = 0;
  const currencyBreakdown: Record<string, number> = {};

  exportTxns.forEach((t) => {
    totalGrossUSD += t.amount;
    const cur = t.currency || 'USD';
    const original = t.originalAmount !== undefined ? t.originalAmount : t.amount;
    currencyBreakdown[cur] = (currencyBreakdown[cur] || 0) + original;
  });

  // Compose standardized filename with timestamp
  const now = new Date();
  const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const scopeSuffix = options.currencyFilter && options.currencyFilter !== 'ALL' ? `-${options.currencyFilter}` : '';
  const filename = `estateflow-reconciliation-${format}${scopeSuffix}-${dateStamp}.csv`;

  return {
    csvContent,
    filename,
    recordCount: exportTxns.length,
    totalGrossUSD,
    currencyBreakdown,
  };
}

/**
 * Downloads the CSV string as a file using UTF-8 BOM so Microsoft Excel, LibreOffice,
 * and accounting imports correctly interpret special characters, accented letters, and symbols.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  // Prepend \uFEFF UTF-8 BOM
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
