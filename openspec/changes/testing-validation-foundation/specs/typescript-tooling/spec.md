## ADDED Requirements

### Requirement: The repo provides an automated test suite

The repo SHALL provide an automated test runner that executes the project's unit tests via a repo-level `npm test`, in addition to the existing `npm run typecheck` gate. The test command SHALL exit non-zero when any test fails and zero when all tests pass. At minimum, the suite SHALL cover the timezone calendar-day helpers and the pure recurrence-scheduling helpers.

#### Scenario: Repo test command runs the suite

- **WHEN** a developer runs the repo-level `npm test`
- **THEN** the server workspace's test suite executes and the command exits zero when all tests pass and non-zero when any test fails

#### Scenario: Timezone helpers are covered

- **WHEN** the test suite runs
- **THEN** it includes assertions over the `lib/tz.ts` calendar-day helpers, including a daylight-saving boundary case, day comparison, and local-noon stamping

#### Scenario: Recurrence scheduling is covered

- **WHEN** the test suite runs
- **THEN** it includes assertions over the pure recurrence helpers (the next-due-day computation and weekly-day parsing) for daily, weekly-with-selected-days, and monthly cadences

#### Scenario: Pure scheduling helpers are importable for testing

- **WHEN** a test imports the next-due-day and weekly-day-parsing helpers
- **THEN** they are exported from their module and can be exercised without initializing Express or Prisma
