## MODIFIED Requirements

### Requirement: The first child to claim an open chore wins it

A child SHALL be able to claim an unclaimed up-for-grabs chore in their own household. Claiming SHALL assign the chore to the claiming child while leaving it flagged up-for-grabs and in the `PENDING` state. Claiming SHALL be atomic so that exactly one child can win a chore: if two children attempt to claim the same open chore, exactly one succeeds and the other is told the chore is already grabbed. A child SHALL NOT claim a chore that is not up-for-grabs, that is already claimed, or that belongs to a different household. A child SHALL NOT claim a per-unit chore: although a per-unit definition appears in the household pool with no assignee, it is logged against rather than claimed, so a claim attempt on a per-unit chore SHALL be rejected and the definition SHALL remain open in the pool.

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

#### Scenario: Cannot claim a per-unit chore
- **WHEN** a child attempts to claim a per-unit chore definition from the household pool
- **THEN** the claim is rejected and the definition remains open and loggable in the pool
