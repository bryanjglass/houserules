## MODIFIED Requirements

### Requirement: Calendar is scoped by the viewer's role

The calendar SHALL show only tasks the viewer is allowed to see. A parent SHALL see tasks for all of their own children, with each task labeled by the child it is assigned to, AND the parent's own unclaimed up-for-grabs chores. A child SHALL see tasks assigned to themselves AND their household's unclaimed up-for-grabs chores. Unassigned up-for-grabs chores SHALL appear on the calendar despite having no assignee; once claimed, such a chore SHALL appear only for its claimer (and, as a child's task, for the parent).

#### Scenario: Parent sees all children's tasks
- **WHEN** a parent with two children views the calendar
- **THEN** tasks assigned to either child appear, each labeled with the assigned child's name

#### Scenario: Child sees only their own tasks
- **WHEN** a child views the calendar
- **THEN** only tasks assigned to that child appear, and no other child's tasks are shown

#### Scenario: Unclaimed up-for-grabs chore appears for the whole household
- **WHEN** a parent has posted an unclaimed up-for-grabs chore with a due date and any child of that household views the calendar
- **THEN** the chore appears on its due date even though it has no assignee

#### Scenario: Parent sees their own unclaimed up-for-grabs chore
- **WHEN** a parent who posted an unclaimed up-for-grabs chore with a due date views the calendar
- **THEN** the chore appears on its due date despite having no assignee

#### Scenario: Claimed chore appears only for the claimer
- **WHEN** a child claims an up-for-grabs chore and a sibling views the calendar
- **THEN** the chore appears on the calendar for the claimer but not for the sibling
