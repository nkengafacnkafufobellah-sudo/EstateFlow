/**
 * Utility functions for temporal window parsing and filtering of security events.
 * Base reference date is 2026-09-23 (current local simulation time).
 */

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'custom';

export interface TemporalWindow {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

// Current system simulation anchor date: September 23, 2026
export const SYSTEM_TODAY = '2026-09-23';

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD to human readable string e.g. "Sep 23, 2026"
 */
export function formatHumanDate(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate preset start and end dates based on anchor date
 */
export function getPresetDateRange(
  preset: DateRangePreset,
  anchorDateStr: string = SYSTEM_TODAY
): TemporalWindow {
  const parts = anchorDateStr.split('-');
  const anchor = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  switch (preset) {
    case 'today':
      return {
        preset: 'today',
        startDate: anchorDateStr,
        endDate: anchorDateStr,
        label: 'Today (Sep 23)',
      };
    case 'yesterday': {
      const y = new Date(anchor);
      y.setDate(anchor.getDate() - 1);
      const yStr = formatDateYmd(y);
      return {
        preset: 'yesterday',
        startDate: yStr,
        endDate: yStr,
        label: 'Yesterday (Sep 22)',
      };
    }
    case 'last7': {
      const s = new Date(anchor);
      s.setDate(anchor.getDate() - 6);
      return {
        preset: 'last7',
        startDate: formatDateYmd(s),
        endDate: anchorDateStr,
        label: 'Last 7 Days',
      };
    }
    case 'last30': {
      const s = new Date(anchor);
      s.setDate(anchor.getDate() - 29);
      return {
        preset: 'last30',
        startDate: formatDateYmd(s),
        endDate: anchorDateStr,
        label: 'Last 30 Days',
      };
    }
    case 'thisMonth': {
      const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return {
        preset: 'thisMonth',
        startDate: formatDateYmd(firstDay),
        endDate: formatDateYmd(lastDay),
        label: 'This Month (Sep 2026)',
      };
    }
    case 'custom':
      return {
        preset: 'custom',
        startDate: anchorDateStr,
        endDate: anchorDateStr,
        label: 'Custom Range',
      };
    case 'all':
    default:
      return {
        preset: 'all',
        startDate: '',
        endDate: '',
        label: 'All Time (No Filter)',
      };
  }
}

/**
 * Parse any security log timestamp into a Date object.
 * Handles formats:
 * - "2026-09-23 09:14:22 UTC"
 * - "2026-09-21 14:22:10 UTC"
 * - "2026-09-20"
 * - "09:14:22 UTC" (defaults to SYSTEM_TODAY)
 * - "09:41:07" (defaults to SYSTEM_TODAY)
 */
export function parseSecurityTimestamp(timestamp: string): Date {
  if (!timestamp) return new Date(SYSTEM_TODAY);

  // Check if string starts with YYYY-MM-DD
  const ymdMatch = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]) - 1;
    const day = Number(ymdMatch[3]);

    const timeMatch = timestamp.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      return new Date(Date.UTC(year, month, day, Number(timeMatch[1]), Number(timeMatch[2]), Number(timeMatch[3])));
    }
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }

  // If it's a bare time like "09:14:22 UTC" or "09:41:07", anchor to SYSTEM_TODAY
  const timeOnlyMatch = timestamp.match(/^(\d{2}):(\d{2}):(\d{2})/);
  if (timeOnlyMatch) {
    const parts = SYSTEM_TODAY.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(
      Date.UTC(year, month, day, Number(timeOnlyMatch[1]), Number(timeOnlyMatch[2]), Number(timeOnlyMatch[3]))
    );
  }

  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? new Date(SYSTEM_TODAY) : parsed;
}

/**
 * Evaluates whether an event timestamp falls inside the given temporal window.
 */
export function isTimestampInWindow(
  timestamp: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;

  const eventDate = parseSecurityTimestamp(timestamp);
  const eventTime = eventDate.getTime();

  if (startDate) {
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const startBoundary = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0)).getTime();
    if (eventTime < startBoundary) return false;
  }

  if (endDate) {
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const endBoundary = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999)).getTime();
    if (eventTime > endBoundary) return false;
  }

  return true;
}
