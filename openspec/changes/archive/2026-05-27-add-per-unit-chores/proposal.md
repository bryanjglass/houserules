## Why

Some chores are paid by the piece, not by the task: "$1 for every dog poop you pick up," "10¢ a page read." Today a chore pays one flat amount to one child, and even an up-for-grabs chore locks to the first claimer — so the common case where **two kids split the same open-ended job and each earns for their own share** can't be expressed. A parent would have to create and approve a separate chore per item per child, which is absurd for "they each picked up 10 today."

Per-unit chores let a parent post one open, unlimited chore priced per item. Any child can log how many they did, as many times as they like; each kid earns their own count × the rate.

## What Changes

- Parents can create a **per-unit** chore: a per-item reward (e.g. $1 each) with no assignee. It lives permanently in the household up-for-grabs pool and is **never consumed** — it is a *definition*, not a one-shot task.
- Any child in the household can **log a count** ("I did N") against the definition. Each log spawns a per-child **completion instance** (reusing the existing `Task.templateId`/`instances` self-relation) awaiting parent approval; the definition stays open for anyone to log again.
- **Multiple children earn independently.** Two kids logging 10 each produce two completions; each is credited separately.
- On **approval**, the parent may **adjust the count**, and the child is credited `unitReward × count` as a single `EARNED` transaction (one transaction per completion instance).
- **Rejecting** a logged completion **discards it** (deletes the instance); nothing is credited and the child can log again from the still-open definition.
- Per-unit and recurring are **mutually exclusive** — a per-unit chore is inherently repeatable, so it never recurs.

Out of scope for v1: capped/finite quantity pools (e.g. "20 units available" drawn down to zero); fixed-pot splitting where one total reward is divided by share of work; a child editing a logged count after submitting (they reject-and-relog instead).

## Capabilities

### New Capabilities
- `per-unit-chores`: Creating an unlimited per-item-priced chore definition, the household pool that shows it as loggable (not claimable), the log-a-count action that spawns independent per-child completions, multi-child independent earning, parent approval with an adjustable count crediting `unitReward × count`, and reject-discards-the-log behavior.

### Modified Capabilities
- `up-for-grabs-chores`: A per-unit definition rides the existing household pool (it is up-for-grabs with no assignee), but it is **logged, not claimed** — the claim action SHALL reject a per-unit chore so a stale UI cannot lock or consume the shared definition.

## Impact

- **Schema / DB:** `server/prisma/schema.prisma` — add `Task.isPerUnit Boolean @default(false)`, `Task.unitReward Int?` (per-item cents), `Task.quantity Int?` (units on a completion instance); new additive Prisma migration (`npm run db:migrate`), no backfill.
- **API:** `server/src/routes/tasks.ts` — `POST /tasks` accepts `isPerUnit`/`unitReward` (forces unassigned, up-for-grabs, non-recurring); new `POST /tasks/:id/log-units`; `POST /tasks/:id/approve` multiplies `unitReward × adjustable count` for per-unit completions; `POST /tasks/:id/reject` deletes per-unit completions; `POST /tasks/:id/claim` rejects per-unit definitions defensively.
- **Client:** `client/src/pages/parent/TaskManager.tsx` gains a "Pay per item" toggle + per-unit reward field; `client/src/components/TaskCard.tsx` shows a count input + "Log it" for pool definitions, the computed per-unit pay on completions, and an editable count on parent review; `client/src/pages/parent/Dashboard.tsx` excludes the definition from "Outstanding Chores"; `client/src/types/models.ts` `TaskView` gains the three fields. Balance stays derived (no change).
- **Design:** reuses existing toggle, input, button, badge, and money tokens (DESIGN.md §4–5); no new tokens expected. If any token is added it goes into `client/tailwind.config.js` and `docs/design/DESIGN.md` §1 in the same change.
