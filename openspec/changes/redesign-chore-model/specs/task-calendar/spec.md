# task-calendar Specification (delta)

## MODIFIED Requirements

### Requirement: Tasks appear on the calendar on their due date

The calendar SHALL display, on each household-local calendar day in the visible range, the chore occurrences that fall on that day: completion records on the day of the occurrence they resolve, and projected occurrences from each active chore's schedule on their scheduled days. A one-off chore with no due day SHALL NOT appear on the calendar. Each displayed item SHALL show at least its title and status.

#### Scenario: Task with a due date is shown on that day
- **WHEN** a user views the calendar for a month containing a chore occurrence on the 14th
- **THEN** that chore appears on the 14th showing its title and status

#### Scenario: Task without a due date is omitted
- **WHEN** a user views the calendar and a one-off chore has no due day
- **THEN** that chore does not appear anywhere on the calendar

#### Scenario: A resolved occurrence appears once
- **WHEN** an occurrence day has a completion record for a recurring chore
- **THEN** that day shows the completion's status and the occurrence is not also shown as a projected duplicate

### Requirement: Recurring tasks are projected across the visible range

For a recurring chore, the calendar SHALL display an occurrence on every day its recurrence rule produces within the visible range, computed directly from the chore definition (daily, weekly with optional selected days of the week, and monthly). Days already resolved by a completion record SHALL show that record's status; unresolved days SHALL be visually identifiable as projected/upcoming rather than completed work. Archived chores SHALL NOT project.

#### Scenario: Weekly task with selected days shows on each matching day
- **WHEN** a parent views a month and a `WEEKLY` chore has Monday and Thursday selected
- **THEN** the chore appears on every Monday and every Thursday within the visible range

#### Scenario: Daily task shows on every day from its due date forward
- **WHEN** a user views the calendar and a `DAILY` recurring chore starts on the 3rd
- **THEN** the chore appears on the 3rd and each subsequent day within the visible range

#### Scenario: Projected occurrences are distinguished from real tasks
- **WHEN** the calendar shows a recurring chore's completed occurrence alongside its projected future occurrences
- **THEN** the projected occurrences are visually distinguishable from the completion
