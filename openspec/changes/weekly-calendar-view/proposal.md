## Why

The calendar currently renders a six-week month grid, which on the app's narrow mobile-first layout (max-w-2xl, Capacitor Android shell) squeezes each day into a tiny cell where task titles, child names, and rewards truncate badly. A family planning horizon is really "this week" — a weekly view gives each day enough room to show its tasks legibly and matches how the calendar is actually used.

## What Changes

- Replace the monthly calendar view on the Calendar page with a weekly view: the visible range becomes one week (Sunday–Saturday) instead of a six-week month grid.
- Navigation changes from previous/next **month** to previous/next **week**, with "Today" returning to the current week. **BREAKING** (behavioral): the monthly view is removed, not offered alongside.
- The header shows the visible week's range (e.g. "Jun 7 – 13, 2026") instead of "June 2026".
- The calendar data query requests a one-week range instead of a 42-day range. No server changes: `GET /api/chores/calendar?start=&end=` already accepts arbitrary day-key ranges.
- Role scoping, due-date placement, recurring-occurrence projection, and the projected/materialized visual distinction all carry over unchanged — only the visible window and navigation granularity change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `task-calendar`: the view window requirement changes from a month grid to a single week, and the navigation requirement changes from month-stepping to week-stepping (previous week / next week / today). Display, scoping, and projection requirements are otherwise unchanged but are re-scoped from "visible month" to "visible week".

## Impact

- **Client:** `client/src/pages/Calendar.tsx` (grid construction, navigation, header, day-cell layout). Possibly `client/src/api/keys.ts`/`queries.ts` cache keys if range keying needs adjusting (the existing `useCalendar(startDay, endDay)` keying should already work per-week).
- **Server:** none — the calendar endpoint and projection logic (`server/src/lib/projection.ts`) are range-agnostic.
- **Specs:** `openspec/specs/task-calendar/spec.md` requirements for the visible range and navigation.
- **Design docs:** `docs/design/DESIGN.md` mentions a month nav on Screen 6's wallet mini-calendar — that is a separate component and is out of scope; only the main Calendar page changes.
