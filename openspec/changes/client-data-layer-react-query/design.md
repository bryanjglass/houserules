## Context

React 18 + Vite + React Router client. Data access today is raw `axios` (`client/src/api/client.ts`, baseURL `/api`, `withCredentials`, a 401 interceptor that calls a handler `AuthContext` registers). Each page holds its own `useState` for the data plus a `useCallback` `refresh` invoked from `useEffect` and re-invoked via an `onUpdate`/`onAdded` callback passed into `TaskCard`/`AddChildModal`. Response shapes are typed in `client/src/types/models.ts`. `AuthContext` separately owns `user` (`undefined`=loading, `null`=logged out) via `GET /auth/me` and the login/register/logout mutations, and registers the axios 401 handler.

This change introduces a query cache without touching the server or the auth boundary.

## Goals / Non-Goals

**Goals:**
- One shared cache for all server reads: dedup in-flight requests, cache across navigation, background revalidation.
- Mutations declare which queries they invalidate; no component passes a refresh callback to another.
- A failed load is visibly an error with a retry, not a blank or a silent `null`.
- A render error is contained by a boundary; loading is one shared component.

**Non-Goals:**
- No server/API changes.
- `AuthContext` is not moved into the cache (it owns the tri-state loading contract + 401 interceptor). Auth mutations stay as they are.
- No optimistic updates this change — invalidate-on-success only (correct, simplest; optimistic UI can come later now that a cache exists).
- No client test harness, no shared types package (separate changes).

## Decisions

### 1. TanStack Query v5, provider at the root
Add `@tanstack/react-query` and wrap `<App>` in `QueryClientProvider` in `main.tsx`. A single `QueryClient` lives in `client/src/api/queryClient.ts` with defaults tuned for this app:
- `staleTime: 15_000` — brief caching so back-and-forth navigation doesn't refetch, while approvals/edits still feel live (mutations invalidate immediately regardless).
- `refetchOnWindowFocus: false` — avoid surprise refetches in a PWA/Capacitor shell.
- `retry`: do not retry 4xx (especially 401, which the axios interceptor already turns into a logout); retry a transient error once.

*Alternatives:* SWR (lighter, but weaker mutation/invalidation ergonomics and no devtools-grade cache control); a hand-rolled context cache (reinvents dedup/invalidations). Rejected.

### 2. A query-key factory
`client/src/api/keys.ts` centralizes keys so reads and invalidations can't drift:
```ts
export const keys = {
  children: ['children'] as const,
  tasks: ['tasks'] as const,
  allowance: (childId: string) => ['allowance', childId] as const,
  allowanceAll: ['allowance'] as const,        // prefix for invalidate-all
  goal: (childId: string) => ['goal', childId] as const,
  goalAll: ['goal'] as const,
  calendar: (startISO: string, endISO: string) => ['calendar', startISO, endISO] as const,
  householdCode: ['householdCode'] as const,
  timezone: ['timezone'] as const,
  devices: ['devices'] as const,
};
```
Invalidation uses prefix matching (`queryClient.invalidateQueries({ queryKey: ['allowance'] })`) to refresh every child's balance at once after an approval/adjustment.

### 3. Read hooks (`queries.ts`)
Thin `useQuery` wrappers returning typed data, e.g.:
```ts
export const useTasks = () =>
  useQuery({ queryKey: keys.tasks, queryFn: () => api.get('/tasks').then(r => r.data as TaskView[]) });
export const useAllowance = (childId?: string) =>
  useQuery({ enabled: !!childId, queryKey: keys.allowance(childId!), queryFn: () => api.get(`/allowance/${childId}`).then(r => r.data as Allowance) });
export const useGoal = (childId?: string) =>
  useQuery({ enabled: !!childId, queryKey: keys.goal(childId!), queryFn: () => api.get(`/goals/${childId}`).then(r => (r.data.goal ?? null) as GoalView | null) });
```
`useCalendar(startISO, endISO)` keys on the range so each month is cached separately. `enabled` gates the child-scoped queries until the id is known (the child pages depend on `useAuth().user`).

### 4. Mutation hooks (`mutations.ts`) own invalidation
Each write is a `useMutation` whose `onSuccess` invalidates the affected keys, replacing the callback plumbing. The invalidation map:
- **Task writes** (create, update, mark-done, parent-complete, approve, reject, claim, log-units, delete): invalidate `tasks`, `allowance` (approval credits, prefix-all), `goal` (balance affects progress, prefix-all), and `calendar`.
- **Allowance adjust:** invalidate `allowance`, `goal`.
- **Goal writes** (create, patch, delete, request-cash-in, approve, reject): invalidate `goal`, `allowance`.
- **Child create:** invalidate `children`.
- **Timezone save:** invalidate `timezone`, `tasks`, `calendar` (due-day math depends on the zone).
- **Household-code rotate:** invalidate `householdCode`. **Device revoke:** invalidate `devices`.

Mutations expose `mutateAsync` so callers that need to act on the result (e.g. `TaskForm` navigating, `claim` catching a 409) can `await`. Domain UX (confirm dialogs, the 409 "already grabbed" alert, per-unit quantity) stays in the component; the hook just performs the call and invalidates.

### 5. `TaskCard` drops `onUpdate`
`TaskCard` currently calls `api.*` then `onUpdate()`. It instead uses the task mutation hooks; invalidation refreshes every subscribed list (parent dashboard, child dashboard, child detail) automatically. The `onUpdate` prop is removed from `TaskCard` and from all call sites. `AddChildModal` likewise drops `onAdded` (its `useCreateChild` invalidates `children`); it keeps `onClose`.

### 6. Loading / error UX
- `components/Loading.tsx` — the shared centered indicator replacing the seven inline `"Loading…"` blocks.
- `components/QueryBoundary.tsx` — given a query's `{ isPending, isError, refetch }`, renders `<Loading>` while pending, an error card with a **Try again** button on error, else the children. Pages use it (or its inlined equivalent) so a failed `/tasks` or `/allowance` shows a retry, not a blank.
- `components/ErrorBoundary.tsx` — a class boundary wrapping the routed tree in `App.tsx`; on a render throw it shows a friendly fallback with a reload action instead of a white screen.
- Forms (`AddChildModal`, the `ChildDetail` adjust/goal forms) clear their error state when the user edits the offending field, so a stale error doesn't linger.

### 7. Child pages and `enabled`
`ChildDashboard`/`ChildAllowance` derive `childId` from `useAuth().user`. The child-scoped queries pass `enabled: !!user`, so they no-op until auth resolves and there is no `user ? … : Promise.resolve(null)` branching. `Calendar` computes its visible range from `viewDate` and keys the query on it.

## Risks / Trade-offs

- **Broad invalidation over precise cache surgery** → after an approval we invalidate all balances/goals rather than patching one entry. Simpler and correct; the extra refetches are small and deduped. Optimistic/precise updates can come later.
- **`staleTime` tuning** → too high feels stale, too low refetches constantly. 15s + invalidate-on-mutation keeps actioned data live while smoothing navigation. Adjustable in one place.
- **Large diff across many pages** → mitigated by keeping each page's markup intact and swapping only the data-access lines; verify via `typecheck` + client `build`. No server or auth behavior changes.
- **Double source of truth during transition** → all reads move in one change; no page keeps a parallel `useEffect` fetch for the same data, avoiding cache-vs-local divergence.

## Migration Plan

Additive and client-only. `npm install` pulls `@tanstack/react-query`; no env, schema, or server changes. Railway build/deploy unchanged. Rollback is reverting the branch.

## Open Questions

- Should the React Query Devtools be bundled in dev only? (Lean: skip for now to keep the dep surface minimal; easy to add later.)
- Is 15s the right default `staleTime` for the approval-heavy parent flow, or should task lists be `0` (always revalidate on focus/mount)? (Lean: 15s globally; revisit if approvals feel laggy.)
