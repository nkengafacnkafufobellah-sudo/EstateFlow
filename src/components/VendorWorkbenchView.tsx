import React, { useState } from 'react';
import {
  HardHat,
  Calendar as CalendarIcon,
  MessageSquare,
  User,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  Upload,
  Check,
  DollarSign,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { VENDOR_JOBS_DATA, VENDOR_PAYOUT_HISTORY } from '../data/estateData';
import { VendorJob } from '../types';
import { useSecurity } from '../context/SecurityContext';

export const VendorWorkbenchView: React.FC = () => {
  const { showSecurityNotification } = useSecurity();
  const [jobs, setJobs] = useState<VendorJob[]>(VENDOR_JOBS_DATA);
  const [activeTab, setActiveTab] = useState<'jobs' | 'calendar' | 'messages' | 'profile'>('jobs');
  const [selectedJob, setSelectedJob] = useState<VendorJob>(VENDOR_JOBS_DATA[0]);
  const [partsReceiptAttached, setPartsReceiptAttached] = useState(false);
  const [hasAddedAfterPhoto, setHasAddedAfterPhoto] = useState(false);
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);

  const handleStepAdvance = (jobId: string) => {
    if (selectedJob.currentStep < 4) {
      const nextStep = (selectedJob.currentStep + 1) as 1 | 2 | 3 | 4;
      setSelectedJob((curr) => ({ ...curr, currentStep: nextStep }));
      showSecurityNotification(`WO-2417 transitioned to Step ${nextStep}: Timestamped & GPS logged for SLA clock.`);
    }
  };

  const handleUploadAfterPhoto = () => {
    setHasAddedAfterPhoto(true);
    showSecurityNotification('after_photo.jpg uploaded (3/3 required photos completed).');
  };

  const handleSubmitInvoice = () => {
    if (!partsReceiptAttached) {
      showSecurityNotification('Submission blocked: You must attach the parts receipt before submitting the invoice.');
      return;
    }
    setInvoiceSubmitted(true);
    showSecurityNotification('Invoice $258.50 submitted. Net payout $237.82 scheduled for Sep 30.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
          EstateFlow · Vendor Mobile Workbench · Page 7 of 8 · Sep 20, 2026
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
          Vendor Mobile Workbench
        </h1>
        <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
          A touch-first application for contracted vendors: assigned work orders arrive as Jobs, each with SLA context, guided status progression, photo evidence upload, and one-tap invoice submission tied to a transparent payout summary.
        </p>
      </div>

      {/* Main Grid: Workbench Device Frame vs Transparent Payout Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Smartphone Screen Simulator */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[380px] bg-stone-900 rounded-[40px] p-3 shadow-2xl border-4 border-stone-800">
            <div className="bg-[#FAF9F6] rounded-[32px] overflow-hidden flex flex-col h-[660px] relative text-stone-900">
              {/* Status Bar */}
              <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono font-semibold text-stone-700">
                <span>9:41</span>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span>▮▮▮</span>
                  <span>⌁</span>
                </div>
              </div>

              {/* Scrollable View Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-20 pt-1 space-y-4">
                {/* TAB 1: JOBS & JOB DETAIL */}
                {activeTab === 'jobs' && (
                  <div className="space-y-4">
                    {/* Top Jobs Summary */}
                    <div>
                      <div className="text-base font-extrabold text-stone-900">Jobs</div>
                      <div className="text-xs text-stone-500 font-mono">3 assigned · 1 due today</div>
                    </div>

                    {/* Jobs List */}
                    <div className="space-y-2">
                      {jobs.map((job) => {
                        const isSelected = selectedJob.id === job.id;
                        const isEmergency = job.urgency === 'Emergency';

                        return (
                          <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                                : 'bg-white border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-xs font-bold text-stone-900">
                                  {job.code} · {job.title}
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  {job.property} · {job.unit}
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isEmergency
                                    ? 'bg-rose-100 text-rose-800'
                                    : job.urgency === 'Scheduled'
                                    ? 'bg-blue-50 text-blue-800'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {job.urgency}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100 font-mono">
                              <span className={isEmergency ? 'text-rose-700 font-bold' : 'text-stone-600'}>
                                {job.slaStatus}
                              </span>
                              <span className="text-amber-800 font-semibold">Step {job.currentStep}/4</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Job Detail (WO-2417) */}
                    <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-2xs">
                      <div className="border-b border-stone-100 pb-2">
                        <div className="text-xs font-bold text-stone-900">
                          {selectedJob.code} · Job detail
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {selectedJob.title} · {selectedJob.unit} · Tenant: {selectedJob.tenantName}
                        </div>
                      </div>

                      {/* 4 Guided Steps Progression */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-stone-900">Accepted</div>
                            <div className="text-[10px] text-stone-400 font-mono">10:05 AM</div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-stone-900">On site</div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              10:52 AM · GPS check-in verified
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                            3
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">In progress</div>
                            <div className="text-[10px] text-stone-500">Valve replacement underway</div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <div className="w-4 h-4 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                            4
                          </div>
                          <div>
                            <div className="font-bold text-stone-700">Evidence & complete</div>
                            <div className="text-[10px] text-stone-400">Photos + tenant sign-off</div>
                          </div>
                        </div>
                      </div>

                      {/* Evidence Photo Section */}
                      <div className="pt-2 border-t border-stone-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">
                            Evidence ({hasAddedAfterPhoto ? '3/3' : '2/3'} required)
                          </span>
                          <span className="text-[10px] text-stone-400">Photos attached</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-1 bg-stone-100 rounded text-[11px] font-mono text-stone-700 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>before_photo.jpg</span>
                          </span>
                          <span className="px-2 py-1 bg-stone-100 rounded text-[11px] font-mono text-stone-700 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>valve_replaced.jpg</span>
                          </span>
                          {hasAddedAfterPhoto ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded text-[11px] font-mono flex items-center space-x-1 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>after_photo.jpg</span>
                            </span>
                          ) : (
                            <button
                              onClick={handleUploadAfterPhoto}
                              className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[11px] font-mono flex items-center space-x-1 hover:bg-amber-100"
                            >
                              <Camera className="w-3 h-3 text-amber-700" />
                              <span>+ after_photo</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => handleStepAdvance(selectedJob.id)}
                          className="w-full mt-2 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
                        >
                          Mark complete & request sign-off
                        </button>
                      </div>
                    </div>

                    {/* Invoice & Payout Sheet (Page 7) */}
                    <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <span className="text-xs font-bold text-stone-900">Invoice & payout</span>
                        <span className="text-[10px] font-mono text-stone-400">WO-2417</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-stone-700">
                        <div className="flex justify-between">
                          <span>Labor (2.5h × $85)</span>
                          <span className="font-mono font-bold">$212.50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parts (valve kit)</span>
                          <span className="font-mono font-bold">$46.00</span>
                        </div>

                        {/* Parts Receipt Validation Rule */}
                        <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs bg-stone-50">
                          <div>
                            <span className="font-medium text-stone-900">Receipt for parts:</span>
                            <div className="text-[10px] text-stone-500">
                              {partsReceiptAttached ? 'receipt-brass-valve.pdf' : 'Attach parts receipt before submitting.'}
                            </div>
                          </div>
                          <button
                            onClick={() => setPartsReceiptAttached(!partsReceiptAttached)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              partsReceiptAttached
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {partsReceiptAttached ? 'Attached ✓' : 'Missing (Add)'}
                          </button>
                        </div>

                        <button
                          onClick={handleSubmitInvoice}
                          disabled={invoiceSubmitted}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs ${
                            invoiceSubmitted
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-amber-700 hover:bg-amber-800 text-white'
                          }`}
                        >
                          {invoiceSubmitted ? '✓ Invoice Submitted' : 'Submit invoice · $258.50'}
                        </button>

                        <div className="pt-2 border-t border-stone-100 space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between text-stone-600">
                            <span>Invoice total:</span>
                            <span>$258.50</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span>Platform fee (8%):</span>
                            <span>−$20.68</span>
                          </div>
                          <div className="flex justify-between font-bold text-stone-900 text-xs">
                            <span>Net payout · Sep 30:</span>
                            <span className="text-emerald-700">$237.82</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CALENDAR */}
                {activeTab === 'calendar' && (
                  <div className="space-y-4">
                    <div className="text-base font-extrabold text-stone-900">Schedule & Calendar</div>
                    <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400">
                        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      </div>
                      <div className="grid grid-cols-7 text-center text-xs font-mono font-medium gap-1 text-stone-800">
                        <span className="p-1">14</span>
                        <span className="p-1 bg-amber-100 rounded text-amber-900 font-bold">15</span>
                        <span className="p-1">16</span>
                        <span className="p-1 bg-amber-700 text-white rounded font-bold">17</span>
                        <span className="p-1">18</span>
                        <span className="p-1">19</span>
                        <span className="p-1 bg-amber-100 rounded text-amber-900 font-bold">20</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MESSAGES */}
                {activeTab === 'messages' && (
                  <div className="space-y-4">
                    <div className="text-base font-extrabold text-stone-900">Tenant Messages</div>
                    <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2 text-xs">
                      <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
                        <strong>Tenant (M. Adeyemi):</strong> Tenant confirms 4B access at 10:30 — gate code <strong>4417</strong>.
                      </div>
                      <div className="p-2 bg-amber-50 text-amber-900 rounded-lg text-right">
                        <strong>You:</strong> On site, starting the valve swap now.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PROFILE */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="text-base font-extrabold text-stone-900">Vendor Profile</div>
                    <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2 text-xs">
                      <div>
                        <strong>Company:</strong> AquaFix Plumbing
                      </div>
                      <div>
                        <strong>Payout account:</strong> ····4821 (Verified)
                      </div>
                      <div>
                        <strong>SLA Rating:</strong> 99.2% on-time arrival
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom 4-Tab Navigation Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 flex items-center justify-between text-[10px] font-semibold text-stone-500">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`flex flex-col items-center ${activeTab === 'jobs' ? 'text-amber-800 font-bold' : ''}`}
                >
                  <HardHat className="w-4 h-4 mb-0.5" />
                  <span>Jobs</span>
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex flex-col items-center ${activeTab === 'calendar' ? 'text-amber-800 font-bold' : ''}`}
                >
                  <CalendarIcon className="w-4 h-4 mb-0.5" />
                  <span>Calendar</span>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex flex-col items-center ${activeTab === 'messages' ? 'text-amber-800 font-bold' : ''}`}
                >
                  <MessageSquare className="w-4 h-4 mb-0.5" />
                  <span>Messages</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-amber-800 font-bold' : ''}`}
                >
                  <User className="w-4 h-4 mb-0.5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Transparent Payout Summary & Reliability Guarantees */}
        <div className="lg:col-span-7 space-y-6">
          {/* September Payout Summary Bar Chart */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  September payout summary
                </h2>
                <p className="text-xs text-stone-500">
                  Net weekly payouts after the 8% platform fee
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold font-mono text-stone-900">
                  $3,125.00
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  Next transfer: Sep 30
                </div>
              </div>
            </div>

            {/* Weekly Bars */}
            <div className="pt-2">
              <div className="h-44 flex items-end justify-around px-4 border-b border-stone-100">
                {VENDOR_PAYOUT_HISTORY.map((item) => {
                  const heightPercent = Math.round((item.amount / 1200) * 100);
                  return (
                    <div key={item.week} className="flex flex-col items-center group">
                      <span className="text-xs font-mono font-bold text-stone-900 mb-1">
                        ${item.amount}
                      </span>
                      <div className="w-12 h-32 flex items-end justify-center">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-[#B45309] rounded-t-sm transition-all group-hover:bg-[#92400E]"
                        />
                      </div>
                      <span className="mt-2 text-xs font-semibold text-stone-700">
                        {item.week}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar & Tenant Messaging Card (Page 7 right panel) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-stone-900">
              Calendar, messages & profile settings
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-2">
              <div className="flex items-start space-x-2 text-stone-700">
                <MessageSquare className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Tenant confirms 4B access at 10:30</strong> — gate code <strong>4417</strong>.
                  <div className="text-[10px] text-stone-400 mt-0.5">On site, starting the valve swap now.</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>Push alerts for new jobs</span>
                <span className="font-bold text-emerald-700">On</span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>Auto-accept routine</span>
                <span className="font-bold text-stone-500">Off</span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between font-mono">
                <span>Payout ····4821</span>
                <span className="font-bold text-emerald-700">Verified</span>
              </div>
            </div>
          </div>

          {/* How the Vendor Flow Stays Reliable (Page 7 list) */}
          <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs text-stone-800">
            <div className="font-bold text-amber-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>How the vendor flow stays reliable</span>
            </div>
            <ul className="space-y-2 text-stone-700">
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Status transitions are timestamped and GPS-stamped</strong>, feeding the SLA clocks operators watch on the maintenance desk.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Invoices block submission until required evidence and receipts are attached</strong>, preventing payout disputes.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Payout math is shown before submission</strong> — fee, net amount, and transfer date — with no hidden deductions.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
