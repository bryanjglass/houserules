// Pure recurrence-scheduling helpers, dependency-free (only day-key math).
// Kept out of routes/chores.ts so they can be unit-tested without loading
// Express or Prisma. Occurrence projection (which keys are visible/actionable)
// builds on these in lib/projection.ts.
import { addDaysToKey, addMonthsToKey, dayOfWeekOf, type DayKey } from './tz.js';

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

// The scheduled occurrence strictly after `currentKey`. Weekly with selected
// days advances to the soonest selected weekday; weekly without days advances
// seven days; monthly advances one month (JS end-of-month overflow applies).
export function nextOccurrenceKey(
  currentKey: DayKey,
  recurrence: string | null,
  weeklyDays: string | null | undefined
): DayKey {
  switch (recurrence) {
    case 'DAILY':
      return addDaysToKey(currentKey, 1);
    case 'WEEKLY': {
      const days = parseWeeklyDays(weeklyDays);
      if (days.length === 0) return addDaysToKey(currentKey, 7);
      const daySet = new Set(days);
      let cur = currentKey;
      for (let i = 1; i <= 7; i++) {
        cur = addDaysToKey(cur, 1);
        if (daySet.has(dayOfWeekOf(cur))) break;
      }
      return cur;
    }
    case 'MONTHLY':
      return addMonthsToKey(currentKey, 1);
    default:
      return currentKey;
  }
}

// The first scheduled occurrence ON OR AFTER `startKey`. DAILY / MONTHLY /
// WEEKLY-with-no-selected-days start on `startKey` itself; WEEKLY-with-days
// snaps forward to the first selected weekday on or after it. Used to anchor a
// recurring chore's startDay to a concrete first occurrence.
export function firstOccurrenceKey(
  startKey: DayKey,
  recurrence: string | null,
  weeklyDays: string | null | undefined
): DayKey {
  if (recurrence !== 'WEEKLY') return startKey;
  const days = parseWeeklyDays(weeklyDays);
  if (days.length === 0) return startKey;
  const daySet = new Set(days);
  let day = startKey;
  // `startKey` is included; walk forward at most 6 days to the next selected one.
  for (let i = 0; i < 7; i++) {
    if (daySet.has(dayOfWeekOf(day))) break;
    day = addDaysToKey(day, 1);
  }
  return day;
}
