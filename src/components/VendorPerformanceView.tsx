import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Download,
  Filter,
  ShieldCheck,
  Star,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  VENDOR_MONTHLY_PERFORMANCE,
  VENDOR_WEEKLY_RESPONSE_TREND,
  VENDOR_CATEGORY_SLAS,
  VENDOR_DIRECTORY_SCORECARDS,
  RESPONSE_BY_PRIORITY_TIER,
} from '../data/vendorPerformanceData';
import { useSecurity } from '../context/SecurityContext';

interface VendorPerformanceViewProps {
  onBackToWorkbench?: () => void;
}

export const VendorPerformanceView: React.FC<VendorPerformanceViewProps> = ({ onBackToWorkbench }) => {
  const { showSecurityNotification } = useSecurity();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | 'ytd'>('90d');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'response' | 'resolution' | 'categories' | 'scorecards'>('overview');

  const filteredMonthlyData = VENDOR_MONTHLY_PERFORMANCE;

  const handleExportPerformanceReport = () => {
    showSecurityNotification('Vendor SLA & Performance Audit Report (PDF/CSV) dispatched to compliance archive.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>EstateFlow Operations · Vendor Intelligence & SLA Oversight</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mt-1">
            Vendor Performance & Resolution Metrics
          </h2>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Real-time analytics evaluating contracted trades on first response latency, on-site arrival precision, first-time fix rate, and contractual SLA resolution percentages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onBackToWorkbench && (
            <button
              onClick={onBackToWorkbench}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-700" />
              <span>Back to Workbench</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedTimeframe('30d')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                selectedTimeframe === '30d'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('90d')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                selectedTimeframe === '90d'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('ytd')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                selectedTimeframe === 'ytd'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              YTD 2026
            </button>
          </div>

          <button
            onClick={handleExportPerformanceReport}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SLA Report</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon: High-Level SLA Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Avg Response Time */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Avg Initial Response</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
              −43.3% vs SLA
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            17 <span className="text-xs font-sans font-semibold text-stone-500">mins</span>
          </div>
          <div className="text-[11px] text-stone-600 flex items-center space-x-1">
            <span className="text-emerald-700 font-bold flex items-center">
              <ArrowDownRight className="w-3 h-3 mr-0.5" /> 13m faster
            </span>
            <span>than 30m target</span>
          </div>
        </div>

        {/* KPI 2: On-Time Resolution Rate */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>On-Time Resolution Rate</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
              Target: 95.0%
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-800">
            98.4%
          </div>
          <div className="text-[11px] text-stone-600 flex items-center space-x-1">
            <span className="text-emerald-700 font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +3.4%
            </span>
            <span>above SLA threshold</span>
          </div>
        </div>

        {/* KPI 3: First-Time Fix Rate */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>First-Visit Fix Rate</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-800 font-mono text-[10px] font-bold">
              Zero-Recall
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            94.6%
          </div>
          <div className="text-[11px] text-stone-600">
            Only 2 repeat dispatches in 90d
          </div>
        </div>

        {/* KPI 4: Work Orders Completed */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Completed Work Orders</span>
            <span className="text-[10px] font-mono text-stone-400">YTD 2026</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            213
          </div>
          <div className="text-[11px] text-stone-600">
            <span className="font-bold text-stone-900">206</span> on-time · <span className="font-bold text-rose-600">7</span> breached
          </div>
        </div>

        {/* KPI 5: Tenant Satisfaction */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Tenant Rating</span>
            <span className="flex items-center text-amber-500">
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900 flex items-center space-x-1">
            <span>4.92</span>
            <span className="text-xs font-sans text-stone-400">/ 5.0</span>
          </div>
          <div className="text-[11px] text-stone-600">
            Across 184 post-fix reviews
          </div>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-1.5 bg-stone-100 p-1.5 rounded-2xl text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveAnalysisTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeAnalysisTab === 'overview'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('response')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeAnalysisTab === 'response'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Response Latency</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('resolution')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeAnalysisTab === 'resolution'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Resolution Rates & SLA</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('categories')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeAnalysisTab === 'categories'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-700" />
            <span>Trade Categories</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('scorecards')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeAnalysisTab === 'scorecards'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Vendor Scorecards</span>
          </button>
        </div>

        {/* Vendor Selector Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-semibold text-stone-600">Contractor:</span>
          <select
            value={selectedVendorFilter}
            onChange={(e) => setSelectedVendorFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium text-stone-800 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Contracted Trades (Portfolio Benchmark)</option>
            <option value="AquaFix Plumbing">AquaFix Plumbing (Active Workbench Vendor)</option>
            <option value="VoltCraft Electrical">VoltCraft Electrical</option>
            <option value="CoolAir Technologies">CoolAir Technologies (HVAC)</option>
            <option value="Austin Safe & Key">Austin Safe & Key</option>
            <option value="Apex Appliance Pros">Apex Appliance Pros</option>
          </select>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW (Dual Recharts Views) */}
      {activeAnalysisTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Left 6 Cols: Monthly Response Times */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Vendor Response Time Latency (Minutes)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Monthly average elapsed time from work order dispatch to contractor acceptance
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    17m Current (Sep)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredMonthlyData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B45309" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#B45309" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0EC" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: '#78716C', fontSize: 11 }}
                      axisLine={{ stroke: '#E7E5E4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#78716C', fontSize: 11 }}
                      axisLine={{ stroke: '#E7E5E4' }}
                      tickLine={false}
                      unit="m"
                      domain={[0, 35]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-stone-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                              <div className="font-bold text-amber-300">{label}</div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Actual Response:</span>
                                <span className="font-mono font-bold text-white">{data.avgResponseMinutes} mins</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">SLA Contract Limit:</span>
                                <span className="font-mono text-stone-300">{data.targetResponseMinutes} mins</span>
                              </div>
                              <div className="text-[10px] text-emerald-400 pt-1 border-t border-stone-800">
                                {data.targetResponseMinutes - data.avgResponseMinutes}m faster than contracted ceiling
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={30}
                      stroke="#DC2626"
                      strokeDasharray="4 4"
                      label={{ value: '30m SLA Target', position: 'insideTopRight', fill: '#DC2626', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgResponseMinutes"
                      stroke="#B45309"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorResponse)"
                      name="Response Time (mins)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                  <span>Actual Acceptance (Mins)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-0.5 bg-red-600" />
                  <span>Max SLA Limit (30m)</span>
                </span>
              </div>
            </div>

            {/* Chart Right 6 Cols: Monthly Resolution Rates */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    On-Time SLA Resolution Rates (%)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Percentage of work orders resolved within contractual SLA thresholds
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    98.4% On-Time
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredMonthlyData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0EC" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: '#78716C', fontSize: 11 }}
                      axisLine={{ stroke: '#E7E5E4' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="rate"
                      domain={[85, 100]}
                      tick={{ fill: '#78716C', fontSize: 11 }}
                      axisLine={{ stroke: '#E7E5E4' }}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-stone-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                              <div className="font-bold text-amber-300">{label}</div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Resolution Rate:</span>
                                <span className="font-mono font-bold text-emerald-400">{data.resolutionRate}%</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">First-Visit Fix Rate:</span>
                                <span className="font-mono text-stone-300">{data.firstTimeFixRate}%</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Jobs Resolved / Total:</span>
                                <span className="font-mono text-stone-300">{data.resolvedOnTime} / {data.totalJobs}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      yAxisId="rate"
                      y={95}
                      stroke="#2563EB"
                      strokeDasharray="4 4"
                      label={{ value: 'Target 95% SLA', position: 'insideBottomRight', fill: '#2563EB', fontSize: 10 }}
                    />
                    <Bar
                      yAxisId="rate"
                      dataKey="resolutionRate"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      name="Resolution Rate %"
                    />
                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="firstTimeFixRate"
                      stroke="#D97706"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#D97706' }}
                      name="First-Time Fix Rate %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
                  <span>SLA On-Time Resolution Rate</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1 bg-[#D97706]" />
                  <span>First-Visit Fix Rate</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-0.5 bg-blue-600" />
                  <span>95% Gold Threshold</span>
                </span>
              </div>
            </div>
          </div>

          {/* SLA Performance Reliability Tier & Active Vendor Context Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>AquaFix Plumbing (Active Workbench Vendor)</span>
              </div>
              <p className="text-xs text-stone-700">
                Primary contractor for plumbing emergencies in Oak Residence and Maple Court. Current 30-day response: <strong>14 mins</strong>, resolution rate: <strong>98.6%</strong> with 0 breached jobs.
              </p>
              <div className="pt-1 text-[11px] font-mono text-amber-900 font-semibold flex items-center justify-between">
                <span>Tier 1 Preferred Partner</span>
                <span className="text-emerald-700">Net 7 Auto-Payout</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-stone-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-stone-700" />
                <span>GPS Check-In Verification</span>
              </div>
              <p className="text-xs text-stone-600">
                100% of vendor on-site arrivals are validated via mobile geolocation before the SLA transition to "On Site" triggers. Ensures tamper-proof SLA compliance data.
              </p>
              <div className="pt-1 text-[11px] font-mono text-stone-700 font-semibold">
                SLA Clocks Fed Live To Dispatch
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Zero-Dispute Invoice Policy</span>
              </div>
              <p className="text-xs text-stone-700">
                Work orders require photo evidence (before & after) plus attached parts receipts prior to invoice submission, maintaining a <strong>99.4% first-pass payout approval rate</strong>.
              </p>
              <div className="pt-1 text-[11px] font-mono text-emerald-900 font-semibold">
                Automated 8% Platform Fee Deductions
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSE LATENCY DEEP-DIVE */}
      {activeAnalysisTab === 'response' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Weekly Response Latency by Urgency Tier (Minutes)
                </h3>
                <p className="text-xs text-stone-500">
                  Elapsed minutes from dispatch to contractor acknowledgment across Emergency, Urgent, and Routine jobs
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="p-1 px-2 rounded-md bg-stone-100 text-stone-700 font-mono">
                  SLA Ceiling: 30m
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={VENDOR_WEEKLY_RESPONSE_TREND}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0EC" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                    unit="m"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-stone-900 text-white rounded-xl shadow-lg text-xs space-y-1.5">
                            <div className="font-bold text-amber-300">{label}</div>
                            <div className="flex justify-between space-x-4 text-rose-400">
                              <span>Emergency Response:</span>
                              <span className="font-mono font-bold">{data.emergencyMins} mins (Target &lt; 15m)</span>
                            </div>
                            <div className="flex justify-between space-x-4 text-amber-400">
                              <span>Urgent Response:</span>
                              <span className="font-mono font-bold">{data.urgentMins} mins (Target &lt; 45m)</span>
                            </div>
                            <div className="flex justify-between space-x-4 text-blue-400">
                              <span>Routine Response:</span>
                              <span className="font-mono font-bold">{data.routineMins} mins</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <ReferenceLine
                    y={15}
                    stroke="#E11D48"
                    strokeDasharray="3 3"
                    label={{ value: 'Emergency SLA 15m', position: 'insideBottomRight', fill: '#E11D48', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emergencyMins"
                    name="Emergency (<15m SLA)"
                    stroke="#E11D48"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#E11D48' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="urgentMins"
                    name="Urgent (<45m SLA)"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#D97706' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="routineMins"
                    name="Routine Maintenance"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#2563EB' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Time Breakdown Table */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Priority Tier Response Benchmark Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold font-mono">
                    <th className="pb-2">Urgency Tier</th>
                    <th className="pb-2">Contractual SLA Benchmark</th>
                    <th className="pb-2">Current Actual Latency</th>
                    <th className="pb-2">Delta Variance</th>
                    <th className="pb-2 text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {RESPONSE_BY_PRIORITY_TIER.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70">
                      <td className="py-2.5 font-bold text-stone-900">{item.priority}</td>
                      <td className="py-2.5 font-mono text-stone-600">{item.benchmark} {item.unit}</td>
                      <td className="py-2.5 font-mono font-bold text-emerald-800">{item.actual} {item.unit}</td>
                      <td className="py-2.5 font-mono text-emerald-700">
                        −{(item.benchmark - item.actual).toFixed(1)} {item.unit} ({(((item.benchmark - item.actual) / item.benchmark) * 100).toFixed(0)}% faster)
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px] font-mono">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESOLUTION RATES & SLA */}
      {activeAnalysisTab === 'resolution' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Work Order Volume & On-Time Resolution Distribution
                </h3>
                <p className="text-xs text-stone-500">
                  Monthly volume of completed work orders split by on-time SLA resolution vs breached tickets
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-stone-700">
                  Target: &gt; 95.0%
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredMonthlyData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0EC" />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-stone-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                            <div className="font-bold text-amber-300">{label}</div>
                            <div className="flex justify-between space-x-4 text-emerald-400">
                              <span>Resolved On-Time:</span>
                              <span className="font-mono font-bold">{data.resolvedOnTime} jobs</span>
                            </div>
                            <div className="flex justify-between space-x-4 text-rose-400">
                              <span>SLA Breached:</span>
                              <span className="font-mono font-bold">{data.slaBreached} jobs</span>
                            </div>
                            <div className="flex justify-between space-x-4 pt-1 border-t border-stone-800 text-stone-300">
                              <span>Resolution Rate:</span>
                              <span className="font-mono font-bold text-white">{data.resolutionRate}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="resolvedOnTime"
                    name="Resolved Within SLA"
                    fill="#059669"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="slaBreached"
                    name="SLA Breached / Delayed"
                    fill="#E11D48"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRADE CATEGORIES */}
      {activeAnalysisTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart: Categories Resolution Rate */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Resolution Rate by Trade Category (%)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Comparison across primary contracted maintenance categories
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={VENDOR_CATEGORY_SLAS}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F0EC" />
                    <XAxis
                      type="number"
                      domain={[85, 100]}
                      tick={{ fill: '#78716C', fontSize: 11 }}
                      unit="%"
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      tick={{ fill: '#44403C', fontSize: 11, fontWeight: 600 }}
                      width={120}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-stone-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                              <div className="font-bold text-amber-300">{data.category}</div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Resolution Rate:</span>
                                <span className="font-mono font-bold text-emerald-400">{data.resolutionRate}%</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Avg Duration:</span>
                                <span className="font-mono text-stone-300">{data.avgResolutionHours} hours</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-stone-400">Total Completed:</span>
                                <span className="font-mono text-stone-300">{data.completedCount} work orders</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="resolutionRate" fill="#B45309" radius={[0, 4, 4, 0]}>
                      {VENDOR_CATEGORY_SLAS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.resolutionRate >= 98 ? '#059669' : entry.resolutionRate >= 95 ? '#D97706' : '#E11D48'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Details */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
                Category SLA Diagnostics
              </h3>
              <div className="space-y-2.5">
                {VENDOR_CATEGORY_SLAS.map((cat, i) => (
                  <div key={i} className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{cat.category}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Resp: {cat.avgResponseMinutes}m · Duration: {cat.avgResolutionHours}h · {cat.completedCount} jobs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${cat.resolutionRate >= 98 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {cat.resolutionRate}%
                      </div>
                      <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-end">
                        <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                        {cat.satisfactionRating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VENDOR DIRECTORY SCORECARDS */}
      {activeAnalysisTab === 'scorecards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VENDOR_DIRECTORY_SCORECARDS.map((v) => (
              <div
                key={v.vendorId}
                className={`p-5 bg-white border rounded-2xl shadow-2xs space-y-3 transition-all ${
                  v.vendorName === 'AquaFix Plumbing'
                    ? 'border-amber-400 ring-1 ring-amber-300'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-sm font-bold text-stone-900">{v.vendorName}</h4>
                      {v.vendorName === 'AquaFix Plumbing' && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[9px] rounded font-mono">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{v.trade}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      v.slaComplianceBadge === 'Tier 1 Preferred'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {v.slaComplianceBadge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100 font-mono">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <div className="text-[10px] text-stone-500 font-sans">Avg Response</div>
                    <div className="font-bold text-stone-900">{v.avgResponseMinutes} mins</div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <div className="text-[10px] text-stone-500 font-sans">Resolution Rate</div>
                    <div className="font-bold text-emerald-700">{v.resolutionRate}%</div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <div className="text-[10px] text-stone-500 font-sans">First-Time Fix</div>
                    <div className="font-bold text-stone-900">{v.firstTimeFixRate}%</div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <div className="text-[10px] text-stone-500 font-sans">YTD Closed Jobs</div>
                    <div className="font-bold text-stone-900">{v.completedJobsYtd} jobs</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-stone-600">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span className="font-mono text-[11px]">{v.phone}</span>
                  </span>
                  <span className="flex items-center text-amber-600 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    {v.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
