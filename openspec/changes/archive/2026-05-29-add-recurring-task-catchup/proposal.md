## Why

Recurring tasks today are approval-gated and strictly serial: only one live instance exists at a time, and the next instance is spawned solely when a parent approves the current one. If a parent falls behind on approvals — or a child simply misses several days — the schedule stalls. A daily "get the mail" chore that has gone untouched for a week shows a single overdue instance instead of the seven the child actually missed, and the child cannot clear the backlog without the parent approving each one first. We want the schedule to run on wall-clock time so children can catch up on missed occurrences independently.

## What Changes

- Add an opt-in, per-task **catch-up** property (new `catchUp` boolean on `Task`). When enabled on a recurring, child-assigned task, missed occurrences are backfilled as real `PENDING` task rows the child can complete and the parent can approve individually.
- Backfilled occurrences are materialized **lazily on read** (`GET /api/tasks`) — there is no job runner in this stack — using the existing `nextDueDate` schedule logic, bounded by a **time window** (default 14 days, as a named constant) and the existing `MAX_STEPS` guard.
- For catch-up tasks, **approval credits the allowance per occurrence but no longer spawns the next instance**; a `!catchUp` guard on the approve-time spawn prevents double-generation. Each approved occurrence credits `dollarAmount`.
- Scope is limited to **normal child-assigned recurring tasks**. Up-for-grabs recurring chores and non-catch-up recurring tasks keep today's approve-time, single-tip spawn behavior unchanged.
- Add a catch-up toggle to the parent create/edit task form and document the control in `docs/design/DESIGN.md`.

## Capabilities

### New Capabilities
<!-- None: this extends existing recurrence behavior rather than introducing a new capability. -->

### Modified Capabilities
- `task-recurrence`: Adds a requirement that opt-in catch-up recurring tasks backfill missed occurrences as independent instances on read, windowed and bounded, and that approval of a catch-up occurrence credits the allowance without spawning a successor.

## Impact

- **Schema:** new `catchUp Boolean @default(false)` column on `Task` + Prisma migration.
- **Domain types:** mirror any new shape in `server/src/types/domain.ts` and `client/src/types/domain.ts` (kept in sync by hand — no shared package).
- **Server routes (`server/src/routes/tasks.ts`):** backfill-on-read in `GET /`; `!catchUp` guard on the approve-time spawn in `POST /:id/approve`; accept/persist `catchUp` in create (`POST /`) and edit (`PUT /:id`).
- **Client:** catch-up toggle in the parent task create/edit form; API model types in `client/src/types/models.ts`.
- **Design:** `docs/design/DESIGN.md` updated for the new toggle control.
- **Spec:** new requirement in `openspec/specs/task-recurrence/spec.md`.
- **Correctness gate:** `npm run typecheck` (no test suite in this repo).
