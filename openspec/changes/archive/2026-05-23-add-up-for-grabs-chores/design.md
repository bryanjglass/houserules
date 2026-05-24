## Context

Every `Task` today is owned by exactly one child via a **non-nullable** `assignedToId`, and that one column does quadruple duty: visibility (child list filters `assignedToId = me`), completion authority (`assignedToId === req.user.id`), payout (`Transaction.userId = assignedToId`), and household authorization (`assignedTo.parentId === parent.id`). There is no household identifier on a task — the household is derived through the assigned child. An unassigned "up for grabs" chore therefore has nowhere to live and no one who can see it under the current model. This design adds the minimum needed to represent and operate on unassigned chores while leaving the existing assigned-task flow untouched.

## Goals / Non-Goals

**Goals:**
- Represent an unclaimed household chore that all children in a household can see.
- Let the first child to claim a chore win it atomically (no double-grab race).
- After a claim, reuse the existing complete → approve → earn lifecycle with zero new code paths.
- Support recurring up-for-grabs chores that reopen to the pool on each respawn.

**Non-Goals:**
- A child releasing/un-grabbing a chore (follow-up).
- Splitting a payout or awarding consolation prizes — winner takes all.
- A separate "race to finish" model where multiple children submit completions (explicitly rejected during exploration in favor of claim/lock).
- Notifying children when a new chore is posted or grabbed.

## Decisions

### Two fields, three states — `isUpForGrabs` stays true after claim

Make `assignedToId` nullable and add `isUpForGrabs Boolean @default(false)`. The flag is **not** cleared on claim. This yields three unambiguous states:

| State | `isUpForGrabs` | `assignedToId` |
|---|---|---|
| normal task (unchanged) | `false` | `<kid>` |
| open pool | `true` | `null` |
| grabbed / locked | `true` | `<kid>` |

Keeping the flag set after a claim is what lets the recurring respawn know to reopen the chore, and it lets the UI badge a grabbed chore as "grabbed" (an up-for-grabs chore someone won). *Alternative considered:* clearing the flag on claim and inferring up-for-grabs-ness another way — rejected because the recurrence chain would lose the signal and re-lock to the winner.

### Household derived from `createdById`, not a new column

An open chore has no assignee, so we can't derive its household through the assignee. Rather than add a `householdId`, we use `createdById`, which is always the parent and already non-null. The child pool query is `{ isUpForGrabs: true, assignedToId: null, createdById: child.parentId }`. *Alternative considered:* a dedicated `householdId` on `Task` — rejected as redundant; `createdById` already encodes the household for every task.

### Claim is an atomic conditional write, not a read-modify-write

`POST /tasks/:id/claim` performs `prisma.task.updateMany({ where: { id, assignedToId: null, isUpForGrabs: true }, data: { assignedToId: child.id } })` and treats `count === 0` as "already grabbed" (HTTP 409). The `assignedToId: null` predicate in the WHERE clause is the lock: SQLite serializes the writes, so exactly one concurrent claim flips the row and the rest match zero rows. No `$transaction` or row locking needed. Household membership is verified separately (`child.parentId === task.createdById`) before/around the write so a cross-household claim is rejected.

### Ownership guards move from assignee to creator

The approve/reject/delete/edit handlers currently fetch the assignee and check `child.parentId !== req.user.id`. With a nullable assignee that dereference breaks for open chores. Since `createdById` is the parent for **every** task, these guards become `task.createdById !== req.user.id`. This is strictly simpler and correct for both old and new tasks. *Note:* this is a behavioral no-op for existing assigned tasks (a child's task is always created by that child's parent).

### Recurring respawn reopens the pool

In the approval `$transaction`, the spawned next instance sets `assignedToId: task.isUpForGrabs ? null : task.assignedToId` and carries `isUpForGrabs` forward. Everything else in the spawn (title, amount, recurrence, weeklyDays, templateId chaining) is unchanged.

### Query surface broadened in two places, both roles

`GET /tasks` and `GET /tasks/calendar` both filter on `assignedToId`. Each gains an OR branch so open chores surface: for a child, household-pool chores (`createdById = parentId, assignedToId = null, isUpForGrabs = true`); for a parent, their own open chores (`createdById = me`). Projection logic for recurring occurrences is unaffected — it keys off `dueDate`/`recurrence`, not assignment.

## Risks / Trade-offs

- **Existing rows after the migration have `isUpForGrabs = false`** → fine; the default makes every pre-existing task a normal assigned task, no backfill needed.
- **Nullable `assignedToId` could mask a bug where an assigned task loses its assignee** → mitigation: the only code path that writes `null` is open-chore creation and recurring respawn of an up-for-grabs chore; all guards that read the assignee now tolerate `null` explicitly.
- **"First to claim" rewards speed of grabbing, not doing — a child could grab and sit on a chore** → accepted for v1; a release/reclaim or claim-expiry mechanism is a noted follow-up.
- **Calendar/list OR-branches must not leak cross-household open chores** → mitigation: the child branch is keyed on `createdById = child.parentId`, scoping strictly to the household; covered by spec scenarios.
- **Design tokens for the new badge** → per CLAUDE.md the "Up for grabs" badge token is added to `tailwind.config.js` and `docs/design/DESIGN.md` §1 (and the spec HTML kept in sync) within this change; no raw hex or arbitrary values.

## Migration Plan

1. Edit `schema.prisma`: `assignedToId String?`, add `isUpForGrabs Boolean @default(false)`.
2. `npm run db:migrate` to generate and apply the Prisma migration (new column is nullable / has a default — no data backfill required).
3. Deploy: Railway runs `prisma migrate deploy` on release. **Rollback:** the column is additive and the assignee is widened to nullable; reverting code is safe, and the migration can be rolled back since no existing data is destructively altered.
