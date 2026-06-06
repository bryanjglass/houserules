## Why

Two recurring-task bugs trace to how due dates are represented and how recurrence is anchored:

- **A "due today" daily task spawns two rows (yesterday + today), and the later one regenerates.** User-entered dates take `new Date("2026-06-06")` — parsed as **UTC midnight**. In a negative-offset zone (EDT = UTC−4) that instant is the *previous* calendar day, so a task meant for 6/6 is stored on 6/5. Generated occurrences, by contrast, are stamped at **household-local noon** (`stampLocalNoon`). The two representations disagree: with the instance mis-stored on 6/5, catch-up sees "today (6/6)" as a missing occurrence and backfills it — and keeps re-backfilling 6/6 while the 6/5 row exists. (Verified: `new Date("2026-06-06")` → household day 6/5 in EDT.)
- **A recurring task with no date never appears on the calendar.** Recurrence is anchored solely on `dueDate`; `projectOccurrences`, `ensureLiveTips`, and `backfillCatchUpOccurrences` all bail when it is null. So a no-date recurring task has no anchor and never generates or projects. The seed creates its recurring tasks this way (`dueDate=null`) too.

## What Changes

- **One calendar-day representation for every due date.** Normalize *all* due dates entering the system (create + edit) to **household-local noon** of the intended calendar day — the same representation generated occurrences already use — so the off-by-one disappears and user-entered and generated dates are comparable.
- **Recurring tasks are always anchored to a concrete first occurrence.** An empty date means **start today** (household timezone); the first occurrence is the first scheduled day **on/after** the start, snapping to the weekly schedule (e.g. M/W/F started on a Tuesday → first occurrence Wednesday). A recurring task therefore always has a non-null `dueDate`, so tips, catch-up, projection, and the calendar all work.
- **Heal already-dateless recurring tasks** (the seed's, and any a user already created) by anchoring them to today on read, so they become schedulable without a manual migration.
- Minor client polish: label the date field **"Starts on (optional)"** for recurring tasks.

The API contract is unchanged; valid create/edit payloads behave the same except that previously mis-dated or never-generating recurring tasks now land on the intended day and appear on the calendar.

## Capabilities

### Modified Capabilities
- `task-recurrence`: Due dates are stored as a single household-calendar-day representation (local noon), and recurring tasks are always anchored to a concrete first scheduled occurrence (empty date = start today; first occurrence snaps to the schedule).

## Impact

- **New helpers:** `parseDateInput(input, tz)` in `server/src/lib/tz.ts`; `firstOccurrence(start, recurrence, weeklyDays, tz)` in `server/src/lib/recurrence.ts`.
- **`server/src/routes/tasks.ts`:** normalize the due date in POST (per-unit + normal branches) and PUT; anchor recurring tasks via `firstOccurrence`; add a read-time `anchorUndatedRecurring` step in `GET /tasks`. The approval-time spawn already stamps local noon (no change).
- **`server/prisma/seed.ts`:** anchor the recurring seed tasks.
- **Client:** `client/src/components/TaskForm.tsx` date-field relabel for recurring.
- **Tests:** new Vitest cases for `parseDateInput` (off-by-one) and `firstOccurrence` (snap-to-schedule).
- **Correctness gate:** `npm test`, `npm run typecheck`, `npm run build --workspace=client`.
- **Non-goals:** no schema/migration change (`dueDate` stays `DateTime?`); the browser-vs-household calendar-bucketing nuance in `Calendar.tsx` is out of scope; no rework of the instance-chain/templateId model.
