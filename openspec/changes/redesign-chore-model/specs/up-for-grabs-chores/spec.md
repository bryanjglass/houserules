# up-for-grabs-chores Specification (delta)

## MODIFIED Requirements

### Requirement: A parent can create an up-for-grabs chore with no assignee

A parent SHALL be able to create a chore of kind `OPEN`: a chore with no assignee that the whole household can see and claim. A chore that is neither `OPEN`/`PER_UNIT` nor assigned to a child SHALL be rejected. The chore's kind SHALL be immutable for its lifetime; whether it is currently claimed is determined by the existence of a completion record for its current occurrence, not by a flag.

#### Scenario: Parent creates an up-for-grabs chore without choosing a child
- **WHEN** a parent creates an `OPEN` chore naming no child
- **THEN** the chore is created with no assignee and its current occurrence appears in the household pool

#### Scenario: A normal chore still requires an assignee
- **WHEN** a parent creates an `ASSIGNED` chore and names no child
- **THEN** the request is rejected and no chore is created

#### Scenario: Kind persists after claiming
- **WHEN** a child claims an `OPEN` chore's current occurrence
- **THEN** the chore remains kind `OPEN` and the claim is recorded as that child's completion record

### Requirement: Children see the household pool of open up-for-grabs chores

Every child in a household SHALL see the household pool: each active `OPEN` chore whose current occurrence has no completion record, in addition to occurrences belonging to them. A child SHALL NOT see another household's pool. The parent SHALL also see their own unclaimed `OPEN` chores.

#### Scenario: All children in the household see an open chore
- **WHEN** a parent posts an `OPEN` chore and a child in that household lists their chores
- **THEN** the chore's current occurrence appears for that child even though it is not assigned to them

#### Scenario: Children of other households do not see the chore
- **WHEN** a child in a different household lists their chores
- **THEN** the open chore from the first household does not appear

#### Scenario: Parent sees their own unclaimed chore
- **WHEN** a parent lists chores and has posted an `OPEN` chore whose current occurrence is unclaimed
- **THEN** the open chore appears for the parent despite having no assignee

### Requirement: The first child to claim an open chore wins it

A child SHALL be able to claim the current occurrence of an unclaimed `OPEN` chore in their own household. Claiming SHALL create a `PENDING` completion record belonging to the claiming child for that occurrence. Claiming SHALL be atomic: at most one completion can exist per chore occurrence, so when two children attempt to claim the same occurrence exactly one succeeds and the other is told the chore is already grabbed. A child SHALL NOT claim a chore that is not `OPEN`, whose current occurrence is already claimed, or that belongs to a different household. A claim attempt on a `PER_UNIT` chore SHALL be rejected (it is logged against, not claimed) and the chore SHALL remain open in the pool.

#### Scenario: Child claims an open chore
- **WHEN** a child claims the current occurrence of an unclaimed `OPEN` chore in their household
- **THEN** a `PENDING` completion belonging to that child is created for the occurrence and the chore leaves the pool

#### Scenario: Second claimer loses the race
- **WHEN** a child attempts to claim an occurrence another child has already claimed
- **THEN** the claim is rejected as already grabbed and the existing completion is unchanged

#### Scenario: Cannot claim a chore from another household
- **WHEN** a child attempts to claim an `OPEN` chore whose household is not their own
- **THEN** the claim is rejected and nothing is recorded

#### Scenario: Cannot claim a normal assigned chore
- **WHEN** a child attempts to claim a chore that is not kind `OPEN`
- **THEN** the claim is rejected

#### Scenario: Cannot claim a per-unit chore
- **WHEN** a child attempts to claim a `PER_UNIT` chore from the household pool
- **THEN** the claim is rejected and the chore remains open and loggable in the pool

### Requirement: A claimed chore leaves the pool and behaves like an assigned chore

Once an occurrence is claimed, it SHALL no longer appear in the household pool for other children, and it SHALL appear in the claiming child's own chore list as their pending work. From that point the completion SHALL follow the ordinary lifecycle: the claimer marks it complete, the parent approves, and approval credits the completion's snapshot reward to the claimer.

#### Scenario: Claimed chore disappears from other children's pool
- **WHEN** a child claims an open occurrence and a sibling lists their chores
- **THEN** the occurrence no longer appears for the sibling

#### Scenario: Claimer earns the chore's amount on approval
- **WHEN** the claiming child completes the occurrence and the parent approves it
- **THEN** the snapshot reward is credited to the claiming child's allowance

### Requirement: Rejecting a claimed chore keeps it locked to the claimer

When a parent rejects a claimed `OPEN` chore's completed occurrence, the completion SHALL return to `PENDING` while remaining attached to the claiming child and its occurrence. Because the completion record still exists for that occurrence, the occurrence SHALL NOT return to the household pool.

#### Scenario: Rejected claimed chore stays with the claimer
- **WHEN** a parent rejects a completed occurrence that a child had claimed
- **THEN** the completion returns to `PENDING`, stays the claimer's, and the occurrence does not reappear in the pool for other children
