## Why

A recurring chore can vanish from the parent UI and become uneditable. Once every instance of a recurring task is `APPROVED`, the parent Dashboard renders it nowhere (Outstanding shows only `PENDING`/`REJECTED`; Needs Approval shows only `COMPLETED`; `APPROVED` appears in no editable list), and the per-child "Done" tab strips the Edit button for `APPROVED` tasks. The recently added catch-up feature made this reachable: catch-up tasks intentionally do not spawn a successor on approval, so after the last approval there is no live instance — and no separate "template" object — for the parent to find or edit. Before catch-up, approval always spawned a fresh `PENDING` "tip", so a recurring chore was always sitting in Outstanding, editable.

Separately, decoupling generation from approval exposed a complete-ahead gap: nothing prevents marking a not-yet-due occurrence complete and farming allowance for chores that haven't happened.

## What Changes

- **Always keep one live `PENDING` "tip"** for every recurring chore (all recurring tasks, not just catch-up). The next scheduled occurrence is always materialized, restoring the always-editable invariant and fixing the disappearance bug.
- **Block completing future occurrences.** A child or parent cannot mark an occurrence complete while its due **day** is in the future; the tip is visible but its complete action is locked until that day arrives. Catch-up backfilled **past** occurrences remain bulk-completable. **BREAKING (behavioral):** existing non-catch-up recurring tasks currently allow completing the spawned future instance immediately — that is no longer permitted.
- **Introduce a per-household timezone** (new field on the parent `User`) to decide "future vs. today" by calendar day. The codebase has no timezone handling today; this adds IANA-based, DST-correct day math. Parent sets the zone in Settings (browser-detected default); a migration backfills existing households with a neutral default.
- **Generated occurrences are stamped at household-local noon** so a chore's day can't slip across a boundary under DST or offset when rendered in the household zone. `dueDate` stays a `DateTime` (no date-only migration).
- **New "upcoming/locked" task-card state** ("Available <day>", disabled action) distinct from the overdue style, documented in DESIGN.md.

## Capabilities

### New Capabilities
- `household-settings`: A household-level timezone (IANA) owned by the parent, read and updated via the API and Settings UI, used as the source of truth for all calendar-day decisions.

### Modified Capabilities
- `task-recurrence`: Adds the always-present live-tip invariant for recurring tasks and the future-completion guard (day-granular, evaluated in the household timezone); generated occurrences are stamped at household-local noon.

## Impact

- **Schema:** new `timezone String` on `User` (household tz, default neutral) + Prisma migration.
- **New server module:** tz-aware date helpers (`familyToday(tz)`, `dueDay(date, tz)`, household-local-noon stamping) wrapping `Intl`.
- **`server/src/routes/tasks.ts`:** live-tip generation on read (for all recurring), tz-aware `nextDueDate`/day stepping, completion guard in `PUT /:id` (child) and `POST /:id/complete` (parent); retain the `!catchUp` approve-time no-spawn guard.
- **Settings API:** read/update household timezone (`server/src/routes/users.ts` or a settings endpoint).
- **Client:** timezone selector in `client/src/pages/parent/Settings.tsx`; locked/upcoming state + disabled action in `client/src/components/TaskCard.tsx`; mirror any new shape in `client/src/types/models.ts`.
- **Design:** `docs/design/DESIGN.md` gains the upcoming/locked task-card contract.
- **Specs:** modified `task-recurrence`, new `household-settings`.
- **Correctness gate:** `npm run typecheck` (no test suite).
