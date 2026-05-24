## ADDED Requirements

### Requirement: A recurring up-for-grabs chore reopens to the pool on respawn

When a recurring up-for-grabs chore is approved and its next instance is spawned, the new instance SHALL be created with no assignee and SHALL carry the up-for-grabs flag forward, returning the chore to the household pool rather than re-locking it to the child who completed the previous instance. A recurring chore that is not up-for-grabs SHALL continue to spawn its next instance assigned to the same child as before.

#### Scenario: Next instance of an up-for-grabs chore is unassigned
- **WHEN** a recurring up-for-grabs chore claimed by one child is approved and the next instance spawns
- **THEN** the new instance has no assignee, remains flagged up-for-grabs, and is available for any child in the household to claim

#### Scenario: A normal recurring chore still re-spawns to the same child
- **WHEN** a recurring chore that is not up-for-grabs is approved and the next instance spawns
- **THEN** the new instance is assigned to the same child as the previous instance
