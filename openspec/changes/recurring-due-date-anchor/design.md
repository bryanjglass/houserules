## Context

Recurring tasks are a chain of `Task` rows linked by `templateId`; each row has its own `dueDate` (`DateTime?`), `recurrence`, `weeklyDays`. The household timezone (parent `User.timezone`) drives all calendar-day math via `server/src/lib/tz.ts` (`calDayInTz`, `familyToday`, `dueDay`, `addDays`, `dayOfWeek`, `stampLocalNoon`) and `server/src/lib/recurrence.ts` (`nextDueDate`, `parseWeeklyDays`). Generated occurrences (catch-up backfill, live tips, approval-time spawn) are stamped at household-local noon. **User-entered** due dates, however, take `new Date(dueDate)` in POST/PUT — UTC midnight — which lands on the previous calendar day in negative-offset zones, and recurrence is anchored only on `dueDate`, so a null date generates nothing.

## Goals / Non-Goals

**Goals:**
- A single calendar-day representation (household-local noon) for every due date, user-entered or generated.
- Recurring tasks always have a concrete, on-schedule first occurrence; empty date = start today.
- Pre-existing dateless recurring tasks become schedulable without a manual migration.

**Non-Goals:**
- No schema/migration change; `dueDate` stays `DateTime?`.
- No change to the templateId instance-chain model or the always-one-live-tip invariant.
- The `Calendar.tsx` browser-vs-household day bucketing nuance is left as-is.

## Decisions

### 1. `parseDateInput(input, tz): CalDay | null` (tz.ts)
Convert a user value to the **intended household calendar day**. A `YYYY-MM-DD` string is parsed by its `y/m/d` digits directly (regex) — never through `new Date()`, which would re-introduce the UTC-midnight shift. A `Date` uses the existing `calDayInTz(date, tz)`. Empty/invalid → `null`. Callers stamp the result with the existing `stampLocalNoon(day, tz)` to get the stored instant. This makes the create/edit path use the exact same representation as generated occurrences.

### 2. `firstOccurrence(start, recurrence, weeklyDays, tz): Date` (recurrence.ts)
The local-noon `Date` of the first scheduled day **on/after** `start`:
- DAILY, MONTHLY, or WEEKLY with no selected days → `start` itself.
- WEEKLY with selected days → `start` if `dayOfWeek(start)` is selected, else walk forward up to 6 days (`addDays`) to the first selected day.
Returns `stampLocalNoon(day, tz)`. Reuses `dayOfWeek`, `addDays`, `parseWeeklyDays`, `stampLocalNoon`; complements the existing `nextDueDate` (which finds the *next* day strictly after a current one). Snap-to-schedule is the confirmed product decision.

### 3. POST `/api/tasks` anchors the due date (tasks.ts)
Resolve `tz = await tzForUser(req.user!)` once. Compute `startDay = parseDateInput(dueDate, tz)`.
- **Recurring** → `dueDate = firstOccurrence(startDay ?? familyToday(tz), recurrence, weeklyDays, tz)` — always non-null, snapped.
- **Non-recurring / per-unit** → `dueDate = startDay ? stampLocalNoon(startDay, tz) : null`.

### 4. PUT `/api/tasks/:id` normalizes and re-anchors (tasks.ts)
Resolve `tz = await tzForTask(task)`. Replace `new Date(dueDate)` with `parseDateInput → stampLocalNoon`. Compute the effective recurrence/weeklyDays/up-for-grabs/assignee (as the existing catchUp recompute already does) and, when the effective task is recurring, set `data.dueDate = firstOccurrence(startDay ?? dueDay(task.dueDate) ?? familyToday(tz), effectiveRecurrence, effectiveWeeklyDays, tz)` so an edited recurring task stays on-schedule. Non-recurring edits store the normalized date (or null). This folds the dueDate decision into the existing recurrence-edit block rather than the standalone `...(dueDate !== undefined ...)` spread.

### 5. Read-time `anchorUndatedRecurring(where, tz)` heal (tasks.ts)
Before `ensureLiveTips` in `GET /tasks`: for recurring, assigned, non-up-for-grabs chains whose newest instance has `dueDate=null`, `UPDATE` that row's `dueDate = firstOccurrence(familyToday(tz), recurrence, weeklyDays, tz)`. Idempotent (a dated row is never re-touched). This heals the seed's and any already-created dateless recurring tasks so they start generating, without a data migration. New creations never reach this path because POST always sets the anchor.

### 6. Seed anchors recurring tasks (seed.ts)
Set each recurring seed task's `dueDate` via `firstOccurrence(familyToday(parentTz), ...)` so a fresh `db:seed`/`db:reset` yields functional recurring chores. The parent's tz defaults to `UTC`.

### 7. Client label (TaskForm.tsx)
Show **"Starts on (optional)"** for the date field when `isRecurring`, else **"Due Date"**. Payload unchanged (`YYYY-MM-DD` or omitted); the server owns anchoring.

## Risks / Trade-offs

- **Editing a recurring task's schedule re-snaps its live tip's due date.** Intended — it keeps every materialized occurrence on-schedule; only the single live row moves, completed/approved history is untouched.
- **Read-time heal does an UPDATE on GET.** Consistent with the existing on-read generation design; idempotent and cheap (only dateless recurring chains, which won't exist for new data).
- **Snap-to-schedule changes the first instance day** vs. today's literal-date behavior. This is the confirmed decision and is covered by unit tests.

## Migration Plan

Code-only; no schema or env change. Dateless recurring rows self-heal on the next `GET /tasks`. Rollback is reverting the branch.

## Open Questions

- Should the calendar also reconcile browser-vs-household day bucketing (`Calendar.tsx`)? Deferred — out of scope here.
