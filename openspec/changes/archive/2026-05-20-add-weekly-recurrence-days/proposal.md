## Why

Weekly recurring tasks currently just re-due 7 days after the previous due date, so a chore meant for "every Monday and Thursday" can't be expressed — parents have to create separate tasks per day. Letting parents pick specific days of the week makes weekly chores match how families actually schedule them.

## What Changes

- Parents can optionally select one or more days of the week (Sun–Sat) when creating a `WEEKLY` recurring task.
- When days are selected, each approved instance spawns the next instance on the soonest selected day of the week (cycling through the selected days), instead of always +7 days.
- When no days are selected, weekly tasks keep the existing +7-day behavior (backward compatible).
- The selected days are stored on the task and chained to spawned recurring instances.
- The task creation UI shows a day-of-week multi-select that appears only when "Every week" is chosen.

## Capabilities

### New Capabilities
- `task-recurrence`: How recurring tasks compute their next due date, including optional weekly day-of-week selection.

### Modified Capabilities
<!-- None — no existing specs. -->

## Impact

- **Schema**: new optional `weeklyDays` field on the `Task` model (`server/prisma/schema.prisma`) plus a Prisma migration.
- **API**: `POST /api/tasks` accepts `weeklyDays`; recurring-instance spawning in `POST /api/tasks/:id/approve` and the `nextDueDate` helper (`server/src/routes/tasks.js`) honor selected days.
- **Client**: day-of-week selector in `client/src/pages/parent/TaskManager.jsx`.
