## Why

The single `Task` table has become the project's main source of edge cases and bugs: one table encodes four different things (one-off tasks, recurring chains, up-for-grabs pool chores, per-unit definitions *and* their logged completions) via nullable-flag combinations, and visibility of future occurrences requires writing rows during reads (`anchorUndatedRecurring`, `backfillCatchUpOccurrences`, `ensureLiveTips`), which is where the race-condition and healing complexity concentrates. We are redesigning the domain model now, with no data-migration requirement (dev/prod data may be dropped and recreated).

## What Changes

- **BREAKING**: Replace the `Task` model with two models: `Chore` (the parent-edited definition: kind, reward, schedule, assignee) and `ChoreCompletion` (a child's work record: status, quantity, snapshot reward).
- **BREAKING**: Occurrences of recurring chores are *projected* at read time from the definition's schedule; completion rows are created only by user actions (complete, claim, log, mark-done). `GET` endpoints never write.
- **BREAKING**: Replace the `/api/tasks` route family with `/api/chores` endpoints shaped around definitions + completions; the client task pages, API layer, and types are rewritten accordingly.
- Chore kind becomes an explicit discriminator: `ASSIGNED` | `OPEN` (up-for-grabs) | `PER_UNIT`, eliminating the `isUpForGrabs`/`assignedToId`/`isPerUnit`/`quantity` flag-combination states.
- Due dates become day-granular household-local date keys (`YYYY-MM-DD` strings) instead of local-noon-stamped `DateTime`s; occurrence identity is exact string equality.
- Claiming an `OPEN` chore creates the completion row; a `@@unique([choreId, occurrenceKey])` constraint makes the claim race atomic (loser gets 409).
- Catch-up becomes a per-chore *missed-occurrence policy* (`CURRENT_ONLY` vs `BACKFILL_14D`) evaluated at projection time — no backfilled rows.
- Chore definitions are archived (`archivedAt`), not deleted, preserving completion/transaction history; `Transaction.taskId` becomes `completionId`.
- Seed data and the demo flow are rebuilt on the new model. The old `Task` table, its routes, and the three read-time generation passes are removed.

## Capabilities

### New Capabilities
- `chore-lifecycle`: Core domain model — chore definitions (kinds, rewards, schedules, archiving), completion records (statuses PENDING → COMPLETED → APPROVED, rejection), read-time occurrence projection, approval crediting via transactions, and the never-write-on-read rule.

### Modified Capabilities
- `task-recurrence`: Recurrence lives only on the definition; next-occurrence and weekly-day rules are unchanged in math but produce projections, not spawned rows; catch-up is restated as a projection policy instead of read-time backfill; approval no longer spawns anything.
- `up-for-grabs-chores`: The pool is the set of active `OPEN` chores whose current occurrence has no completion; claiming creates the completion row atomically via unique constraint; "flag persists after claim" is replaced by "claimed = completion row exists"; rejected claims stay locked to the claimer because the row already exists.
- `per-unit-chores`: A `PER_UNIT` chore is always a definition; logging creates an independent completion (no occurrence key, so unlimited and race-free); the PENDING-forever definition row state is removed; deletion-with-pending-logs guard becomes an archive guard.
- `task-calendar`: Calendar events are materialized completions plus projections computed directly from definitions (no "active tip" selection); event identity uses day keys.

## Impact

- `server/prisma/schema.prisma`: `Task` replaced by `Chore` + `ChoreCompletion`; `Transaction.taskId` → `completionId`; new migration (recreate, no data migration).
- `server/src/routes/tasks.ts` (840 lines) replaced by a new `chores.ts`; `server/src/lib/recurrence.ts` and `lib/tz.ts` reworked around day-key strings; `server/src/schemas/task.ts` replaced.
- `server/src/routes/allowance.ts` / `transactions.ts`: updated for the renamed transaction link.
- Shared domain types in `server/src/types/domain.ts` and mirrored `client/src/types/domain.ts`; client API types in `client/src/types/models.ts`.
- Client: `client/src/api/*`, parent task pages (`client/src/pages/parent/`), child task pages (`client/src/pages/child/`), calendar UI.
- `server/prisma/seed.ts` rewritten for the new model.
- Push notification triggers move to the new action points (create-assigned, complete, approve).
