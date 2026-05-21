# task-calendar Specification

## Purpose

Defines how tasks are displayed on a month calendar, including which tasks appear, how the view is scoped by the viewer's role, how recurring tasks are projected across the visible range, and how users navigate between months.

## Requirements

### Requirement: Tasks appear on the calendar on their due date

The calendar SHALL display each task that has a due date on the calendar day matching that due date. Tasks without a due date SHALL NOT appear on the calendar. Each displayed task SHALL show at least its title and status.

#### Scenario: Task with a due date is shown on that day
- **WHEN** a user views the calendar for a month containing a task due on the 14th
- **THEN** that task appears on the 14th showing its title and status

#### Scenario: Task without a due date is omitted
- **WHEN** a user views the calendar and a task has no due date
- **THEN** that task does not appear anywhere on the calendar

### Requirement: Calendar is scoped by the viewer's role

The calendar SHALL show only tasks the viewer is allowed to see. A parent SHALL see tasks for all of their own children, with each task labeled by the child it is assigned to. A child SHALL see only tasks assigned to themselves.

#### Scenario: Parent sees all children's tasks
- **WHEN** a parent with two children views the calendar
- **THEN** tasks assigned to either child appear, each labeled with the assigned child's name

#### Scenario: Child sees only their own tasks
- **WHEN** a child views the calendar
- **THEN** only tasks assigned to that child appear, and no other child's tasks are shown

### Requirement: Recurring tasks are projected across the visible range

For a recurring task, the calendar SHALL display its occurrences on every due date the recurrence rule produces within the visible date range, not only the single materialized instance. Projected occurrences SHALL follow the same recurrence rules as instance spawning (daily, weekly with optional selected days of the week, and monthly) and SHALL be visually identifiable as upcoming/projected rather than already-created tasks.

#### Scenario: Weekly task with selected days shows on each matching day
- **WHEN** a parent views a month and a `WEEKLY` task has Monday and Thursday selected
- **THEN** the task appears on every Monday and every Thursday within the visible range

#### Scenario: Daily task shows on every day from its due date forward
- **WHEN** a user views the calendar and a `DAILY` recurring task is due on the 3rd
- **THEN** the task appears on the 3rd and each subsequent day within the visible range

#### Scenario: Projected occurrences are distinguished from real tasks
- **WHEN** the calendar shows a recurring task's materialized instance alongside its projected future occurrences
- **THEN** the projected occurrences are visually distinguishable from the materialized instance

### Requirement: Users can navigate between months

The calendar SHALL open on the current month and SHALL let the viewer move to the previous month, the next month, and back to the current month. The set of tasks and projected occurrences shown SHALL update to match the displayed month.

#### Scenario: Navigate to next month
- **WHEN** a user viewing the current month selects "next"
- **THEN** the calendar displays the following month and the tasks due in that month

#### Scenario: Return to today
- **WHEN** a user has navigated away from the current month and selects "today"
- **THEN** the calendar returns to the current month
