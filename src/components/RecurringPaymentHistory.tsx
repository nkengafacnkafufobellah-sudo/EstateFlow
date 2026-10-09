import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Building2,
  DollarSign,
  Eye,
  X,
  FileSpreadsheet,
  Check,
  Sparkles,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Percent,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  RecurringPaymentRecord,
  RecurringCollectionType,
  RecurringPaymentStatus,
  SupportedCurrency,
} from '../types';
import { INITIAL_RECURRING_PAYMENTS } from '../data/recurringPaymentsData';
import { useCurrency } from '../context/CurrencyContext';
import { useSecurity } from '../context/SecurityContext';

interface RecurringPaymentHistoryProps {
  onOpenReceiptPreview?: (receiptNumber: string) => void;
}

export const RecurringPaymentHistory: React.FC<RecurringPaymentHistoryProps> = ({
  onOpenReceiptPreview,
}) => {
  const { formatAmount, convertAmount, activeCurrency } = useCurrency();
  const { showSecurityNotification, activeRole } = useSecurity();

  // Primary dataset state
  const [records, setRecords] = useState<RecurringPaymentRecord[]>(() => INITIAL_RECURRING_PAYMENTS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | RecurringCollectionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RecurringPaymentStatus>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | SupportedCurrency>('ALL');

  // Inspection & Modals
  const [selectedRecord, setSelectedRecord] = useState<RecurringPaymentRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  // New Recurring Plan Form State
  const [newPlan, setNewPlan] = useState({
    tenantName: '',
    unit: '',
    propertyName: 'Oak Residence',
    collectionType: 'service_fee' as RecurringCollectionType,
    title: '',
    amount: 50.0,
    currency: 'USD' as SupportedCurrency,
    paymentMethod: 'Bank ACH Auto-Debit (Plaid)',
    billingCycle: 'Monthly (1st)' as const,
    gatewayMaskedAccount: 'ACH ···· Auto-Debit',
  });

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText =
          rec.tenantName.toLowerCase().includes(query) ||
          rec.unit.toLowerCase().includes(query) ||
          rec.propertyName.toLowerCase().includes(query) ||
          rec.mandateCode.toLowerCase().includes(query) ||
          rec.title.toLowerCase().includes(query) ||
          rec.paymentMethod.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // Collection Type
      if (typeFilter !== 'ALL' && rec.collectionType !== typeFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) {
        return false;
      }

      // Currency
      if (currencyFilter !== 'ALL' && rec.currency !== currencyFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, typeFilter, statusFilter, currencyFilter]);

  // KPI Computations
  const totalMonthlyVolumeUSD = useMemo(() => {
    return records.reduce((acc, r) => {
      if (r.status === 'Paused') return acc;
      const inUSD = r.currency === 'USD' ? r.amount : convertAmount(r.amount, r.currency, 'USD');
      return acc + inUSD;
    }, 0);
  }, [records, convertAmount]);

  const activeMandatesCount = records.filter((r) => r.autoDebitEnabled && r.status !== 'Paused').length;
  const settledCollectionsCount = records.filter((r) => r.status === 'Settled').length;
  const failingOrRetryCount = records.filter((r) => r.status === 'Failed' || r.status === 'Retrying').length;
  const successRatePercentage = Math.round((settledCollectionsCount / Math.max(1, records.length)) * 100);

  // Trigger Instant Automated Collection (Retry or On-demand cycle)
  const handleTriggerInstantCollection = async (record: RecurringPaymentRecord) => {
    setCollectingId(record.id);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updatedRecentAttempts = [
      {
        id: `att-${Date.now().toString().slice(-4)}`,
        attemptDate: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        status: 'SUCCESS' as const,
        gatewayRef: `auto_debit_${Math.random().toString(36).substring(2, 9)}`,
        receiptNumber: `RC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: record.amount,
      },
      ...record.recentAttempts,
    ];

    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? {
              ...r,
              status: 'Settled',
              lastBillingDate: new Date().toISOString().slice(0, 10),
              consecutiveSuccessCount: r.consecutiveSuccessCount + 1,
              totalCollectedToDate: r.totalCollectedToDate + r.amount,
              attemptsCount: r.attemptsCount + 1,
              recentAttempts: updatedRecentAttempts,
            }
          : r
      )
    );

    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              status: 'Settled',
              lastBillingDate: new Date().toISOString().slice(0, 10),
              consecutiveSuccessCount: prev.consecutiveSuccessCount + 1,
              totalCollectedToDate: prev.totalCollectedToDate + prev.amount,
              attemptsCount: prev.attemptsCount + 1,
              recentAttempts: updatedRecentAttempts,
            }
          : null
      );
    }

    setCollectingId(null);
    showSecurityNotification(
      `Automated Collection Success: Debited ${record.currency === 'CFA' ? `${Math.round(record.amount).toLocaleString()} FCFA` : `$${record.amount.toFixed(2)}`} for ${record.tenantName} (${record.title}). Receipt verified.`
    );
  };

  // Toggle Auto-Debit Mandate (Pause / Resume)
  const handleToggleAutoDebit = (record: RecurringPaymentRecord) => {
    const nextEnabled = !record.autoDebitEnabled;
    const nextStatus: RecurringPaymentStatus = nextEnabled ? 'Settled' : 'Paused';

    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? {
              ...r,
              autoDebitEnabled: nextEnabled,
              status: nextStatus,
            }
          : r
      )
    );

    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              autoDebitEnabled: nextEnabled,
              status: nextStatus,
            }
          : null
      );
    }

    showSecurityNotification(
      `Mandate ${record.mandateCode} (${record.tenantName}): Auto-Debit is now ${nextEnabled ? 'ACTIVE (Resumed)' : 'PAUSED (Suspended)'}.`
    );
  };

  // Add New Recurring Plan
  const handleCreateRecurringPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.tenantName.trim() || !newPlan.unit.trim()) {
      showSecurityNotification('Please fill in tenant name and unit.');
      return;
    }

    const newRec: RecurringPaymentRecord = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      mandateCode: `MAND-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: `tnt-${Date.now().toString().slice(-3)}`,
      tenantName: newPlan.tenantName,
      tenantEmail: `${newPlan.tenantName.toLowerCase().replace(/\s+/g, '.')}@domain.com`,
      tenantPhone: '+237 677 00 00 00',
      propertyId: 'prp-1',
      propertyName: newPlan.propertyName,
      unit: newPlan.unit,
      collectionType: newPlan.collectionType,
      title: newPlan.title || `${newPlan.collectionType === 'service_fee' ? 'Monthly Service Fee' : 'Monthly Rent'} · ${newPlan.unit}`,
      billingCycle: newPlan.billingCycle,
      nextBillingDate: '2026-10-01',
      lastBillingDate: '2026-09-01',
      amount: newPlan.amount,
      currency: newPlan.currency,
      paymentMethod: newPlan.paymentMethod,
      gatewayId: newPlan.currency === 'CFA' ? 'mtn_momo' : 'bank_transfer',
      gatewayMaskedAccount: newPlan.gatewayMaskedAccount,
      status: 'Settled',
      autoDebitEnabled: true,
      consecutiveSuccessCount: 1,
      totalCollectedToDate: newPlan.amount,
      attemptsCount: 1,
      mandateSignedDate: new Date().toISOString().slice(0, 10),
      recentAttempts: [
        {
          id: `att-init-${Date.now().toString().slice(-4)}`,
          attemptDate: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
          status: 'SUCCESS',
          gatewayRef: `init_mand_${Math.random().toString(36).substring(2, 7)}`,
          receiptNumber: `RC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: newPlan.amount,
        },
      ],
    };

    setRecords((prev) => [newRec, ...prev]);
    setIsAddModalOpen(false);
    showSecurityNotification(
      `New Recurring Mandate ${newRec.mandateCode} enrolled: ${newRec.title} for ${newRec.tenantName}. Next billing: Oct 1, 2026.`
    );
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Mandate Code',
      'Tenant Name',
      'Unit',
      'Property',
      'Title',
      'Type',
      'Billing Cycle',
      'Amount',
      'Currency',
      'Method',
      'Account Mask',
      'Status',
      'Auto-Debit Active',
      'Next Billing Date',
      'Last Billing Date',
      'Total Collected',
      'Consecutive Successes',
    ];

    const rows = filteredRecords.map((r) => [
      r.mandateCode,
      `"${r.tenantName.replace(/"/g, '""')}"`,
      r.unit,
      `"${r.propertyName}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      r.collectionType,
      r.billingCycle,
      r.amount,
      r.currency,
      `"${r.paymentMethod}"`,
      `"${r.gatewayMaskedAccount}"`,
      r.status,
      r.autoDebitEnabled ? 'YES' : 'NO',
      r.nextBillingDate,
      r.lastBillingDate || 'N/A',
      r.totalCollectedToDate,
      r.consecutiveSuccessCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estateflow-recurring-payment-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSecurityNotification(`Exported ${filteredRecords.length} recurring collection records to CSV.`);
  };

  const getCollectionTypeBadge = (type: RecurringCollectionType) => {
    switch (type) {
      case 'monthly_rent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            Monthly Rent
          </span>
        );
      case 'service_fee':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            Service Fee
          </span>
        );
      case 'parking_fee':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            Parking Fee
          </span>
        );
      case 'amenity_subscription':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            Amenity Sub
          </span>
        );
      case 'utilities_charge':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">
            Utilities
          </span>
        );
    }
  };

  const getStatusBadge = (status: RecurringPaymentStatus) => {
    switch (status) {
      case 'Settled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Settled ✓</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Processing</span>
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <Calendar className="w-3 h-3 text-stone-500" />
            <span>Scheduled</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'Retrying':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
            <span>Retrying in 48h</span>
          </span>
        );
      case 'Paused':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
            <Pause className="w-3 h-3 text-stone-400" />
            <span>Paused</span>
          </span>
        );
    }
  };

  const formatAmountDisplay = (amount: number, currency: SupportedCurrency) => {
    if (currency === 'CFA') {
      return `${Math.round(amount).toLocaleString()} FCFA`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400">
              Monthly Auto-Debit Volume
            </span>
            <Repeat className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-black font-mono text-stone-900">
            ${Math.round(totalMonthlyVolumeUSD).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Active rent & service collections per month
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400">
              Active Autopay Mandates
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-stone-900">
            {activeMandatesCount} / {records.length}
          </div>
          <p className="text-[11px] text-stone-500">
            {Math.round((activeMandatesCount / Math.max(1, records.length)) * 100)}% of enrolled units automated
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400">
              Auto-Collection Success Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-700">
            {successRatePercentage}%
          </div>
          <p className="text-[11px] text-stone-500">
            {settledCollectionsCount} settled · {failingOrRetryCount} action required
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400">
              Next Debit Cycle
            </span>
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-black font-mono text-stone-900">
            Oct 01, 2026
          </div>
          <p className="text-[11px] text-amber-800 font-medium">
            Scheduled automatic dispatch
          </p>
        </div>
      </div>

      {/* Main Recurring Payment Registry Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-stone-900">
                Automated Recurring Payment History
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {filteredRecords.length} Mandates
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Track automated monthly rent debits, building service fees, and amenity retainers across bank ACH, MTN MoMo, and cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Autopay Mandate</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-stone-200 shadow-2xs cursor-pointer"
              title="Export recurring collection schedule and history to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Schedule (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-stone-50/70 border border-stone-200 rounded-xl text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant, unit, title, mandate code..."
              className="w-full pl-9 pr-7 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Chips / Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Collection Types</option>
              <option value="monthly_rent">Monthly Rent</option>
              <option value="service_fee">Service & Maintenance Fees</option>
              <option value="parking_fee">Parking Fees</option>
              <option value="amenity_subscription">Amenity Subscriptions</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Settled">Settled / Collected</option>
              <option value="Scheduled">Scheduled (Upcoming)</option>
              <option value="Failed">Failed (Needs Attention)</option>
              <option value="Retrying">Retrying</option>
              <option value="Paused">Paused</option>
            </select>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="CFA">CFA (FCFA)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>

            {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL' || currencyFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setCurrencyFilter('ALL');
                }}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Recurring Payments Data Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-200">
            <thead className="bg-[#FAF9F6] text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
              <tr>
                <th className="py-3 px-3">Mandate & Tenant</th>
                <th className="py-3 px-3">Collection Details</th>
                <th className="py-3 px-3">Cycle & Next Due</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Auto-Debit Gateway</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Streak / Total</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    <Repeat className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <p className="font-bold text-xs text-stone-800">No recurring collections found</p>
                    <p className="text-[11px] text-stone-500">
                      Try clearing search parameters or enroll a new tenant autopay mandate.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-amber-50/40 transition-colors ${
                      record.status === 'Failed' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Mandate Code & Tenant Name */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center font-mono">
                          {record.tenantName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-xs">
                            {record.tenantName}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10px] text-stone-500">
                            <span className="font-mono bg-stone-100 text-stone-700 px-1 rounded border border-stone-200">
                              {record.mandateCode}
                            </span>
                            <span>·</span>
                            <span>{record.unit}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Collection Title & Category */}
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="font-bold text-stone-800 text-xs truncate max-w-[220px]" title={record.title}>
                        {record.title}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {getCollectionTypeBadge(record.collectionType)}
                        <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                          {record.propertyName}
                        </span>
                      </div>
                    </td>

                    {/* Cycle & Next Due Date */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="font-semibold text-stone-900">
                        {record.billingCycle}
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5 text-stone-400" />
                        <span>Next: {record.nextBillingDate}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-stone-900">
                      {formatAmountDisplay(record.amount, record.currency)}
                    </td>

                    {/* Auto-Debit Gateway */}
                    <td className="py-3 px-3 min-w-[190px]">
                      <div className="flex items-center space-x-1.5">
                        {record.currency === 'CFA' ? (
                          <Smartphone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-stone-800 truncate text-xs" title={record.paymentMethod}>
                          {record.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        {record.gatewayMaskedAccount}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Streak & Total Collected */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-emerald-700 font-bold">
                        {record.consecutiveSuccessCount}x success ✓
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Total: {formatAmountDisplay(record.totalCollectedToDate, record.currency)}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Instant Debit / Retry button */}
                        <button
                          type="button"
                          disabled={collectingId === record.id}
                          onClick={() => handleTriggerInstantCollection(record)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center space-x-1 border border-amber-300 transition-colors cursor-pointer"
                          title="Run immediate auto-debit collection or retry failed charge"
                        >
                          <Play className={`w-3 h-3 ${collectingId === record.id ? 'animate-spin' : ''}`} />
                          <span>{collectingId === record.id ? 'Debiting…' : 'Collect'}</span>
                        </button>

                        {/* View / Inspect Mandate */}
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center space-x-1 border border-stone-200 transition-colors cursor-pointer"
                          title="Inspect mandate history, past debits, and itemized breakdown"
                        >
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>History</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT RECURRING MANDATE & ATTEMPTS HISTORY MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
                  <Repeat className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      Recurring Collection Mandate & History
                    </h3>
                    <span className="text-[10px] font-mono bg-stone-800 text-amber-300 px-2 py-0.5 rounded border border-stone-700 font-bold">
                      {selectedRecord.mandateCode}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Automated tenant debit rules, past settlement runs, and mandate authorization.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
              {/* Tenant & Plan Overview Card */}
              <div className="p-4 bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl text-white space-y-3 border border-stone-800">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-stone-100">
                      {selectedRecord.title}
                    </h4>
                    <span className="text-[11px] text-stone-400">
                      {selectedRecord.tenantName} · {selectedRecord.unit} ({selectedRecord.propertyName})
                    </span>
                  </div>
                  {getStatusBadge(selectedRecord.status)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Recurring Rate:</span>
                    <span className="text-amber-300 font-bold text-xs mt-0.5 block">
                      {formatAmountDisplay(selectedRecord.amount, selectedRecord.currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Cadence:</span>
                    <span className="text-white block mt-0.5">
                      {selectedRecord.billingCycle}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Next Scheduled:</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {selectedRecord.nextBillingDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Total Collected:</span>
                    <span className="text-white font-bold block mt-0.5">
                      {formatAmountDisplay(selectedRecord.totalCollectedToDate, selectedRecord.currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400 gap-2">
                  <div>
                    <span>Gateway: </span>
                    <strong className="text-stone-200">{selectedRecord.paymentMethod}</strong>
                    <span className="text-stone-500 font-mono"> ({selectedRecord.gatewayMaskedAccount})</span>
                  </div>
                  <div>
                    <span>Mandate Signed: </span>
                    <span className="text-stone-300 font-mono">{selectedRecord.mandateSignedDate}</span>
                  </div>
                </div>
              </div>

              {/* Autopay Control Bar */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-3 h-3 rounded-full ${selectedRecord.autoDebitEnabled ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Automated Monthly Debit is {selectedRecord.autoDebitEnabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {selectedRecord.autoDebitEnabled
                        ? 'System automatically dispatches debit instructions on cycle date.'
                        : 'Auto-debit suspended upon tenant/manager request.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAutoDebit(selectedRecord)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      selectedRecord.autoDebitEnabled
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {selectedRecord.autoDebitEnabled ? 'Pause Autopay' : 'Resume Autopay'}
                  </button>

                  <button
                    type="button"
                    disabled={collectingId === selectedRecord.id}
                    onClick={() => handleTriggerInstantCollection(selectedRecord)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Debit Now</span>
                  </button>
                </div>
              </div>

              {/* Past Automated Collection Attempts Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <h4 className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Past Monthly Collection History ({selectedRecord.recentAttempts.length} Runs)</span>
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Audit Trail Verified
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedRecord.recentAttempts.map((att) => (
                    <div
                      key={att.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 font-mono ${
                        att.status === 'SUCCESS'
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-stone-900">{att.attemptDate}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900">
                            {formatAmountDisplay(att.amount, selectedRecord.currency)}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              att.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-500 pt-0.5">
                        <span className="truncate max-w-xs">Gateway Ref: {att.gatewayRef}</span>
                        {att.receiptNumber && (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-amber-900">Receipt: {att.receiptNumber}</span>
                            {onOpenReceiptPreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecord(null);
                                  onOpenReceiptPreview(att.receiptNumber!);
                                }}
                                className="text-amber-700 hover:text-amber-900 underline flex items-center space-x-0.5"
                              >
                                <span>View</span>
                                <ExternalLink className="w-2.5 h-2.5 inline" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {att.failureReason && (
                        <div className="p-2 bg-rose-100/60 text-rose-900 rounded-lg text-[10px] font-sans mt-1">
                          ⚠️ {att.failureReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                  <span className="font-bold text-stone-800 block text-[11px] mb-0.5">Mandate Contract Notes:</span>
                  <p>{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">
                Enrolled under EstateFlow Payment Routing Engine
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW RECURRING PLAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                  <Plus className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Enroll Recurring Autopay Mandate</h3>
                  <p className="text-[11px] text-stone-400">Automate monthly rent or service fee collection.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurringPlan} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Tenant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPlan.tenantName}
                  onChange={(e) => setNewPlan({ ...newPlan, tenantName: e.target.value })}
                  placeholder="e.g. Brenda Vance or David Kim"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Unit Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlan.unit}
                    onChange={(e) => setNewPlan({ ...newPlan, unit: e.target.value })}
                    placeholder="e.g. Unit 3A"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Property
                  </label>
                  <select
                    value={newPlan.propertyName}
                    onChange={(e) => setNewPlan({ ...newPlan, propertyName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Oak Residence">Oak Residence</option>
                    <option value="Maple Court">Maple Court</option>
                    <option value="Cedar Row">Cedar Row</option>
                    <option value="Sunrise Plaza Douala">Sunrise Plaza Douala (CM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Collection Fee Type
                </label>
                <select
                  value={newPlan.collectionType}
                  onChange={(e) => setNewPlan({ ...newPlan, collectionType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="monthly_rent">Monthly Base Rent Collection</option>
                  <option value="service_fee">Monthly Service & Facilities Fee</option>
                  <option value="parking_fee">Reserved Parking Space Fee</option>
                  <option value="amenity_subscription">Gym & Clubhouse Membership</option>
                  <option value="utilities_charge">Utility & Trash Retainer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Collection Description Title
                </label>
                <input
                  type="text"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  placeholder="e.g. High-Speed Fiber & Smart Access Fee"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Monthly Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPlan.amount}
                    onChange={(e) => setNewPlan({ ...newPlan, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Currency
                  </label>
                  <select
                    value={newPlan.currency}
                    onChange={(e) => setNewPlan({ ...newPlan, currency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CFA">CFA (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Payment Channel / Gateway
                </label>
                <select
                  value={newPlan.paymentMethod}
                  onChange={(e) => setNewPlan({ ...newPlan, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Bank ACH Auto-Debit (Plaid)">Bank ACH Auto-Debit (Plaid)</option>
                  <option value="MTN Mobile Money Cameroon (*126# Auto-Debit)">MTN Mobile Money Cameroon (*126#)</option>
                  <option value="Orange Money Cameroun (WebPay Auto-Debit)">Orange Money Cameroun (#150#)</option>
                  <option value="Visa Recurring Auto-Pay">Visa / Mastercard Recurring Auto-Pay</option>
                  <option value="SEPA Core Direct Debit">SEPA Core Direct Debit (Eurozone)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enroll Recurring Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
