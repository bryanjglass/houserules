## 1. Weekly state and range

- [x] 1.1 Replace the `viewDate` (first-of-month) state in `client/src/pages/Calendar.tsx` with a `weekStart` state holding the Sunday of the visible week, initialized to the Sunday of the current week.
- [x] 1.2 Build the 7-day cell array from `weekStart` (one `Date` per day, Sunday→Saturday).
- [x] 1.3 Compute `startISO` (`weekStart` at 00:00) and `endISO` (`weekStart + 6 days` at 23:59:59.999) and pass them to `useCalendar`, keeping the existing event-by-day (`ymdKey`) grouping.

## 2. Week navigation

- [x] 2.1 Replace `goToMonth(delta)` with a week shift that moves `weekStart` by ±7 days; wire the ‹ / › buttons to previous/next week with appropriate `aria-label`s.
- [x] 2.2 Update "Today" to reset `weekStart` to the Sunday of the current week.
- [x] 2.3 Replace the month/year header with the visible week's date range (e.g. "Jun 1 – 7, 2026"), spanning month/year boundaries correctly.

## 3. Weekly layout

- [x] 3.1 Replace the 42-cell month grid with the weekly layout (vertical day rows per design.md), each day showing its date label and today highlight.
- [x] 3.2 Render each day's tasks reusing the existing task-card styling: scheduled vs. projected (dashed) distinction, status dot, parent-only assignee name, and `money-600` dollar amount.
- [x] 3.3 Keep the scheduled / upcoming(recurring) legend and the loading indicator.

## 4. Design + verification

- [x] 4.1 Reconcile design docs. Finding: `docs/design/DESIGN.md` "Screen 6 — Kid Wallet & Calendar" documents the **Wallet** page's earned-days *month* calendar (`client/src/pages/child/Allowance.tsx`), NOT the task calendar (`client/src/pages/Calendar.tsx`) changed here. The task calendar has no dedicated DESIGN.md screen spec, so no DESIGN.md edit is appropriate; the OpenSpec `specs/task-calendar/spec.md` delta is the design-of-record for the weekly view. The new layout uses only existing Tailwind tokens (`brand`, `brand-50/100`, `money-600`, `line`, `appbg`, `ink-*`).
- [x] 4.2 Run `npm run typecheck` and confirm it passes. (Passes for both server and client after `npm install` + `prisma generate`; client production build also succeeds.)
- [ ] 4.3 Manually verify in the running app: current week opens with today highlighted; prev/next/today navigation updates events; recurring tasks project across the week; parent sees children's tasks and up-for-grabs chores, child sees only their own scope. (Pending interactive browser verification — see note in summary.)
