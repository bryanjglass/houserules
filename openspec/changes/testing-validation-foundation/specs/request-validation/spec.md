## ADDED Requirements

### Requirement: Request bodies are validated against declared schemas

The system SHALL validate the request body of designated write endpoints against a declared schema before the handler runs. When the body does not conform, the system SHALL reject the request with HTTP 400 and a JSON object of the shape `{ "error": <message> }`, where the message is a short human-readable description of the first violation. When the body conforms, the handler SHALL receive the parsed, coerced value (numbers as numbers, defaults applied) in place of the raw body.

The designated endpoints SHALL include at least: task creation, task update, allowance adjustment, savings-goal creation, savings-goal update, parent registration, and child account creation and update.

#### Scenario: Malformed body is rejected with a consistent shape

- **WHEN** a request to a validated endpoint omits a required field or sends a field of the wrong type
- **THEN** the response is HTTP 400 with a body of the form `{ "error": <message> }`
- **AND** no database write occurs

#### Scenario: Valid body is accepted unchanged

- **WHEN** a request that would have succeeded before this change is sent to a validated endpoint
- **THEN** the request is processed with the same result as before, and the response is unchanged

#### Scenario: Handler receives coerced values

- **WHEN** a validated body contains a numeric field supplied as a number
- **THEN** the handler reads the already-parsed numeric value without performing its own `Number()`/`Math.round()` coercion for fields the schema covers

### Requirement: Monetary and quantity fields are bounded

The system SHALL reject request bodies whose monetary or quantity fields fall outside sane ranges. Monetary fields that represent a chore reward, per-unit reward, or savings-goal target (in integer cents) SHALL be integers within `[0, 1000000]`. A manual allowance adjustment amount (in integer cents) SHALL be an integer within `[-1000000, 1000000]`. A logged or approved unit quantity SHALL be an integer of at least 1.

#### Scenario: Out-of-range reward is rejected

- **WHEN** a task is created with a `dollarAmount` greater than 1000000 cents or a negative value
- **THEN** the request is rejected with HTTP 400 and no task is created

#### Scenario: Adjustment within range is accepted, including negatives

- **WHEN** a parent submits an allowance adjustment with an integer amount inside `[-1000000, 1000000]`
- **THEN** the adjustment is recorded with that signed amount

#### Scenario: Non-integer or zero quantity is rejected

- **WHEN** a per-unit quantity is submitted that is not an integer of at least 1
- **THEN** the request is rejected with HTTP 400

### Requirement: Identity fields meet format constraints

The system SHALL enforce format constraints on identity fields at validation time. A parent registration email SHALL be a syntactically valid email address. A child PIN SHALL be exactly four digits. Names SHALL be non-empty after trimming and length-capped.

#### Scenario: Invalid registration email is rejected

- **WHEN** a parent registers with a value that is not a valid email address
- **THEN** the request is rejected with HTTP 400 and no account is created

#### Scenario: Non-four-digit PIN is rejected

- **WHEN** a child is created or updated with a PIN that is not exactly four digits
- **THEN** the request is rejected with HTTP 400
