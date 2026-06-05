import { describe, it, expect } from 'vitest';
import {
  isValidTimeZone,
  calDayInTz,
  dueDay,
  compareDays,
  isFutureDay,
  dayOfWeek,
  addDays,
  addMonths,
  stampLocalNoon,
} from './tz.js';

const CHICAGO = 'America/Chicago';
const TOKYO = 'Asia/Tokyo';

// The wall-clock hour an instant renders to in a given zone (robust DST check).
function localHour(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour')!.value);
  return h === 24 ? 0 : h;
}

describe('isValidTimeZone', () => {
  it('accepts real IANA zones and rejects junk', () => {
    expect(isValidTimeZone('America/Chicago')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('calDayInTz / dueDay', () => {
  it('resolves the local calendar day, not the UTC day (west of UTC)', () => {
    // 02:00 UTC on Jun 15 is still Jun 14, 21:00 in Chicago (CDT, UTC-5).
    const d = new Date('2026-06-15T02:00:00Z');
    expect(calDayInTz(d, CHICAGO)).toEqual({ y: 2026, m: 6, d: 14 });
    expect(calDayInTz(d, 'UTC')).toEqual({ y: 2026, m: 6, d: 15 });
  });

  it('resolves the local calendar day east of UTC', () => {
    // 23:00 UTC on Jun 14 is already Jun 15, 08:00 in Tokyo (UTC+9).
    const d = new Date('2026-06-14T23:00:00Z');
    expect(dueDay(d, TOKYO)).toEqual({ y: 2026, m: 6, d: 15 });
  });
});

describe('compareDays', () => {
  it('orders by year, then month, then day', () => {
    expect(compareDays({ y: 2026, m: 6, d: 10 }, { y: 2026, m: 6, d: 10 })).toBe(0);
    expect(compareDays({ y: 2026, m: 6, d: 9 }, { y: 2026, m: 6, d: 10 })).toBeLessThan(0);
    expect(compareDays({ y: 2026, m: 7, d: 1 }, { y: 2026, m: 6, d: 30 })).toBeGreaterThan(0);
    expect(compareDays({ y: 2027, m: 1, d: 1 }, { y: 2026, m: 12, d: 31 })).toBeGreaterThan(0);
  });
});

describe('isFutureDay', () => {
  it('is true for a far-future date and false for a far-past date', () => {
    expect(isFutureDay('2999-01-01T12:00:00Z', 'UTC')).toBe(true);
    expect(isFutureDay('2000-01-01T12:00:00Z', 'UTC')).toBe(false);
  });
});

describe('dayOfWeek', () => {
  it('returns 0=Sunday .. 6=Saturday for known dates', () => {
    // 2026-03-08 is a Sunday (US spring-forward day); 2026-06-10 is a Wednesday.
    expect(dayOfWeek({ y: 2026, m: 3, d: 8 })).toBe(0);
    expect(dayOfWeek({ y: 2026, m: 6, d: 10 })).toBe(3);
  });
});

describe('addDays / addMonths', () => {
  it('adds days across a month boundary', () => {
    expect(addDays({ y: 2026, m: 6, d: 28 }, 5)).toEqual({ y: 2026, m: 7, d: 3 });
    expect(addDays({ y: 2026, m: 1, d: 1 }, -1)).toEqual({ y: 2025, m: 12, d: 31 });
  });

  it('adds a clean month', () => {
    expect(addMonths({ y: 2026, m: 6, d: 15 }, 1)).toEqual({ y: 2026, m: 7, d: 15 });
  });

  it('overflows day-31 monthly into the following month (documented JS quirk)', () => {
    // Feb has 28 days in 2026, so Jan 31 + 1 month overflows to Mar 3.
    expect(addMonths({ y: 2026, m: 1, d: 31 }, 1)).toEqual({ y: 2026, m: 3, d: 3 });
  });
});

describe('stampLocalNoon', () => {
  it('round-trips to the same calendar day at local noon (standard time)', () => {
    const day = { y: 2026, m: 1, d: 15 }; // Chicago in CST (UTC-6)
    const stamped = stampLocalNoon(day, CHICAGO);
    expect(calDayInTz(stamped, CHICAGO)).toEqual(day);
    expect(localHour(stamped, CHICAGO)).toBe(12);
  });

  it('round-trips on the DST spring-forward day', () => {
    const day = { y: 2026, m: 3, d: 8 }; // transition day; noon is already CDT
    const stamped = stampLocalNoon(day, CHICAGO);
    expect(calDayInTz(stamped, CHICAGO)).toEqual(day);
    expect(localHour(stamped, CHICAGO)).toBe(12);
  });

  it('round-trips east of UTC', () => {
    const day = { y: 2026, m: 6, d: 15 };
    const stamped = stampLocalNoon(day, TOKYO);
    expect(calDayInTz(stamped, TOKYO)).toEqual(day);
    expect(localHour(stamped, TOKYO)).toBe(12);
  });
});
