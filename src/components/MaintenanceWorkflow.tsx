import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Send,
  RotateCcw,
  CalendarDays,
  Layers,
  Calendar as CalendarIcon,
  Coins,
} from 'lucide-react';
import { MaintenanceRequestRecord, MaintenanceStage, SupportedCurrency } from '../types';
import { MAINTENANCE_REQUESTS_DATA } from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { MaintenanceCalendar } from './MaintenanceCalendar';

interface MaintenanceWorkflowProps {
  initialSelectedId?: string;
  initialView?: 'pipeline' | 'calendar';
}

export const MaintenanceWorkflow: React.FC<MaintenanceWorkflowProps> = ({
  initialSelectedId = 'MR-2481',
  initialView = 'pipeline',
}) => {
  const { canPerform, activeRole, showSecurityNotification } = useSecurity();
  const { activeCurrency, setActiveCurrency, formatAmount, currencies } = useCurrency();
  const [requests, setRequests] = useState<MaintenanceRequestRecord[]>(MAINTENANCE_REQUESTS_DATA);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(initialSelectedId);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'risk' | 'breached'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'calendar'>(initialView);

  // Completion modal state for MR-2465
  const [completionState, setCompletionState] = useState<'idle' | 'closed' | 'error'>('idle');

  const selectedTicket = requests.find((r) => r.id === selectedTicketId) || requests[0];

  const stages: MaintenanceStage[] = [
    'New',
    'Assigned',
    'In Progress',
    'Awaiting Approval',
    'Completed',
    'Closed',
  ];

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'high') return r.priority === 'HIGH';
    if (activeFilter === 'risk') return !r.slaBreached && r.slaRemainingMinutes > 0 && r.slaRemainingMinutes < 720;
    if (activeFilter === 'breached') return r.slaBreached;
    return true; // all open
  });

  const handleApproveQuote = (ticketId: string) => {
    if (!canPerform('maintenance.approve_quote')) {
      showSecurityNotification(`Access Denied: Approving vendor quotes (≥$400) requires "owner" or "property_manager" role. Your role: ${activeRole}.`);
      return;
    }

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === ticketId) {
          return {
            ...r,
            status: 'In Progress',
            quoteStatus: 'Approved',
            activityHistory: [
              ...r.activityHistory,
              {
                id: `act-${Date.now()}`,
                date: 'Sep 20',
                time: '09:20',
                description: `Quote $${r.quoteAmount} approved by ${activeRole}. Work authorized.`,
                author: activeRole,
              },
            ],
          };
        }
        return r;
      })
    );
    showSecurityNotification(`Vendor quote $${selectedTicket.quoteAmount} approved. AquaFix Plumbing notified via dispatch webhook.`);
  };

  const handleRejectQuote = (ticketId: string) => {
    if (!canPerform('maintenance.approve_quote')) {
      showSecurityNotification(`Access Denied: Rejecting vendor quotes requires "owner" or "property_manager" role.`);
      return;
    }

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === ticketId) {
          return {
            ...r,
            quoteStatus: 'Rejected',
            activityHistory: [
              ...r.activityHistory,
              {
                id: `act-${Date.now()}`,
                date: 'Sep 20',
                time: '09:25',
                description: `Quote $${r.quoteAmount} rejected. Re-estimate requested.`,
                author: activeRole,
              },
            ],
          };
        }
        return r;
      })
    );
    showSecurityNotification(`Quote rejected. Vendor prompted to submit revised estimate.`);
  };

  const handleConfirmCompletion = () => {
    setCompletionState('closed');
    showSecurityNotification('MR-2465 closed · tenant notified · SLA met in 1d 2h');
  };

  const handleSelectTicketFromCalendar = (ticketCode: string) => {
    const found = requests.find((r) => r.code === ticketCode || r.id === ticketCode);
    if (found) {
      setSelectedTicketId(found.id);
    }
    setViewMode('pipeline');
    showSecurityNotification(`Opened work order #${ticketCode} in pipeline view.`);
  };

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            EstateFlow · Operations Module · Page 4 / 8
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Maintenance Request Workflow
          </h1>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Track requests across six stages, approve vendor quotes, and visualize upcoming service appointments and recurring inspections across all properties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Currency Switcher */}
          <div className="inline-flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase px-1.5 flex items-center space-x-1">
              <Coins className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Currency:</span>
            </span>
            {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((c) => (
              <button
                key={c}
                id={`workflow-curr-btn-${c}`}
                onClick={() => {
                  setActiveCurrency(c);
                  showSecurityNotification(`Operations active currency changed to ${currencies[c].name} (${currencies[c].symbol}).`);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCurrency === c
                    ? 'bg-amber-700 text-white shadow-2xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                }`}
              >
                <span>{currencies[c].flag}</span>
                <span>{c}</span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-semibold text-stone-600 border border-stone-200">
            <button
              id="btn-view-pipeline"
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                  : 'hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workflow & Pipeline</span>
            </button>
            <button
              id="btn-view-calendar"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-amber-700 text-white shadow-xs font-extrabold'
                  : 'hover:text-stone-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Monthly Calendar & Recurring Inspections Component */
        <MaintenanceCalendar onSelectTicket={handleSelectTicketFromCalendar} />
      ) : (
        /* 6-Stage Tracked Pipeline & Request Detail View */
        <>
          {/* 6-Stage Tracked Pipeline Graphic (From Page 4) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Lifecycle of a maintenance request — gates where the workflow pauses for approval or confirmation
              </div>
              <button
                onClick={() => setViewMode('calendar')}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
              >
                <CalendarIcon className="w-3 h-3" />
                <span>Open Calendar View</span>
              </button>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[650px] flex items-center justify-between">
                {stages.map((stage, idx) => {
                  const isAwaitingApproval = stage === 'Awaiting Approval';
                  const isCompleted = stage === 'Completed';

                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                            stage === selectedTicket.status
                              ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-300/60'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          {stage}
                        </div>

                        {/* Subnotes from document */}
                        <div className="text-[10px] text-stone-500 mt-1 font-mono text-center">
                          {stage === 'New' && 'SLA clock starts'}
                          {isAwaitingApproval && `quote ≥ ${formatAmount(400)}`}
                          {isCompleted && 'tenant confirms'}
                        </div>
                      </div>

                      {idx < stages.length - 1 && (
                        <div className="flex-1 flex items-center justify-center px-1">
                          <div className="w-full h-0.5 bg-stone-200 relative">
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 absolute right-0 -top-1.5" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main 2-Column Layout: Request Inbox vs Request Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Request Inbox (5 or 6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-100">
                  <h2 className="text-base font-bold text-stone-900">Request inbox</h2>

                  <div className="flex items-center space-x-1 text-xs">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1 rounded-full font-medium transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-amber-700 text-white font-semibold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      All open ({requests.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('high')}
                      className={`px-3 py-1 rounded-full font-medium transition-colors ${
                        activeFilter === 'high'
                          ? 'bg-amber-700 text-white font-semibold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      High priority
                    </button>
                    <button
                      onClick={() => setActiveFilter('breached')}
                      className={`px-3 py-1 rounded-full font-medium transition-colors ${
                        activeFilter === 'breached'
                          ? 'bg-rose-700 text-white font-semibold'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      2 breached
                    </button>
                  </div>
                </div>

            {/* Inbox Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                  <tr>
                    <th className="py-2.5 px-2">Request</th>
                    <th className="py-2.5 px-2">Unit</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRequests.map((req) => {
                    const isSelected = selectedTicket.id === req.id;
                    const isBreached = req.slaBreached;

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedTicketId(req.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="py-3 px-2">
                          <div className="font-bold text-stone-900">{req.code}</div>
                          <div className="text-[11px] text-stone-600">{req.title}</div>
                        </td>
                        <td className="py-3 px-2 text-[11px] text-stone-700 whitespace-nowrap">
                          {req.property} · <span className="font-semibold">{req.unit}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : req.priority === 'MED'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="text-[11px] text-stone-800 font-medium">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              isBreached
                                ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'
                                : req.slaRemainingMinutes < 720
                                ? 'text-amber-700'
                                : 'text-stone-700'
                            }
                          >
                            {req.slaLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Completion Pattern Box for MR-2465 (Page 4) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-xs font-bold text-stone-900">
                Confirm completion — MR-2465
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                2 photos attached
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Vendor marked the job finished with 2 photos attached. Confirming closes the SLA record and notifies the tenant.
            </p>

            {completionState === 'idle' && (
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleConfirmCompletion}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-2xs"
                >
                  Confirm & close
                </button>
                <button
                  onClick={() => setCompletionState('error')}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
                >
                  Request more evidence
                </button>
              </div>
            )}

            {completionState === 'closed' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>MR-2465 closed</strong> · tenant notified · SLA met in 1d 2h
                  </span>
                </div>
                <button
                  onClick={() => setCompletionState('idle')}
                  className="text-[10px] text-emerald-800 underline"
                >
                  Reset
                </button>
              </div>
            )}

            {completionState === 'error' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between">
                <div>
                  <strong>Network error closing MR-2465</strong> — nothing was changed.
                </div>
                <button
                  onClick={() => setCompletionState('closed')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Request Detail View (MR-2481) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
            {/* Header */}
            <div className="border-b border-stone-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-800">
                  Request detail · {selectedTicket.code}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    selectedTicket.slaBreached
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {selectedTicket.slaLabel}
                </span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-1">
                {selectedTicket.title}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedTicket.property} {selectedTicket.unit} · reported by {selectedTicket.reportedBy} via {selectedTicket.reportedVia}. Vendor {selectedTicket.vendorAssigned} assigned; quote awaiting approval.
              </p>
            </div>

            {/* Attachments (IMG leak-01.jpg, leak-02.jpg, PDF quote-AquaFix.pdf) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-900">Attachments</div>
              <div className="flex flex-wrap gap-2">
                {selectedTicket.attachments.map((att, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewImage(att.name)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition-colors"
                  >
                    {att.type === 'IMG' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>
                      {att.type} · {att.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Quote Section (AquaFix Plumbing $640.00) */}
            {selectedTicket.quoteAmount && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-900">
                    Vendor quote — {selectedTicket.vendorAssigned}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Threshold ≥ {formatAmount(400)} Triggered
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-stone-900 font-mono">
                      {formatAmount(selectedTicket.quoteAmount)}
                    </span>
                    <span className="text-xs text-stone-600">
                      · {selectedTicket.quoteBreakdown}
                    </span>
                  </div>

                  {/* Multi-Currency Conversion Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-stone-500 font-medium">Equivalents:</span>
                    {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).filter(c => c !== activeCurrency).map((c) => (
                      <span key={c} className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white border border-amber-200/90 rounded-md text-stone-700">
                        {currencies[c].flag} {formatAmount(selectedTicket.quoteAmount!, c)}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedTicket.quoteStatus === 'Approved' ? (
                  <div className="text-xs font-bold text-emerald-700 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Quote approved. Authorized for immediate repair.</span>
                  </div>
                ) : selectedTicket.quoteStatus === 'Rejected' ? (
                  <div className="text-xs font-bold text-rose-700 flex items-center space-x-1.5">
                    <X className="w-4 h-4" />
                    <span>Quote rejected. Revision requested from vendor.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleApproveQuote(selectedTicket.id)}
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-xs"
                    >
                      Approve quote
                    </button>
                    <button
                      onClick={() => handleRejectQuote(selectedTicket.id)}
                      className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Activity History Timeline (Exact entries from document) */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="text-xs font-bold text-stone-900">Activity history</div>

              <div className="space-y-3">
                {selectedTicket.activityHistory.map((act) => {
                  const isBreach = act.description.includes('SLA breached');

                  return (
                    <div key={act.id} className="flex items-start space-x-3 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          isBreach ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-amber-600'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-[11px] text-stone-400 font-mono">
                          <span>
                            {act.date} · {act.time}
                          </span>
                          <span>•</span>
                          <span className="text-stone-600 font-medium">{act.author}</span>
                        </div>
                        <div
                          className={`mt-0.5 leading-snug ${
                            isBreach ? 'text-rose-800 font-semibold' : 'text-stone-800'
                          }`}
                        >
                          {act.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

      {/* Attachment Preview Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="font-bold text-sm text-stone-900">Attachment: {previewImage}</div>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-stone-100 rounded-xl border border-stone-200 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <ImageIcon className="w-12 h-12 text-stone-400" />
              <div className="text-xs font-bold text-stone-800">{previewImage}</div>
              <p className="text-[11px] text-stone-500">
                Verified high-resolution inspection image for work order {selectedTicket.code}.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
