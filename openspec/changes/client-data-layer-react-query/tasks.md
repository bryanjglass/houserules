## 1. Provider and cache setup

- [x] 1.1 Add `@tanstack/react-query` (^5) to `client/package.json` and install
- [x] 1.2 Create `client/src/api/queryClient.ts` exporting a configured `QueryClient` (staleTime 15s, refetchOnWindowFocus false, retry skips 4xx/401 and retries once otherwise)
- [x] 1.3 Wrap `<App>` in `<QueryClientProvider client={queryClient}>` in `client/src/main.tsx`

## 2. Query keys, read hooks, mutation hooks

- [x] 2.1 Create `client/src/api/keys.ts` with the key factory (`children`, `tasks`, `allowance(childId)`/`allowanceAll`, `goal(childId)`/`goalAll`, `calendar(start,end)`, `householdCode`, `timezone`, `devices`)
- [x] 2.2 Create `client/src/api/queries.ts` with typed read hooks: `useChildren`, `useTasks`, `useAllowance(childId?)`, `useGoal(childId?)`, `useCalendar(startISO,endISO)`, `useHouseholdCode`, `useTimezone`, `useDevices` (child-scoped hooks gated with `enabled`)
- [x] 2.3 Create `client/src/api/mutations.ts` with write hooks that invalidate per the design map: task create/update/mark-done/parent-complete/approve/reject/claim/log-units/delete; allowance adjust; goal create/patch/delete/request-cash-in/approve/reject; child create; timezone save; household-code rotate; device revoke. Expose `mutateAsync` where callers need the result.

## 3. Loading / error UX components

- [x] 3.1 Create `client/src/components/Loading.tsx` (shared centered indicator)
- [x] 3.2 Create `client/src/components/QueryBoundary.tsx` rendering `<Loading>` on pending, an error card with a "Try again" button (calls `refetch`) on error, else children
- [x] 3.3 Create `client/src/components/ErrorBoundary.tsx` (class boundary with a fallback + reload action) and wrap the routed tree in `client/src/App.tsx`

## 4. Refactor read pages onto query hooks

- [x] 4.1 `pages/parent/Dashboard.tsx`: replace `useState`/`refresh` with `useChildren` + `useTasks` + per-child `useAllowance`; render shared loading/error; remove the `refresh` callback
- [x] 4.2 `pages/parent/ChildDetail.tsx`: use `useChildren` (or derive), `useTasks`, `useAllowance(childId)`, `useGoal(childId)`; move adjust/goal/cash-in writes onto mutation hooks; clear form errors on edit
- [x] 4.3 `pages/child/Dashboard.tsx`: use `useTasks` + `useAllowance(user.id)` + `useGoal(user.id)`; remove `refresh`
- [x] 4.4 `pages/child/Allowance.tsx`: use `useAllowance(user.id)` + `useGoal(user.id)`; cash-in via mutation hook
- [x] 4.5 `pages/Calendar.tsx`: use `useCalendar(startISO,endISO)` keyed on the visible range; show loading/error
- [x] 4.6 `pages/parent/Settings.tsx`: use `useHouseholdCode` + `useDevices` + `useTimezone`; rotate/save-tz/revoke via mutation hooks

## 5. Refactor write components, drop callbacks

- [x] 5.1 `components/TaskCard.tsx`: replace direct `api.*` + `onUpdate()` with task mutation hooks; remove the `onUpdate` prop and update all call sites (parent Dashboard, child Dashboard, ChildDetail)
- [x] 5.2 `components/TaskForm.tsx`: submit via `useCreateTask`/`useUpdateTask`; keep navigation behavior
- [x] 5.3 `pages/parent/AddChildModal.tsx`: submit via `useCreateChild`; remove `onAdded`, keep `onClose`; clear error on edit

## 6. Verification

- [x] 6.1 Run `npm run typecheck` across both workspaces and resolve any errors
- [x] 6.2 Run `npm run build --workspace=client` and confirm it succeeds
- [x] 6.3 Confirm no remaining page-level `useEffect`+`api.get` data fetches or `onUpdate`/`onAdded`/`refresh` refetch callbacks remain (grep) except inside `AuthContext`
- [x] 6.4 Reason through the key flows: approve a task → task lists + balance refresh; add a child → family list updates; a failed load shows a retry; a thrown render error shows the boundary fallback
