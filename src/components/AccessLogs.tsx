import React, { useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  Lock,
  Smartphone,
  Laptop,
  Tablet,
  Server,
  X,
  ExternalLink,
  Clock,
  User,
  Radio,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { SystemAccessEvent, AccessEventType, AccessEventStatus, AccessRiskLevel } from '../types';
import { INITIAL_ACCESS_LOGS, generateSimulatedAccessEvent } from '../data/accessLogsData';
import { useSecurity } from '../context/SecurityContext';

interface AccessLogsProps {
  initialLogs?: SystemAccessEvent[];
}

export const AccessLogs: React.FC<AccessLogsProps> = ({ initialLogs }) => {
  const { showSecurityNotification, activeRole } = useSecurity();
  const [logs, setLogs] = useState<SystemAccessEvent[]>(() => initialLogs || INITIAL_ACCESS_LOGS);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deep Inspection Modal State
  const [inspectedEvent, setInspectedEvent] = useState<SystemAccessEvent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered dataset based on search and dropdown filters
  const filteredLogs = useMemo(() => {
    return logs.filter((event) => {
      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser =
          event.userId.toLowerCase().includes(query) ||
          event.userName.toLowerCase().includes(query) ||
          event.userEmail.toLowerCase().includes(query) ||
          event.role.toLowerCase().includes(query);
        const matchesGeo =
          event.ipAddress.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.region.toLowerCase().includes(query) ||
          event.country.toLowerCase().includes(query) ||
          event.isp.toLowerCase().includes(query);
        const matchesEvent =
          event.eventType.toLowerCase().includes(query) ||
          event.status.toLowerCase().includes(query) ||
          event.device.toLowerCase().includes(query) ||
          event.browser.toLowerCase().includes(query);

        if (!matchesUser && !matchesGeo && !matchesEvent) {
          return false;
        }
      }

      // Event Type filter
      if (selectedEventType !== 'ALL' && event.eventType !== selectedEventType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && event.status !== selectedStatus) {
        return false;
      }

      // Risk Level filter
      if (selectedRiskLevel !== 'ALL' && event.riskLevel !== selectedRiskLevel) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedEventType, selectedStatus, selectedRiskLevel]);

  // Pagination Calculations
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, safeCurrentPage, pageSize]);

  // Reset pagination when filter criteria change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEventType('ALL');
    setSelectedStatus('ALL');
    setSelectedRiskLevel('ALL');
    setCurrentPage(1);
  };

  // KPI Overview calculations
  const totalEventsCount = logs.length;
  const uniqueUsersCount = new Set(logs.map((l) => l.userId)).size;
  const uniqueCountriesCount = new Set(logs.map((l) => l.country)).size;
  const flaggedEventsCount = logs.filter((l) => l.status === 'FLAGGED' || l.riskLevel === 'HIGH').length;

  // Add realistic simulated access event
  const handleSimulateNewEvent = () => {
    const newEvent = generateSimulatedAccessEvent();
    setLogs((prev) => [newEvent, ...prev]);
    showSecurityNotification(
      `Recorded live access event: [${newEvent.userId}] ${newEvent.userName} from ${newEvent.city}, ${newEvent.country} (${newEvent.status})`
    );
  };

  // Administrative action handlers (Revoke, Denylist)
  const handleRevokeSession = (eventId: string) => {
    setLogs((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? {
              ...item,
              status: 'DENIED',
              riskScore: Math.min(100, item.riskScore + 30),
              flagReason: 'Session token administratively terminated by Security Officer.',
            }
          : item
      )
    );
    if (inspectedEvent && inspectedEvent.id === eventId) {
      setInspectedEvent((prev) =>
        prev
          ? {
              ...prev,
              status: 'DENIED',
              riskScore: Math.min(100, prev.riskScore + 30),
              flagReason: 'Session token administratively terminated by Security Officer.',
            }
          : null
      );
    }
    showSecurityNotification(`Administrative Action: Session token for event ${eventId} revoked.`);
  };

  const handleBlockIpAddress = (ip: string) => {
    setLogs((prev) =>
      prev.map((item) =>
        item.ipAddress === ip
          ? {
              ...item,
              status: 'DENIED',
              riskLevel: 'HIGH',
              riskScore: 99,
              flagReason: `IP address ${ip} added to Edge Gateway denylist.`,
            }
          : item
      )
    );
    showSecurityNotification(`Administrative Action: IP ${ip} permanently added to gateway firewall denylist.`);
  };

  // Export functions (CSV / JSON)
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'User ID',
      'User Name',
      'Email',
      'Role',
      'Timestamp UTC',
      'IP Address',
      'City',
      'Region',
      'Country',
      'Latitude',
      'Longitude',
      'ISP',
      'ASN',
      'Event Type',
      'Status',
      'Risk Level',
      'Risk Score',
      'Device',
      'Browser',
      'Device Type',
      'Auth Method',
      'Flag Reason',
    ];

    const rows = filteredLogs.map((e) => [
      e.id,
      e.userId,
      `"${e.userName.replace(/"/g, '""')}"`,
      e.userEmail,
      `"${e.role}"`,
      e.timestamp,
      e.ipAddress,
      `"${e.city}"`,
      `"${e.region}"`,
      `"${e.country}"`,
      e.coordinates.latitude,
      e.coordinates.longitude,
      `"${e.isp}"`,
      e.asn || 'N/A',
      e.eventType,
      e.status,
      e.riskLevel,
      e.riskScore,
      `"${e.device}"`,
      `"${e.browser}"`,
      e.deviceType,
      `"${e.authMethod}"`,
      `"${(e.flagReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estateflow-access-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSecurityNotification(`Exported ${filteredLogs.length} access log records to CSV.`);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalRecords: filteredLogs.length,
        systemEnvironment: 'Production (SOC 2 Type II / RBAC)',
        accessEvents: filteredLogs,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estateflow-access-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSecurityNotification(`Exported ${filteredLogs.length} access log records to JSON.`);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Desktop':
        return <Laptop className="w-3.5 h-3.5 text-stone-600" />;
      case 'Mobile':
        return <Smartphone className="w-3.5 h-3.5 text-amber-700" />;
      case 'Tablet':
        return <Tablet className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Server className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getStatusBadge = (status: AccessEventStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>SUCCESS</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <X className="w-3 h-3 text-rose-600" />
            <span>DENIED</span>
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>FLAGGED</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span>CHALLENGE</span>
          </span>
        );
    }
  };

  const getRiskScoreBadge = (score: number, level: AccessRiskLevel) => {
    let colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let dotColor = 'bg-emerald-500';

    if (level === 'HIGH' || score >= 70) {
      colorClasses = 'bg-rose-50 text-rose-900 border-rose-200 font-bold';
      dotColor = 'bg-rose-600';
    } else if (level === 'MEDIUM' || score >= 35) {
      colorClasses = 'bg-amber-50 text-amber-900 border-amber-200';
      dotColor = 'bg-amber-500';
    }

    return (
      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${colorClasses}`}>
          {score} / 100
        </span>
      </div>
    );
  };

  const formatEventType = (type: AccessEventType) => {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return 'Login (Auth OK)';
      case 'LOGIN_FAILED':
        return 'Auth Failed';
      case 'MFA_CHALLENGE':
        return 'MFA Challenge';
      case 'SESSION_REFRESH':
        return 'Session Refresh';
      case 'API_AUTHENTICATION':
        return 'API Bearer Token';
      case 'SUSPICIOUS_GEO_HOP':
        return 'Geo-Hop Alert';
      case 'LOGOUT':
        return 'Logout (Voluntary)';
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-5">
      {/* Component Header & KPI Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-stone-900">
                  System Access Logs & Telemetry
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  Live GeoIP Stream
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Granular surveillance of user IDs, timestamps, device fingerprints, and geolocation coordinates for administrative oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Live Ingestion Simulation & Data Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateNewEvent}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200/80 transition-colors shadow-2xs cursor-pointer"
            title="Simulate a new incoming user authentication event"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Simulate Access Event</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold border border-stone-200 transition-colors shadow-2xs cursor-pointer"
            title="Export filtered access events as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold border border-stone-200 transition-colors shadow-2xs cursor-pointer"
            title="Export filtered access events as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-700" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
            Total Access Events
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold font-mono text-stone-900">
              {totalEventsCount}
            </span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            Append-only authentication stream
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
            Monitored User IDs
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold font-mono text-stone-900">
              {uniqueUsersCount}
            </span>
            <User className="w-4 h-4 text-amber-700" />
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            Active RBAC identity profiles
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
            Geographic Origins
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold font-mono text-stone-900">
              {uniqueCountriesCount} Countries
            </span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            Cameroon, USA, UK, France, Niger
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
            Flagged / High-Risk
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-lg font-bold font-mono ${flaggedEventsCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {flaggedEventsCount}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            Suspicious hops & brute force blocked
          </span>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-stone-50/70 border border-stone-200 rounded-xl text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            placeholder="Search by User ID, Name, IP, City, Country, Event..."
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => handleFilterChange(setSearchQuery, '')}
              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => handleFilterChange(setSelectedEventType, e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            <option value="ALL">All Event Types</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="MFA_CHALLENGE">MFA Challenge</option>
            <option value="SESSION_REFRESH">Session Refresh</option>
            <option value="API_AUTHENTICATION">API Authentication</option>
            <option value="SUSPICIOUS_GEO_HOP">Suspicious Geo-Hop</option>
            <option value="LOGOUT">Logout</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="DENIED">Denied</option>
            <option value="FLAGGED">Flagged</option>
            <option value="WARNING">Challenge</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel}
            onChange={(e) => handleFilterChange(setSelectedRiskLevel, e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          {(searchQuery || selectedEventType !== 'ALL' || selectedStatus !== 'ALL' || selectedRiskLevel !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 px-2 py-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Paginated Table */}
      <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs text-stone-800 divide-y divide-stone-200">
          <thead className="bg-[#FAF9F6] text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
            <tr>
              <th className="py-3 px-3">Timestamp (UTC)</th>
              <th className="py-3 px-3">User ID & Identity</th>
              <th className="py-3 px-3">Geolocation & Origin</th>
              <th className="py-3 px-3">Access Event</th>
              <th className="py-3 px-3">Device & Client</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Risk Assessment</th>
              <th className="py-3 px-3 text-right">Oversight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Globe className="w-6 h-6 text-stone-400 mx-auto" />
                    <p className="font-bold text-xs text-stone-800">No matching access events found</p>
                    <p className="text-[11px] text-stone-500">
                      Try relaxing your search terms or filters to view recent authentication traffic.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((event) => (
                <tr
                  key={event.id}
                  className={`hover:bg-amber-50/40 transition-colors ${
                    event.status === 'FLAGGED' ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-stone-700">
                    <div className="font-semibold text-stone-900">{event.timestamp}</div>
                    <span className="text-[10px] text-stone-400 flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5 inline" />
                      <span>ID: {event.id}</span>
                    </span>
                  </td>

                  {/* User ID & Identity */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-stone-800 text-amber-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 font-mono">
                        {event.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] bg-stone-100 text-stone-800 px-1 rounded font-bold border border-stone-200">
                            {event.userId}
                          </span>
                          <span className="font-bold text-stone-900 text-xs truncate max-w-[130px]">
                            {event.userName}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[150px]">
                          {event.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Geolocation & Origin (IP, City, Country, Lat/Long, ISP) */}
                  <td className="py-3 px-3 min-w-[200px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-stone-900">
                        <span>{event.flag}</span>
                        <span>
                          {event.city}, {event.country}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] font-mono text-stone-500">
                        <span className="bg-stone-100 text-stone-700 px-1 py-0.2 rounded border border-stone-200">
                          {event.ipAddress}
                        </span>
                        <span>·</span>
                        <span title={`Coordinates: ${event.coordinates.latitude}, ${event.coordinates.longitude}`}>
                          {event.coordinates.latitude.toFixed(2)}°, {event.coordinates.longitude.toFixed(2)}°
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 truncate max-w-[190px]" title={event.isp}>
                        {event.isp}
                      </div>
                    </div>
                  </td>

                  {/* Access Event Type */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-xs text-stone-800">
                      {formatEventType(event.eventType)}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {event.authMethod}
                    </div>
                  </td>

                  {/* Device & Client */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      {getDeviceIcon(event.deviceType)}
                      <span className="font-medium text-stone-900 text-xs truncate max-w-[120px]">
                        {event.browser}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 truncate max-w-[140px]" title={event.device}>
                      {event.device}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(event.status)}
                    {event.flagReason && (
                      <div
                        className="text-[10px] text-amber-800 max-w-[120px] truncate mt-0.5 cursor-help"
                        title={event.flagReason}
                      >
                        ⚠️ Alert Notice
                      </div>
                    )}
                  </td>

                  {/* Risk Assessment */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getRiskScoreBadge(event.riskScore, event.riskLevel)}
                    <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                      Risk: {event.riskLevel}
                    </span>
                  </td>

                  {/* Actions / Oversight */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setInspectedEvent(event)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors border border-stone-200/80 cursor-pointer"
                      title="Inspect full geolocation coordinates and session telemetry"
                    >
                      <Eye className="w-3 h-3 text-stone-600" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600 pt-2 border-t border-stone-100">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white border border-stone-200 rounded-lg font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <span className="text-stone-400">|</span>

          <span className="font-medium text-stone-700 font-mono">
            Showing{' '}
            {totalItems === 0
              ? '0'
              : `${(safeCurrentPage - 1) * pageSize + 1}–${Math.min(safeCurrentPage * pageSize, totalItems)}`}{' '}
            of {totalItems} access events
          </span>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1 self-end sm:self-auto">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1 px-1 font-mono text-xs">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, and pages adjacent to current page
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safeCurrentPage) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-stone-400">…</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        safeCurrentPage === page
                          ? 'bg-amber-800 text-white shadow-2xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Deep Inspection & Administrative Oversight Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
                  <Globe className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      Access Event Inspection & Telemetry
                    </h3>
                    <span className="text-[10px] font-mono bg-stone-800 text-amber-300 px-2 py-0.5 rounded border border-stone-700">
                      {inspectedEvent.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Comprehensive geolocation, identity verification, and cryptographic session fingerprint.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
              {/* Geolocation Card */}
              <div className="p-4 bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl text-white space-y-3 border border-stone-800">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{inspectedEvent.flag}</span>
                    <span className="font-bold text-sm text-stone-100">
                      {inspectedEvent.city}, {inspectedEvent.region}, {inspectedEvent.country}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {inspectedEvent.countryCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">IP Address:</span>
                    <div className="flex items-center space-x-1 font-bold text-amber-300 mt-0.5">
                      <span>{inspectedEvent.ipAddress}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(inspectedEvent.ipAddress, 'modal-ip')}
                        className="text-stone-400 hover:text-white"
                        title="Copy IP"
                      >
                        {copiedField === 'modal-ip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Coordinates:</span>
                    <span className="text-white font-bold block mt-0.5">
                      {inspectedEvent.coordinates.latitude.toFixed(4)}°, {inspectedEvent.coordinates.longitude.toFixed(4)}°
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Timezone:</span>
                    <span className="text-stone-300 block mt-0.5">
                      {inspectedEvent.timezone || 'Africa/Douala (UTC+1)'}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-stone-400 block text-[10px] uppercase">ISP & Carrier Network:</span>
                    <span className="text-stone-200 block mt-0.5 font-sans font-medium">
                      {inspectedEvent.isp} ({inspectedEvent.asn || 'AS37064'})
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Event Status:</span>
                    <div className="mt-1">{getStatusBadge(inspectedEvent.status)}</div>
                  </div>
                </div>
              </div>

              {/* Identity & Session Telemetry */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-amber-700" />
                  <span>Authenticated Identity Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 text-[11px] block">User ID:</span>
                    <span className="font-mono font-bold text-stone-900 bg-white px-1.5 py-0.5 rounded border border-stone-200 inline-block mt-0.5">
                      {inspectedEvent.userId}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[11px] block">Full Name:</span>
                    <span className="font-bold text-stone-900 block mt-0.5">
                      {inspectedEvent.userName}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[11px] block">Assigned Role:</span>
                    <span className="font-medium text-stone-800 block mt-0.5">
                      {inspectedEvent.role}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[11px] block">Email:</span>
                    <span className="text-stone-800 block mt-0.5">
                      {inspectedEvent.userEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Device & Cryptography */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-indigo-700" />
                  <span>Device & Cryptographic Token Fingerprint</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-500 text-[11px] block">Hardware Device:</span>
                      <span className="font-medium text-stone-900 block mt-0.5">
                        {inspectedEvent.device}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[11px] block">Browser / Client:</span>
                      <span className="font-medium text-stone-900 block mt-0.5">
                        {inspectedEvent.browser}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[11px] block">Auth Protocol:</span>
                      <span className="font-semibold text-stone-900 block mt-0.5">
                        {inspectedEvent.authMethod}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[11px] block">Risk Score:</span>
                      <div className="mt-0.5">
                        {getRiskScoreBadge(inspectedEvent.riskScore, inspectedEvent.riskLevel)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200">
                    <span className="text-stone-500 text-[11px] block">SHA-256 Session Fingerprint:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="p-2 bg-white rounded-lg border border-stone-200 text-[10px] font-mono text-stone-700 flex-1 break-all select-all">
                        {inspectedEvent.sessionTokenHash}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(inspectedEvent.sessionTokenHash, 'modal-hash')}
                        className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 flex items-center space-x-1"
                      >
                        {copiedField === 'modal-hash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                        <span>{copiedField === 'modal-hash' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threat Notice if flagged */}
              {inspectedEvent.flagReason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <div className="font-bold text-rose-900 flex items-center space-x-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Security Alert / Threat Rule Match:</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed pl-5">
                    {inspectedEvent.flagReason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer with Administrative Mitigation Actions */}
            <div className="p-4 sm:px-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-stone-500 text-[11px] flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Administrative Oversight Controls Enabled</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBlockIpAddress(inspectedEvent.ipAddress)}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-xl transition-colors cursor-pointer"
                  title="Add IP address to gateway firewall denylist"
                >
                  Denylist IP
                </button>

                <button
                  type="button"
                  onClick={() => handleRevokeSession(inspectedEvent.id)}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  title="Immediately terminate this authenticated session"
                >
                  Revoke Session
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedEvent(null)}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 font-semibold border border-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
