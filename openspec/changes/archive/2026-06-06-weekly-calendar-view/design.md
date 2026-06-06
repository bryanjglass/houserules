## Context

The calendar screen (`client/src/pages/Calendar.tsx`) renders a stable 42-cell (6-week) month grid and fetches role-scoped events for that month via `useCalendar(startISO, endISO)`, which hits `GET /api/tasks/calendar?start=&end=`. The server endpoint is range-agnostic: it returns materialized instances and projected recurring occurrences for whatever `start`/`end` window it receives. The month grid's small day cells truncate task titles and crowd recurring chores, which is poor on the phone-first layout this app targets.

This is a focused, client-only change. No server, schema, or API changes are required because the calendar endpoint already accepts an arbitrary date range.

## Goals / Non-Goals

**Goals:**

- Replace the month grid with a seven-day weekly view that gives each day enough vertical room to list tasks legibly.
- Navigate by week (previous / next / today) with a header showing the visible week's date range.
- Preserve all existing data behavior within the new window: role scoping, up-for-grabs chores, projected recurring occurrences, and the scheduled-vs-upcoming visual distinction.

**Non-Goals:**

- No change to the calendar API contract or server logic.
- No new selectable views (no month/week toggle, no day or agenda view) — the calendar becomes weekly only.
- No new design tokens; reuse the existing calendar/task-card styling from `docs/design/DESIGN.md`.
- No change to how recurring occurrences are computed or projected (server-side `projectOccurrences`).

## Decisions

**Week boundaries: Sunday–Saturday.** The existing `WEEKDAYS` array and month grid already start the week on Sunday, matching `Date.getDay()` (0 = Sunday). The weekly view keeps Sunday as the first day for consistency with the prior calendar and the design reference.

- *Alternative considered:* Monday-start weeks. Rejected to avoid introducing locale/first-day configuration that the rest of the app doesn't have.

**Layout: vertical day rows rather than a 7-column grid.** With a full week visible and the phone-first width, a vertical stack of seven day rows (each row: date label + its task list) gives each day far more room for legible, non-truncated task cards than seven narrow columns. The existing task-card styling (scheduled = `brand-50`/`brand-100`; projected = dashed `ink-300`/`appbg`; status dot; `money-600` amount) is reused per task.

- *Alternative considered:* Keep a 7-column grid but taller. Rejected because narrow columns still truncate titles, which is the core problem being solved. The chosen layout is a deviation from the documented 7-column calendar grid, so `docs/design/DESIGN.md` (Screen 6 / calendar section) must be updated in the same change to avoid drift, per the repo's design rules.

**Range computation.** Compute the visible week from a `weekStart` state value (the Sunday of the visible week). `start` = `weekStart` at 00:00; `end` = `weekStart + 6 days` at 23:59:59.999. Pass their ISO strings to `useCalendar`, keeping the existing per-range query caching. Navigation shifts `weekStart` by ±7 days; "Today" resets it to the Sunday of the current week.

**Event grouping unchanged.** Reuse the existing `ymdKey` bucketing of events by day; only the set of day cells (7 instead of 42) and the surrounding layout change.

## Risks / Trade-offs

- **Design drift from the documented month grid** → Update `docs/design/DESIGN.md` (and the spec doc it references) in the same change; cite the relevant section in the implementation.
- **Less at-a-glance context than a month** (users lose the multi-week overview) → Accepted: the weekly view directly serves the primary "what's due this week" question; week navigation remains one tap away in either direction.
- **Timezone display** → Day bucketing continues to use the browser-local date via `ymdKey`, identical to today's behavior; no change in how due dates map to day cells.

## Migration Plan

Pure client UI change behind no flag. Ships with the next client deploy to Railway; the Android shell loads the same web app, so no app-store release is needed. Rollback is reverting the `Calendar.tsx` (and design doc) change — no data or API state is affected.

## Open Questions

- None. Week start (Sunday) and layout (vertical day rows) are decided above; raise with the user only if the design review prefers a 7-column weekly grid instead.
