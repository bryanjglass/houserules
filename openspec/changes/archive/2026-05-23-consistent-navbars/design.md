## Context

The client renders two entirely different route trees by role
(`client/src/App.jsx`). Each role grew its own chrome:

- **Parent** pages import `NavBar` (a top bar: logo + Calendar/Settings/New Task
  links + logout) and have no bottom bar.
- **Child** pages import `BottomTabBar` (bottom nav: Chores/Calendar/Wallet +
  logout) and render their own per-page `<header>` (no shared logo).
- `Calendar.jsx` is shared and forks on `isParent`, rendering `NavBar` for
  parents and a bare `<h1>Calendar</h1>` header for kids — the clearest symptom
  of the inconsistency.

DESIGN.md §4 already specifies a bottom tab bar (active = `brand` + 700,
inactive = `ink-400`, 22px icon / 10px label / 22px home-indicator padding) and
§8 step 5 explicitly asks for "a shared `<BottomTabBar>` component; mount in both
parent and kid layouts." This change closes that gap and adds the matching
shared top bar. Constraint: client-only, no server/API/data changes, reuse
existing `Brand.jsx` and `Icons.jsx`, no new Tailwind tokens.

## Goals / Non-Goals

**Goals:**
- One shared top bar (logo left, logout right) on both roles.
- One shared, role-aware bottom tab bar as the primary navigation on both roles.
- Pages stop owning their own chrome; they render page content only.
- Keep the existing destinations/routes; only the chrome moves.

**Non-Goals:**
- No new routes, pages, or destinations (parent gets no new "Children" tab; the
  family roster stays on the Home dashboard).
- No redesign of page bodies (greetings, balance pills, headers-within-content
  like the kid Wallet teal gradient stay as-is).
- No responsive/desktop rework — the app remains the existing mobile-width layout.
- No server, auth, or data-model changes.

## Decisions

### Decision: A single `AppShell` layout component wraps both route trees

Create `client/src/components/AppShell.jsx` that renders `{TopBar}` +
`{children}` (the page) + `{BottomTabBar}`, reading `useAuth()` for role. In
`App.jsx`, wrap the authenticated `<Routes>` (both the PARENT and CHILD trees)
in `<AppShell>` rather than mounting nav inside each page.

- **Why:** Single source of truth for chrome; pages become pure content; the
  `Calendar.jsx` role-fork disappears. Matches DESIGN.md §8.5 intent.
- **Alternative considered — keep per-page imports but make components
  role-aware:** Rejected. Leaves the chrome duplicated across ~7 pages and keeps
  the spacer/`min-h-screen`/`bg-appbg` wrapper boilerplate in each file; easy to
  drift again.

### Decision: Top bar is one component for both roles, with a role-gated action

The top bar always shows logo (left, links to `/`) + logout (right). For
PARENT only it additionally shows the "New Task" primary button (existing
`btn-primary` styling, navigates to `/tasks/new`). This is the smallest role
difference and keeps the bars structurally identical.

- **Why:** Satisfies "consistent top bar" while preserving the parent's primary
  create action that has no child equivalent.
- **Alternative — move New Task into the bottom bar as a center FAB:** Rejected
  as scope creep; not requested and not in the design doc.

### Decision: Generalize `BottomTabBar` to take a role-derived tab set; drop logout from it

`BottomTabBar` selects its `TABS` from role: PARENT → `[Home /, Calendar
/calendar, Settings /settings]`; CHILD → `[Chores /, Calendar /calendar, Wallet
/allowance]`. The logout button is removed from the bottom bar (it now lives in
the top bar), making the bottom bar navigation-only and symmetric across roles.
Keep the existing fixed-position styling and the `h-[78px]` spacer (or move the
spacer into `AppShell`).

- **Why:** Reuses the already design-compliant component; the only behavioral
  change is the data (tab set) and the logout removal.

### Decision: Retire `NavBar.jsx`

Its responsibilities split into the new `TopBar` (logo + logout + New Task) and
the role-aware `BottomTabBar` (Calendar/Settings now bottom-tab destinations).
Either delete `NavBar.jsx` or repurpose it as the `TopBar` implementation —
implementer's choice, but no page should import the old link-based NavBar after
this change.

## Risks / Trade-offs

- **Double-applied spacing / content hidden behind fixed bars** → Centralize the
  top-bar height and bottom-bar spacer in `AppShell` so no page adds its own;
  audit each migrated page for leftover `min-h-screen`/header markup.
- **`Calendar.jsx` regressions when removing its role fork** → It currently
  branches on `isParent` for the header only; the body is already shared. Remove
  only the header/`NavBar`/`BottomTabBar` lines and verify both roles still load
  events.
- **Active-tab matching for parent Home** → `/` must not read as active on
  `/children/:id` or `/tasks/new`; reuse the existing exact-match (`pathname ===
  to`) logic so deep parent routes simply show no active tab, consistent with
  today's NavBar behavior.
- **Lost affordance: child logout moved** → Children previously logged out from
  the bottom bar; it now lives top-right. Low risk (still one tap, visible), and
  it makes the two roles consistent as requested.
