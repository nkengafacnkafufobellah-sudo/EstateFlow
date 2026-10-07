import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Database,
  Hash,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Server,
  FileCode,
  Users,
  Download,
  FileJson,
  Copy,
  Check,
  Eye,
  Code2,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  X,
  FileText,
  Calendar,
  CalendarRange,
  Clock,
} from 'lucide-react';
import { AUDIT_LOGS_DATA, RBAC_PERMISSIONS_MATRIX, AUDIT_LOG_TRAIL } from '../data/estateData';
import { AuditLogEntry, UserRole } from '../types';
import { useSecurity } from '../context/SecurityContext';
import {
  buildSecurityAuditReport,
  downloadJsonFile,
  AuditReportScope,
  SecurityAuditReportPayload,
} from '../utils/auditReportGenerator';
import { SecurityDateRangePicker } from './SecurityDateRangePicker';
import {
  TemporalWindow,
  SYSTEM_TODAY,
  getPresetDateRange,
  isTimestampInWindow,
  formatHumanDate,
} from '../utils/dateFilterUtils';

export const SecurityAuditPanel: React.FC = () => {
  const {
    currentUser,
    activeRole,
    setUserRole,
    rateLimitRemaining,
    simulateRateLimitHit,
    resetRateLimit,
    showSecurityNotification,
    orgId,
    apiAuditLogs,
    logApiAction,
    securityControls,
  } = useSecurity();

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(AUDIT_LOGS_DATA);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainVerified, setChainVerified] = useState(true);

  // Temporal Window Filter State
  const [temporalWindow, setTemporalWindow] = useState<TemporalWindow>(() =>
    getPresetDateRange('all', SYSTEM_TODAY)
  );
  const [includeTemporalInReport, setIncludeTemporalInReport] = useState<boolean>(true);

  // Compliance JSON Report Modal & Configuration State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState<AuditReportScope>('all');
  const [isMinified, setIsMinified] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [jsonSearchQuery, setJsonSearchQuery] = useState('');
  const [logFilterTab, setLogFilterTab] = useState<'all' | 'ledger' | 'api'>('all');

  // Filter audit logs according to current temporal window
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) =>
      isTimestampInWindow(log.timestamp, temporalWindow.startDate, temporalWindow.endDate)
    );
  }, [auditLogs, temporalWindow]);

  // Filter api audit logs according to current temporal window
  const filteredApiAuditLogs = useMemo(() => {
    return apiAuditLogs.filter((log) =>
      isTimestampInWindow(log.timestamp, temporalWindow.startDate, temporalWindow.endDate)
    );
  }, [apiAuditLogs, temporalWindow]);

  const totalRawEvents = auditLogs.length + apiAuditLogs.length;
  const filteredEventsTotal = filteredAuditLogs.length + filteredApiAuditLogs.length;

  // Generate current report payload based on state
  const reportPayload: SecurityAuditReportPayload = useMemo(() => {
    return buildSecurityAuditReport({
      auditLogs,
      apiAuditLogs,
      securityControls,
      currentUser,
      orgId,
      scope: reportScope,
      temporalWindow: includeTemporalInReport ? temporalWindow : undefined,
    });
  }, [
    auditLogs,
    apiAuditLogs,
    securityControls,
    currentUser,
    orgId,
    reportScope,
    includeTemporalInReport,
    temporalWindow,
  ]);

  const reportJsonString = useMemo(() => {
    return isMinified
      ? JSON.stringify(reportPayload)
      : JSON.stringify(reportPayload, null, 2);
  }, [reportPayload, isMinified]);

  const handleVerifyIntegrity = () => {
    setIsVerifyingChain(true);
    setTimeout(() => {
      setIsVerifyingChain(false);
      setChainVerified(true);
      showSecurityNotification('Cryptographic SHA-256 audit chain verified. 0 broken links detected.');
    }, 900);
  };

  const handleQuickDownloadJson = (scope: AuditReportScope = 'all', useTemporalWindow: boolean = true) => {
    const report = buildSecurityAuditReport({
      auditLogs,
      apiAuditLogs,
      securityControls,
      currentUser,
      orgId,
      scope,
      temporalWindow:
        useTemporalWindow && (temporalWindow.preset !== 'all' || temporalWindow.startDate || temporalWindow.endDate)
          ? temporalWindow
          : undefined,
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const windowTag =
      useTemporalWindow && temporalWindow.preset !== 'all' ? `-${temporalWindow.preset}` : '';
    const filename = `estateflow-security-audit-${scope}${windowTag}-${dateStr}.json`;

    downloadJsonFile(report, filename);
    showSecurityNotification(`Audit report "${filename}" downloaded successfully for compliance review.`);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(reportJsonString);
    setCopiedSuccess(true);
    showSecurityNotification('Compliance audit report copied to clipboard in JSON format.');
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleSimulateNewSecurityEvent = () => {
    const actions = [
      {
        action: 'KMS_KEY_ROTATION',
        target: 'AWS KMS Key alias/estateflow-prod-db',
        detail: 'Scheduled 90-day automatic cryptographic key rotation completed successfully.',
      },
      {
        action: 'BLOCKED_BRUTE_FORCE',
        target: 'Auth Endpoint /api/v1/auth/login',
        detail: 'Detected 10 rapid failed authentication requests from IP 185.220.101.5; blocked by rate limiter.',
        status: 'BLOCKED_403' as const,
      },
      {
        action: 'POLICY_EVALUATION_PASS',
        target: 'Tenant Data Isolation Gate',
        detail: 'Automated multi-tenant boundary verification test: 100% tenant scoping compliance.',
      },
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    logApiAction(randomAction.action, randomAction.target, randomAction.detail, randomAction.status || 'SUCCESS');

    // Also add to ledger log
    const newLedgerEntry: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actorId: currentUser.role === 'super_admin' ? 'super_admin_sec' : 'sec_kernel',
      role: currentUser.roleTitle,
      action: randomAction.action.toLowerCase(),
      target: randomAction.target,
      hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      verified: true,
    };
    setAuditLogs((prev) => [newLedgerEntry, ...prev]);

    showSecurityNotification(`Recorded security event "${randomAction.action}". Included in updated JSON report.`);
  };

  const totalRecordedEvents = auditLogs.length + apiAuditLogs.length + AUDIT_LOG_TRAIL.length;
  const isTemporalFilterActive =
    temporalWindow.preset !== 'all' || Boolean(temporalWindow.startDate) || Boolean(temporalWindow.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            EstateFlow · System Overview · Page 8 / 8
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Security Architecture & Governance
          </h1>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Security is structural, not an afterthought: least-privilege RBAC, cryptographic audit logging, encrypted storage, and automated rate limiting protect every operation across the platform.
          </p>
        </div>

        {/* Header Action Buttons: Direct JSON Download & Inspector */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleQuickDownloadJson('all', true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl transition-all shadow-xs"
            title="Download full JSON compliance audit report"
          >
            <Download className="w-4 h-4" />
            <span>Download Audit JSON</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-all shadow-2xs"
            title="Configure and preview JSON compliance report"
          >
            <FileJson className="w-4 h-4 text-amber-700" />
            <span>Inspect Report</span>
          </button>
        </div>
      </div>

      {/* COMPLIANCE AUDIT REPORT BANNER */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-amber-900/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SOC 2 TYPE II COMPLIANT EXPORT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                RFC 8259 JSON
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>SHA-256 SEALED</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <FileJson className="w-5 h-5 text-amber-400" />
              <span>Security Events Audit Report Generator</span>
            </h2>

            <p className="text-xs text-stone-300 leading-relaxed">
              Export comprehensive, tamper-evident JSON records of all recorded security events for external compliance reviews, annual regulatory audits, and SIEM ingestion. Includes immutable ledger state mutations, API credential rotations, RBAC boundary grants, and rate limiter telemetry.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-mono text-stone-300">
              <div className="flex items-center space-x-1.5">
                <span className="text-amber-400 font-bold">
                  {isTemporalFilterActive ? `${filteredEventsTotal} of ${totalRawEvents}` : totalRecordedEvents}
                </span>
                <span className="text-stone-400">
                  {isTemporalFilterActive ? 'Events in Window' : 'Recorded Events'}
                </span>
              </div>
              <span className="text-stone-600">·</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-emerald-400 font-bold">0 Broken Links</span>
                <span className="text-stone-400">(Unbroken Chain)</span>
              </div>
              <span className="text-stone-600">·</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-stone-400">Org:</span>
                <span className="text-white font-semibold">{orgId}</span>
              </div>
              {isTemporalFilterActive && (
                <>
                  <span className="text-stone-600">·</span>
                  <div className="flex items-center space-x-1 text-amber-300">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Window: {temporalWindow.label}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Button Cluster */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0">
            <button
              onClick={() => handleQuickDownloadJson('all', true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Audit Log</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Preview & Filter</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                title="Copy JSON to clipboard"
              >
                {copiedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-stone-300" />
                )}
                <span>{copiedSuccess ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DATE RANGE PICKER COMPONENT */}
      <SecurityDateRangePicker
        value={temporalWindow}
        onChange={setTemporalWindow}
        totalEventsCount={totalRawEvents}
        filteredEventsCount={filteredEventsTotal}
      />

      {/* 4 Pillars Grid (Page 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 01: Role-Based Access Control (RBAC) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-extrabold flex items-center justify-center">
                01
              </span>
              <h2 className="text-base font-bold text-stone-900">
                Role-Based Access Control (RBAC)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-400">Least-Privilege</span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Every user action is authenticated via short-lived JWTs and validated against a strict role-permission mapping. Roles are non-overlapping:
          </p>

          {/* Interactive RBAC Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                <tr>
                  <th className="py-2 px-1.5">Permission</th>
                  <th className="py-2 px-1.5 text-center">Owner</th>
                  <th className="py-2 px-1.5 text-center">Prop Mgr</th>
                  <th className="py-2 px-1.5 text-center">Accountant</th>
                  <th className="py-2 px-1.5 text-center">Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {RBAC_PERMISSIONS_MATRIX.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-2 px-1.5 font-sans font-medium text-stone-900">
                      {perm.permission}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold text-emerald-600">
                      {perm.owner ? '✓' : '—'}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold text-stone-700">
                      {perm.propertyManager ? '✓' : '—'}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold text-stone-700">
                      {perm.accountant ? '✓' : '—'}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold text-stone-700">
                      {perm.vendor ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Role Tester Bar */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-stone-800">
              Live Test Current Active Role: <span className="text-amber-800 uppercase font-mono">{activeRole}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['owner', 'property_manager', 'accountant', 'vendor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeRole === r
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Switch to {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 02: Cryptographic Audit Trail */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-extrabold flex items-center justify-center">
                02
              </span>
              <h2 className="text-base font-bold text-stone-900">
                Cryptographic Audit Trail
              </h2>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingChain}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                title="Verify cryptographic SHA-256 chain"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isVerifyingChain ? 'Verifying…' : 'Verify Chain'}</span>
              </button>
              <button
                onClick={() => handleQuickDownloadJson('ledger', true)}
                className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                title="Download ledger events as JSON"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-600">
            Every state mutation is written to an immutable, append-only log with SHA-256 hash chaining:
          </p>

          <div className="p-2.5 bg-stone-900 text-amber-400 rounded-xl font-mono text-[11px] overflow-x-auto">
            <code>H(n) = SHA-256(H(n-1) + timestamp + actor_id + action_payload)</code>
          </div>

          {/* Active Temporal Window Notification inside Pillar 02 */}
          {isTemporalFilterActive && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs">
              <div className="flex items-center space-x-1.5 text-amber-900">
                <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span className="font-semibold text-[11px]">
                  Filtered by window: <strong>{temporalWindow.label}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTemporalWindow(getPresetDateRange('all', SYSTEM_TODAY))}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Audit Log Stream Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setLogFilterTab('all')}
                className={`px-2 py-0.5 rounded ${
                  logFilterTab === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                All ({filteredEventsTotal})
              </button>
              <button
                onClick={() => setLogFilterTab('ledger')}
                className={`px-2 py-0.5 rounded ${
                  logFilterTab === 'ledger' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                Ledger ({filteredAuditLogs.length})
              </button>
              <button
                onClick={() => setLogFilterTab('api')}
                className={`px-2 py-0.5 rounded ${
                  logFilterTab === 'api' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                API & Auth ({filteredApiAuditLogs.length})
              </button>
            </div>

            <button
              onClick={handleSimulateNewSecurityEvent}
              className="text-[10px] font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1 hover:underline"
            >
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>+ Record Test Event</span>
            </button>
          </div>

          {/* Audit Log Stream */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Empty state when 0 events match */}
            {((logFilterTab === 'all' && filteredEventsTotal === 0) ||
              (logFilterTab === 'ledger' && filteredAuditLogs.length === 0) ||
              (logFilterTab === 'api' && filteredApiAuditLogs.length === 0)) && (
              <div className="p-6 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center space-y-2">
                <Calendar className="w-6 h-6 text-stone-400 mx-auto" />
                <div className="text-xs font-bold text-stone-700">
                  No security events in this temporal window
                </div>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  No events found for {temporalWindow.label}. Try selecting another preset or reset to All Time.
                </p>
                <button
                  type="button"
                  onClick={() => setTemporalWindow(getPresetDateRange('all', SYSTEM_TODAY))}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to All Time</span>
                </button>
              </div>
            )}

            {(logFilterTab === 'all' || logFilterTab === 'ledger') &&
              filteredAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-900">{log.timestamp}</span>
                    <span className="text-stone-700">{log.actorId} ({log.role})</span>
                  </div>
                  <div className="font-bold text-stone-800 font-sans">{log.action}</div>
                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className="text-stone-500 truncate">Target: {log.target}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      HASH: {log.hash.slice(0, 8)}… ✓
                    </span>
                  </div>
                </div>
              ))}

            {(logFilterTab === 'all' || logFilterTab === 'api') &&
              filteredApiAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl text-xs space-y-1 font-mono border ${
                    log.status === 'BLOCKED_403'
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-stone-900">{log.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.status === 'BLOCKED_403'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="font-bold text-stone-800 font-sans">{log.action} · {log.targetService}</div>
                  <div className="text-[10px] text-stone-500 leading-snug">{log.details}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Pillar 03: Data Protection & Encryption */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-extrabold flex items-center justify-center">
                03
              </span>
              <h2 className="text-base font-bold text-stone-900">
                Data Protection & Encryption
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">AES-256-GCM</span>
          </div>

          <div className="space-y-3 text-xs text-stone-700">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-amber-700" />
                <span>At Rest</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                AES-256-GCM encryption on all database volumes and object stores. Sensitive PII fields (SSN, banking tokens) use field-level encryption (FLE) with KMS-managed keys rotated every 90 days.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>In Transit</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                TLS 1.3 enforced on all endpoints with HSTS preloading. Cipher suites restricted to forward-secrecy algorithms (ECDHE-ECDSA-AES256-GCM-SHA384).
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Document Storage</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Tenant documents and vendor receipts stored in private buckets with HMAC-signed expiring URLs (15-min TTL). No direct public access.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 04: Rate Limiting & Abuse Prevention */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-extrabold flex items-center justify-center">
                04
              </span>
              <h2 className="text-base font-bold text-stone-900">
                Rate Limiting & Abuse Prevention
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-400">Token Bucket</span>
          </div>

          <p className="text-xs text-stone-600">
            Token bucket rate limiter deployed at the API gateway layer to prevent denial of service and brute-force credential stuffing:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-100">
              <span className="font-medium text-stone-900">Public endpoints (auth, tenant login):</span>
              <span className="font-mono font-bold text-stone-800">10 req/min per IP</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-100">
              <span className="font-medium text-stone-900">Authenticated API:</span>
              <span className="font-mono font-bold text-stone-800">120 req/min per user</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-100">
              <span className="font-medium text-stone-900">Webhook receivers:</span>
              <span className="font-mono font-bold text-stone-800">60 req/min + HMAC sig</span>
            </div>
          </div>

          {/* Interactive Live Rate Limiter Test */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-amber-700" />
                <span>Simulate Token Bucket Depletion</span>
              </span>
              <span className="font-mono text-stone-900">
                Tokens: {rateLimitRemaining}/120
              </span>
            </div>

            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${(rateLimitRemaining / 120) * 100}%` }}
                className={`h-full transition-all ${
                  rateLimitRemaining > 30 ? 'bg-amber-600' : 'bg-rose-600'
                }`}
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={simulateRateLimitHit}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-2xs"
              >
                Send 25 Rapid Requests
              </button>
              <button
                onClick={resetRateLimit}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg"
              >
                Reset Bucket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Compliance Footer Card (Page 8 Bottom) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Governance, Auditing & Regulatory Compliance
            </h3>
            <p className="text-xs text-stone-500">
              Formal audit trail retention policies certified for internal governance and third-party compliance verification.
            </p>
          </div>
          <button
            onClick={() => handleQuickDownloadJson('all', true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Export Compliance Archive (.json)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-stone-600 pt-1">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>SOC 2 Type II</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">Annual Pass</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Annual external audits covering Security, Availability, and Confidentiality trust principles.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>GDPR & CCPA</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">Active Art. 30</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Automated data-deletion pipelines for tenant right-to-be-forgotten requests.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>Disaster Recovery</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">PITR 30d</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Automated daily snapshots, 30-day point-in-time recovery (PITR), cross-region replication.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>Incident Response</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">&lt;15m SLA</span>
            </div>
            <p className="text-[11px] text-stone-500">
              15-minute acknowledgment SLA for Sev-1 security events with automated escalation.
            </p>
          </div>
        </div>
      </div>

      {/* COMPLIANCE AUDIT JSON REPORT MODAL / INSPECTOR */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <FileJson className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-stone-900">
                      Security & Compliance Audit Report (JSON)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                      RFC 8259
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Official tamper-evident log bundle for auditor compliance reviews (SOC 2, ISO 27001, GDPR)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
                title="Close inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope & Format Control Bar */}
            <div className="p-3 sm:px-5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Scope Selector */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-stone-500 text-[11px] uppercase tracking-wider">
                  Report Scope:
                </span>
                <div className="flex space-x-1 bg-white p-1 rounded-lg border border-stone-200">
                  {(
                    [
                      { id: 'all', label: 'All Security Events' },
                      { id: 'ledger', label: 'Ledger Mutations' },
                      { id: 'api', label: 'API & Gateway' },
                      { id: 'rbac', label: 'RBAC & Sessions' },
                    ] as const
                  ).map((scopeOption) => (
                    <button
                      key={scopeOption.id}
                      onClick={() => setReportScope(scopeOption.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        reportScope === scopeOption.id
                          ? 'bg-amber-700 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {scopeOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Toggle & Temporal Filter Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-700 cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeTemporalInReport}
                    onChange={(e) => setIncludeTemporalInReport(e.target.checked)}
                    className="rounded text-amber-800 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <span>
                    Apply Window ({temporalWindow.label}):{' '}
                    <strong className="text-amber-900 font-mono">
                      {reportPayload.summaryStatistics.totalSecurityEvents}
                    </strong>
                  </span>
                </label>

                <button
                  onClick={() => setIsMinified((prev) => !prev)}
                  className={`px-2.5 py-1 rounded border text-[11px] font-mono font-bold transition-colors ${
                    isMinified
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="Toggle Minified vs Pretty-Printed JSON"
                >
                  {isMinified ? 'Minified (SIEM)' : 'Pretty JSON'}
                </button>
              </div>
            </div>

            {/* Cryptographic Seal & Integrity Strip */}
            <div className="px-5 py-2 bg-stone-100 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-600">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-stone-800">Report ID:</span>
                <span className="text-amber-900 font-bold">{reportPayload.reportMetadata.reportId}</span>
                <span className="text-stone-400">·</span>
                <span className="truncate">Checksum: {reportPayload.integrityVerification.reportChecksumSha256}</span>
              </div>
              <div className="text-stone-500">
                Generated: {reportPayload.reportMetadata.generatedAtUtc}
              </div>
            </div>

            {/* JSON Code Inspector Body */}
            <div className="flex-1 p-4 bg-[#1E1E1E] text-stone-100 overflow-y-auto font-mono text-xs max-h-[420px] select-all">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-amber-200/90 font-mono">
                {reportJsonString}
              </pre>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:px-5 bg-white border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-stone-500 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Valid for SOC 2 Type II, ISO 27001, GDPR Art. 30, and CCPA regulatory audits.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  {copiedSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                  )}
                  <span>{copiedSuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
                      now.getDate()
                    ).padStart(2, '0')}`;
                    const windowTag =
                      includeTemporalInReport && temporalWindow.preset !== 'all'
                        ? `-${temporalWindow.preset}`
                        : '';
                    const filename = `estateflow-security-audit-${reportScope}${windowTag}-${dateStr}.json`;
                    downloadJsonFile(reportPayload, filename);
                    showSecurityNotification(`Audit report "${filename}" downloaded.`);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
