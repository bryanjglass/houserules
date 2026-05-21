## 1. Server: recurrence projection

- [ ] 1.1 In `server/src/routes/tasks.js`, factor recurrence helpers (`nextDueDate`, `parseWeeklyDays`) so they can be reused by the calendar endpoint (extract to a shared module if cleaner).
- [ ] 1.2 Add a `projectOccurrences(task, start, end)` helper that walks a recurring task from its `dueDate` forward using `nextDueDate`, emitting one occurrence per step within `[start, end]`, with a bounded iteration cap.

## 2. Server: calendar endpoint

- [ ] 2.1 Add `GET /api/tasks/calendar?start=&end=` (auth required) that resolves the role scope: parent → all their children's tasks; child → own tasks.
- [ ] 2.2 Return materialized tasks whose `dueDate` falls in `[start, end]`, including `assignedTo` name for parents.
- [ ] 2.3 For recurring tasks, append projected occurrences from `projectOccurrences`, each flagged `projected: true` with its `date`; do not double-count the materialized instance.
- [ ] 2.4 Validate `start`/`end` query params (require both, sane range) and return 400 on bad input.

## 3. Client: calendar page

- [ ] 3.1 Create a calendar page under `client/src/pages/` that computes a month grid (full weeks) with native `Date`, defaulting to the current month.
- [ ] 3.2 Fetch from `/api/tasks/calendar` for the visible grid window via the axios client and bucket items into days by year-month-day.
- [ ] 3.3 Render each day's tasks (title, status, dollar amount); show projected occurrences visually distinct from materialized tasks.
- [ ] 3.4 For parents, label each task with the assigned child's name; omit for child view.
- [ ] 3.5 Add previous / next / today navigation that re-fetches for the new window.

## 4. Client: routing and navigation

- [ ] 4.1 Add a `/calendar` route to both the `PARENT` and `CHILD` route trees in `client/src/App.jsx`.
- [ ] 4.2 Add a calendar navigation link in `client/src/components/NavBar.jsx`.

## 5. Verification

- [ ] 5.1 Run `npm run dev`; as the parent, confirm tasks appear on their due dates and a weekly task with selected days shows on each matching day across the month.
- [ ] 5.2 As a child, confirm only own tasks appear and month navigation updates the view.
- [ ] 5.3 Confirm tasks without a due date never appear and projected occurrences are visually distinguishable from materialized instances.
