## 1. Shared chrome components

- [x] 1.1 Create `client/src/components/TopBar.jsx`: logo (LogoTile + Wordmark from `Brand.jsx`) on the left linking to `/`, logout button on the right (calls `useAuth().logout()` then navigates to `/login`). For PARENT role only, render the existing `btn-primary` "New Task" action linking to `/tasks/new`. Reuse the sticky `bg-white border-b border-line` header styling from the current `NavBar`.
- [x] 1.2 Generalize `client/src/components/BottomTabBar.jsx` to pick its tab set from `useAuth().user.role`: PARENT → Home (`/`, TasksIcon or home icon), Calendar (`/calendar`), Settings (`/settings`); CHILD → Chores (`/`), Calendar (`/calendar`), Wallet (`/allowance`). Remove the logout button. Keep the fixed-position styling and active/inactive states (active = `brand` + bold, inactive = `ink-400`, 22px icons, 10px labels, 44px min hit target, home-indicator padding).
- [x] 1.3 Create `client/src/components/AppShell.jsx` that renders `<TopBar />`, a `<main>` wrapper for `{children}`, and `<BottomTabBar />`, owning the bottom spacer (the `h-[78px]` clearance) and the `min-h-screen bg-appbg` page background so pages don't repeat it.

## 2. Wire AppShell into routing

- [x] 2.1 In `client/src/App.jsx`, wrap the authenticated PARENT `<Routes>` tree in `<AppShell>`.
- [x] 2.2 In `client/src/App.jsx`, wrap the authenticated CHILD `<Routes>` tree in `<AppShell>`. Leave the logged-out login route tree unwrapped (no chrome on login).

## 3. Migrate pages to render content only

- [x] 3.1 `pages/parent/Dashboard.jsx`: remove the `NavBar` import/usage and any `min-h-screen bg-appbg` wrapper now owned by AppShell; keep only the page body.
- [x] 3.2 `pages/parent/ChildDetail.jsx`: same — drop `NavBar` and outer wrapper.
- [x] 3.3 `pages/parent/Settings.jsx`: same — drop `NavBar` and outer wrapper.
- [x] 3.4 `pages/parent/TaskManager.jsx`: confirm it renders correctly inside AppShell (it has its own header/back action per DESIGN.md §5 Screen 3) and remove any duplicate top-level page chrome if present.
- [x] 3.5 `pages/child/Dashboard.jsx`: remove the `BottomTabBar` import/usage and outer wrapper; keep the in-content kid greeting/balance header.
- [x] 3.6 `pages/child/Allowance.jsx`: remove the `BottomTabBar` import/usage and outer wrapper; keep the in-content Wallet header.
- [x] 3.7 `pages/Calendar.jsx`: remove the `isParent` header fork, the `NavBar` import, and the `BottomTabBar` import; render only the month nav + grid + legend body inside AppShell.

## 4. Retire old component

- [x] 4.1 Delete `client/src/components/NavBar.jsx` (or repurpose it as `TopBar.jsx`) and confirm no remaining imports reference it (`grep -rn NavBar client/src`).

## 5. Verify

- [x] 5.1 Run `npm run dev`; log in as parent (`parent@example.com` / `password123`) and confirm: top bar shows logo + logout (+ New Task), bottom bar shows Home/Calendar/Settings, active tab tracks the route, and no content is hidden behind the fixed bars.
- [x] 5.2 Log in as a child (Alex, PIN `1234`) and confirm: top bar shows logo + logout (no New Task), bottom bar shows Chores/Calendar/Wallet with no logout item, and logout from the top bar returns to the login screen.
- [x] 5.3 Visit `/calendar` as both roles and confirm the shared chrome renders and calendar events still load.
