# up-for-grabs-chores Specification

## Purpose

Defines unassigned household chores that any child can claim on a first-come-first-served basis. A parent posts a chore with no assignee; every child in the household sees it; the first to claim it locks it to themselves, after which it follows the ordinary task lifecycle and pays out to the claimer.

## Requirements

### Requirement: A parent can create an up-for-grabs chore with no assignee

A parent SHALL be able to create a chore that is not assigned to any specific child and is flagged as up-for-grabs. An up-for-grabs chore SHALL be created with no assignee. A chore that is neither up-for-grabs nor assigned to a child SHALL be rejected. An up-for-grabs chore SHALL retain its up-for-grabs flag for its entire lifetime, including after it is claimed.

#### Scenario: Parent creates an up-for-grabs chore without choosing a child
- **WHEN** a parent creates a chore with the up-for-grabs flag set and no assignee
- **THEN** the chore is created with no assignee, marked up-for-grabs, and in the `PENDING` state

#### Scenario: A normal chore still requires an assignee
- **WHEN** a parent creates a chore that is not up-for-grabs and names no child
- **THEN** the request is rejected and no chore is created

#### Scenario: Up-for-grabs flag persists after claiming
- **WHEN** an up-for-grabs chore is claimed by a child
- **THEN** the chore remains flagged up-for-grabs even though it now has an assignee

### Requirement: Children see the household pool of open up-for-grabs chores

Every child in a household SHALL see the household's unclaimed up-for-grabs chores (those flagged up-for-grabs with no assignee), in addition to chores assigned to them. A child SHALL NOT see unclaimed up-for-grabs chores belonging to a different household. The parent who created an up-for-grabs chore SHALL also see it while it is unclaimed.

#### Scenario: All children in the household see an open chore
- **WHEN** a parent posts an unclaimed up-for-grabs chore and a child in that household lists their chores
- **THEN** the open chore appears for that child even though it is not assigned to them

#### Scenario: Children of other households do not see the chore
- **WHEN** a child in a different household lists their chores
- **THEN** the open chore from the first household does not appear

#### Scenario: Parent sees their own unclaimed chore
- **WHEN** a parent lists chores and has posted an unclaimed up-for-grabs chore
- **THEN** the open chore appears for the parent despite having no assignee

### Requirement: The first child to claim an open chore wins it

A child SHALL be able to claim an unclaimed up-for-grabs chore in their own household. Claiming SHALL assign the chore to the claiming child while leaving it flagged up-for-grabs and in the `PENDING` state. Claiming SHALL be atomic so that exactly one child can win a chore: if two children attempt to claim the same open chore, exactly one succeeds and the other is told the chore is already grabbed. A child SHALL NOT claim a chore that is not up-for-grabs, that is already claimed, or that belongs to a different household.

#### Scenario: Child claims an open chore
- **WHEN** a child claims an unclaimed up-for-grabs chore in their household
- **THEN** the chore becomes assigned to that child, stays flagged up-for-grabs, and remains `PENDING`

#### Scenario: Second claimer loses the race
- **WHEN** a child attempts to claim a chore that another child has already claimed
- **THEN** the claim is rejected as already grabbed and the chore's assignee does not change

#### Scenario: Cannot claim a chore from another household
- **WHEN** a child attempts to claim an up-for-grabs chore whose household is not their own
- **THEN** the claim is rejected and the chore is unchanged

#### Scenario: Cannot claim a normal assigned chore
- **WHEN** a child attempts to claim a chore that is not flagged up-for-grabs
- **THEN** the claim is rejected

### Requirement: A claimed chore leaves the pool and behaves like an assigned chore

Once a chore is claimed, it SHALL no longer appear in the household pool for other children, and it SHALL appear in the claiming child's own chore list. From that point the chore SHALL follow the ordinary task lifecycle: the claimer marks it complete, the parent approves, and approval credits the chore's dollar amount to the claimer.

#### Scenario: Claimed chore disappears from other children's pool
- **WHEN** a child claims an open chore and a sibling lists their chores
- **THEN** the chore no longer appears for the sibling

#### Scenario: Claimer earns the chore's amount on approval
- **WHEN** the claiming child completes the chore and the parent approves it
- **THEN** the chore's dollar amount is credited to the claiming child's allowance

### Requirement: Rejecting a claimed chore keeps it locked to the claimer

When a parent rejects a claimed up-for-grabs chore, the chore SHALL return to the `PENDING` state but SHALL remain assigned to the child who claimed it. A rejected claimed chore SHALL NOT return to the household pool.

#### Scenario: Rejected claimed chore stays with the claimer
- **WHEN** a parent rejects a completed up-for-grabs chore that a child had claimed
- **THEN** the chore returns to `PENDING`, stays assigned to that child, and does not reappear in the pool for other children
