## Why

Parents and children can see tasks today only as flat lists, with no sense of *when* work is due across a week or month. Due dates and recurring chores ("every Monday and Thursday") are hard to plan around when you can't see them laid out on a calendar. A calendar view turns scattered due dates into an at-a-glance schedule.

## What Changes

- Add a calendar view that lays tasks out on a month grid by their due date.
- Each calendar day shows the tasks due that day (title, assigned child for parents, dollar amount, and status).
- The calendar projects **future occurrences of recurring tasks** within the visible range, even though only the next instance is materialized in the database today — so an "every Monday and Thursday" chore appears on every matching day, not just its single pending instance.
- Users can navigate between months (previous / next / back to today).
- Parents see all their children's tasks (color- or label-distinguished per child); a child sees only their own tasks. Tasks without a due date are excluded from the calendar.
- Add a route and a navigation entry so the calendar is reachable for both roles.

## Capabilities

### New Capabilities
- `task-calendar`: Presenting tasks on a date-based calendar, including which tasks appear on which day, role-based scoping, and forward projection of recurring task occurrences across the visible date range.

### Modified Capabilities
<!-- None. Recurrence rules (task-recurrence) are reused as-is; their requirements do not change. -->

## Impact

- **API**: new read endpoint that returns tasks within a date range plus projected recurring occurrences (reusing the existing `nextDueDate` / `parseWeeklyDays` recurrence logic in `server/src/routes/tasks.js`). No schema change — projection is computed, not stored.
- **Client**: new calendar page under `client/src/pages/` with a month-grid component; new route in `client/src/App.jsx` for both `PARENT` and `CHILD` route trees; navigation link in `client/src/components/NavBar.jsx`. Uses native `Date` (no new dependency).
- **Specs**: new `task-calendar` capability spec.
