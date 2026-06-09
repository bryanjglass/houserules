// Read-time occurrence projection — the core of the chore model. A chore
// definition plus its existing completion rows fully determine what work is
// visible: nothing is ever materialized ahead of a user action, so these
// functions are pure and reads never write. A completion row "resolves" its
// occurrence key; projection only ever surfaces keys with no row.
import { addDaysToKey, compareDayKeys, type DayKey } from './tz.js';
import { firstOccurrenceKey, nextOccurrenceKey } from './recurrence.js';

// The occurrence key of a non-recurring chore (exactly one occurrence, ever).
export const ONCE_KEY = 'once';

// How far back BACKFILL_14D surfaces missed occurrences. Days scheduled before
// (today - window) can no longer be completed, so a long-ignored daily chore
// can't explode into hundreds of overdue items.
export const BACKFILL_WINDOW_DAYS = 14;

// Upper bound on schedule steps walked per chore, guarding runaway daily
// expansion (covers > 1 year of daily occurrences).
const MAX_STEPS = 400;

// The schedule-relevant slice of a Chore row (structural, so tests don't need
// Prisma types).
export interface ChoreSchedule {
  recurrence: string | null;
  weeklyDays: string | null;
  startDay: string | null;
  missedPolicy: string;
}

// A projected occurrence: actionable now, or upcoming (visible but locked until
// its day — the recurring "tip" the child sees but can't complete early).
export interface ProjectedOccurrence {
  key: DayKey;
  upcoming: boolean;
}

// All scheduled day keys of a recurring chore within [startKey, endKey],
// walking the schedule from its startDay anchor. Empty for one-offs/undated.
export function occurrenceKeysInWindow(chore: ChoreSchedule, startKey: DayKey, endKey: DayKey): DayKey[] {
  if (!chore.recurrence || !chore.startDay) return [];
  const keys: DayKey[] = [];
  let cursor = firstOccurrenceKey(chore.startDay, chore.recurrence, chore.weeklyDays);
  for (let i = 0; i < MAX_STEPS; i++) {
    if (compareDayKeys(cursor, endKey) > 0) break;
    if (compareDayKeys(cursor, startKey) >= 0) keys.push(cursor);
    cursor = nextOccurrenceKey(cursor, chore.recurrence, chore.weeklyDays);
  }
  return keys;
}

// The first scheduled key not yet resolved by a completion row. This is an OPEN
// recurring chore's current claimable occurrence: once it's claimed (a row
// exists), the pool entry advances to the next scheduled day. Null for undated
// chores or when the walk exceeds its bound.
export function firstUnresolvedKey(chore: ChoreSchedule, resolved: ReadonlySet<DayKey>): DayKey | null {
  if (!chore.recurrence || !chore.startDay) return null;
  let cursor = firstOccurrenceKey(chore.startDay, chore.recurrence, chore.weeklyDays);
  for (let i = 0; i < MAX_STEPS; i++) {
    if (!resolved.has(cursor)) return cursor;
    cursor = nextOccurrenceKey(cursor, chore.recurrence, chore.weeklyDays);
  }
  return null;
}

// Projected occurrences of an ASSIGNED chore, given the keys already resolved
// by completion rows and whether any non-APPROVED completion exists (open work
// is itself the actionable item, so nothing more projects under CURRENT_ONLY
// and no tip is added).
//
// - One-off: the single ONCE_KEY occurrence until a row resolves it. One-offs
//   are completable any time (no future-day lock), matching a plain to-do.
// - Recurring, CURRENT_ONLY: at most one occurrence — the next scheduled day
//   after the latest resolved one (or the anchor itself when none are) —
//   upcoming when it falls after today.
// - Recurring, BACKFILL_14D: every unresolved scheduled day within the window
//   ending today, each independently completable; when the window is clear and
//   no work is open, the next future occurrence shows as the upcoming tip so
//   the chore never disappears.
export function assignedOccurrences(
  chore: ChoreSchedule,
  resolved: ReadonlySet<DayKey>,
  hasOpenWork: boolean,
  today: DayKey
): ProjectedOccurrence[] {
  if (!chore.recurrence) {
    if (resolved.has(ONCE_KEY)) return [];
    return [{ key: ONCE_KEY, upcoming: false }];
  }
  if (!chore.startDay) return [];

  if (chore.missedPolicy === 'BACKFILL_14D') {
    const windowStart = addDaysToKey(today, -BACKFILL_WINDOW_DAYS);
    const due = occurrenceKeysInWindow(chore, windowStart, today).filter(k => !resolved.has(k));
    if (due.length > 0) return due.map(key => ({ key, upcoming: false }));
    if (hasOpenWork) return [];
    const tip = nextAfterResolved(chore, resolved, today);
    return tip ? [{ key: tip, upcoming: compareDayKeys(tip, today) > 0 }] : [];
  }

  // CURRENT_ONLY: open work suppresses projection entirely (one live item at a
  // time, like the old single-instance chain).
  if (hasOpenWork) return [];
  const next = nextAfterResolved(chore, resolved, today);
  return next ? [{ key: next, upcoming: compareDayKeys(next, today) > 0 }] : [];
}

// The next scheduled key strictly after the latest resolved one, or the anchor
// itself when nothing is resolved yet. Skips any (off-schedule) resolved keys.
function nextAfterResolved(chore: ChoreSchedule, resolved: ReadonlySet<DayKey>, _today: DayKey): DayKey | null {
  if (!chore.recurrence || !chore.startDay) return null;
  const dayKeys = [...resolved].filter(k => k !== ONCE_KEY).sort();
  const latest = dayKeys[dayKeys.length - 1];
  let cursor = firstOccurrenceKey(chore.startDay, chore.recurrence, chore.weeklyDays);
  if (latest !== undefined && compareDayKeys(cursor, latest) <= 0) {
    cursor = nextOccurrenceKey(latest, chore.recurrence, chore.weeklyDays);
  }
  for (let i = 0; i < MAX_STEPS; i++) {
    if (!resolved.has(cursor)) return cursor;
    cursor = nextOccurrenceKey(cursor, chore.recurrence, chore.weeklyDays);
  }
  return null;
}
