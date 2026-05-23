## Why

Navigation is inconsistent across the two roles. The parent view has a top
bar (MilkMoney logo + Calendar/Settings/New Task links + logout) and no bottom
bar; the child view has a bottom tab bar (Chores/Calendar/Wallet + logout) and
no shared top bar — each child page renders its own ad-hoc header. This makes
the app feel like two different products and forces every page to wire its own
chrome. The DESIGN.md already calls for this consolidation (§8 step 5: "Add a
shared `<BottomTabBar>` component; mount in both parent and kid layouts").

## What Changes

- Introduce a shared **AppShell** layout that renders a consistent **top bar**
  (MilkMoney logo on the left, logout on the right) and a consistent **bottom
  tab bar** on both the parent and child views.
- Bottom tab bar becomes the primary page-navigation control for **both** roles:
  - Parent tabs: **Home · Calendar · Settings**.
  - Child tabs: **Chores · Calendar · Wallet** (unchanged set).
- Top bar shows the logo on both roles and a logout control on both roles. The
  parent's **New Task** primary action stays in the top bar.
- Logout moves **out** of the child bottom bar (it now lives in the shared top
  bar), so the child bottom bar is navigation-only.
- Child pages stop rendering their own per-page headers; they render inside the
  shared AppShell instead.
- The existing `NavBar` (top-bar-with-links) and the role-forked header in
  `Calendar.jsx` are replaced by the shared AppShell. `BottomTabBar` is
  generalized to be role-aware.

## Capabilities

### New Capabilities
- `app-navigation`: The shared application chrome — the top bar (brand + logout)
  and the role-aware bottom tab bar — and the rules for how authenticated parent
  and child views navigate between pages.

### Modified Capabilities
<!-- None: no existing spec defines navigation chrome; behavior of auth,
     calendar, and recurrence specs is unchanged. -->

## Impact

- **Client only.** No server, API, or data-model changes.
- New: `client/src/components/AppShell.jsx` (shared layout).
- Changed: `client/src/components/NavBar.jsx` (removed/absorbed),
  `client/src/components/BottomTabBar.jsx` (role-aware), `client/src/App.jsx`
  (wrap route trees in AppShell), and every authenticated page
  (`pages/parent/*`, `pages/child/*`, `pages/Calendar.jsx`) — each drops its
  own header/nav wiring.
- Reuses existing `Brand.jsx` (Wordmark, LogoTile) and `Icons.jsx`; no new
  Tailwind tokens expected.
