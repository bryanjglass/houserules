## 1. Schema & types

- [x] 1.1 Add `catchUp Boolean @default(false)` to the `Task` model in `server/prisma/schema.prisma`, with a comment noting it is meaningful only for child-assigned recurring tasks
- [x] 1.2 Create the Prisma migration (`npm run db:migrate`) for the new column
- [x] 1.3 Mirror the `catchUp` field on the relevant task API type in `client/src/types/models.ts` (and `server`/`client` `types/domain.ts` if a domain shape references it)

## 2. Backfill on read (server)

- [x] 2.1 Add a named constant `CATCHUP_WINDOW_DAYS = 14` near the top of `server/src/routes/tasks.ts`
- [x] 2.2 Implement a backfill helper that, for a catch-up template, walks `nextDueDate` from the chain's max `dueDate` (bounded by `MAX_STEPS`), and returns scheduled dates in `[now − CATCHUP_WINDOW_DAYS, now]` that have no existing instance at `(templateId root, dueDate)`
- [x] 2.3 Persist missing occurrences as `PENDING` rows carrying `title`, `description`, `dollarAmount`, `assignedToId`, `isRecurring`, `recurrence`, `weeklyDays`, `catchUp`, and `templateId = root`
- [x] 2.4 Guard the helper to only run for tasks where `isRecurring && recurrence && catchUp && assignedToId != null && !isUpForGrabs && dueDate != null`
- [x] 2.5 Wrap the existence-check-and-insert in a transaction that re-checks each `(root, dueDate)` immediately before insert to avoid concurrent-read duplicates
- [x] 2.6 Invoke the backfill in `GET /api/tasks` (for both parent and child reads) before returning the task list

## 3. Approval spawn guard (server)

- [x] 3.1 In `POST /:id/approve`, add a `!task.catchUp` condition to the recurring-spawn block so catch-up occurrences credit the allowance but do not spawn a successor
- [x] 3.2 Confirm non-catch-up recurring tasks (incl. up-for-grabs) still spawn their next instance exactly as before

## 4. Create / edit plumbing (server)

- [x] 4.1 Accept and persist `catchUp` in `POST /api/tasks` (only meaningful when recurring + assigned + not up-for-grabs; store `false` otherwise)
- [x] 4.2 Accept and update `catchUp` in `PUT /api/tasks/:id`, clearing it when recurrence is turned off or the task becomes up-for-grabs

## 5. Client UI

- [x] 5.1 Read the relevant `docs/design/DESIGN.md` section for form toggle/control patterns and cite it
- [x] 5.2 Add a catch-up toggle to the parent create/edit task form, shown only when the task is recurring and assigned to a child (hidden for up-for-grabs)
- [x] 5.3 Send `catchUp` through the task create/edit API calls
- [x] 5.4 Update `docs/design/DESIGN.md` (and the spec doc if applicable) to document the new toggle control, keeping them in sync

## 6. Verification

- [x] 6.1 Run `npm run typecheck` and resolve any errors across both workspaces
- [x] 6.2 Manually verify: a catch-up daily task with several missed days shows one overdue instance per missed day within the window after a list read
- [x] 6.3 Manually verify: completing and approving multiple backfilled occurrences credits the allowance once per occurrence and spawns no extra instance
- [x] 6.4 Manually verify: a non-catch-up recurring task and an up-for-grabs recurring chore behave exactly as before (single tip, approve-time spawn)
