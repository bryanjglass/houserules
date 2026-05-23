## ADDED Requirements

### Requirement: Shared application chrome

Every authenticated page (parent and child) SHALL render inside a shared
application shell that provides a consistent top bar and a consistent bottom
tab bar. Unauthenticated pages (the login screen) SHALL NOT render the shell.

#### Scenario: Authenticated parent sees shared chrome

- **WHEN** a logged-in PARENT views any of their pages (Home, Calendar, Settings, child detail, task editor)
- **THEN** a top bar with the MilkMoney logo and a bottom tab bar are present on the page

#### Scenario: Authenticated child sees shared chrome

- **WHEN** a logged-in CHILD views any of their pages (Chores, Calendar, Wallet)
- **THEN** the same top-bar and bottom-tab-bar structure is present, styled identically to the parent's

#### Scenario: Login screen has no chrome

- **WHEN** a logged-out user views the login screen
- **THEN** neither the top bar nor the bottom tab bar is rendered

### Requirement: Consistent top bar

The top bar SHALL appear on both parent and child authenticated views with the
MilkMoney logo (LogoTile + Wordmark) on the left and a logout control on the
right. The logo SHALL link to the role's home route (`/`). The top bar SHALL be
identical in structure across roles.

#### Scenario: Logo present on both roles

- **WHEN** any authenticated user views any page
- **THEN** the MilkMoney logo is shown at the top-left of the top bar
- **AND** activating the logo navigates to `/`

#### Scenario: Logout available on both roles

- **WHEN** any authenticated user activates the logout control in the top bar
- **THEN** the session ends and the user is redirected to the login screen

#### Scenario: Parent New Task action in top bar

- **WHEN** a PARENT views the top bar
- **THEN** a "New Task" primary action is shown in the top bar that navigates to the task editor
- **AND** a CHILD's top bar does not show the "New Task" action

### Requirement: Consistent bottom tab bar

The bottom tab bar SHALL be the primary page-navigation control on both parent
and child authenticated views. It SHALL be fixed to the bottom of the viewport,
use the design's tab styling (active = `brand` color + bold; inactive =
`ink-400`; 22px outline icons, 10px labels, 44×44 minimum hit target, bottom
padding for the home indicator), and present a role-appropriate set of
destinations.

#### Scenario: Parent navigation destinations

- **WHEN** a PARENT views the bottom tab bar
- **THEN** exactly three destinations are shown: Home (`/`), Calendar (`/calendar`), and Settings (`/settings`)

#### Scenario: Child navigation destinations

- **WHEN** a CHILD views the bottom tab bar
- **THEN** exactly three destinations are shown: Chores (`/`), Calendar (`/calendar`), and Wallet (`/allowance`)

#### Scenario: Active tab reflects current route

- **WHEN** the current route matches a tab's destination
- **THEN** that tab is rendered in the active style (`brand` color, bold label) and the others in the inactive style

#### Scenario: Logout is not a bottom-bar destination

- **WHEN** any authenticated user views the bottom tab bar
- **THEN** no logout control is present in the bottom tab bar (logout lives only in the top bar)
