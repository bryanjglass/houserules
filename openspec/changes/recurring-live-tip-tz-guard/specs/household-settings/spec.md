## ADDED Requirements

### Requirement: A household has a timezone

A household SHALL have a single timezone, expressed as an IANA timezone name (for example `America/Chicago`), owned by the parent account. The timezone SHALL be the source of truth for all calendar-day decisions affecting the household's tasks. Until a parent sets a timezone, the household SHALL use a defined default of `UTC`.

#### Scenario: New household defaults to UTC
- **WHEN** a parent account exists that has never set a timezone
- **THEN** the household's effective timezone is `UTC`

#### Scenario: Parent sets the household timezone
- **WHEN** a parent saves a valid IANA timezone in Settings
- **THEN** the household timezone is updated and used for subsequent calendar-day decisions

#### Scenario: A child inherits the household timezone
- **WHEN** calendar-day decisions are made for a child's tasks
- **THEN** the timezone of the child's parent (household) is used

### Requirement: Settings exposes the household timezone

The parent Settings screen SHALL let a parent view and change the household timezone. The control SHALL default its initial selection to the timezone detected from the parent's browser when no timezone has been chosen yet.

#### Scenario: Timezone control prefilled from the browser
- **WHEN** a parent opens Settings and the household has not chosen a timezone
- **THEN** the timezone control is pre-selected to the browser-detected timezone

#### Scenario: Changing the timezone persists it
- **WHEN** a parent selects a different timezone and saves
- **THEN** the new timezone is stored on the household and reflected on reload
