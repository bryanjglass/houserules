## 1. Server — extend PUT /tasks/:id for recurrence fields

- [ ] 1.1 In `server/src/routes/tasks.ts`, in the parent branch of `PUT /:id`, destructure `isRecurring`, `recurrence`, and `weeklyDays` from `req.body` alongside the existing fields
- [ ] 1.2 Add an APPROVED-task guard at the top of the parent edit branch: if `task.status === 'APPROVED'` return `400 { error: 'Approved tasks cannot be edited' }`
- [ ] 1.3 Merge the recurrence fields into the Prisma `update` data object — serialize `weeklyDays` as a comma-separated string the same way the task create path does (e.g. `weeklyDays?.join(',') ?? null`); allow clearing with explicit `null`/empty array

## 2. Server — POST /tasks/:id/complete

- [ ] 2.1 Add `router.post('/:id/complete', requireRole('PARENT'), ...)` in `server/src/routes/tasks.ts`
- [ ] 2.2 Fetch the task; 404 if missing; 403 if `task.createdById !== req.user.id`
- [ ] 2.3 Validate preconditions: 400 if `task.assignedToId` is null (no assignee to credit), 400 if `task.status === 'APPROVED'`, 200/no-op if already `COMPLETED` (return current task)
- [ ] 2.4 `prisma.task.update` setting `status = 'COMPLETED'`, `completedAt = new Date()`; return the updated task

## 3. Client — types

- [ ] 3.1 No new fields needed on `TaskView` in `client/src/types/models.ts` — all relevant fields (`isRecurring`, `recurrence`, `weeklyDays`, `status`, `completedAt`) are already present or can be added if missing; confirm and add any absent ones

## 4. Client — TaskCard parent actions

- [ ] 4.1 In `client/src/components/TaskCard.tsx`, add a `handleComplete` async function: `await api.post(\`/tasks/${task.id}/complete\`); onUpdate();`
- [ ] 4.2 Define `parentCanMarkDone`: `role === 'PARENT' && !!task.assignedToId && (task.status === 'PENDING' || task.status === 'REJECTED') && !task.isPerUnit`
- [ ] 4.3 Render a "Mark Done" button in the parent actions row when `parentCanMarkDone` — use the same secondary button style as Reject (`bg-rose-50 text-rose-600` is wrong; use `bg-brand-50 text-brand font-bold` or a neutral style — check DESIGN.md §5 for secondary action treatment)
- [ ] 4.4 Add an Edit button (`useNavigate` to `/parent/tasks/:id/edit`) for parents on non-`APPROVED` tasks; place it beside the Delete button as a text-style link button (same visual weight as Delete)

## 5. Client — EditTask page

- [ ] 5.1 Create `client/src/pages/parent/EditTask.tsx`; on mount fetch `GET /api/tasks/:id` to pre-populate all form fields (title, description, dollarAmount in dollar string, dueDate as `yyyy-MM-dd`, assignedToId, isUpForGrabs, isRecurring, recurrence, weeklyDays array parsed from comma-string, isPerUnit, unitReward)
- [ ] 5.2 Render the same field layout as `TaskManager`: title, description, dollar amount, assignee selector, due date, recurrence toggle + type selector + weekday picker, up-for-grabs toggle
- [ ] 5.3 Make the assignee field read-only when `task.status === 'COMPLETED'` or `task.isPerUnit`; display the current assignee name as static text
- [ ] 5.4 Display per-unit fields (`isPerUnit`, `unitReward`) as read-only informational text — no editing
- [ ] 5.5 On submit, `PUT /api/tasks/:id` with all editable fields; on success `navigate(-1)` (back to wherever the parent came from)
- [ ] 5.6 Show a validation error if title is empty; no other mandatory fields beyond title

## 6. Client — routing

- [ ] 6.1 In `client/src/App.tsx`, add a route `<Route path="/parent/tasks/:id/edit" element={<EditTask />} />` inside the parent route tree (wrapped in `requireAuth` / parent role guard matching the existing parent routes pattern)
- [ ] 6.2 Import `EditTask` in `App.tsx`

## 7. Verification

- [ ] 7.1 `npm run typecheck` — both workspaces pass with no errors
- [ ] 7.2 Manual: parent opens a PENDING task card → clicks Edit → form loads pre-populated → changes title and dollar amount → saves → card reflects updated values; recurrence fields are also editable and saved correctly
- [ ] 7.3 Manual: parent clicks Edit on an APPROVED task — Edit button does not appear on approved tasks (confirmed by checking the card)
- [ ] 7.4 Manual: parent clicks "Mark Done" on a PENDING task → card flips to "Waiting" (COMPLETED) → Approve/Reject buttons appear; parent approves → allowance is credited correctly
- [ ] 7.5 Manual: parent tries "Mark Done" on an unclaimed up-for-grabs task (no assignee) — the button does not appear (client guard) and the server returns 400 if called directly
- [ ] 7.6 Manual: `PUT /api/tasks/:id` on an APPROVED task returns 400; no mutation occurs
