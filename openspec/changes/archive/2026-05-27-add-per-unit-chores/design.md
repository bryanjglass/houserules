## Context

A `Task` today carries one `status` and one `assignedToId`, so a single row can represent at most one child's one attempt at one chore. The up-for-grabs feature added a household pool (`isUpForGrabs=true, assignedToId=null, createdById=parent`) and a first-come `claim` that locks the row to one child. The recurring feature added a `templateId`/`instances` self-relation and a "spawn the next instance on approval" path. Approval runs in a `$transaction` that flips `COMPLETED→APPROVED` (atomically, as a race guard) and writes one `EARNED` `Transaction` for the flat `dollarAmount`; `Transaction.taskId` is `@unique`, so there is exactly one transaction per task. Balance is derived (sum of a child's transactions) and never stored.

The per-unit chore needs the opposite of claim/lock: one shared definition that stays open while **many** independent per-child completions accrue against it. The design reuses the `templateId`/`instances` relation and the approve→transaction path rather than adding new tables or statuses.

## Goals / Non-Goals

**Goals:**
- Represent an open, unlimited, per-item-priced household chore that every child sees.
- Let any child log a count any number of times without consuming the chore or blocking siblings.
- Credit each child `unitReward × count`, with the parent able to correct the count at approval.
- Reuse the existing pool visibility, approve transaction, and `templateId` chaining; add no new `TaskStatus` and no new tables.

**Non-Goals:**
- Capped/finite quantity pools that draw down to zero (v1 is unlimited only).
- Fixed-pot splitting (one total divided by share of work).
- A child editing a submitted count in place (reject discards; they re-log).
- Per-unit chores on the calendar (no recurrence; out of scope for v1).

## Decisions

### Definition + completion instances, not a new table

A per-unit chore is one **definition** row plus N **completion** rows linked by the existing `templateId` self-relation:

| Row | `isPerUnit` | `isUpForGrabs` | `assignedToId` | `status` | `unitReward` | `quantity` | `dollarAmount` |
|---|---|---|---|---|---|---|---|
| definition | `true` | `true` | `null` | `PENDING` (forever) | set | `null` | `null` |
| completion | `true` | `false` | `<kid>` | `COMPLETED`→`APPROVED` | inherited | `N` | `null` |

The definition rides the existing household-pool query unchanged. Each completion is its own `Task`, which (a) preserves the one-transaction-per-task invariant (`Transaction.taskId @unique`), (b) reuses the existing approve/reject lifecycle and `TaskCard`, and (c) keeps balance a plain sum with **no change** to `server/src/lib/balance.ts`. *Alternative considered:* a `TaskCompletion` junction table — rejected as more code (new model, endpoints, parent-review source) for no benefit over reusing `templateId`/`instances`.

### Three new fields, `dollarAmount` stays null on per-unit rows

Add `isPerUnit Boolean @default(false)`, `unitReward Int?` (per-item cents), `quantity Int?` (units on a completion). Keep `dollarAmount` **null** on both per-unit rows so the existing approve branch `if (task.dollarAmount)` is never accidentally taken for them; the credit comes from a new per-unit branch instead. The completion copies `unitReward` (and stores `quantity`) onto itself so it is self-sufficient for display and payout even if the definition is later deleted. *Alternative considered:* overloading `dollarAmount` as the per-unit rate — rejected because it would entangle the two payout paths and the flat-vs-per-unit display.

### Log, don't claim — a new endpoint

`POST /tasks/:id/log-units { quantity }` (child-only) validates the target is a per-unit definition in the child's household pool (`isPerUnit`, `isUpForGrabs`, `assignedToId === null`, `status === PENDING`, `createdById === child.parentId` — mirroring the `/claim` household guard) and a positive integer count, then **creates** a completion instance (`COMPLETED`, `assignedToId=child`, `quantity=N`, `templateId = definition.templateId || definition.id`). The definition is untouched, so it stays open and unlimited. Each log is an independent INSERT, so concurrent logs from one or many children never race (unlike `/claim`'s single-winner conditional update). A separate endpoint is required because `/claim` *locks* the shared row and `PUT /tasks/:id` *flips* it in place — both would consume the definition and block siblings.

### Approval multiplies by an adjustable count

In the existing approve `$transaction`, after the `COMPLETED→APPROVED` flip, branch on `task.isPerUnit`: read an optional `quantity` from the body, compute `effectiveQty = (valid body.quantity) ?? task.quantity`, persist it back to the row if changed, and credit `unitReward × effectiveQty` as the single `EARNED` transaction (`userId = assignedToId`, `taskId = completion.id`). The flat path (`dollarAmount`) is unchanged. Per-unit completions are never recurring, so the spawn block is inert. The definition can never reach this code because approve requires `status === COMPLETED` and the definition stays `PENDING`.

### Reject discards the completion

For a per-unit completion, reject **deletes** the instance instead of sending it back to `PENDING`. A disputed log is disposable — the child re-logs a corrected count from the still-open definition — which avoids a dangling locked/`REJECTED` row that has no re-submit path. The flat-task reject (back to `PENDING`) is unchanged.

### Claim rejects per-unit definitions

Because per-unit definitions share the pool's `isUpForGrabs=true, assignedToId=null` shape, the existing `/claim` could otherwise lock one. Add an early `if (task.isPerUnit) → 400` so a stale UI cannot consume a definition through the grab path.

## Risks / Trade-offs

- **Parent dashboard "Outstanding Chores" sweeps in the definition** (it is `PENDING`). Mitigation: exclude per-unit definitions from that list (`!(isPerUnit && isUpForGrabs && !assignedToId)`); they belong to the pool, not the awaiting-completion list.
- **Deleting a definition that still has completion instances** could hit a SQLite FK constraint via `templateId`. Mitigation: completions copy `unitReward`+`quantity` so they remain self-sufficient; the DELETE handler should refuse to delete a definition with un-approved instances or null out children's `templateId` first. Verify exact Prisma/SQLite behavior during implementation.
- **A child logging many times before approval** produces several pending completions; each is approved/rejected independently. Accepted as correct behavior.
- **Rewards speed of logging over honesty of count** — mitigated by the parent's adjustable count at approval and reject-discards.
- **Two toggles ("Up for grabs" and "Pay per item") both imply the pool** could confuse the create form. Mitigation: make them mutually exclusive with clear helper text; per-unit hides the assignee and recurring sections.

## Migration Plan

1. Edit `schema.prisma`: add `isPerUnit Boolean @default(false)`, `unitReward Int?`, `quantity Int?` to `Task`; extend the doc-comment block above the model to document the definition/completion states.
2. `npm run db:migrate` to generate and apply the Prisma migration. All columns are nullable or defaulted — no data backfill; existing rows become `isPerUnit=false` (ordinary tasks).
3. Deploy: Railway runs `prisma migrate deploy` on release. **Rollback:** the columns are additive and unused by existing flows, so reverting the code is safe and the migration is non-destructive.
