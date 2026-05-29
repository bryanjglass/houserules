## 1. Household timezone (schema + API)

- [x] 1.1 Add `timezone String @default("UTC")` to the `User` model in `server/prisma/schema.prisma`, with a comment noting it is the household timezone (meaningful on the parent row)
- [x] 1.2 Create the Prisma migration (`npm run db:migrate`) for the new column
- [x] 1.3 Add an endpoint to read the household timezone for the current user (parent's own, or a child's via `parentId`) and an endpoint for a parent to update it; validate the value is a real IANA zone (reject otherwise)
- [x] 1.4 Mirror the timezone field on the relevant API type(s) in `client/src/types/models.ts` if exposed to the client

## 2. Timezone-aware date helpers (server)

- [x] 2.1 Create a new server module (e.g. `server/src/lib/tz.ts`) with `familyToday(tz)`, `dueDay(date, tz)`, a day-comparison/`isFutureDay(date, tz)`, and `stampLocalNoon(y, m, d, tz)` built over `Intl.DateTimeFormat`
- [x] 2.2 Add a helper to resolve the household timezone for a task/user (parent's `timezone`, following `parentId` for children), defaulting to `UTC`
- [x] 2.3 Rework `nextDueDate` in `server/src/routes/tasks.ts` to step calendar days in the household timezone (advance local Y-M-D, then `stampLocalNoon`), preserving WEEKLY selected-days and MONTHLY semantics

## 3. Live-tip generation (server)

- [x] 3.1 Add a helper that, for every recurring chain visible under a `where` clause, ensures exactly one occurrence exists whose due day is the next scheduled day strictly after `familyToday` (create at local noon if absent)
- [x] 3.2 Reuse the catch-up transactional existence re-check keyed on `(templateId root, dueDay)` so concurrent reads don't double-create the tip
- [x] 3.3 Invoke live-tip generation in `GET /api/tasks` for both parent and child reads (after catch-up backfill), for all recurring tasks (not just catch-up)
- [x] 3.4 Ensure catch-up backfill and tip generation share the household-tz day math (windowed in family days; occurrences stamped at local noon)
- [x] 3.5 Confirm approval stays credit-only with the `!catchUp` guard retained and verify non-catch-up tasks no longer rely on approve-time spawn (the read-time tip provides the next instance); remove or neutralize the now-redundant approve-time spawn accordingly

## 4. Future-completion guard (server)

- [x] 4.1 In `PUT /api/tasks/:id` (child marks complete), reject with 400 when `dueDay(task.dueDate, tz)` is after `familyToday(tz)`
- [x] 4.2 In `POST /api/tasks/:id/complete` (parent marks complete), apply the same future-day rejection
- [x] 4.3 Verify past/today occurrences — including catch-up backfilled past misses — remain completable

## 5. Client UI

- [x] 5.1 Read the relevant `docs/design/DESIGN.md` sections (task card states, Settings) and cite them
- [x] 5.2 Add a timezone selector to `client/src/pages/parent/Settings.tsx`, pre-filled from `Intl.DateTimeFormat().resolvedOptions().timeZone` when unset, saving via the update endpoint
- [x] 5.3 Add an "upcoming/locked" state to `client/src/components/TaskCard.tsx` ("Available <day>", disabled complete action) for occurrences whose due day is in the future, visually distinct from the overdue style
- [x] 5.4 Disable the child's complete action for a future occurrence in the card (mirror the server guard)
- [x] 5.5 Update `docs/design/DESIGN.md` with the upcoming/locked task-card contract and the Settings timezone control, keeping the spec doc in sync

## 6. Verification

- [x] 6.1 Run `npm run typecheck` and resolve any errors across both workspaces
- [x] 6.2 Manually verify: a recurring chore with all instances approved still shows an editable live tip in the parent Outstanding list
- [x] 6.3 Manually verify: the live tip (tomorrow's occurrence) is visible but its complete action is rejected/locked until its day; today's and past occurrences complete normally
- [x] 6.4 Manually verify: catch-up bulk-complete of past misses still works, and approval credits without double-creating the tip
- [x] 6.5 Manually verify timezone behavior: with a non-UTC household timezone, the day boundary for completability matches the household's local calendar day (spot-check around a UTC/local day difference)
