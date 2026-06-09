# Tasks — redesign-chore-model

## 1. Schema & shared types

- [x] 1.1 Replace `Task` with `Chore` + `ChoreCompletion` in `server/prisma/schema.prisma` (kinds, day-key `startDay`, `missedPolicy`, `archivedAt`, `@@unique([choreId, occurrenceKey])`); rename `Transaction.taskId` → `completionId`; update `User` relations
- [x] 1.2 Create the migration (reset dev DB, `prisma migrate dev`) and regenerate the client
- [x] 1.3 Update string unions in `server/src/types/domain.ts` and mirror in `client/src/types/domain.ts` (`ChoreKind`, `CompletionStatus`, `MissedPolicy`, keep `Recurrence`)

## 2. Day keys & projection library

- [x] 2.1 Rework `server/src/lib/tz.ts` into day-key helpers: `todayKey(tz)`, `formatDayKey`, day-key validation, add/compare on `YYYY-MM-DD` strings; remove local-noon stamping
- [x] 2.2 Rework `server/src/lib/recurrence.ts` to walk day keys (`nextOccurrenceKey`, `firstOccurrenceKey`, `parseWeeklyDays` kept)
- [x] 2.3 Add `server/src/lib/projection.ts`: `occurrencesFor(chore, window)` plus per-kind visibility (`CURRENT_ONLY` single actionable occurrence + upcoming tip, `BACKFILL_14D` window, `OPEN` current occurrence, `PER_UNIT` always) merging existing completions

## 3. Server routes

- [x] 3.1 New zod schemas (`server/src/schemas/chore.ts`): create/update with per-kind invariants (ASSIGNED needs assignee, PER_UNIT needs positive unitReward and no recurrence, occurrence-key format)
- [x] 3.2 New `server/src/routes/chores.ts`: `GET /` (pure read: definitions + merged actionable items), `GET /calendar`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` (archive, refuse with unreviewed completions)
- [x] 3.3 Action endpoints: `POST /:id/complete` (child or parent-on-behalf; creates `COMPLETED` completion with snapshot reward; future-day guard; P2002 → 409), `POST /:id/claim` (creates `PENDING` completion; P2002 → 409), `POST /:id/log-units` (unlimited `COMPLETED` logs, snapshot = unitReward × qty)
- [x] 3.4 Completion review endpoints: `POST /api/completions/:id/approve` (conditional flip + `EARNED` transaction from snapshot, qty adjust for per-unit recomputes snapshot, no spawning), `POST /api/completions/:id/reject` (per-unit deletes, others → `PENDING`)
- [x] 3.5 Wire push notifications at the new action points (assign, complete, approve) and mount `/api/chores`, removing `/api/tasks`; update `allowance.ts`/`transactions.ts` for `completionId`

## 4. Seed & cleanup

- [x] 4.1 Rewrite `server/prisma/seed.ts` on the new model (assigned one-off + recurring with both policies, open chore, per-unit chore, some completions/transactions)
- [x] 4.2 Delete `server/src/routes/tasks.ts`, `server/src/schemas/task.ts`, and dead tz/recurrence helpers

## 5. Client

- [x] 5.1 Update `client/src/types/models.ts` (Chore, ChoreItem with `choreId`/`occurrenceKey`/`completionId`, Completion) and `client/src/api/*` to the new endpoints/query keys
- [x] 5.2 Update child pages (`client/src/pages/child/`): to-do list from items, complete by occurrence key, claim, log-units, upcoming lock state
- [x] 5.3 Update parent pages (`client/src/pages/parent/`): chore management on definitions, approval queue on completions (qty adjust), archive flow, create/edit forms with kind + missed policy
- [x] 5.4 Update calendar page to `choreId:dayKey` event ids and projected styling

## 6. Verification

- [x] 6.1 `npm run typecheck` passes in both workspaces
- [x] 6.2 `npm run db:reset` then manual smoke via API: complete/approve credits snapshot; claim race returns 409; catch-up window surfaces missed days; reads create no rows (row count stable across repeated GETs)
