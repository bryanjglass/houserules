## 1. Data model & migration

- [ ] 1.1 In `server/prisma/schema.prisma`, add `isPerUnit Boolean @default(false)`, `unitReward Int?` (per-item cents), and `quantity Int?` to the `Task` model
- [ ] 1.2 Extend the doc-comment block above `Task` to document the per-unit definition vs completion states (definition: `isPerUnit=true, isUpForGrabs=true, assignedToId=null, status=PENDING, unitReward set`; completion: `isPerUnit=true, assignedToId=<kid>, quantity=N, unitReward inherited`)
- [ ] 1.3 Run `npm run db:migrate`; confirm the migration is additive (all new columns nullable / defaulted) with no backfill

## 2. Server — create

- [ ] 2.1 `POST /tasks`: accept `isPerUnit` and `unitReward`; when `isPerUnit`, require `title` and `unitReward > 0`, and force `isUpForGrabs=true`, `assignedToId=null`, `isRecurring=false`, `dollarAmount=null`, `status=PENDING`
- [ ] 2.2 Leave the existing normal / up-for-grabs / recurring creation path unchanged for non-per-unit chores

## 3. Server — log a count

- [ ] 3.1 Add `POST /tasks/:id/log-units` (child-only via role check); parse `quantity` and reject unless it is an integer ≥ 1
- [ ] 3.2 Validate the target is a per-unit definition in the child's household pool: `isPerUnit`, `isUpForGrabs`, `assignedToId === null`, `status === 'PENDING'`, and `createdById === requesting child's parentId` (mirror the `/claim` household guard)
- [ ] 3.3 Create a completion instance: `isPerUnit=true`, `isUpForGrabs=false`, `assignedToId=child`, `quantity=N`, `unitReward` copied from the definition, `dollarAmount=null`, `status='COMPLETED'`, `completedAt=now`, `templateId = definition.templateId || definition.id`; leave the definition untouched so it stays open

## 4. Server — approve, reject, claim guard

- [ ] 4.1 `POST /tasks/:id/approve`: read optional `quantity` from the body; for a per-unit completion compute `effectiveQty = (valid body quantity ≥ 1) ?? task.quantity`, persist it to the row if changed, and credit `unitReward × effectiveQty` as the single `EARNED` transaction (`userId = assignedToId`, `taskId = completion.id`); keep the existing flat `dollarAmount` path for other tasks
- [ ] 4.2 Confirm the per-unit definition can never be approved/credited (approve requires `status === COMPLETED`; the definition stays `PENDING`)
- [ ] 4.3 `POST /tasks/:id/reject`: for a per-unit completion, delete the instance (discard the log) instead of flipping it back to `PENDING`; leave the existing back-to-`PENDING` behavior for other tasks
- [ ] 4.4 `POST /tasks/:id/claim`: add an early `if (task.isPerUnit) → 400` so a per-unit definition cannot be claimed/locked through the grab path

## 5. Client — types

- [ ] 5.1 Add `isPerUnit?: boolean`, `unitReward?: number | null`, `quantity?: number | null` to `TaskView` in `client/src/types/models.ts` (no `domain.ts` change — no new status)

## 6. Client — create form

- [ ] 6.1 In `client/src/pages/parent/TaskManager.tsx`, add a "Pay per item" toggle (reuse the existing switch pattern) that, when on, shows a "Reward per item" `$` field and hides the assignee, "Up for grabs", and recurring sections (mutually exclusive)
- [ ] 6.2 On submit when per-unit, POST `{ title, description, isPerUnit: true, unitReward: dollarsToCents(reward) }` (omit `assignedToId`, `dollarAmount`, recurrence); validate `unitReward > 0`

## 7. Client — task card

- [ ] 7.1 In `client/src/components/TaskCard.tsx`, gate the existing "Grab it" button off for per-unit definitions (`childCanGrab && !task.isPerUnit`)
- [ ] 7.2 For a per-unit definition in the pool (child view), render a count number input (min 1) + "Log it" button calling `POST /tasks/:id/log-units { quantity }`, and show the rate (e.g. `formatCents(unitReward)` "/each")
- [ ] 7.3 For a per-unit completion (child view), suppress "Mark Done" and show the count and computed pay `formatCents(unitReward × quantity)` (money-600 bold) with the existing Waiting/Done pill
- [ ] 7.4 For a per-unit completion (parent review), show an editable count pre-filled with `quantity` and a live computed amount; Approve posts `{ quantity }`; Reject uses the existing handler (server deletes)

## 8. Client — dashboards

- [ ] 8.1 In `client/src/pages/parent/Dashboard.tsx`, exclude per-unit definitions from "Outstanding Chores" (`!(t.isPerUnit && t.isUpForGrabs && !t.assignedToId)`); optionally add a small section listing definitions so the parent can see/delete them
- [ ] 8.2 Confirm `client/src/pages/child/Dashboard.tsx` needs no change: definitions land in `poolTasks` and completions in `ownTasks`

## 9. Verification

- [ ] 9.1 `npm run db:migrate` then `npm run typecheck` (the only correctness gate) — both workspaces pass
- [ ] 9.2 Manual: parent creates "Pick up dog poop — $1.00 / item" per-unit chore → it appears in each child's "Up for Grabs" with a count input (no "Grab it") and NOT in the parent's "Outstanding Chores"
- [ ] 9.3 Manual: Alex logs 10 and Sam logs 10 → two completions appear in parent "Needs Approval"; approve Alex at 10, edit Sam to 8 and approve → `GET /api/allowance/:alexId` shows +$10.00, `:samId` shows +$8.00, each backed by one `EARNED` transaction; the definition stays open in the pool
- [ ] 9.4 Manual: reject a bogus logged completion → the instance disappears and the definition remains loggable; confirm `/claim` on a per-unit definition is rejected
