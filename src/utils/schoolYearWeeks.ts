export interface HolidayRange {
  startDate: Date;
  endDate: Date;
}

export interface GeneratedSchoolWeek {
  startDate: Date;
  endDate: Date;
}

/**
 * Generate logical school weeks for a quarter.
 *
 * - Uses natural calendar weeks (Mon-Sun) as base blocks.
 * - Removes full vacation weeks (weeks where every day is a holiday).
 * - If there are more candidate weeks than weeksCount, merges from the end
 *   so that later weeks become longer (as per business rule).
 *
 * All date calculations are done in a timezone-agnostic way using UTC
 * fields (getUTC* / setUTC*) so that ISO date strings like "2025-09-01"
 * are interpreted as the same calendar day regardless of server timezone.
 */
export function generateSchoolWeeksForQuarter(params: {
  startDate: Date;
  endDate: Date;
  weeksCount: number;
  holidays?: HolidayRange[];
}): GeneratedSchoolWeek[] {
  const { startDate, endDate, weeksCount } = params;
  const holidays = (params.holidays ?? []).map((h) => ({
    startDate: startOfDay(h.startDate),
    endDate: startOfDay(h.endDate),
  }));

  if (weeksCount <= 0) {
    return [{ startDate, endDate }];
  }

  const quarterStart = startOfDay(startDate);
  const quarterEnd = startOfDay(endDate);

  if (quarterStart > quarterEnd) {
    return [];
  }

  const firstMonday = getWeekStart(quarterStart);
  const lastSunday = getWeekEnd(quarterEnd);

  const candidateWeeks: GeneratedSchoolWeek[] = [];

  for (let d = firstMonday; d <= lastSunday; d = addDays(d, 7)) {
    const naturalStart = d;
    const naturalEnd = addDays(d, 6);
    const blockStart = maxDate(naturalStart, quarterStart);
    const blockEnd = minDate(naturalEnd, quarterEnd);
    if (blockStart > blockEnd) continue;

    const hasSchool = hasAnyNonHoliday(blockStart, blockEnd, holidays);
    if (!hasSchool) {
      // Full vacation week, skip it completely
      continue;
    }

    candidateWeeks.push({ startDate: blockStart, endDate: blockEnd });
  }

  if (candidateWeeks.length === 0) {
    // Fallback: single week covering the whole quarter
    return [{ startDate: quarterStart, endDate: quarterEnd }];
  }

  if (candidateWeeks.length <= weeksCount) {
    return candidateWeeks;
  }

  // Merge from the end until we reach the desired weeksCount
  const blocks = [...candidateWeeks];
  while (blocks.length > weeksCount) {
    const i = blocks.length - 2;
    const merged = {
      startDate: blocks[i].startDate,
      endDate: blocks[i + 1].endDate,
    };
    blocks[i] = merged;
    blocks.pop();
  }

  return blocks;
}

// Normalize to the calendar day using UTC fields to avoid timezone offsets
// shifting the date backward/forward when parsing ISO strings.
function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Monday as the first day of the week (using UTC day-of-week)
function getWeekStart(date: Date): Date {
  const day = date.getUTCDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day; // move back to Monday
  return startOfDay(addDays(date, diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  return addDays(start, 6);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

function isHoliday(date: Date, holidays: HolidayRange[]): boolean {
  for (const h of holidays) {
    if (date >= h.startDate && date <= h.endDate) {
      return true;
    }
  }
  return false;
}

function hasAnyNonHoliday(start: Date, end: Date, holidays: HolidayRange[]): boolean {
  for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) {
    if (!isHoliday(d, holidays)) {
      return true;
    }
  }
  return false;
}
