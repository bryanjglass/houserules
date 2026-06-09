# task-recurrence Specification (delta)

## MODIFIED Requirements

### Requirement: Weekly recurring tasks support optional days of the week

A parent SHALL be able to specify zero or more days of the week (Sunday through Saturday) for a `WEEKLY` recurring chore. The selected days SHALL be persisted on the chore definition and SHALL drive every projected occurrence of that chore; no per-occurrence copy of the days exists.

#### Scenario: Parent selects specific weekly days
- **WHEN** a parent creates a `WEEKLY` recurring chore and selects Monday and Thursday
- **THEN** the chore definition stores those two days as its weekly days

#### Scenario: Days are only meaningful for weekly recurrence
- **WHEN** a parent creates a chore whose recurrence is `DAILY` or `MONTHLY`, or a non-recurring chore
- **THEN** no weekly days are stored on the chore

#### Scenario: Selected days drive all projected occurrences
- **WHEN** a `WEEKLY` recurring chore with Monday and Thursday selected is projected over any date range
- **THEN** occurrences fall only on Mondays and Thursdays

### Requirement: Next due date honors selected weekly days

When a `WEEKLY` recurring chore has one or more selected days, the occurrence following a given occurrence SHALL fall on the soonest selected day of the week strictly after it. When no days are selected, the next occurrence SHALL fall seven days later. These rules SHALL be applied by occurrence projection (lists and calendar), not by spawning records.

#### Scenario: Next occurrence advances to the next selected day
- **WHEN** a weekly chore has an occurrence on a Monday with Monday and Thursday selected
- **THEN** the following projected occurrence is the next Thursday

#### Scenario: Wraps to the earliest selected day in the next week
- **WHEN** a weekly chore has an occurrence on a Thursday with Monday and Thursday selected
- **THEN** the following projected occurrence is the next Monday

#### Scenario: No days selected keeps weekly cadence
- **WHEN** a weekly recurring chore with no selected days has an occurrence on a given day
- **THEN** the following projected occurrence is seven days later

### Requirement: A recurring up-for-grabs chore reopens to the pool on respawn

Each occurrence of a recurring `OPEN` chore SHALL be independently claimable by the household: once an occurrence's completion is resolved, the next scheduled occurrence SHALL appear in the household pool unassigned, because pool membership is computed from the definition and the absence of a completion for the current occurrence. A recurring `ASSIGNED` chore's occurrences SHALL all belong to its assigned child.

#### Scenario: Next occurrence of an up-for-grabs chore is unassigned
- **WHEN** one child's claimed occurrence of a recurring `OPEN` chore is approved and the next scheduled occurrence day arrives
- **THEN** the chore appears in the household pool unassigned and any child may claim that occurrence

#### Scenario: A normal recurring chore stays with the same child
- **WHEN** a recurring `ASSIGNED` chore's occurrence is approved
- **THEN** the next projected occurrence belongs to the same assigned child

### Requirement: Opt-in catch-up recurring tasks backfill missed occurrences

A recurring `ASSIGNED` chore SHALL have a missed-occurrence policy: `CURRENT_ONLY` (default) or `BACKFILL_14D` (catch-up). Under `BACKFILL_14D`, reads SHALL project every scheduled occurrence within the 14 days ending at the household's current day that has no completion record, so the child can complete each missed occurrence independently without waiting for approval of a prior one; occurrences older than the window SHALL NOT be surfaced. Under `CURRENT_ONLY`, reads SHALL surface at most one actionable occurrence (the earliest unresolved scheduled day), plus the upcoming next occurrence which cannot be completed before its day. Projection SHALL create no records; missed occurrences exist only as projections until a child or parent acts on one. `OPEN` chores SHALL ignore the missed-occurrence policy and surface only their current occurrence.

#### Scenario: Missed daily occurrences are surfaced under catch-up
- **WHEN** a child-assigned daily chore has policy `BACKFILL_14D` and several scheduled days within the window have passed without completions
- **THEN** reading the task list shows one independent actionable occurrence for each missed day in the window, and completing one creates a completion for exactly that day

#### Scenario: Occurrences older than the window are not surfaced
- **WHEN** a `BACKFILL_14D` chore has scheduled occurrences before the start of the 14-day window
- **THEN** those occurrences are not shown and can no longer be completed

#### Scenario: Current-only policy surfaces a single actionable occurrence
- **WHEN** a recurring assigned chore with policy `CURRENT_ONLY` has several past scheduled days without completions
- **THEN** only the earliest unresolved occurrence is actionable, and the next occurrence becomes actionable only after it is resolved

#### Scenario: Projection is idempotent across reads
- **WHEN** the task list is read more than once
- **THEN** the same occurrences are shown each time and no records are created by the reads

### Requirement: Approving a catch-up occurrence credits without spawning a successor

Approving any completion SHALL credit the child's snapshot reward and SHALL NOT create any further records: successor occurrences are never spawned at approval time for any chore kind or policy, because future occurrences exist as projections of the definition.

#### Scenario: Approval pays out and spawns nothing
- **WHEN** a parent approves a completed occurrence of any recurring chore
- **THEN** the child is credited that occurrence's snapshot reward and no new chore or completion record is created by the approval

#### Scenario: Multiple backfilled occurrences are each independently payable
- **WHEN** a child completes several missed occurrences of a `BACKFILL_14D` chore and the parent approves each
- **THEN** the child is credited once per approved occurrence
