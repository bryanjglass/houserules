## Context

Recurrence is stored as a string (`DAILY`/`WEEKLY`/`MONTHLY`) on the `Task` model, and the next instance's due date is computed by the `nextDueDate` helper in `server/src/routes/tasks.js`, which simply adds a fixed offset (+1 day / +7 days / +1 month). Recurring instances are spawned at approval time inside the `$transaction` in `POST /api/tasks/:id/approve`, chained via `templateId`. The task creation form (`client/src/pages/parent/TaskManager.jsx`) exposes recurrence as three mutually exclusive buttons.

This change adds optional day-of-week targeting to weekly recurrence while preserving the existing default behavior.

## Goals / Non-Goals

**Goals:**
- Let parents pick zero or more weekdays for a weekly task.
- Compute the next due date as the soonest selected weekday after the current due date.
- Carry the selection through every spawned instance.
- Keep current +7-day behavior when no days are chosen (backward compatible, no data backfill needed).

**Non-Goals:**
- Day selection for `DAILY` or `MONTHLY` recurrence.
- Editing weekly days on existing tasks after creation (the form is create-only today; edits stay out of scope).
- Multiple-times-per-day or arbitrary interval scheduling.

## Decisions

**Storage: a nullable `weeklyDays` string column on `Task`, holding a comma-separated list of day numbers (`0`=Sun … `6`=Sat).**
SQLite via Prisma has no native array/JSON-list type, and the codebase already models enum-like values as plain strings (status, recurrence). A comma-separated string (e.g. `"1,4"`) keeps that convention and avoids a join table for a tiny, read-mostly set. `null`/empty means "no specific days" → legacy +7 behavior. Alternative considered: a separate `TaskWeeklyDay` table — rejected as overkill for at most seven small integers that are always read together.

**Next-date computation: extend `nextDueDate` to accept the task's `weeklyDays`.**
For `WEEKLY` with a non-empty day set, parse the days, sort them, and walk forward from `currentDue + 1 day` up to 7 days to find the first date whose weekday is in the set. This naturally handles wrap-around to the next week and multi-day cycles. For empty days, fall back to `+7`. Daily/monthly are unchanged. Alternative considered: modular arithmetic to jump directly to the next weekday — rejected as harder to read for no real performance gain over a ≤7-iteration loop.

**Validation in `POST /api/tasks`: accept `weeklyDays` only when `isRecurring && recurrence === 'WEEKLY'`; coerce to a normalized, de-duplicated, sorted string of valid `0–6` integers, else store `null`.**
Keeps invalid or irrelevant input from polluting the column and makes the stored format canonical for the date loop.

**UI: render a 7-chip weekday multi-select that appears only when "Every week" is selected**, mirroring the existing chip styling. Submit the selected day numbers as `weeklyDays`. When the selector is empty, omit `weeklyDays` so the server applies the default.

## Risks / Trade-offs

- [Initial instance due date may not fall on a selected day] → The first task's `dueDate` comes from the parent's date picker as-is; only *spawned* instances are snapped to selected days. This is acceptable for v1 and avoids surprising the parent's explicit date choice. Documented behavior, not a bug.
- [Comma-separated string is unvalidated at the DB layer] → Mitigated by normalizing/validating in the API before write; the date loop also ignores any out-of-range values defensively.
- [Time-of-day/timezone drift in due dates] → Pre-existing behavior of `nextDueDate` (uses server-local `Date`); this change does not alter it.

## Migration Plan

1. Add `weeklyDays String?` to the `Task` model and run `prisma migrate dev` (additive, nullable — no backfill, existing rows read as `null`).
2. Deploy server + client together; `prisma migrate deploy` runs on Railway deploy.
3. Rollback: the column is nullable and ignored by old code paths, so reverting the app code leaves the column harmlessly unused.
