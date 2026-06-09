# per-unit-chores Specification (delta)

## MODIFIED Requirements

### Requirement: A parent can create a per-unit chore with a per-item reward

A parent SHALL be able to create a chore of kind `PER_UNIT`: an open, unlimited chore carrying a positive per-item reward and no assignee. A `PER_UNIT` chore SHALL appear in the household pool as a definition that is itself never completed, claimed, or credited, and SHALL remain there while active. A `PER_UNIT` chore SHALL NOT be recurring. A `PER_UNIT` chore created with no per-item reward, or a reward of zero, SHALL be rejected. The definition SHALL carry no lifecycle status; only its logged completions do.

#### Scenario: Parent creates an unlimited per-unit chore
- **WHEN** a parent creates a `PER_UNIT` chore with a positive per-item reward
- **THEN** the chore is created unassigned, not recurring, and appears in the household pool as loggable

#### Scenario: Per-unit chore requires a per-item reward
- **WHEN** a parent creates a `PER_UNIT` chore with no per-item reward or a reward of zero
- **THEN** the request is rejected and no chore is created

### Requirement: Children see per-unit chores in the household pool and log how many they did

Every child in a household SHALL see the household's active `PER_UNIT` chores in their pool, the same way they see unclaimed `OPEN` chores. A child SHALL be able to log a count of units they completed by submitting a positive whole number. Logging SHALL create a `COMPLETED` completion record belonging to the logging child, carrying the count and a snapshot reward of per-item reward × count, and SHALL leave the chore in the pool so the same child or another child can log again. Logging SHALL NOT claim, lock, complete, or remove the chore. A submitted count that is not a positive whole number SHALL be rejected. A child SHALL NOT log against a `PER_UNIT` chore belonging to a different household.

#### Scenario: Child logs a count against an open per-unit chore
- **WHEN** a child logs that they completed a positive number of units of a `PER_UNIT` chore in their household
- **THEN** a `COMPLETED` completion crediting that child for that count is recorded, awaiting parent approval, and the chore remains in the pool

#### Scenario: Definition stays open after a log
- **WHEN** a child logs a count against a `PER_UNIT` chore and then another child lists their chores
- **THEN** the chore still appears in the pool as loggable for the other child

#### Scenario: Non-positive count is rejected
- **WHEN** a child submits a count that is zero, negative, or not a whole number
- **THEN** the log is rejected and no completion is recorded

#### Scenario: Cannot log against another household's chore
- **WHEN** a child attempts to log a count against a `PER_UNIT` chore whose household is not their own
- **THEN** the log is rejected and nothing is recorded

### Requirement: Deleting a per-unit chore is blocked while logs await review

A parent SHALL be able to archive a `PER_UNIT` chore. Archiving SHALL be refused while any logged completion against it is still awaiting approval, so un-reviewed logs are not silently discarded. Once no completion is awaiting review, the chore SHALL be archivable: it leaves the pool and stops accepting logs, while previously approved completions (and the allowance they credited) SHALL be preserved.

#### Scenario: Cannot archive a per-unit chore with logs awaiting review
- **WHEN** a parent attempts to archive a `PER_UNIT` chore that has one or more logged completions awaiting approval
- **THEN** the request is refused and the chore remains active

#### Scenario: Archiving a per-unit chore preserves approved earnings
- **WHEN** a parent archives a `PER_UNIT` chore that has only approved completions
- **THEN** the chore leaves the pool and the approved completions and the allowance they credited are preserved
