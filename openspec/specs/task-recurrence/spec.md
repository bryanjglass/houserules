# task-recurrence Specification

## Purpose

Defines how recurring tasks behave, including weekly recurrence with optional selected days of the week.

## Requirements

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

### Requirement: A recurring up-for-grabs chore reopens to the pool on respawn

When a recurring up-for-grabs chore is approved and its next instance is spawned, the new instance SHALL be created with no assignee and SHALL carry the up-for-grabs flag forward, returning the chore to the household pool rather than re-locking it to the child who completed the previous instance. A recurring chore that is not up-for-grabs SHALL continue to spawn its next instance assigned to the same child as before.

#### Scenario: Next instance of an up-for-grabs chore is unassigned
- **WHEN** a recurring up-for-grabs chore claimed by one child is approved and the next instance spawns
- **THEN** the new instance has no assignee, remains flagged up-for-grabs, and is available for any child in the household to claim

#### Scenario: A normal recurring chore still re-spawns to the same child
- **WHEN** a recurring chore that is not up-for-grabs is approved and the next instance spawns
- **THEN** the new instance is assigned to the same child as the previous instance

### Requirement: Opt-in catch-up recurring tasks backfill missed occurrences

A recurring task that is assigned to a child (not up-for-grabs) MAY have a per-task catch-up property. When catch-up is enabled, the system SHALL backfill missed scheduled occurrences as independent `PENDING` task instances when a task list is read, so that a child can complete each missed occurrence without waiting for parent approval of a prior one. Backfill SHALL reuse the established recurrence schedule (cadence and weekly days) and SHALL be limited to occurrences whose due date falls within a fixed catch-up window ending at the current time; occurrences older than the window SHALL NOT be created. Recurring tasks without catch-up enabled, up-for-grabs recurring chores, and recurring tasks without a due date SHALL retain the existing single-tip, approve-time spawn behavior and SHALL NOT backfill.

#### Scenario: Missed daily occurrences are backfilled on read
- **WHEN** a child-assigned daily recurring task has catch-up enabled and several scheduled days within the catch-up window have passed with no instance completed
- **THEN** reading the task list materializes one independent `PENDING` instance for each missed scheduled day within the window, each carrying the task's title, amount, recurrence, and assignee

#### Scenario: Occurrences older than the window are not created
- **WHEN** a catch-up recurring task has scheduled occurrences that fall before the start of the catch-up window
- **THEN** no instances are created for those out-of-window dates

#### Scenario: Non-catch-up recurring tasks do not backfill
- **WHEN** a recurring task does not have catch-up enabled, or is up-for-grabs, or has no due date
- **THEN** reading the task list creates no backfilled instances and the task keeps its single materialized instance

#### Scenario: Backfill is idempotent across reads
- **WHEN** the task list is read more than once after occurrences have been backfilled
- **THEN** no duplicate instance is created for a scheduled date that already has an instance

### Requirement: Approving a catch-up occurrence credits without spawning a successor

When a catch-up recurring occurrence is approved, the system SHALL credit the child's allowance for that occurrence's dollar amount and SHALL NOT spawn the next recurring instance, because catch-up occurrences are generated from the schedule on read rather than at approval time. Approving an occurrence of a recurring task that does not have catch-up enabled SHALL continue to spawn its next instance as before.

#### Scenario: Approving a catch-up occurrence pays out but spawns nothing
- **WHEN** a parent approves a completed catch-up recurring occurrence with a dollar amount
- **THEN** the child is credited that amount and no new recurring instance is created by the approval

#### Scenario: Multiple backfilled occurrences are each independently payable
- **WHEN** a child completes several backfilled occurrences of the same catch-up task and the parent approves each
- **THEN** the child is credited once per approved occurrence

#### Scenario: Non-catch-up recurring approval still spawns the next instance
- **WHEN** a parent approves an occurrence of a recurring task that does not have catch-up enabled
- **THEN** the next recurring instance is spawned with the next computed due date, as in the existing behavior
