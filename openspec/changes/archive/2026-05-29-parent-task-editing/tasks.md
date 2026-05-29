## 1. Server — extend PUT /tasks/:id for recurrence fields

- [x] 1.1 In `server/src/routes/tasks.ts`, in the parent branch of `PUT /:id`, destructure `isRecurring`, `recurrence`, and `weeklyDays` from `req.body` alongside the existing fields
- [x] 1.2 Add an APPROVED-task guard at the top of the parent edit branch: if `task.status === 'APPROVED'` return `400 { error: 'Approved tasks cannot be edited' }`
- [x] 1.3 Merge the recurrence fields into the Prisma `update` data object — serialize `weeklyDays` as a comma-separated string the same way the task create path does (e.g. `weeklyDays?.join(',') ?? null`); allow clearing with explicit `null`/empty array

## 2. Server — POST /tasks/:id/complete

- [x] 2.1 Add `router.post('/:id/complete', requireRole('PARENT'), ...)` in `server/src/routes/tasks.ts`
- [x] 2.2 Fetch the task; 404 if missing; 403 if `task.createdById !== req.user.id`
- [x] 2.3 Validate preconditions: 400 if `task.assignedToId` is null (no assignee to credit), 400 if `task.status === 'APPROVED'`, 200/no-op if already `COMPLETED` (return current task)
- [x] 2.4 `prisma.task.update` setting `status = 'COMPLETED'`, `completedAt = new Date()`; return the updated task

## 3. Client — types

- [x] 3.1 No new fields needed on `TaskView` in `client/src/types/models.ts` — all relevant fields (`isRecurring`, `recurrence`, `weeklyDays`, `status`, `completedAt`) are already present (confirmed); also added a server `GET /api/tasks/:id` endpoint the edit form fetches

## 4. Client — TaskCard parent actions

- [x] 4.1 In `client/src/components/TaskCard.tsx`, add a `handleParentComplete` async function: `await api.post(\`/tasks/${task.id}/complete\`); onUpdate();`
- [x] 4.2 Define `parentCanMarkDone`: `role === 'PARENT' && !!task.assignedToId && (task.status === 'PENDING' || task.status === 'REJECTED') && !task.isPerUnit`
- [x] 4.3 Render a "Mark Done" button in the parent actions row when `parentCanMarkDone` — secondary brand style `bg-brand-50 text-brand font-bold`
- [x] 4.4 Add an Edit button (`useNavigate` to `/tasks/:id/edit`) for parents on non-`APPROVED` tasks; placed beside the Delete button as a text-style link button (route follows the existing `/tasks/new` convention, not `/parent/...`)

## 5. Client — EditTask page

- [x] 5.1 Create `client/src/pages/parent/EditTask.tsx`; on mount fetch `GET /api/tasks/:id` to pre-populate all form fields (title, description, dollarAmount in dollar string, dueDate as `yyyy-MM-dd`, assignedToId, isUpForGrabs, isRecurring, recurrence, weeklyDays array parsed from comma-string, isPerUnit, unitReward)
- [x] 5.2 Render the same field layout as `TaskManager`: title, description, dollar amount, assignee selector, due date, recurrence toggle + type selector + weekday picker, up-for-grabs toggle
- [x] 5.3 Make the assignee field read-only when `task.status === 'COMPLETED'` or `task.isPerUnit`; display the current assignee name as static text
- [x] 5.4 Display per-unit fields (`isPerUnit`, `unitReward`) as read-only informational text — no editing
- [x] 5.5 On submit, `PUT /api/tasks/:id` with all editable fields; on success `navigate(-1)` (back to wherever the parent came from)
- [x] 5.6 Show a validation error if title is empty; no other mandatory fields beyond title

## 6. Client — routing

- [x] 6.1 In `client/src/App.tsx`, add a route `<Route path="/tasks/:id/edit" element={<EditTask />} />` inside the parent route tree (follows the existing `/tasks/new` convention)
- [x] 6.2 Import `EditTask` in `App.tsx`

## 7. Verification

- [x] 7.1 `npm run typecheck` — both workspaces pass with no errors
- [x] 7.2 Verified at API: `GET /tasks/:id` pre-populates (title, dollarAmount, assignee), `PUT /tasks/:id` saves title + recurrence (weeklyDays serialized `1,4`). Client form/`navigate(-1)` wiring confirmed by code review
- [x] 7.3 Confirmed by code review: `parentCanEdit = role === 'PARENT' && task.status !== 'APPROVED'` gates the Edit button off approved tasks
- [x] 7.4 Verified at API: `POST /tasks/:id/complete` on PENDING → `COMPLETED` (+`completedAt`); subsequent `/approve` credited the allowance (+500¢). Card-flip/button reveal confirmed by code review
- [x] 7.5 Verified at API: `/complete` on an unclaimed up-for-grabs task returns `400`. Client `parentCanMarkDone` requires `!!task.assignedToId`, so the button is hidden (code review)
- [x] 7.6 Verified at API: `PUT /api/tasks/:id` on an APPROVED task returns `400 "Approved tasks cannot be edited"`; no mutation
