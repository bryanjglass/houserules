import { describe, it, expect } from 'vitest';
import { parseWeeklyDays, nextDueDate } from './recurrence.js';
import { calDayInTz, dayOfWeek } from './tz.js';

describe('parseWeeklyDays', () => {
  it('parses, dedupes, and sorts valid day numbers', () => {
    expect(parseWeeklyDays('1,3,5')).toEqual([1, 3, 5]);
    expect(parseWeeklyDays('5,3,1,3')).toEqual([1, 3, 5]);
  });

  it('drops out-of-range and non-numeric entries', () => {
    expect(parseWeeklyDays('7,8,-1,2,foo')).toEqual([2]);
  });

  it('treats null/undefined/empty as no selected days', () => {
    expect(parseWeeklyDays(null)).toEqual([]);
    expect(parseWeeklyDays(undefined)).toEqual([]);
    expect(parseWeeklyDays('')).toEqual([]);
  });
});

describe('nextDueDate', () => {
  const UTC = 'UTC';

  it('DAILY advances by one calendar day at local noon', () => {
    const next = nextDueDate('2026-06-10T12:00:00Z', 'DAILY', null, UTC);
    expect(calDayInTz(next, UTC)).toEqual({ y: 2026, m: 6, d: 11 });
  });

  it('WEEKLY with no selected days advances by seven days', () => {
    const next = nextDueDate('2026-06-10T12:00:00Z', 'WEEKLY', null, UTC);
    expect(calDayInTz(next, UTC)).toEqual({ y: 2026, m: 6, d: 17 });
  });

  it('WEEKLY with selected days lands on the next selected weekday', () => {
    // 2026-06-10 is a Wednesday (3). With Mon(1)+Fri(5) selected, the next is Fri 6/12.
    const next = nextDueDate('2026-06-10T12:00:00Z', 'WEEKLY', '1,5', UTC);
    expect(calDayInTz(next, UTC)).toEqual({ y: 2026, m: 6, d: 12 });
    expect(dayOfWeek(calDayInTz(next, UTC))).toBe(5);
  });

  it('MONTHLY advances by one month', () => {
    const next = nextDueDate('2026-06-15T12:00:00Z', 'MONTHLY', null, UTC);
    expect(calDayInTz(next, UTC)).toEqual({ y: 2026, m: 7, d: 15 });
  });

  it('steps in the household timezone, not UTC', () => {
    // 2026-06-11T02:00Z is still Jun 10 in Chicago; DAILY next is Jun 11 local.
    const next = nextDueDate('2026-06-11T02:00:00Z', 'DAILY', null, 'America/Chicago');
    expect(calDayInTz(next, 'America/Chicago')).toEqual({ y: 2026, m: 6, d: 11 });
  });
});
