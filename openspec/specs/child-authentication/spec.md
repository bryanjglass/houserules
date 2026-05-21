# child-authentication Specification

## Purpose

Defines how children sign in without a memorized password: a per-household code gates the public child lookup, PINs are hashed and rate-limited, and trusted devices allow one-tap passwordless re-login. Parents control the household code and which devices are trusted.

## Requirements

### Requirement: The public child lookup is gated by a household code

The child list SHALL be retrievable only with a household's code, never by the parent's email. Each parent SHALL have a unique, high-entropy `householdCode`. The public lookup SHALL return only each child's `id` and `name`, and only on an exact code match.

#### Scenario: Correct code lists the household's children
- **WHEN** the public child lookup is called with a valid household code
- **THEN** it returns the `id` and `name` of every child in that household, and nothing else

#### Scenario: Wrong code reveals nothing
- **WHEN** the public child lookup is called with a code that matches no household
- **THEN** it returns a generic "not found" response with no child information

#### Scenario: The parent email is not a lookup key
- **WHEN** the public child lookup is called with a parent email instead of a household code
- **THEN** no child list is returned

### Requirement: Parents control the household code

A parent SHALL be able to read their current household code and rotate it. Rotating SHALL immediately invalidate the previous code.

#### Scenario: Parent reads the code to share it
- **WHEN** an authenticated parent requests their household code
- **THEN** the current code is returned

#### Scenario: Rotating invalidates the old code
- **WHEN** an authenticated parent rotates the household code
- **THEN** a new unique code is issued and the previous code no longer matches the household in the public lookup

### Requirement: Child PINs are stored hashed

A child's 4-digit PIN SHALL be stored only as a hash, never in plaintext, both when the account is created and when the PIN is updated. Login SHALL verify the PIN by hash comparison.

#### Scenario: PIN is hashed on create and update
- **WHEN** a parent creates a child with a PIN or updates a child's PIN
- **THEN** only a hash of the PIN is persisted, not the plaintext PIN

### Requirement: Child login requires the household code and a hashed PIN

A child SHALL authenticate with the household code, their child identifier, and their PIN. The household code SHALL belong to the child's own parent, and the PIN SHALL match the stored hash.

#### Scenario: Valid code and PIN sign in
- **WHEN** a child submits the correct household code, their id, and the correct PIN
- **THEN** a session is established

#### Scenario: Code from a different household is rejected
- **WHEN** a child submits a household code that does not belong to their parent
- **THEN** login is rejected with a generic invalid-credentials response

### Requirement: Repeated wrong PINs lock the child out

After a fixed number of consecutive wrong PINs, that child's PIN login SHALL be locked for a cooldown window. A successful login SHALL reset the failure count, and a parent resetting the PIN SHALL clear any active lock.

#### Scenario: Lockout after the threshold
- **WHEN** a child enters the wrong PIN as many times as the configured threshold
- **THEN** further PIN login attempts are refused with a "locked, try later" response until the cooldown elapses, even if the correct PIN is then supplied

#### Scenario: Parent PIN reset clears the lock
- **WHEN** a parent resets a locked child's PIN
- **THEN** the lock is cleared and the child can sign in with the new PIN

### Requirement: A child may be remembered on a trusted device

On a successful child login, the child MAY opt to remember the device. Remembering SHALL issue a long-lived, server-issued device credential stored separately from the short-lived session, hashed at rest, and scoped to the child's household. Multiple children of the same household MAY be remembered on the same device.

#### Scenario: Opting to remember the device
- **WHEN** a child logs in with the remember-device option enabled
- **THEN** the device is recorded as trusted for that child, with its own expiry independent of the session

#### Scenario: Siblings share one trusted device
- **WHEN** a second child of the same household logs in on an already-trusted device with remember enabled
- **THEN** that child is also remembered on the same device

### Requirement: Trusted devices allow one-tap passwordless login

On a trusted device, the remembered children SHALL be listable, and a child SHALL be able to sign in by selection alone, without entering the household code or a PIN.

#### Scenario: Listing remembered children
- **WHEN** the remembered-children endpoint is called from a trusted device
- **THEN** it returns the children remembered on that device; from an untrusted device it returns an empty list

#### Scenario: One-tap login
- **WHEN** a remembered child is selected for device login on a trusted device
- **THEN** a session is established without a PIN

#### Scenario: A child not remembered on the device cannot one-tap
- **WHEN** device login is attempted for a child who is not remembered on that device
- **THEN** the request is rejected

### Requirement: Parents can view and revoke trusted devices

A parent SHALL be able to list the trusted devices in their household and revoke any of them. Revoking SHALL immediately disable passwordless login from that device, falling back to household code plus PIN.

#### Scenario: Listing trusted devices
- **WHEN** an authenticated parent lists trusted devices
- **THEN** they see each device's remembered children and last-used time, scoped to their own household

#### Scenario: Revoking a device
- **WHEN** a parent revokes a trusted device
- **THEN** one-tap login from that device stops working and that device no longer appears as remembered
