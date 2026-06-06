## 1. Date helpers

- [x] 1.1 Add `parseDateInput(input, tz): CalDay | null` to `server/src/lib/tz.ts` (YYYY-MM-DD parsed by digits; Date via `calDayInTz`; empty/invalid → null)
- [x] 1.2 Add `firstOccurrence(start, recurrence, weeklyDays, tz): Date` to `server/src/lib/recurrence.ts` (first scheduled day on/after start, snapping weekly selections; local-noon stamp)

## 2. Server route — create/edit normalization & anchoring

- [x] 2.1 `POST /api/tasks`: resolve `tz` once; per-unit branch stores `startDay ? stampLocalNoon(startDay,tz) : null`; normal branch anchors recurring via `firstOccurrence(startDay ?? familyToday(tz), …)` and non-recurring via `stampLocalNoon`
- [x] 2.2 `PUT /api/tasks/:id`: resolve `tz`; normalize provided dueDate via `parseDateInput → stampLocalNoon`; when effective task is recurring, set `dueDate = firstOccurrence(startDay ?? dueDay(task.dueDate) ?? today, effectiveRecurrence, effectiveWeeklyDays, tz)`
- [x] 2.3 Add `anchorUndatedRecurring(where, tz)` and call it in `GET /api/tasks` (both parent and child) before `ensureLiveTips`; anchors recurring/assigned/non-up-for-grabs chains whose newest instance has null dueDate

## 3. Seed

- [x] 3.1 Anchor the recurring seed tasks in `server/prisma/seed.ts` via `firstOccurrence(familyToday(tz), …)` so a fresh seed is functional

## 4. Client polish

- [x] 4.1 Relabel the date field to "Starts on (optional)" when recurring in `client/src/components/TaskForm.tsx` (payload unchanged)

## 5. Tests

- [x] 5.1 `server/src/lib/tz.test.ts`: `parseDateInput("2026-06-06","America/New_York")` → `{y:2026,m:6,d:6}`; a Date input case; empty/invalid → null
- [x] 5.2 `server/src/lib/recurrence.test.ts`: `firstOccurrence` for DAILY/MONTHLY/WEEKLY-no-days (= start), WEEKLY M/W/F from Tuesday → Wednesday, from Wednesday → Wednesday, from Saturday → Monday

## 6. Verification

- [x] 6.1 `npm test` (new + existing pass) and `npm run typecheck` (both workspaces)
- [x] 6.2 `npm run build --workspace=client`
- [x] 6.3 Throwaway `tsx` reproduction (then delete): daily due-today (EDT) → one instance on 6/6 and next = 6/7; weekly M/W/F no date created Tuesday → first occurrence Wednesday and `projectOccurrences` yields F/M/W… across a month
- [x] 6.4 `npm run db:reset` and confirm seeded recurring tasks carry a concrete dueDate
