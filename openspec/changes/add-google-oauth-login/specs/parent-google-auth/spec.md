## ADDED Requirements

### Requirement: Parent sign-in with a verified Google ID token

The system SHALL provide a `POST /api/auth/google` endpoint that accepts a Google ID token credential, verifies it server-side against the configured `GOOGLE_CLIENT_ID` audience and the Google issuer, and on success signs the user in by setting the same httpOnly `token` cookie used by every other login path. The endpoint MUST be rate-limited by the existing `authLimiter`.

#### Scenario: Valid credential for an existing Google-linked parent

- **WHEN** a request to `POST /api/auth/google` carries a valid Google ID token whose `sub` matches a `User` with a stored `googleId`
- **THEN** the system sets the httpOnly `token` cookie via `signToken()` for that user and responds with `{ id, name, role }`

#### Scenario: Missing or malformed credential

- **WHEN** the request body has no credential or the credential is not a valid Google ID token
- **THEN** the system responds with `401` and does not set the `token` cookie

#### Scenario: Credential fails audience or issuer verification

- **WHEN** the credential's audience does not match `GOOGLE_CLIENT_ID` or the issuer is not Google
- **THEN** the system responds with `401` and does not set the `token` cookie

### Requirement: Auto-link a Google identity to an existing parent by verified email

The system SHALL link a Google identity to an existing parent account when the credential's email is verified and matches that parent's `email`, trusting Google's verification of email ownership.

#### Scenario: Verified email matches an existing email+password parent

- **WHEN** a verified Google credential's email matches a `User` that has no `googleId` yet
- **THEN** the system stores the credential's `sub` as that user's `googleId` and signs them in by setting the `token` cookie

#### Scenario: Linking preserves the existing password

- **WHEN** an existing email+password parent is auto-linked to Google
- **THEN** the system leaves the existing `passwordHash` intact so the parent can still sign in with either method

### Requirement: Reject credentials with an unverified email

The system SHALL refuse to link or create an account when Google reports the credential's email as unverified, so an unverified email can never attach to an existing account.

#### Scenario: Credential reports email_verified false

- **WHEN** a Google credential is otherwise valid but reports `email_verified = false`
- **THEN** the system responds with `401`, does not link to any account, does not create an account, and does not set the `token` cookie

### Requirement: Silently provision a new parent household on first Google sign-in

The system SHALL create a new parent household on the first Google sign-in for an email that matches no existing account, without any additional steps from the user.

#### Scenario: First-time Google sign-in with no matching account

- **WHEN** a verified Google credential's `sub` and `email` match no existing `User`
- **THEN** the system creates a `User` with `role = PARENT`, the credential's name and email, the credential's `sub` as `googleId`, a freshly generated unique `householdCode`, the default timezone, and `passwordHash = null`, then signs them in by setting the `token` cookie

#### Scenario: Generated household code is unique

- **WHEN** a new parent household is provisioned via Google
- **THEN** the assigned `householdCode` does not collide with any existing household code

### Requirement: Sign in with Google available on the parent login screen

The system SHALL present a "Sign in with Google" button in both the parent login and the register modes of the login screen, and SHALL NOT present it in the child login mode. Selecting it MUST drive the `POST /api/auth/google` flow and, on success, route the parent into the authenticated app exactly as a password login does.

#### Scenario: Button shown in parent and register modes

- **WHEN** a user views the login screen in parent mode or register mode
- **THEN** a "Sign in with Google" button is visible

#### Scenario: Button hidden in child mode

- **WHEN** a user switches the login screen to child (kid) mode
- **THEN** no "Sign in with Google" button is shown

#### Scenario: Successful Google login enters the app

- **WHEN** a parent completes Google sign-in successfully
- **THEN** the client is authenticated as that parent and navigates into the parent app
