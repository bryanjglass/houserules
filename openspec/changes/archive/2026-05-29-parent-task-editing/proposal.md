## Why

Parents currently have a write-once relationship with tasks: they create them, then wait for children to act. If the task details are wrong there is no edit path — the only recourse is delete-and-recreate. Worse, there is no way for a parent to move a task forward on the child's behalf: if a child finished but forgot to mark it done, or if a parent wants to credit chores completed before the app was in use, the parent is stuck. The status machine only opens the approve action after the child taps "Mark Done."

## What Changes

- Parents can **edit** any non-archived task they own: title, description, dollar amount, due date, assignee, and recurrence settings (type, selected weekly days). The edit sheet reuses the same fields as the create form in TaskManager. Approved tasks are locked from editing to preserve the transaction record.
- Parents can **mark any assigned, non-approved task as done** regardless of current status (`PENDING` or `REJECTED`). This flips the task to `COMPLETED` with a server-side timestamp, making it immediately available in the parent's normal approve/reject flow — no separate credit is applied at this step.

Out of scope: editing a per-unit chore definition's `unitReward` after child logs have been submitted (rate changes are too confusing mid-batch); bulk edits; re-assigning an already-claimed up-for-grabs chore to a different child.

## Capabilities

### New Capabilities
- `parent-task-editing`: Editing any owned, non-approved task's title, description, dollar amount, due date, assignee, and recurrence settings; and marking any owned assigned non-approved task as done from the parent view.

### Modified Capabilities
- None — the existing task status machine (`PENDING → COMPLETED → APPROVED | PENDING`) is unchanged. Parent "mark done" is a new path into the existing `COMPLETED` state, after which the standard approve/reject flow applies.

## Impact

- **Schema / DB:** No schema changes. All edited fields already exist on `Task`.
- **API:** `server/src/routes/tasks.ts` — extend the existing `PUT /tasks/:id` to accept `isRecurring`, `recurrence`, and `weeklyDays` for parent edits (already accepted for child mark-done path but not the parent branch). Add `POST /tasks/:id/complete` (parent-only) that transitions any assigned non-approved task to `COMPLETED`.
- **Client:** `client/src/components/TaskCard.tsx` — add an Edit button (parent view, non-approved tasks) that navigates to a new `EditTask` page. `client/src/pages/parent/EditTask.tsx` — new page, pre-populated form reusing TaskManager's field set, POSTs `PUT /tasks/:id`. `client/src/pages/parent/TaskManager.tsx` — no changes needed (create stays separate). `client/src/App.tsx` — register the new route. Add a parent "Mark Done" button in `TaskCard` for assigned, non-approved, non-per-unit tasks.
- **Design:** Reuses existing form tokens and button styles (DESIGN.md §4–5). No new tokens needed.
