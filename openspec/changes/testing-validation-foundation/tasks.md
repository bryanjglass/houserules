## 1. Test runner (Vitest)

- [x] 1.1 Add `vitest` as a devDependency in `server/package.json` and a `"test": "vitest run"` script (keep a `"test:watch": "vitest"` for local use)
- [x] 1.2 Add a repo-level `"test": "npm run test --workspace=server"` script in the root `package.json`
- [x] 1.3 Add a minimal `server/vitest.config.ts` if needed for ESM/TS (Node environment), otherwise rely on defaults
- [x] 1.4 Verify `npm test` runs and discovers `*.test.ts` files (a trivial placeholder test passes)

## 2. Make pure recurrence helpers testable

- [x] 2.1 Create `server/src/lib/recurrence.ts` and move `nextDueDate` + `parseWeeklyDays` there (importing only `./tz.js`); update `routes/tasks.ts` to import them from `../lib/recurrence.js` and delete the local copies (no behavior change)
- [x] 2.2 Confirm `server/src/lib/tz.ts` helpers are already exported and importable in isolation

## 3. Unit tests

- [x] 3.1 `server/src/lib/tz.test.ts`: cover `calDayInTz`/`familyToday`/`dueDay`, `compareDays`, `isFutureDay`, `dayOfWeek`, `addDays`, `addMonths`, and `stampLocalNoon` — including a DST boundary (e.g. America/Chicago spring-forward) and a UTC-vs-local day-difference case
- [x] 3.2 `server/src/lib/recurrence.test.ts`: cover `parseWeeklyDays` (dedupe, sort, range filter, junk input) and `nextDueDate` for DAILY, WEEKLY (no selected days = +7), WEEKLY (selected days), and MONTHLY, asserting the result renders on the expected local calendar day
- [x] 3.3 Run `npm test` and make all assertions pass

## 4. Validation infrastructure (zod)

- [x] 4.1 Add `zod` as a runtime dependency in `server/package.json`
- [x] 4.2 Create `server/src/lib/validation.ts` exporting `validateBody(schema)` middleware (safeParse → 400 `{ error }` on failure, assign `req.body = result.data` on success) and a `formatZodError` helper that renders the first issue as a short message
- [x] 4.3 Create `server/src/schemas/` with one module per area: task create + update, allowance adjust, goal create + update, auth register, child create + update — each schema accepting exactly today's valid shapes plus the bounds/format rules from design (money `[0,1e6]`, adjust `[-1e6,1e6]`, quantity `≥1`, email, 4-digit PIN, trimmed non-empty capped names; `weeklyDays` accepts string|string[]|number[])

## 5. Apply validation to routes

- [x] 5.1 `routes/tasks.ts`: add `validateBody(taskCreateSchema)` to `POST /` and `validateBody(taskUpdateSchema)` to `PUT /:id`; remove the now-redundant `Number()`/`Math.round()`/presence checks the schema covers, keeping the `isPerUnit` fork and `catchUp` recompute domain logic
- [x] 5.2 `routes/allowance.ts`: add `validateBody(adjustSchema)` to `POST /:childId/adjust`; drop the manual amount parsing
- [x] 5.3 `routes/goals.ts`: add `validateBody(goalCreateSchema)` to `POST /:childId` and `validateBody(goalUpdateSchema)` to `PATCH /:goalId`; drop the manual `parseTarget`/title checks the schema covers
- [x] 5.4 `routes/auth.ts`: add `validateBody(registerSchema)` to `POST /register`
- [x] 5.5 `routes/users.ts`: add `validateBody(childCreateSchema)` to `POST /children` and `validateBody(childUpdateSchema)` to `PUT /children/:id`; drop the inline PIN regex now in the schema
- [x] 5.6 Confirm the login/google/device endpoints are intentionally left as-is (out of scope) and unchanged

## 6. Extract duplicated server helpers

- [x] 6.1 Move `uniqueHouseholdCode()` into `server/src/lib/codes.ts` (alongside `generateHouseholdCode`); import it in `routes/auth.ts` and `routes/users.ts`, deleting both local copies
- [x] 6.2 Create `server/src/lib/guards.ts` exporting `getChildOrFail(childId, parentId, res)`; import it in `routes/allowance.ts` and `routes/goals.ts`, deleting both local copies
- [x] 6.3 Verify behavior is identical (same status codes, same `null` return contract)

## 7. Unify the task form (client)

- [x] 7.1 Read the relevant `docs/design/DESIGN.md` sections for the task form/inputs and cite them; do not introduce new tokens (structural extraction only)
- [x] 7.2 Create `client/src/components/TaskForm.tsx` owning the shared field state, `RECURRENCE_OPTIONS`/`WEEKDAYS` constants, recurrence/weekly-day UI, validation, and submit; props: `mode`, optional `initial` task, optional `defaultChildId`, `children`, `onSubmitted`
- [x] 7.3 Reduce `pages/parent/TaskManager.tsx` to a route component that loads children + reads `?childId=` and renders `<TaskForm mode="create" />`
- [x] 7.4 Reduce `pages/parent/EditTask.tsx` to a route component that loads the task (`GET /tasks/:id`) + children and renders `<TaskForm mode="edit" initial={task} />`, preserving the existing not-found/approved-guard handling
- [x] 7.5 Remove the duplicated constants/logic from the two pages now living in `<TaskForm>`

## 8. Verification

- [x] 8.1 Run `npm run typecheck` across both workspaces and resolve any errors
- [x] 8.2 Run `npm test` and confirm all tests pass
- [x] 8.3 Manually sanity-check (or reason through) that: valid task create/edit still works; an out-of-range `dollarAmount` now returns 400; a bad register email returns 400; a 3-digit PIN returns 400
- [x] 8.4 Confirm the client builds (`npm run build --workspace=client`) with the unified `<TaskForm>`
