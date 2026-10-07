import React from 'react';
import {
  Calendar,
  CalendarRange,
  RotateCcw,
  Check,
  Clock,
  X,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  DateRangePreset,
  TemporalWindow,
  SYSTEM_TODAY,
  getPresetDateRange,
  formatHumanDate,
} from '../utils/dateFilterUtils';

interface SecurityDateRangePickerProps {
  value: TemporalWindow;
  onChange: (newWindow: TemporalWindow) => void;
  totalEventsCount?: number;
  filteredEventsCount?: number;
  compact?: boolean;
  className?: string;
}

export const SecurityDateRangePicker: React.FC<SecurityDateRangePickerProps> = ({
  value,
  onChange,
  totalEventsCount,
  filteredEventsCount,
  compact = false,
  className = '',
}) => {
  const presets: { id: DateRangePreset; label: string; shortLabel: string }[] = [
    { id: 'all', label: 'All Time', shortLabel: 'All' },
    { id: 'today', label: 'Today (Sep 23)', shortLabel: 'Today' },
    { id: 'yesterday', label: 'Yesterday', shortLabel: 'Yest.' },
    { id: 'last7', label: 'Last 7 Days', shortLabel: '7D' },
    { id: 'last30', label: 'Last 30 Days', shortLabel: '30D' },
    { id: 'thisMonth', label: 'This Month (Sep)', shortLabel: 'This Mo.' },
    { id: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
  ];

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({
        preset: 'custom',
        startDate: value.startDate || '2026-09-01',
        endDate: value.endDate || SYSTEM_TODAY,
        label: 'Custom Range',
      });
      return;
    }

    const { startDate, endDate, label } = getPresetDateRange(preset, SYSTEM_TODAY);
    onChange({
      preset,
      startDate,
      endDate,
      label,
    });
  };

  const handleStartDateChange = (newStart: string) => {
    const end = value.endDate && value.endDate < newStart ? newStart : value.endDate;
    onChange({
      preset: 'custom',
      startDate: newStart,
      endDate: end,
      label: 'Custom Range',
    });
  };

  const handleEndDateChange = (newEnd: string) => {
    const start = value.startDate && value.startDate > newEnd ? newEnd : value.startDate;
    onChange({
      preset: 'custom',
      startDate: start,
      endDate: newEnd,
      label: 'Custom Range',
    });
  };

  const handleClear = () => {
    const { startDate, endDate, label } = getPresetDateRange('all', SYSTEM_TODAY);
    onChange({
      preset: 'all',
      startDate,
      endDate,
      label,
    });
  };

  const isFiltered = value.preset !== 'all' || Boolean(value.startDate) || Boolean(value.endDate);

  return (
    <div
      className={`bg-white border border-stone-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3 ${className}`}
    >
      {/* Top Bar: Title, Active Range Summary & Clear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
            <CalendarRange className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-900 tracking-tight">
                Temporal Window Filter
              </span>
              {isFiltered ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  <span>FILTER ACTIVE</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-stone-400 bg-stone-100">
                  ALL EVENTS
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              Filter audit ledger state mutations & API security telemetry by event timestamp
            </p>
          </div>
        </div>

        {/* Counts badge & Clear button */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {totalEventsCount !== undefined && filteredEventsCount !== undefined && (
            <div
              className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 ${
                isFiltered
                  ? filteredEventsCount === 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <Filter className="w-3 h-3 text-stone-500" />
              <span>
                {filteredEventsCount} / {totalEventsCount} Events
              </span>
            </div>
          )}

          {isFiltered && (
            <button
              onClick={handleClear}
              type="button"
              className="inline-flex items-center space-x-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
              title="Reset temporal filter to view all events"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {presets.map((p) => {
          const isActive = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                isActive
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
              }`}
            >
              {isActive && <Check className="w-3 h-3 text-amber-200" />}
              <span>{compact ? p.shortLabel : p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range Inputs: Start Date -> End Date */}
      <div className="pt-2 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Date */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              From:
            </span>
            <div className="relative">
              <input
                type="date"
                value={value.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />

          {/* End Date */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              To:
            </span>
            <div className="relative">
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Active Range Human-Readable Tag */}
        <div className="text-[11px] font-mono text-stone-500 flex items-center space-x-1.5 truncate">
          <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <span className="truncate">
            {value.startDate || value.endDate ? (
              <>
                <strong className="text-stone-800 font-semibold">
                  {value.startDate ? formatHumanDate(value.startDate) : 'Beginning of log'}
                </strong>{' '}
                to{' '}
                <strong className="text-stone-800 font-semibold">
                  {value.endDate ? formatHumanDate(value.endDate) : 'Latest event'}
                </strong>
              </>
            ) : (
              <span>Showing all historic events (Full log retention)</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
