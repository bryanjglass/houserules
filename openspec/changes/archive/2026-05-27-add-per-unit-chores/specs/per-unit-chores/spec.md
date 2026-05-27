## ADDED Requirements

### Requirement: A parent can create a per-unit chore with a per-item reward

A parent SHALL be able to create a per-unit chore: a chore flagged per-unit, carrying a per-item reward, with no assignee. A per-unit chore SHALL be created unassigned, in the household up-for-grabs pool, in the `PENDING` state, and SHALL remain there as an open *definition* that is never itself completed or credited. A per-unit chore SHALL NOT be recurring (per-unit and recurring are mutually exclusive). A per-unit chore created with no per-item reward, or a reward of zero, SHALL be rejected.

#### Scenario: Parent creates an unlimited per-unit chore
- **WHEN** a parent creates a chore flagged per-unit with a positive per-item reward and no assignee
- **THEN** the chore is created unassigned, in the household pool, marked per-unit, in the `PENDING` state, and not recurring

#### Scenario: Per-unit chore requires a per-item reward
- **WHEN** a parent creates a per-unit chore with no per-item reward or a reward of zero
- **THEN** the request is rejected and no chore is created

### Requirement: Children see per-unit chores in the household pool and log how many they did

Every child in a household SHALL see the household's per-unit chore definitions in their pool, the same way they see unclaimed up-for-grabs chores. A child SHALL be able to log a count of units they completed against a per-unit definition by submitting a positive whole number. Logging a count SHALL record a separate completion that credits the logging child, and SHALL leave the definition open in the pool so the same child or another child can log against it again. Logging SHALL NOT claim, lock, complete, or remove the definition. A submitted count that is not a positive whole number SHALL be rejected. A child SHALL NOT log against a per-unit definition belonging to a different household.

#### Scenario: Child logs a count against an open per-unit chore
- **WHEN** a child logs that they completed a positive number of units of a per-unit chore in their household
- **THEN** a completion crediting that child for that count is recorded, awaiting parent approval, and the definition remains open in the pool

#### Scenario: Definition stays open after a log
- **WHEN** a child logs a count against a per-unit chore and then another child lists their chores
- **THEN** the per-unit chore still appears in the pool as loggable for the other child

#### Scenario: Non-positive count is rejected
- **WHEN** a child submits a count that is zero, negative, or not a whole number
- **THEN** the log is rejected and no completion is recorded

#### Scenario: Cannot log against another household's chore
- **WHEN** a child attempts to log a count against a per-unit definition whose household is not their own
- **THEN** the log is rejected and nothing is recorded

### Requirement: Multiple children earn independently per unit

Two or more children SHALL be able to log counts against the same per-unit chore, and each child's logged completion SHALL be independent of the others. Concurrent logs SHALL all succeed; logging is not a race and no child blocks another.

#### Scenario: Two children each log against the same chore
- **WHEN** two children each log a count against the same per-unit chore
- **THEN** two independent completions are recorded, one crediting each child for their own count

### Requirement: A parent reviews each logged completion and may adjust the count

Each logged completion SHALL await parent approval. On approval, the parent MAY adjust the logged count to a different positive whole number, and the child SHALL be credited the per-item reward multiplied by the approved count, as a single earning. If the parent does not adjust the count, the originally logged count SHALL be used.

#### Scenario: Approval credits reward times the logged count
- **WHEN** a parent approves a logged completion of N units at a per-item reward of R without adjusting the count
- **THEN** the logging child's allowance is credited R × N as a single earning

#### Scenario: Parent adjusts the count before approving
- **WHEN** a parent changes a logged completion's count to M units and approves it
- **THEN** the logging child's allowance is credited R × M, and the completion records the approved count M

### Requirement: Rejecting a logged completion discards it

When a parent rejects a logged completion, that completion SHALL be discarded and SHALL credit nothing. The per-unit definition SHALL remain open in the pool so the child can log again.

#### Scenario: Rejected completion is discarded and the chore stays open
- **WHEN** a parent rejects a logged completion
- **THEN** the completion no longer exists, nothing is credited, and the per-unit definition remains loggable in the pool
