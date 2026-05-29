## ADDED Requirements

### Requirement: Every recurring task keeps one live upcoming instance

The system SHALL ensure that every recurring task always has exactly one materialized "tip" instance whose due day is the next scheduled day strictly after the household's current day. The tip SHALL be created on read when absent, for all recurring tasks regardless of catch-up. This guarantees a recurring chore is always represented as an editable `PENDING` instance and never disappears from the parent's lists once prior instances are completed or approved.

#### Scenario: A fully approved recurring chore still has a live tip
- **WHEN** every existing instance of a recurring task has been approved
- **THEN** reading the task list ensures one `PENDING` instance exists for the next scheduled day, so the chore remains visible and editable to the parent

#### Scenario: The tip is not duplicated across reads
- **WHEN** the task list is read repeatedly while a live tip already exists
- **THEN** no additional tip is created for the same scheduled day

#### Scenario: Applies to non-catch-up recurring tasks too
- **WHEN** a recurring task that does not have catch-up enabled has its current instance approved
- **THEN** the next scheduled instance is present as a live tip after a read, without relying on approval-time spawning

### Requirement: Future occurrences cannot be completed

The system SHALL reject any attempt to mark an occurrence complete when that occurrence's due day is after the household's current day, evaluated in the household timezone. Occurrences whose due day is the current day or earlier SHALL remain completable, including catch-up backfilled past occurrences. This applies whether a child marks the task complete or a parent marks it complete on the child's behalf.

#### Scenario: A child cannot complete tomorrow's occurrence
- **WHEN** a child tries to mark complete a recurring occurrence whose due day is after today in the household timezone
- **THEN** the request is rejected and the occurrence stays `PENDING`

#### Scenario: Today's occurrence is completable
- **WHEN** a child marks complete an occurrence whose due day is the household's current day
- **THEN** the occurrence transitions to `COMPLETED`

#### Scenario: Past catch-up occurrences remain completable in bulk
- **WHEN** several catch-up backfilled occurrences with past due days exist
- **THEN** each of them can be marked complete

#### Scenario: A parent cannot complete a future occurrence on a child's behalf
- **WHEN** a parent marks complete an occurrence whose due day is after today in the household timezone
- **THEN** the request is rejected

### Requirement: Calendar-day decisions use the household timezone

All recurring task calendar-day computations — generation of occurrences, the next due day, and the future-completion check — SHALL be evaluated against the household timezone using calendar days, not raw timestamps. Generated occurrences SHALL be stamped at the household's local noon so an occurrence's calendar day is stable across daylight-saving transitions and timezone offsets.

#### Scenario: Generated occurrence lands on the intended local day
- **WHEN** the system generates a recurring occurrence for a given scheduled day
- **THEN** the occurrence's stored time renders as that calendar day (around midday) in the household timezone

#### Scenario: Day boundary is evaluated in the household timezone
- **WHEN** the current instant is the same calendar day in the household timezone as an occurrence's due day, even if it is a different calendar day in UTC
- **THEN** that occurrence is treated as due today and is completable

#### Scenario: Next due day advances by calendar days in the household timezone
- **WHEN** the next instance of a daily recurring task is computed
- **THEN** its due day is the following calendar day in the household timezone, regardless of any daylight-saving change between the two days
