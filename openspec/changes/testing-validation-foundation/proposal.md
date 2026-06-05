## Why

The repo's only correctness gate is `npm run typecheck` — there is no test suite and no runtime input validation. Two consequences:

- **No safety net for the riskiest code.** The timezone/recurrence engine (`server/src/lib/tz.ts`, the `nextDueDate`/`backfillCatchUpOccurrences`/`ensureLiveTips`/`projectOccurrences` helpers in `server/src/routes/tasks.ts`) is intricate, DST-sensitive, and runs on every read. A refactor can silently break day math with nothing to catch it.
- **Handlers trust `req.body`.** Every route hand-parses input with ad-hoc `Number()`/`Math.round()`/presence checks and no bounds. `dollarAmount`, `unitReward`, `targetAmount`, and the manual `adjust` amount accept arbitrarily large values; `register` does no email-format check. Malformed input produces inconsistent 400s or slips through.

Separately, two server helpers are copy-pasted and one large client form exists twice, raising drift risk:

- `uniqueHouseholdCode()` is duplicated in `routes/auth.ts` and `routes/users.ts`.
- `getChildOrFail()` is duplicated in `routes/allowance.ts` and `routes/goals.ts`.
- `TaskManager.tsx` (create) and `EditTask.tsx` (edit) are ~90% the same form.

## What Changes

- **Add Vitest to the server workspace** as the test runner, wired into a repo-level `npm test`, and add the first unit tests covering `lib/tz.ts` (DST boundaries, day comparison, weekly-day stepping, month rollover, local-noon stamping) and the pure recurrence helpers (`nextDueDate`, `parseWeeklyDays`). This establishes the testing foundation; broad coverage follows in later changes.
- **Adopt zod for runtime request-body validation.** Introduce a small `validateBody(schema)` middleware that parses `req.body`, replaces it with the typed/coerced result, and returns a consistent `{ error }` 400 on failure. Apply schemas to the highest-risk endpoints: task create/update, allowance adjust, goal create/update, auth register, and child create/update. Schemas add the missing **bounds** (non-negative, sane maximums) and **format** checks (email, 4-digit PIN) without changing valid-input behavior.
- **Extract the duplicated server helpers.** Move `uniqueHouseholdCode()` into `lib/codes.ts` (which already owns `generateHouseholdCode`) and `getChildOrFail()` into a new `lib/guards.ts`; both call sites import the single copy.
- **Unify the task form.** Replace `TaskManager.tsx` and `EditTask.tsx` with one reusable `<TaskForm>` component parameterized by `create` vs `edit` mode, eliminating the duplicated `RECURRENCE_OPTIONS`/`WEEKDAYS` constants and recurrence UI.

This is a tooling + hardening + refactor change. Valid request behavior and all API contracts are unchanged; the only observable behavior difference is that previously-accepted **malformed** input is now rejected with a clear 400.

## Capabilities

### New Capabilities
- `request-validation`: Server endpoints validate request bodies against declared schemas before handling, rejecting malformed or out-of-range input with a consistent `400 { error }` response, while accepting all previously-valid input unchanged.

### Modified Capabilities
- `typescript-tooling`: The repo's correctness contract gains an automated test suite (Vitest) runnable via `npm test`, alongside the existing typecheck gate.

## Impact

- **Server deps:** add `vitest` (dev) and `zod` (runtime) to `server/package.json`; add a `test` script. Add a root `test` script delegating to the server workspace.
- **New server modules:** `server/src/lib/guards.ts` (shared `getChildOrFail`), `server/src/lib/validation.ts` (the `validateBody` middleware + a zod-error formatter), `server/src/schemas/*.ts` (per-endpoint zod schemas), and test files (e.g. `server/src/lib/tz.test.ts`, `server/src/routes/tasks.recurrence.test.ts` for the exported pure helpers).
- **Server edits:** `lib/codes.ts` gains `uniqueHouseholdCode`; `routes/auth.ts`, `routes/users.ts`, `routes/allowance.ts`, `routes/goals.ts`, `routes/tasks.ts` import the shared helpers and apply `validateBody(...)`. Some pure helpers in `routes/tasks.ts` are exported so they can be unit-tested (no behavior change).
- **Client:** new `client/src/components/TaskForm.tsx`; `pages/parent/TaskManager.tsx` and `pages/parent/EditTask.tsx` become thin wrappers (or are replaced) that render `<TaskForm>` in the appropriate mode; routing in `App.tsx` unchanged.
- **Correctness gate:** `npm run typecheck` plus the new `npm test`.
- **Specs:** new `request-validation`; modified `typescript-tooling`.
- **Non-goals:** no TanStack Query / client data-layer rewrite, no shared types package, no auth/security redesign, no linter — those are separate future changes.
