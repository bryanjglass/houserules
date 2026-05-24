## Context

MilkMoney tracks a child's allowance as a **derived** value: `GET /api/allowance/:childId` sums every `Transaction` for the child on the fly (types `EARNED` and `ADJUSTMENT` today). Tasks credit the balance through an approval state machine (`PENDING → COMPLETED → APPROVED`/back), and `Transaction` already carries an optional unique `taskId` FK whose title is rendered via a live join in `allowance.js`. Authorization is uniformly `child.parentId !== req.user.id` plus `requireRole('PARENT')` on parent-only endpoints.

Savings goals add a per-child target the balance can be measured against, with a cash-in flow that deliberately reuses the existing approval rhythm. The central constraint is to introduce goals **without** disturbing the derived-balance invariant.

## Goals / Non-Goals

**Goals:**
- A goal is a pure overlay on the single balance pool — it never moves, locks, or partitions money except for one transaction at cash-in.
- Progress is always derived (`balance / target`), never stored, so the future multi-goal iteration shares the one pool for free.
- Cash-in mirrors task approval: child requests, parent approves/rejects.
- Keep the balance math in `allowance.js` unchanged — a `REDEEMED` row is just another summed transaction.

**Non-Goals (deferred):**
- Multiple simultaneous goals (v1 enforces one via an API guard, not the schema).
- Goal icons/images.
- Frozen-ledger title snapshots (history stays a live join, consistent with tasks).
- Partial or actual-cost redemption (cash-in always deducts the exact target).

## Decisions

### One pool, derived progress (overlay), not envelopes
A goal stores only `targetAmount`; progress is computed against the live derived balance at read time. No `savedAmount` column, no allocation transactions.
- **Why:** Preserves the derived-balance invariant and makes the multi-goal future automatic — every goal reads the same balance, so cashing in an easy goal mechanically drops a stretch goal's progress. *Alternative considered:* envelope/allocation model with per-goal buckets — rejected as heavier, and it would force the balance to become partitioned state the app deliberately avoids.

### Cash-in is a status machine that mirrors tasks
`SavingsGoal.status ∈ ACTIVE | REDEEM_REQUESTED | REDEEMED`. Child request: `ACTIVE → REDEEM_REQUESTED` (guarded by `balance ≥ target`). Parent approve: `REDEEM_REQUESTED → REDEEMED` (re-checks `balance ≥ target`, writes the transaction). Parent reject: `REDEEM_REQUESTED → ACTIVE`.
- **Why:** Reuses the mental model and authorization patterns already in `tasks.js`; money only leaves after a parent gate. *Alternative considered:* child cashes in directly — rejected because redemption is a real-world handover the parent should confirm.

### Redemption writes one negative transaction, atomically
On approval, inside a Prisma `$transaction`: flip status to `REDEEMED`, set `redeemedAt`, and create `Transaction { type: 'REDEEMED', amount: -target, goalId }`. Re-verify `balance ≥ target` *inside* the transaction before writing.
- **Why:** Mirrors the approval `$transaction` in `tasks.js`; atomicity prevents a status flip without a matching ledger row. The re-check guards against the balance having dropped after the request.

### `Transaction` gains an optional unique `goalId` FK; titles via live join
Add `goalId String? @unique` + relation, paralleling the existing `taskId`. `REDEEMED` is added to the documented `type` set. History renders the title by joining to the goal (`include: { goal: { select: { title: true } } }`), exactly as tasks do today.
- **Why:** Consistent with the established pattern; one nullable column for the one new source type. *Alternative considered:* snapshot the title into `note` (frozen ledger) — rejected for v1 because the app renders task titles via live join too, so snapshotting goals alone would be inconsistent; making the ledger fully frozen is a larger, app-wide change.

### One-active-goal enforced at the API, not the schema
The schema allows many `SavingsGoal` rows per child. The create endpoint rejects (409) a second non-redeemed goal.
- **Why:** Lifting the v1 limit later is just deleting the guard; no migration needed for the multi-goal iteration.

### New route module, not folded into allowance
Goals live in a new `server/src/routes/goals.js` (parent CRUD, child request, parent approve/reject), registered alongside the other routers. `allowance.js` is untouched except it MAY include the active goal in its response for display convenience.
- **Why:** Keeps the goal lifecycle cohesive and leaves the balance endpoint's responsibility narrow.

## Risks / Trade-offs

- **Stale reachability between request and approval** → The approval handler re-verifies `balance ≥ target` inside the `$transaction` and returns 400 if it no longer holds; the goal stays `REDEEM_REQUESTED` for the parent to retry or reject.
- **Live-join title fragility (rename/delete after redemption)** → Accepted for v1: goals are parent-owned and rarely deleted; matches current task behavior. Deleting a redeemed goal should be disallowed (or its `goalId` left nullable on the transaction) so history doesn't break — handled by only allowing delete on non-redeemed goals.
- **Negative amount semantics in balance sum** → `allowance.js` already sums signed amounts (ADJUSTMENT can be negative), so `REDEEMED` needs no special-casing; the risk is only if a future reducer special-cases types — kept out of scope.
- **Multi-goal assumptions leaking into v1 UI** → The child UI is built around a single active goal but reads progress from the derived balance, so the data path is already multi-goal-safe; only the presentation assumes one.

## Migration Plan

1. Add `SavingsGoal` model and `Transaction.goalId` to `schema.prisma`; document `REDEEMED` in the `Transaction.type` comment.
2. `npm run db:migrate` to generate the migration; `prisma generate`.
3. Deploy runs `prisma migrate deploy` (per `railway.toml`) — additive, nullable column and new table, no backfill required.
4. Rollback: the migration is additive; reverting code leaves the unused table/column harmless. No data transformation to undo.
