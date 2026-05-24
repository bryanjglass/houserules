## 1. Data model & migration

- [x] 1.1 In `server/prisma/schema.prisma`, change `Task.assignedToId` to nullable (`String?`) and make the `assignedTo` relation optional
- [x] 1.2 Add `isUpForGrabs Boolean @default(false)` to the `Task` model, with a comment documenting the three states (normal / open pool / grabbed)
- [x] 1.3 Run `npm run db:migrate` to generate and apply the migration; confirm the migration is additive (nullable column, default) with no backfill

## 2. Server — create & claim

- [x] 2.1 `POST /tasks`: require `assignedToId` OR `isUpForGrabs`; when up-for-grabs, persist `isUpForGrabs: true` and leave `assignedToId` null; keep the existing household guard for the assigned case
- [x] 2.2 Add `POST /tasks/:id/claim` (child-only via role check): verify the task is `isUpForGrabs`, `PENDING`, and `task.createdById === requesting child's parentId`
- [x] 2.3 Implement the atomic claim with `prisma.task.updateMany({ where: { id, assignedToId: null, isUpForGrabs: true }, data: { assignedToId: child.id } })`; return 409 "already grabbed" when `count === 0`; do NOT clear `isUpForGrabs`

## 3. Server — visibility & guards

- [x] 3.1 `GET /tasks` (child): add the household-pool branch so open chores (`isUpForGrabs: true, assignedToId: null, createdById: child.parentId`) appear alongside the child's own assigned tasks
- [x] 3.2 `GET /tasks` (parent): add `createdById === parent.id` so the parent's own unclaimed open chores appear (they don't match `assignedToId in childIds`)
- [x] 3.3 `GET /tasks/calendar`: mirror the open-chore branch for BOTH roles so unassigned up-for-grabs chores still appear on their due date
- [x] 3.4 Change the approve / reject / delete / parent-edit ownership guards from the assignee dereference (`child.parentId !== req.user.id`) to `task.createdById !== req.user.id` so they tolerate a null assignee

## 4. Server — lifecycle behavior

- [x] 4.1 In the approval `$transaction`, spawn the next recurring instance with `assignedToId: task.isUpForGrabs ? null : task.assignedToId` and carry `isUpForGrabs` forward
- [x] 4.2 Confirm reject sets status back to `PENDING` while leaving `assignedToId` intact (claimed chore stays locked to the claimer, does not return to the pool)
- [x] 4.3 Confirm approval credits the chore amount to `assignedToId` (the claimer) — no change needed beyond verifying it works with an up-for-grabs claimed chore

## 5. Design tokens

- [x] 5.1 Add an "Up for grabs" badge token (`*-50` background / `*-600` text per the badge contract) to `client/tailwind.config.js`
- [x] 5.2 Document the new token in `docs/design/DESIGN.md` §1 and keep `docs/design/MilkMoney Design Specs.html` in sync in the same change

## 6. Client — parent

- [x] 6.1 Add an "Up for grabs" toggle to the parent task-create form that hides/optional-izes the child selector when enabled, and sends `isUpForGrabs: true` with no `assignedToId`
- [x] 6.2 Show the up-for-grabs badge on parent-side task views for open and grabbed chores

## 7. Client — child

- [x] 7.1 Add an "Up for Grabs" pool section to the child chores view listing open household chores, each with a "Grab" button calling `POST /tasks/:id/claim`
- [x] 7.2 On successful claim, move the chore into the child's normal list; on 409, show an "already grabbed" message and refresh the pool

## 8. Verification

- [x] 8.1 Manually verify: parent posts an open chore → both seeded children (Alex, Sam) see it → one grabs it → it vanishes from the other's pool and appears in the claimer's list → complete → approve → claimer's balance increases
- [x] 8.2 Manually verify a recurring up-for-grabs chore reopens to the pool (unassigned) after approval
- [x] 8.3 Verify the open chore appears on the calendar for the parent and both children, and only for the claimer once grabbed
