import { describe, it, expect } from 'vitest';
import { parseWeeklyDays, nextOccurrenceKey, firstOccurrenceKey } from './recurrence.js';
import { dayOfWeekOf } from './tz.js';

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

describe('nextOccurrenceKey', () => {
  it('DAILY advances by one calendar day', () => {
    expect(nextOccurrenceKey('2026-06-10', 'DAILY', null)).toBe('2026-06-11');
  });

  it('WEEKLY with no selected days advances by seven days', () => {
    expect(nextOccurrenceKey('2026-06-10', 'WEEKLY', null)).toBe('2026-06-17');
  });

  it('WEEKLY with selected days lands on the next selected weekday', () => {
    // 2026-06-10 is a Wednesday (3). With Mon(1)+Fri(5) selected, the next is Fri 6/12.
    const next = nextOccurrenceKey('2026-06-10', 'WEEKLY', '1,5');
    expect(next).toBe('2026-06-12');
    expect(dayOfWeekOf(next)).toBe(5);
  });

  it('WEEKLY with selected days wraps to the earliest day in the next week', () => {
    // Friday 6/12 with Mon(1)+Fri(5) selected -> Monday 6/15.
    expect(nextOccurrenceKey('2026-06-12', 'WEEKLY', '1,5')).toBe('2026-06-15');
  });

  it('MONTHLY advances by one month', () => {
    expect(nextOccurrenceKey('2026-06-15', 'MONTHLY', null)).toBe('2026-07-15');
  });
});

describe('firstOccurrenceKey', () => {
  // Reference weekdays in 2026: 6/8 Mon, 6/9 Tue, 6/10 Wed, 6/12 Fri, 6/13 Sat, 6/15 Mon.

  it('DAILY/MONTHLY/WEEKLY-no-days start on the given day', () => {
    expect(firstOccurrenceKey('2026-06-09', 'DAILY', null)).toBe('2026-06-09');
    expect(firstOccurrenceKey('2026-06-09', 'MONTHLY', null)).toBe('2026-06-09');
    expect(firstOccurrenceKey('2026-06-09', 'WEEKLY', null)).toBe('2026-06-09');
  });

  it('WEEKLY snaps forward to the next selected weekday', () => {
    // Tuesday 6/9 with M/W/F selected -> Wednesday 6/10.
    const first = firstOccurrenceKey('2026-06-09', 'WEEKLY', '1,3,5');
    expect(first).toBe('2026-06-10');
    expect(dayOfWeekOf(first)).toBe(3);
  });

  it('WEEKLY keeps a start day that is already selected', () => {
    expect(firstOccurrenceKey('2026-06-10', 'WEEKLY', '1,3,5')).toBe('2026-06-10');
  });

  it('WEEKLY wraps across the weekend to the next selected weekday', () => {
    // Saturday 6/13 with M/W/F selected -> Monday 6/15.
    expect(firstOccurrenceKey('2026-06-13', 'WEEKLY', '1,3,5')).toBe('2026-06-15');
  });
});
