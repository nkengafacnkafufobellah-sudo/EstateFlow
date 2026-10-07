import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Building,
  Wrench,
  Clock,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  BellRing,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Layers,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import {
  INITIAL_ORG,
  REVENUE_HISTORY,
  URGENT_MAINTENANCE_LIST,
  LEASE_EXPIRATIONS,
  INITIAL_NOTIFICATIONS,
  TENANTS_DATA,
} from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { TenantRecord } from '../types';

interface CommandCenterProps {
  onNavigateTab: (tab: any) => void;
  onSelectMaintenanceTicket: (ticketId: string) => void;
  onOpenQuickAction: (actionType: 'property' | 'payment' | 'request' | 'invite') => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigateTab,
  onSelectMaintenanceTicket,
  onOpenQuickAction,
}) => {
  const { showSecurityNotification, logApiAction } = useSecurity();
  const { formatAmount } = useCurrency();
  const [activeRevenueMonth, setActiveRevenueMonth] = useState<number>(REVENUE_HISTORY.length - 1);
  const [renewalSentUnits, setRenewalSentUnits] = useState<string[]>([]);
  const [noticesSentUnits, setNoticesSentUnits] = useState<string[]>([]);

  // Renewal Radar State
  const [isBannerExpanded, setIsBannerExpanded] = useState<boolean>(true);
  const [selectedRenewalWindow, setSelectedRenewalWindow] = useState<'ALL' | '30' | '60' | '90'>('ALL');
  const [workflowTenant, setWorkflowTenant] = useState<TenantRecord | null>(null);

  // Workflow Form State
  const [proposedRent, setProposedRent] = useState<number>(1500);
  const [proposedTermMonths, setProposedTermMonths] = useState<number>(12);
  const [includedIncentive, setIncludedIncentive] = useState<string>('Standard Market Lease');
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState<boolean>(false);

  // Filter tenants expiring in next 90 days
  const upcomingRenewals = TENANTS_DATA.filter((t) => t.daysRemaining <= 90).sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  const renewals30 = upcomingRenewals.filter((t) => t.daysRemaining <= 30);
  const renewals60 = upcomingRenewals.filter((t) => t.daysRemaining > 30 && t.daysRemaining <= 60);
  const renewals90 = upcomingRenewals.filter((t) => t.daysRemaining > 60 && t.daysRemaining <= 90);

  const filteredUpcoming = upcomingRenewals.filter((t) => {
    if (selectedRenewalWindow === '30') return t.daysRemaining <= 30;
    if (selectedRenewalWindow === '60') return t.daysRemaining > 30 && t.daysRemaining <= 60;
    if (selectedRenewalWindow === '90') return t.daysRemaining > 60 && t.daysRemaining <= 90;
    return true;
  });

  const totalMonthlyExposure = upcomingRenewals.reduce((sum, t) => sum + t.monthlyRent, 0);

  const currentMonthData = REVENUE_HISTORY[activeRevenueMonth];
  const maxBilled = Math.max(...REVENUE_HISTORY.map((r) => r.billed));

  const handleSendSingleNotice = (unit: string, tenantName: string, daysRemaining: number) => {
    setNoticesSentUnits((prev) => [...prev, unit]);
    logApiAction(
      'SEND_LEASE_NOTICE',
      unit,
      `Automated ${daysRemaining}-day legal lease renewal expiration notice dispatched to ${tenantName}`
    );
    showSecurityNotification(`[Radar Alert] Official ${daysRemaining}-day lease notice dispatched to ${tenantName} (${unit}). Audit logged.`);
  };

  const handleOpenWorkflowModal = (tenant: TenantRecord) => {
    setWorkflowTenant(tenant);
    // Proposed rent defaults to +4.5% increase
    setProposedRent(Math.round(tenant.monthlyRent * 1.045));
    setProposedTermMonths(12);
    setIncludedIncentive('Zero Deposit Increase + Free Storage (1st Month)');
  };

  const handleDispatchWorkflowOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowTenant) return;

    setIsSubmittingWorkflow(true);
    setTimeout(() => {
      setRenewalSentUnits((prev) => [...prev, workflowTenant.unit]);
      setIsSubmittingWorkflow(false);
      logApiAction(
        'INITIATE_RENEWAL_WORKFLOW',
        workflowTenant.unit,
        `Generated HMAC-SHA256 renewal offer agreement for ${workflowTenant.name} at ${formatAmount(proposedRent)}/mo (${proposedTermMonths} mos)`
      );
      showSecurityNotification(
        `[Renewal Workflow] Formal proposal dispatched to ${workflowTenant.name} (${workflowTenant.unit}): ${formatAmount(proposedRent)}/mo for ${proposedTermMonths} months.`
      );
      setWorkflowTenant(null);
    }, 450);
  };

  const handleBulk60DayNotices = () => {
    const toSend = renewals60.filter((t) => !noticesSentUnits.includes(t.unit));
    if (toSend.length === 0) {
      showSecurityNotification('All 60-day window notices have already been dispatched.');
      return;
    }
    setNoticesSentUnits((prev) => [...prev, ...toSend.map((t) => t.unit)]);
    logApiAction('BULK_60D_NOTICES', 'Batch Dispatch', `Dispatched legal 60-day renewal notices to ${toSend.length} units`);
    showSecurityNotification(`[Bulk Action] Dispatched official 60-day expiration notices to ${toSend.length} tenants.`);
  };

  const handleSendRenewal = (unit: string, tenant: string) => {
    setRenewalSentUnits((prev) => [...prev, unit]);
    showSecurityNotification(`Renewal proposal generated & emailed to ${tenant} (${unit}). Audit event logged.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-amber-800 uppercase">
            <span>EstateFlow</span>
            <span>•</span>
            <span>Web Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Command Center
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            Portfolio health for {INITIAL_ORG.name} · {INITIAL_ORG.dateString}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              showSecurityNotification('Generating HMAC-signed financial & occupancy audit report (PDF). Download initialized.');
              const blob = new Blob([
                `ESTATEFLOW AUDIT REPORT\nOrganization: ${INITIAL_ORG.name}\nDate: ${INITIAL_ORG.dateString}\nAuthor: ${INITIAL_ORG.preparedBy}\nMonthly Revenue: $${INITIAL_ORG.portfolioSummary.monthlyRevenue.toLocaleString()}\nOccupancy: ${INITIAL_ORG.portfolioSummary.occupancyPercent}%\nOpen Work Orders: ${INITIAL_ORG.portfolioSummary.openMaintenance}\nStatus: Verified Least-Privilege Scope`
              ], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `EstateFlow-CommandCenter-Report-${new Date().toISOString().slice(0, 10)}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            id="cmd-export-report-btn"
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            title="Download executive portfolio report"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>Export report</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('request')}
            id="cmd-quick-action-btn"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quick action</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED LEASE RENEWAL RADAR ALERT BANNER (30, 60, 90 Days Windows) */}
      <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden transition-all">
        {/* Banner Header Strip */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/30 text-white">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-900/60 text-amber-200 border border-amber-400/40">
                    Automated Alert
                  </span>
                  <span className="text-xs font-semibold text-amber-100">
                    Portfolio Renewal Radar
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    · {upcomingRenewals.length} Leases Expiring in Next 90 Days
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                  Upcoming Lease Renewals: {formatAmount(totalMonthlyExposure)}/mo Pipeline at Stake
                </h2>
                <p className="text-xs text-amber-100/90 mt-0.5 max-w-2xl">
                  Automated retention radar flagged expiring leases across 30, 60, and 90-day statutory notice intervals. Initiate renewal proposals early to maintain 100% portfolio occupancy.
                </p>
              </div>
            </div>

            {/* Quick Action & Banner Toggle */}
            <div className="flex items-center space-x-2 self-start lg:self-center">
              <button
                onClick={handleBulk60DayNotices}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/25"
                title="Send official 60-day notice batch to all tenants in 31-60 day window"
              >
                <Send className="w-3.5 h-3.5 text-amber-200" />
                <span>Batch 60D Notices ({renewals60.length})</span>
              </button>
              <button
                onClick={() => setIsBannerExpanded(!isBannerExpanded)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Toggle banner visibility"
              >
                {isBannerExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Window Filter Tabs Bar */}
          <div className="mt-4 pt-3 border-t border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedRenewalWindow('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedRenewalWindow === 'ALL'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'bg-amber-900/40 text-amber-100 hover:bg-amber-900/60'
                }`}
              >
                All Windows ({upcomingRenewals.length})
              </button>
              <button
                onClick={() => setSelectedRenewalWindow('30')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                  selectedRenewalWindow === '30'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-rose-950/50 text-rose-200 hover:bg-rose-900/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block"></span>
                <span>🚨 Next 30 Days ({renewals30.length}) · Urgent</span>
              </button>
              <button
                onClick={() => setSelectedRenewalWindow('60')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                  selectedRenewalWindow === '60'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-amber-900/40 text-amber-200 hover:bg-amber-900/60'
                }`}
              >
                <span>⚠️ 31–60 Days ({renewals60.length}) · Notice Window</span>
              </button>
              <button
                onClick={() => setSelectedRenewalWindow('90')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                  selectedRenewalWindow === '90'
                    ? 'bg-sky-400 text-sky-950 shadow-xs'
                    : 'bg-sky-950/50 text-sky-200 hover:bg-sky-900/60'
                }`}
              >
                <span>📅 61–90 Days ({renewals90.length}) · Advance Outreach</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-amber-200">
              Avg days to expiry: <strong>{Math.round(upcomingRenewals.reduce((a, b) => a + b.daysRemaining, 0) / (upcomingRenewals.length || 1))} days</strong>
            </div>
          </div>
        </div>

        {/* Collapsible Content Area */}
        {isBannerExpanded && (
          <div className="p-4 sm:p-5 bg-amber-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUpcoming.map((tenant) => {
                const isUrgent30 = tenant.daysRemaining <= 30;
                const isNotice60 = tenant.daysRemaining > 30 && tenant.daysRemaining <= 60;
                const isSentRenewal = renewalSentUnits.includes(tenant.unit);
                const isSentNotice = noticesSentUnits.includes(tenant.unit);

                return (
                  <div
                    key={tenant.id}
                    className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                      isUrgent30
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : isNotice60
                        ? 'border-amber-300'
                        : 'border-stone-200'
                    }`}
                  >
                    <div>
                      {/* Card Top: Window Pill & Countdown */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                            isUrgent30
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isNotice60
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {isUrgent30
                              ? `Expires in ${tenant.daysRemaining} days`
                              : isNotice60
                              ? `60D Window (${tenant.daysRemaining}d left)`
                              : `90D Horizon (${tenant.daysRemaining}d left)`}
                          </span>
                        </span>

                        <span className="font-mono text-xs font-bold text-stone-700">
                          {formatAmount(tenant.monthlyRent)}/mo
                        </span>
                      </div>

                      {/* Tenant & Property Information */}
                      <div className="mt-2.5">
                        <h4 className="font-bold text-sm text-stone-900 leading-tight">
                          {tenant.name}
                        </h4>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center space-x-1.5">
                          <span className="font-semibold text-stone-700">
                            Unit {tenant.unit}
                          </span>
                          <span>•</span>
                          <span>{tenant.propertyName}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>Lease End: <strong>{tenant.leaseEnd}</strong></span>
                        </div>
                      </div>

                      {/* Status indicator tag */}
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Status:</span>
                        {isSentRenewal ? (
                          <span className="inline-flex items-center space-x-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Renewal Dispatched</span>
                          </span>
                        ) : isSentNotice ? (
                          <span className="inline-flex items-center space-x-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Check className="w-3 h-3 text-amber-600" />
                            <span>Notice Sent</span>
                          </span>
                        ) : isUrgent30 ? (
                          <span className="inline-flex items-center space-x-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Action Required</span>
                          </span>
                        ) : (
                          <span className="font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            Notice Queued
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick-links to initiate renewal workflows */}
                    <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenWorkflowModal(tenant)}
                        id={`initiate-renewal-btn-${tenant.unit}`}
                        className={`w-full inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                          isSentRenewal
                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            : 'bg-amber-700 hover:bg-amber-800 text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isSentRenewal ? 'Revise Renewal Offer' : '⚡ Initiate Renewal Workflow'}</span>
                      </button>

                      <div className="flex items-center justify-between text-[11px] gap-2">
                        <button
                          onClick={() => handleSendSingleNotice(tenant.unit, tenant.name, tenant.daysRemaining)}
                          disabled={isSentNotice}
                          className="text-stone-600 hover:text-stone-900 inline-flex items-center space-x-1 disabled:opacity-50"
                          title="Send quick email/SMS notification to tenant"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isSentNotice ? 'Notice Sent' : 'Send Expiration Notice'}</span>
                        </button>

                        <button
                          onClick={() => onNavigateTab('tenants')}
                          className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center space-x-0.5"
                          title="Open in Tenants Directory"
                        >
                          <span>Directory</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue - Warm Ochre highlight as in document */}
        <div className="bg-[#B45309] text-white p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="text-xs font-medium text-amber-100 uppercase tracking-wider">
            Monthly revenue
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight">
            ${INITIAL_ORG.portfolioSummary.monthlyRevenue.toLocaleString()}
          </div>
          <div className="mt-2.5 flex items-center text-xs font-semibold text-amber-100">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{INITIAL_ORG.portfolioSummary.monthlyRevenueChange}</span>
          </div>
        </div>

        {/* Rent Collected */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Rent collected
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            ${INITIAL_ORG.portfolioSummary.rentCollected.toLocaleString()}
          </div>
          <div className="mt-2.5 flex items-center text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>{INITIAL_ORG.portfolioSummary.collectionRate}% collection rate</span>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Occupancy
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            {INITIAL_ORG.portfolioSummary.occupancyPercent}%
          </div>
          <div className="mt-2.5 flex items-center text-xs text-stone-600">
            <Building className="w-3.5 h-3.5 mr-1 text-stone-400" />
            <span>{INITIAL_ORG.portfolioSummary.leasedUnits} of {INITIAL_ORG.portfolioSummary.totalUnits} units leased</span>
          </div>
        </div>

        {/* Open Maintenance */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Open maintenance
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            {INITIAL_ORG.portfolioSummary.openMaintenance}
          </div>
          <div className="mt-2.5 flex items-center text-xs font-semibold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span>{INITIAL_ORG.portfolioSummary.urgentMaintenance} urgent · SLA watch</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue & Rent Collection Chart vs Urgent Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue & Rent Collection */}
        <div className="lg:col-span-2 bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Revenue & rent collection
                </h2>
                <p className="text-xs text-stone-500">
                  Mar – Aug 2026 · USD · Sunrise Holdings Portfolio
                </p>
              </div>

              {/* Legend & Month Details */}
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-xs bg-stone-800 inline-block"></span>
                  <span className="text-stone-700 font-medium">Billed revenue</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block"></span>
                  <span className="text-stone-700 font-medium">Rent collected</span>
                </div>
              </div>
            </div>

            {/* Interactive Bar Comparison Chart */}
            <div className="mt-6 pt-2">
              <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
                {REVENUE_HISTORY.map((entry, idx) => {
                  const billedHeight = Math.round((entry.billed / maxBilled) * 100);
                  const collectedHeight = Math.round((entry.collected / maxBilled) * 100);
                  const isSelected = idx === activeRevenueMonth;

                  return (
                    <div
                      key={entry.month}
                      onClick={() => setActiveRevenueMonth(idx)}
                      className={`flex-1 flex flex-col items-center cursor-pointer group transition-all p-1.5 rounded-lg ${
                        isSelected ? 'bg-amber-50/70 ring-1 ring-amber-300' : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Numbers tooltip on hover or select */}
                      <div
                        className={`text-[10px] font-mono mb-1 transition-opacity whitespace-nowrap ${
                          isSelected ? 'opacity-100 font-bold text-stone-900' : 'opacity-0 group-hover:opacity-100 text-stone-500'
                        }`}
                      >
                        ${(entry.collected / 1000).toFixed(1)}k
                      </div>

                      {/* Side-by-side or stacked bars */}
                      <div className="w-full flex items-end justify-center space-x-1 h-36">
                        <div
                          style={{ height: `${billedHeight}%` }}
                          className="w-3 sm:w-4 rounded-t-xs bg-stone-800 transition-all group-hover:bg-stone-700"
                          title={`Billed: $${entry.billed.toLocaleString()}`}
                        />
                        <div
                          style={{ height: `${collectedHeight}%` }}
                          className="w-3 sm:w-4 rounded-t-xs bg-amber-600 transition-all group-hover:bg-amber-500"
                          title={`Collected: $${entry.collected.toLocaleString()}`}
                        />
                      </div>

                      {/* Month label */}
                      <span
                        className={`mt-2 text-xs font-medium ${
                          isSelected ? 'text-amber-900 font-bold' : 'text-stone-600'
                        }`}
                      >
                        {entry.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Month Drilldown Summary */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 bg-stone-50/70 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-stone-900">{currentMonthData.month} 2026 Audit:</span>
              <span>Billed: <strong className="text-stone-900 font-mono">${currentMonthData.billed.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Collected: <strong className="text-stone-900 font-mono">${currentMonthData.collected.toLocaleString()}</strong></span>
            </div>
            <div className="font-semibold text-emerald-700">
              {((currentMonthData.collected / currentMonthData.billed) * 100).toFixed(1)}% Realized
            </div>
          </div>
        </div>

        {/* Right Col: Urgent Maintenance (3 Flagged) */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">Urgent maintenance</h2>
                <p className="text-xs text-stone-500">Live SLA monitoring</p>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                3 flagged
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {URGENT_MAINTENANCE_LIST.map((item) => {
                const isUrgent = item.priority === 'URGENT';
                const isHigh = item.priority === 'HIGH';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectMaintenanceTicket(item.id);
                      onNavigateTab('maintenance');
                    }}
                    className="p-3 rounded-xl border border-stone-100 hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-all flex items-start justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {item.property} · {item.unit}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-1">
                        Status: {item.status}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('maintenance')}
            className="mt-4 w-full py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>View all 12 requests in workflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Second Row: Lease Expirations, Notifications, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lease Expirations (Next 90 Days) */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900">Lease expirations</h2>
            <span className="text-xs font-medium text-stone-500">Next 90 days</span>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {LEASE_EXPIRATIONS.map((lease) => {
              const alreadySent = renewalSentUnits.includes(lease.unit);
              return (
                <div key={lease.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <div className="text-xs font-bold text-stone-900">
                      {lease.unit} · {lease.property}
                    </div>
                    <div className="text-[11px] text-stone-500">{lease.tenantName}</div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-amber-100 text-amber-900 rounded">
                      {lease.expiryDate.slice(0, 6)}
                    </span>
                    <div className="mt-1">
                      {alreadySent ? (
                        <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-end">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Offer sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRenewal(lease.unit, lease.tenantName)}
                          className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline flex items-center justify-end"
                        >
                          <Send className="w-2.5 h-2.5 mr-0.5" /> Send renewal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications (3 New) */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900">Notifications</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              3 new
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {INITIAL_NOTIFICATIONS.map((notif) => (
              <div key={notif.id} className="text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 mt-1 rounded-full bg-amber-600 flex-shrink-0"></span>
                  <div>
                    <p className="text-stone-800 leading-snug">{notif.description}</p>
                    <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                      {notif.timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (Jump to) */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900">Quick actions</h2>
            <span className="text-xs font-medium text-stone-400">Jump to</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onOpenQuickAction('property')}
              className="p-3 text-left rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                Add property
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Register a building</div>
            </button>

            <button
              onClick={() => onOpenQuickAction('payment')}
              className="p-3 text-left rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                Log payment
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Record rent received</div>
            </button>

            <button
              onClick={() => onOpenQuickAction('request')}
              className="p-3 text-left rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                New request
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Open work order</div>
            </button>

            <button
              onClick={() => onOpenQuickAction('invite')}
              className="p-3 text-left rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                Invite tenant
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Send portal access</div>
            </button>

            <button
              onClick={() => onOpenQuickAction('momo' as any)}
              className="p-3 text-left rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 transition-all group col-span-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                  <span>📱 Mobile Money Terminal</span>
                  <span className="text-[10px] bg-yellow-400 text-stone-900 px-1 rounded font-bold">MoMo *126#</span>
                  <span className="text-[10px] bg-[#FF7900] text-white px-1 rounded font-bold">OM #150#</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800">🇨🇲 Instant</span>
              </div>
              <div className="text-[10px] text-stone-600 mt-0.5">
                Collect rent via MTN MoMo or Orange Money with real-time USSD push
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Environment Notice Banner (Exact wording from document) */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Demo environment</strong> — all figures, tenants, and work orders shown are sample data for prototype review only.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[11px] text-amber-800">
          {INITIAL_ORG.preparedBy} · Page 1 of 8
        </span>
      </div>

      {/* RENEWAL WORKFLOW INITIATION MODAL */}
      {workflowTenant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-300 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Initiate Lease Renewal Workflow
                  </h3>
                  <p className="text-xs text-stone-500">
                    {workflowTenant.name} · Unit {workflowTenant.unit} ({workflowTenant.propertyName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowTenant(null)}
                className="text-stone-400 hover:text-stone-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchWorkflowOffer} className="space-y-4 text-xs">
              {/* Context Callout */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Current Expiration: {workflowTenant.leaseEnd}</span>
                  <span className="text-[11px] text-amber-800">
                    Current Monthly Rent: <strong>{formatAmount(workflowTenant.monthlyRent)}/mo</strong> ({workflowTenant.leaseTermMonths} months term)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-200/80 text-amber-900">
                  {workflowTenant.daysRemaining} days remaining
                </span>
              </div>

              {/* Proposed Rent & Adjustment Calculation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700">Proposed Monthly Rent</label>
                  <span className="text-[11px] font-mono text-stone-500">
                    Adjustment:{' '}
                    <strong
                      className={
                        proposedRent >= workflowTenant.monthlyRent
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }
                    >
                      {proposedRent >= workflowTenant.monthlyRent ? '+' : ''}
                      {(
                        ((proposedRent - workflowTenant.monthlyRent) /
                          workflowTenant.monthlyRent) *
                        100
                      ).toFixed(1)}
                      %
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold">$</span>
                    <input
                      type="number"
                      required
                      min={100}
                      step={10}
                      value={proposedRent}
                      onChange={(e) => setProposedRent(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-stone-300 font-mono font-bold text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <select
                      value={proposedTermMonths}
                      onChange={(e) => setProposedTermMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 font-medium text-xs bg-stone-50 h-full"
                    >
                      <option value={12}>12 Months (Standard Annual)</option>
                      <option value={24}>24 Months (2-Year Fixed)</option>
                      <option value={6}>6 Months (Short Term)</option>
                      <option value={1}>Month-to-Month (+10% Premium)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[10px] text-stone-400">Quick Adjust:</span>
                  {[
                    { label: 'Same Rent (0%)', factor: 1.0 },
                    { label: '+3.5% (Inflation)', factor: 1.035 },
                    { label: '+5.0% (Market)', factor: 1.05 },
                    { label: '+7.5% (Prime)', factor: 1.075 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setProposedRent(Math.round(workflowTenant.monthlyRent * preset.factor))}
                      className="px-2 py-0.5 rounded bg-stone-100 hover:bg-amber-100 text-[10px] font-medium text-stone-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concessions / Incentive Clause */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Tenant Retention Incentive / Concession
                </label>
                <select
                  value={includedIncentive}
                  onChange={(e) => setIncludedIncentive(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-stone-50"
                >
                  <option value="Zero Deposit Increase + Free Storage (1st Month)">
                    Zero Deposit Increase + Free Storage Locker (1st Month)
                  </option>
                  <option value="$100 Rent Credit on 1st Month + Paint Touchup">
                    $100 Rent Credit on 1st Month + Complimentary Paint Touchup
                  </option>
                  <option value="Complimentary Deep Carpet Cleaning">
                    Complimentary Professional Carpet Cleaning
                  </option>
                  <option value="Free Covered Parking Stall for 12 Months">
                    Free Reserved Parking Stall for 12 Months
                  </option>
                  <option value="None (Standard Lease Renewal)">
                    None (Standard Renewal Contract)
                  </option>
                </select>
              </div>

              {/* Cryptographic Signing Audit Preview */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 space-y-1 text-[11px]">
                <div className="flex items-center space-x-1 font-bold text-stone-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HMAC-SHA256 Tokenized Electronic Offer Package</span>
                </div>
                <div className="font-mono text-[10px] text-stone-500 truncate">
                  Token: hmac_sec_77b9f8_{workflowTenant.id}_{Date.now().toString(36)}
                </div>
                <p className="text-[10px] text-stone-500">
                  Upon dispatch, {workflowTenant.email} receives an instant portal notification and secure one-click digital signing link valid for 30 days.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setWorkflowTenant(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWorkflow}
                  id="dispatch-renewal-modal-btn"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold shadow-sm inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {isSubmittingWorkflow ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSubmittingWorkflow ? 'Generating HMAC Package...' : 'Dispatch Renewal Offer'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
