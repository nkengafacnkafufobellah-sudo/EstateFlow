import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  Check,
  Copy,
  X,
  ExternalLink,
  Layers,
  Database,
  Building2,
  DollarSign,
  FileCheck,
  CheckCircle2,
  Filter,
  Eye,
  Code2,
} from 'lucide-react';
import { FinancialTransaction, PaymentReceipt, SupportedCurrency } from '../types';
import {
  AccountingSystemFormat,
  CsvExportOptions,
  generateReconciliationCsv,
  downloadCsvFile,
} from '../utils/financeCsvExporter';
import { useCurrency } from '../context/CurrencyContext';

interface FinanceCsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: FinancialTransaction[];
  receipts: PaymentReceipt[];
  activeCurrencyFilter: 'ALL' | SupportedCurrency;
  onExportSuccess?: (summary: { recordCount: number; filename: string; format: string }) => void;
}

export const FinanceCsvExportModal: React.FC<FinanceCsvExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  receipts,
  activeCurrencyFilter,
  onExportSuccess,
}) => {
  const { formatAmount } = useCurrency();

  const [selectedFormat, setSelectedFormat] = useState<AccountingSystemFormat>('standard-erp');
  const [selectedScope, setSelectedScope] = useState<'filtered' | 'all' | 'settled-only' | 'pending-only'>(
    activeCurrencyFilter !== 'ALL' ? 'filtered' : 'all'
  );
  const [dateFormat, setDateFormat] = useState<'iso' | 'standard'>('iso');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [includeItemized, setIncludeItemized] = useState<boolean>(true);
  const [includeCryptoHashes, setIncludeCryptoHashes] = useState<boolean>(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'table' | 'raw'>('table');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Generate CSV data dynamically based on active configuration
  const exportResult = useMemo(() => {
    const options: CsvExportOptions = {
      format: selectedFormat,
      scope: selectedScope,
      currencyFilter: activeCurrencyFilter,
      dateFormat,
      includeHeaders,
      includeItemizedBreakdown: includeItemized,
      includeCryptoHashes,
    };

    return generateReconciliationCsv(transactions, receipts, options);
  }, [
    transactions,
    receipts,
    selectedFormat,
    selectedScope,
    activeCurrencyFilter,
    dateFormat,
    includeHeaders,
    includeItemized,
    includeCryptoHashes,
  ]);

  if (!isOpen) return null;

  // Split lines for preview
  const csvLines = exportResult.csvContent.split('\r\n');
  const headerLine = csvLines[0] || '';
  const dataLines = csvLines.slice(1);
  const parsedHeaders = headerLine
    .split(',')
    .map((h) => h.replace(/^"|"$/g, ''));
  const parsedDataRows = dataLines
    .slice(0, 5)
    .filter(Boolean)
    .map((line) => {
      // Basic split respecting double quotes
      const row: string[] = [];
      let inQuotes = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          row.push(current);
          current = '';
        } else {
          current += c;
        }
      }
      row.push(current);
      return row;
    });

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportResult.csvContent);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy CSV:', err);
    }
  };

  const handleDownload = () => {
    downloadCsvFile(exportResult.csvContent, exportResult.filename);
    if (onExportSuccess) {
      onExportSuccess({
        recordCount: exportResult.recordCount,
        filename: exportResult.filename,
        format: selectedFormat,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-stone-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  Accounting & ERP Export
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  RFC-4180 + UTF-8 BOM
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mt-1">
                Export Reconciliations (CSV)
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Download verified transactions and settlement balances formatted for external general ledger and accounting systems.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Format Selector Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              1. Select Accounting System Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Option 1: Standard ERP */}
              <button
                type="button"
                onClick={() => setSelectedFormat('standard-erp')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'standard-erp'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-900 text-xs">
                    Standard ERP / GL
                  </span>
                  {selectedFormat === 'standard-erp' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  NetSuite, SAP, Sage, MS Dynamics. Complete audit trail & itemized accounts.
                </p>
              </button>

              {/* Option 2: QuickBooks */}
              <button
                type="button"
                onClick={() => setSelectedFormat('quickbooks')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'quickbooks'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-900 text-xs">
                    QuickBooks
                  </span>
                  {selectedFormat === 'quickbooks' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  QuickBooks Online & Desktop. Formatted customer receipts & memo categories.
                </p>
              </button>

              {/* Option 3: Xero */}
              <button
                type="button"
                onClick={() => setSelectedFormat('xero')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'xero'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-900 text-xs">
                    Xero Statement
                  </span>
                  {selectedFormat === 'xero' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Bank feed & manual journal import format with required payee & reference.
                </p>
              </button>

              {/* Option 4: Treasury Receipts */}
              <button
                type="button"
                onClick={() => setSelectedFormat('receipts-log')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'receipts-log'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-900 text-xs">
                    Receipts Register
                  </span>
                  {selectedFormat === 'receipts-log' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Treasury cash register linking verified receipts, sign-offs & HMAC hashes.
                </p>
              </button>
            </div>
          </div>

          {/* Scope and Field Customizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            {/* Scope selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                2. Export Scope & Filters
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={selectedScope === 'all'}
                    onChange={() => setSelectedScope('all')}
                    className="accent-amber-700"
                  />
                  <span className="text-stone-800 font-medium">
                    Entire Ledger ({transactions.length} total transactions)
                  </span>
                </label>

                {activeCurrencyFilter !== 'ALL' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="export-scope"
                      checked={selectedScope === 'filtered'}
                      onChange={() => setSelectedScope('filtered')}
                      className="accent-amber-700"
                    />
                    <span className="text-stone-800 font-medium">
                      Active Currency Filter ({activeCurrencyFilter} only)
                    </span>
                  </label>
                )}

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={selectedScope === 'settled-only'}
                    onChange={() => setSelectedScope('settled-only')}
                    className="accent-amber-700"
                  />
                  <span className="text-stone-800 font-medium">
                    Settled & Reconciled Entries Only (
                    {transactions.filter((t) => t.status === 'Settled' || t.reconciled).length}{' '}
                    entries)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={selectedScope === 'pending-only'}
                    onChange={() => setSelectedScope('pending-only')}
                    className="accent-amber-700"
                  />
                  <span className="text-stone-800 font-medium">
                    Pending Verification & Webhooks Only (
                    {transactions.filter((t) => t.status !== 'Settled' && !t.reconciled).length}{' '}
                    entries)
                  </span>
                </label>
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                3. Options & Formatting
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">Date Format:</span>
                  <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setDateFormat('iso')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dateFormat === 'iso'
                          ? 'bg-amber-700 text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      ISO (YYYY-MM-DD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFormat('standard')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dateFormat === 'standard'
                          ? 'bg-amber-700 text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Regional (Sep 28)
                    </button>
                  </div>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="accent-amber-700 rounded"
                  />
                  <span className="text-stone-700">
                    Include column headers (Row 1)
                  </span>
                </label>

                {selectedFormat === 'standard-erp' && (
                  <>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeItemized}
                        onChange={(e) => setIncludeItemized(e.target.checked)}
                        className="accent-amber-700 rounded"
                      />
                      <span className="text-stone-700">
                        Include itemized rent & parking columns
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCryptoHashes}
                        onChange={(e) => setIncludeCryptoHashes(e.target.checked)}
                        className="accent-amber-700 rounded"
                      />
                      <span className="text-stone-700">
                        Include cryptographic HMAC verification seals
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Records Included
              </div>
              <div className="text-lg font-mono font-extrabold text-stone-900 mt-0.5">
                {exportResult.recordCount} rows
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Total Value (USD Base)
              </div>
              <div className="text-lg font-mono font-extrabold text-stone-900 mt-0.5">
                ${exportResult.totalGrossUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Currencies Present
              </div>
              <div className="text-xs font-mono font-bold text-amber-900 mt-1">
                {Object.keys(exportResult.currencyBreakdown).join(', ') || 'USD'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Generated File Name
              </div>
              <div className="text-[11px] font-mono text-stone-700 truncate mt-1" title={exportResult.filename}>
                {exportResult.filename}
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  4. Export Preview
                </span>
                <span className="text-[10px] text-stone-400">
                  ({exportResult.recordCount} records generated)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('table')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activePreviewTab === 'table'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Table Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('raw')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activePreviewTab === 'raw'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Raw CSV Text
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium flex items-center space-x-1 transition-colors text-xs"
                  title="Copy full CSV to clipboard"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Body */}
            {activePreviewTab === 'table' ? (
              <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white max-h-52">
                <table className="w-full text-left text-[11px] text-stone-600">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50 border-b border-stone-200 sticky top-0">
                    <tr>
                      {parsedHeaders.map((head, i) => (
                        <th key={i} className="py-2 px-2.5 whitespace-nowrap">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {parsedDataRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50/70">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-1.5 px-2.5 whitespace-nowrap truncate max-w-xs"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {parsedDataRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={parsedHeaders.length || 1}
                          className="py-4 text-center text-stone-400 italic"
                        >
                          No matching records for chosen scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relative">
                <pre className="p-3 bg-stone-900 text-stone-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-52 leading-relaxed selection:bg-amber-800">
                  {exportResult.csvContent}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500 text-center sm:text-left">
            Includes <strong>UTF-8 Byte Order Mark (BOM)</strong> for automatic character encoding detection in Microsoft Excel.
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {exportResult.filename}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
