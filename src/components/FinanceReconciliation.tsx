import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Coins,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  Archive,
  ArrowRight,
  FileDown,
  RotateCcw,
  Key,
  Check,
  FileSpreadsheet,
  Smartphone,
  Settings,
  Lock,
} from 'lucide-react';
import { FinancialTransaction, PaymentMethodOrgConfig, SupportedCurrency, PaymentReceipt } from '../types';
import {
  PAYMENT_METHODS_CONFIG,
  RECONCILIATION_MATCH_RATES,
} from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { useReceipts } from '../context/ReceiptsContext';
import { PaymentGatewaysManager } from './PaymentGatewaysManager';
import { FinanceCsvExportModal } from './FinanceCsvExportModal';
import { MobileMoneyPaymentModal } from './MobileMoneyPaymentModal';
import { MesombPluginManagerModal } from './MesombPluginManagerModal';
import { RecurringPaymentHistory } from './RecurringPaymentHistory';
import { INITIAL_RECURRING_PAYMENTS } from '../data/recurringPaymentsData';
import { generateReconciliationCsv, downloadCsvFile } from '../utils/financeCsvExporter';

export const FinanceReconciliation: React.FC = () => {
  const { canPerform, activeRole, showSecurityNotification } = useSecurity();
  const isAdminOrSuperAdmin = activeRole === 'super_admin' || activeRole === 'admin';
  const { activeCurrency, currencies, formatAmount, convertAmount } = useCurrency();
  const {
    transactions,
    receipts,
    verifyReconciliationEntry,
    batchVerifyPendingEntries,
    downloadReceipt,
    printReceipt,
    openReceiptPreview,
    getReceiptForTransaction,
  } = useReceipts();

  const [activeFinanceTab, setActiveFinanceTab] = useState<'ledger' | 'recurring-history' | 'receipts-archive' | 'gateways'>('ledger');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | SupportedCurrency>('ALL');
  const [selectedTxnId, setSelectedTxnId] = useState<string>(transactions[0]?.id || 'txn-1');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isMobileMoneyModalOpen, setIsMobileMoneyModalOpen] = useState(false);
  const [isMesombPluginOpen, setIsMesombPluginOpen] = useState(false);
  const [mobileMoneyInitialGateway, setMobileMoneyInitialGateway] = useState<'mtn_momo' | 'orange_money' | 'mesomb'>('mtn_momo');

  const selectedTxn = transactions.find((t) => t.id === selectedTxnId) || transactions[0];
  const selectedReceipt = selectedTxn ? getReceiptForTransaction(selectedTxn.id) : undefined;

  const filteredTransactions = transactions.filter((t) => {
    if (currencyFilter === 'ALL') return true;
    return (t.currency || 'USD') === currencyFilter;
  });

  const pendingCount = transactions.filter((t) => t.status !== 'Settled' || !t.reconciled).length;
  const verifiedCount = receipts.length;

  const handleQuickCsvExport = () => {
    const result = generateReconciliationCsv(transactions, receipts, {
      format: 'standard-erp',
      scope: currencyFilter === 'ALL' ? 'all' : 'filtered',
      currencyFilter,
      dateFormat: 'iso',
      includeHeaders: true,
      includeItemizedBreakdown: true,
      includeCryptoHashes: true,
    });
    downloadCsvFile(result.csvContent, result.filename);
    showSecurityNotification(
      `Reconciliation export complete: ${result.recordCount} entries (${currencyFilter === 'ALL' ? 'All Currencies' : currencyFilter}) downloaded as RFC-4180 CSV for external accounting systems.`
    );
  };

  const handleCsvExportSuccess = (summary: { recordCount: number; filename: string; format: string }) => {
    showSecurityNotification(
      `External Accounting Export: ${summary.recordCount} reconciliation rows exported (${summary.format}) to "${summary.filename}". Audit trail signed.`
    );
  };

  const handleVerifyEntry = (txnId: string) => {
    const receipt = verifyReconciliationEntry(txnId, 'Property Manager Reconciler');
    if (receipt) {
      setSelectedTxnId(txnId);
      openReceiptPreview(receipt);
    }
  };

  const handleBatchVerify = () => {
    batchVerifyPendingEntries();
  };

  const handleRetryFailedTransaction = (txn: FinancialTransaction) => {
    setRetryingId(txn.id);
    showSecurityNotification(
      `Dispatching retry for ${txn.reference} using existing idempotency key (${txn.idempotencyKey.slice(0, 12)}…).`
    );

    setTimeout(() => {
      verifyReconciliationEntry(txn.id, 'Automated Gateway Retry Worker');
      setRetryingId(null);
      showSecurityNotification(`Transaction ${txn.reference} settled via gateway retry and PDF receipt generated.`);
    }, 1000);
  };

  const handleExecuteRefund = () => {
    if (!canPerform('finance.refund')) {
      showSecurityNotification(
        `Access Denied: Initiating gateway refunds requires "owner" or "accountant" role. Current role: ${activeRole}.`
      );
      setIsRefundModalOpen(false);
      return;
    }

    setIsRefundModalOpen(false);
    showSecurityNotification(
      `Refund of ${formatAmount(selectedTxn.amount, selectedTxn.currency || activeCurrency)} to ${selectedTxn.tenantName} confirmed. Reversal logged in audit trail.`
    );
  };

  const filteredReceipts = receipts.filter((r) => {
    if (!receiptSearch) return true;
    const q = receiptSearch.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(q) ||
      r.tenantName.toLowerCase().includes(q) ||
      r.unit.toLowerCase().includes(q) ||
      r.transactionRef.toLowerCase().includes(q) ||
      r.currency.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            EstateFlow · Finance Workspace · Page 5 / 8
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Payments, Finance & PDF Receipts
          </h1>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Live rent ledger with multi-currency reconciliation supporting <strong>Euro (€)</strong>, <strong>USD ($)</strong>, <strong>Pounds (£)</strong>, and <strong>CFA (FCFA)</strong>, paired with automated HMAC-signed PDF receipt generation accessible to both property managers and tenants.
          </p>
        </div>

        {/* Workspace Sub-Tabs & Export Action */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center space-x-1 bg-stone-100 p-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveFinanceTab('ledger')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                activeFinanceTab === 'ledger'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>Rent Ledger & Reconciliation</span>
            </button>

            <button
              onClick={() => setActiveFinanceTab('recurring-history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                activeFinanceTab === 'recurring-history'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Recurring Payment History</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-mono font-bold">
                {INITIAL_RECURRING_PAYMENTS.length} Mandates
              </span>
            </button>

            <button
              onClick={() => setActiveFinanceTab('receipts-archive')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                activeFinanceTab === 'receipts-archive'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Archive className="w-4 h-4 text-emerald-700" />
              <span>Verified Receipts (PDF)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-mono font-bold">
                {receipts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFinanceTab('gateways')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                activeFinanceTab === 'gateways'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-800" />
              <span>Payment Gateways</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-mono">
                {activeCurrency}
              </span>
            </button>
          </div>

          {/* Actions: Mobile Money Collection, Plugin Config & Direct CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setMobileMoneyInitialGateway('mtn_momo');
                setIsMobileMoneyModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:opacity-95 text-stone-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title="Collect rent directly via MTN Mobile Money (*126#) or Orange Money (#150#)"
            >
              <Smartphone className="w-4 h-4 text-stone-950" />
              <span>Collect via MoMo / OM 🇨🇲</span>
            </button>

            <button
              onClick={() => setIsMesombPluginOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs border border-stone-700 transition-colors cursor-pointer"
              title={isAdminOrSuperAdmin ? "Manage and edit MeSomb Mobile Money Gateway plugin configuration & credentials" : `MeSomb Plugin Management (Read-Only for ${activeRole})`}
            >
              {isAdminOrSuperAdmin ? (
                <Settings className="w-4 h-4 text-amber-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span>{isAdminOrSuperAdmin ? 'MeSomb Plugin ⚙️' : 'MeSomb Plugin 🔒'}</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
              title="Export reconciliations to CSV for QuickBooks, Xero, NetSuite, SAP, etc."
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Ribbon: Reconciliation & Automated Receipt Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Settled & Reconciled
            </div>
            <div className="text-xl font-mono font-extrabold text-stone-900 mt-0.5">
              {transactions.filter((t) => t.status === 'Settled').length} Entries
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Pending Webhook / Verification
            </div>
            <div className="text-xl font-mono font-extrabold text-amber-800 mt-0.5">
              {pendingCount} Pending
            </div>
          </div>
          {pendingCount > 0 ? (
            <button
              onClick={handleBatchVerify}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
              title="Verify all pending entries and generate PDF receipts"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verify All</span>
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Automated PDF Receipts Issued
            </div>
            <div className="text-xl font-mono font-extrabold text-stone-900 mt-0.5">
              {verifiedCount} Verified PDFs
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Recurring Autopay Mandates
            </div>
            <div className="text-xl font-mono font-extrabold text-stone-900 mt-0.5 flex items-center gap-1.5">
              <span>{INITIAL_RECURRING_PAYMENTS.filter((r) => r.autoDebitEnabled).length} Active</span>
            </div>
          </div>
          <button
            onClick={() => setActiveFinanceTab('recurring-history')}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
            title="View Recurring Payment History & Collections"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Render Gateways Manager Tab if selected */}
      {activeFinanceTab === 'gateways' ? (
        <PaymentGatewaysManager />
      ) : activeFinanceTab === 'recurring-history' ? (
        <RecurringPaymentHistory
          onOpenReceiptPreview={(receiptNumber) => {
            const foundReceipt = receipts.find((r) => r.receiptNumber === receiptNumber);
            if (foundReceipt) {
              openReceiptPreview(foundReceipt);
            } else {
              showSecurityNotification(`Receipt ${receiptNumber} preview requested.`);
            }
          }}
        />
      ) : activeFinanceTab === 'receipts-archive' ? (
        /* Receipts Archive Tab */
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Verified Rent Payment Receipts Archive
              </h2>
              <p className="text-xs text-stone-500">
                Official PDF documents generated automatically upon reconciliation verification ({filteredReceipts.length} receipts)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder="Search receipt #, tenant, unit..."
                  className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs w-56 sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-stone-200 shadow-2xs"
                title="Export verified receipts register to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Receipts (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Tenant & Unit</th>
                  <th className="py-2.5 px-3">Property</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReceipts.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                      {rcpt.receiptNumber}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{rcpt.tenantName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{rcpt.unit}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-stone-700">
                      {rcpt.propertyName}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-900 whitespace-nowrap">
                      {rcpt.currency === 'CFA'
                        ? `${Math.round(rcpt.amountPaid).toLocaleString()} FCFA`
                        : `${rcpt.currency} ${rcpt.amountPaid.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                      {rcpt.paymentMethod}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{rcpt.verifiedBy}</span>
                      </div>
                      <div className="text-[10px] text-stone-400">{rcpt.verifiedAt}</div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openReceiptPreview(rcpt)}
                          className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] transition-colors flex items-center space-x-1"
                          title="Preview PDF receipt"
                        >
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>View PDF</span>
                        </button>
                        <button
                          onClick={() => downloadReceipt(rcpt)}
                          className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] transition-colors flex items-center space-x-1 shadow-2xs"
                          title="Download PDF file"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Ledger & Reconciliation Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Rent Ledger (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Rent Ledger — September 2026
                  </h2>
                  <p className="text-xs text-stone-500">
                    Webhook-verified gateway settlements ({filteredTransactions.length} entries)
                  </p>
                </div>

                {/* Currency Filter Bar & CSV Export Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1 bg-stone-50 p-1 rounded-lg border border-stone-200 text-xs">
                    <span className="text-[10px] font-bold text-stone-400 px-1 uppercase">Currency:</span>
                    {(['ALL', 'USD', 'EUR', 'GBP', 'CFA'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCurrencyFilter(filter)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          currencyFilter === filter
                            ? 'bg-amber-700 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Collect via Mobile Money & CSV Export Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setMobileMoneyInitialGateway('mtn_momo');
                        setIsMobileMoneyModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Collect rent directly via MTN Mobile Money or Orange Money"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Collect MoMo / OM</span>
                    </button>

                    <button
                      onClick={handleQuickCsvExport}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-stone-200 shadow-2xs cursor-pointer"
                      title={`Quick download ${filteredTransactions.length} records as RFC-4180 CSV`}
                    >
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                      <span>Quick CSV ({filteredTransactions.length})</span>
                    </button>
                    <button
                      onClick={() => setIsCsvModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center space-x-1.5 transition-colors border border-amber-300 cursor-pointer"
                      title="Configure ERP / QuickBooks / Xero reconciliation export"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
                      <span>Accounting Export…</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                    <tr>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Tenant / Unit</th>
                      <th className="py-2.5 px-2">Reference</th>
                      <th className="py-2.5 px-2">Amount</th>
                      <th className="py-2.5 px-2">Method</th>
                      <th className="py-2.5 px-2">Receipt Status</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.map((txn) => {
                      const isSelected = selectedTxn.id === txn.id;
                      const isFailed = txn.status === 'Failed';
                      const isSettled = txn.status === 'Settled' || txn.reconciled;
                      const txnCur = txn.currency || 'USD';
                      const receipt = getReceiptForTransaction(txn.id);

                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setSelectedTxnId(txn.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-stone-50'
                          }`}
                        >
                          <td className="py-3 px-2 font-mono whitespace-nowrap text-stone-900 font-semibold">
                            {txn.date.slice(0, 6)}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                              <span>{txn.tenantName}</span>
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-stone-100 text-stone-600 font-normal">
                                {currencies[txnCur]?.flag || '🇺🇸'} {txnCur}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400">{txn.unit}</div>
                          </td>
                          <td className="py-3 px-2 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                            {txn.reference}
                          </td>
                          <td className="py-3 px-2 font-mono font-bold text-stone-900 whitespace-nowrap">
                            <div>{formatAmount(txn.amount, txnCur)}</div>
                            {txnCur !== activeCurrency && (
                              <div className="text-[10px] text-stone-400 font-normal">
                                ≈ {formatAmount(txn.amount, activeCurrency)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-stone-600">
                              {txn.maskedMethod}
                            </span>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            {isSettled && receipt ? (
                              <div className="flex items-center space-x-1 text-emerald-700 font-medium text-[11px]">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>PDF #{receipt.receiptNumber}</span>
                              </div>
                            ) : txn.status === 'Webhook' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Webhook Match Pending
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                {txn.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {isSettled && receipt ? (
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => openReceiptPreview(receipt)}
                                  className="p-1 rounded hover:bg-stone-200 text-stone-600"
                                  title="View PDF Receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => downloadReceipt(receipt)}
                                  className="p-1 rounded hover:bg-amber-100 text-amber-800"
                                  title="Download PDF Receipt"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleVerifyEntry(txn.id)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-colors flex items-center space-x-1"
                                title="Verify reconciliation entry & issue PDF receipt"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Verify & PDF</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
                <span>Selected row opens the transaction detail. Failed items offer one-click retry with the same idempotency key.</span>
                <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  AES-256-GCM Tokenized
                </span>
              </div>
            </div>

            {/* Tokenized Security Notice (Page 5 Specification) */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">
                <strong>Data Protection:</strong> All account numbers are tokenized and masked (<code className="font-mono text-stone-800">····4821</code>); full PANs never touch EstateFlow servers. Every status change is webhook-verified before the ledger posts.
              </p>
            </div>
          </div>

          {/* Right Column: Transaction Detail & Receipt + Payment Methods Config (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Transaction Detail & Receipt */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Transaction Detail & Receipt
                  </h3>
                  <div className="text-xs font-mono text-amber-800">
                    {selectedTxn.reference}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded">
                    {currencies[selectedTxn.currency || 'USD']?.flag || '🇺🇸'} {selectedTxn.currency || 'USD'}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono rounded ${
                      selectedTxn.status === 'Settled' || selectedTxn.reconciled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedTxn.status === 'Settled' || selectedTxn.reconciled
                      ? 'Verified & Reconciled'
                      : 'Pending Verification'}
                  </span>
                </div>
              </div>

              {/* Automatic PDF Receipt Action Banner */}
              {selectedReceipt ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>Official PDF Receipt #{selectedReceipt.receiptNumber}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded text-emerald-800 border border-emerald-200">
                      HMAC-SHA256
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600">
                    Automatically generated and synced to tenant portal ({selectedReceipt.tenantName}).
                  </p>

                  <div className="font-mono text-[10px] text-stone-500 bg-white/80 p-1.5 rounded border border-emerald-100 truncate">
                    Hash: {selectedReceipt.verificationHash}
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => openReceiptPreview(selectedReceipt)}
                      className="flex-1 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>View & Print PDF</span>
                    </button>
                    <button
                      onClick={() => downloadReceipt(selectedReceipt)}
                      className="flex-1 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Entry Awaiting Verification</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded">
                      Action Required
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Reconciling this entry will automatically compile an official PDF payment receipt with HMAC digital seal, making it immediately accessible to both the property manager and tenant.
                  </p>
                  <button
                    onClick={() => handleVerifyEntry(selectedTxn.id)}
                    className="w-full py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Verify Entry & Auto-Generate PDF Receipt</span>
                  </button>
                </div>
              )}

              {/* Cryptographic Security Details */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono space-y-1.5 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-400">Idempotency key:</span>
                  <span className="font-bold text-stone-900">{selectedTxn.idempotencyKey.slice(0, 16)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Gateway ref:</span>
                  <span className="text-stone-900">{selectedTxn.gatewayRef}</span>
                </div>
                {selectedTxn.gatewayId && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gateway Router:</span>
                    <span className="text-amber-800 font-bold">{selectedTxn.gatewayId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-400">Webhook status:</span>
                  <span className="text-emerald-700 font-semibold">{selectedTxn.webhookStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Posted UTC:</span>
                  <span>{selectedTxn.postedUtc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Retries:</span>
                  <span>{selectedTxn.retries} (safe to retry)</span>
                </div>

                {/* Carrier & Mobile Money Settlement Info */}
                {(selectedTxn.carrierRef || selectedTxn.gatewayId === 'mtn_momo' || selectedTxn.gatewayId === 'orange_money') && (
                  <div className="mt-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5 font-mono">
                    <div className="font-bold text-amber-950 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                        <span>Carrier Settlement Handshake</span>
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        {selectedTxn.gatewayId === 'orange_money' ? 'Orange Money (#150#)' : 'MTN MoMo (*126#)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-700 text-[11px]">
                      <span className="text-stone-500">Carrier Ref:</span>
                      <span className="font-bold text-stone-900">{selectedTxn.carrierRef || selectedTxn.gatewayRef}</span>
                    </div>
                    {selectedTxn.payerPhone && (
                      <div className="flex justify-between text-stone-700 text-[11px]">
                        <span className="text-stone-500">Payer Phone:</span>
                        <span>{selectedTxn.payerPhone}</span>
                      </div>
                    )}
                    {selectedTxn.signature && (
                      <div className="flex justify-between text-stone-700 text-[10px] truncate">
                        <span className="text-stone-500">MeSomb Sig:</span>
                        <code className="text-amber-800">{selectedTxn.signature}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Itemized Receipt Breakdown Box */}
              <div className="p-4 bg-[#FFFDF8] border border-amber-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                  <span>Ledger Breakdown · {selectedTxn.unit}</span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Ref: {selectedTxn.reference}
                  </span>
                </div>

                <div className="text-xs text-stone-600 divide-y divide-stone-100 pt-1">
                  <div className="py-1 flex justify-between">
                    <span>Rent — {selectedTxn.date.slice(0, 3)} 2026 ({selectedTxn.unit})</span>
                    <span className="font-mono font-medium">
                      {formatAmount(selectedTxn.itemizedRent, selectedTxn.currency || activeCurrency)}
                    </span>
                  </div>
                  {selectedTxn.itemizedParking > 0 && (
                    <div className="py-1 flex justify-between">
                      <span>Parking stall P2</span>
                      <span className="font-mono font-medium">
                        {formatAmount(selectedTxn.itemizedParking, selectedTxn.currency || activeCurrency)}
                      </span>
                    </div>
                  )}
                  <div className="py-1.5 flex justify-between font-bold text-stone-900 text-sm">
                    <span>Total paid ({selectedTxn.currency || activeCurrency})</span>
                    <span className="font-mono text-amber-900">
                      {formatAmount(selectedTxn.amount, selectedTxn.currency || activeCurrency)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {selectedReceipt ? (
                    <button
                      onClick={() => downloadReceipt(selectedReceipt)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Download PDF</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyEntry(selectedTxn.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Verify & Generate</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsRefundModalOpen(true)}
                    disabled={selectedTxn.refunded}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      selectedTxn.refunded
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {selectedTxn.refunded ? 'Refunded' : 'Refund transaction'}
                  </button>
                </div>
              </div>

              {/* Reconciliation Match Rate — Last 7 Days (Page 5 Specification) */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Reconciliation Match Rate — Last 7 Days
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Auto-matched settlements vs. exceptions per day. Sep 26 spike traced to a delayed gateway webhook; all items cleared by retry-safe re-polling.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                    98.2% Avg
                  </span>
                </div>

                {/* Match Rate Visual Bar Graphic */}
                <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
                  {RECONCILIATION_MATCH_RATES.map((rate) => {
                    const isSpike = rate.exceptions > 5;
                    return (
                      <div key={rate.day} className="flex-1 flex flex-col items-center group">
                        <div className="text-[9px] font-mono text-stone-400 group-hover:text-stone-900 font-bold transition-colors">
                          {rate.autoMatched}%
                        </div>
                        <div className="w-full flex flex-col items-center justify-end h-16 mt-1">
                          {/* Exceptions top cap */}
                          {rate.exceptions > 0 && (
                            <div
                              style={{ height: `${Math.max(rate.exceptions * 3.5, 4)}px` }}
                              className={`w-full rounded-t-xs transition-all ${
                                isSpike ? 'bg-rose-500' : 'bg-amber-400'
                              }`}
                              title={`${rate.day}: ${rate.exceptions}% exceptions`}
                            />
                          )}
                          {/* Auto matched bar */}
                          <div
                            style={{ height: `${Math.max((rate.autoMatched - 80) * 2.5, 10)}px` }}
                            className="w-full bg-emerald-600 rounded-b-xs transition-all group-hover:bg-emerald-500"
                            title={`${rate.day}: ${rate.autoMatched}% auto-matched`}
                          />
                        </div>
                        <span className={`text-[10px] mt-1.5 font-mono ${isSpike ? 'text-rose-700 font-bold' : 'text-stone-500'}`}>
                          {rate.day.slice(4)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Auto-matched</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      <span>Exceptions (Webhook lag)</span>
                    </span>
                  </div>
                  <span className="text-emerald-700 font-bold">100% Cleared</span>
                </div>
              </div>

              {/* Payment Methods Config (Page 5) */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                  <span>Saved Payment Methods (Jordan Avery & Tenants)</span>
                  <button
                    onClick={() => setActiveFinanceTab('gateways')}
                    className="text-[11px] text-amber-800 hover:underline font-semibold"
                  >
                    Configure Gateways →
                  </button>
                </div>
                <div className="space-y-1.5">
                  {PAYMENT_METHODS_CONFIG.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-stone-900 mr-2">
                          {pm.maskedNumber}
                        </span>
                        <span className="text-stone-500">{pm.tenantName}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          pm.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pm.status === 'Re-auth required'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {pm.status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 italic">
                  Tokenized display-only; supports Euro (SEPA), USD (ACH/Card), Pounds (BACS), and CFA (MoMo/OM).
                </p>
              </div>
            </div>

            {/* Retry-Safe Posting Rules Card (Page 5 callout) */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2 text-stone-700">
              <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Multi-Currency Posting & Receipt Policy</span>
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-stone-600">
                <li>
                  <strong>Every write carries an idempotency key</strong> — prevents duplicate charges across Euro, USD, Pounds, and CFA gateways.
                </li>
                <li>
                  <strong>Automated PDF receipt generation</strong> triggers instantly upon transaction verification, generating verifiable SHA-256 HMAC cryptographic signatures.
                </li>
                <li>
                  <strong>Dual Portal Synchronization</strong>: Generated PDF receipts are immediately made downloadable to the tenant in their mobile view and property manager ledger.
                </li>
                <li>
                  <strong>Rate lock certification</strong> preserves historical conversion rates for audit compliance.
                </li>
              </ul>
              <div className="pt-1 text-[10px] font-mono text-stone-500">
                Gateways active: MTN MoMo, Orange Money, CamerPay, ElyonPay, Visa, Mastercard, PayPal, Apple Pay, Google Pay, Bank Transfer.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal (Page 5 pattern) */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base text-stone-900">Refund Confirmation</h3>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs text-stone-700">
              <p className="font-bold text-stone-900">
                Refund ${selectedTxn.amount.toFixed(2)} to {selectedTxn.tenantName}?
              </p>
              <p className="text-stone-600 leading-relaxed">
                This credits {selectedTxn.unit}'s ledger and reverses gateway charge <code className="font-mono text-stone-800">{selectedTxn.gatewayRef}</code>. The request carries the original idempotency key, so a network retry cannot double-refund. A signed confirmation email is sent to the tenant.
              </p>
              <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                Requires finance-admin or owner role
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounting System CSV Export Modal */}
      <FinanceCsvExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        transactions={transactions}
        receipts={receipts}
        activeCurrencyFilter={currencyFilter}
        onExportSuccess={handleCsvExportSuccess}
      />

      {/* Cameroon Mobile Money Payment Terminal Modal (MTN MoMo & Orange Money) */}
      <MobileMoneyPaymentModal
        isOpen={isMobileMoneyModalOpen}
        onClose={() => setIsMobileMoneyModalOpen(false)}
        initialGateway={mobileMoneyInitialGateway}
        initialTenantName={selectedTxn?.tenantName || 'Jordan Avery'}
        initialUnit={selectedTxn?.unit || 'Unit 4B'}
        initialAmountUSD={selectedTxn?.amount || 1450}
      />

      {/* MeSomb Plugin Management Configuration Modal */}
      <MesombPluginManagerModal
        isOpen={isMesombPluginOpen}
        onClose={() => setIsMesombPluginOpen(false)}
        onLaunchTestCollection={() => {
          setMobileMoneyInitialGateway('mtn_momo');
          setIsMobileMoneyModalOpen(true);
        }}
      />
    </div>
  );
};
