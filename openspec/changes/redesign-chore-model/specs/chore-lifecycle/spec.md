# chore-lifecycle Specification (delta)

## ADDED Requirements

### Requirement: Chores are definitions with an explicit kind

The system SHALL model a chore as a definition record owned by a household (its parent), with an explicit kind of `ASSIGNED`, `OPEN`, or `PER_UNIT`. An `ASSIGNED` chore SHALL name exactly one child of the household and MAY carry a flat reward. An `OPEN` chore SHALL have no assignee and MAY carry a flat reward. A `PER_UNIT` chore SHALL have no assignee, SHALL carry a positive per-item reward, and SHALL NOT be recurring. `ASSIGNED` and `OPEN` chores MAY be recurring. A request that violates these kind constraints SHALL be rejected.

#### Scenario: Assigned chore requires a child
- **WHEN** a parent creates an `ASSIGNED` chore without naming a child
- **THEN** the request is rejected and no chore is created

#### Scenario: Per-unit chore cannot recur
- **WHEN** a parent creates a `PER_UNIT` chore with a recurrence
- **THEN** the request is rejected and no chore is created

#### Scenario: Assigned child must belong to the household
- **WHEN** a parent creates an `ASSIGNED` chore naming a child of a different household
- **THEN** the request is rejected and no chore is created

### Requirement: Completions are the only work records and always belong to a child

The system SHALL record work as completion records attached to a chore, each belonging to exactly one child. A completion SHALL progress `PENDING → COMPLETED → APPROVED`; rejection SHALL return a completion to `PENDING` (except per-unit logs, which are discarded). The chore definition itself SHALL NOT carry a lifecycle status.

#### Scenario: Child completes an assigned occurrence
- **WHEN** a child completes an occurrence of their `ASSIGNED` chore
- **THEN** a completion record for that child and that occurrence is created in the `COMPLETED` state, awaiting parent approval

#### Scenario: Parent marks an occurrence done on a child's behalf
- **WHEN** a parent marks an occurrence of a child's `ASSIGNED` chore as done
- **THEN** a completion record is created for that child in the `COMPLETED` state exactly as if the child had completed it, with no allowance credited yet

#### Scenario: Rejection returns the completion to pending
- **WHEN** a parent rejects a non-per-unit `COMPLETED` completion
- **THEN** the completion returns to `PENDING`, remains attached to the same child and occurrence, and nothing is credited

### Requirement: Occurrences are projected at read time and reads never write

The system SHALL compute the visible occurrences of a chore at read time from its definition (kind, schedule, start day) merged with its existing completion records. Listing or calendar reads SHALL NOT create, update, or delete any record. A completion record SHALL be created only by a user action: completing, claiming, logging units, or a parent marking done.

#### Scenario: Listing chores creates no records
- **WHEN** a recurring chore has scheduled occurrences with no completions and a user lists chores or views the calendar repeatedly
- **THEN** the occurrences appear in every read and no database records are created by the reads

#### Scenario: An occurrence with a completion is not projected again
- **WHEN** an occurrence day of a recurring chore has a completion record in any state
- **THEN** that day is represented by the completion record and is not additionally projected as open work

### Requirement: Occurrence identity is a household-local day key

The system SHALL identify each occurrence by a household-local calendar day key in `YYYY-MM-DD` form, derived from the household's timezone; a one-off chore SHALL use the single key `once`. A completion SHALL record the occurrence key it resolves, and at most one completion SHALL exist per chore and occurrence key. Per-unit logs SHALL carry no occurrence key and SHALL NOT be limited in number.

#### Scenario: Duplicate completion of the same occurrence is refused
- **WHEN** two requests concurrently complete or claim the same occurrence of the same chore
- **THEN** exactly one completion record is created and the other request fails with a conflict

#### Scenario: A future occurrence cannot be completed early
- **WHEN** a child attempts to complete a recurring occurrence whose day key is after the household's current day
- **THEN** the request is rejected and no completion is created

### Requirement: Approval credits the completion's snapshot reward

A completion SHALL snapshot its reward when it is created (the chore's flat reward, or per-item reward × quantity for per-unit logs). On approval the system SHALL atomically flip the completion to `APPROVED` and credit the child an `EARNED` transaction for the snapshot amount; a completion with no reward SHALL be approvable without crediting. A completion SHALL be approved at most once. Editing the chore definition SHALL NOT change the reward of existing completions.

#### Scenario: Approval pays the snapshot, not the edited definition
- **WHEN** a child completes a chore worth $2.00, the parent then edits the chore's reward to $5.00, and then approves the completion
- **THEN** the child is credited $2.00

#### Scenario: Concurrent approvals credit once
- **WHEN** two concurrent approval requests target the same `COMPLETED` completion
- **THEN** exactly one succeeds and exactly one `EARNED` transaction is created

### Requirement: Editing a chore affects only future work

A parent SHALL be able to edit their chore definition (title, description, reward, assignee, schedule, missed-occurrence policy) at any time. Edits SHALL apply to occurrences projected after the edit and SHALL NOT alter existing completion records or credited transactions.

#### Scenario: Edit while a completion awaits review
- **WHEN** a parent edits a chore's title and reward while one completion is awaiting approval
- **THEN** the pending completion keeps its snapshot reward, and newly projected occurrences reflect the edit

### Requirement: Chores are archived, not deleted

A parent SHALL be able to archive their chore. Archiving SHALL be refused while any completion of the chore is `COMPLETED` awaiting review. An archived chore SHALL stop projecting occurrences and SHALL no longer appear in pools or to-do lists, while its approved completions and credited transactions SHALL be preserved.

#### Scenario: Archive blocked by an unreviewed completion
- **WHEN** a parent attempts to archive a chore that has a completion awaiting approval
- **THEN** the request is refused and the chore remains active

#### Scenario: Archiving preserves history
- **WHEN** a parent archives a chore with approved completions
- **THEN** the chore disappears from all lists and projections, and the approved completions and their transactions remain
