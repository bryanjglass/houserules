// Timezone-aware calendar-day helpers, built on Intl.DateTimeFormat (DST-correct).
//
// The domain is day-granular: every due date and occurrence is a household-local
// calendar day, represented everywhere as a DayKey string "YYYY-MM-DD". Day keys
// compare lexicographically (zero-padded), so occurrence identity is exact string
// equality and ordering is plain string comparison. The household timezone (an
// IANA name like "America/Chicago", stored on the parent User) matters at exactly
// one boundary: resolving which day "now" (or any instant) falls on. All other
// day arithmetic is timezone-free.

export type DayKey = string;

export const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

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

interface DayParts {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

function toKey(p: DayParts): DayKey {
  const mm = String(p.m).padStart(2, '0');
  const dd = String(p.d).padStart(2, '0');
  return `${p.y}-${mm}-${dd}`;
}

function fromKey(key: DayKey): DayParts {
  return { y: Number(key.slice(0, 4)), m: Number(key.slice(5, 7)), d: Number(key.slice(8, 10)) };
}

// The calendar day (in the given zone) on which an instant falls.
// en-CA's date format is exactly "YYYY-MM-DD".
export function dayKeyOf(date: Date, tz: string): DayKey {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function todayKey(tz: string): DayKey {
  return dayKeyOf(new Date(), tz);
}

// Interpret a user-supplied day value as a literal calendar day key. Only the
// "YYYY-MM-DD" form is accepted (a Date/ISO timestamp has no unambiguous
// household day without a zone, and clients send <input type="date"> values).
// Empty/invalid values return null.
export function parseDayKeyInput(input: string | null | undefined): DayKey | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (!DAY_KEY_RE.test(trimmed)) return null;
  const { m, d } = fromKey(trimmed);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return trimmed;
}

// Negative if a is before b, 0 if same day, positive if a is after b.
// Zero-padded keys make this plain string comparison.
export function compareDayKeys(a: DayKey, b: DayKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Day-of-week (0=Sun..6=Sat) for a day key — unambiguous from y/m/d alone.
export function dayOfWeekOf(key: DayKey): number {
  const { y, m, d } = fromKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysToKey(key: DayKey, n: number): DayKey {
  const { y, m, d } = fromKey(key);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return toKey({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}

export function addMonthsToKey(key: DayKey, n: number): DayKey {
  const { y, m, d } = fromKey(key);
  const dt = new Date(Date.UTC(y, m - 1 + n, d));
  return toKey({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}
