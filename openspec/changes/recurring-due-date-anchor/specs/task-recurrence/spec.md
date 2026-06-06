## ADDED Requirements

### Requirement: User-entered due dates are stored as the intended household calendar day

The system SHALL interpret a user-supplied date-only value as a calendar day in the household timezone and store it stamped at that day's local noon, the same representation generated occurrences use. A date-only value SHALL NOT be parsed as a UTC instant, which would shift it to the previous day in negative-offset zones.

#### Scenario: A date picked as today is stored as today

- **WHEN** a parent creates a task with a due date of the current household day, in a timezone west of UTC (e.g. America/New_York)
- **THEN** the stored due date resolves to that same calendar day in the household timezone, not the previous day

#### Scenario: A "due today" daily task does not spawn a duplicate for today

- **WHEN** a daily recurring task is created with a due date of the current household day
- **THEN** exactly one instance exists for that day, and catch-up does not backfill an additional instance for the same day

### Requirement: Recurring tasks are always anchored to a concrete first occurrence

Every recurring task SHALL have a non-null due date set to its first scheduled occurrence. When no date is supplied, the schedule SHALL start on the current household day. The first occurrence SHALL be the first scheduled day on or after the start, snapping forward to the weekly selection when the start day is not itself selected.

#### Scenario: A recurring task with no date starts today and appears on the calendar

- **WHEN** a recurring task is created without a due date
- **THEN** it is anchored to its first scheduled occurrence on or after today
- **AND** it appears on the calendar (its occurrences are projected) rather than never appearing

#### Scenario: Weekly selected-day first occurrence snaps to the schedule

- **WHEN** a weekly task selecting Monday/Wednesday/Friday is created with a start day that is a Tuesday
- **THEN** its first occurrence is the following Wednesday, and every materialized occurrence falls on a selected weekday

#### Scenario: A start day already on the schedule is kept

- **WHEN** a weekly task selecting Monday/Wednesday/Friday is created with a start day that is a Wednesday
- **THEN** its first occurrence is that Wednesday

### Requirement: Dateless recurring tasks are healed on read

The system SHALL anchor any pre-existing recurring task that has a null due date to a concrete first occurrence (starting today) when tasks are read, so it begins generating occurrences without a manual migration. This healing SHALL be idempotent and SHALL NOT alter a recurring task that already has a due date.

#### Scenario: An existing null-dated recurring task becomes schedulable

- **WHEN** a recurring task with a null due date is read via the task list
- **THEN** it is anchored to its first scheduled occurrence on or after today
- **AND** subsequent reads do not change its anchored due date
