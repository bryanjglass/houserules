import { describe, it, expect } from 'vitest';
import {
  ONCE_KEY,
  occurrenceKeysInWindow,
  firstUnresolvedKey,
  assignedOccurrences,
  type ChoreSchedule,
} from './projection.js';

// Reference weekdays in 2026: 6/8 Mon, 6/9 Tue, 6/10 Wed, 6/11 Thu, 6/12 Fri.
const TODAY = '2026-06-10';

function chore(over: Partial<ChoreSchedule> = {}): ChoreSchedule {
  return { recurrence: null, weeklyDays: null, startDay: null, missedPolicy: 'CURRENT_ONLY', ...over };
}

describe('occurrenceKeysInWindow', () => {
  it('walks a daily schedule across the window', () => {
    const c = chore({ recurrence: 'DAILY', startDay: '2026-06-08' });
    expect(occurrenceKeysInWindow(c, '2026-06-09', '2026-06-11'))
      .toEqual(['2026-06-09', '2026-06-10', '2026-06-11']);
  });

  it('respects weekly selected days', () => {
    const c = chore({ recurrence: 'WEEKLY', weeklyDays: '1,5', startDay: '2026-06-08' });
    // Mondays and Fridays between 6/8 and 6/19: 6/8, 6/12, 6/15, 6/19.
    expect(occurrenceKeysInWindow(c, '2026-06-08', '2026-06-19'))
      .toEqual(['2026-06-08', '2026-06-12', '2026-06-15', '2026-06-19']);
  });

  it('is empty for one-offs and undated chores', () => {
    expect(occurrenceKeysInWindow(chore(), '2026-06-01', '2026-06-30')).toEqual([]);
    expect(occurrenceKeysInWindow(chore({ recurrence: 'DAILY' }), '2026-06-01', '2026-06-30')).toEqual([]);
  });
});

describe('firstUnresolvedKey', () => {
  it('returns the anchor when nothing is resolved', () => {
    const c = chore({ recurrence: 'DAILY', startDay: '2026-06-08' });
    expect(firstUnresolvedKey(c, new Set())).toBe('2026-06-08');
  });

  it('skips resolved occurrences to the next open day', () => {
    const c = chore({ recurrence: 'DAILY', startDay: '2026-06-08' });
    expect(firstUnresolvedKey(c, new Set(['2026-06-08', '2026-06-09']))).toBe('2026-06-10');
  });
});

describe('assignedOccurrences — one-off', () => {
  it('projects the single occurrence until resolved', () => {
    expect(assignedOccurrences(chore(), new Set(), false, TODAY))
      .toEqual([{ key: ONCE_KEY, upcoming: false }]);
    expect(assignedOccurrences(chore(), new Set([ONCE_KEY]), false, TODAY)).toEqual([]);
  });
});

describe('assignedOccurrences — CURRENT_ONLY', () => {
  const c = chore({ recurrence: 'DAILY', startDay: '2026-06-08' });

  it('surfaces only the earliest unresolved occurrence', () => {
    expect(assignedOccurrences(c, new Set(), false, TODAY))
      .toEqual([{ key: '2026-06-08', upcoming: false }]);
  });

  it('advances past resolved days and marks a future tip as upcoming', () => {
    const resolved = new Set(['2026-06-08', '2026-06-09', '2026-06-10']);
    expect(assignedOccurrences(c, resolved, false, TODAY))
      .toEqual([{ key: '2026-06-11', upcoming: true }]);
  });

  it('projects nothing while work is open', () => {
    expect(assignedOccurrences(c, new Set(['2026-06-08']), true, TODAY)).toEqual([]);
  });
});

describe('assignedOccurrences — BACKFILL_14D', () => {
  const c = chore({ recurrence: 'DAILY', startDay: '2026-05-01', missedPolicy: 'BACKFILL_14D' });

  it('surfaces every unresolved day in the window, none earlier', () => {
    const out = assignedOccurrences(c, new Set(), false, TODAY);
    expect(out[0]).toEqual({ key: '2026-05-27', upcoming: false }); // today - 14
    expect(out[out.length - 1]).toEqual({ key: TODAY, upcoming: false });
    expect(out).toHaveLength(15);
  });

  it('excludes resolved days and still surfaces while other work is open', () => {
    const resolved = new Set(['2026-06-09', '2026-06-10']);
    const out = assignedOccurrences(c, resolved, true, TODAY);
    expect(out.some(o => o.key === '2026-06-09' || o.key === '2026-06-10')).toBe(false);
    expect(out).toHaveLength(13);
  });

  it('shows the upcoming tip when the window is fully resolved and nothing is open', () => {
    const resolved = new Set(
      assignedOccurrences(c, new Set(), false, TODAY).map(o => o.key)
    );
    const out = assignedOccurrences(c, resolved, false, TODAY);
    expect(out).toEqual([{ key: '2026-06-11', upcoming: true }]);
  });
});
