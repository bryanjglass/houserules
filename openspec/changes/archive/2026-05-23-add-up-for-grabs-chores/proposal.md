## Why

Today every chore must be assigned to one specific child up front. Households often have chores that "whoever gets to it first" should do — taking out the trash, feeding the dog — and the parent doesn't care who. Forcing an assignment turns those into nagging instead of opportunity. "Up for grabs" chores let a parent post a chore to the whole household and let any child claim it, first-come-first-served.

## What Changes

- Parents can create a chore with **no assignee**, flagged as "up for grabs," visible to every child in the household.
- Any child in the household can **claim** an open chore. The first claim wins and locks the chore to that child; from then on it behaves like an ordinary assigned task (complete → parent approve → claimer earns the money).
- A claimed chore **vanishes from the other children's pool** and appears in the claimer's own task list.
- Up-for-grabs chores can be **recurring**. On approval, the next instance **reopens to the whole household** rather than re-locking to the previous winner.
- Rejecting a grabbed chore keeps it **locked to the claimer** (it does not return to the pool).
- **BREAKING (data model):** `Task.assignedToId` becomes nullable to represent an unclaimed chore.

Out of scope for v1: a child releasing/un-grabbing a claimed chore (noted as a follow-up).

## Capabilities

### New Capabilities
- `up-for-grabs-chores`: Creating unassigned household chores, the household-scoped pool children see, the first-to-claim-wins claim action and its race semantics, payout to the claimer, and reject-keeps-lock behavior.

### Modified Capabilities
- `task-recurrence`: A recurring up-for-grabs chore SHALL reopen to the pool (unassigned) when its next instance spawns on approval, rather than re-locking to the previous claimer; the `isUpForGrabs` flag SHALL be carried forward to every spawned instance.
- `task-calendar`: Unassigned up-for-grabs chores SHALL still appear on the calendar for both the parent who created them and the children of that household, despite having no assignee.

## Impact

- **Schema / DB:** `server/prisma/schema.prisma` — `Task.assignedToId` → nullable, add `Task.isUpForGrabs Boolean @default(false)`; new Prisma migration.
- **API:** `server/src/routes/tasks.js` — relax `POST /tasks` to allow no assignee when up-for-grabs; new `POST /tasks/:id/claim`; broaden `GET /tasks` and `GET /tasks/calendar` (both roles) to include unassigned household chores; revise approve/reject/delete/edit ownership guards that currently dereference the assignee; reopen-on-respawn in the approval transaction.
- **Client:** `client/src/pages/parent/` task-create form gains an "Up for grabs" toggle; `client/src/pages/child/` gains an "Up for Grabs" pool section with a Grab button and an "already grabbed" (409) state.
- **Design:** new "Up for grabs" badge token added to `client/tailwind.config.js` and documented in `docs/design/DESIGN.md` §1 (and kept in sync with the spec doc) in this same change — no improvised tokens.
