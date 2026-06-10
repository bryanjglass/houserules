## 1. Week state and data range

- [x] 1.1 In `client/src/pages/Calendar.tsx`, replace the month-anchored `viewDate` with a Sunday-anchored week state (`date - date.getDay()`); prev/next step ±7 days, "Today" resets to the current week's Sunday
- [x] 1.2 Derive `startDay`/`endDay` as the week's Sunday and Saturday day keys and pass them to the existing `useCalendar(startDay, endDay)` query; confirm per-week caching works with the existing query keys (no changes expected in `client/src/api/keys.ts`/`queries.ts`)

## 2. Weekly layout

- [x] 2.1 Replace the 42-cell month grid with a vertical agenda: seven day sections (Sun–Sat), each with a day header (weekday name + date, today highlighted with the `brand` disc treatment) and a full-width event list
- [x] 2.2 Render event chips with the existing anatomy (status dot, title, child name for parents, bold `money-600` reward, dashed projected style) at the standard small-text scale instead of `text-[10px]`; render empty days as a slim muted "no tasks" row
- [x] 2.3 Update the header to show the week range ("Jun 7 – 13, 2026", spanning months as "Jun 28 – Jul 4, 2026" and years across New Year); update nav button aria-labels to "Previous week"/"Next week"; keep the Scheduled/Upcoming legend

## 3. Verify

- [x] 3.1 Run `npm run typecheck`
- [ ] 3.2 Manually verify against the delta spec scenarios: opens on current week with today highlighted; prev/next/today navigation updates events; recurring projections appear on correct days within the week; parent vs child scoping unchanged; week ranges spanning month and year boundaries render correctly
