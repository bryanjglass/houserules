// Pure recurrence-scheduling helpers, dependency-free (only timezone day math).
// Kept out of routes/tasks.ts so they can be unit-tested without loading Express
// or Prisma. The DB-touching generators (backfill/live-tip/projection) stay in
// the route module and call into these.
import {
  familyToday,
  dueDay,
  addDays,
  addMonths,
  dayOfWeek,
  stampLocalNoon,
  type CalDay,
} from './tz.js';

// Parse a stored comma-separated weekly-days string into a deduped, sorted list
// of valid day numbers (0=Sun..6=Sat). Junk and out-of-range entries are dropped.
export function parseWeeklyDays(weeklyDays: string | null | undefined): number[] {
  if (!weeklyDays) return [];
  return [...new Set(
    String(weeklyDays)
      .split(',')
      .map(d => parseInt(d, 10))
      .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
  )].sort((a, b) => a - b);
}

// The next scheduled occurrence after `currentDue`, computed in CALENDAR DAYS in
// the household timezone and stamped at local noon so it can't slip across a day
// boundary under DST/offset. Reuses the same weekly/selected-day + monthly rules.
export function nextDueDate(
  currentDue: Date | string | null,
  recurrence: string | null,
  weeklyDays: string | null | undefined,
  tz: string
): Date {
  const baseDay = currentDue ? dueDay(currentDue, tz) : familyToday(tz);
  let next: CalDay;
  switch (recurrence) {
    case 'DAILY':
      next = addDays(baseDay, 1);
      break;
    case 'WEEKLY': {
      const days = parseWeeklyDays(weeklyDays);
      if (days.length === 0) {
        next = addDays(baseDay, 7);
        break;
      }
      const daySet = new Set(days);
      let cur = baseDay;
      for (let i = 1; i <= 7; i++) {
        cur = addDays(cur, 1);
        if (daySet.has(dayOfWeek(cur))) break;
      }
      next = cur;
      break;
    }
    case 'MONTHLY':
      next = addMonths(baseDay, 1);
      break;
    default:
      next = baseDay;
  }
  return stampLocalNoon(next, tz);
}

// The first scheduled occurrence ON OR AFTER `start` (a calendar day), stamped at
// household-local noon. DAILY / MONTHLY / WEEKLY-with-no-selected-days start on
// `start` itself; WEEKLY-with-days snaps forward to the first selected weekday on
// or after `start`. Complements nextDueDate, which finds the day strictly after a
// current one. Used to anchor a recurring task to a concrete first instance.
export function firstOccurrence(
  start: CalDay,
  recurrence: string | null,
  weeklyDays: string | null | undefined,
  tz: string
): Date {
  let day = start;
  if (recurrence === 'WEEKLY') {
    const days = parseWeeklyDays(weeklyDays);
    if (days.length > 0) {
      const daySet = new Set(days);
      // `start` is included; walk forward at most 6 days to the next selected one.
      for (let i = 0; i < 7; i++) {
        if (daySet.has(dayOfWeek(day))) break;
        day = addDays(day, 1);
      }
    }
  }
  return stampLocalNoon(day, tz);
}
