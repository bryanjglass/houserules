## MODIFIED Requirements

### Requirement: Tasks appear on the calendar on their due date

The calendar SHALL display each task that has a due date on the calendar day matching that due date, within the visible week. Tasks without a due date SHALL NOT appear on the calendar. Each displayed task SHALL show at least its title and status.

#### Scenario: Task with a due date is shown on that day

- **WHEN** a user views the calendar for a week containing a task due on Wednesday
- **THEN** that task appears on Wednesday showing its title and status

#### Scenario: Task without a due date is omitted

- **WHEN** a user views the calendar and a task has no due date
- **THEN** that task does not appear anywhere on the calendar

### Requirement: Recurring tasks are projected across the visible range

For a recurring task, the calendar SHALL display its occurrences on every due date the recurrence rule produces within the visible week, not only the single materialized instance. Projected occurrences SHALL follow the same recurrence rules as instance spawning (daily, weekly with optional selected days of the week, and monthly) and SHALL be visually identifiable as upcoming/projected rather than already-created tasks.

#### Scenario: Weekly task with selected days shows on each matching day

- **WHEN** a parent views a week and a `WEEKLY` task has Monday and Thursday selected
- **THEN** the task appears on Monday and Thursday within the visible week

#### Scenario: Daily task shows on every day from its due date forward

- **WHEN** a user views the calendar and a `DAILY` recurring task is due on or before the visible week
- **THEN** the task appears on each day within the visible week from its due date forward

#### Scenario: Projected occurrences are distinguished from real tasks

- **WHEN** the calendar shows a recurring task's materialized instance alongside its projected future occurrences
- **THEN** the projected occurrences are visually distinguishable from the materialized instance

## REMOVED Requirements

### Requirement: Users can navigate between months

**Reason**: The calendar's display unit changes from a month to a week; month-based navigation is replaced by week-based navigation (see the added "Users can navigate between weeks" requirement).
**Migration**: No data migration. The calendar screen now opens on the current week and navigates by week instead of by month.

## ADDED Requirements

### Requirement: Calendar displays a single week

The calendar SHALL display exactly seven consecutive days representing one week (Sunday through Saturday), each day shown with enough room to legibly list the tasks due that day, including each task's title, status, dollar amount when present, and — for a parent viewer — the assigned child's name. The data shown SHALL cover the date range of the visible week.

#### Scenario: Calendar shows seven days of the current week

- **WHEN** a user opens the calendar
- **THEN** the seven days of the week containing today are displayed, with today visually highlighted

#### Scenario: A day's tasks are listed legibly

- **WHEN** a day in the visible week has one or more tasks due
- **THEN** each task is listed under that day showing its title, status, dollar amount when present, and the assigned child's name for a parent viewer

### Requirement: Users can navigate between weeks

The calendar SHALL open on the current week and SHALL let the viewer move to the previous week, the next week, and back to the current week. The header SHALL identify the visible week's date range. The set of tasks and projected occurrences shown SHALL update to match the displayed week.

#### Scenario: Navigate to next week

- **WHEN** a user viewing the current week selects "next"
- **THEN** the calendar displays the following week and the tasks due in that week

#### Scenario: Return to today

- **WHEN** a user has navigated away from the current week and selects "today"
- **THEN** the calendar returns to the week containing the current day
