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
- **THEN** the task appears on that week's Monday and Thursday

#### Scenario: Daily task shows on every day from its due date forward
- **WHEN** a user views a week and a `DAILY` recurring task is due on that week's Tuesday
- **THEN** the task appears on Tuesday and each subsequent day of the visible week

#### Scenario: Projected occurrences are distinguished from real tasks
- **WHEN** the calendar shows a recurring task's materialized instance alongside its projected future occurrences
- **THEN** the projected occurrences are visually distinguishable from the materialized instance

### Requirement: Users can navigate between months

The calendar SHALL display one week at a time, running Sunday through Saturday, and SHALL identify the visible week by its date range in the header. The calendar SHALL open on the week containing the current day and SHALL let the viewer move to the previous week, the next week, and back to the current week. The set of tasks and projected occurrences shown SHALL update to match the displayed week, and the current day SHALL be visually highlighted when visible.

#### Scenario: Calendar opens on the current week
- **WHEN** a user opens the calendar
- **THEN** the week containing today is displayed with today visually highlighted

#### Scenario: Navigate to next week
- **WHEN** a user viewing the current week selects "next"
- **THEN** the calendar displays the following week and the tasks due in that week

#### Scenario: Return to today
- **WHEN** a user has navigated away from the current week and selects "today"
- **THEN** the calendar returns to the week containing the current day
