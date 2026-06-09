## Context

A single Prisma `Task` model currently encodes four distinct concepts through nullable-flag combinations (`isUpForGrabs` + `assignedToId` tri-state, `isPerUnit` + `quantity` two row kinds, `catchUp` "meaningful only when…", `templateId` self-chains with newest-row "representative" election). Because the next occurrence of a recurring chore must exist as a row to be visible, every `GET /api/tasks` runs three write-on-read passes (`anchorUndatedRecurring`, `backfillCatchUpOccurrences`, `ensureLiveTips`), each with transactions, day-key de-dupe sets, and concurrency re-checks. Calendar days are smuggled through `DateTime` values stamped at household-local noon, requiring constant tz conversion and day-compare helpers.

Constraints: SQLite (no partial unique indexes; `createMany.skipDuplicates` unsupported; NULLs are distinct in unique indexes), no job runner (everything happens in request handlers), no test suite (`npm run typecheck` is the only gate), no data migration required (dev/prod data may be recreated), and the client/server share mirrored hand-synced type files.

## Goals / Non-Goals

**Goals:**
- One concept per table: `Chore` definitions vs `ChoreCompletion` work records.
- Reads are pure: projection of occurrences happens in memory; rows are created only by user actions.
- Make invalid states unrepresentable where practical (explicit `kind`, completions always have a child).
- Concurrency safety via a uniqueness constraint instead of transactional re-check loops.
- Day-granular dates with exact-equality identity.
- Preserve all currently spec'd behavior (recurrence math, weekly days, claim semantics, per-unit logging, catch-up visibility, calendar) unless explicitly restated.

**Non-Goals:**
- Data migration from the `Task` table (databases are reset).
- New features (multi-parent households, occurrence-level overrides/skips, reminders/cron).
- Changing auth, allowance/transaction summing, savings goals, or push infrastructure.
- API backward compatibility — the client is updated in the same change.

## Decisions

### 1. Two tables: `Chore` + `ChoreCompletion` (not four kind-specific tables, not one)

The variance between task kinds lives almost entirely in the *definition* (who may do it, how it pays, when it recurs); the *work record* lifecycle (PENDING → COMPLETED → APPROVED, credit on approval) is uniform. Kind-specific tables would quadruplicate the lifecycle/approval/transaction wiring and complicate the merged lists the client renders. Keeping one table (status quo) is what we're escaping.

```prisma
// kind: "ASSIGNED" | "OPEN" | "PER_UNIT"
// recurrence: null (one-off) | "DAILY" | "WEEKLY" | "MONTHLY"
// missedPolicy: "CURRENT_ONLY" | "BACKFILL_14D" (replaces catchUp)
model Chore {
  id              String    @id @default(cuid())
  householdId     String    // the parent user's id (renames createdById's real role)
  kind            String
  title           String
  description     String?
  rewardCents     Int?      // flat reward (ASSIGNED / OPEN)
  unitRewardCents Int?      // PER_UNIT only
  assigneeId      String?   // ASSIGNED only
  recurrence      String?
  weeklyDays      String?   // "0,3" style, WEEKLY only
  startDay        String?   // "YYYY-MM-DD" household-local; one-off due day or schedule anchor
  missedPolicy    String    @default("CURRENT_ONLY")
  archivedAt      DateTime?
  createdAt       DateTime  @default(now())
  completions     ChoreCompletion[]
}

// status: "PENDING" | "COMPLETED" | "APPROVED"
// occurrenceKey: "YYYY-MM-DD" of the occurrence it resolves, "once" for a
//   one-off, null for per-unit logs (unlimited; SQLite treats NULLs as distinct).
model ChoreCompletion {
  id            String    @id @default(cuid())
  choreId       String
  childId       String    // always set — a completion is always someone's work
  occurrenceKey String?
  status        String    @default("PENDING")
  quantity      Int?      // PER_UNIT logs only
  rewardCents   Int?      // snapshot at creation; what approval pays (unitReward*qty for PER_UNIT)
  completedAt   DateTime?
  approvedAt    DateTime?
  createdAt     DateTime  @default(now())
  transaction   Transaction?

  @@unique([choreId, occurrenceKey])
}
```

`Transaction.taskId` becomes `completionId` (still `@unique`, optional). `User` relations `assignedTasks`/`createdTasks` become `assignedChores`/`householdChores` plus `completions`.

Kind invariants (enforced in the zod schema + route layer, documented in schema comments, mirroring the repo's existing string-union convention):
- `ASSIGNED`: `assigneeId` required, `rewardCents` optional, recurrence allowed, `missedPolicy` meaningful only when recurring.
- `OPEN`: no `assigneeId`, `rewardCents` optional, recurrence allowed, `missedPolicy` ignored (pool shows only the current occurrence).
- `PER_UNIT`: no `assigneeId`, `unitRewardCents` required > 0, never recurring.

### 2. Occurrences are projected, never materialized ahead of action

A pure function `occurrencesFor(chore, window): string[]` (day keys) walks the schedule from `startDay`. To-do lists and the calendar merge: (a) existing completion rows, (b) projected occurrences that have no completion row for their day key. A completion row is created only when:
- a child completes (or parent marks done): `ASSIGNED`, status `COMPLETED`, `occurrenceKey` = the occurrence acted on;
- a child claims an `OPEN` chore: status `PENDING`;
- a child logs units on `PER_UNIT`: status `COMPLETED`, `occurrenceKey` null.

This deletes all three read-time generation passes. Rejection flips an existing row back to `PENDING` (it stays attached to the child and suppresses re-projection of that day — preserving "rejected stays locked to claimer" for free). Alternative considered: keep materialized pending rows but generate them idempotently under the unique constraint — rejected because it keeps writes-on-read and exists only to serve hypothetical SQL queries ("what's due today") that nothing needs yet; the projection function must exist anyway for the calendar.

Visibility policy per kind when projecting for a child:
- `ASSIGNED`, recurring, `CURRENT_ONLY`: show the single earliest unresolved occurrence ≤ the next scheduled day (i.e. the next occurrence strictly after the last resolved/recorded day key, clamped so at most one actionable occurrence shows; a future occurrence may be *shown* as upcoming but cannot be completed before its day — preserving the existing tip + future-completion guard semantics).
- `ASSIGNED`, recurring, `BACKFILL_14D`: show every projected occurrence in `[today − 14d, today]` lacking a completion row, plus the upcoming tip.
- `OPEN`: pool shows the chore if its current occurrence (one-off: `"once"`; recurring: the latest scheduled day ≤ today, else the next upcoming day) has no completion row.
- `PER_UNIT`: always shown while not archived.

### 3. Claims and completions are serialized by `@@unique([choreId, occurrenceKey])`

Two children claiming the same `OPEN` occurrence, or double-completing the same `ASSIGNED` occurrence, race on inserting the same `(choreId, dayKey)`; the database admits exactly one and the loser maps Prisma `P2002` → HTTP 409. One-off chores use the sentinel key `"once"` so they participate in the same constraint. `PER_UNIT` logs use `occurrenceKey = null`, which SQLite's unique index treats as always-distinct — unlimited concurrent logs succeed by design. Approval keeps the existing conditional-update guard (`updateMany where status = COMPLETED`) against double-credit.

### 4. Days are household-local `"YYYY-MM-DD"` strings

The domain is day-granular; storing days as strings makes occurrence identity exact string equality and confines timezone logic to two boundaries: "what day is it now for this household" (`todayKey(tz)`) and schedule arithmetic (next-day computation, done on calendar days). The local-noon `DateTime` stamping, `dueDay`/`compareDays`/`stampLocalNoon` conversions, and timestamp-vs-day de-dupe disappear. `lib/recurrence.ts` is reworked to walk day keys. Trade-off: lexicographic comparison must rely on zero-padded formatting (enforced in one `formatDayKey` helper).

### 5. Reward snapshot on the completion row

`rewardCents` is copied from the definition at row creation (for `PER_UNIT`: `unitRewardCents × quantity`, recomputed if the parent adjusts the count at approval). Approval pays the snapshot. Parents edit the `Chore` freely — future occurrences pick up changes, in-flight and approved work is immutable, and the "approved tasks cannot be edited" guard plus chain-representative election disappear.

### 6. Archive instead of delete

`DELETE /api/chores/:id` sets `archivedAt` (refused while any completion is `COMPLETED`-awaiting-review, preserving the per-unit guard generalized to all kinds). Archived chores stop projecting and leave history intact. Hard delete is not exposed.

### 7. API shape

New `server/src/routes/chores.ts` mounted at `/api/chores` (old `/api/tasks` removed):
- `GET /api/chores` — role-scoped `{ chores, items }`: definitions (for parent management UI) plus the merged actionable list (completion rows + projected occurrences, each item tagged `{ choreId, occurrenceKey, completionId?, status, upcoming }`).
- `GET /api/chores/calendar?start=&end=` — events from completions + projections, ids `choreId:dayKey`.
- `POST /api/chores` (parent), `PUT /api/chores/:id` (parent edit of definition), `DELETE /api/chores/:id` (archive).
- `POST /api/chores/:id/complete` — child completes an occurrence (`{ occurrenceKey }`); parent may also call it on a child's behalf (replaces both the child `PUT` status flip and the parent mark-done endpoint).
- `POST /api/chores/:id/claim` (child, `OPEN`), `POST /api/chores/:id/log-units` (child, `PER_UNIT`).
- `POST /api/completions/:id/approve`, `POST /api/completions/:id/reject` (parent). Rejecting a `PER_UNIT` log deletes it (matching the existing spec); other rejections flip to `PENDING`.

The client api layer, React Query keys, and parent/child pages are reshaped around `Chore` + `ChoreItem` types; the mirrored `domain.ts` string unions are updated in both workspaces.

## Risks / Trade-offs

- [No SQL query answers "what's due today"] → Projection helpers are the single source of truth and already required for the calendar; if a cron/reminder feature ever needs rows, materialization can be added later behind the same unique constraint without changing the model.
- [Pending work for recurring chores has no row, so nothing "exists" until a child acts] → Acceptable: nothing in the product reads pending recurring instances except the lists/calendar, which project. Parent "mark done on behalf" creates the row exactly like child completion.
- [`occurrenceKey` strings must be canonical] → Single `formatDayKey`/`todayKey` helpers; zod validates `^\d{4}-\d{2}-\d{2}$|^once$` on input.
- [Client rows previously kept one stable `task.id`; now items are `(choreId, occurrenceKey)` until acted on] → Item keys are deterministic (`choreId:occurrenceKey`); completion id attaches after action.
- [Rewrite risk: 840-line route file + client pages in one change] → No-migration mandate plus `npm run typecheck` and `db:reset` smoke flow bound the blast radius; the spec deltas restate every behavior we must preserve.
- [SQLite NULL-distinct unique behavior is load-bearing for per-unit logs] → Documented in schema comments; if the database ever moves to Postgres this still works (NULLs are distinct there too).

## Migration Plan

No data migration. Replace the schema, generate a fresh migration (`prisma migrate dev` on a reset dev DB), rewrite `seed.ts`. For the Railway deploy, the SQLite file at `/data/prod.db` is reset (acceptable per the change premise). Rollback = revert the branch; the old migration history remains in git.

## Open Questions

- None blocking. (Deferred ideas recorded for later: occurrence-level skip/override rows; reminder/cron materialization; multi-parent households.)
