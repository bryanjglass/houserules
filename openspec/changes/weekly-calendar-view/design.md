## Context

`client/src/pages/Calendar.tsx` renders a 42-cell (6×7) month grid shared by both roles. It computes the visible range as day keys, fetches events via `useCalendar(startDay, endDay)` (React Query, keyed by the range — `client/src/api/queries.ts` / `keys.ts`), groups them by `ev.date`, and renders each day cell with status-dotted event chips. The server endpoint `GET /api/chores/calendar?start=&end=` is range-agnostic, so the whole change is client-side. Per DESIGN.md, all styling must use existing Tailwind tokens; the Screen 6 wallet mini-calendar is a separate month component and is untouched.

## Goals / Non-Goals

**Goals:**
- Show one Sunday–Saturday week at a time with previous/next/today navigation.
- Give each day enough horizontal room that event chips (title, child name, reward) stop truncating on phone widths.
- Keep role scoping, projection, and the projected-vs-materialized visual language exactly as they are.

**Non-Goals:**
- No month/week toggle — the month view is removed outright.
- No server or projection-logic changes.
- No changes to the kid wallet mini-calendar (DESIGN.md §5 Screen 6).
- No day-detail or event-tap interactions beyond what exists today (title tooltip).

## Decisions

**Vertical day-row agenda, not a 7-column grid.** A week shown as 7 columns has the same narrow-cell problem the month grid has. Instead render the week as a vertical list of seven day sections (date header + event cards), which is the conventional mobile weekly pattern and lets event chips use the full content width. Empty days render a slim row (day header + muted "no tasks" state) so the week's shape stays scannable. Alternative considered: 7-column grid with taller cells — rejected because it keeps cells at ~1/7 viewport width and solves nothing.

**Week starts Sunday.** Matches the existing `WEEKDAYS` array, the month grid's leading-day math, and the server's weekly recurrence day indexing. No locale configurability.

**Week is derived, not stored.** Keep a single `viewDate` state anchored to the week's Sunday (`date - date.getDay()`); prev/next add ±7 days, "Today" resets to the current week's Sunday. `startDay`/`endDay` become Sunday/Saturday day keys, so the existing `useCalendar` query keying caches per-week with zero changes to `queries.ts`/`keys.ts`.

**Header shows the week range.** Format as "Jun 7 – 13, 2026", spelling out both months when the week spans a month boundary ("Jun 28 – Jul 4, 2026") and both years across New Year. Reuse the existing nav button styling (`‹` / `Today` / `›`) with aria-labels updated to "Previous week"/"Next week".

**Event chips keep their current anatomy.** Status dot + title, child name for parents, bold `money-600` reward, dashed `border-ink-300 bg-appbg` for projected — per DESIGN.md §1 tokens and the existing legend, which stays. Font sizes may step up from `text-[10px]` to the standard small-text scale since width is no longer scarce.

## Risks / Trade-offs

- [Less at-a-glance range] A week shows ~1/4 the horizon of the month view; users planning further ahead must page. → Mitigated by cheap per-week queries (smaller payloads) and instant cached back/forward navigation.
- [Spec drift] The archived `task-calendar` spec purpose line says "month calendar". → The delta rewrites the navigation requirement; update the Purpose wording when the change is archived.
- [Date math edge cases] Month/year boundaries in the header and `getDay()` anchoring around DST. → All math stays in local-time `Date` construction exactly as the month grid does today (`new Date(y, m, d ± n)`), which is DST-safe for day arithmetic.

## Open Questions

None.
