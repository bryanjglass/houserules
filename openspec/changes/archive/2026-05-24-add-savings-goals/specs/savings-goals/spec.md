## ADDED Requirements

### Requirement: Parent manages a child's savings goal

A parent SHALL be able to create, edit, and delete a savings goal for one of their own children. A goal consists of a title and a positive target dollar amount. At most one goal per child MAY be in a non-redeemed state (status `ACTIVE` or `REDEEM_REQUESTED`) at a time. The parent SHALL only manage goals for children whose `parentId` equals the parent's id.

#### Scenario: Parent creates a goal for their child

- **WHEN** a parent POSTs a goal with a title and a target amount of 50 for their own child who has no active goal
- **THEN** the system creates a `SavingsGoal` with status `ACTIVE`, `createdById` set to the parent, and `childId` set to the child
- **AND** returns the created goal

#### Scenario: Creating a second active goal is rejected

- **WHEN** a parent creates a goal for a child who already has an `ACTIVE` or `REDEEM_REQUESTED` goal
- **THEN** the system rejects the request with a 409 (conflict) and does not create a second goal

#### Scenario: Non-positive target is rejected

- **WHEN** a parent creates or edits a goal with a target amount that is missing, zero, or negative
- **THEN** the system rejects the request with a 400 error

#### Scenario: Parent edits a goal's title or target

- **WHEN** a parent edits the title or target amount of their child's `ACTIVE` goal
- **THEN** the system updates the goal and returns it
- **AND** no transaction is created and no balance changes

#### Scenario: Parent deletes a goal

- **WHEN** a parent deletes their child's goal that has not been redeemed
- **THEN** the system removes the goal
- **AND** no transaction is created and no balance changes

#### Scenario: Parent cannot manage another household's child

- **WHEN** a parent attempts to create, edit, or delete a goal for a child whose `parentId` does not equal the parent's id
- **THEN** the system rejects the request with a 403 error

### Requirement: Savings goal progress is derived from the balance

The system SHALL compute goal progress as the child's current derived allowance balance relative to the goal's target amount. Progress SHALL NOT be stored on the goal, and creating, editing, or holding a goal SHALL NOT move, reserve, or partition any money. A goal is "reachable" when the derived balance is greater than or equal to the target amount.

#### Scenario: Progress reflects the live balance

- **WHEN** a child with a balance of 42 has an `ACTIVE` goal with a target of 50
- **THEN** the goal is reported as not yet reachable with progress derived from 42 of 50
- **AND** no transaction has been created for the goal

#### Scenario: Goal becomes reachable as balance grows

- **WHEN** the child's balance reaches or exceeds the goal's target amount
- **THEN** the goal is reported as reachable
- **AND** the stored goal status remains `ACTIVE` (reachability is derived, not a stored state)

### Requirement: Child requests to cash in a reachable goal

A child SHALL be able to request to cash in their own `ACTIVE` goal only when their derived balance is greater than or equal to the goal's target amount. Requesting cash-in transitions the goal to status `REDEEM_REQUESTED` and does not move any money. A child SHALL only act on their own goal.

#### Scenario: Child requests cash-in when reachable

- **WHEN** a child requests to cash in their `ACTIVE` goal and their balance is greater than or equal to the target
- **THEN** the goal transitions to `REDEEM_REQUESTED`
- **AND** no transaction is created and the balance is unchanged

#### Scenario: Cash-in request blocked when not reachable

- **WHEN** a child requests to cash in a goal while their balance is below the target amount
- **THEN** the system rejects the request with a 400 error and the goal remains `ACTIVE`

#### Scenario: Child cannot request cash-in on another child's goal

- **WHEN** a child requests to cash in a goal that does not belong to them
- **THEN** the system rejects the request with a 403 error

### Requirement: Parent approves or rejects a cash-in request

A parent SHALL be able to approve or reject a `REDEEM_REQUESTED` goal belonging to their own child. On approval, the system SHALL re-verify that the child's derived balance is greater than or equal to the target amount, set the goal status to `REDEEMED`, record `redeemedAt`, and create exactly one `Transaction` of type `REDEEMED` with an amount equal to the negative of the target amount and `goalId` linking it to the goal. On rejection, the goal SHALL return to status `ACTIVE` with no transaction created.

#### Scenario: Parent approves a cash-in

- **WHEN** a parent approves their child's `REDEEM_REQUESTED` goal and the balance still meets the target
- **THEN** the goal status becomes `REDEEMED` and `redeemedAt` is set
- **AND** a single `Transaction` of type `REDEEMED` is created with amount equal to the negative target and `goalId` referencing the goal
- **AND** the child's derived balance decreases by the target amount

#### Scenario: Approval blocked when balance no longer meets target

- **WHEN** a parent approves a `REDEEM_REQUESTED` goal but the child's derived balance has dropped below the target amount
- **THEN** the system rejects the approval with a 400 error and no transaction is created

#### Scenario: Parent rejects a cash-in

- **WHEN** a parent rejects their child's `REDEEM_REQUESTED` goal
- **THEN** the goal returns to status `ACTIVE`
- **AND** no transaction is created and the balance is unchanged

#### Scenario: Parent cannot approve another household's request

- **WHEN** a parent attempts to approve or reject a goal for a child whose `parentId` does not equal the parent's id
- **THEN** the system rejects the request with a 403 error

### Requirement: Redemption is reflected in the derived balance and history

The redemption transaction SHALL be summed by the existing allowance balance calculation like any other transaction, and SHALL appear in the child's transaction history identified by its linked goal's title via a live join. The balance calculation SHALL NOT require special-casing the `REDEEMED` type.

#### Scenario: Redemption appears in transaction history

- **WHEN** a child's allowance history is fetched after a goal is redeemed
- **THEN** the history includes the `REDEEMED` transaction showing the goal's title and the negative target amount

#### Scenario: Balance accounts for redemption

- **WHEN** the child's balance is recomputed after redemption
- **THEN** the balance equals the sum of all transactions including the negative `REDEEMED` entry

### Requirement: Goal is visible to the child and their parent

The child's Dashboard and Allowance views SHALL display their active goal with its title, target amount, and a derived progress indicator, and SHALL offer a cash-in action that is enabled only when the goal is reachable. The parent SHALL be able to view a child's goal and any pending cash-in request. A child SHALL only see their own goal.

#### Scenario: Child sees goal progress and a gated cash-in action

- **WHEN** a child with an `ACTIVE` goal opens their Dashboard or Allowance view
- **THEN** the goal's title, target, and derived progress are displayed
- **AND** the cash-in action is enabled only when the balance is greater than or equal to the target

#### Scenario: Parent sees a pending cash-in request

- **WHEN** a parent opens the detail view for a child who has a `REDEEM_REQUESTED` goal
- **THEN** the parent sees the request with approve and reject actions
