# task-calendar Specification

## Purpose

Defines how tasks are displayed on a weekly calendar, including which tasks appear, how the view is scoped by the viewer's role, how recurring tasks are projected across the visible range, and how users navigate between weeks.

## Requirements
### Requirement: Tasks appear on the calendar on their due date

The calendar SHALL display each task that has a due date on the calendar day matching that due date, within the visible week. Tasks without a due date SHALL NOT appear on the calendar. Each displayed task SHALL show at least its title and status.

#### Scenario: Task with a due date is shown on that day

- **WHEN** a user views the calendar for a week containing a task due on Wednesday
- **THEN** that task appears on Wednesday showing its title and status

#### Scenario: Task without a due date is omitted

- **WHEN** a user views the calendar and a task has no due date
- **THEN** that task does not appear anywhere on the calendar

### Requirement: Calendar is scoped by the viewer's role

The calendar SHALL show only tasks the viewer is allowed to see. A parent SHALL see tasks for all of their own children, with each task labeled by the child it is assigned to, AND the parent's own unclaimed up-for-grabs chores. A child SHALL see tasks assigned to themselves AND their household's unclaimed up-for-grabs chores. Unassigned up-for-grabs chores SHALL appear on the calendar despite having no assignee; once claimed, such a chore SHALL appear only for its claimer (and, as a child's task, for the parent).

#### Scenario: Parent sees all children's tasks
- **WHEN** a parent with two children views the calendar
- **THEN** tasks assigned to either child appear, each labeled with the assigned child's name

#### Scenario: Child sees only their own tasks
- **WHEN** a child views the calendar
- **THEN** only tasks assigned to that child appear, and no other child's tasks are shown

#### Scenario: Unclaimed up-for-grabs chore appears for the whole household
- **WHEN** a parent has posted an unclaimed up-for-grabs chore with a due date and any child of that household views the calendar
- **THEN** the chore appears on its due date even though it has no assignee

#### Scenario: Parent sees their own unclaimed up-for-grabs chore
- **WHEN** a parent who posted an unclaimed up-for-grabs chore with a due date views the calendar
- **THEN** the chore appears on its due date despite having no assignee

#### Scenario: Claimed chore appears only for the claimer
- **WHEN** a child claims an up-for-grabs chore and a sibling views the calendar
- **THEN** the chore appears on the calendar for the claimer but not for the sibling

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

