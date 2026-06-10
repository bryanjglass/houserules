# task-calendar Specification

## Purpose

Defines how tasks are displayed on a week calendar, including which tasks appear, how the view is scoped by the viewer's role, how recurring tasks are projected across the visible range, and how users navigate between weeks.

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
- **THEN** the task appears on that week's Monday and Thursday

#### Scenario: Daily task shows on every day from its due date forward
- **WHEN** a user views a week and a `DAILY` recurring task is due on that week's Tuesday
- **THEN** the task appears on Tuesday and each subsequent day of the visible week

#### Scenario: Projected occurrences are distinguished from real tasks
- **WHEN** the calendar shows a recurring task's materialized instance alongside its projected future occurrences
- **THEN** the projected occurrences are visually distinguishable from the materialized instance

### Requirement: Users can navigate between weeks

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
