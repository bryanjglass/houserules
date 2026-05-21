## 1. Schema & migration

- [x] 1.1 Add nullable `weeklyDays String?` field to the `Task` model in `server/prisma/schema.prisma` and update the recurrence comment to document the comma-separated `0–6` format
- [x] 1.2 Run `npm run db:migrate` to create the additive migration

## 2. Server logic

- [x] 2.1 Extend `nextDueDate` in `server/src/routes/tasks.js` to accept `weeklyDays`: for `WEEKLY` with a non-empty day set, return the soonest selected weekday strictly after `currentDue` (loop up to 7 days); otherwise keep `+7`
- [x] 2.2 In `POST /api/tasks`, accept `weeklyDays`, normalize to a de-duplicated, sorted string of valid `0–6` integers only when `isRecurring && recurrence === 'WEEKLY'`, else store `null`
- [x] 2.3 In `POST /api/tasks/:id/approve`, pass `task.weeklyDays` to `nextDueDate` and copy `weeklyDays` onto the spawned recurring instance

## 3. Client UI

- [x] 3.1 Add weekly-days state and a 7-chip weekday multi-select in `client/src/pages/parent/TaskManager.jsx` that renders only when recurrence is `WEEKLY`
- [x] 3.2 Include selected day numbers as `weeklyDays` in the `POST /tasks` payload (omit when empty), and reset the selection when recurrence changes away from weekly

## 4. Verification

- [x] 4.1 Manually create a weekly task with Mon+Thu selected, approve it, and confirm the next instance's due date lands on the correct day and retains the selected days
- [x] 4.2 Confirm a weekly task with no days selected still spawns +7 days (backward compatible)
