## Context

The app is Express + Prisma + SQLite (run via `tsx`, no job runner) + React/Vite. Recurring tasks are a chain of `Task` rows linked by `templateId`; each row carries its own `dueDate`, `recurrence`, `weeklyDays`, and (from the prior change) `catchUp`. Generation today:

- **Catch-up tasks:** missed occurrences are backfilled lazily on `GET /api/tasks` (`backfillCatchUpOccurrences`), windowed to `CATCHUP_WINDOW_DAYS`; approval is credit-only (the `!catchUp` guard skips the spawn).
- **Non-catch-up recurring:** a single tip; approval spawns the next instance via `nextDueDate`.

Two problems surfaced (see proposal): a fully-approved recurring chore becomes invisible/uneditable in the parent UI, and not-yet-due occurrences can be completed early.

All date logic is **server-local**: `nextDueDate` uses `base.setDate(...)`/`getDay()`; backfill uses `new Date()`/`setDate`. There is **no timezone concept anywhere**, and the household is keyed off the parent `User` (which has no tz field). The parent UI renders tasks only in status-filtered buckets (`Dashboard.tsx:59-61`) and the Edit affordance lives only inside `TaskCard` and is hidden for `APPROVED` (`TaskCard.tsx:97`).

## Goals / Non-Goals

**Goals:**
- Every recurring chore always has exactly one live `PENDING` tip, so it never disappears and is always editable.
- A child/parent cannot complete an occurrence whose due day is in the future (in the household timezone).
- Day decisions are correct across DST and independent of where the server runs or who triggers the read.
- Catch-up's past-backfill and bulk-complete behavior is preserved.

**Non-Goals:**
- No cron/background worker; generation stays request-triggered (on read).
- No migration of `dueDate` to a date-only column.
- No per-task "allow early completion" escape hatch.
- No per-child timezones (one zone per household).
- Not reworking the Dashboard's status-bucket layout — the live tip makes the existing Outstanding bucket sufficient.

## Decisions

### 1. Household timezone on the parent `User`
Add `timezone String @default("UTC")` to `User`; only the parent row is meaningful (household = parent). Resolve a child's zone via `parentId`. Migration backfills existing rows with `"UTC"` so every household has a defined zone immediately. Parent edits it in Settings; the client pre-fills the detected zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) so the common case is one tap.

*Alternatives:* single app-wide zone (wrong for multi-household), client-supplied per-request zone (non-deterministic — generation would depend on who reads), numeric UTC offset (DST-broken). Rejected.

### 2. tz-aware date helpers (the only new infra)
A small module exposing:
- `familyToday(tz): { y, m, d }` — current calendar day in the household zone.
- `dueDay(date, tz): { y, m, d }` — an occurrence's calendar day in the household zone.
- `isFutureDay(date, tz)` / day comparison — used by the completion guard.
- `stampLocalNoon(y, m, d, tz): Date` — a UTC instant that renders as noon on that calendar day in `tz`.

Implemented over `Intl.DateTimeFormat` with `timeZone`, which handles DST automatically. `nextDueDate` is reworked to step **calendar days in the household zone** (advance the local Y-M-D, then re-stamp local noon) rather than via server-local `setDate`.

### 3. Generated occurrences are stamped at household-local noon
Noon is the safe anchor: no DST transition or offset can push a noon-in-zone instant onto an adjacent calendar day when rendered in that zone. This makes `dueDay` stable and keeps `dueDate` as a `DateTime` (cheaper than a date-only schema/type migration touching calendar, sorting, and client formatters).

### 4. Always-on live tip for all recurring tasks
On `GET /api/tasks`, after catch-up backfill, ensure each recurring chain has exactly one occurrence whose due day is the next scheduled day **strictly after** `familyToday` — create it if absent. Applies to all recurring tasks (catch-up and not), unifying the model: every recurring chore = one live tip + (catch-up only) backfilled past misses. The tip is `PENDING` but not completable until its day (Decision 5).

Generation stays on read; approval remains credit-only with the `!catchUp` guard retained so the tip is never double-created. For non-catch-up tasks this replaces approve-time spawning as the source of the next instance (the read-time tip ensures it instead); approval no longer needs to spawn.

### 5. Future-completion guard (day-granular, server-enforced)
In `PUT /:id` (child marks complete) and `POST /:id/complete` (parent marks complete), reject with 400 when `dueDay(task.dueDate, tz)` is after `familyToday(tz)`. Past/today occurrences (including all catch-up backfill) stay completable, so bulk catch-up is unaffected. The client mirrors this: the tip renders an "upcoming/locked" `TaskCard` state with a disabled action ("Available <day>").

## Risks / Trade-offs

- **Timezone correctness is now user-visible and blocking** → a wrong zone means "can't complete today's chore." Mitigation: IANA + `Intl` (DST-safe), noon stamping (no boundary slip), day-granular comparison (not timestamp), and a sane `"UTC"` default until the parent sets their zone in Settings.
- **Behavioral change for existing non-catch-up recurring tasks** → they previously allowed completing the spawned future instance immediately; now blocked until its day. Intentional unification; called out as BREAKING-ish in the proposal.
- **No early completion** (e.g., trash the night before) → accepted; no per-task escape hatch this change.
- **Reworking `nextDueDate` to tz-day stepping** touches the existing weekly/selected-day logic and the calendar projection that reuses it → must keep weekly-days and monthly semantics intact; verify against the existing `task-recurrence` scenarios.
- **Write-on-read still applies** (tip creation) → reuse the catch-up transactional existence re-check keyed on `(templateId root, dueDay)` to avoid concurrent-read duplicates.

## Migration Plan

1. Prisma migration adds `User.timezone` with default `"UTC"` (additive, backward compatible).
2. Deploy via the standard Railway flow; no data backfill beyond the column default.
3. First parent visit to Settings offers the detected zone; saving updates the household.
4. Rollback: the column is additive; reverting code leaves it harmless. (Any tips already generated remain valid `PENDING` rows.)

## Open Questions

- Settings UX for the zone picker: full IANA searchable list vs. a short curated common-zones list with an "other" fallback? (Lean: searchable native list seeded with the detected zone.)
- Should a chore created today with `dueDate` = today immediately also get a tip for the next day on the same read? (Lean: yes — the invariant is "always one future tip.")
