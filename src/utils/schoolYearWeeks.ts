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

  // Final pass: Trim start/end of each week if they overlap with holidays
  // This ensures weeks don't "visually" include holiday dates, even if logically they span them.
  const trimmedBlocks: GeneratedSchoolWeek[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isFirstWeek = i === 0 && block.startDate.getTime() === quarterStart.getTime();
    const trimmed = trimWeekBlock(block, holidays, isFirstWeek);
    if (trimmed) {
      trimmedBlocks.push(trimmed);
    }
  }

  // Check if we need to add a final week to cover the remaining days until quarter end
  if (trimmedBlocks.length > 0) {
    const lastWeek = trimmedBlocks[trimmedBlocks.length - 1];
    const lastWeekEnd = lastWeek.endDate;
    
    // If the last week doesn't reach the quarter end, add a final week
    if (lastWeekEnd < quarterEnd) {
      // Calculate the next Monday after the last week ends
      let nextStart = addDays(lastWeekEnd, 1);
      
      // Skip holidays
      while (nextStart <= quarterEnd && isHoliday(nextStart, holidays)) {
        nextStart = addDays(nextStart, 1);
      }
      
      // Store the initial next start before trying to move to Monday
      const initialNextStart = nextStart;
      
      // Try to ensure we start on Monday (skip Saturday/Sunday)
      let findingStart = true;
      let safetyCounter = 0;
      while (findingStart && nextStart <= quarterEnd && safetyCounter < 10) {
        safetyCounter++;
        const startDayOfWeek = nextStart.getUTCDay();
        findingStart = false;

        if (startDayOfWeek === 0) {
          // Sunday - move to Monday, but only if Monday is within quarter end
          const monday = addDays(nextStart, 1);
          if (monday <= quarterEnd) {
            nextStart = monday;
            findingStart = true;
          }
        } else if (startDayOfWeek === 6) {
          // Saturday - move to Monday, but only if Monday is within quarter end
          const monday = addDays(nextStart, 2);
          if (monday <= quarterEnd) {
            nextStart = monday;
            findingStart = true;
          }
        } else if (startDayOfWeek !== 1) {
          // Any other weekday - try to move to next Monday
          const daysUntilMonday = (8 - startDayOfWeek) % 7;
          const monday = addDays(nextStart, daysUntilMonday);
          if (monday <= quarterEnd) {
            nextStart = monday;
            findingStart = true;
          }
        }

        if (!findingStart && isHoliday(nextStart, holidays)) {
          nextStart = addDays(nextStart, 1);
          findingStart = true;
        }
      }

      // If we couldn't find a Monday start (went past quarter end), use the initial start
      if (nextStart > quarterEnd) {
        nextStart = initialNextStart;
        // Skip holidays from initial start
        while (nextStart <= quarterEnd && isHoliday(nextStart, holidays)) {
          nextStart = addDays(nextStart, 1);
        }
      }

      // If we have a valid start date and it's before or on quarter end, add the final week
      if (nextStart <= quarterEnd) {
        // The end date should be the quarter end
        let finalEnd = quarterEnd;
        
        // Trim end if it falls in a holiday
        while (finalEnd >= nextStart && isHoliday(finalEnd, holidays)) {
          finalEnd = addDays(finalEnd, -1);
        }

        // Only add the final week if it has at least one valid day
        if (nextStart <= finalEnd && !isHoliday(nextStart, holidays)) {
          trimmedBlocks.push({ startDate: nextStart, endDate: finalEnd });
        }
      }
    }
  }

  return trimmedBlocks;
}

function trimWeekBlock(week: GeneratedSchoolWeek, holidays: HolidayRange[], isFirstWeek: boolean = false): GeneratedSchoolWeek | null {
  let s = startOfDay(week.startDate);
  let e = startOfDay(week.endDate);

  // Trim start: move forward while it is a holiday
  while (s <= e && isHoliday(s, holidays)) {
    s = addDays(s, 1);
  }

  // For the first week, allow it to start on any weekday (as set by quarter start)
  // For subsequent weeks, prefer Monday but allow other weekdays if necessary
  if (!isFirstWeek) {
    // After trimming holidays, ensure start date is Monday (skip Saturday/Sunday)
    // Keep moving to next Monday until we find one that's not a holiday
    let findingStart = true;
    let safetyCounter = 0; // Prevent infinite loops
    while (findingStart && s <= e && safetyCounter < 10) {
      safetyCounter++;
      const startDayOfWeek = s.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      findingStart = false;

      // Move to Monday if not already on Monday
      if (startDayOfWeek === 0) {
        // Sunday - move to next Monday
        s = addDays(s, 1);
        findingStart = true;
      } else if (startDayOfWeek === 6) {
        // Saturday - move to next Monday (2 days forward)
        s = addDays(s, 2);
        findingStart = true;
      } else if (startDayOfWeek !== 1) {
        // Any other weekday (Tue-Fri) - move to next Monday
        const daysUntilMonday = (8 - startDayOfWeek) % 7;
        s = addDays(s, daysUntilMonday);
        findingStart = true;
      }

      // Check if the current date (should be Monday) is in a holiday
      if (!findingStart && isHoliday(s, holidays)) {
        // Monday is a holiday, move to next day and check again
        s = addDays(s, 1);
        findingStart = true;
      }
    }
  } else {
    // For first week: only skip Saturday/Sunday, allow other weekdays
    let findingStart = true;
    let safetyCounter = 0;
    while (findingStart && s <= e && safetyCounter < 10) {
      safetyCounter++;
      const startDayOfWeek = s.getUTCDay();
      findingStart = false;

      // Only skip Saturday/Sunday for first week
      if (startDayOfWeek === 0) {
        // Sunday - move to next Monday
        s = addDays(s, 1);
        findingStart = true;
      } else if (startDayOfWeek === 6) {
        // Saturday - move to next Monday (2 days forward)
        s = addDays(s, 2);
        findingStart = true;
      }

      // Check if the current date is in a holiday
      if (!findingStart && isHoliday(s, holidays)) {
        // Current day is a holiday, move to next day and check again
        s = addDays(s, 1);
        findingStart = true;
      }
    }
  }

  if (s > e) {
    return null;
  }

  // Calculate end date: should be Sunday of the week containing the start date
  const startDayOfWeek = s.getUTCDay();
  let calculatedEnd: Date;
  
  if (startDayOfWeek === 0) {
    // Sunday - already at end of week
    calculatedEnd = s;
  } else {
    // Any weekday - find the Sunday of that week
    // Monday(1) + 6 = Sunday, Tuesday(2) + 5 = Sunday, etc.
    const daysToSunday = 7 - startDayOfWeek;
    calculatedEnd = addDays(s, daysToSunday);
  }
  
  // Don't exceed the original week's end boundary
  e = minDate(calculatedEnd, e);

  // Trim end: move backward while it is a holiday
  while (e >= s && isHoliday(e, holidays)) {
    e = addDays(e, -1);
  }

  if (s > e) {
    return null;
  }
  return { startDate: s, endDate: e };
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
