## ADDED Requirements

### Requirement: Device push tokens are registered and stored per user
The system SHALL accept and persist FCM device tokens for authenticated users, supporting multiple devices per user. Registration MUST be idempotent on the token value.

#### Scenario: Authenticated user registers a new device token
- **WHEN** an authenticated user sends `POST /api/notifications/register` with a valid FCM token and platform
- **THEN** the system stores a `PushToken` linked to that user and responds with success

#### Scenario: Re-registering an existing token refreshes it rather than duplicating
- **WHEN** a token that already exists is registered again by the same user
- **THEN** the system updates the existing `PushToken` (e.g. `lastUsedAt`) instead of creating a duplicate row

#### Scenario: A token re-registered after a different login follows the current user
- **WHEN** a token previously associated with user A is registered while user B is authenticated (e.g. a shared tablet)
- **THEN** the token's owner is reassigned to user B so future notifications reach user B

#### Scenario: One user has multiple devices
- **WHEN** the same user registers tokens from two different devices
- **THEN** both tokens are stored and a notification to that user is delivered to both

#### Scenario: Unauthenticated registration is rejected
- **WHEN** `POST /api/notifications/register` is called without a valid session
- **THEN** the system responds 401 and stores nothing

---

### Requirement: The Android app requests permission and registers its token when authenticated
The native Android app SHALL request notification permission and register its FCM token with the server when running natively and a user is logged in. On non-native (web) platforms this behavior SHALL be skipped entirely.

#### Scenario: Native app registers after login
- **WHEN** the app runs on Android and a user is authenticated
- **THEN** the app requests notification permission and, on grant, registers its FCM token via `POST /api/notifications/register`

#### Scenario: Permission denied does not break the app
- **WHEN** the user denies notification permission
- **THEN** the app continues to function normally and does not register a token

#### Scenario: Web build does not attempt registration
- **WHEN** the app runs in a browser (`Capacitor.isNativePlatform()` is false)
- **THEN** no permission request or token registration occurs

---

### Requirement: Chore lifecycle transitions notify the relevant household member
The system SHALL send a push notification to the appropriate user when a chore is assigned, marked done, approved, or rejected. The recipient MUST be the household member who needs to act on or learn about the transition.

#### Scenario: New chore assigned to a child
- **WHEN** a parent creates a chore assigned to a specific child
- **THEN** the system sends that child a notification announcing the new chore

#### Scenario: Child marks a chore done
- **WHEN** a child marks an assigned chore as done (status becomes COMPLETED)
- **THEN** the system notifies the parent that the chore is awaiting approval

#### Scenario: Parent approves a chore
- **WHEN** a parent approves a completed chore
- **THEN** the system notifies the assigned child that the chore was approved, including the amount earned

#### Scenario: Parent rejects a chore
- **WHEN** a parent rejects a completed chore (status returns to PENDING)
- **THEN** the system notifies the assigned child that the chore needs another look

#### Scenario: No concrete recipient is skipped
- **WHEN** a transition has no specific recipient (e.g. an up-for-grabs definition row with no assignee)
- **THEN** the system sends no notification and does not error

---

### Requirement: Notification dispatch never affects chore correctness
Push notification delivery SHALL be a best-effort side effect performed after the chore lifecycle transaction commits. A delivery failure MUST NOT fail the originating request or roll back the lifecycle change.

#### Scenario: Push failure does not block approval
- **WHEN** a parent approves a chore but the push send fails (FCM error or unset credential)
- **THEN** the approval still succeeds, the allowance is still credited, and the error is logged rather than returned

#### Scenario: Push disabled when unconfigured
- **WHEN** the Firebase service-account credential is not configured
- **THEN** the dispatch helper no-ops and all chore operations continue to work normally

---

### Requirement: Invalid device tokens are pruned automatically
The system SHALL remove a stored `PushToken` when FCM reports it as unregistered or invalid during a send, so the table does not accumulate dead tokens.

#### Scenario: Dead token removed on send
- **WHEN** a notification send returns an unregistered/invalid-token error for a stored token
- **THEN** the system deletes that `PushToken` row

#### Scenario: Valid tokens are unaffected by a sibling's failure
- **WHEN** a user has two tokens and only one is reported invalid
- **THEN** only the invalid token is removed and the valid one is retained
