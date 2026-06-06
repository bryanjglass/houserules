## Why

The task calendar currently opens on a full month grid. On a phone-sized screen each day cell is small, tasks are truncated to a single line, and recurring chores crowd each other out — so the calendar is hard to scan for "what's due this week," which is the question parents and kids actually ask. A weekly view gives each day far more room, making titles, assignees, and dollar amounts readable at a glance.

## What Changes

- Replace the month grid on the calendar screen with a **weekly view** that shows the seven days of the current week, each with enough vertical room to list its tasks legibly (title, status, assignee, and amount).
- Change navigation from previous/next **month** to previous/next **week**, with "Today" returning to the week containing the current day. The header reflects the visible week's date range instead of a month name.
- Scope the calendar data request to the visible week's date range (the existing `GET /api/tasks/calendar?start=&end=` endpoint already accepts an arbitrary range, so no API change is required).
- Preserve all existing behavior within the new range: role scoping, up-for-grabs chores, projected recurring occurrences, and the scheduled/upcoming visual distinction.

## Capabilities

### New Capabilities
<!-- None — this modifies the existing calendar capability's requirements. -->

### Modified Capabilities
- `task-calendar`: The calendar's display unit and navigation change from month to week. The "Tasks appear on the calendar on their due date," "scoped by the viewer's role," and "recurring tasks projected across the visible range" requirements are retained but re-scoped to a weekly window; the "navigate between months" requirement is replaced with weekly navigation.

## Impact

- **Client:** `client/src/pages/Calendar.tsx` — replace the 42-cell month grid and month-navigation logic with a 7-day week layout and week navigation; recompute the `start`/`end` range passed to `useCalendar`.
- **API:** No server changes — `GET /api/tasks/calendar` already takes an arbitrary `start`/`end` range.
- **Design:** Follow `docs/design/DESIGN.md` for the calendar screen; introduce no new tokens. Update the calendar spec section if the documented layout changes.
- **Specs:** `openspec/specs/task-calendar/spec.md` requirements updated to describe a weekly window and weekly navigation.
