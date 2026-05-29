// Timezone-aware calendar-day helpers, built on Intl.DateTimeFormat (DST-correct).
//
// The household timezone (an IANA name like "America/Chicago", stored on the
// parent User) is the source of truth for every calendar-day decision: which day
// "today" is, which day an occurrence is due, and whether an occurrence is in the
// future. We reason in CALENDAR DAYS, never raw timestamps, and stamp generated
// occurrences at local noon so a day can't slip across a boundary under DST or
// offset when rendered back in the zone.

export interface CalDay {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

const DEFAULT_TZ = 'UTC';

export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Normalize an unknown/invalid zone to the defined default so callers never throw.
function safeTz(tz: string | null | undefined): string {
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TZ;
}

// The calendar day (in the given zone) on which an instant falls.
export function calDayInTz(date: Date, tz: string): CalDay {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find(p => p.type === t)!.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

export function familyToday(tz: string): CalDay {
  return calDayInTz(new Date(), tz);
}

export function dueDay(date: Date | string, tz: string): CalDay {
  return calDayInTz(new Date(date), tz);
}

// Negative if a is before b, 0 if same day, positive if a is after b.
export function compareDays(a: CalDay, b: CalDay): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

// Is the occurrence's due day strictly after the household's current day?
export function isFutureDay(date: Date | string, tz: string): boolean {
  return compareDays(dueDay(date, tz), familyToday(tz)) > 0;
}

// Day-of-week (0=Sun..6=Sat) for a calendar day — unambiguous from y/m/d alone.
export function dayOfWeek(day: CalDay): number {
  return new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay();
}

export function addDays(day: CalDay, n: number): CalDay {
  const dt = new Date(Date.UTC(day.y, day.m - 1, day.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function addMonths(day: CalDay, n: number): CalDay {
  const dt = new Date(Date.UTC(day.y, day.m - 1 + n, day.d));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

// The zone's UTC offset (local - UTC, in ms) at a given instant.
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz(tz),
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = Number(p.value);
  let hour = map.hour;
  if (hour === 24) hour = 0; // some environments emit "24" for midnight
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return asUTC - date.getTime();
}

// A UTC instant that renders as ~noon on the given calendar day in the zone.
// Noon is the safe anchor: no DST shift (which happens near 2-3am) or offset can
// push a noon-in-zone instant onto an adjacent calendar day.
export function stampLocalNoon(day: CalDay, tz: string): Date {
  const utcNoon = Date.UTC(day.y, day.m - 1, day.d, 12, 0, 0);
  const offset = tzOffsetMs(new Date(utcNoon), tz);
  return new Date(utcNoon - offset);
}
