## Why

Children earn allowance through approved tasks, but the balance is an abstract running total with nothing to aim at. A parent-set savings goal turns that balance into visible progress toward a real reward, giving kids a concrete reason to keep earning and parents a tool to encourage saving over spending.

## What Changes

- Parents can create, edit, and delete **one active savings goal per child** (a title + target dollar amount).
- The child's Dashboard and Allowance screens show the goal with a **derived progress bar** (current balance ÷ target) — no money is moved, locked, or partitioned.
- When the child's balance reaches the target, the child can request to **cash in** the goal; the parent approves or rejects, mirroring the existing task-approval flow.
- Approving a cash-in writes a single negative `REDEEMED` transaction for the target amount, so the existing derived-balance math reflects the spend automatically.
- The allowance transaction history gains `REDEEMED` entries (e.g. "Cashed in: Lego Set −$50"), rendered via a live join — consistent with how task titles render today.
- **Deferred (out of scope for v1):** multiple simultaneous goals, goal icons/images, frozen-ledger title snapshots, and partial/actual-cost redemption. The data model and progress derivation are designed so multiple goals (sharing the one balance pool) can be enabled later by removing a single API guard.

## Capabilities

### New Capabilities
- `savings-goals`: Parent-set savings goals for a child — goal lifecycle (create/edit/delete, request cash-in, approve/reject), derived progress against the single allowance balance, and the redemption transaction that records a cash-in.

### Modified Capabilities
<!-- No existing capability's requirements change. Balance derivation in allowance is unchanged; the REDEEMED transaction is just another summed row. -->

## Impact

- **Schema (`server/prisma/schema.prisma`):** new `SavingsGoal` model; `Transaction` gains an optional unique `goalId` FK + relation; `Transaction.type` documented to include `REDEEMED`. Requires a Prisma migration.
- **Server:** new goals route (`server/src/routes/`) for parent CRUD, child cash-in request, and parent approve/reject; reuses `requireAuth` / `requireRole('PARENT')` and the `child.parentId !== req.user.id` guard pattern. `allowance.js` balance math is **unchanged** (it already sums all transactions); its response may surface the active goal for display.
- **Client:** child `Dashboard.jsx` and `Allowance.jsx` render goal title, target, derived progress bar, and a "cash in" button enabled only when balance ≥ target; the parent's child-detail page gains goal create/edit/delete and cash-in approve/reject. UI follows `docs/design/DESIGN.md` (progress/amounts in `money-600`, status badges as `*-50` bg + `*-600` text, outline icons — no emoji).
