## ADDED Requirements

### Requirement: Server reads go through a shared, deduped query cache

The client SHALL fetch server data through a shared query cache rather than independent per-component requests. Identical concurrent reads of the same resource SHALL be deduplicated into a single in-flight request, and a cached resource SHALL be reusable across navigation without an unconditional refetch.

#### Scenario: The same resource is not fetched twice concurrently

- **WHEN** two mounted views read the same resource (e.g. the task list) at the same time
- **THEN** a single network request is issued and both views receive its result from the shared cache

#### Scenario: Cached data is reused across navigation

- **WHEN** the user navigates away from a screen and back within the cache's fresh window
- **THEN** the cached data is shown immediately without blocking on a new request

### Requirement: Mutations refresh affected views via cache invalidation

Every write SHALL invalidate the query keys for the data it affects, so that any view subscribed to that data refreshes automatically. Components SHALL NOT pass manual refresh callbacks to other components to trigger refetches.

#### Scenario: Approving a task updates the lists and the balance

- **WHEN** a parent approves a completed task
- **THEN** the task lists and the affected child's allowance balance refresh without a manually passed refresh callback

#### Scenario: A task action refreshes every subscribed list

- **WHEN** a task is acted on from one screen (e.g. marked done)
- **THEN** every mounted view that lists that task reflects the change after the mutation succeeds

#### Scenario: Adding a child updates the family list

- **WHEN** a parent adds a child
- **THEN** the children list reflects the new child without a manual `onAdded` callback

### Requirement: Failed loads surface a retry instead of failing silently

When a query fails to load, the client SHALL present an error state with an affordance to retry, rather than a blank screen or a silently empty view.

#### Scenario: A failed fetch offers a retry

- **WHEN** a screen's data request fails
- **THEN** an error state with a retry action is shown
- **AND** invoking retry re-issues the request

### Requirement: A render error is contained by an error boundary

A render-time error in the routed application SHALL be caught by an error boundary that displays a fallback with a recovery action, rather than unmounting the whole app to a blank screen.

#### Scenario: A component throw shows a fallback

- **WHEN** a component throws during render
- **THEN** the error boundary renders a fallback with a way to recover (e.g. reload) instead of a white screen

### Requirement: Loading state is presented consistently

Screens awaiting their initial data SHALL show a single shared loading indicator rather than divergent ad-hoc loading text per screen.

#### Scenario: Screens share one loading indicator

- **WHEN** any screen is awaiting its initial data
- **THEN** it renders the shared loading component
