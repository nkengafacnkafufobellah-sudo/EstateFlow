import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Wrench,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  MapPin,
  UserCheck,
  Repeat,
  FileText,
  DollarSign,
  X,
  Search,
  ExternalLink,
  CalendarDays,
  List,
  Check,
  Coins,
} from 'lucide-react';
import {
  MaintenanceScheduleEvent,
  ScheduleEventType,
  RecurrenceInterval,
  EventStatus,
  SupportedCurrency,
} from '../types';
import { MAINTENANCE_SCHEDULE_EVENTS, PROPERTIES_DATA } from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';

interface MaintenanceCalendarProps {
  onSelectTicket?: (ticketCode: string) => void;
}

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  onSelectTicket,
}) => {
  const { canPerform, activeRole, showSecurityNotification } = useSecurity();
  const { activeCurrency, setActiveCurrency, formatAmount, currencies } = useCurrency();

  // Events in local state (seeded from data)
  const [events, setEvents] = useState<MaintenanceScheduleEvent[]>(MAINTENANCE_SCHEDULE_EVENTS);

  // Calendar date navigation: default to September 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed: 8 = September

  // Display mode: 'grid' or 'agenda'
  const [displayMode, setDisplayMode] = useState<'grid' | 'agenda'>('grid');

  // Selected date filter (YYYY-MM-DD) or selected event
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-21');
  const [activeEventDetail, setActiveEventDetail] = useState<MaintenanceScheduleEvent | null>(null);

  // Filters
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ScheduleEventType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add event modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ScheduleEventType>('inspection');
  const [newPropertyId, setNewPropertyId] = useState('prp-1');
  const [newUnit, setNewUnit] = useState('');
  const [newDate, setNewDate] = useState('2026-09-24');
  const [newTimeWindow, setNewTimeWindow] = useState('09:00 AM - 11:30 AM');
  const [newVendor, setNewVendor] = useState('');
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceInterval>('quarterly');
  const [newComplianceCode, setNewComplianceCode] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newScopeText, setNewScopeText] = useState('');

  // Month metadata
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDate('2026-09-21');
  };

  // Compute calendar grid cells
  const calendarCells = useMemo(() => {
    // first day of month (0 = Sun, 1 = Mon...)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // days in previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const monthStr = String(prevMonthIdx + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      cells.push({
        dateStr: `${prevYear}-${monthStr}-${dayStr}`,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const isToday = dateStr === '2026-09-21'; // App simulated today
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month leading days to complete grid (42 cells = 6 weeks)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const monthStr = String(nextMonthIdx + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      cells.push({
        dateStr: `${nextYear}-${monthStr}-${dayStr}`,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Property filter
      if (propertyFilter !== 'all' && evt.propertyId !== propertyFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && evt.type !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && evt.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          evt.title.toLowerCase().includes(q) ||
          evt.propertyName.toLowerCase().includes(q) ||
          (evt.unit && evt.unit.toLowerCase().includes(q)) ||
          evt.vendorOrInspector.toLowerCase().includes(q) ||
          (evt.linkedTicketCode && evt.linkedTicketCode.toLowerCase().includes(q)) ||
          (evt.complianceCode && evt.complianceCode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [events, propertyFilter, typeFilter, statusFilter, searchQuery]);

  // Events mapped by date for fast grid lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MaintenanceScheduleEvent[]>();
    filteredEvents.forEach((evt) => {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    });
    return map;
  }, [filteredEvents]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // Monthly stats
  const currentMonthStats = useMemo(() => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const prefix = `${currentYear}-${monthStr}`;
    const thisMonthEvents = events.filter((e) => e.date.startsWith(prefix));

    const total = thisMonthEvents.length;
    const inspections = thisMonthEvents.filter((e) => e.type === 'inspection').length;
    const appointments = thisMonthEvents.filter((e) => e.type === 'appointment').length;
    const completed = thisMonthEvents.filter((e) => e.status === 'completed').length;
    const overdue = thisMonthEvents.filter((e) => e.status === 'overdue').length;
    const inProgress = thisMonthEvents.filter((e) => e.status === 'in-progress').length;
    const totalEstimatedCost = thisMonthEvents.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

    return {
      total,
      inspections,
      appointments,
      completed,
      overdue,
      inProgress,
      totalEstimatedCost,
    };
  }, [events, currentYear, currentMonth]);

  // Quick action: mark event completed
  const handleToggleEventStatus = (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canPerform('maintenance.approve_quote') && activeRole === 'accountant') {
      showSecurityNotification('Access Restricted: Only Property Managers, Owners, and Vendors can sign off maintenance work.');
      return;
    }

    setEvents((prev) =>
      prev.map((item) => {
        if (item.id === eventId) {
          const nextStatus: EventStatus = item.status === 'completed' ? 'scheduled' : 'completed';
          showSecurityNotification(
            `Updated "${item.title}": marked as ${nextStatus.toUpperCase()}. Audit entry logged.`
          );
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );

    if (activeEventDetail && activeEventDetail.id === eventId) {
      setActiveEventDetail((prev) =>
        prev ? { ...prev, status: prev.status === 'completed' ? 'scheduled' : 'completed' } : null
      );
    }
  };

  // Submit new event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter an event or inspection title.');
      return;
    }

    const selectedProp = PROPERTIES_DATA.find((p) => p.id === newPropertyId) || PROPERTIES_DATA[0];

    const enteredCost = newCost ? parseFloat(newCost) : undefined;
    const costInUSD =
      enteredCost !== undefined && !isNaN(enteredCost)
        ? currencies[activeCurrency].rateAgainstUSD > 0
          ? enteredCost / currencies[activeCurrency].rateAgainstUSD
          : enteredCost
        : undefined;

    const newEvt: MaintenanceScheduleEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      propertyId: selectedProp.id,
      propertyName: selectedProp.name,
      unit: newUnit.trim() || 'Building Common Area',
      date: newDate,
      timeWindow: newTimeWindow.trim() || '09:00 AM - 12:00 PM',
      vendorOrInspector: newVendor.trim() || (newType === 'inspection' ? 'EstateFlow Compliance Officer' : 'AquaFix Plumbing'),
      recurrence: newType === 'inspection' ? newRecurrence : 'none',
      status: 'scheduled',
      complianceCode: newComplianceCode.trim() || undefined,
      estimatedCost: costInUSD,
      scopeOfWork: newScopeText.trim()
        ? newScopeText.split('\n').filter((s) => s.trim())
        : ['Perform verified visual and operational inspection', 'Log certified results to compliance ledger'],
      notes: `Scheduled by ${activeRole}. Automatic reminder dispatched.`,
    };

    setEvents((prev) => [newEvt, ...prev]);
    setIsAddModalOpen(false);
    setSelectedDate(newDate);

    // Reset form
    setNewTitle('');
    setNewUnit('');
    setNewVendor('');
    setNewComplianceCode('');
    setNewCost('');
    setNewScopeText('');

    showSecurityNotification(
      `Scheduled ${newType === 'inspection' ? 'Recurring Inspection' : 'Service Appointment'}: "${newEvt.title}" on ${newDate}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                <CalendarDays className="w-5 h-5 text-amber-800" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">
                Service Appointments & Recurring Inspections
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Monthly portfolio view coordinating vendor dispatches, safety audits, and preventive maintenance across all 4 properties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Multi-Currency Selector */}
            <div className="inline-flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase px-1.5 flex items-center space-x-1">
                <Coins className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Currency:</span>
              </span>
              {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((c) => (
                <button
                  key={c}
                  id={`calendar-curr-btn-${c}`}
                  onClick={() => {
                    setActiveCurrency(c);
                    showSecurityNotification(`Calendar estimates converted to ${currencies[c].name} (${currencies[c].symbol}).`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
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

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-semibold text-stone-600 border border-stone-200">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  displayMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'hover:text-stone-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar Grid</span>
              </button>
              <button
                onClick={() => setDisplayMode('agenda')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  displayMode === 'agenda'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'hover:text-stone-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda List ({filteredEvents.length})</span>
              </button>
            </div>

            {/* Schedule New Button */}
            <button
              id="btn-schedule-event"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Inspection / Service</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-3 border-t border-stone-100">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Month Total
            </div>
            <div className="text-xl font-extrabold text-stone-900 font-mono mt-0.5">
              {currentMonthStats.total}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {monthNames[currentMonth]} {currentYear}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Inspections</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-950 font-mono mt-0.5">
              {currentMonthStats.inspections}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Compliance & Safety</div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
              <Wrench className="w-3.5 h-3.5 text-amber-700" />
              <span>Appointments</span>
            </div>
            <div className="text-xl font-extrabold text-amber-950 font-mono mt-0.5">
              {currentMonthStats.appointments}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">Vendor Dispatches</div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              <span>In Progress</span>
            </div>
            <div className="text-xl font-extrabold text-blue-950 font-mono mt-0.5">
              {currentMonthStats.inProgress}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">Technicians On Site</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-extrabold text-stone-900 font-mono mt-0.5">
              {currentMonthStats.completed}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Signed off & certified</div>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
              <span>Overdue / Alert</span>
            </div>
            <div className="text-xl font-extrabold text-rose-950 font-mono mt-0.5">
              {currentMonthStats.overdue}
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">Requires Approval</div>
          </div>

          {/* Month Estimated Budget / Cost Card */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300/80">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
              <Coins className="w-3.5 h-3.5 text-amber-800" />
              <span>Est. Budget</span>
            </div>
            <div className="text-xl font-extrabold text-stone-900 font-mono mt-0.5 truncate" title={formatAmount(currentMonthStats.totalEstimatedCost)}>
              {formatAmount(currentMonthStats.totalEstimatedCost)}
            </div>
            <div className="text-[10px] text-amber-800/80 mt-0.5 font-medium flex items-center space-x-1">
              <span>{currencies[activeCurrency].flag}</span>
              <span>In {activeCurrency} ({currencies[activeCurrency].symbol})</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Property Filter */}
            <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-500" />
              <select
                id="select-calendar-property"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                aria-label="Filter events by property"
                className="bg-transparent text-stone-800 font-medium focus:outline-none text-xs"
              >
                <option value="all">All Properties</option>
                {PROPERTIES_DATA.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unitsTotal} units)
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setTypeFilter('inspection')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  typeFilter === 'inspection'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <ClipboardCheck className="w-3 h-3" />
                <span>Inspections</span>
              </button>
              <button
                onClick={() => setTypeFilter('appointment')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  typeFilter === 'appointment'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Appointments</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <select
                id="select-calendar-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter events by status"
                className="bg-transparent text-stone-800 font-medium focus:outline-none text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search inspections, vendors, units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar Section (2-Column: Grid on left, Selected Day / Event Details on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Navigation & Grid or Agenda List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
            {/* Month Header with Navigation Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                {currentMonth === 8 && currentYear === 2026 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                    Current Period
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  id="btn-calendar-prev"
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-calendar-today"
                  onClick={handleGoToday}
                  className="px-3 py-1 text-xs font-bold border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  id="btn-calendar-next"
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {displayMode === 'grid' ? (
              /* Month Calendar Grid */
              <div className="mt-4">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-stone-400 uppercase tracking-wider pb-2 border-b border-stone-100">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 42-cell Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mt-1">
                  {calendarCells.map((cell) => {
                    const cellEvents = eventsByDate.get(cell.dateStr) || [];
                    const isSelected = selectedDate === cell.dateStr;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => {
                          setSelectedDate(cell.dateStr);
                          if (cellEvents.length > 0) {
                            setActiveEventDetail(cellEvents[0]);
                          }
                        }}
                        className={`min-h-[92px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/40 shadow-xs'
                            : cell.isCurrentMonth
                            ? 'border-stone-200/80 bg-white hover:border-amber-300 hover:bg-stone-50/60'
                            : 'border-stone-100 bg-stone-50/40 opacity-45'
                        }`}
                      >
                        {/* Day Number & Indicators */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              cell.isToday
                                ? 'bg-amber-700 text-white shadow-2xs font-extrabold'
                                : isSelected
                                ? 'bg-amber-200 text-amber-900 font-extrabold'
                                : cell.isCurrentMonth
                                ? 'text-stone-800'
                                : 'text-stone-400'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {cellEvents.length > 0 && (
                            <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-full border border-stone-200">
                              {cellEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events List in Day Cell */}
                        <div className="space-y-1 mt-1 overflow-hidden">
                          {cellEvents.slice(0, 2).map((evt) => {
                            const isInspection = evt.type === 'inspection';
                            const isDone = evt.status === 'completed';
                            const isOverdue = evt.status === 'overdue';

                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(cell.dateStr);
                                  setActiveEventDetail(evt);
                                }}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border leading-tight flex items-center space-x-1 ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : isDone
                                    ? 'bg-stone-100 text-stone-600 border-stone-200 line-through'
                                    : isInspection
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                                title={`${evt.title} (${evt.propertyName})`}
                              >
                                {isInspection ? (
                                  <ClipboardCheck className="w-2.5 h-2.5 flex-shrink-0 text-emerald-700" />
                                ) : (
                                  <Wrench className="w-2.5 h-2.5 flex-shrink-0 text-amber-700" />
                                )}
                                <span className="truncate">{evt.title}</span>
                              </div>
                            );
                          })}

                          {cellEvents.length > 2 && (
                            <div className="text-[9px] font-semibold text-stone-500 text-right pr-0.5">
                              +{cellEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Chronological Agenda View */
              <div className="mt-4 space-y-3">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
                    <CalendarIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <div className="text-sm font-bold text-stone-700">No scheduled events found</div>
                    <p className="text-xs text-stone-500 mt-1">Try resetting the filters or add a new inspection.</p>
                  </div>
                ) : (
                  filteredEvents
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((evt) => {
                      const isSelected = activeEventDetail?.id === evt.id;
                      const isInspection = evt.type === 'inspection';
                      const isCompleted = evt.status === 'completed';
                      const isOverdue = evt.status === 'overdue';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setSelectedDate(evt.date);
                            setActiveEventDetail(evt);
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/40'
                              : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-xl flex-shrink-0 ${
                                isInspection
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isInspection ? (
                                <ClipboardCheck className="w-4 h-4" />
                              ) : (
                                <Wrench className="w-4 h-4" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-stone-900">{evt.title}</span>
                                {evt.recurrence !== 'none' && (
                                  <span className="text-[10px] font-mono font-semibold bg-stone-100 text-stone-700 px-2 py-0.2 rounded-full border border-stone-200 flex items-center space-x-1">
                                    <Repeat className="w-2.5 h-2.5 text-stone-500" />
                                    <span>{evt.recurrence.toUpperCase()}</span>
                                  </span>
                                )}
                                {evt.complianceCode && (
                                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                                    {evt.complianceCode}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                                <span className="flex items-center space-x-1 font-medium text-stone-800">
                                  <Building2 className="w-3 h-3 text-stone-400" />
                                  <span>{evt.propertyName}</span>
                                  {evt.unit && <span className="text-stone-500">· {evt.unit}</span>}
                                </span>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <UserCheck className="w-3 h-3 text-stone-400" />
                                  <span>{evt.vendorOrInspector}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                            {evt.estimatedCost !== undefined && (
                              <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                {formatAmount(evt.estimatedCost)}
                              </span>
                            )}

                            <div className="text-right">
                              <div className="font-mono font-bold text-xs text-stone-900">
                                {evt.date}
                              </div>
                              <div className="text-[11px] text-stone-500">{evt.timeWindow}</div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-50 text-blue-800'
                              }`}
                            >
                              {evt.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Day Schedule & Detailed Inspector Card */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Date Header */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Day Schedule
                </div>
                <h4 className="text-base font-bold text-stone-900 mt-0.5">
                  {selectedDate}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {/* List of events on this selected date */}
            {selectedDateEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                <CalendarDays className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                No events scheduled for this day.
                <div className="mt-2">
                  <button
                    onClick={() => {
                      setNewDate(selectedDate);
                      setIsAddModalOpen(true);
                    }}
                    className="text-amber-800 hover:text-amber-900 font-bold underline text-xs"
                  >
                    + Schedule on {selectedDate}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((evt) => {
                  const isInspection = evt.type === 'inspection';
                  const isSelected = activeEventDetail?.id === evt.id;
                  const isDone = evt.status === 'completed';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setActiveEventDetail(evt)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-stone-900">{evt.title}</div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isDone
                              ? 'bg-stone-100 text-stone-600'
                              : isInspection
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isInspection ? 'Inspection' : 'Service'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-1 font-mono">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{evt.timeWindow}</span>
                        <span>•</span>
                        <span>{evt.propertyName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Event Detail Card */}
          {activeEventDetail ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <span
                    className={`p-1.5 rounded-lg ${
                      activeEventDetail.type === 'inspection'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeEventDetail.type === 'inspection' ? (
                      <ClipboardCheck className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase">
                    {activeEventDetail.type === 'inspection'
                      ? 'Recurring Inspection'
                      : 'Service Appointment'}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    activeEventDetail.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeEventDetail.status === 'overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activeEventDetail.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {activeEventDetail.title}
                </h3>
                <div className="flex items-center space-x-1.5 text-xs text-stone-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {activeEventDetail.propertyName} · <strong>{activeEventDetail.unit}</strong>
                  </span>
                </div>
              </div>

              {/* Recurrence & Compliance Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {activeEventDetail.recurrence !== 'none' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200">
                    <Repeat className="w-3 h-3 text-stone-500" />
                    <span>Cadence: {activeEventDetail.recurrence.toUpperCase()}</span>
                  </span>
                )}

                {activeEventDetail.complianceCode && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-800 text-xs font-semibold rounded-lg border border-indigo-200">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>{activeEventDetail.complianceCode}</span>
                  </span>
                )}
              </div>

              {/* Vendor & Timing Info */}
              <div className="p-3 bg-stone-50 rounded-xl space-y-2 text-xs border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Assigned Partner:</span>
                  <span className="font-bold text-stone-900">
                    {activeEventDetail.vendorOrInspector}
                  </span>
                </div>
                {activeEventDetail.vendorContact && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Contact:</span>
                    <span className="font-mono text-stone-700">
                      {activeEventDetail.vendorContact}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Date & Window:</span>
                  <span className="font-mono font-medium text-stone-900">
                    {activeEventDetail.date} ({activeEventDetail.timeWindow})
                  </span>
                </div>
                {activeEventDetail.estimatedCost !== undefined && (
                  <div className="pt-2 border-t border-stone-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-amber-700" />
                        <span>Budget / Estimate:</span>
                      </span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatAmount(activeEventDetail.estimatedCost)}
                      </span>
                    </div>

                    {/* Multi-Currency Conversion Matrix */}
                    <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-mono text-center">
                      {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((c) => (
                        <div
                          key={c}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            activeCurrency === c
                              ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          <div className="text-[9px] font-sans text-stone-400 font-semibold">{c}</div>
                          <div className="truncate font-mono">{formatAmount(activeEventDetail.estimatedCost!, c)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scope of Work Checklist */}
              {activeEventDetail.scopeOfWork.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>Scope of Work Checklist</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {activeEventDetail.scopeOfWork.length} checkpoints
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600">
                    {activeEventDetail.scopeOfWork.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {activeEventDetail.notes && (
                <div className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                  <strong>Notes:</strong> {activeEventDetail.notes}
                </div>
              )}

              {/* Linked Work Order Ticket Button (if applicable) */}
              {activeEventDetail.linkedTicketCode && onSelectTicket && (
                <button
                  onClick={() => onSelectTicket(activeEventDetail.linkedTicketCode!)}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors"
                >
                  <span>Open Linked Ticket #{activeEventDetail.linkedTicketCode} in Pipeline</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center space-x-2">
                <button
                  onClick={() => handleToggleEventStatus(activeEventDetail.id)}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    activeEventDetail.status === 'completed'
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {activeEventDetail.status === 'completed'
                      ? 'Reopen Event'
                      : 'Sign Off & Complete'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    showSecurityNotification(
                      `Automated reminder dispatched to ${activeEventDetail.vendorOrInspector} for ${activeEventDetail.date}.`
                    );
                  }}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Send Ping
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-500 space-y-2">
              <ClipboardCheck className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="font-bold text-stone-700">Select an inspection or appointment</div>
              <p>Click on any entry in the calendar or day list to view full compliance codes and scope checklists.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Inspection / Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-stone-900">
                  Schedule Service or Inspection
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Event Type selector */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Event Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('inspection')}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                      newType === 'inspection'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-400'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div>Recurring Inspection</div>
                      <div className="text-[10px] text-stone-500 font-normal">
                        Safety, fire, HVAC, roof audits
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType('appointment')}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                      newType === 'appointment'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-400'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-amber-700" />
                    <div>
                      <div>Service Appointment</div>
                      <div className="text-[10px] text-stone-500 font-normal">
                        Vendor repair & maintenance
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Event / Inspection Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Fire Alarm Audio Test, Backflow Check..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                />
              </div>

              {/* Property & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Target Property *
                  </label>
                  <select
                    value={newPropertyId}
                    onChange={(e) => setNewPropertyId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    {PROPERTIES_DATA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Specific Unit or Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 4B, Roof, Central Plant..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Date & Time Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM - 12:00 PM"
                    value={newTimeWindow}
                    onChange={(e) => setNewTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vendor or Inspector & Recurrence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Vendor / Inspector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AquaFix, Lone Star Safety..."
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Recurrence Interval
                  </label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    <option value="none">One-off (None)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              {/* Compliance code & estimated cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Compliance Standard / Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NFPA 72, TCEQ 290, Texas Code..."
                    value={newComplianceCode}
                    onChange={(e) => setNewComplianceCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Budget ({activeCurrency} · {currencies[activeCurrency].symbol})</span>
                    <span className="text-[10px] text-stone-400 font-normal">Auto-converts across 4 currencies</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-stone-500">
                      {currencies[activeCurrency].symbol}
                    </span>
                  </div>
                  {newCost && !isNaN(parseFloat(newCost)) && parseFloat(newCost) > 0 && (
                    <div className="grid grid-cols-4 gap-1 mt-1.5 p-1.5 bg-stone-100 rounded-lg text-[9px] font-mono text-center">
                      {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((c) => {
                        const valInUSD = parseFloat(newCost) / currencies[activeCurrency].rateAgainstUSD;
                        return (
                          <div key={c} className="text-stone-700">
                            <span className="text-stone-400 text-[8px] block font-sans">{c}</span>
                            <span className="font-bold">{formatAmount(valInUSD, c)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Scope of Work */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Scope of Work / Checkpoints (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Check emergency valve&#10;Verify pressure gauge&#10;Test battery backups..."
                  value={newScopeText}
                  onChange={(e) => setNewScopeText(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
