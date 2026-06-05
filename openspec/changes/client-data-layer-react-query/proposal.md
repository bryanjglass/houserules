## Why

Every client page fetches server data with raw axios + `useState`/`useEffect`, and every mutation refreshes the screen through a hand-threaded `onUpdate`/`refresh` callback. This is the Tier 2 finding from the architecture review:

- **Duplicate, uncoordinated requests.** `GET /tasks` is fetched independently in `ParentDashboard`, `ChildDashboard`, `ChildDetail`, and `Calendar`; `/allowance/:id` and `/goals/:id` are each fetched in 2–3 places. Nothing dedupes or caches them, so navigating between screens re-fetches everything, and `ParentDashboard` fans out an N+1 of `/allowance/:id` calls per child on every visit.
- **Manual cache-busting via callbacks.** `TaskCard` takes an `onUpdate` prop that each parent wires to a `refresh()` that re-fetches 2–4 endpoints in a `Promise.all`. A single action (mark done, approve) refetches the whole screen. The callback is prop-drilled through every list.
- **Silent failures.** Fetches use `.catch(() => null)` / `.catch(() => setNotFound(true))`, so a failed load is indistinguishable from "no data." There is no error boundary; a render throw takes down the whole SPA. Loading is an ad-hoc `"Loading…"` string repeated in seven files, and form errors are never cleared once shown.

## What Changes

- **Adopt TanStack Query (`@tanstack/react-query`).** Add a `QueryClientProvider` at the app root and move all server reads behind typed query hooks (`useChildren`, `useTasks`, `useAllowance`, `useGoal`, `useCalendar`, `useHouseholdCode`, `useTimezone`, `useDevices`). The shared cache dedupes in-flight requests, caches across navigation, and revalidates in the background.
- **Replace callback refresh with cache invalidation.** Convert every write to a mutation hook (`useMarkTaskDone`, `useApproveTask`, `useCreateTask`, `useAdjustAllowance`, `useCreateChild`, `useSaveTimezone`, …) that invalidates the affected query keys on success. Drop the `onUpdate`/`onAdded`/`refresh` plumbing — `TaskCard` and the forms own their mutations, and any subscribed view updates automatically.
- **Consolidate loading and error UX.** Add a reusable `<Loading>` indicator and a `<QueryBoundary>`/error-state helper that renders a retry affordance when a query fails (instead of a blank or silent screen), and wrap the routed app in an `<ErrorBoundary>` so a render error shows a fallback rather than a white screen. Clear form errors on edit.

Valid behavior and the API contract are unchanged; this is a client-internal data-layer refactor. Auth state stays in `AuthContext` (it owns the `undefined`/`null`/user loading contract and the 401 interceptor); the existing 401-clears-session behavior is preserved because the query hooks use the same axios instance.

## Capabilities

### New Capabilities
- `client-data-layer`: The client fetches server data through a shared query cache that dedupes and caches requests; mutations invalidate the affected queries so dependent views refresh without manual callbacks; failed loads surface a retry affordance and a render error is contained by an error boundary.

## Impact

- **Client deps:** add `@tanstack/react-query` (^5).
- **New files:** `client/src/api/queryClient.ts` (configured `QueryClient`), `client/src/api/keys.ts` (query-key factory), `client/src/api/queries.ts` (read hooks), `client/src/api/mutations.ts` (write hooks + invalidation), `client/src/components/Loading.tsx`, `client/src/components/QueryBoundary.tsx` (loading/error/retry wrapper), `client/src/components/ErrorBoundary.tsx`.
- **Wiring:** `client/src/main.tsx` wraps `<App>` in `QueryClientProvider`; `client/src/App.tsx` wraps routes in `<ErrorBoundary>`.
- **Refactors (remove local `useState`/`useEffect`/`refresh`):** `pages/parent/Dashboard.tsx`, `pages/parent/ChildDetail.tsx`, `pages/parent/Settings.tsx`, `pages/child/Dashboard.tsx`, `pages/child/Allowance.tsx`, `pages/Calendar.tsx`, `components/TaskCard.tsx` (drop `onUpdate`), `components/TaskForm.tsx` (use create/update mutations), `pages/parent/AddChildModal.tsx` (drop `onAdded`).
- **Correctness gate:** `npm run typecheck` + `npm run build --workspace=client` (no client test setup in this change).
- **Non-goals:** no server changes; no shared cross-workspace types package; no migration of `AuthContext` into the query cache; no optimistic updates (invalidation only) — optimistic UI can follow once the cache exists; no client unit-test harness (separate change).
