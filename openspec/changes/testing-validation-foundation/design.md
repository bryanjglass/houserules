## Context

Express + Prisma + SQLite server (run via `tsx`, ESM, NodeNext with `.js` import specifiers) and a React/Vite client. There is no test runner, no validation library, and no linter; `npm run typecheck` (`tsc --noEmit` across both workspaces) is the sole gate. Route handlers read `req.body` directly and validate by hand — e.g. `tasks.ts` casts `dollarAmount` with `Math.round(Number(...))` and never bounds it; `auth.ts` `register` checks only presence. Two helpers are duplicated verbatim (`uniqueHouseholdCode`, `getChildOrFail`), and the parent task create/edit screens (`TaskManager.tsx`, `EditTask.tsx`) are near-identical forms.

This change adds the missing foundations (tests + validation) and removes the duplication, without touching the data model, auth model, or any valid-input behavior.

## Goals / Non-Goals

**Goals:**
- A working `npm test` that runs Vitest in the server workspace, with meaningful first tests over the timezone/recurrence pure functions.
- Declarative, reusable request-body validation that rejects malformed/out-of-range input with the existing `{ error }` 400 shape, and leaves all valid input behaving exactly as today.
- One source of truth for `uniqueHouseholdCode` and `getChildOrFail`.
- One `<TaskForm>` powering both create and edit.

**Non-Goals:**
- No client test setup in this change (server only; client tests are a later change).
- No client server-state library (TanStack Query/SWR) and no `onUpdate`→refetch rework.
- No shared cross-workspace types package.
- No new endpoints, no schema/migration changes, no auth/security changes, no linter.
- Not validating every endpoint — only the highest-risk bodies listed in the proposal. Query-param and route-param validation stay as-is.

## Decisions

### 1. Vitest in the server workspace, ESM-native, no config gymnastics
Add `vitest` as a server devDependency and a `"test": "vitest run"` script (plus root `"test": "npm run test --workspace=server"`). Vitest runs TypeScript/ESM directly, matching the existing `tsx`-based, build-stepless setup, so no Babel/ts-jest config is needed. Test files live next to their subjects as `*.test.ts`.

*Alternatives:* Jest (needs ESM/ts config and transforms — friction against this repo's no-build ethos) and node:test (workable but weaker DX, no built-in watch/expect ergonomics). Rejected.

### 2. Relocate the pure recurrence helpers into `lib/recurrence.ts`
`lib/tz.ts` already exports its helpers, so it is directly testable. The recurrence helpers in `routes/tasks.ts` (`nextDueDate`, `parseWeeklyDays`) are module-private and live in a file that imports Prisma and firebase-admin at module load. Importing `tasks.ts` into a test would pull in that whole graph (and construct a `PrismaClient`). So move both pure helpers into a new dependency-free `server/src/lib/recurrence.ts` that imports only `./tz.js`; `tasks.ts` then imports them from `lib/recurrence.js`. Tests import `lib/recurrence.ts` in isolation — no Express, no Prisma. The DB-touching helpers (`backfillCatchUpOccurrences`, `ensureLiveTips`, `projectOccurrences`) stay in `tasks.ts` and are out of scope for this first test pass.

Because the server uses NodeNext `.js` import specifiers but the files are `.ts`, the Vitest config includes a tiny `resolveId` plugin that maps a relative `*.js` import to its `*.ts` sibling when present, so `recurrence.ts`'s `import './tz.js'` resolves under Vite during tests while remaining correct for `tsx`/NodeNext at runtime.

*Alternative:* export the helpers in place from `tasks.ts`. Rejected — that keeps the heavy Prisma/Firebase import graph in the test path; relocating is the minimal change that yields clean, isolated tests.

### 3. `validateBody(schema)` middleware that narrows `req.body`
A single factory:

```ts
export const validateBody =
  <T>(schema: z.ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    req.body = result.data; // coerced/defaulted, typed
    next();
  };
```

`formatZodError` collapses the first issue into a short human message (e.g. `"dollarAmount must be at most 1000000"`) so the response stays the existing `{ error: string }` shape the client already renders. Handlers then read `req.body` fields that are already coerced (numbers are numbers, defaults applied), letting us delete the local `Number()`/`Math.round()`/presence checks those schemas now cover. Where a handler has branchy domain logic (e.g. the `isPerUnit` fork in `POST /tasks`, or the recompute-`catchUp` logic in `PUT /tasks/:id`), the schema validates **structure and bounds** and the handler keeps the domain decisions.

*Alternative:* validate inline inside each handler. Rejected — that is what exists; the middleware is what makes validation declarative and consistent.

### 4. Schemas mirror current acceptance, then add bounds/format
Each schema is written to accept exactly what the endpoint accepts today, plus:
- **Bounds:** money fields (`dollarAmount`, `unitReward`, `targetAmount`) are integers in `[0 … 1_000_000]` cents (max $10,000); the manual `adjust` amount is an integer in `[-1_000_000 … 1_000_000]`. Quantities are integers `≥ 1`.
- **Formats:** `register.email` must be a valid email; child `pin` must match `^\d{4}$` (already enforced ad-hoc in `users.ts` — moved into the schema); names are non-empty, trimmed, length-capped.
- **Coercion:** `weeklyDays` accepts `string | string[] | number[]` (as the handlers do today) and the handler keeps its `parseWeeklyDays` normalization; the schema only guards the shape. Optional fields stay optional with the same defaults.

The guiding rule: **no valid request that succeeds today may fail after this change.** Bounds are set generously above any realistic value so they only catch abuse/typos.

### 5. Helper extraction is a pure move
`uniqueHouseholdCode()` moves verbatim into `lib/codes.ts` (it already depends only on `generateHouseholdCode` + `prisma`); both `auth.ts` and `users.ts` import it. `getChildOrFail()` moves verbatim into `lib/guards.ts`; `allowance.ts` and `goals.ts` import it. Signatures and behavior (including the `res.status(...).json(...)` side effect and `null` return) are unchanged, so call sites are import-only edits.

### 6. `<TaskForm>` unifies create and edit
A `TaskForm` component owns the shared field state, the `RECURRENCE_OPTIONS`/`WEEKDAYS` constants, the recurrence/weekly-day UI, validation, and submit. It takes a `mode: 'create' | 'edit'`, an optional `initial` task (edit) or `defaultChildId` (create, from the `?childId=` query param), the list of children, and an `onSubmitted` callback; internally it calls `POST /tasks` or `PUT /tasks/:id`. `TaskManager` and `EditTask` become thin route components that load the needed data (children; for edit, the task via `GET /tasks/:id`) and render `<TaskForm>`. Per `CLAUDE.md`, the form keeps using existing Tailwind tokens/`DESIGN.md` patterns — this is a structural extraction, not a restyle, so no new design tokens are introduced.

## Risks / Trade-offs

- **A too-strict schema could reject valid input** → write each schema against the current handler's accepted shape first, add only generous bounds/formats, and rely on the new tz/recurrence tests plus `typecheck` to catch regressions. Bounds chosen well above realistic values.
- **Coercing `req.body` in middleware** changes what handlers see (numbers already parsed) → delete only the now-redundant parsing in the handlers covered by a schema; leave untouched any endpoint without a schema.
- **Exporting `tasks.ts` helpers** widens the module's public surface slightly → acceptable; they are pure and the export enables testing. A later change can relocate them to `lib/recurrence.ts`.
- **`<TaskForm>` consolidation** touches two screens at once → keep the markup/classes identical to the current forms and verify both flows by typecheck + manual run; no behavioral change intended.
- **Vitest + Prisma client in the same workspace** → first tests deliberately avoid DB/Prisma (pure functions only), so no test DB or mocking harness is required yet.

## Migration Plan

Additive and non-breaking. `npm install` picks up `vitest`/`zod`; no schema migration, no env changes. Deploy is unchanged (Railway build/start untouched; `vitest` is a devDependency not needed at runtime). Rollback is reverting the branch — no data or schema impact.

## Open Questions

- Money upper bound: `1_000_000` cents ($10,000) per single chore/goal/adjustment is assumed generous enough; revisit if a household needs larger one-off adjustments. (Lean: keep; adjustments can be repeated.)
- Whether to also add a thin client unit-test setup now or defer — deferring to keep this change server-focused. (Lean: defer.)
