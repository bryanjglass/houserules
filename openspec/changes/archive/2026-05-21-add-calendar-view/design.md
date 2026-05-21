## Context

Tasks carry an optional `dueDate` and an optional recurrence (`DAILY`/`WEEKLY`/`MONTHLY`, with `weeklyDays` for weekly). Today the UI only renders flat task lists. Crucially, recurring tasks are **lazily materialized**: only the next instance exists in the database, and the following one is spawned at approval time (`server/src/routes/tasks.js`, `POST /:id/approve`). So a calendar that wants to show "every Monday and Thursday" cannot simply query the DB — it must *project* future occurrences using the same recurrence math (`nextDueDate` / `parseWeeklyDays`).

`GET /api/tasks` already returns role-scoped tasks (parent → all their children with `assignedTo`; child → own). The client is plain React + React Router with no date library; routing is role-discriminated in `client/src/App.jsx`.

## Goals / Non-Goals

**Goals:**
- A month-grid calendar, reachable by both parents and children, that places tasks on their due dates.
- Show projected future occurrences of recurring tasks within the visible range, distinguishable from materialized instances.
- Reuse existing recurrence logic rather than duplicating it.
- No new runtime dependencies; no schema/migration changes.

**Non-Goals:**
- Creating, editing, completing, or approving tasks from the calendar (it is read-only; existing pages handle mutations).
- Week/day/agenda views, drag-to-reschedule, or iCal export.
- Persisting projected occurrences as real `Task` rows.

## Decisions

### Decision: Project recurring occurrences on the server via a date-range endpoint
Add `GET /api/tasks/calendar?start=&end=` that returns, for the role-scoped tasks, the materialized tasks falling in the range **plus** synthesized projected occurrences for recurring tasks across the range. Each returned item carries a flag (e.g. `projected: true`) and a `date`.

- **Why server-side:** the recurrence helpers (`nextDueDate`, `parseWeeklyDays`) already live in `server/src/routes/tasks.js`. Computing projections there keeps a single source of truth and avoids re-implementing weekly-day cycling in the client.
- **Alternative considered — client-side projection:** the client fetches raw tasks from `GET /api/tasks` and expands recurrences itself. Rejected: duplicates recurrence rules (drift risk) and the client has no shared helper.
- **Alternative considered — materialize future instances in the DB:** rejected; contradicts the lazy-spawn model, pollutes task lists/approvals, and complicates editing.

Projection walks each recurring task from its `dueDate` forward, applying the recurrence step until past `end`, emitting one synthetic occurrence per step that lands within `[start, end]`. A per-task cap (e.g. bounded iterations) guards against runaway loops. The materialized instance itself is returned normally (not projected).

### Decision: Single shared calendar page, role-aware rendering
One calendar page component lives under `client/src/pages/` and is mounted in both the `PARENT` and `CHILD` route trees in `App.jsx` (e.g. `/calendar`). It calls the new endpoint. Parent rendering adds a per-child label/color; child rendering omits it. A nav link is added in `client/src/components/NavBar.jsx`.

- **Why one component:** the only role difference is the child label and the data scope, both already handled by the endpoint's auth. Two near-identical components would duplicate the grid.

### Decision: Build the month grid with native `Date`
Compute the grid as full weeks spanning the month (leading/trailing days from adjacent months shown muted). The visible `[start, end]` window — the first grid cell through the last — is what the client passes to the endpoint, so projections fill the whole visible grid, not just the calendar month.

- **Why:** avoids adding a date library for what is straightforward month arithmetic.

## Risks / Trade-offs

- **Projection/spawn logic could diverge** → Centralize by reusing the existing `nextDueDate`/`parseWeeklyDays` helpers for projection rather than writing parallel logic; if needed, extract them into a shared module imported by both the spawn path and the calendar endpoint.
- **Unbounded recurrence expansion (e.g. daily over a far-future range)** → Cap iterations per task and only request a bounded visible window (one month grid at a time).
- **DST / timezone edges around midnight** → Use date-only comparison (year-month-day) when bucketing occurrences into calendar cells, consistent with how `dueDate` is already handled.
- **Read-only calendar may invite expectations of editing** → Out of scope here; tasks link back to existing edit/detail pages if desired later.

## Open Questions

- Should the visible projection window extend slightly beyond the month grid for smoother month-to-month navigation, or strictly match the grid? (Default: match the grid.)
- For parents with many children, is a color legend needed, or is a text label per task sufficient? (Default: text label, add color if it reads as cluttered.)
