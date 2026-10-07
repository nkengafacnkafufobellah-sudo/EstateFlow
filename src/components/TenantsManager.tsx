import React, { useState } from 'react';
import {
  Users,
  Search,
  Lock,
  FileText,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Download,
  Eye,
  FileCheck,
  Smartphone,
  Zap,
} from 'lucide-react';
import { TenantRecord, TenantDocument } from '../types';
import { TENANTS_DATA } from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useReceipts } from '../context/ReceiptsContext';
import { MobileMoneyPaymentModal } from './MobileMoneyPaymentModal';

export const TenantsManager: React.FC = () => {
  const { activeRole, canPerform, showSecurityNotification } = useSecurity();
  const { getReceiptsForTenant, openReceiptPreview, downloadReceipt } = useReceipts();
  const [tenants, setTenants] = useState<TenantRecord[]>(TENANTS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'pastdue'>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(TENANTS_DATA[0]);
  const [showMobileDetailView, setShowMobileDetailView] = useState(false);

  // Mobile Money Collection Modal State
  const [isMobileMoneyModalOpen, setIsMobileMoneyModalOpen] = useState(false);
  const [mobileMoneyTenant, setMobileMoneyTenant] = useState<TenantRecord | null>(null);

  // System States Demo (Loading, Empty, Error, Success)
  const [simulatedState, setSimulatedState] = useState<'normal' | 'loading' | 'empty' | 'error' | 'success'>('normal');
  const [signedDocModal, setSignedDocModal] = useState<{ doc: TenantDocument; hmacLink: string; ttl: number } | null>(null);

  // Filter tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return t.rentStatus === 'Current' || t.rentStatus === 'Due soon';
    if (statusFilter === 'expiring') return t.rentStatus === 'Renewal open' || t.daysRemaining <= 30;
    if (statusFilter === 'pastdue') return t.rentStatus === 'Past due';
    return true;
  });

  const handleSelectTenant = (tenant: TenantRecord) => {
    setSelectedTenant(tenant);
    setShowMobileDetailView(true);
  };

  const handleOpenDocument = (doc: TenantDocument) => {
    if (doc.accessLevel === 'Owner only' && !canPerform('documents.owner_only')) {
      showSecurityNotification(`Access Denied: "${doc.name}" is tagged [Owner only]. Your current role (${activeRole}) cannot decrypt this private document.`);
      return;
    }
    if (doc.accessLevel === 'Restricted' && !canPerform('documents.restricted')) {
      showSecurityNotification(`Access Denied: "${doc.name}" is [Restricted] to Owner and Property Manager.`);
      return;
    }

    // Generate simulated HMAC signed link with 900s TTL (15 min) as documented in Page 8 & Page 3
    const hmacToken = `hmac_sha256_${Math.random().toString(36).substring(2, 10)}_exp${Date.now() + 900000}`;
    const hmacLink = `https://estateflow.storage.internal/docs/${doc.id}?token=${hmacToken}&ttl=900s`;

    setSignedDocModal({
      doc,
      hmacLink,
      ttl: 900,
    });
    showSecurityNotification(`HMAC-signed temporary URL generated for ${doc.name} (TTL: 900s / 15m).`);
  };

  const handleSendRenewalOffer = () => {
    setSimulatedState('success');
    showSecurityNotification(`Renewal offer sent to ${selectedTenant?.name}. 🔒 signed-lease.pdf stays owner-only until signed.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            EstateFlow · Page 3 of 8 · Tenants & Lease Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Tenant Directory & Lease Lifecycle
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            Tenant directory, lease detail & system states · FOBELLAH NKENGAFAC NKAFU · Sep 20, 2026
          </p>
        </div>

        {/* System State Simulator Buttons */}
        <div className="flex items-center space-x-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs overflow-x-auto">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Test States:
          </span>
          <button
            onClick={() => setSimulatedState('normal')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              simulatedState === 'normal' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setSimulatedState('loading')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              simulatedState === 'loading' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Loading
          </button>
          <button
            onClick={() => setSimulatedState('empty')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              simulatedState === 'empty' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setSimulatedState('error')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              simulatedState === 'error' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Error (502)
          </button>
          <button
            onClick={() => setSimulatedState('success')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              simulatedState === 'success' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Success
          </button>
        </div>
      </div>

      {/* Main Grid: Directory vs Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tenant Directory (5 or 6 Cols) */}
        <div className={`lg:col-span-6 ${showMobileDetailView ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search tenants by name, email, or unit…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                />
              </div>

              {/* Status Tab Filters */}
              <div className="flex items-center space-x-1 overflow-x-auto text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All · 128
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Active · 112
                </button>
                <button
                  onClick={() => setStatusFilter('expiring')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    statusFilter === 'expiring'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Expiring · 9
                </button>
                <button
                  onClick={() => setStatusFilter('pastdue')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    statusFilter === 'pastdue'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Past due · 7
                </button>
              </div>
            </div>

            {/* Simulated State: Loading Skeleton */}
            {simulatedState === 'loading' && (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="text-xs text-stone-500 font-medium">
                  Fetching tenant records… skeleton rows preserve layout while the directory loads.
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-stone-100 rounded-xl" />
                ))}
              </div>
            )}

            {/* Simulated State: Empty State */}
            {simulatedState === 'empty' && (
              <div className="text-center py-12 px-4 space-y-3">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <div className="text-xs font-semibold text-stone-700">
                  No tenants match "Maple Loft."
                </div>
                <p className="text-[11px] text-stone-500">
                  Clear filters or add a tenant to this property.
                </p>
                <button
                  onClick={() => setSimulatedState('normal')}
                  className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Simulated State: Error 502 State */}
            {simulatedState === 'error' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Couldn't load lease documents (502)</span>
                </div>
                <p className="text-rose-700">
                  Retry — your unsent draft is preserved in local session cache.
                </p>
                <button
                  onClick={() => setSimulatedState('normal')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Request</span>
                </button>
              </div>
            )}

            {/* Simulated State: Success State */}
            {simulatedState === 'success' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Renewal offer sent to {selectedTenant?.name}</span>
                </div>
                <p className="text-emerald-700 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>signed-lease.pdf stays owner-only until signed</span>
                </p>
              </div>
            )}

            {/* Normal Directory Table (Desktop) / Cards (<760px) */}
            {simulatedState === 'normal' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                    <tr>
                      <th className="py-2.5 px-2">Tenant</th>
                      <th className="py-2.5 px-2">Unit</th>
                      <th className="py-2.5 px-2">Lease ends</th>
                      <th className="py-2.5 px-2">Rent status</th>
                      <th className="py-2.5 px-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTenants.map((t) => {
                      const isSelected = selectedTenant?.id === t.id;
                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleSelectTenant(t)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-stone-50'
                          }`}
                        >
                          <td className="py-3 px-2 font-bold text-stone-900 whitespace-nowrap">
                            {t.name}
                          </td>
                          <td className="py-3 px-2 text-stone-600 whitespace-nowrap">
                            {t.unit} · {t.propertyName}
                          </td>
                          <td className="py-3 px-2 font-mono text-stone-700 whitespace-nowrap">
                            {t.leaseEnd}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.rentStatus === 'Current'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : t.rentStatus === 'Due soon'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : t.rentStatus === 'Past due'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {t.rentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                            ${t.balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Tenant Detail View (Amara Diallo TNT-1042) */}
        {selectedTenant && (
          <div
            className={`lg:col-span-6 space-y-4 ${
              !showMobileDetailView ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Back button for mobile view */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileDetailView(false)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to tenant directory</span>
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
              {/* Tenant Profile Banner */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">{selectedTenant.name}</h2>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    {selectedTenant.code} · Unit {selectedTenant.unit}, {selectedTenant.propertyName}
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Lease active
                </span>
              </div>

              {/* 3 Overview Boxes */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-[11px] text-stone-500 font-medium">Monthly rent</div>
                  <div className="text-base font-extrabold text-stone-900 font-mono mt-0.5">
                    ${selectedTenant.monthlyRent.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-[11px] text-stone-500 font-medium">Next due</div>
                  <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                    {selectedTenant.nextDueDate.slice(0, 6)}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-[11px] text-stone-500 font-medium">Autopay</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {selectedTenant.autopay ? 'On' : 'Off'}
                  </div>
                </div>
              </div>

              {/* Mobile Money Rent Collection Bar (MTN MoMo & Orange Money) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-xl border border-amber-300/70 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1.5 bg-yellow-400 text-stone-950 font-bold rounded-lg shadow-2xs">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-stone-900 flex items-center space-x-1.5">
                      <span>Collect Rent via Mobile Money</span>
                      <span className="text-[10px] bg-yellow-400 text-stone-900 px-1.5 py-0.2 rounded font-bold">MoMo *126#</span>
                      <span className="text-[10px] bg-[#FF7900] text-white px-1.5 py-0.2 rounded font-bold">OM #150#</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Dispatch instant USSD collection push to {selectedTenant.name} ({selectedTenant.unit}).
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMoneyTenant(selectedTenant);
                    setIsMobileMoneyModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:opacity-95 text-stone-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-stone-950" />
                  <span>Collect via MoMo / OM</span>
                </button>
              </div>

              {/* Lease Term & Interactive Milestone Timeline */}
              <div className="space-y-3 bg-stone-50/70 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-900">
                    Lease term · {selectedTenant.leaseTermMonths} months
                  </div>
                  <div className="text-xs text-stone-600 font-mono">
                    <strong>{selectedTenant.daysElapsed} days elapsed</strong> · {selectedTenant.daysRemaining} remaining before renewal
                  </div>
                </div>

                {/* Milestone Progress Line */}
                <div className="relative pt-4 pb-2">
                  <div className="w-full h-1 bg-stone-200 rounded-full relative">
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((selectedTenant.daysElapsed / (selectedTenant.daysElapsed + selectedTenant.daysRemaining)) * 100))}%`,
                      }}
                      className="h-full bg-amber-600 rounded-full"
                    />
                  </div>

                  {/* 5 Milestone points */}
                  <div className="flex justify-between items-start mt-2 text-[10px]">
                    <div className="text-left">
                      <div className="w-3 h-3 rounded-full bg-amber-600 -mt-3.5 mb-1 ring-2 ring-white"></div>
                      <div className="font-bold text-stone-800">Move-in</div>
                      <div className="text-stone-500 font-mono">{selectedTenant.moveInDate}</div>
                    </div>
                    <div className="text-left">
                      <div className="w-3 h-3 rounded-full bg-amber-600 -mt-3.5 mb-1 ring-2 ring-white"></div>
                      <div className="font-bold text-stone-800">Q1 check-in</div>
                      <div className="text-stone-500 font-mono">{selectedTenant.q1CheckinDate}</div>
                    </div>
                    <div className="text-left">
                      <div className="w-3 h-3 rounded-full bg-amber-600 -mt-3.5 mb-1 ring-2 ring-white"></div>
                      <div className="font-bold text-stone-800">Inspection</div>
                      <div className="text-stone-500 font-mono">{selectedTenant.inspectionDate}</div>
                    </div>
                    <div className="text-left">
                      <div className="w-3 h-3 rounded-full bg-amber-700 -mt-3.5 mb-1 ring-4 ring-amber-200"></div>
                      <div className="font-bold text-amber-900">Today</div>
                      <div className="text-amber-800 font-mono font-semibold">{selectedTenant.todayDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 rounded-full bg-stone-300 -mt-3.5 mb-1 ring-2 ring-white ml-auto"></div>
                      <div className="font-bold text-stone-800">Renewal</div>
                      <div className="text-stone-500 font-mono">{selectedTenant.renewalDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Private Documents with RBAC Security Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                  <div className="flex items-center space-x-1.5">
                    <span>Private documents</span>
                    <span className="text-[10px] font-normal text-stone-400">
                      (Least-privilege RBAC enforced)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700">
                    Role: {activeRole}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTenant.documents.map((doc) => {
                    const isOwnerOnly = doc.accessLevel === 'Owner only';
                    const isRestricted = doc.accessLevel === 'Restricted';
                    const canAccess =
                      isOwnerOnly
                        ? canPerform('documents.owner_only')
                        : isRestricted
                        ? canPerform('documents.restricted')
                        : true;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                          canAccess
                            ? 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/30'
                            : 'border-stone-200 bg-stone-50/80 opacity-75'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {doc.isLocked ? (
                            <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${canAccess ? 'text-amber-700' : 'text-stone-400'}`} />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          )}
                          <span className="font-medium text-stone-800 truncate">
                            {canAccess ? doc.name : '••••••••-lease-document.pdf'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                              isOwnerOnly
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : isRestricted
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {doc.accessLevel}
                          </span>
                          <span className="text-[10px] text-stone-400 underline hover:text-stone-700">
                            {canAccess ? 'Open (HMAC)' : 'Locked'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Verified Payment Receipts (PDF) for this Tenant */}
                {selectedTenant && (() => {
                  const tenantReceipts = getReceiptsForTenant(selectedTenant.name, selectedTenant.unit);
                  return (
                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                        <div className="flex items-center space-x-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Official Payment Receipts (PDF)</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {tenantReceipts.length} Verified
                        </span>
                      </div>

                      {tenantReceipts.length > 0 ? (
                        <div className="space-y-1.5">
                          {tenantReceipts.map((rcpt) => (
                            <div
                              key={rcpt.id}
                              className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-xs hover:border-amber-200 transition-colors"
                            >
                              <div>
                                <div className="font-semibold text-stone-900 flex items-center space-x-1.5">
                                  <span>#{rcpt.receiptNumber}</span>
                                  <span className="text-[10px] font-mono text-stone-400">({rcpt.issuedAt})</span>
                                </div>
                                <div className="text-[10px] text-stone-500 font-mono">
                                  {rcpt.currency === 'CFA'
                                    ? `${Math.round(rcpt.amountPaid).toLocaleString()} FCFA`
                                    : `${rcpt.currency} ${rcpt.amountPaid.toFixed(2)}`}{' '}
                                  · {rcpt.paymentMethod}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReceiptPreview(rcpt);
                                  }}
                                  className="p-1 rounded hover:bg-stone-200 text-stone-600"
                                  title="Preview PDF Receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadReceipt(rcpt);
                                  }}
                                  className="p-1 rounded hover:bg-amber-100 text-amber-800"
                                  title="Download PDF File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-400 italic bg-stone-50/50 p-2 rounded-lg border border-stone-100">
                          No reconciled receipts yet for this tenant. Receipts are generated automatically once a reconciliation entry is verified.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Communication History */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                  <span>Communication history</span>
                  <button
                    onClick={() => showSecurityNotification(`Comms logger opened for ${selectedTenant.name}. Recorded with actor ${activeRole}.`)}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    + Log communication
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedTenant.communicationHistory.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        {comm.channel === 'Email' ? (
                          <Mail className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span className="text-stone-700">{comm.subject}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 bg-white rounded border border-stone-200">
                        {comm.channel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Renewal Action */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  Pre-renewal review window open
                </span>
                <button
                  onClick={handleSendRenewalOffer}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-2xs"
                >
                  Send Renewal Offer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HMAC Signed Document Modal */}
      {signedDocModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900">Signed Document Stream</h3>
              </div>
              <button
                onClick={() => setSignedDocModal(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <strong>Document:</strong> {signedDocModal.doc.name}
              </div>
              <div>
                <strong>Security Policy:</strong> Least-Privilege Scope ({signedDocModal.doc.accessLevel})
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 font-mono text-[11px] text-amber-900 break-all">
                {signedDocModal.hmacLink}
              </div>
              <div className="flex items-center space-x-2 text-emerald-700 font-semibold pt-1">
                <Clock className="w-4 h-4" />
                <span>HMAC signature valid for 15 minutes (ttl=900s). Auto-expires.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
              <button
                onClick={() => setSignedDocModal(null)}
                className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showSecurityNotification('Document loaded securely inside sandboxed viewer.');
                  setSignedDocModal(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
              >
                Open in Sandboxed Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cameroon Mobile Money Payment Modal for Selected Tenant */}
      <MobileMoneyPaymentModal
        isOpen={isMobileMoneyModalOpen}
        onClose={() => setIsMobileMoneyModalOpen(false)}
        initialGateway="mtn_momo"
        initialTenantName={mobileMoneyTenant?.name || selectedTenant?.name || 'Jordan Avery'}
        initialUnit={mobileMoneyTenant?.unit || selectedTenant?.unit || 'Unit 4B'}
        initialAmountUSD={mobileMoneyTenant?.monthlyRent || selectedTenant?.monthlyRent || 1450}
      />
    </div>
  );
};
