## ADDED Requirements

### Requirement: Weekly recurring tasks support optional days of the week

A parent SHALL be able to specify zero or more days of the week (Sunday through Saturday) for a `WEEKLY` recurring task. The selected days SHALL be persisted on the task and carried forward to every spawned recurring instance.

#### Scenario: Parent selects specific weekly days
- **WHEN** a parent creates a `WEEKLY` recurring task and selects Monday and Thursday
- **THEN** the task is stored with those two days recorded as its weekly days

#### Scenario: Days are only meaningful for weekly recurrence
- **WHEN** a parent creates a task whose recurrence is `DAILY` or `MONTHLY`, or a non-recurring task
- **THEN** no weekly days are stored on the task

#### Scenario: Selected days carry to spawned instances
- **WHEN** a `WEEKLY` recurring task with selected days is approved and the next instance is spawned
- **THEN** the new instance retains the same selected weekly days

### Requirement: Next due date honors selected weekly days

When a `WEEKLY` recurring task has one or more selected days, the next instance's due date SHALL be the soonest selected day of the week strictly after the current due date. When no days are selected, the next due date SHALL remain seven days after the current due date.

#### Scenario: Next due date advances to the next selected day
- **WHEN** a weekly task due on a Monday has Monday and Thursday selected and is approved
- **THEN** the spawned instance is due on the following Thursday

#### Scenario: Wraps to the earliest selected day in the next week
- **WHEN** a weekly task due on a Thursday has Monday and Thursday selected and is approved
- **THEN** the spawned instance is due on the following Monday

#### Scenario: No days selected keeps weekly cadence
- **WHEN** a weekly recurring task with no selected days is approved
- **THEN** the spawned instance is due seven days after the previous due date
