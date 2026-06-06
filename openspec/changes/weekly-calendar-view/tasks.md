## 1. Weekly state and range

- [ ] 1.1 Replace the `viewDate` (first-of-month) state in `client/src/pages/Calendar.tsx` with a `weekStart` state holding the Sunday of the visible week, initialized to the Sunday of the current week.
- [ ] 1.2 Build the 7-day cell array from `weekStart` (one `Date` per day, Sunday→Saturday).
- [ ] 1.3 Compute `startISO` (`weekStart` at 00:00) and `endISO` (`weekStart + 6 days` at 23:59:59.999) and pass them to `useCalendar`, keeping the existing event-by-day (`ymdKey`) grouping.

## 2. Week navigation

- [ ] 2.1 Replace `goToMonth(delta)` with a week shift that moves `weekStart` by ±7 days; wire the ‹ / › buttons to previous/next week with appropriate `aria-label`s.
- [ ] 2.2 Update "Today" to reset `weekStart` to the Sunday of the current week.
- [ ] 2.3 Replace the month/year header with the visible week's date range (e.g. "Jun 1 – 7, 2026"), spanning month/year boundaries correctly.

## 3. Weekly layout

- [ ] 3.1 Replace the 42-cell month grid with the weekly layout (vertical day rows per design.md), each day showing its date label and today highlight.
- [ ] 3.2 Render each day's tasks reusing the existing task-card styling: scheduled vs. projected (dashed) distinction, status dot, parent-only assignee name, and `money-600` dollar amount.
- [ ] 3.3 Keep the scheduled / upcoming(recurring) legend and the loading indicator.

## 4. Design + verification

- [ ] 4.1 Update `docs/design/DESIGN.md` (Screen 6 / calendar section) and the referenced spec doc to describe the weekly view, keeping them in sync and using existing tokens only.
- [ ] 4.2 Run `npm run typecheck` and confirm it passes.
- [ ] 4.3 Manually verify in the running app: current week opens with today highlighted; prev/next/today navigation updates events; recurring tasks project across the week; parent sees children's tasks and up-for-grabs chores, child sees only their own scope.
