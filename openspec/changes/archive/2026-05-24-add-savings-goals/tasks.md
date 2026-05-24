## 1. Schema & migration

- [x] 1.1 Add `SavingsGoal` model to `server/prisma/schema.prisma` (`id`, `childId` FK User, `createdById` FK User, `title`, `targetAmount` Float, `status` String default `"ACTIVE"`, `createdAt`, `redeemedAt` DateTime?), with the named relations to `User` (child + creator)
- [x] 1.2 Add `goalId String? @unique` + `goal SavingsGoal?` relation to `Transaction`; add the back-relation `transaction Transaction?` on `SavingsGoal`
- [x] 1.3 Document the `REDEEMED` type and the goal `status`/state comments at the top of the schema (matching the existing comment style)
- [x] 1.4 Run `npm run db:migrate` to create the migration and regenerate the Prisma client

## 2. Goals API (server/src/routes/goals.js)

- [x] 2.1 Create the router with `requireAuth`, and a `getChildOrFail(childId, parentId, res)` helper reusing the `child.parentId !== req.user.id` pattern
- [x] 2.2 `POST /api/goals/:childId` (parent) — create a goal; validate title and positive `targetAmount`; reject with 409 if the child already has an `ACTIVE` or `REDEEM_REQUESTED` goal
- [x] 2.3 `PATCH /api/goals/:goalId` (parent) — edit title/target on a non-redeemed goal; re-validate positive target; no transaction/balance change
- [x] 2.4 `DELETE /api/goals/:goalId` (parent) — delete a non-redeemed goal only (block delete once `REDEEMED` so history stays intact)
- [x] 2.5 `POST /api/goals/:goalId/request-cash-in` (child, own goal only) — require derived balance ≥ target, transition `ACTIVE → REDEEM_REQUESTED`; else 400
- [x] 2.6 `POST /api/goals/:goalId/approve` (parent) — inside a Prisma `$transaction`, re-check balance ≥ target, set `REDEEMED` + `redeemedAt`, and create `Transaction { type: 'REDEEMED', amount: -target, goalId }`; 400 if balance no longer meets target
- [x] 2.7 `POST /api/goals/:goalId/reject` (parent) — transition `REDEEM_REQUESTED → ACTIVE`, no transaction
- [x] 2.8 `GET /api/goals/:childId` (parent or that child) — return the child's current goal with derived progress (balance, target, reachable flag)
- [x] 2.9 Register the goals router in the server app alongside the existing routers
- [x] 2.10 Compute derived balance via the same summing logic used in `allowance.js` (shared `lib/balance.js#getBalance`); `allowance.js` balance math unchanged

## 3. Allowance integration

- [x] 3.1 Include the linked goal title in transaction history (`include: { goal: { select: { title: true } } }`) so `REDEEMED` rows render as "Cashed in: <title>"
- [x] 3.2 (Optional) Skipped — the client fetches `GET /api/goals/:childId` directly, so the goal need not ride along on the allowance response

## 4. Child UI (read docs/design/DESIGN.md first)

- [x] 4.1 Goal fetch + request-cash-in via the existing `api` instance directly in the child pages (matches the codebase's no-service-layer convention)
- [x] 4.2 Build a goal-progress component: title, target (amounts in `money-600` bold), derived progress bar; reachable/in-progress status badge as `*-50` bg + `*-600` text; outline icons only (no emoji)
- [x] 4.3 Render the goal on child `Dashboard.jsx` and `Allowance.jsx`
- [x] 4.4 Add the "cash in" action, enabled only when balance ≥ target; reflect `REDEEM_REQUESTED` (awaiting-approval) state in the UI
- [x] 4.5 Show `REDEEMED` entries in the Allowance transaction history list

## 5. Parent UI (read docs/design/DESIGN.md first)

- [x] 5.1 Parent goal create/edit/delete + approve/reject via the existing `api` instance directly in `ChildDetail.jsx` (matches convention)
- [x] 5.2 On the parent child-detail page, add create/edit/delete goal controls (title + target form)
- [x] 5.3 Show a pending cash-in request with approve/reject actions when status is `REDEEM_REQUESTED`

## 6. Verify

- [x] 6.1 Manually walk the lifecycle: parent creates goal → child earns past target → child requests cash-in → parent approves → balance drops by target and a `REDEEMED` row appears in history
- [x] 6.2 Verify guards: second active goal rejected (409); cash-in blocked below target (400); cross-household access rejected (403); reject returns goal to `ACTIVE`
- [x] 6.3 Confirm derived balance equals the sum of all transactions including the negative `REDEEMED` entry
