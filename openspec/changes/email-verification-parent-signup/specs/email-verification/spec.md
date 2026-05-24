## ADDED Requirements

### Requirement: A welcome verification email is sent when a parent registers

When a parent registers, the system SHALL create the account and establish the session exactly as it does today, and SHALL additionally generate a high-entropy email verification token, persist only the hash of that token together with an expiry timestamp on the parent, and send a welcome email containing a verification link built from the configured client URL and the raw token. The raw token SHALL NOT be persisted. Sending the email SHALL NOT block or fail registration: if the email cannot be sent, the failure SHALL be logged and registration SHALL still succeed with the parent logged in.

#### Scenario: Registration sends a verification email and still logs the parent in
- **WHEN** a new parent registers with name, email, and password
- **THEN** the account is created, the session is established as before, a verification token's hash and expiry are stored on the parent, and a welcome email with a verification link is sent

#### Scenario: Email send failure does not break registration
- **WHEN** a parent registers but the email transport fails to send
- **THEN** the failure is logged, the account is still created, and the parent is still logged in

#### Scenario: The raw token is never stored
- **WHEN** a verification token is issued for a parent
- **THEN** only the token's hash and its expiry are persisted, and the raw token exists only inside the emailed link

### Requirement: Email delivery is provider-agnostic with a console fallback

The system SHALL send email through an SMTP transport configured from environment variables. When SMTP is not configured, the system SHALL fall back to logging the verification link to the server console instead of sending, so that local development and seeding work with no email configuration. The SMTP configuration variables SHALL be optional and SHALL NOT be part of the required-environment check.

#### Scenario: SMTP not configured logs the link
- **WHEN** a verification email would be sent and no SMTP host is configured
- **THEN** the verification link is logged to the server console and no send is attempted

#### Scenario: App starts without SMTP configuration
- **WHEN** the server starts with the SMTP variables unset
- **THEN** startup succeeds because the SMTP variables are not required

### Requirement: A parent verifies their email by following the link

The system SHALL expose a public endpoint that accepts a verification token. It SHALL hash the supplied token, locate the parent by the stored token hash, and reject the request when no match is found or the stored expiry has passed. On a valid, unexpired token the system SHALL mark the parent verified by recording the verification time and SHALL clear the stored token hash and expiry. After processing, the system SHALL redirect the browser to the client landing page with a success indicator on success or an invalid indicator on a bad or expired token. The endpoint SHALL be reachable without an authenticated session.

#### Scenario: Valid token verifies the account
- **WHEN** a parent opens a verification link whose token matches the stored hash and has not expired
- **THEN** the parent is marked verified, the stored token hash and expiry are cleared, and the browser is redirected to the client landing page with a success status

#### Scenario: Expired token is rejected
- **WHEN** a parent opens a verification link whose stored expiry has passed
- **THEN** the account is not verified and the browser is redirected to the client landing page with an invalid status

#### Scenario: Unknown or already-used token is rejected
- **WHEN** a verification token does not match any stored token hash
- **THEN** no account is verified and the browser is redirected to the client landing page with an invalid status

#### Scenario: Verification works while logged out
- **WHEN** the verification link is opened in a browser with no authenticated session
- **THEN** the endpoint still processes the token and redirects to the client landing page

### Requirement: A parent can resend the verification email

The system SHALL provide an authenticated, parent-only endpoint to resend the verification email. Resending SHALL regenerate the verification token and expiry, overwriting any previous token so that only the most recently issued link is valid, and SHALL send a new email. When the requesting parent's email is already verified, the endpoint SHALL succeed without sending a new email.

#### Scenario: Resend issues a new link and invalidates the old one
- **WHEN** an unverified parent requests a resend
- **THEN** a new token and expiry are stored, a new verification email is sent, and a previously issued link no longer verifies the account

#### Scenario: Resend is a no-op for an already-verified parent
- **WHEN** a parent whose email is already verified requests a resend
- **THEN** the request succeeds and no new verification email is sent

#### Scenario: Resend requires a parent session
- **WHEN** a resend is requested without an authenticated parent session
- **THEN** the request is rejected

### Requirement: Verification status is exposed and surfaced without blocking usage

The system SHALL include the parent's verification status in the authenticated account endpoint so the client can determine whether the email is verified. The client SHALL show a "verify your email" prompt with a resend action to parents whose email is not yet verified, and SHALL NOT show it to verified parents or to children. Verification status SHALL NOT restrict any parent from creating an account, logging in, or using the application.

#### Scenario: Account endpoint reports verification status
- **WHEN** the authenticated account endpoint is queried
- **THEN** the response includes the parent's verification timestamp, which is empty until the email is verified

#### Scenario: Unverified parent sees the prompt
- **WHEN** a logged-in parent whose email is not verified views the app
- **THEN** a "verify your email" prompt with a resend action is shown

#### Scenario: Verified parent and children do not see the prompt
- **WHEN** a verified parent, or any child, views the app
- **THEN** the "verify your email" prompt is not shown

#### Scenario: Unverified parent is not blocked
- **WHEN** an unverified parent uses the application
- **THEN** they retain full access and are never blocked on account of verification status
