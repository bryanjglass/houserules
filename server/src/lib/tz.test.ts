import { describe, it, expect } from 'vitest';
import {
  isValidTimeZone,
  dayKeyOf,
  todayKey,
  parseDayKeyInput,
  compareDayKeys,
  dayOfWeekOf,
  addDaysToKey,
  addMonthsToKey,
  DAY_KEY_RE,
} from './tz.js';

const CHICAGO = 'America/Chicago';
const TOKYO = 'Asia/Tokyo';

describe('isValidTimeZone', () => {
  it('accepts real IANA zones and rejects junk', () => {
    expect(isValidTimeZone('America/Chicago')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('dayKeyOf', () => {
  it('resolves the local calendar day, not the UTC day (west of UTC)', () => {
    // 02:00 UTC on Jun 15 is still Jun 14, 21:00 in Chicago (CDT, UTC-5).
    const d = new Date('2026-06-15T02:00:00Z');
    expect(dayKeyOf(d, CHICAGO)).toBe('2026-06-14');
    expect(dayKeyOf(d, 'UTC')).toBe('2026-06-15');
  });

  it('resolves the local calendar day east of UTC', () => {
    // 23:00 UTC on Jun 14 is already Jun 15, 08:00 in Tokyo (UTC+9).
    expect(dayKeyOf(new Date('2026-06-14T23:00:00Z'), TOKYO)).toBe('2026-06-15');
  });

  it('always emits the zero-padded canonical form', () => {
    expect(dayKeyOf(new Date('2026-01-05T12:00:00Z'), 'UTC')).toBe('2026-01-05');
    expect(DAY_KEY_RE.test(todayKey(CHICAGO))).toBe(true);
  });
});

describe('parseDayKeyInput', () => {
  it('accepts a literal day key', () => {
    expect(parseDayKeyInput('2026-06-06')).toBe('2026-06-06');
    expect(parseDayKeyInput('  2026-06-06 ')).toBe('2026-06-06');
  });

  it('rejects empty, junk, timestamps, and out-of-range components', () => {
    expect(parseDayKeyInput('')).toBeNull();
    expect(parseDayKeyInput(null)).toBeNull();
    expect(parseDayKeyInput(undefined)).toBeNull();
    expect(parseDayKeyInput('not-a-date')).toBeNull();
    expect(parseDayKeyInput('2026-06-15T02:00:00Z')).toBeNull();
    expect(parseDayKeyInput('2026-13-01')).toBeNull();
    expect(parseDayKeyInput('2026-00-10')).toBeNull();
    expect(parseDayKeyInput('2026-06-32')).toBeNull();
  });
});

describe('compareDayKeys', () => {
  it('orders by year, then month, then day', () => {
    expect(compareDayKeys('2026-06-10', '2026-06-10')).toBe(0);
    expect(compareDayKeys('2026-06-09', '2026-06-10')).toBeLessThan(0);
    expect(compareDayKeys('2026-07-01', '2026-06-30')).toBeGreaterThan(0);
    expect(compareDayKeys('2027-01-01', '2026-12-31')).toBeGreaterThan(0);
  });
});

describe('dayOfWeekOf', () => {
  it('returns 0=Sunday .. 6=Saturday for known dates', () => {
    // 2026-03-08 is a Sunday; 2026-06-10 is a Wednesday.
    expect(dayOfWeekOf('2026-03-08')).toBe(0);
    expect(dayOfWeekOf('2026-06-10')).toBe(3);
  });
});

describe('addDaysToKey / addMonthsToKey', () => {
  it('adds days across a month boundary', () => {
    expect(addDaysToKey('2026-06-28', 5)).toBe('2026-07-03');
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('adds a clean month', () => {
    expect(addMonthsToKey('2026-06-15', 1)).toBe('2026-07-15');
  });

  it('overflows day-31 monthly into the following month (documented JS quirk)', () => {
    // Feb has 28 days in 2026, so Jan 31 + 1 month overflows to Mar 3.
    expect(addMonthsToKey('2026-01-31', 1)).toBe('2026-03-03');
  });
});
