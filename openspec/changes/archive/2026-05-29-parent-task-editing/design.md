## Context

`PUT /api/tasks/:id` already handles parent edits for `title`, `description`, `dollarAmount`, `dueDate`, and `assignedToId`, but the server silently ignores recurrence-related fields (`isRecurring`, `recurrence`, `weeklyDays`) in the parent branch. On the client, `TaskCard` shows a Delete button for parents but no Edit button. `TaskManager.tsx` is a create-only form with no read-or-edit path. The approve endpoint guards `status === 'COMPLETED'`, so parents cannot credit a task the child never marked done.

## Goals / Non-Goals

**Goals:**
- Parents can edit any owned, non-approved task's details — including recurrence — from the task list without delete-and-recreate.
- Parents can move an assigned non-approved task to `COMPLETED` on the child's behalf, making it immediately approve-able.
- Reuse the existing create form field set and server approve/reject flow — no new status values, no new transaction paths.

**Non-Goals:**
- Editing `unitReward` on a per-unit definition that already has pending completion instances (confusing mid-batch).
- Re-assigning a claimed up-for-grabs task to a different child.
- Editing an `APPROVED` task (the transaction record must remain authoritative).
- A combined "approve directly from PENDING" shortcut (two steps — mark done then approve — is explicit and auditable).

## Decisions

### Extend `PUT /api/tasks/:id` for recurrence fields

The parent branch of the existing endpoint currently accepts five fields. Extend it to also accept `isRecurring`, `recurrence`, and `weeklyDays`. Because `weeklyDays` is stored as a comma-separated string on the `Task` row (per existing implementation), serialize/deserialize the same way the create path does. Guard: editing is blocked when `task.status === 'APPROVED'` — return 400 to prevent post-credit mutation. *Alternative:* a new `PATCH` endpoint — rejected; the existing `PUT` already does partial updates and adding a second endpoint for the same resource is unnecessary.

### New `POST /tasks/:id/complete` endpoint (parent-only)

Rather than overloading the child mark-done path in `PUT /tasks/:id` with a parent status override, a dedicated endpoint makes the authorization and preconditions explicit:
- `requireRole('PARENT')`
- Task must exist and `createdById === req.user.id`
- Task must have an assignee (`assignedToId !== null`) — parent cannot "complete" an unclaimed up-for-grabs task with no owner to credit
- Task must not be `APPROVED` (already credited) or already `COMPLETED` (idempotent guard)
- Sets `status = 'COMPLETED'`, `completedAt = now()`

This is a pure state transition with no financial side-effect; the credit still requires the explicit `/approve` call. *Alternative:* modify `/approve` to accept `PENDING` tasks by injecting a COMPLETED flip inside the approve transaction — rejected because it conflates the parent's "I'm confirming this was done" judgment with the "did the child actually do it?" record. Keeping them as two actions preserves the audit trail.

### EditTask page, not inline editing

An inline edit mode on `TaskCard` would require the card to hold substantial form state (recurrence toggles, day pickers, assignee select), duplicating most of `TaskManager`'s local state. Instead, a separate `/parent/tasks/:id/edit` route renders a pre-populated form using the same field layout as TaskManager. `TaskCard` navigates there via the Edit button (`useNavigate`). On save, the page PUTs and navigates back. This avoids duplicating form logic while keeping the card component small. *Alternative:* a modal sheet — acceptable but adds a new modal-management concern; a full page is simpler given the field count.

### Parent "Mark Done" button placement in TaskCard

Add a "Mark Done" button in the parent actions row for tasks that are:
- `role === 'PARENT'`
- `task.assignedToId !== null` (someone to credit)
- `task.status === 'PENDING' || task.status === 'REJECTED'`
- `!task.isPerUnit` (per-unit completions have their own log flow)

It sits alongside the existing Delete button. After the call succeeds, `onUpdate()` refreshes the list and the approve/reject buttons appear automatically (because the task is now `COMPLETED`).

### Edit button visibility and lock on APPROVED

The Edit button appears for parents on all non-`APPROVED` tasks they own. For `APPROVED` tasks the card shows no Edit button (the delete button also stays, since parents can still remove an approved task if needed — that behavior is unchanged). The server also enforces the `APPROVED` lock as a 400 so a stale UI cannot mutate credited tasks.

### EditTask form field set

Mirrors the TaskManager create form:
- Title (required), Description, Dollar Amount
- Assignee selector (child dropdown), except: if the task is currently `COMPLETED` or the task is per-unit, the assignee field is read-only (do not reassign mid-completion)
- Due Date
- Recurrence toggle → recurrence type selector → weekly day picker (same as TaskManager)
- "Up for grabs" toggle (only when no assignee is set)
- Save / Cancel buttons

Per-unit fields (`isPerUnit`, `unitReward`) are displayed read-only — editing the reward rate on an existing definition is out of scope.

## Risks / Trade-offs

- **Parent marks done, child disputes it:** The audit trail records `completedAt` (server clock) with no child action. This is a household app where parents are authoritative, so this is acceptable. The existing reject action is still available if the parent changes their mind.
- **Editing a recurring task's recurrence type mid-chain:** Changing `recurrence` on an instance that already has spawned future instances is a real edge case. For v1, only the edited instance's fields are updated — the chain is not retroactively rewritten. Document this clearly in the form.
- **EditTask page is almost identical to TaskManager:** This is intentional duplication for now. If a refactor to a shared form component is desired later, that's a separate housekeeping change.
